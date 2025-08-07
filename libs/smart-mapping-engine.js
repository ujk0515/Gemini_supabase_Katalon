// /**
//  * 스마트 매핑 엔진 - Gemini AI 기반 6단계 분석
//  * libs/smart-mapping-engine.js
//  */

// class SmartMappingEngine {
//     constructor() {
//         this.apiKey = 'AIzaSyDE-edho0DTkfMbsGF9XoiOQgCPkVJInzU';
//         this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent';
//         // this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
//         this.analysisResults = {};
//         this.currentStep = 0;
//     }

//     /**
//      * 메인 분석 프로세스 시작
//      */
//     async startAnalysis(testcaseText) {
//         try {
//             this.showProgress();
//             this.updateProgress(0, '분석 시작...');

//             // 테스트케이스 파싱
//             const parsedTC = this.parseTestcase(testcaseText);

//             // 6단계 순차 분석
//             const step1 = await this.analyzeSummary(parsedTC.summary);
//             const step2 = await this.analyzeTestConditions(parsedTC);
//             const step3 = await this.verifyEnvironment(parsedTC.precondition, step2);
//             const step4 = await this.mapStepActions(parsedTC.steps, step3);
//             const step5 = await this.verifyConditionConflicts(step4, step3);
//             const step6 = await this.verifyResultConvergence(parsedTC.expectedResult, step5);

//             // 최종 스크립트 생성
//             const finalScript = await this.generateFinalScript(step1, step2, step3, step4, step5, step6);

//             this.showResult(finalScript);
//             return finalScript;

//         } catch (error) {
//             console.error('스마트 분석 실패:', error);
//             this.updateProgress(-1, `❌ 분석 실패: ${error.message}`);
//             throw error;
//         }
//     }

//     /**
//      * 1단계: Summary 이해
//      */
//     async analyzeSummary(summary) {
//         this.updateProgress(1, '📖 Summary 분석 중...');

//         const prompt = `
// 테스트 Summary를 분석하여 테스트의 목적과 범위를 파악해주세요.

// Summary: "${summary}"

// 다음 형식의 JSON만 반환하세요:
// {
//   "testPurpose": "테스트의 주요 목적",
//   "testScope": "테스트 범위 (예: login_flow, user_registration)",
//   "mainComponents": ["주요 컴포넌트1", "주요 컴포넌트2"],
//   "testType": "functional|integration|ui|api",
//   "complexity": "simple|medium|complex"
// }`;

//         const result = await this.callGemini(prompt);
//         this.analysisResults.step1 = result;
//         this.updateProgress(1, `✅ Summary 분석 완료: ${result.testPurpose}`);
//         return result;
//     }

//     /**
//      * 2단계: 전체 TC 조건 파악
//      */
//     async analyzeTestConditions(parsedTC) {
//         this.updateProgress(2, '🔍 전체 테스트 조건 분석 중...');

//         const prompt = `
// 전체 테스트케이스를 분석하여 시작조건부터 최종결과까지의 흐름을 파악해주세요.

// Summary: "${parsedTC.summary}"
// Precondition: ${JSON.stringify(parsedTC.precondition)}
// Steps: ${JSON.stringify(parsedTC.steps)}
// Expected Result: "${parsedTC.expectedResult}"

// 다음 형식의 JSON만 반환하세요:
// {
//   "testFlow": ["setup", "action1", "action2", "verification"],
//   "dependencies": ["dependency1", "dependency2"],
//   "criticalPath": ["중요한 단계1", "중요한 단계2"],
//   "validationPoints": ["검증포인트1", "검증포인트2"],
//   "riskFactors": ["위험요소1", "위험요소2"]
// }`;

//         const result = await this.callGemini(prompt);
//         this.analysisResults.step2 = result;
//         this.updateProgress(2, `✅ 테스트 조건 분석 완료: ${result.testFlow.length}단계 플로우`);
//         return result;
//     }

//     /**
//      * 3단계: 환경 구성 검증
//      */
//     async verifyEnvironment(preconditions, testConditions) {
//         this.updateProgress(3, '🛠️ 환경 구성 분석 중...');

//         const prompt = `
// Precondition을 분석하여 테스트 환경 설정 방법을 결정해주세요.

