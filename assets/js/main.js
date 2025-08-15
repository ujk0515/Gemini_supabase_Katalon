/**
 * QA 통합 유틸리티 메인 스크립트 (Object Spy 통합 버전)
 * assets/js/main.js
 */

// ==================== 메인 앱 초기화 및 탭 관리 ====================

/**
 * 메인 탭 전환 기능 초기화 (Object Spy 지원)
 */
function initMainTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // 버튼이 비활성화 상태이면 아무것도 하지 않음
      if (button.disabled) {
        return;
      }

      const tabId = button.getAttribute('data-tab');
      const targetTab = document.getElementById(tabId);

      // 대상 탭이 존재하는지 확인
      if (targetTab) {
        // 모든 탭 비활성화
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        // 선택된 탭 활성화
        button.classList.add('active');
        targetTab.classList.add('active');

        // Object Spy 탭 특별 처리
        if (tabId === 'objectspy') {
          initializeObjectSpy();
        }
      } else {
        console.warn(`탭을 찾을 수 없습니다: ${tabId}`);
      }
      
      console.log(`메인 탭 전환: ${tabId}`);
    });
  });
  
  console.log('✅ 메인 탭 전환 기능 초기화 완료 (Object Spy 지원)');
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

// ==================== Object Spy 관련 기능 ====================

/**
 * Object Spy 초기화 함수
 */
function initializeObjectSpy() {
  console.log('🔍 Object Spy 탭 활성화됨');
  
  // ObjectSpyController가 아직 초기화되지 않았다면 초기화
  if (!window.objectSpyController) {
    console.log('🔄 ObjectSpyController 초기화 중...');
    
    // 잠시 대기 후 초기화 (DOM 준비 대기)
    setTimeout(() => {
      try {
        if (typeof ObjectSpyController !== 'undefined') {
          window.objectSpyController = new ObjectSpyController();
          console.log('✅ ObjectSpyController 초기화 완료');
        } else {
          console.error('❌ ObjectSpyController 클래스를 찾을 수 없습니다');
        }
      } catch (error) {
        console.error('❌ ObjectSpyController 초기화 실패:', error);
      }
    }, 100);
  } else {
    console.log('✅ ObjectSpyController 이미 초기화됨');
  }
}

// ==================== 파일 입력 핸들러 ====================

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

// ==================== 공통 메시지 표시 함수들 ====================

/**
 * 에러 메시지 표시
 * @param {string} message - 에러 메시지
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

/**
 * 성공 메시지 표시
 * @param {string} message - 성공 메시지
 */
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

/**
 * 로딩 상태 표시
 * @param {HTMLElement} buttonElement - 버튼 요소
 * @param {string} originalText - 원래 텍스트
 */
function showLoading(buttonElement, originalText) {
  if (buttonElement) {
    buttonElement.innerHTML = `<span class="loading"></span>${originalText}`;
    buttonElement.disabled = true;
  }
}

/**
 * 로딩 상태 해제
 * @param {HTMLElement} buttonElement - 버튼 요소
 * @param {string} originalText - 원래 텍스트
 */
function hideLoading(buttonElement, originalText) {
  if (buttonElement) {
    buttonElement.innerHTML = originalText;
    buttonElement.disabled = false;
  }
}

// ==================== Object Spy 유틸리티 ====================

/**
 * Object Spy 관련 유틸리티 함수들
 */
