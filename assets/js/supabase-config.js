/**
 * 수파베이스 설정 및 연결 관리
 * js/supabase-config.js
 */

// ================================
// 🔥 수파베이스 연결 정보
// ================================

const SUPABASE_CONFIG = {
  url: 'https://sposmjzjicgpxmpbzomn.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwb3NtanpqaWNncHhtcGJ6b21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3OTYxNzIsImV4cCI6MjA2NjM3MjE3Mn0.UjTxOh7tVc6F_kw_5rCOlntnWfrljzhp0ntmeKLuW3c'
};

// ================================
// 수파베이스 클라이언트 관리
// ================================

let supabaseClient = null;

/**
 * 수파베이스 초기화
 */
async function initializeSupabase() {
  try {
    console.log('🚀 수파베이스 초기화 시작...');
    
    // supabase 전역 객체 확인
    if (typeof supabase === 'undefined') {
      console.error('❌ Supabase CDN이 로드되지 않았습니다');
      return false;
    }
    
    // 클라이언트 생성
    const { createClient } = supabase;
    supabaseClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
    
    // 연결 테스트
    console.log('🔍 수파베이스 연결 테스트 중...');
    const { data, error } = await supabaseClient
      .from('katalon_mapping_complete')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ 수파베이스 연결 테스트 실패:', error);
      return false;
    }
    
    console.log('✅ 수파베이스 연결 성공!');
    console.log('📊 테스트 쿼리 결과:', data);
    return true;
    
  } catch (error) {
    console.error('❌ 수파베이스 초기화 실패:', error);
    return false;
  }
}

/**
 * 수파베이스 클라이언트 반환
 */
function getSupabaseClient() {
  if (!supabaseClient) {
    console.warn('⚠️ 수파베이스 클라이언트가 초기화되지 않았습니다');
    return null;
  }
  return supabaseClient;
}

/**
 * 연결 상태 확인
 */
function isSupabaseConnected() {
  return supabaseClient !== null;
}

// ================================
// 매핑 데이터 검색 함수들
// ================================

/**
 * 키워드로 Complete 테이블에서 검색
 */
async function searchCompleteMapping(keyword) {
  const client = getSupabaseClient();
  if (!client) return null;
  
  try {
    const normalizedKeyword = keyword.toLowerCase().trim();
    console.log(`🔍 Complete 테이블에서 "${normalizedKeyword}" 검색 중...`);
    
    const { data, error } = await client
      .from('katalon_mapping_complete')
      .select('*')
      .contains('keywords', [normalizedKeyword]);
    
    if (error) {
      console.error('Complete 검색 오류:', error);
      return null;
    }
    
    console.log(`📊 Complete 검색 결과:`, data);
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Complete 검색 예외:', error);
    return null;
  }
}

/**
 * 키워드로 Observer 테이블에서 검색
 */
async function searchObserverMapping(keyword) {
  const client = getSupabaseClient();
  if (!client) return null;
  
  try {
    const normalizedKeyword = keyword.toLowerCase().trim();
    console.log(`🔍 Observer 테이블에서 "${normalizedKeyword}" 검색 중...`);
    
    const { data, error } = await client
      .from('katalon_mapping_observer')
      .select('*')
      .contains('keywords', [normalizedKeyword]);
    
    if (error) {
      console.error('Observer 검색 오류:', error);
      return null;
    }
    
    console.log(`📊 Observer 검색 결과:`, data);
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Observer 검색 예외:', error);
    return null;
  }
}

/**
 * 통합 매핑 검색 (Complete → Observer 순서)
 */
async function findMappingInSupabase(keyword) {
  console.log(`🔍 수파베이스에서 "${keyword}" 검색 중...`);
  
  // Complete 테이블에서 우선 검색
  const completeResult = await searchCompleteMapping(keyword);
  if (completeResult) {
    console.log(`✅ Complete에서 "${keyword}" 발견:`, completeResult.action);
    return {
      found: true,
      mapping: completeResult,
      source: 'complete',
      action: completeResult.action,
      type: completeResult.type || 'unknown'
    };
  }
  
  // Observer 테이블에서 검색
  const observerResult = await searchObserverMapping(keyword);
  if (observerResult) {
    console.log(`✅ Observer에서 "${keyword}" 발견:`, observerResult.action);
    return {
      found: true,
      mapping: observerResult,
      source: 'observer', 
      action: observerResult.action,
      type: observerResult.type || 'unknown'
    };
  }
  
  console.log(`❌ "${keyword}" 매핑을 찾을 수 없습니다`);
  return {
    found: false,
    keyword: keyword,
    source: 'none'
  };
}

/**
 * 유사한 키워드 제안 생성
 */
