/**
 * 테스트케이스 파싱 전용 모듈 (Steps 추가)
 * testcase_mapper.js에서 분리된 파싱 기능
 * 
 * 책임:
 * - 테스트케이스 텍스트 파싱 (Steps 포함)
 * - 키워드 추출
 * - 파싱 결과 표시 (Steps 포함)
 * 
 * 수정일: 2025년 6월 13일 - Steps 영역 추가
 */

// ================================
// 테스트케이스 파싱 기능 (Steps 추가)
// ================================

/**
 * 테스트케이스 텍스트 파싱 (Steps 필드 추가)
 * @param {string} text - 입력된 테스트케이스 텍스트
 * @returns {object} 파싱된 데이터 객체
 */
function parseTestcase(text) {
    console.log('🔍 파싱 시작, 입력 텍스트:', text);
    
    const result = {
        summary: '',
        precondition: [],
        steps: [], // ✅ Steps 필드 추가
        expectedResult: ''
    };
    
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    console.log('분리된 라인들:', lines);
    
    let currentSection = null;
    let preconditionBuffer = [];
    let stepsBuffer = []; // ✅ Steps 버퍼 추가
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        console.log(`라인 ${i}: "${line}"`);
        
        if (line.toLowerCase().includes('summary')) {
            currentSection = 'summary';
            const colonIndex = line.indexOf(':');
            if (colonIndex !== -1) {
                result.summary = line.substring(colonIndex + 1).trim();
                console.log('Summary 발견:', result.summary);
            }
            continue;
        }
        
        if (line.toLowerCase().includes('precondition')) {
            currentSection = 'precondition';
            const colonIndex = line.indexOf(':');
            if (colonIndex !== -1) {
                const preconditionText = line.substring(colonIndex + 1).trim();
                if (preconditionText) {
                    preconditionBuffer.push(preconditionText);
                }
            }
            console.log('Precondition 섹션 시작');
            continue;
        }
        
        // ✅ Steps 섹션 파싱 추가
        if (line.toLowerCase().includes('steps')) {
            currentSection = 'steps';
            const colonIndex = line.indexOf(':');
            if (colonIndex !== -1) {
                const stepsText = line.substring(colonIndex + 1).trim();
                if (stepsText) {
                    stepsBuffer.push(stepsText);
                }
            }
            console.log('Steps 섹션 시작');
            continue;
        }
        
        if (line.toLowerCase().includes('expected result')) {
            currentSection = 'expectedResult';
            const colonIndex = line.indexOf(':');
            if (colonIndex !== -1) {
                result.expectedResult = line.substring(colonIndex + 1).trim();
                console.log('Expected Result 발견:', result.expectedResult);
            }
            continue;
        }
        
        // 현재 섹션에 내용 추가
        if (currentSection === 'precondition') {
            if (line.match(/^\d+\./) || line) {
                preconditionBuffer.push(line);
                console.log('Precondition에 추가:', line);
            }
        } else if (currentSection === 'steps') { // ✅ Steps 처리 추가
            if (line.match(/^\d+\./) || line) {
                stepsBuffer.push(line);
                console.log('Steps에 추가:', line);
            }
        } else if (currentSection === 'expectedResult' && line) {
            if (result.expectedResult) {
                result.expectedResult += '\n' + line;
            } else {
                result.expectedResult = line;
            }
            console.log('Expected Result에 추가:', line);
        } else if (currentSection === 'summary' && line) {
            if (result.summary) {
                result.summary += '\n' + line;
            } else {
                result.summary = line;
            }
            console.log('Summary에 추가:', line);
        }
    }
    
    result.precondition = preconditionBuffer;
    result.steps = stepsBuffer; // ✅ Steps 결과 설정
    console.log('✅ 최종 파싱 결과:', result);
    return result;
}

/**
 * 파싱된 데이터를 화면에 표시 (Steps 추가)
 * @param {object} data - 파싱된 데이터
 */
function displayParsedData(data) {
    console.log('displayParsedData 호출됨:', data);
    console.log('Summary 값:', data.summary, '타입:', typeof data.summary, '길이:', data.summary ? data.summary.length : 'null');
    console.log('Precondition 값:', data.precondition, '타입:', typeof data.precondition, '길이:', data.precondition ? data.precondition.length : 'null');
    console.log('Steps 값:', data.steps, '타입:', typeof data.steps, '길이:', data.steps ? data.steps.length : 'null'); // ✅ Steps 로그 추가
    console.log('Expected Result 값:', data.expectedResult, '타입:', typeof data.expectedResult, '길이:', data.expectedResult ? data.expectedResult.length : 'null');
    
    const summaryElement = document.getElementById('summaryResult');
    const preconditionElement = document.getElementById('preconditionResult');
    const stepsElement = document.getElementById('stepsResult'); // ✅ Steps 요소 추가
    const expectedElement = document.getElementById('expectedResult');
    
    if (summaryElement) {
        if (data.summary) {
            summaryElement.innerHTML = data.summary;
            console.log('Summary 설정됨:', data.summary);
        } else {
            summaryElement.innerHTML = '<span class="placeholder-text">Summary를 찾을 수 없습니다</span>';
            console.log('Summary 없음');
        }
    }
    
    if (preconditionElement) {
        if (data.precondition && data.precondition.length > 0) {
            preconditionElement.innerHTML = data.precondition.join('<br>');
            console.log('Precondition 설정됨:', data.precondition);
        } else {
            preconditionElement.innerHTML = '<span class="placeholder-text">Precondition을 찾을 수 없습니다</span>';
            console.log('Precondition 없음');
        }
    }
    
    // ✅ Steps 표시 로직 추가
    if (stepsElement) {
        if (data.steps && data.steps.length > 0) {
            stepsElement.innerHTML = data.steps.join('<br>');
            console.log('Steps 설정됨:', data.steps);
        } else {
            stepsElement.innerHTML = '<span class="placeholder-text">Steps를 찾을 수 없습니다</span>';
            console.log('Steps 없음');
        }
    }
    
    if (expectedElement) {
        if (data.expectedResult) {
            expectedElement.innerHTML = data.expectedResult;
            console.log('Expected Result 설정됨:', data.expectedResult);
        } else {
            expectedElement.innerHTML = '<span class="placeholder-text">Expected Result를 찾을 수 없습니다</span>';
            console.log('Expected Result 없음');
        }
    }
    
    console.log('✅ 화면 표시 완료 (Steps 포함)');
}

/**
 * 텍스트에서 키워드 추출
 * @param {string} text - 분석할 텍스트
 * @returns {array} 추출된 키워드 배열
 */
function extractKeywords(text) {
    if (!text) return [];
    
    const words = text
        .replace(/[^\w\sㄱ-ㅎ가-힣]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 1)
        .map(word => word.toLowerCase());
    
    return [...new Set(words)];
}

// ================================
// Export (브라우저 환경용)
// ================================

// 브라우저 환경에서 전역 객체에 함수들을 노출
if (typeof window !== 'undefined') {
    window.TestcaseParser = {
        parseTestcase,
        displayParsedData,
        extractKeywords
    };
}

// Node.js 환경 지원
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        parseTestcase,
        displayParsedData,
        extractKeywords
    };
}

console.log('✅ testcase_parser.js 모듈 로드 완료 (Steps 지원)');