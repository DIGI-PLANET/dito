-- DITO Email/Password Authentication System Migration
-- 기존 wallet 기반에서 email 기반으로 전환

-- 1. 새로운 users 테이블 생성
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  
  -- 프로필 정보 (기존 profiles 테이블 내용 통합)
  display_name VARCHAR(100),
  avatar_url TEXT,
  current_talent VARCHAR(200),
  talent_category VARCHAR(100),
  discovery_complete BOOLEAN DEFAULT FALSE,
  
  -- 추가 프로필 정보 (기존 store.ts에서 사용하던 필드들)
  interests TEXT[] DEFAULT '{}', -- 관심사 배열
  challenges_completed INTEGER DEFAULT 0,
  growth_notes JSONB DEFAULT '[]',
  minted BOOLEAN DEFAULT FALSE,
  ember_stage VARCHAR(50) DEFAULT 'sparked',
  language VARCHAR(10) DEFAULT 'en',
  
  -- 내부 지갑 정보 (Soul 민팅용)
  internal_wallet_pubkey VARCHAR(44), -- Solana public key (Base58)
  internal_wallet_encrypted TEXT, -- 암호화된 private key
  
  -- 외부 지갑 연동 (선택사항 - 나중에 출금용)
  external_wallet_address VARCHAR(44), -- 사용자의 개인 지갑 (출금 시 사용)
  
  -- 보안 설정
  otp_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(32),
  
  -- 소셜 링크
  links JSONB DEFAULT '[]', -- [{"label": "Twitter", "url": "..."}]
  
  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

-- 2. 세션 관리 테이블
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 일기 테이블도 user_id 기반으로 변경 (기존 diary 테이블 수정)
-- 기존에 wallet_address로 되어 있었다면 수정 필요
ALTER TABLE diary 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- 4. 알림 테이블도 user_id 기반으로 변경
ALTER TABLE notifications 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- 5. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_diary_user_id ON diary(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- 6. RLS (Row Level Security) 정책 설정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 정보만 조회/수정 가능
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.jwt() ->> 'email' = email);

-- 세션도 자신의 것만 접근 가능
CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (auth.jwt() ->> 'email' = email);

-- 7. 기존 profiles 테이블과의 호환성 뷰 (마이그레이션 기간 중 사용)
CREATE OR REPLACE VIEW profiles_compat AS
SELECT 
  internal_wallet_pubkey as wallet_address,
  display_name,
  avatar_url,
  current_talent,
  talent_category,
  discovery_complete,
  interests,
  challenges_completed,
  growth_notes,
  minted,
  ember_stage,
  language,
  links,
  created_at,
  updated_at,
  deleted_at
FROM users;

-- 8. 기존 데이터 마이그레이션 (만약 profiles 테이블에 데이터가 있다면)
-- INSERT INTO users (display_name, current_talent, ..., internal_wallet_pubkey)
-- SELECT display_name, current_talent, ..., wallet_address
-- FROM profiles 
-- WHERE deleted_at IS NULL;

-- 9. updated_at 트리거 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 10. 개발용 테스트 데이터 (실제 배포 시 제거)
-- INSERT INTO users (email, username, password_hash, display_name)
-- VALUES ('test@dito.guru', 'testuser', '$2a$12$dummy_hash', 'Test User');