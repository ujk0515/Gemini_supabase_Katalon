// ==================== 파일 업로드 핸들러들 ====================

/**
 * 파일 선택 시 레이블 업데이트 함수
 * @param {HTMLInputElement} inputElement - 파일 입력 요소
 * @param {string} fileName - 선택된 파일명
 */
function updateFileLabel(inputElement, fileName) {
  const label = inputElement.nextElementSibling;
  if (label) {
    label.innerHTML = `✅ ${fileName}`;
    label.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
  }
}

/**
 * CSV 파일 업로드 핸들러 초기화
 */
function initCSVFileHandler() {
  const csvFileInput = document.getElementById('csvFile');
  if (!csvFileInput) return;

  csvFileInput.addEventListener('change', function() {
    if (this.files.length > 0) {
      updateFileLabel(this, this.files[0].name);
    }
  });
}

/**
 * Excel 파일 업로드 핸들러 초기화 (Groovy 변환용)
 */
function initExcelFileHandler() {
  const excelFileInput = document.getElementById('excelFile');
  if (!excelFileInput) return;

  excelFileInput.addEventListener('change', function() {
    if (this.files.length > 0) {
      updateFileLabel(this, this.files[0].name);
    }
  });
}

/**
 * Report 파일 업로드 핸들러 초기화
 */
function initReportFileHandler() {
  const reportFileInput = document.getElementById('reportFileInput');
  if (!reportFileInput) return;

  reportFileInput.addEventListener('change', function() {
    if (this.files.length > 0) {
      updateFileLabel(this, this.files[0].name);
    }
  });
}

/**
 * TC Merger 병합 파일 업로드 핸들러 초기화
 */
function initMergeFileHandler() {
  const mergeFileInput = document.getElementById('mergeFileInput');
  if (!mergeFileInput) return;

  mergeFileInput.addEventListener('change', function() {
    if (this.files.length > 0) {
      updateFileLabel(this, this.files[0].name);
      
      // 파일 정보 표시
      const fileInfo = document.getElementById('mergeFileInfo');
      if (fileInfo) {
        fileInfo.innerHTML = `📁 파일: ${this.files[0].name} (${(this.files[0].size/1024).toFixed(1)}KB)`;
        fileInfo.style.display = 'block';
      }
      
      // 정리 정보 표시
      const cleaningInfo = document.getElementById('mergeCleaningInfo');
      if (cleaningInfo) {
        cleaningInfo.style.display = 'block';
      }
    }
  });
}

/**
 * TC Merger 분리 파일 업로드 핸들러 초기화
 */
function initSplitFileHandler() {
  const splitFileInput = document.getElementById('splitFileInput');
  if (!splitFileInput) return;

  splitFileInput.addEventListener('change', function() {
    if (this.files.length > 0) {
      updateFileLabel(this, this.files[0].name);
      
      // 파일 정보 표시
      const fileInfo = document.getElementById('splitFileInfo');
      if (fileInfo) {
        fileInfo.innerHTML = `📁 파일: ${this.files[0].name} (${(this.files[0].size/1024).toFixed(1)}KB)`;
        fileInfo.style.display = 'block';
      }
      
      // 정리 정보 표시
      const cleaningInfo = document.getElementById('splitCleaningInfo');
      if (cleaningInfo) {
        cleaningInfo.style.display = 'block';
      }
    }
  });
}

/**
 * 모든 파일 핸들러 초기화
 */
function initAllFileHandlers() {
  initCSVFileHandler();
  initExcelFileHandler();
  initReportFileHandler();
  initMergeFileHandler();
  initSplitFileHandler();
  
  console.log('✅ 모든 파일 핸들러 초기화 완료');
}

/**
 * DOM 로드 완료 시 파일 핸들러 초기화
 */
document.addEventListener('DOMContentLoaded', function() {
  initAllFileHandlers();
});

// 전역 함수로 등록
window.updateFileLabel = updateFileLabel;
window.initCSVFileHandler = initCSVFileHandler;
window.initExcelFileHandler = initExcelFileHandler;
window.initReportFileHandler = initReportFileHandler;
window.initMergeFileHandler = initMergeFileHandler;
window.initSplitFileHandler = initSplitFileHandler;
window.initAllFileHandlers = initAllFileHandlers;

console.log('✅ file-handlers.js 로드 완료');