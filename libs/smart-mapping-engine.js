/**
     * 유연한 테스트케이스 파싱 (어떤 형태든 처리)
     */
    parseTestcase(text) {
        console.log('🔍 유연한 입력 분석 시작:', text);
        
        // 원본 텍스트 그대로 포함
        const result = { 
            originalInput: text.trim(),
            summary: '', 
            precondition: [], 
            steps: [], 
            expectedResult: '' 
        };

        // 빈 입력 처리
        if (!text || !text.trim()) {
            console.log('❌ 빈 입력');
            return result;
        }

        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        let currentSection = null;

        // 구조화된 형태 파싱 시도
        for (const line of lines) {
            if (line.toLowerCase().includes('summary')) {
                currentSection = 'summary';
                const colonIndex = line.indexOf(':');
                if (colonIndex !== -1) result.summary = line.substring(colonIndex + 1).trim();
            } else if (line.toLowerCase().includes('precondition')) {
                currentSection = 'precondition';
            } else if (line.toLowerCase().includes('steps')) {
                currentSection = 'steps';
            } else if (line.toLowerCase().includes('expected result')) {
                currentSection = 'expectedResult';
                const colonIndex = line.indexOf(':');
                if (colonIndex !== -1) result.expectedResult = line.substring(colonIndex + 1).trim();
            } else if (currentSection === 'precondition' && line) {
                result.precondition.push(line);
            } else if (currentSection === 'steps' && line) {
                result.steps.push(line);
            } else if (currentSection === 'expectedResult' && line) {
                if (result.expectedResult) result.expectedResult += ' ' + line;
                else result.expectedResult = line;
            }
        }

        // 구조화된 데이터가 없으면 자연어/키워드로 판단
        if (!result.summary && !result.steps.length && !result.expectedResult) {
            console.log('🤖 자연어/키워드 입력으로 판단');
            
            // 전체 텍스트를 summary로 설정
            result.summary = text.trim();
            
            // 간단한 키워드 기반 추론
            if (text.toLowerCase().includes('로그인')) {
                result.steps = ['로그인 페이지 이동', 'ID 입력', '비밀번호 입력', '로그인 버튼 클릭'];
                result.expectedResult = '로그인 성공';
            } else if (text.toLowerCase().includes('검색')) {
                result.steps = ['검색 페이지 이동', '검색어 입력', '검색 실행'];
                result.expectedResult = '검색 결과 표시';
            } else if (text.toLowerCase().includes('업로드')) {
                result.steps = ['파일 선택', '업로드 실행'];
                result.expectedResult = '업로드 성공';
            } else {
                // 일반적인 추론
                result.steps = ['테스트 대상 페이지 이/**
 * 스마트 매핑 엔진 - 3단계 분석 버전 (점수 표시 기능 포함)
 * libs/smart-mapping-engine.js
 */

class SmartMappingEngine {
    constructor() {
        this.apiKey = 'AIzaSyDE-edho0DTkfMbsGF9XoiOQgCPkVJInzU';
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent';
        // this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
        this.analysisResults = {};
        this.currentStep = 0;
    }

    /**
     * 메인 분석 프로세스 시작 - 3단계 버전
     */
    async startAnalysis(testcaseText) {
        try {
            this.showProgress();
            this.updateProgress(0, '분석 시작...');

            // 테스트케이스 파싱
            const parsedTC = this.parseTestcase(testcaseText);

            // 3단계 순차 분석
            const step1 = await this.analyzeSituationAndEnvironment(parsedTC);
            const step2 = await this.mapActionsAndValidation(parsedTC, step1);
            const step3 = await this.reviewAndGenerateScript(parsedTC, step1, step2);

            this.showResult(step3);
            return step3;

        } catch (error) {
            console.error('스마트 분석 실패:', error);
            this.updateProgress(-1, `❌ 분석 실패: ${error.message}`);
            throw error;
        }
    }

    /**
     * 1단계: 상황 파악 + 환경 설정 (유연한 입력 처리)
     */
    async analyzeSituationAndEnvironment(parsedTC) {
        this.updateProgress(1, '🔍 상황 파악 및 환경 설정 분석 중...');

        const prompt = `
사용자가 입력한 텍스트를 분석하여 테스트 목적을 파악하고 환경 설정을 결정해주세요.

=== 입력된 텍스트 ===
${JSON.stringify(parsedTC)}

=== 분석 지침 ===
입력된 텍스트가 어떤 형태든(자연어, 단순 설명, 구조화된 테스트케이스 등) 상관없이:

1. **테스트 목적 추론**: 사용자가 무엇을 테스트하려는지 파악
2. **환경 설정 결정**: 필요한 브라우저, URL, 초기 설정 등
3. **사전 조건 정리**: 테스트 실행 전 필요한 준비사항
4. **예외상황 예측**: 발생 가능한 문제들과 대응방안
5. **Object Repository 구조**: 요소 경로 체계 설계

=== 입력 유형별 처리 ===
- **구조화된 TC**: Summary, Steps 등이 명확히 구분된 경우
- **자연어 설명**: "구글에서 검색하고 싶다" 같은 일반 문장
- **단순 키워드**: "로그인 테스트", "파일 업로드" 등
- **혼합 형태**: 일부만 구조화되거나 불완전한 형태

** 절대 금지사항 **
- 하드코딩된 문자열 사용 금지 (URL, 데이터값 등)
- 모든 값은 GlobalVariable, 테스트 데이터, 또는 변수로 처리

다음 형식의 JSON만 반환하세요:
{
  "testPurpose": "추론된 테스트의 핵심 목적",
  "testScope": "groovy_method_name_format",
  "environmentSetup": [
    {
      "action": "WebUI.navigateToUrl",
      "target": "GlobalVariable.targetUrl 또는 적절한 변수명", 
      "purpose": "설정 목적",
      "waitCondition": "WebUI.waitForPageLoad|WebUI.waitForElementPresent"
    }
  ],
  "inferredPreconditions": [
    {
      "step": "추론된 사전 조건",
      "action": "Katalon 액션", 
      "element": "대상 요소",
      "value": "입력값 (해당시)",
      "objectPath": "Object Repository 경로"
    }
  ],
  "inferredSteps": [
    {
      "step": "추론된 테스트 단계",
      "action": "Katalon 액션",
      "element": "대상 요소", 
      "value": "입력값 (해당시)",
      "objectPath": "Object Repository 경로"
    }
  ],
  "inferredExpectedResult": "추론된 예상 결과",
  "riskAnalysis": [
    {
      "risk": "예외상황 설명",
      "probability": "high|medium|low", 
      "mitigation": "대응 방안",
      "katalonAction": "실제 대응 코드"
    }
  ],
  "elementStructure": {
    "pageObject": "페이지 분류",
    "expectedElements": ["필요한 요소1", "필요한 요소2"]
  }
}`;

        const result = await this.callGemini(prompt);
        this.analysisResults.step1 = result;
        this.updateProgress(1, `✅ 상황 분석 완료: ${result.testPurpose}`);
        return result;
    }

    /**
     * 2단계: 핵심 액션 + 검증 통합 (유연한 입력 처리)
     */
    async mapActionsAndValidation(parsedTC, step1Result) {
        this.updateProgress(2, '⚡ 액션 매핑 및 검증 로직 설계 중...');

        const prompt = `
1단계에서 추론된 정보를 바탕으로 실행 액션과 검증 로직을 설계해주세요.

=== 원본 입력 텍스트 ===
${JSON.stringify(parsedTC)}

=== 1단계 추론 결과 ===
테스트 목적: ${step1Result.testPurpose}
추론된 사전조건: ${JSON.stringify(step1Result.inferredPreconditions || [])}
추론된 테스트 단계: ${JSON.stringify(step1Result.inferredSteps || [])}
추론된 예상결과: ${step1Result.inferredExpectedResult || ''}
환경 설정: ${JSON.stringify(step1Result.environmentSetup)}

=== 설계 요구사항 ===
1. 추론된 테스트 단계를 정확한 Katalon WebUI 액션으로 매핑
2. 추론된 예상결과를 개별 assertion으로 분리  
3. **중요**: disabled/enabled 상태와 present/not present 구분 정확히
4. 실패 시 명확한 에러 메시지와 스크린샷 캡처
5. **간결성**: 필수 대기 로직만 포함, 중복 제거
6. Object Repository 경로를 실무 표준에 맞게 구성
7. **유연성**: GlobalVariable, 테스트 데이터 활용으로 하드코딩 금지

=== 입력 형태별 처리 ===
- **구조화된 입력**: 명확한 Steps가 있는 경우 → 직접 매핑
- **자연어 입력**: "구글에서 검색" → 브라우저 열기, 구글 이동, 검색창 입력 등으로 분해
- **단순 설명**: "로그인 테스트" → ID 입력, PW 입력, 로그인 버튼 클릭으로 추론
- **키워드 나열**: "파일업로드, 확인" → 파일선택, 업로드 버튼, 성공 메시지 확인으로 구성

다음 형식의 JSON만 반환하세요:
{
  "mainActions": [
    {
      "stepDescription": "추론된 또는 명시된 단계 설명",
      "execution": {
        "action": "WebUI 액션",
        "element": "대상 요소", 
        "value": "GlobalVariable.testValue 또는 적절한 변수",
        "objectPath": "Object Repository/PageName/element_name"
      },
      "waitAfter": "필수 시에만 UI 변화 대기"
    }
  ],
  "validationLogic": [
    {
      "expectedPoint": "추론된 검증 포인트",
      "assertion": "적절한 Katalon 검증 액션",
      "element": "검증 대상 요소",
      "expectedValue": "GlobalVariable 또는 변수",
      "objectPath": "Object Repository 경로"
    }
  ],
  "errorHandling": [
    {
      "scenario": "예상 오류 상황",
      "detection": "감지 방법",
      "recovery": "복구 액션",
      "logging": "로그 메시지"
    }
  ],
  "waitStrategies": [
    {
      "element": "대기할 요소",
      "strategy": "waitForElementPresent|waitForElementVisible|waitForElementClickable",
      "timeout": "대기 시간(초)",
      "purpose": "대기 목적"
    }
  ]
}`;

        const result = await this.callGemini(prompt);
        this.analysisResults.step2 = result;
        this.updateProgress(2, `✅ 액션 매핑 완료: ${result.mainActions.length}개 액션, ${result.validationLogic.length}개 검증`);
        return result;
    }

    /**
     * 3단계: 완성도 검토 + 스크립트 생성
     */
    async reviewAndGenerateScript(parsedTC, step1Result, step2Result) {
        this.updateProgress(3, '📝 스크립트 검토 및 최종 생성 중...');

        const prompt = `
앞선 분석 결과를 종합하여 실제 실행 가능한 Katalon Groovy 스크립트를 생성해주세요.

=== 통합 정보 ===
Original TC Summary: "${parsedTC.summary}"
Step1 Result: ${JSON.stringify(step1Result)}
Step2 Result: ${JSON.stringify(step2Result)}

=== 코드 생성 요구사항 ===
1. **간결성 우선**: 불필요한 중복 코드 제거
2. try-catch-finally 구조로 안전성 보장
3. **핵심 주석만**: 각 섹션마다 간단한 주석 (개별 액션마다 불필요)
4. 스크린샷 캡처 포함 (실패 시)
5. **필수 대기만**: 과도한 waitFor 남발 금지
6. 실제 Object Repository 경로 사용
7. **상태 구분**: disabled vs not present 정확히 구분
8. **하드코딩 절대 금지**: 모든 값을 GlobalVariable 또는 변수로 처리

=== 코드 품질 체크리스트 ===
- [ ] 스크립트 길이가 적정한가? (20-40라인 목표)
- [ ] 중복된 waitFor나 comment가 없는가?
- [ ] disabled 상태 검증에 적절한 액션을 사용했는가?
- [ ] 논리적 모순이 없는가? (존재확인→바로존재안함확인 등)
- [ ] 핵심 기능만 포함되고 부차적 요소는 제거했는가?
- [ ] **절대 필수**: 하드코딩된 문자열이 전혀 없는가?
- [ ] **반복 최적화**: 비슷한 검증 로직이 효율적으로 처리되었는가?
- [ ] **유연성**: GlobalVariable이나 테스트 데이터를 적절히 활용했는가?

완전한 Groovy 스크립트를 반환하세요. JSON이 아닌 순수 코드로만 반환하세요.

**중요**: import 구문, def 변수 선언, 함수 정의 없이 바로 try 블록부터 시작하세요.

스크립트 구조:
try {
    // === Environment Setup ===
    // 구글 홈페이지 접속
    WebUI.navigateToUrl('https://www.google.com')
    WebUI.waitForPageLoad(10)
    
    // === Test Actions ===  
    // 인풋박스 클릭 및 텍스트 입력
    WebUI.click(findTestObject('GoogleHomePage/input_search'))
    WebUI.setText(findTestObject('GoogleHomePage/input_search'), '테스트값')
    
    // === Result Validation ===
    // 입력된 텍스트 검증
    WebUI.verifyElementAttributeValue(findTestObject('GoogleHomePage/input_search'), 'value', '테스트값', 10)
    
} catch (Exception e) {
    WebUI.takeScreenshot('failure_screenshot_' + System.currentTimeMillis() + '.png')
    WebUI.comment("Test failed: " + e.getMessage())
    throw e
} finally {
    WebUI.closeBrowser()
}

추가 검토: 스크립트 생성 후 실행 불가능한 코드, Object Repository 일관성, 논리적 순서, 예외 처리 완전성, 검증 로직 충분성을 자체 점검하여 수정하세요.`;

        const result = await this.callGemini(prompt);
        this.analysisResults.step3 = result;
        
        // 코드 블록 마크다운 제거
        let cleanedResult = result;
        if (typeof result === 'string') {
            cleanedResult = result
                .replace(/^```groovy\s*/g, '')  // 시작 부분 제거
                .replace(/```\s*$/g, '')        // 끝 부분 제거
                .trim();
        }
        
        this.updateProgress(3, '✅ 최종 스크립트 생성 완료!');
        return cleanedResult;
    }

    /**
     * AI 기반 스크립트 품질 평가 함수
     */
    async evaluateScriptQuality(script) {
        const prompt = `다음 Katalon Groovy 스크립트를 전문가 수준에서 100점 만점으로 평가해주세요.

=== 평가 대상 스크립트 ===
${script}

=== 평가 기준 ===
1. **코드 품질 (30점)**
   - 정확한 Katalon WebUI 액션 사용
   - 입력창 텍스트 검증 방법 (verifyElementAttributeValue vs verifyTextEquals)
   - 예외 처리 완전성
   - 논리적 순서

2. **실행 가능성 (25점)**
   - 실제 실행 시 오류 발생 가능성
   - Object Repository 경로 타당성
   - 필수 대기 로직 적절성
   - 브라우저 제어 완전성

3. **효율성 (20점)**
   - 불필요한 코드 제거 정도
   - 중복 로직 최소화
   - 적절한 스크립트 길이
   - 성능 최적화

4. **가독성 (15점)**
   - 주석의 적절성과 명확성
   - 코드 구조화 수준
   - 변수명과 경로명 직관성

5. **표준 준수 (10점)**
   - Katalon 표준 코딩 규칙
   - GlobalVariable 활용
   - 하드코딩 방지
   - 함수 정의 없이 직접 실행

=== 특별 감점 요소 ===
- import 구문 존재: -5점
- def 변수 선언: -5점  
- 함수 정의 (def functionName): -10점
- 하드코딩된 URL: -10점
- 입력창에 verifyTextEquals 사용: -15점
- 불필요한 delay: -5점
- 과도한 요소 존재 확인: -5점
- 불필요한 헤더 주석: -3점

다음 JSON 형식으로만 반환하세요:
{
  "score": 85,
  "grade": "양호",
  "issues": ["구체적인 문제점1", "구체적인 문제점2"],
  "strengths": ["잘된 부분1", "잘된 부분2"],
  "recommendation": "개선 권장사항"
}`;

        try {
            console.log('🤖 AI 스크립트 품질 평가 시작...');
            
            const result = await this.callGemini(prompt);
            console.log('✅ AI 평가 완료:', result);
            
            // JSON 파싱 시도
            if (typeof result === 'string') {
                try {
                    const cleanedResult = result
                        .replace(/```json\s*/g, '')
                        .replace(/```\s*/g, '')
                        .trim();
                    
                    const jsonStart = cleanedResult.indexOf('{');
                    const jsonEnd = cleanedResult.lastIndexOf('}');
                    
                    if (jsonStart !== -1 && jsonEnd !== -1) {
                        const jsonText = cleanedResult.substring(jsonStart, jsonEnd + 1);
                        return JSON.parse(jsonText);
                    }
                } catch (parseError) {
                    console.warn('AI 평가 JSON 파싱 실패:', parseError);
                }
            } else if (typeof result === 'object') {
                return result;
            }
            
            // Fallback: 기본 응답
            return {
                score: 75,
                grade: "보통",
                issues: ["AI 평가 파싱 실패"],
                strengths: ["기본 구조 양호"],
                recommendation: "수동 검토 필요"
            };
            
        } catch (error) {
            console.error('❌ AI 평가 실패:', error);
            
            // 에러 발생 시 기본 평가
            return {
                score: 70,
                grade: "평가불가",
                issues: ["AI 평가 시스템 오류"],
                strengths: ["코드 생성 완료"],
                recommendation: "네트워크 연결 확인 후 재시도"
            };
        }
    }

    /**
     * AI 평가 결과 표시 함수
     */
    async displayScriptScore(script) {
        const panel = document.getElementById('scriptScorePanel');
        const circle = document.getElementById('scoreCircle');
        const value = document.getElementById('scoreValue');
        const details = document.getElementById('scoreDetails');
        
        if (!panel || !circle || !value || !details) return;
        
        // 로딩 상태 표시
        panel.style.display = 'block';
        value.textContent = '...';
        circle.className = 'score-circle score-fair';
        details.textContent = '🤖 AI가 평가 중...\n잠시만 기다려주세요';
        
        try {
            // AI 평가 실행
            const evaluation = await this.evaluateScriptQuality(script);
            
            // 점수에 따른 등급 및 색상 결정
            let className;
            if (evaluation.score >= 90) {
                className = 'score-excellent';
            } else if (evaluation.score >= 80) {
                className = 'score-good';
            } else if (evaluation.score >= 70) {
                className = 'score-fair';
            } else {
                className = 'score-poor';
            }
            
            // UI 업데이트
            value.textContent = evaluation.score;
            circle.className = `score-circle ${className}`;
            
            // 상세 정보 구성
            let detailText = `등급: ${evaluation.grade}`;
            
            if (evaluation.strengths && evaluation.strengths.length > 0) {
                detailText += `\n\n✅ 잘된 부분:\n• ${evaluation.strengths.join('\n• ')}`;
            }
            
            if (evaluation.issues && evaluation.issues.length > 0) {
                detailText += `\n\n⚠️ 개선사항:\n• ${evaluation.issues.join('\n• ')}`;
            }
            
            if (evaluation.recommendation) {
                detailText += `\n\n💡 권장사항:\n${evaluation.recommendation}`;
            }
            
            details.textContent = detailText;
            
            console.log(`🤖 AI 평가 결과: ${evaluation.score}점 (${evaluation.grade})`);
            
        } catch (error) {
            console.error('❌ 점수 표시 실패:', error);
            
            // 에러 시 기본 표시
            value.textContent = '?';
            circle.className = 'score-circle score-poor';
            details.textContent = '❌ 평가 실패\n네트워크를 확인하고\n다시 시도해주세요';
        }
    }

    /**
     * 유연한 테스트케이스 파싱 (어떤 형태든 처리)
     */
    parseTestcase(text) {
        console.log('🔍 유연한 입력 분석 시작:', text);
        
        // 원본 텍스트 그대로 포함
        const result = { 
            originalInput: text.trim(),
            summary: '', 
            precondition: [], 
            steps: [], 
            expectedResult: '' 
        };

        // 빈 입력 처리
        if (!text || !text.trim()) {
            console.log('❌ 빈 입력');
            return result;
        }

        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        let currentSection = null;

        // 구조화된 형태 파싱 시도
        for (const line of lines) {
            if (line.toLowerCase().includes('summary')) {
                currentSection = 'summary';
                const colonIndex = line.indexOf(':');
                if (colonIndex !== -1) result.summary = line.substring(colonIndex + 1).trim();
            } else if (line.toLowerCase().includes('precondition')) {
                currentSection = 'precondition';
            } else if (line.toLowerCase().includes('steps')) {
                currentSection = 'steps';
            } else if (line.toLowerCase().includes('expected result')) {
                currentSection = 'expectedResult';
                const colonIndex = line.indexOf(':');
                if (colonIndex !== -1) result.expectedResult = line.substring(colonIndex + 1).trim();
            } else if (currentSection === 'precondition' && line) {
                result.precondition.push(line);
            } else if (currentSection === 'steps' && line) {
                result.steps.push(line);
            } else if (currentSection === 'expectedResult' && line) {
                if (result.expectedResult) result.expectedResult += ' ' + line;
                else result.expectedResult = line;
            }
        }

        // 구조화된 데이터가 없으면 자연어/키워드로 판단
        if (!result.summary && !result.steps.length && !result.expectedResult) {
            console.log('🤖 자연어/키워드 입력으로 판단');
            
            // 전체 텍스트를 summary로 설정
            result.summary = text.trim();
            
            // 간단한 키워드 기반 추론
            if (text.toLowerCase().includes('로그인')) {
                result.steps = ['로그인 페이지 이동', 'ID 입력', '비밀번호 입력', '로그인 버튼 클릭'];
                result.expectedResult = '로그인 성공';
            } else if (text.toLowerCase().includes('검색')) {
                result.steps = ['검색 페이지 이동', '검색어 입력', '검색 실행'];
                result.expectedResult = '검색 결과 표시';
            } else if (text.toLowerCase().includes('업로드')) {
                result.steps = ['파일 선택', '업로드 실행'];
                result.expectedResult = '업로드 성공';
            } else {
                // 일반적인 추론
                result.steps = ['테스트 대상 페이지 이동', '필요한 액션 실행'];
                result.expectedResult = '테스트 성공';
            }
        }

        console.log('✅ 파싱 완료:', result);
        return result;
    }

    /**
     * Gemini API 호출 (기존과 동일)
     */
    async callGemini(prompt) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Rate limiting

        const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const resultText = data.candidates[0].content.parts[0].text;

        console.log('📥 Gemini 원본 응답:', resultText);

        // 3단계에서는 순수 코드 반환이므로 JSON 파싱 시도하지 않음
        if (this.currentStep === 3) {
            return resultText;
        }

        // 1,2단계는 JSON 파싱
        try {
            return JSON.parse(resultText);
        } catch (e1) {
            try {
                const cleanedText = resultText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
                return JSON.parse(cleanedText);
            } catch (e2) {
                try {
                    const jsonStart = resultText.indexOf('{');
                    const jsonEnd = resultText.lastIndexOf('}');
                    if (jsonStart !== -1 && jsonEnd !== -1) {
                        const jsonText = resultText.substring(jsonStart, jsonEnd + 1);
                        return JSON.parse(jsonText);
                    }
                } catch (e3) {
                    console.error('JSON 파싱 실패:', e3);
                    return this.getFallbackResponse();
                }
            }
        }
    }

    /**
     * JSON 파싱 실패 시 기본 응답 (기존과 동일)
     */
    getFallbackResponse() {
        return {
            testPurpose: "테스트 목적 파악 실패",
            testScope: "fallback_test",
            environmentSetup: [{
                action: "WebUI.navigateToUrl", 
                target: "https://example.com",
                purpose: "기본 페이지 접속"
            }],
            riskAnalysis: [{
                risk: "요소 로드 실패",
                probability: "medium",
                mitigation: "동적 대기 적용",
                katalonAction: "WebUI.waitForElementPresent"
            }]
        };
    }

    /**
     * UI 업데이트 함수들 (3단계용으로 수정)
     */
    showProgress() {
        document.getElementById('smartProgress').style.display = 'block';
        document.getElementById('smartResult').style.display = 'none';
    }

    updateProgress(step, message) {
        this.currentStep = step;
        
        // 3단계를 6단계로 매핑
        const stepMapping = {
            1: [1, 2], // 1단계 → 1,2단계 표시
            2: [3, 4], // 2단계 → 3,4단계 표시  
            3: [5, 6]  // 3단계 → 5,6단계 표시
        };
        
        const mappedSteps = stepMapping[step] || [];
        
        // 6단계 표시 업데이트
        for (let i = 1; i <= 6; i++) {
            const stepElement = document.getElementById(`step${i}`);
            if (stepElement) {
                if (mappedSteps.includes(i)) {
                    stepElement.className = 'step active';
                } else if (i < Math.min(...mappedSteps)) {
                    stepElement.className = 'step completed';
                } else {
                    stepElement.className = 'step';
                }
            }
        }

        // 상세 정보 업데이트
        const details = document.getElementById('progressDetails');
        if (details) {
            const timestamp = new Date().toLocaleTimeString();
            details.innerHTML += `[${timestamp}] ${message}\n`;
            details.scrollTop = details.scrollHeight;
        }
    }

    showResult(script) {
        document.getElementById('smartResult').style.display = 'block';
        document.getElementById('smartGeneratedScript').textContent = script;
        window.smartGeneratedScript = script;
        
        // 점수 표시 추가 (1초 후)
        setTimeout(async () => {
            await this.displayScriptScore(script);
        }, 1000);
    }
}

// 전역 함수들 (기존과 동일)
window.smartEngine = new SmartMappingEngine();

async function startSmartMapping() {
    const input = document.getElementById('smartTestcaseInput').value.trim();
    if (!input) {
        alert('테스트케이스를 입력해주세요.');
        return;
    }

    const button = document.querySelector('.smart-generate-btn');
    button.disabled = true;
    button.innerHTML = '<span class="smart-loading"></span>🧠 분석 중...';

    try {
        await window.smartEngine.startAnalysis(input);
    } catch (error) {
        alert('분석 실패: ' + error.message);
    } finally {
        button.disabled = false;
        button.innerHTML = '🧠 스마트 분석 시작';
    }
}

function copySmartScript() {
    if (window.smartGeneratedScript) {
        navigator.clipboard.writeText(window.smartGeneratedScript).then(() => {
            alert('✅ 스크립트가 클립보드에 복사되었습니다');
        });
    }
}

function downloadSmartScript() {
    if (window.smartGeneratedScript) {
        const blob = new Blob([window.smartGeneratedScript], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'smart_katalon_script.groovy';
        a.click();
        URL.revokeObjectURL(url);
    }
}

console.log('✅ 스마트 매핑 엔진 3단계 버전 로드 완료 (점수 표시 기능 포함)');
