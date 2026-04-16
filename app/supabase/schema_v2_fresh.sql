-- ============================================================================
-- DITO Schema v2 - Fresh Install
-- 기존 테이블 전부 삭제 후 새로 생성
-- dito-guru + dito-admin 공용 (동일 Supabase DB)
-- ============================================================================

-- ============================================================================
-- 0. 전부 날리기
-- ============================================================================

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

  -- 프로필
  display_name VARCHAR(100),
  avatar_url TEXT,
  language VARCHAR(10) DEFAULT 'en',
  links JSONB DEFAULT '[]',

  -- 재능/디스커버리
  current_talent VARCHAR(200),
  talent_category VARCHAR(50) CHECK (talent_category IN ('Creative', 'Physical', 'Intellectual', 'Social', 'Technical', 'Hybrid')),
  discovery_complete BOOLEAN DEFAULT FALSE,

  -- 성장
  interests TEXT[] DEFAULT '{}',
  ember_stage VARCHAR(50) DEFAULT 'sparked' CHECK (ember_stage IN ('sparked', 'burning', 'blazing', 'radiant', 'eternal')),

  -- 지갑 (Solana)
  internal_wallet_pubkey VARCHAR(44),
  internal_wallet_encrypted TEXT,
  external_wallet_address VARCHAR(44),

  -- 보안
  otp_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(32),

  -- 메타
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
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT now()
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
-- 3. DIARY
-- ============================================================================

CREATE TABLE diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  mood VARCHAR(50),
  image TEXT,
  embedding vector(768),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 4. SOULS
-- ============================================================================

CREATE TABLE souls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  talent_label TEXT NOT NULL,
  traits TEXT[] DEFAULT '{}',
  description TEXT,
  stage TEXT NOT NULL DEFAULT 'sparked' CHECK (stage IN ('sparked', 'burning', 'blazing', 'radiant', 'eternal')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'minted')),
  mint_tx TEXT,
  mint_address TEXT,
  on_chain BOOLEAN DEFAULT FALSE,
  proof_hash TEXT,
  entries_count INT DEFAULT 0,
  streak INT DEFAULT 0,
  last_activity TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 4b. EMBERS
-- ============================================================================

CREATE TABLE embers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Ember 정보
  ember_name VARCHAR(16) NOT NULL,
  talent TEXT NOT NULL,
  talent_category VARCHAR(50) CHECK (talent_category IN ('Creative', 'Physical', 'Intellectual', 'Social', 'Technical', 'Hybrid')),

  -- 대화 기록 (JSONB: [{role, content}])
  discovery_conversation JSONB NOT NULL DEFAULT '[]',

  -- 앰버 성장 단계
  ember_stage VARCHAR(50) NOT NULL DEFAULT 'sparked'
    CHECK (ember_stage IN ('sparked', 'burning', 'blazing', 'radiant', 'eternal')),

  -- 탐색 지표
  discovery_turns INTEGER DEFAULT 0,

  -- soft delete (포기)
  abandoned_at TIMESTAMPTZ,

  -- 메타
  lang VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1인 1활성 Ember 보장
CREATE UNIQUE INDEX idx_embers_active_user ON embers (user_id) WHERE abandoned_at IS NULL;

-- ============================================================================
-- 5. NOTIFICATIONS
-- ============================================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error', 'announcement', 'system')),
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 6. PAYMENT & AUDIT
-- ============================================================================

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
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'restore')),
  old_data JSONB,
  new_data JSONB,
  performed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 7. INDEXES
-- ============================================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_wallet ON users(internal_wallet_pubkey) WHERE internal_wallet_pubkey IS NOT NULL;
CREATE INDEX idx_users_deleted ON users(deleted_at) WHERE deleted_at IS NOT NULL;

CREATE INDEX idx_sessions_user ON sessions(user_id, is_active);
CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_sessions_device ON sessions(device_id) WHERE device_id IS NOT NULL;
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

CREATE INDEX idx_diary_user_date ON diary_entries(user_id, date);
CREATE INDEX idx_diary_user_created ON diary_entries(user_id, created_at DESC);
CREATE INDEX idx_diary_deleted ON diary_entries(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_diary_embedding ON diary_entries USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_souls_user ON souls(user_id);
CREATE INDEX idx_souls_status ON souls(status);
CREATE INDEX idx_souls_deleted ON souls(deleted_at) WHERE deleted_at IS NOT NULL;

CREATE INDEX idx_embers_user ON embers(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_embers_claim_token ON embers(claim_token) WHERE claim_token IS NOT NULL;

CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at DESC);

CREATE INDEX idx_payment_txs_wallet ON used_payment_txs(wallet_address);

CREATE INDEX idx_audit_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);

-- ============================================================================
-- 8. FUNCTIONS
-- ============================================================================

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
    AND 1 - (de.embedding <=> query_embedding) > match_threshold
  ORDER BY de.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

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

CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  UPDATE sessions SET is_active = FALSE WHERE expires_at < NOW();
  DELETE FROM sessions WHERE is_active = FALSE AND last_active < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. RLS
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

-- Service role: 전체 접근
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','sessions','diary_entries','souls','embers','notifications','used_payment_txs','audit_log']
  LOOP
    EXECUTE format('CREATE POLICY "service_role_all" ON %I FOR ALL USING (true) WITH CHECK (true)', t);
  END LOOP;
END;
$$;

-- Anon: 전면 차단
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','sessions','diary_entries','souls','embers','notifications','used_payment_txs','audit_log']
  LOOP
    EXECUTE format('CREATE POLICY "deny_anon" ON %I FOR ALL TO anon USING (false) WITH CHECK (false)', t);
  END LOOP;
END;
$$;