// Preconditions: ${JSON.stringify(preconditions)}
// Test Flow: ${JSON.stringify(testConditions.testFlow)}

// 다음 형식의 JSON만 반환하세요:
// {
//   "setupActions": [
//     {
//       "action": "WebUI.navigateToUrl",
//       "target": "https://example.com/login",
//       "purpose": "로그인 페이지 접속"
//     }
//   ],
//   "environmentChecks": [
//     {
//       "check": "WebUI.verifyElementPresent",
//       "element": "login_form",
//       "purpose": "로그인 폼 존재 확인"
//     }
//   ],
//   "prerequisites": ["browser_open", "network_connection"]
// }`;

//         const result = await this.callGemini(prompt);
//         this.analysisResults.step3 = result;
//         this.updateProgress(3, `✅ 환경 구성 완료: ${result.setupActions.length}개 설정 액션`);
//         return result;
//     }

//     /**
//      * 4단계: 스텝별 동작 매핑
//      */
//     async mapStepActions(steps, environmentSetup) {
//         this.updateProgress(4, '⚡ 스텝 동작 매핑 중...');

//         const prompt = `
// 각 테스트 스텝을 Katalon WebUI 액션으로 매핑해주세요.

// Steps: ${JSON.stringify(steps)}
// Environment: ${JSON.stringify(environmentSetup)}

// 다음 형식의 JSON만 반환하세요:
// {
//   "actionMappings": [
//     {
//       "step": "1. 아이디 입력 필드에 테스트 계정 입력",
//       "action": "WebUI.setText",
//       "element": "id_field",
//       "value": "test@example.com",
//       "objectRepository": "Object Repository/LoginPage/id_input_field"
//     }
//   ]
// }`;

//         const result = await this.callGemini(prompt);
//         this.analysisResults.step4 = result;
//         this.updateProgress(4, `✅ 동작 매핑 완료: ${result.actionMappings.length}개 액션`);
//         return result;
//     }

//     /**
//      * 5단계: 조건 충돌 검증
//      */
//     async verifyConditionConflicts(actionMappings, environmentSetup) {
//         this.updateProgress(5, '⚠️ 조건 충돌 검증 중...');

//         const prompt = `
// 실행 중 발생할 수 있는 예외상황과 에러 처리를 분석해주세요.

// Action Mappings: ${JSON.stringify(actionMappings)}
// Environment: ${JSON.stringify(environmentSetup)}

// 다음 형식의 JSON만 반환하세요:
// {
//   "errorHandling": [
//     {
//       "scenario": "element_not_found",
//       "action": "WebUI.waitForElementPresent",
//       "fallback": "WebUI.comment('Element not found, test failed')"
//     }
//   ],
//   "conditionalChecks": [
//     {
//       "condition": "WebUI.verifyElementClickable",
//       "element": "login_button",
//       "beforeAction": "click"
//     }
//   ]
// }`;

//         const result = await this.callGemini(prompt);
//         this.analysisResults.step5 = result;
//         this.updateProgress(5, `✅ 충돌 검증 완료: ${result.errorHandling.length}개 예외 처리`);
//         return result;
//     }

//     /**
//      * 6단계: 결과 수렴 검증
//      */
//     async verifyResultConvergence(expectedResult, conflictAnalysis) {
//         this.updateProgress(6, '🎯 결과 수렴 검증 중...');

//         const prompt = `
// Expected Result가 달성되는지 검증하는 로직을 설계해주세요.

// Expected Result: "${expectedResult}"
// Error Handling: ${JSON.stringify(conflictAnalysis)}

// 다음 형식의 JSON만 반환하세요:
// {
//   "validationLogic": [
//     {
//       "assertion": "WebUI.verifyElementVisible",
//       "element": "main_dashboard",
//       "purpose": "로그인 성공 후 메인 페이지 표시 확인"
//     }
//   ],
//   "successCriteria": ["page_redirect", "element_visible", "no_error_message"],
//   "finalActions": [
//     {
//       "action": "WebUI.closeBrowser",
//       "purpose": "테스트 완료 후 정리"
//     }
//   ]
// }`;

