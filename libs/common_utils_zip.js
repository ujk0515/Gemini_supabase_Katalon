// ==================== 공통 유틸리티 및 탭 관리 코드 ====================

// 탭 관리
const buttons = document.querySelectorAll('.tab-button');
const contents = document.querySelectorAll('.tab-content');
let activeTab = 'csv';

buttons.forEach(button => {
  button.addEventListener('click', () => {
    buttons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    activeTab = button.dataset.tab;
    contents.forEach(c => c.classList.remove('active'));
    document.getElementById(activeTab).classList.add('active');
  });
});

// 전역 함수 등록 (TC+Script 메뉴용)
window.generateTCScript = function() {
  console.log('✅ generateTCScript 함수 호출 성공!');
  
  if (typeof generateTCScript === 'function') {
    generateTCScript();
  } else {
    console.error('❌ generateTCScript 함수를 찾을 수 없습니다.');
    alert('⚠️ TC+Script 생성 함수를 로드할 수 없습니다. 페이지를 새로고침해주세요.');
  }
};

window.downloadTCOnly = function() {
  if (typeof downloadTCOnly === 'function') {
    downloadTCOnly();
  } else {
    alert('TC 다운로드 함수를 찾을 수 없습니다.');
  }
};

window.downloadScriptOnly = function() {
  if (typeof downloadScriptOnly === 'function') {
    downloadScriptOnly();
  } else {
    alert('Script 다운로드 함수를 찾을 수 없습니다.');
  }
};

window.downloadMergedFiles = function() {
  if (typeof downloadMergedFiles === 'function') {
    downloadMergedFiles();
  } else {
    alert('병합 파일 다운로드 함수를 찾을 수 없습니다.');
  }
};

window.clearTCScriptOutput = function() {
  if (typeof clearTCScriptOutput === 'function') {
    clearTCScriptOutput();
  } else {
    console.log('결과 초기화 함수를 찾을 수 없습니다.');
  }
};

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 QA 통합 유틸리티 초기화 완료');
  
  // 각 메뉴별 초기화 확인
  const menuChecks = {
    'CSV 파싱': !!document.getElementById('csvFile'),
    'Groovy': !!document.getElementById('excelFile'),
    'TC+Script': !!document.getElementById('tcScriptExcelFile'),
    'Report': !!document.getElementById('reportFileInput'),
    '폴더 생성기': !!document.getElementById('excelInput')
  };
  
  console.log('📋 메뉴별 요소 확인:', menuChecks);
  
  // 전역 함수 등록 확인
  const globalFunctions = [
    'generateTCScript',
    'downloadTCOnly', 
    'downloadScriptOnly',
    'downloadMergedFiles',
    'clearTCScriptOutput',
    'downloadGroovyZip',
    'downloadFile',
    'generateAllZip',
    'addInput',
    'generateZip'
  ];
  
  globalFunctions.forEach(func => {
    if (typeof window[func] === 'function') {
      console.log(`✅ ${func} 전역 함수 등록 완료`);
    } else {
      console.warn(`⚠️ ${func} 전역 함수 등록 실패`);
    }
  });
});