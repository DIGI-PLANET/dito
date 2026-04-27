-- ============================================================================
-- DITO Schema v3 — FRESH INSTALL
--   Drops everything and rebuilds with:
--     * 6-stage ember (dormant → eternal)
--     * Immutable diary_entries (journal rows, permanence-gated)
--     * Timecapsule columns (unlocks_at) + backward surfacing function
--   Used by the Rust Gateway via PostgREST (SUPABASE_SERVICE_KEY).
-- ============================================================================

-- ─────────────────────────────
-- 0. Drop everything
-- ─────────────────────────────
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS diary CASCADE;
DROP TABLE IF EXISTS diary_entries CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS discovery_sessions CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS souls CASCADE;
DROP TABLE IF EXISTS used_payment_txs CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS embers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

DROP VIEW IF EXISTS profiles_compat CASCADE;

DROP FUNCTION IF EXISTS match_diary_entries CASCADE;
DROP FUNCTION IF EXISTS match_chat_messages CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_sessions CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_sessions CASCADE;
DROP FUNCTION IF EXISTS enforce_entry_immutability CASCADE;
DROP FUNCTION IF EXISTS timecapsule_backward CASCADE;

-- Extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 1. USERS
-- ============================================================================

CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,

  display_name VARCHAR(100),
  avatar_url TEXT,
  language VARCHAR(10) DEFAULT 'en',
  links JSONB DEFAULT '[]',

  current_talent VARCHAR(200),
  talent_category VARCHAR(50)
    CHECK (talent_category IN ('Creative','Physical','Intellectual','Social','Technical','Hybrid')),
  discovery_complete BOOLEAN DEFAULT FALSE,

  interests TEXT[] DEFAULT '{}',
  ember_stage VARCHAR(50) DEFAULT 'dormant'
    CHECK (ember_stage IN ('dormant','sparked','burning','blazing','radiant','eternal')),

  internal_wallet_pubkey VARCHAR(44),
  internal_wallet_encrypted TEXT,
  external_wallet_address VARCHAR(44),

  otp_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(32),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin','super_admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. SESSIONS
-- ============================================================================

CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  device_id TEXT,
  user_agent TEXT,
  ip_address TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. EMBERS  (SBT record — "potential flame"; one active per user)
-- ============================================================================

CREATE TABLE embers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email TEXT,                                     -- legacy key, pre-user rows

  ember_name VARCHAR(40) NOT NULL,
  talent TEXT NOT NULL,
  talent_category VARCHAR(50)
    CHECK (talent_category IN ('Creative','Physical','Intellectual','Social','Technical','Hybrid')),

  -- Structured onboarding answers + free-form messages
  discovery_conversation JSONB NOT NULL DEFAULT '[]',

  ember_stage VARCHAR(50) NOT NULL DEFAULT 'dormant'
    CHECK (ember_stage IN ('dormant','sparked','burning','blazing','radiant','eternal')),

  discovery_turns INTEGER DEFAULT 0,

  -- Seal / extinguish marker
  abandoned_at TIMESTAMPTZ,

  lang VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- One active ember per user at a time
CREATE UNIQUE INDEX idx_embers_active_user
  ON embers (user_id)
  WHERE user_id IS NOT NULL AND abandoned_at IS NULL;

-- ============================================================================
-- 4. DIARY_ENTRIES  (journal + chat — role + committed_at separates them)
--   * committed_at IS NOT NULL  → immutable journal row, counted as a "kept day"
--   * committed_at IS NULL      → chat-style message (user ↔ assistant), mutable
-- ============================================================================

CREATE TABLE diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email TEXT,                                     -- legacy key, pre-user rows
  ember_id UUID REFERENCES embers(id) ON DELETE CASCADE,

  date DATE NOT NULL DEFAULT CURRENT_DATE,

  role TEXT NOT NULL DEFAULT 'user'
    CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  mood VARCHAR(50),

  state VARCHAR(16)
    CHECK (state IN ('dormant','sparked','burning','blazing','radiant','eternal')),

  committed_at TIMESTAMPTZ,                       -- once set → immutable
  unlocks_at DATE,                                -- forward timecapsule

  image TEXT,
  embedding vector(768),

  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. SOULS  (SBT mint record)
-- ============================================================================