//         const result = await this.callGemini(prompt);
//         this.analysisResults.step6 = result;
//         this.updateProgress(6, `✅ 결과 검증 완료: ${result.validationLogic.length}개 검증 로직`);
//         return result;
//     }

//     /**
//      * 최종 스크립트 생성
//      */
//     async generateFinalScript(step1, step2, step3, step4, step5, step6) {
//         this.updateProgress(7, '📝 최종 스크립트 생성 중...');

//         const timestamp = new Date().toLocaleString();

//         let script = `// ========================================
// // Katalon Smart Generated Test Script
// // Purpose: ${step1.testPurpose}
// // Generated at: ${timestamp}
// // ========================================
// @Test
// def ${step1.testScope?.replace(/[^a-zA-Z0-9]/g, '_') || 'loginFunctionalTest'}() {
//     try {
        
//         // === Environment Setup ===\n`;

//         // Setup Actions
//         step3.setupActions?.forEach(setup => {
//             script += `        // ${setup.purpose}\n`;
//             if (setup.action === 'WebUI.navigateToUrl') {
//                 script += `        ${setup.action}('${setup.target}')\n`;
//             } else if (setup.action !== 'prepareTestData') {
//                 script += `        ${setup.action}('${setup.target}')\n`;
//             }
//         });

//         script += `\n        // === Test Actions ===\n`;

//         // Main Actions
//         step4.actionMappings?.forEach(mapping => {
//             script += `        // ${mapping.step}\n`;
//             if (mapping.value) {
//                 // 비밀번호 필드는 암호화된 텍스트 사용
//                 if (mapping.step.includes('비밀번호') || mapping.step.includes('password')) {
//                     script += `        WebUI.setEncryptedText(findTestObject('${mapping.objectRepository}'), 'encrypted_password')\n`;
//                 } else {
//                     script += `        ${mapping.action}(findTestObject('${mapping.objectRepository}'), '${mapping.value}')\n`;
//                 }
//             } else {
//                 script += `        ${mapping.action}(findTestObject('${mapping.objectRepository}'))\n`;
//             }
//         });

//         script += `\n        // === Result Validation ===\n`;

//         // Validation Logic
//         step6.validationLogic?.forEach(validation => {
//             script += `        // ${validation.purpose}\n`;
//             if (validation.assertion === 'WebUI.verifyUrl') {
//                 script += `        ${validation.assertion}('https://example.com/dashboard')\n`;
//             } else {
//                 script += `        ${validation.assertion}(findTestObject('Object Repository/${validation.element}'))\n`;
//             }
//         });

//         script += `
//     } catch (Exception e) {
//         WebUI.comment("Test failed: " + e.getMessage())
//         throw e
//     } finally {
//         WebUI.closeBrowser()
//     }
// }`;

//         this.updateProgress(7, '✅ 스마트 분석 완료!');
//         return script;
//     }

//     /**
//      * 테스트케이스 파싱
//      */
//     parseTestcase(text) {
//         const lines = text.split('\n').map(line => line.trim()).filter(line => line);
//         const result = { summary: '', precondition: [], steps: [], expectedResult: '' };

//         let currentSection = null;

//         for (const line of lines) {
//             if (line.toLowerCase().includes('summary')) {
//                 currentSection = 'summary';
//                 const colonIndex = line.indexOf(':');
//                 if (colonIndex !== -1) result.summary = line.substring(colonIndex + 1).trim();
//             } else if (line.toLowerCase().includes('precondition')) {
//                 currentSection = 'precondition';
//             } else if (line.toLowerCase().includes('steps')) {
//                 currentSection = 'steps';
//             } else if (line.toLowerCase().includes('expected result')) {
//                 currentSection = 'expectedResult';
//                 const colonIndex = line.indexOf(':');
//                 if (colonIndex !== -1) result.expectedResult = line.substring(colonIndex + 1).trim();
//             } else if (currentSection === 'precondition' && line) {
//                 result.precondition.push(line);
//             } else if (currentSection === 'steps' && line) {
//                 result.steps.push(line);
//             } else if (currentSection === 'expectedResult' && line) {
//                 if (result.expectedResult) result.expectedResult += ' ' + line;
//                 else result.expectedResult = line;
//             }
//         }

