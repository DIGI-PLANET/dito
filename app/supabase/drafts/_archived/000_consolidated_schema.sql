-- ============================================================================
-- DITO.guru Consolidated Schema
-- 모든 마이그레이션(001~012)을 반영한 최종 스키마 상태
-- 생성일: 2026-02-24
-- ============================================================================
--
-- 적용된 마이그레이션 히스토리:
--   schema.sql          : 초기 스키마 (profiles, diary_entries, souls, discovery_sessions, notifications)
--   migration-001       : souls에 Solana 필드 추가
--   migration-002/003   : RLS 정책 강화
--   migration-004       : used_payment_txs 테이블
--   migration-005       : chat_messages 분리 + diary_entries에 profile_id 추가
--   migration-006       : soft delete + audit_log
--   migration-007       : souls.status 추가
--   migration-008       : admin_users (dito-admin)
--   migration-009       : profiles에 talent 필드 추가
--   migration-010       : chat_messages → diary_entries 병합 (chat_messages DROP)
--   migration-011       : discovery_sessions DROP
--   migration-012       : sessions 테이블 (디바이스 세션 추적)
--   001_email_auth      : users, user_sessions 테이블 (이메일 인증)
--
-- ⚠️  알려진 문제:
--   1. profiles (지갑인증) vs users (이메일인증) - 이중 유저 시스템
--   2. diary_entries (지갑유저) vs diary (이메일유저) - 이중 다이어리
--   3. sessions (지갑) vs user_sessions (이메일) - 이중 세션
--   4. diary_entries에 user_id, profile_id 둘 다 존재 (동일 테이블 참조)
--   5. notifications.user_id FK가 profiles(id)와 users(id) 양쪽 모두 참조 시도
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- 1. USERS & AUTH
-- ============================================================================

-- 1-1. profiles: 지갑 기반 유저 프로필
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  links JSONB DEFAULT '{}',
  -- migration-009: talent 필드
  current_talent TEXT,
  talent_category TEXT CHECK (talent_category IN ('Creative', 'Physical', 'Intellectual', 'Social', 'Technical', 'Hybrid')),
  discovery_complete BOOLEAN DEFAULT FALSE,
  -- migration-006: soft delete
  deleted_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1-2. users: 이메일/패스워드 인증 유저 (migration-001_email_auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  -- 프로필 정보 (profiles 테이블과 중복됨)
  display_name VARCHAR(100),
  avatar_url TEXT,
  current_talent VARCHAR(200),
  talent_category VARCHAR(100),
  discovery_complete BOOLEAN DEFAULT FALSE,
  -- 추가 프로필 정보
  interests TEXT[] DEFAULT '{}',
  challenges_completed INTEGER DEFAULT 0,
  growth_notes JSONB DEFAULT '[]',
  minted BOOLEAN DEFAULT FALSE,
  ember_stage VARCHAR(50) DEFAULT 'sparked',
  language VARCHAR(10) DEFAULT 'en',
  -- 지갑 정보
  internal_wallet_pubkey VARCHAR(44),
  internal_wallet_encrypted TEXT,
  external_wallet_address VARCHAR(44),
  -- 보안 설정
  otp_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(32),
  -- 소셜 링크
  links JSONB DEFAULT '[]',
  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

-- 1-3. admin_users: 어드민 대시보드 로그인 (migration-008)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 2. SESSIONS
-- ============================================================================

-- 2-1. sessions: 지갑 기반 디바이스 세션 추적 (migration-012)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  device_id TEXT NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- 2-2. user_sessions: 이메일 인증 세션 (001_email_auth)
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. CORE DATA
-- ============================================================================

-- 3-1. diary_entries: 다이어리 + 채팅 통합 (chat_messages 병합 완료)
--      ⚠️ user_id와 profile_id 둘 다 profiles(id) 참조 - 중복
CREATE TABLE IF NOT EXISTS diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id),  -- migration-005에서 추가, user_id와 중복
  date DATE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  image TEXT,
  embedding vector(768),
  -- migration-006: soft delete
  deleted_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3-2. diary: 이메일 인증 유저용 다이어리 (001_email_auth)
--      ⚠️ diary_entries와 별도의 테이블 - 이중 다이어리 문제
CREATE TABLE IF NOT EXISTS diary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  entry TEXT,
  photos JSONB DEFAULT '[]',
  mood VARCHAR(50),
  challenges JSONB DEFAULT '[]',
  growth TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 3-3. souls: Soul/SBT 레코드
