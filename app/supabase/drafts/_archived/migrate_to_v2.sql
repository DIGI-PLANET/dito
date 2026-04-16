-- ============================================================================
-- Migration: 기존 스키마 → Schema v2
-- ⚠️  반드시 백업 후 실행. 트랜잭션 내에서 실행 권장.
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: profiles 데이터를 users로 마이그레이션
-- (profiles에만 있고 users에 없는 유저가 있다면)
-- ============================================================================

-- profiles에 있지만 users에 없는 데이터 → users로 이관
-- 이메일/비밀번호가 없으므로 placeholder로 생성
INSERT INTO users (
  id, email, username, password_hash,
  display_name, avatar_url,
  current_talent, talent_category, discovery_complete,
  internal_wallet_pubkey, links,
  created_at, updated_at, deleted_at
)
SELECT
  p.id,
  COALESCE(p.wallet_address, gen_random_uuid()::text) || '@wallet.dito.guru' AS email,
  COALESCE(p.wallet_address, gen_random_uuid()::text) AS username,
  'WALLET_ONLY_NO_PASSWORD' AS password_hash,
  p.display_name,
  p.avatar_url,
  p.current_talent,
  p.talent_category,
  COALESCE(p.discovery_complete, FALSE),
  p.wallet_address AS internal_wallet_pubkey,
  p.links,
  p.created_at,
  p.updated_at,
  p.deleted_at
FROM profiles p
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = p.id)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 2: diary_entries FK 변경 (profiles → users)
-- ============================================================================

-- 기존 FK 제거
ALTER TABLE diary_entries DROP CONSTRAINT IF EXISTS diary_entries_user_id_fkey;
ALTER TABLE diary_entries DROP CONSTRAINT IF EXISTS diary_entries_profile_id_fkey;

-- user_id가 users에 존재하는지 확인 (STEP 1에서 마이그레이션됨)
-- profile_id 데이터를 user_id로 통합
UPDATE diary_entries
SET user_id = COALESCE(user_id, profile_id)
WHERE user_id IS NULL AND profile_id IS NOT NULL;

-- profile_id 컬럼 제거
ALTER TABLE diary_entries DROP COLUMN IF EXISTS profile_id;

-- 새 FK 추가
ALTER TABLE diary_entries
  ADD CONSTRAINT diary_entries_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- mood 컬럼 추가 (diary 테이블에서 가져온 기능)
ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS mood VARCHAR(50);

-- ============================================================================
-- STEP 3: diary 테이블 데이터를 diary_entries로 이관 후 제거
-- ============================================================================

-- diary 테이블의 데이터를 diary_entries로 이관
INSERT INTO diary_entries (user_id, date, role, content, mood, created_at)
SELECT
  d.user_id,
  d.date,
  'user' AS role,
  COALESCE(d.entry, '') AS content,
  d.mood,
  d.created_at
FROM diary d
WHERE d.entry IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM diary_entries de
    WHERE de.user_id = d.user_id
      AND de.date = d.date
      AND de.content = d.entry
  )
ON CONFLICT DO NOTHING;

-- diary 테이블 제거
DROP TABLE IF EXISTS diary CASCADE;

-- ============================================================================
-- STEP 4: souls FK 변경 (profiles → users)
-- ============================================================================

ALTER TABLE souls DROP CONSTRAINT IF EXISTS souls_user_id_fkey;
ALTER TABLE souls DROP CONSTRAINT IF EXISTS souls_profile_id_fkey;
ALTER TABLE souls DROP COLUMN IF EXISTS profile_id;
ALTER TABLE souls DROP COLUMN IF EXISTS wallet_address;

ALTER TABLE souls
  ADD CONSTRAINT souls_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- status CHECK constraint 추가
ALTER TABLE souls DROP CONSTRAINT IF EXISTS souls_status_check;
ALTER TABLE souls ADD CONSTRAINT souls_status_check CHECK (status IN ('draft', 'minted'));

-- ============================================================================
-- STEP 5: notifications FK 변경 (profiles → users)
-- ============================================================================

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_profile_id_fkey;
ALTER TABLE notifications DROP COLUMN IF EXISTS profile_id;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- type CHECK constraint 추가
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('info', 'warning', 'success', 'error', 'announcement', 'system'));

-- ============================================================================
-- STEP 6: sessions 테이블 통합
-- ============================================================================

-- 기존 user_sessions → sessions 마이그레이션
-- 먼저 기존 sessions (wallet 기반) 데이터를 새 형식으로 변환