//         return result;
//     }

//     /**
//      * Gemini API 호출 (강화된 JSON 파싱)
//      */
//     async callGemini(prompt) {
//         await new Promise(resolve => setTimeout(resolve, 5000)); // Rate limiting

//         const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//                 contents: [{ parts: [{ text: prompt }] }]
//             })
//         });

//         if (!response.ok) {
//             throw new Error(`API Error: ${response.status}`);
//         }

//         const data = await response.json();
//         const resultText = data.candidates[0].content.parts[0].text;

//         console.log('📥 Gemini 원본 응답:', resultText);

//         // 강화된 JSON 파싱
//         try {
//             // 1차: 기본 JSON 파싱 시도
//             return JSON.parse(resultText);
//         } catch (e1) {
//             try {
//                 // 2차: 코드 블록 제거 후 파싱
//                 const cleanedText = resultText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
//                 return JSON.parse(cleanedText);
//             } catch (e2) {
//                 try {
//                     // 3차: JSON 블록 추출
//                     const jsonStart = resultText.indexOf('{');
//                     const jsonEnd = resultText.lastIndexOf('}');

//                     if (jsonStart !== -1 && jsonEnd !== -1) {
//                         const jsonText = resultText.substring(jsonStart, jsonEnd + 1);
//                         return JSON.parse(jsonText);
//                     }
//                 } catch (e3) {
//                     try {
//                         // 4차: 문제 문자 정리 후 파싱
//                         let fixedText = resultText
//                             .replace(/```json\s*/g, '')
//                             .replace(/```\s*/g, '')
//                             .replace(/[\u201C\u201D]/g, '"')  // 스마트 따옴표 수정
//                             .replace(/[\u2018\u2019]/g, "'")  // 스마트 아포스트로피 수정
//                             .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')  // 키를 따옴표로 감싸기
//                             .trim();

//                         const jsonStart = fixedText.indexOf('{');
//                         const jsonEnd = fixedText.lastIndexOf('}');

//                         if (jsonStart !== -1 && jsonEnd !== -1) {
//                             const jsonText = fixedText.substring(jsonStart, jsonEnd + 1);
//                             return JSON.parse(jsonText);
//                         }
//                     } catch (e4) {
//                         console.error('JSON 파싱 모든 시도 실패:', e4);
//                         console.error('원본 텍스트:', resultText);

//                         // 5차: 기본 fallback 객체 반환
//                         return this.getFallbackResponse();
//                     }
//                 }
//             }
//         }

//         throw new Error('Invalid JSON response from Gemini');
//     }

//     /**
//      * JSON 파싱 실패 시 기본 응답
//      */
//     getFallbackResponse() {
//         return {
//             errorHandling: [
//                 {
//                     scenario: "element_not_found",
//                     action: "WebUI.waitForElementPresent",
//                     fallback: "WebUI.comment('Element not found, test failed')"
//                 }
//             ],
//             conditionalChecks: [
//                 {
//                     condition: "WebUI.verifyElementClickable",
//                     element: "target_element",
//                     beforeAction: "click"
//                 }
//             ],
//             validationLogic: [
//                 {
//                     assertion: "WebUI.verifyElementVisible",
//                     element: "result_element",
//                     purpose: "결과 확인"
//                 }
//             ],
//             successCriteria: ["page_loaded", "element_visible"],
//             finalActions: [
//                 {
//                     action: "WebUI.closeBrowser",
//                     purpose: "테스트 완료 후 정리"
//                 }
//             ]
//         };
//     }

//     /**
//      * UI 업데이트 함수들
//      */
//     showProgress() {
//         document.getElementById('smartProgress').style.display = 'block';
//         document.getElementById('smartResult').style.display = 'none';
//     }

//     updateProgress(step, message) {
//         // 단계 표시 업데이트
//         for (let i = 1; i <= 6; i++) {
//             const stepElement = document.getElementById(`step${i}`);
//             if (i < step) {
//                 stepElement.className = 'step completed';
//             } else if (i === step) {
//                 stepElement.className = 'step active';
//             } else {
//                 stepElement.className = 'step';
//             }
//         }