async function generateSuggestions(keyword) {
  const client = getSupabaseClient();
  if (!client) return [];
  
  try {
    // 부분 문자열로 검색하여 유사한 키워드 찾기
    const { data, error } = await client
      .from('katalon_mapping_complete')
      .select('keywords, action')
      .textSearch('keywords', keyword)
      .limit(5);

    if (error) {
      console.error('제안 검색 오류:', error);
      return [];
    }

    return data.flatMap(item => 
      item.keywords.map(kw => ({
        keyword: kw,
        action: item.action
      }))
    ).slice(0, 5);
  } catch (error) {
    console.error('제안 생성 오류:', error);
    return [];
  }
}

// ================================
// 연결 상태 모니터링
// ================================

/**
 * 수파베이스 연결 상태를 UI에 표시
 */
function updateConnectionStatus(connected) {
  // 기존 상태 표시 제거
  const existingStatus = document.querySelector('.connection-status');
  if (existingStatus) {
    existingStatus.remove();
  }
  
  // 새 상태 표시 생성
  const statusDiv = document.createElement('div');
  statusDiv.className = `connection-status ${connected ? 'connected' : 'disconnected'}`;
  statusDiv.innerHTML = connected ? 
    '🟢 Supabase 연결됨' : 
    '🔴 Supabase 연결 안됨';
  
  // 스타일 추가
  statusDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 10px 15px;
    border-radius: 5px;
    color: white;
    font-weight: bold;
    z-index: 9999;
    ${connected ? 'background: #10b981;' : 'background: #ef4444;'}
  `;
  
  document.body.appendChild(statusDiv);
  
  // 5초 후 자동 제거
  setTimeout(() => {
    if (statusDiv.parentNode) {
      statusDiv.parentNode.removeChild(statusDiv);
    }
  }, 5000);
}

// ================================
// 즉시 전역 함수로 등록 (중요!)
// ================================

(function() {
  window.SUPABASE_CONFIG = SUPABASE_CONFIG;
})();
window.initializeSupabase = initializeSupabase;
window.getSupabaseClient = getSupabaseClient;
window.isSupabaseConnected = isSupabaseConnected;
window.findMappingInSupabase = findMappingInSupabase;
window.searchCompleteMapping = searchCompleteMapping;
window.searchObserverMapping = searchObserverMapping;
window.generateSuggestions = generateSuggestions;
window.updateConnectionStatus = updateConnectionStatus;

// ================================
// DOM 로드 완료 시 자동 초기화
// ================================

// 즉시 초기화 실행 (DOMContentLoaded 기다리지 않음)
setTimeout(async () => {
  console.log('🔗 수파베이스 즉시 초기화 시작...');
  
  // 약간의 지연 후 초기화 (Supabase CDN 로드 대기)
  setTimeout(async () => {
    try {
      console.log('🔄 수파베이스 자동 초기화 실행...');
      const connected = await initializeSupabase();
      updateConnectionStatus(connected);
      
      if (connected) {
        console.log('🎉 수파베이스 준비 완료!');
        console.log('💡 이제 "스크립트 전환" 버튼을 사용할 수 있습니다');
        
        // 연결 테스트
        const testResult = await supabaseClient.from('katalon_mapping_complete').select('*').limit(3);
        console.log('📊 연결 테스트 결과:', testResult);
      } else {
        console.warn('⚠️ 수파베이스 연결 실패 - 설정을 확인하세요');
      }
    } catch (error) {
      console.error('❌ 자동 초기화 실패:', error);
      updateConnectionStatus(false);
    }
  }, 1500);
});

// ================================
// 스크립트 로드 완료 로그
// ================================

console.log('🔧 수파베이스 설정 파일 로드 완료 - 전역 함수 등록됨');

// 강제 즉시 실행
if (typeof supabase !== 'undefined') {
  const { createClient } = supabase;
  supabaseClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
  console.log('✅ 강제 클라이언트 생성 완료');
}

// ================================
// 강제 즉시 실행 (파일 끝에 추가)
// ================================

// 기존 마지막 줄 다음에 추가
console.log('🔧 수파베이스 설정 파일 로드 완료 - 전역 함수 등록됨');

  // 강제 함수 재등록
  if (typeof supabase !== 'undefined') {
    const { createClient } = supabase;
    const testClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
    
    // 전역 함수 강제 등록
    window.getSupabaseClient = function() { return testClient; };
    window.isSupabaseConnected = function() { return true; };
    window.findMappingInSupabase = async function(keyword) {
      try {
        const { data, error } = await testClient
          .from('katalon_mapping_complete')
          .select('*')
          .contains('keywords', [keyword.toLowerCase()]);
        
        if (error) return { found: false, keyword: keyword };
        
        if (data && data.length > 0) {
          return { 
            found: true, 
            mapping: data[0], 
            source: 'complete', 
            action: data[0].action 
          };
        }
        
        return { found: false, keyword: keyword };
      } catch (err) {
        return { found: false, keyword: keyword };
      }
    };
    
    console.log('🔧 수파베이스 함수 강제 재등록 완료');
  }