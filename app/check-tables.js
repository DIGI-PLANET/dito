const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ejslrfzodbxkmtreklcw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqc2xyZnpvZGJ4a210cmVrbGN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTUxOTYyNywiZXhwIjoyMDgxMDk1NjI3fQ.TzaBstAUMxQeBqE66njuUOhsAUMjFrbSppYViBO81Is';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  try {
    console.log('🔍 현재 Supabase 테이블 목록:');
    
    const { data, error } = await supabase.rpc('get_table_info');
    
    if (error) {
      console.log('⚠️ RPC 함수가 없어서 다른 방법으로 확인...');
      
      // profiles 테이블 확인
      const profiles = await supabase.from('profiles').select('*').limit(1);
      console.log('profiles 테이블:', profiles.error ? '없음' : '있음');
      
      // users 테이블 확인
      const users = await supabase.from('users').select('*').limit(1);
      console.log('users 테이블:', users.error ? '없음' : '있음');
      
      // diary 테이블 확인
      const diary = await supabase.from('diary').select('*').limit(1);
      console.log('diary 테이블:', diary.error ? '없음' : '있음');
      
      // notifications 테이블 확인
      const notifications = await supabase.from('notifications').select('*').limit(1);
      console.log('notifications 테이블:', notifications.error ? '없음' : '있음');
      
    } else {
      console.log(data);
    }
    
  } catch (err) {
    console.error('에러:', err);
  }
}

checkTables();