/**
 * 테스트케이스 UI 제어 전용 모듈 (Steps 추가)
 * testcase_mapper.js에서 분리된 UI 제어 기능
 * 
 * 책임:
 * - 스크립트 복사 기능
 * - 초기화 기능들 (입력, 파싱, 스크립트) - Steps 포함
 * - 매핑 상태 표시
 * - 버튼 상태 관리
 * 
 * 수정일: 2025년 6월 13일 - Steps UI 제어 추가
 */

// ================================
// UI 제어 기능 (Steps 추가)
// ================================

/**
 * 스크립트 복사 기능
 */
function copyScript() {
    if (!window.generatedScript) {
        alert('복사할 스크립트가 없습니다.');
        return;
    }
    
    navigator.clipboard.writeText(window.generatedScript).then(() => {
        const copyBtn = document.querySelector('.copy-btn');
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ 복사됨';
        copyBtn.style.background = '#10b981';
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = '#6366f1';
        }, 2000);
    }).catch(err => {
        console.error('복사 실패:', err);
        
        const scriptElement = document.getElementById('scriptResult');
        const range = document.createRange();
        range.selectNode(scriptElement);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        
        alert('스크립트가 선택되었습니다. Ctrl+C로 복사하세요.');
    });
}

/**
 * 입력 영역 초기화
 */
function resetInput() {
    if (confirm('입력된 테스트케이스를 초기화하시겠습니까?')) {
        document.getElementById('testcaseInput').value = '';
        console.log('✅ 입력 영역 초기화 완료');
    }
}

/**
 * 파싱 결과 초기화 (Steps 포함)
 */
function resetParsing() {
    if (confirm('파싱 결과를 초기화하시겠습니까?')) {
        const summaryElement = document.getElementById('summaryResult');
        const preconditionElement = document.getElementById('preconditionResult');
        const stepsElement = document.getElementById('stepsResult'); // ✅ Steps 요소 추가
        const expectedElement = document.getElementById('expectedResult');
        
        if (summaryElement) {
            summaryElement.innerHTML = '<span class="placeholder-text">추출된 Summary가 여기에 표시됩니다</span>';
        }
        if (preconditionElement) {
            preconditionElement.innerHTML = '<span class="placeholder-text">추출된 Precondition이 여기에 표시됩니다</span>';
        }
        // ✅ Steps 초기화 추가
        if (stepsElement) {
            stepsElement.innerHTML = '<span class="placeholder-text">추출된 Steps가 여기에 표시됩니다</span>';
        }
        if (expectedElement) {
            expectedElement.innerHTML = '<span class="placeholder-text">추출된 Expected Result가 여기에 표시됩니다</span>';
        }
        
        // 스크립트 전환 버튼 비활성화
        const convertBtn = document.getElementById('convertBtn');
        if (convertBtn) {
            convertBtn.disabled = true;
        }
        
        // 전역 변수 초기화
        window.parsedTestcaseData = null;
        
        console.log('✅ 파싱 결과 초기화 완료 (Steps 포함)');
    }
}

/**
 * 생성된 스크립트 초기화
 */
function resetScript() {
    if (confirm('생성된 매핑 스크립트를 초기화하시겠습니까?')) {
        const scriptElement = document.getElementById('scriptResult');
        if (scriptElement) {
            scriptElement.innerHTML = '<span class="placeholder-text">// 통합 카탈론 매핑 스크립트가 여기에 생성됩니다\n// \n// === Precondition Scripts ===\n// Precondition 매핑 스크립트가 여기에 표시됩니다\n//\n// === Summary Scripts ===  \n// Summary 매핑 스크립트가 여기에 표시됩니다\n//\n// === Steps Scripts ===\n// Steps 매핑 스크립트가 여기에 표시됩니다\n//\n// === Expected Result Scripts ===\n// Expected Result 매핑 스크립트가 여기에 표시됩니다</span>';
        }
        
        // 매핑 상태 초기화
        updateMappingStatus(false);
        
        // 전역 변수 초기화
        window.generatedScript = null;
        
        console.log('✅ 매핑 스크립트 초기화 완료');
    }
}

/**
 * 매핑 스크립트를 화면에 표시
 * @param {string} script - 표시할 스크립트
 */
function displayMappingScript(script) {
    const scriptElement = document.getElementById('scriptResult');
    scriptElement.textContent = script;
    window.generatedScript = script;
}

/**
 * 매핑 상태 업데이트
 * @param {boolean} hasMappings - 매핑 존재 여부
 */
