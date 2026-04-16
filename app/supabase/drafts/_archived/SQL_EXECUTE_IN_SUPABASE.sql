-- DITO 이메일 인증 시스템 테이블 생성
-- Supabase 대시보드 > SQL Editor에서 실행하세요!

-- 1. users 테이블 생성
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
  
  -- 추가 프로필 정보
  interests TEXT[] DEFAULT '{}',
  challenges_completed INTEGER DEFAULT 0,
  growth_notes JSONB DEFAULT '[]',
  minted BOOLEAN DEFAULT FALSE,
  ember_stage VARCHAR(50) DEFAULT 'sparked',
  language VARCHAR(10) DEFAULT 'en',
  
  -- 내부 지갑 정보 (Soul 민팅용)
  internal_wallet_pubkey VARCHAR(44),
  internal_wallet_encrypted TEXT,
  
  -- 외부 지갑 연동 (선택사항)
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

-- 2. user_sessions 테이블 생성
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. diary 테이블 생성
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
  
  -- 유니크 제약: 한 사용자는 하루에 하나의 일기만
  UNIQUE(user_id, date)
);

-- 4. 기존 notifications 테이블에 user_id 컬럼 추가 (있으면 스킵)
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
CREATE INDEX IF NOT EXISTS idx_diary_date ON diary(date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- 6. updated_at 트리거 생성 (자동 업데이트)
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

-- 7. 개발용 테스트 사용자 생성 (선택사항)
INSERT INTO users (email, username, password_hash, display_name, current_talent, discovery_complete)
VALUES 
  ('test@dito.guru', 'testuser', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewxHgrzv7UOvxGBm', 'Test User', 'Web Development', true),
  ('roy@dito.guru', 'roy', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewxHgrzv7UOvxGBm', 'Roy (DARGONNE)', 'Full Stack Development', true)
ON CONFLICT (email) DO NOTHING;