-- 임시 테이블에 통합
CREATE TABLE sessions_new (
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

-- user_sessions 데이터 이관
INSERT INTO sessions_new (id, user_id, session_token, expires_at, created_at, last_active)
SELECT
  us.id,
  us.user_id,
  us.session_token,
  us.expires_at,
  us.created_at,
  us.last_used_at
FROM user_sessions us
WHERE us.user_id IN (SELECT id FROM users);

-- wallet 기반 sessions 데이터 이관 (wallet → user_id 매핑)
INSERT INTO sessions_new (user_id, session_token, device_id, user_agent, ip_address, expires_at, is_active, created_at, last_active)
SELECT
  u.id,
  gen_random_uuid()::text AS session_token,
  s.device_id,
  s.user_agent,
  s.ip_address,
  COALESCE(s.last_active + INTERVAL '30 days', NOW() + INTERVAL '30 days') AS expires_at,
  s.is_active,
  s.created_at,
  s.last_active
FROM sessions s
JOIN users u ON u.internal_wallet_pubkey = s.wallet_address
ON CONFLICT DO NOTHING;

-- 기존 테이블 교체
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
ALTER TABLE sessions_new RENAME TO sessions;

-- 세션 인덱스 재생성
CREATE INDEX idx_sessions_user ON sessions(user_id, is_active);
CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_sessions_device ON sessions(device_id) WHERE device_id IS NOT NULL;
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_sessions_last_active ON sessions(last_active);

-- ============================================================================
-- STEP 7: admin_users 업데이트
-- ============================================================================

ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin';

-- ============================================================================
-- STEP 8: profiles 테이블 제거
-- ============================================================================

-- 모든 FK가 해제된 후 제거
DROP TABLE IF EXISTS profiles CASCADE;

-- profiles_compat 뷰도 제거
DROP VIEW IF EXISTS profiles_compat;

-- ============================================================================
-- STEP 9: 레거시 objects 정리
-- ============================================================================

-- 이미 삭제되었어야 할 테이블들 재확인
DROP TABLE IF EXISTS discovery_sessions CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;

-- 기존 인덱스 정리 (이름 변경된 것들)
DROP INDEX IF EXISTS idx_diary_entries_user_created;
DROP INDEX IF EXISTS idx_diary_entries_deleted_at;
DROP INDEX IF EXISTS idx_diary_entries_embedding;
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_used_payment_txs_wallet;
DROP INDEX IF EXISTS idx_audit_log_table_record;
DROP INDEX IF EXISTS idx_audit_log_created_at;
DROP INDEX IF EXISTS idx_profiles_deleted_at;
DROP INDEX IF EXISTS idx_souls_deleted_at;

-- ============================================================================
-- STEP 10: 새 인덱스 생성
-- ============================================================================

-- users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(internal_wallet_pubkey) WHERE internal_wallet_pubkey IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_deleted ON users(deleted_at) WHERE deleted_at IS NOT NULL;

-- diary_entries
CREATE INDEX IF NOT EXISTS idx_diary_user_date ON diary_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_diary_user_created ON diary_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_diary_deleted ON diary_entries(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_diary_embedding ON diary_entries USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);

-- souls
CREATE INDEX IF NOT EXISTS idx_souls_user ON souls(user_id);
CREATE INDEX IF NOT EXISTS idx_souls_status ON souls(status);
CREATE INDEX IF NOT EXISTS idx_souls_deleted ON souls(deleted_at) WHERE deleted_at IS NOT NULL;

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at DESC);

-- used_payment_txs
CREATE INDEX IF NOT EXISTS idx_payment_txs_wallet ON used_payment_txs(wallet_address);

-- audit_log
CREATE INDEX IF NOT EXISTS idx_audit_table_record ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);

-- ============================================================================
-- STEP 11: Functions 재생성
-- ============================================================================

-- 벡터 유사도 검색 (users 기반으로 업데이트)
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

-- updated_at 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 만료 세션 정리
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  UPDATE sessions SET is_active = FALSE WHERE expires_at < NOW();
  DELETE FROM sessions WHERE is_active = FALSE AND last_active < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 12: RLS 재설정
-- ============================================================================

-- 기존 policies 제거
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END;
$$;

-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE souls ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE used_payment_txs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Service role: 전체 접근 (서버사이드 API)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['users', 'sessions', 'diary_entries', 'souls', 'notifications', 'used_payment_txs', 'audit_log']
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

COMMIT;

-- ============================================================================
-- 마이그레이션 완료 후 확인 쿼리
-- ============================================================================
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- 예상 결과: admin_users, audit_log, diary_entries, notifications, sessions, souls, used_payment_txs, users
