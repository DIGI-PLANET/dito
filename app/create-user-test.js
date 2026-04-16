const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ejslrfzodbxkmtreklcw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqc2xyZnpvZGJ4a210cmVrbGN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTUxOTYyNywiZXhwIjoyMDgxMDk1NjI3fQ.TzaBstAUMxQeBqE66njuUOhsAUMjFrbSppYViBO81Is';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTables() {
  console.log('🧪 테이블 생성 테스트...\n');

  // users 테이블에 테스트 데이터 삽입 시도
  console.log('1️⃣ users 테이블 테스트...');
  try {
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: 'test@example.com',
        username: 'testuser123',
        password_hash: '$2a$12$dummy_hash_for_testing',
        display_name: 'Test User'
      })
      .select();

    if (error) {
      console.error('❌ users 테이블 없음:', error.message);
      
      // 테이블이 없다면 수동으로 간단한 버전 생성
      console.log('🔧 users 테이블 수동 생성 시도...');
      await attemptCreateUsersTable();
    } else {
      console.log('✅ users 테이블 존재하고 작동함!');
      console.log('   생성된 사용자:', data);
      
      // 생성된 테스트 데이터 삭제
      await supabase.from('users').delete().eq('email', 'test@example.com');
    }
  } catch (err) {
    console.error('❌ users 테이블 테스트 에러:', err.message);
  }

  // user_sessions 테이블 테스트
  console.log('\n2️⃣ user_sessions 테이블 테스트...');
  try {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ user_sessions 테이블 없음:', error.message);
    } else {
      console.log('✅ user_sessions 테이블 존재함!');
    }
  } catch (err) {
    console.error('❌ user_sessions 테이블 테스트 에러:', err.message);
  }

  // diary 테이블 테스트
  console.log('\n3️⃣ diary 테이블 테스트...');
  try {
    const { data, error } = await supabase
      .from('diary')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ diary 테이블 없음:', error.message);
    } else {
      console.log('✅ diary 테이블 존재함!');
    }
  } catch (err) {
    console.error('❌ diary 테이블 테스트 에러:', err.message);
  }
}

// 간단한 users 테이블 생성 시도 (제한적이지만 작동할 수 있음)
async function attemptCreateUsersTable() {
  try {
    // 직접 SQL은 안되니까, schema 정보를 업데이트하는 방식으로
    console.log('⚠️  수동 테이블 생성은 Supabase 대시보드에서 해야 합니다.');
    console.log('📋 다음 URL로 이동하세요:');
    console.log('   https://supabase.com/dashboard/project/ejslrfzodbxkmtreklcw/editor');
    console.log('📝 SQL_EXECUTE_IN_SUPABASE.sql 파일의 내용을 복사해서 실행하세요!');
  } catch (err) {
    console.error('에러:', err.message);
  }
}

testTables();