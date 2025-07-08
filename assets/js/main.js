/**
 * QA 통합 유틸리티 메인 스크립트
 * js/main.js
 */

// ==================== 메인 앱 초기화 및 탭 관리 ====================

/**
 * 메인 탭 전환 기능 초기화
 */
function initMainTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // 모든 탭 버튼 비활성화
      tabButtons.forEach(btn => btn.classList.remove('active'));
      // 모든 탭 컨텐츠 숨김
      tabContents.forEach(content => content.classList.remove('active'));
      
      // 클릭된 탭 버튼 활성화
      button.classList.add('active');
      
      // 해당 탭 컨텐츠 표시
      const tabId = button.getAttribute('data-tab');
      const targetTab = document.getElementById(tabId);
      if (targetTab) {
        targetTab.classList.add('active');
      }
      
      console.log(`메인 탭 전환: ${tabId}`);
    });
  });
  
  console.log('✅ 메인 탭 전환 기능 초기화 완료');
}

/**
 * TC Merger 내부 탭 전환 기능
 * @param {string} tab - 전환할 탭 ID ('merge' 또는 'split')
 */
function switchTCMergerTab(tab) {
  // TC Merger 탭 버튼들 비활성화
  document.querySelectorAll('.tcmerger-tab-btn').forEach(btn => btn.classList.remove('active'));
  // TC Merger 탭 컨텐츠들 숨김
  document.querySelectorAll('.tcmerger-tab-content').forEach(content => content.classList.remove('active'));
  
  // 클릭된 TC Merger 탭 버튼 활성화
  const targetBtn = document.querySelector(`[data-tcmerger-tab="${tab}"]`);
  if (targetBtn) {
    targetBtn.classList.add('active');
  }
  
  // 해당 TC Merger 탭 컨텐츠 표시
  const targetTab = document.getElementById(tab + 'Tab');
  if (targetTab) {
    targetTab.classList.add('active');
  }
  
  console.log(`TC Merger 탭 전환: ${tab}`);
}

/**
 * 파일 입력 라벨 업데이트 이벤트 등록
 */
function initFileInputHandlers() {
  // CSV 파일 입력
  const csvFile = document.getElementById('csvFile');
  if (csvFile) {
    csvFile.addEventListener('change', function() {
      const label = this.nextElementSibling;
      if (this.files.length > 0 && label) {
        label.innerHTML = `✅ ${this.files[0].name}`;
        label.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      }
    });
  }

  // Excel 파일 입력
  const excelFile = document.getElementById('excelFile');
  if (excelFile) {
    excelFile.addEventListener('change', function() {
      const label = this.nextElementSibling;
      if (this.files.length > 0 && label) {
        label.innerHTML = `✅ ${this.files[0].name}`;
        label.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      }
    });
  }

  // Report 파일 입력
  const reportFile = document.getElementById('reportFileInput');
  if (reportFile) {
    reportFile.addEventListener('change', function() {
      const label = this.nextElementSibling;
      if (this.files.length > 0 && label) {
        label.innerHTML = `✅ ${this.files[0].name}`;
        label.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      }
    });
  }

  // TC Merger 파일 입력들
  const mergeFile = document.getElementById('mergeFileInput');
  if (mergeFile) {
    mergeFile.addEventListener('change', function() {
      const label = this.nextElementSibling;
      if (this.files.length > 0 && label) {
        label.innerHTML = `✅ ${this.files[0].name}`;
        label.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      }
    });
  }

  const splitFile = document.getElementById('splitFileInput');
  if (splitFile) {
    splitFile.addEventListener('change', function() {
      const label = this.nextElementSibling;
      if (this.files.length > 0 && label) {
        label.innerHTML = `✅ ${this.files[0].name}`;
        label.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      }
    });
  }

  console.log('✅ 파일 입력 핸들러 초기화 완료');
}

/**
 * 공통 메시지 표시 함수들
 */