window.objectSpyUtils = {
  /**
   * 요소 정보 표시
   */
  showElementInfo: function(element) {
    if (!element) return;
    
    console.log('🔍 선택된 요소 정보:');
    console.log('- 태그:', element.tagName);
    console.log('- ID:', element.id || '없음');
    console.log('- 클래스:', element.className || '없음');
    console.log('- 텍스트:', element.textContent?.trim().substring(0, 50) || '없음');
  },

  /**
   * 셀렉터 유효성 검사
   */
  validateSelector: function(selector, type) {
    try {
      if (type === 'CSS') {
        document.querySelector(selector);
      } else if (type === 'XPATH') {
        document.evaluate(selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      }
      return true;
    } catch (error) {
      console.warn(`셀렉터 유효성 검사 실패 (${type}):`, error.message);
      return false;
    }
  },

  /**
   * 다운로드 상태 표시
   */
  showDownloadStatus: function(fileName, success = true) {
    const message = success ? 
      `✅ ${fileName} 다운로드 완료` : 
      `❌ ${fileName} 다운로드 실패`;
    
    console.log(message);
    
    // 간단한 토스트 메시지 표시
    this.showToast(message, success ? 'success' : 'error');
  },

  /**
   * 토스트 메시지 표시
   */
  showToast: function(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 6px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.3s ease;
      max-width: 300px;
      word-wrap: break-word;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    `;
    
    document.body.appendChild(toast);
    
    // 애니메이션으로 표시
    setTimeout(() => {
      toast.style.opacity = '1';
    }, 100);
    
    // 자동 제거
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  },

  /**
   * 오브젝트 미리보기 생성
   */
  generateObjectPreview: function(element) {
    if (!element) return null;
    
    const preview = {
      tag: element.tagName.toLowerCase(),
      id: element.id || '',
      className: element.className || '',
      text: element.textContent?.trim().substring(0, 100) || '',
      attributes: {},
      position: {
        x: element.getBoundingClientRect().left,
        y: element.getBoundingClientRect().top
      }
    };
    
    // 주요 속성들만 수집
    const importantAttrs = ['name', 'type', 'value', 'placeholder', 'title', 'alt', 'href', 'src'];
    importantAttrs.forEach(attr => {
      const value = element.getAttribute(attr);
      if (value) {
        preview.attributes[attr] = value;
      }
    });
    
    return preview;
  }
};

// ==================== 디버깅 도구 ====================

/**
 * 디버깅을 위한 전역 함수들
 */
window.debugObjectSpy = {
  /**
   * 현재 상태 로그
   */
  logCurrentState: function() {
    console.log('🔍 Object Spy 디버그 정보:');
    console.log('- Controller:', window.objectSpyController ? '✅ 초기화됨' : '❌ 없음');
    console.log('- Generator:', window.katalonGenerator ? '✅ 로드됨' : '❌ 없음');
    console.log('- JSZip:', window.JSZip ? '✅ 로드됨' : '❌ 없음');
    
    if (window.objectSpyController) {
      const controller = window.objectSpyController;
      console.log('- 현재 URL:', controller.currentUrl || '없음');
      console.log('- Spy 모드:', controller.isSpyMode ? 'ON' : 'OFF');
      console.log('- 선택된 요소:', controller.selectedElement ? '있음' : '없음');
      console.log('- 캡처된 오브젝트:', controller.capturedObjects?.length || 0, '개');
    }
  },

  /**
   * 오브젝트 생성 테스트
   */
  testObjectGeneration: function() {
    const testElement = document.querySelector('button') || document.querySelector('input') || document.body;
    
    if (testElement && window.katalonGenerator) {
      console.log('🧪 오브젝트 생성 테스트 시작...');
      const result = window.katalonGenerator.createObjectFromElement(testElement, 'test_element');
      
      if (result) {
        console.log('✅ 테스트 성공!');
        console.log('- 이름:', result.name);
        console.log('- 셀렉터:', result.selectors);
        console.log('- XML 길이:', result.content.length, '문자');
      } else {
        console.log('❌ 테스트 실패');
      }
    } else {
      console.log('❌ 테스트 요소 또는 생성기를 찾을 수 없음');
    }
  },

  /**
   * 모든 탭 상태 확인
   */
  checkTabStatus: function() {
    console.log('📋 탭 상태 확인:');
    const tabs = ['csv', 'groovy', 'report', 'mapping', 'tcmerger', 'smart', 'objectspy'];
    
    tabs.forEach(tabId => {
      const button = document.querySelector(`[data-tab="${tabId}"]`);
      const content = document.getElementById(tabId);
      
      console.log(`- ${tabId}:`, {
        button: button ? (button.disabled ? '비활성화' : '활성화') : '없음',
        content: content ? '존재' : '없음',
        active: button?.classList.contains('active') ? '선택됨' : '선택안됨'
      });
    });
  }
};

// ==================== 앱 초기화 ====================

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
    '테스트케이스 매핑': document.getElementById('testcaseInput'),
    'Object Spy': document.getElementById('objectspy')
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
  
  // Object Spy 관련 클래스 확인
  const objectSpyComponents = [
    { name: 'KatalonObjectGenerator', check: () => typeof KatalonObjectGenerator !== 'undefined' },
    { name: 'ObjectSpyController', check: () => typeof ObjectSpyController !== 'undefined' }
  ];
  
  console.log('🔍 Object Spy 컴포넌트 확인:');
  objectSpyComponents.forEach(comp => {
    if (comp.check()) {
      console.log(`✅ ${comp.name}: 로드됨`);
    } else {
      console.warn(`⚠️ ${comp.name}: 로드 안됨`);
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

// 기존 함수들
window.initMainTabs = initMainTabs;
window.switchTCMergerTab = switchTCMergerTab;
window.initializeApp = initializeApp;
window.showError = showError;
window.showSuccess = showSuccess;
window.showLoading = showLoading;
window.hideLoading = hideLoading;

// Object Spy 관련 함수들
window.initializeObjectSpy = initializeObjectSpy;

console.log('✅ main.js 로드 완료 (Object Spy 통합 버전)');