//         // 상세 정보 업데이트
//         const details = document.getElementById('progressDetails');
//         const timestamp = new Date().toLocaleTimeString();
//         details.innerHTML += `[${timestamp}] ${message}\n`;
//         details.scrollTop = details.scrollHeight;
//     }

//     showResult(script) {
//         document.getElementById('smartResult').style.display = 'block';
//         document.getElementById('smartGeneratedScript').textContent = script;
//         window.smartGeneratedScript = script; // 전역 저장
//     }
// }

// // 전역 함수들
// window.smartEngine = new SmartMappingEngine();

// async function startSmartMapping() {
//     const input = document.getElementById('smartTestcaseInput').value.trim();
//     if (!input) {
//         alert('테스트케이스를 입력해주세요.');
//         return;
//     }

//     const button = document.querySelector('.smart-generate-btn');
//     button.disabled = true;
//     button.innerHTML = '<span class="smart-loading"></span>🧠 분석 중...';

//     try {
//         await window.smartEngine.startAnalysis(input);
//     } catch (error) {
//         alert('분석 실패: ' + error.message);
//     } finally {
//         button.disabled = false;
//         button.innerHTML = '🧠 스마트 분석 시작';
//     }
// }

// function copySmartScript() {
//     if (window.smartGeneratedScript) {
//         navigator.clipboard.writeText(window.smartGeneratedScript).then(() => {
//             alert('✅ 스크립트가 클립보드에 복사되었습니다');
//         });
//     }
// }

// function downloadSmartScript() {
//     if (window.smartGeneratedScript) {
//         const blob = new Blob([window.smartGeneratedScript], { type: 'text/plain' });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement('a');
//         a.href = url;
//         a.download = 'smart_katalon_script.groovy';
//         a.click();
//         URL.revokeObjectURL(url);
//     }
// }

// console.log('✅ 스마트 매핑 엔진 로드 완료');

/**
 * 스마트 매핑 엔진 - 3단계 분석 버전
 * libs/smart-mapping-engine.js
 */

/**
 * 스마트 매핑 엔진 - 3단계 분석 버전
 * libs/smart-mapping-engine.js
 */

/**
 * 스마트 매핑 엔진 - 3단계 분석 버전
 * libs/smart-mapping-engine.js
 */

/**
 * 스마트 매핑 엔진 - 3단계 분석 버전
 * libs/smart-mapping-engine.js
 */