function showError(message) {
  const errorDiv = document.getElementById('error');
  if (errorDiv) {
    errorDiv.innerHTML = `
      <div style="display: flex; align-items: center;">
        <span style="margin-right: 10px;">⚠️</span>
        <span>${message}</span>
      </div>
    `;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 5000);
  }
  console.error('❌', message);
}

function showSuccess(message) {
  const errorDiv = document.getElementById('error');
  if (errorDiv) {
    errorDiv.innerHTML = `
      <div style="display: flex; align-items: center; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); color: #065f46; border-left-color: #10b981;">
        <span style="margin-right: 10px;">✅</span>
        <span>${message}</span>
      </div>
    `;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 3000);
  }
  console.log('✅', message);
}

function showLoading(buttonElement, originalText) {
  if (buttonElement) {
    buttonElement.innerHTML = `<span class="loading"></span>${originalText}`;
    buttonElement.disabled = true;
  }
}

function hideLoading(buttonElement, originalText) {
  if (buttonElement) {
    buttonElement.innerHTML = originalText;
    buttonElement.disabled = false;
  }
}

/**
 * 앱 초기화 함수
 */
function initializeApp() {
  console.log('🚀 QA 통합 유틸리티 초기화 시작');
  
  // 메인 탭 전환 기능 초기화
  initMainTabs();
  
  // 파일 입력 핸들러 초기화
  initFileInputHandlers();
  
  // 각 메뉴별 요소 확인
  const menuElements = {
    'CSV 파싱': document.getElementById('csvFile'),
    'Groovy 변환': document.getElementById('excelFile'),
    'Report 뷰어': document.getElementById('reportFileInput'),
    'TC Merger 병합': document.getElementById('mergeFileInput'),
    'TC Merger 분리': document.getElementById('splitFileInput'),
    '테스트케이스 매핑': document.getElementById('testcaseInput')
  };
  
  console.log('📋 메뉴별 요소 확인:');
  Object.entries(menuElements).forEach(([menu, element]) => {
    if (element) {
      console.log(`✅ ${menu}: 정상`);
    } else {
      console.warn(`⚠️ ${menu}: 요소 없음`);
    }
  });
  
  // 외부 라이브러리 로드 확인
  const libraries = [
    { name: 'jQuery', check: () => typeof $ !== 'undefined' },
    { name: 'Papa Parse', check: () => typeof Papa !== 'undefined' },
    { name: 'XLSX', check: () => typeof XLSX !== 'undefined' },
    { name: 'JSZip', check: () => typeof JSZip !== 'undefined' },
    { name: 'Chart.js', check: () => typeof Chart !== 'undefined' },
    { name: 'Supabase', check: () => typeof supabase !== 'undefined' }
  ];
  
  console.log('📚 외부 라이브러리 확인:');
  libraries.forEach(lib => {
    if (lib.check()) {
      console.log(`✅ ${lib.name}: 로드됨`);
    } else {
      console.warn(`⚠️ ${lib.name}: 로드 안됨`);
    }
  });
  
  // 수파베이스 연결 상태 확인
  if (typeof isSupabaseConnected === 'function') {
    const connected = isSupabaseConnected();
    console.log(`🔗 수파베이스 연결: ${connected ? '✅ 연결됨' : '❌ 연결 안됨'}`);
  }
  
  console.log('🎉 QA 통합 유틸리티 초기화 완료');
}

/**
 * DOM 로드 완료 시 앱 초기화
 */
document.addEventListener('DOMContentLoaded', function() {
  // 약간의 지연 후 초기화 (다른 스크립트들이 로드될 시간 확보)
  setTimeout(() => {
    initializeApp();
  }, 500);
});

// ==================== 전역 함수 등록 ====================

window.initMainTabs = initMainTabs;
window.switchTCMergerTab = switchTCMergerTab;
window.initializeApp = initializeApp;
window.showError = showError;
window.showSuccess = showSuccess;
window.showLoading = showLoading;
window.hideLoading = hideLoading;

console.log('✅ main.js 로드 완료');