function updateMappingStatus(hasMappings) {
    const indicator = document.getElementById('mappingIndicator');
    
    if (hasMappings) {
        indicator.classList.remove('no-mapping');
    } else {
        indicator.classList.add('no-mapping');
    }
}

/**
 * 버튼 상태 관리
 * @param {string} buttonId - 버튼 ID
 * @param {boolean} enabled - 활성화 여부
 */
function setButtonEnabled(buttonId, enabled) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.disabled = !enabled;
    }
}

/**
 * 로딩 상태 표시
 * @param {string} buttonId - 버튼 ID
 * @param {boolean} loading - 로딩 여부
 * @param {string} loadingText - 로딩 중 텍스트 (선택적)
 */
function setButtonLoading(buttonId, loading, loadingText = '처리 중...') {
    const button = document.getElementById(buttonId);
    if (!button) return;
    
    if (loading) {
        button.dataset.originalText = button.textContent;
        button.textContent = loadingText;
        button.disabled = true;
        button.classList.add('loading');
    } else {
        button.textContent = button.dataset.originalText || button.textContent;
        button.disabled = false;
        button.classList.remove('loading');
    }
}

/**
 * 에러 메시지 표시
 * @param {string} message - 에러 메시지
 * @param {number} duration - 표시 시간(ms), 기본 3초
 */
function showErrorMessage(message, duration = 3000) {
    // 에러 메시지를 표시할 수 있는 영역이 있다면 사용
    const errorArea = document.querySelector('.error-message') || createErrorMessageArea();
    
    errorArea.textContent = message;
    errorArea.style.display = 'block';
    errorArea.classList.add('show');
    
    setTimeout(() => {
        errorArea.classList.remove('show');
        setTimeout(() => {
            errorArea.style.display = 'none';
        }, 300);
    }, duration);
}

/**
 * 성공 메시지 표시
 * @param {string} message - 성공 메시지
 * @param {number} duration - 표시 시간(ms), 기본 2초
 */
function showSuccessMessage(message, duration = 2000) {
    // 성공 메시지를 표시할 수 있는 영역이 있다면 사용
    const successArea = document.querySelector('.success-message') || createSuccessMessageArea();
    
    successArea.textContent = message;
    successArea.style.display = 'block';
    successArea.classList.add('show');
    
    setTimeout(() => {
        successArea.classList.remove('show');
        setTimeout(() => {
            successArea.style.display = 'none';
        }, 300);
    }, duration);
}

/**
 * 에러 메시지 영역 생성 (필요시)
 * @returns {HTMLElement} 에러 메시지 영역
 */
function createErrorMessageArea() {
    const errorArea = document.createElement('div');
    errorArea.className = 'error-message';
    errorArea.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #fee2e2;
        border: 1px solid #fecaca;
        color: #dc2626;
        padding: 12px 16px;
        border-radius: 6px;
        display: none;
        z-index: 1000;
        max-width: 300px;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    errorArea.classList.add('show') && (errorArea.style.opacity = '1');
    document.body.appendChild(errorArea);
    return errorArea;
}

/**
 * 성공 메시지 영역 생성 (필요시)
 * @returns {HTMLElement} 성공 메시지 영역
 */
function createSuccessMessageArea() {
    const successArea = document.createElement('div');
    successArea.className = 'success-message';
    successArea.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #d1fae5;
        border: 1px solid #a7f3d0;
        color: #065f46;
        padding: 12px 16px;
        border-radius: 6px;
        display: none;
        z-index: 1000;
        max-width: 300px;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    successArea.classList.add('show') && (successArea.style.opacity = '1');
    document.body.appendChild(successArea);
    return successArea;
}

/**
 * 텍스트 영역 자동 크기 조정
 * @param {HTMLElement} textarea - 텍스트 영역
 */
function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

/**
 * 진행률 표시기 생성
 * @param {string} containerId - 컨테이너 ID
 * @param {number} progress - 진행률 (0-100)
 * @returns {HTMLElement} 진행률 바
 */
function createProgressBar(containerId, progress = 0) {
    const container = document.getElementById(containerId);
    if (!container) return null;
    
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.style.cssText = `
        width: 100%;
        height: 4px;
        background: #e5e7eb;
        border-radius: 2px;
        overflow: hidden;
        margin: 10px 0;
    `;
    
    const progressFill = document.createElement('div');
    progressFill.className = 'progress-fill';
    progressFill.style.cssText = `
        height: 100%;
        background: linear-gradient(90deg, #3b82f6, #1d4ed8);
        width: ${progress}%;
        transition: width 0.3s ease;
    `;
    
    progressBar.appendChild(progressFill);
    container.appendChild(progressBar);
    
    return {
        element: progressBar,
        update: (newProgress) => {
            progressFill.style.width = `${Math.min(100, Math.max(0, newProgress))}%`;
        },
        remove: () => {
            if (progressBar.parentNode) {
                progressBar.parentNode.removeChild(progressBar);
            }
        }
    };
}

