-- ============================================================================
-- DITO Schema v2 - Clean Consolidated Schema
-- dito-guru + dito-admin 공용 (동일 Supabase DB)
-- 2026-02-24
-- ============================================================================
--
-- 변경 요약:
--   - profiles 제거 → users 테이블로 통합 (이메일 인증 중심)
--   - diary + diary_entries 통합 → diary_entries 재설계
--   - sessions + user_sessions 통합 → sessions 단일 테이블
--   - 모든 FK가 users(id) 참조
--   - profile_id 컬럼 제거 (user_id로 통일)
--
-- 테이블 목록:
--   1. users              - 유저 (이메일 인증 메인)
--   2. admin_users         - 어드민 대시보드 유저
--   3. sessions            - 세션 관리 (통합)
--   4. diary_entries       - 다이어리 + 채팅 (재설계)
--   5. souls               - Soul/SBT 레코드
--   6. notifications       - 알림
--   7. used_payment_txs    - 민팅 결제 중복 방지
--   8. audit_log           - 감사 로그
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 1. USERS
-- ============================================================================

-- 메인 유저 테이블 (이메일/패스워드 인증)
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- 인증
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

  -- 성장 트래킹
  interests TEXT[] DEFAULT '{}',
  ember_stage VARCHAR(50) DEFAULT 'sparked' CHECK (ember_stage IN ('sparked', 'burning', 'blazing', 'radiant', 'eternal')),

  -- 지갑 (Solana)
  internal_wallet_pubkey VARCHAR(44),      -- 내부 생성 지갑 (민팅용)
  internal_wallet_encrypted TEXT,          -- 암호화된 private key
  external_wallet_address VARCHAR(44),     -- 외부 연결 지갑 (출금용)

  -- 보안
  otp_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(32),

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- 어드민 유저 (dito-admin 대시보드 로그인용)
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

-- 통합 세션 테이블 (토큰 기반 + 디바이스 추적)
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
-- 3. DIARY (재설계)
-- ============================================================================

-- 다이어리 + AI 채팅 통합 테이블
-- role='user' → 사용자 작성, role='assistant' → AI 응답
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

-- Soul/SBT 레코드
CREATE TABLE souls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  talent_label TEXT NOT NULL,
  traits TEXT[] DEFAULT '{}',
  description TEXT,
  stage TEXT NOT NULL DEFAULT 'sparked' CHECK (stage IN ('sparked', 'burning', 'blazing', 'radiant', 'eternal')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'minted')),

  -- Solana 온체인 데이터
  mint_tx TEXT,
  mint_address TEXT,
  on_chain BOOLEAN DEFAULT FALSE,
  proof_hash TEXT,

  -- 활동 통계
  entries_count INT DEFAULT 0,
  streak INT DEFAULT 0,
  last_activity TIMESTAMPTZ DEFAULT now(),

  -- 메타데이터
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

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

-- 민팅 결제 트랜잭션 중복 방지
CREATE TABLE used_payment_txs (
  tx_signature TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  amount_lamports BIGINT,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- 감사 로그
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

-- users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_wallet ON users(internal_wallet_pubkey) WHERE internal_wallet_pubkey IS NOT NULL;
CREATE INDEX idx_users_deleted ON users(deleted_at) WHERE deleted_at IS NOT NULL;

-- sessions
CREATE INDEX idx_sessions_user ON sessions(user_id, is_active);
CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_sessions_device ON sessions(device_id) WHERE device_id IS NOT NULL;
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_sessions_last_active ON sessions(last_active);

-- diary_entries
CREATE INDEX idx_diary_user_date ON diary_entries(user_id, date);
CREATE INDEX idx_diary_user_created ON diary_entries(user_id, created_at DESC);
CREATE INDEX idx_diary_deleted ON diary_entries(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_diary_embedding ON diary_entries USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);

-- souls
CREATE INDEX idx_souls_user ON souls(user_id);
CREATE INDEX idx_souls_status ON souls(status);
CREATE INDEX idx_souls_deleted ON souls(deleted_at) WHERE deleted_at IS NOT NULL;

-- notifications
CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at DESC);

-- used_payment_txs
CREATE INDEX idx_payment_txs_wallet ON used_payment_txs(wallet_address);

-- audit_log
CREATE INDEX idx_audit_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);

-- ============================================================================
-- 8. FUNCTIONS
-- ============================================================================

-- 벡터 유사도 검색 (다이어리)
CREATE OR REPLACE FUNCTION match_diary_entries(
  query_embedding vector(768),
  match_user_id UUID,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  date DATE,
  role TEXT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.id, de.date, de.role, de.content,
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

-- updated_at 자동 갱신
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

-- 비활성 세션 정리 (30일 이상)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  UPDATE sessions SET is_active = FALSE WHERE expires_at < NOW();
  DELETE FROM sessions WHERE is_active = FALSE AND last_active < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE souls ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE used_payment_txs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Service role: 전체 접근 (서버사이드 API용)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['users', 'sessions', 'diary_entries', 'souls', 'notifications', 'audit_log']
  LOOP
    EXECUTE format('CREATE POLICY "service_role_all" ON %I FOR ALL USING (true) WITH CHECK (true)', tbl);
  END LOOP;
END;
$$;

-- Anon: 전면 차단
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['users', 'sessions', 'diary_entries', 'souls', 'notifications', 'used_payment_txs', 'audit_log']
  LOOP
    EXECUTE format('CREATE POLICY "deny_anon" ON %I FOR ALL TO anon USING (false) WITH CHECK (false)', tbl);
  END LOOP;
END;
$$;