CREATE TABLE souls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email TEXT,
  wallet_address TEXT,

  talent_label TEXT NOT NULL,
  traits TEXT[] DEFAULT '{}',
  description TEXT,

  stage TEXT NOT NULL DEFAULT 'dormant'
    CHECK (stage IN ('dormant','sparked','burning','blazing','radiant','eternal')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','minted')),

  mint_tx TEXT,
  mint_address TEXT,
  on_chain BOOLEAN DEFAULT FALSE,
  proof_hash TEXT,

  entries_count INT DEFAULT 0,
  -- NOTE: `streak` column intentionally omitted. Product uses "days kept" =
  -- COUNT(diary_entries WHERE committed_at IS NOT NULL) — not consecutive.
  last_activity TIMESTAMPTZ DEFAULT NOW(),

  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. NOTIFICATIONS + PAYMENT + AUDIT (unchanged from v2)
-- ============================================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('info','warning','success','error','announcement','system')),
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE used_payment_txs (
  tx_signature TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  amount_lamports BIGINT,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create','update','delete','restore')),
  old_data JSONB,
  new_data JSONB,
  performed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. INDEXES
-- ============================================================================

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_wallet ON users (internal_wallet_pubkey) WHERE internal_wallet_pubkey IS NOT NULL;
CREATE INDEX idx_users_deleted ON users (deleted_at) WHERE deleted_at IS NOT NULL;

CREATE INDEX idx_sessions_user ON sessions (user_id, is_active);
CREATE INDEX idx_sessions_token ON sessions (session_token);
CREATE INDEX idx_sessions_device ON sessions (device_id) WHERE device_id IS NOT NULL;
CREATE INDEX idx_sessions_expires ON sessions (expires_at);

CREATE INDEX idx_embers_user ON embers (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_embers_email ON embers (email) WHERE email IS NOT NULL;

CREATE INDEX idx_diary_user_date ON diary_entries (user_id, date);
CREATE INDEX idx_diary_email_date ON diary_entries (email, date) WHERE user_id IS NULL;
CREATE INDEX idx_diary_user_created ON diary_entries (user_id, created_at DESC);
CREATE INDEX idx_diary_deleted ON diary_entries (deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_diary_embedding ON diary_entries USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_diary_ember ON diary_entries (ember_id, date DESC)
  WHERE ember_id IS NOT NULL AND committed_at IS NOT NULL;
CREATE INDEX idx_diary_unlocks ON diary_entries (unlocks_at)
  WHERE unlocks_at IS NOT NULL AND committed_at IS NOT NULL;

-- One committed entry per (user, ember, local date)
CREATE UNIQUE INDEX idx_diary_one_per_day
  ON diary_entries (user_id, ember_id, date)
  WHERE committed_at IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX idx_souls_user ON souls (user_id);
CREATE INDEX idx_souls_status ON souls (status);
CREATE INDEX idx_souls_deleted ON souls (deleted_at) WHERE deleted_at IS NOT NULL;

CREATE INDEX idx_notifications_user ON notifications (user_id, read, created_at DESC);

CREATE INDEX idx_payment_txs_wallet ON used_payment_txs (wallet_address);

CREATE INDEX idx_audit_table_record ON audit_log (table_name, record_id);
CREATE INDEX idx_audit_created ON audit_log (created_at DESC);

-- ============================================================================
-- 8. FUNCTIONS + TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_embers_updated_at
  BEFORE UPDATE ON embers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Immutability: committed journal rows cannot be modified or deleted.
-- `unlocks_at` is the only column allowed to change after commit (timecapsule).
CREATE OR REPLACE FUNCTION enforce_entry_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.committed_at IS NOT NULL THEN
      RAISE EXCEPTION 'committed entries are immutable: cannot delete entry %', OLD.id
        USING ERRCODE = 'check_violation';
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.committed_at IS NOT NULL THEN
    IF NEW.content   IS DISTINCT FROM OLD.content
    OR NEW.state     IS DISTINCT FROM OLD.state
    OR NEW.committed_at IS DISTINCT FROM OLD.committed_at
    OR NEW.ember_id  IS DISTINCT FROM OLD.ember_id
    OR NEW.user_id   IS DISTINCT FROM OLD.user_id
    OR NEW.date      IS DISTINCT FROM OLD.date
    OR NEW.mood      IS DISTINCT FROM OLD.mood
    OR NEW.role      IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'committed entries are immutable: cannot modify %', OLD.id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_diary_immutability
  BEFORE UPDATE OR DELETE ON diary_entries
  FOR EACH ROW EXECUTE FUNCTION enforce_entry_immutability();

-- Backward timecapsule surfacing: "N days ago today"
CREATE OR REPLACE FUNCTION timecapsule_backward(
  match_user_id UUID,
  days_ago INT DEFAULT 180
)
RETURNS TABLE (
  id UUID,
  ember_id UUID,
  date DATE,
  content TEXT,
  state VARCHAR,
  committed_at TIMESTAMPTZ
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT de.id, de.ember_id, de.date, de.content, de.state, de.committed_at
  FROM diary_entries de
  WHERE de.user_id = match_user_id
    AND de.committed_at IS NOT NULL
    AND de.deleted_at IS NULL
    AND de.date = (CURRENT_DATE - (days_ago || ' days')::interval)::date
    AND (de.unlocks_at IS NULL OR de.unlocks_at <= CURRENT_DATE)
  ORDER BY de.committed_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  UPDATE sessions SET is_active = FALSE WHERE expires_at < NOW();
  DELETE FROM sessions WHERE is_active = FALSE AND last_active < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION match_diary_entries(
  query_embedding vector(768),
  match_user_id UUID,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (id UUID, date DATE, role TEXT, content TEXT, similarity FLOAT)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT de.id, de.date, de.role, de.content,
    1 - (de.embedding <=> query_embedding) AS similarity
  FROM diary_entries de
  WHERE de.user_id = match_user_id
    AND de.embedding IS NOT NULL
    AND de.deleted_at IS NULL
    AND de.committed_at IS NOT NULL
    AND 1 - (de.embedding <=> query_embedding) > match_threshold
  ORDER BY de.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================================
-- 9. RLS
--   Service role: full access (Gateway uses this)
--   Anon: denied everywhere
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE souls ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE embers ENABLE ROW LEVEL SECURITY;
ALTER TABLE used_payment_txs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','sessions','diary_entries','souls','embers','notifications','used_payment_txs','audit_log']
  LOOP
    EXECUTE format('CREATE POLICY "service_role_all" ON %I FOR ALL USING (true) WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "deny_anon" ON %I FOR ALL TO anon USING (false) WITH CHECK (false)', t);
  END LOOP;
END;
$$;