CREATE TABLE IF NOT EXISTS souls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  wallet_address TEXT,
  talent_label TEXT NOT NULL,
  traits TEXT[] DEFAULT '{}',
  description TEXT,
  stage TEXT NOT NULL DEFAULT 'sparked' CHECK (stage IN ('sparked', 'burning', 'blazing', 'radiant', 'eternal')),
  -- migration-007: 라이프사이클 상태
  status TEXT DEFAULT 'draft',
  mint_date DATE,
  -- migration-001: Solana 온체인 필드
  mint_tx TEXT,
  mint_address TEXT,
  on_chain BOOLEAN DEFAULT false,
  proof_hash TEXT,
  entries_count INT DEFAULT 0,
  streak INT DEFAULT 0,
  last_activity TIMESTAMPTZ DEFAULT now(),
  -- migration-006: soft delete
  deleted_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3-4. notifications: 알림
--      ⚠️ user_id가 profiles(id) 참조 (원본),
--         001_email_auth에서 users(id) 참조 컬럼 추가 시도 - 충돌 가능
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 4. PAYMENT & AUDIT
-- ============================================================================

-- 4-1. used_payment_txs: 민팅 결제 트랜잭션 재사용 방지 (migration-004)
CREATE TABLE IF NOT EXISTS used_payment_txs (
  tx_signature TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  amount_lamports BIGINT,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4-2. audit_log: 감사 로그 (migration-006)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,  -- 'create', 'update', 'delete', 'restore'
  old_data JSONB,
  new_data JSONB,
  performed_by TEXT,     -- wallet_address 또는 'admin'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 5. INDEXES
-- ============================================================================

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at) WHERE deleted_at IS NOT NULL;

-- users (이메일 인증)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at);

-- sessions (지갑)
CREATE INDEX IF NOT EXISTS idx_sessions_wallet_active ON sessions(wallet_address, is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_device ON sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON sessions(last_active);

-- user_sessions (이메일)
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- diary_entries
CREATE INDEX IF NOT EXISTS idx_diary_user_date ON diary_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_diary_entries_user_created ON diary_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_diary_entries_deleted_at ON diary_entries(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_diary_entries_embedding ON diary_entries USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);

-- diary (이메일 인증용)
CREATE INDEX IF NOT EXISTS idx_diary_user_id ON diary(user_id);

-- souls
CREATE INDEX IF NOT EXISTS idx_souls_deleted_at ON souls(deleted_at) WHERE deleted_at IS NOT NULL;

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- used_payment_txs
CREATE INDEX IF NOT EXISTS idx_used_payment_txs_wallet ON used_payment_txs(wallet_address);

-- audit_log
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- ============================================================================
-- 6. FUNCTIONS
-- ============================================================================

-- 벡터 유사도 검색 (다이어리)
CREATE OR REPLACE FUNCTION match_diary_entries(
  query_embedding vector(768),
  match_user_id uuid,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  date date,
  role text,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.id,
    de.date,
    de.role,
    de.content,
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

-- updated_at 자동 갱신 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거 적용
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 비활성 세션 정리 (30일 이상)
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM sessions
  WHERE is_active = FALSE
    AND last_active < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary ENABLE ROW LEVEL SECURITY;
ALTER TABLE souls ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE used_payment_txs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Service role bypass (서버사이드 API 호출용) - 모든 주요 테이블
CREATE POLICY "Service role full access" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON diary_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON souls FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON audit_log FOR ALL USING (true) WITH CHECK (true);

-- anon/authenticated 차단 (service_role만 접근)
CREATE POLICY "service_only_select" ON used_payment_txs FOR SELECT USING (false);
CREATE POLICY "service_only_insert" ON used_payment_txs FOR INSERT WITH CHECK (false);

-- Deny anon access to audit_log
CREATE POLICY "Deny anon access" ON audit_log FOR ALL TO anon USING (false) WITH CHECK (false);

-- 세션 RLS (지갑 기반)
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (wallet_address = (SELECT wallet_address FROM profiles WHERE wallet_address = sessions.wallet_address));
CREATE POLICY "Users can create own sessions" ON sessions
  FOR INSERT WITH CHECK (wallet_address = (SELECT wallet_address FROM profiles WHERE wallet_address = sessions.wallet_address));
CREATE POLICY "Users can update own sessions" ON sessions
  FOR UPDATE USING (wallet_address = (SELECT wallet_address FROM profiles WHERE wallet_address = sessions.wallet_address));

-- 이메일 인증 RLS
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.jwt() ->> 'email' = email);
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.jwt() ->> 'email' = email);
CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (auth.jwt() ->> 'email' = email);

-- ============================================================================
-- DROP된 테이블 (참고용)
-- ============================================================================
-- discovery_sessions: migration-011에서 DROP (버튼 기반 UI로 전환)
-- chat_messages: migration-010에서 diary_entries로 병합 후 DROP
