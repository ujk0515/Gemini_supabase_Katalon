// Supabase 클라이언트 초기화 (index.html과 동일한 정보 사용)
const { createClient } = supabase;
const testClient = createClient(
  'https://sposmjzjicgpxmpbzomn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwb3NtanpqaWNncHhtcGJ6b21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3OTYxNzIsImV4cCI6MjA2NjM3MjE3Mn0.UjTxOh7tVc6F_kw_5rCOlntnWfrljzhp0ntmeKLuW3c'
);

// 다른 파일에서 접근할 수 있도록 전역 변수로 설정
window.testClient = testClient;

console.log('✅ testcase_mapper_supabase.js: Supabase 클라이언트 초기화 완료');