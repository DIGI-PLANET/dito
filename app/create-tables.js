const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ejslrfzodbxkmtreklcw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqc2xyZnpvZGJ4a210cmVrbGN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTUxOTYyNywiZXhwIjoyMDgxMDk1NjI3fQ.TzaBstAUMxQeBqE66njuUOhsAUMjFrbSppYViBO81Is';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createEmailAuthTables() {
  console.log('🚀 이메일 인증 테이블 생성 시작...\n');

  // 1. users 테이블 생성
  console.log('1️⃣ users 테이블 생성...');
  const usersSQL = `
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
  `;
  
  try {
    const { error: usersError } = await supabase.rpc('exec_sql', { sql: usersSQL });
    if (usersError) {
      console.error('❌ users 테이블 생성 실패:', usersError);
    } else {
      console.log('✅ users 테이블 생성 완료');
    }
  } catch (err) {
    console.error('❌ users 테이블 생성 에러:', err.message);
  }

  // 2. user_sessions 테이블 생성
  console.log('\n2️⃣ user_sessions 테이블 생성...');
  const sessionsSQL = `
    CREATE TABLE IF NOT EXISTS user_sessions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      session_token VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      last_used_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  
  try {
    const { error: sessionsError } = await supabase.rpc('exec_sql', { sql: sessionsSQL });
    if (sessionsError) {
      console.error('❌ user_sessions 테이블 생성 실패:', sessionsError);
    } else {
      console.log('✅ user_sessions 테이블 생성 완료');
    }
  } catch (err) {
    console.error('❌ user_sessions 테이블 생성 에러:', err.message);
  }

  // 3. diary 테이블 생성
  console.log('\n3️⃣ diary 테이블 생성...');
  const diarySQL = `
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
  `;
  
  try {
    const { error: diaryError } = await supabase.rpc('exec_sql', { sql: diarySQL });
    if (diaryError) {
      console.error('❌ diary 테이블 생성 실패:', diaryError);
    } else {
      console.log('✅ diary 테이블 생성 완료');
    }
  } catch (err) {
    console.error('❌ diary 테이블 생성 에러:', err.message);
  }

  // 4. 인덱스 생성
  console.log('\n4️⃣ 인덱스 생성...');
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);',
    'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);',
    'CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);',
    'CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_diary_user_id ON diary(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_diary_date ON diary(date);'
  ];

  for (const indexSQL of indexes) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: indexSQL });
      if (error) {
        console.log('⚠️ 인덱스 생성 실패:', error.message);
      }
    } catch (err) {
      console.log('⚠️ 인덱스 생성 에러:', err.message);
    }
  }
  console.log('✅ 인덱스 생성 완료');

  console.log('\n🎉 테이블 생성 완료!');
}

createEmailAuthTables();