/**
 * 매핑 상태에 따른 시각적 피드백
 * @param {object} mappingStats - 매핑 통계
 */
function updateMappingVisualFeedback(mappingStats) {
    const indicator = document.getElementById('mappingIndicator');
    if (!indicator) return;
    
    const rate = parseFloat(mappingStats.mappingRate) || 0;
    
    // 매핑률에 따른 색상 및 상태 변경
    if (rate >= 70) {
        indicator.className = 'mapping-indicator excellent';
        indicator.title = `매핑률 ${rate}% - 우수`;
    } else if (rate >= 50) {
        indicator.className = 'mapping-indicator good';
        indicator.title = `매핑률 ${rate}% - 양호`;
    } else if (rate >= 30) {
        indicator.className = 'mapping-indicator fair';
        indicator.title = `매핑률 ${rate}% - 보통`;
    } else if (rate > 0) {
        indicator.className = 'mapping-indicator poor';
        indicator.title = `매핑률 ${rate}% - 부족`;
    } else {
        indicator.className = 'mapping-indicator no-mapping';
        indicator.title = '매핑 없음';
    }
}

/**
 * 스크롤을 특정 요소로 부드럽게 이동
 * @param {string} elementId - 대상 요소 ID
 */
function smoothScrollToElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

/**
 * 키보드 단축키 설정
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(event) {
        // Ctrl + Enter: 데이터 추출 실행
        if (event.ctrlKey && event.key === 'Enter') {
            event.preventDefault();
            const extractBtn = document.querySelector('.extract-btn');
            if (extractBtn && !extractBtn.disabled) {
                extractBtn.click();
            }
        }
        
        // Ctrl + Shift + Enter: 스크립트 생성 실행
        if (event.ctrlKey && event.shiftKey && event.key === 'Enter') {
            event.preventDefault();
            const convertBtn = document.getElementById('convertBtn');
            if (convertBtn && !convertBtn.disabled) {
                convertBtn.click();
            }
        }
        
        // Ctrl + C (스크립트 영역에서): 스크립트 복사
        if (event.ctrlKey && event.key === 'c') {
            const activeElement = document.activeElement;
            if (activeElement && activeElement.id === 'scriptResult') {
                event.preventDefault();
                copyScript();
            }
        }
    });
}

// ================================
// 초기화 및 이벤트 설정
// ================================

/**
 * UI 컨트롤러 초기화
 */
function initializeUIController() {
    // 키보드 단축키 설정
    setupKeyboardShortcuts();
    
    // 텍스트 영역 자동 크기 조정 설정
    const textarea = document.getElementById('testcaseInput');
    if (textarea) {
        textarea.addEventListener('input', function() {
            autoResizeTextarea(this);
        });
    }
    
    console.log('✅ UI Controller 초기화 완료 (Steps 지원)');
}

// ================================
// Export (브라우저 환경용)
// ================================

// 브라우저 환경에서 전역 객체에 함수들을 노출
if (typeof window !== 'undefined') {
    window.TestcaseUIController = {
        copyScript,
        resetInput,
        resetParsing,
        resetScript,
        displayMappingScript,
        updateMappingStatus,
        setButtonEnabled,
        setButtonLoading,
        showErrorMessage,
        showSuccessMessage,
        autoResizeTextarea,
        createProgressBar,
        updateMappingVisualFeedback,
        smoothScrollToElement,
        setupKeyboardShortcuts,
        initializeUIController
    };
    
    // 페이지 로드 시 자동 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeUIController);
    } else {
        initializeUIController();
    }
}

// Node.js 환경 지원
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        copyScript,
        resetInput,
        resetParsing,
        resetScript,
        displayMappingScript,
        updateMappingStatus,
        setButtonEnabled,
        setButtonLoading,
        showErrorMessage,
        showSuccessMessage,
        autoResizeTextarea,
        createProgressBar,
        updateMappingVisualFeedback,
        smoothScrollToElement,
        setupKeyboardShortcuts,
        initializeUIController
    };
}

console.log('✅ testcase_ui_controller.js 모듈 로드 완료 (Steps 지원)');