/**
 * 스마트 매핑 엔진 - 3단계 분석 버전
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
     * 1단계: 상황 파악 + 환경 설정
     */
    async analyzeSituationAndEnvironment(parsedTC) {
        this.updateProgress(1, '🔍 상황 파악 및 환경 설정 분석 중...');

        const prompt = `
테스트케이스를 종합 분석하여 테스트 목적을 파악하고 환경 설정을 결정해주세요.

=== 테스트케이스 정보 ===
Summary: "${parsedTC.summary}"
Precondition: ${JSON.stringify(parsedTC.precondition)}
Steps: ${JSON.stringify(parsedTC.steps)}
Expected Result: "${parsedTC.expectedResult}"

=== 분석 요구사항 ===
1. 테스트의 핵심 목적과 검증 포인트 파악
2. Precondition 기반 사전 환경 설정 액션 결정 (핵심만)
3. 테스트 실행 중 발생 가능한 주요 예외상황 3가지 예측
4. 각 예외상황별 간단한 대응 방안 수립
5. Object Repository 경로 구조 설계

** 중요 제약사항 **
- Precondition을 2-3개 핵심 액션으로만 분해 (과도한 세분화 금지)
- 중복 대기 로직 최소화
- 각 액션은 반드시 필요한 경우에만 포함

** 절대 금지사항 **
- 하드코딩된 문자열 사용 금지 (URL, 데이터값 등)
- 모든 값은 GlobalVariable, 테스트 데이터, 또는 변수로 처리
- '유효한 인증번호', '회원가입 페이지 URL' 같은 placeholder 금지

다음 형식의 JSON만 반환하세요:
{
  "testPurpose": "테스트의 핵심 목적 (한 문장)",
  "testScope": "groovy_method_name_format",
  "environmentSetup": [
    {
      "action": "WebUI.navigateToUrl",
      "target": "구체적인 URL 또는 변수명", 
      "purpose": "설정 목적",
      "waitCondition": "WebUI.waitForPageLoad|WebUI.waitForElementPresent"
    }
  ],
  "preConditionActions": [
    {
      "step": "핵심 사전 조건만 (2-3개)",
      "action": "Katalon 액션", 
      "element": "대상 요소",
      "value": "입력값 (해당시)",
      "objectPath": "Object Repository 경로"
    }
  ],
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
     * 2단계: 핵심 액션 + 검증 통합
     */
    async mapActionsAndValidation(parsedTC, step1Result) {
        this.updateProgress(2, '⚡ 액션 매핑 및 검증 로직 설계 중...');

        const prompt = `
테스트 Steps와 Expected Result를 분석하여 실행 액션과 검증 로직을 통합 설계해주세요.

=== 입력 정보 ===
Steps: ${JSON.stringify(parsedTC.steps)}
Expected Result: "${parsedTC.expectedResult}"
Environment Setup: ${JSON.stringify(step1Result.environmentSetup)}
Risk Analysis: ${JSON.stringify(step1Result.riskAnalysis)}

=== 설계 요구사항 ===
1. 각 Step을 정확한 Katalon WebUI 액션으로 매핑
2. Expected Result의 모든 검증 포인트를 개별 assertion으로 분리  
3. **중요**: disabled/enabled 상태와 present/not present 구분 정확히
4. 실패 시 명확한 에러 메시지와 스크린샷 캡처
5. **간결성**: 필수 대기 로직만 포함, 중복 제거
6. Object Repository 경로를 실무 표준에 맞게 구성
7. **반복 패턴 최소화**: 비슷한 검증은 배열이나 반복문 고려
8. **유연성**: GlobalVariable, 테스트 데이터 활용으로 하드코딩 금지

다음 형식의 JSON만 반환하세요:
{
  "mainActions": [
    {
      "stepDescription": "Steps의 원본 설명",
      "execution": {
        "action": "주 실행 액션",
        "element": "대상 요소", 
        "value": "입력값 (해당시)",
        "objectPath": "Object Repository/PageName/element_name"
      },
      "waitAfter": "필수 시에만 UI 변화 대기"
    }
  ],
  "validationLogic": [
    {
      "expectedPoint": "Expected Result의 각 포인트",
      "assertion": "정확한 Katalon 검증 액션 (disabled=verifyElementNotClickable, not present=verifyElementNotPresent)",
      "element": "검증 대상 요소",
      "expectedValue": "예상값",
      "objectPath": "Object Repository 경로"
    }
  ],
  "errorHandling": [
    {
      "scenario": "오류 시나리오",
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

스크립트 구조:
// ========================================
// Katalon Smart Generated Test Script  
// Purpose: [구체적인 테스트 목적]
// Generated at: [타임스탬프]
// ========================================
@Test
def [메소드명]() {
    try {
        // === Environment Setup ===
        [환경 설정 코드]
        
        // === Test Actions ===  
        [테스트 실행 코드]
        
        // === Result Validation ===
        [결과 검증 코드]
        
    } catch (Exception e) {
        WebUI.takeScreenshot('failure_screenshot_' + System.currentTimeMillis() + '.png')
        WebUI.comment("Test failed: " + e.getMessage())
        throw e
    } finally {
        WebUI.closeBrowser()
    }
}

추가 검토: 스크립트 생성 후 실행 불가능한 코드, Object Repository 일관성, 논리적 순서, 예외 처리 완전성, 검증 로직 충분성을 자체 점검하여 수정하세요.`;

        const result = await this.callGemini(prompt);
        this.analysisResults.step3 = result;
        this.updateProgress(3, '✅ 최종 스크립트 생성 완료!');
        return result;
    }

    /**
     * 테스트케이스 파싱 (기존과 동일)
     */
    parseTestcase(text) {
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        const result = { summary: '', precondition: [], steps: [], expectedResult: '' };

        let currentSection = null;

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
        window.smartGeneratedScript = script; // 전역 저장
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

console.log('✅ 스마트 매핑 엔진 3단계 버전 로드 완료');

