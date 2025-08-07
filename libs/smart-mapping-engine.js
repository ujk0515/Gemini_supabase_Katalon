/**
 * 스마트 매핑 엔진 - Gemini AI 기반 6단계 분석
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
     * 메인 분석 프로세스 시작
     */
    async startAnalysis(testcaseText) {
        try {
            this.showProgress();
            this.updateProgress(0, '분석 시작...');

            // 테스트케이스 파싱
            const parsedTC = this.parseTestcase(testcaseText);

            // 6단계 순차 분석
            const step1 = await this.analyzeSummary(parsedTC.summary);
            const step2 = await this.analyzeTestConditions(parsedTC);
            const step3 = await this.verifyEnvironment(parsedTC.precondition, step2);
            const step4 = await this.mapStepActions(parsedTC.steps, step3);
            const step5 = await this.verifyConditionConflicts(step4, step3);
            const step6 = await this.verifyResultConvergence(parsedTC.expectedResult, step5);

            // 최종 스크립트 생성
            const finalScript = await this.generateFinalScript(step1, step2, step3, step4, step5, step6);

            this.showResult(finalScript);
            return finalScript;

        } catch (error) {
            console.error('스마트 분석 실패:', error);
            this.updateProgress(-1, `❌ 분석 실패: ${error.message}`);
            throw error;
        }
    }

    /**
     * 1단계: Summary 이해
     */
    async analyzeSummary(summary) {
        this.updateProgress(1, '📖 Summary 분석 중...');

        const prompt = `
테스트 Summary를 분석하여 테스트의 목적과 범위를 파악해주세요.

Summary: "${summary}"

다음 형식의 JSON만 반환하세요:
{
  "testPurpose": "테스트의 주요 목적",
  "testScope": "테스트 범위 (예: login_flow, user_registration)",
  "mainComponents": ["주요 컴포넌트1", "주요 컴포넌트2"],
  "testType": "functional|integration|ui|api",
  "complexity": "simple|medium|complex"
}`;

        const result = await this.callGemini(prompt);
        this.analysisResults.step1 = result;
        this.updateProgress(1, `✅ Summary 분석 완료: ${result.testPurpose}`);
        return result;
    }

    /**
     * 2단계: 전체 TC 조건 파악
     */
    async analyzeTestConditions(parsedTC) {
        this.updateProgress(2, '🔍 전체 테스트 조건 분석 중...');

        const prompt = `
전체 테스트케이스를 분석하여 시작조건부터 최종결과까지의 흐름을 파악해주세요.

Summary: "${parsedTC.summary}"
Precondition: ${JSON.stringify(parsedTC.precondition)}
Steps: ${JSON.stringify(parsedTC.steps)}
Expected Result: "${parsedTC.expectedResult}"

다음 형식의 JSON만 반환하세요:
{
  "testFlow": ["setup", "action1", "action2", "verification"],
  "dependencies": ["dependency1", "dependency2"],
  "criticalPath": ["중요한 단계1", "중요한 단계2"],
  "validationPoints": ["검증포인트1", "검증포인트2"],
  "riskFactors": ["위험요소1", "위험요소2"]
}`;

        const result = await this.callGemini(prompt);
        this.analysisResults.step2 = result;
        this.updateProgress(2, `✅ 테스트 조건 분석 완료: ${result.testFlow.length}단계 플로우`);
        return result;
    }

    /**
     * 3단계: 환경 구성 검증
     */
    async verifyEnvironment(preconditions, testConditions) {
        this.updateProgress(3, '🛠️ 환경 구성 분석 중...');

        const prompt = `
Precondition을 분석하여 테스트 환경 설정 방법을 결정해주세요.

Preconditions: ${JSON.stringify(preconditions)}
Test Flow: ${JSON.stringify(testConditions.testFlow)}

다음 형식의 JSON만 반환하세요:
{
  "setupActions": [
    {
      "action": "WebUI.navigateToUrl",
      "target": "https://example.com/login",
      "purpose": "로그인 페이지 접속"
    }
  ],
  "environmentChecks": [
    {
      "check": "WebUI.verifyElementPresent",
      "element": "login_form",
      "purpose": "로그인 폼 존재 확인"
    }
  ],
  "prerequisites": ["browser_open", "network_connection"]
}`;

        const result = await this.callGemini(prompt);
        this.analysisResults.step3 = result;
        this.updateProgress(3, `✅ 환경 구성 완료: ${result.setupActions.length}개 설정 액션`);
        return result;
    }

    /**
     * 4단계: 스텝별 동작 매핑
     */
    async mapStepActions(steps, environmentSetup) {
        this.updateProgress(4, '⚡ 스텝 동작 매핑 중...');

        const prompt = `
각 테스트 스텝을 Katalon WebUI 액션으로 매핑해주세요.

Steps: ${JSON.stringify(steps)}
Environment: ${JSON.stringify(environmentSetup)}

다음 형식의 JSON만 반환하세요:
{
  "actionMappings": [
    {
      "step": "1. 아이디 입력 필드에 테스트 계정 입력",
      "action": "WebUI.setText",
      "element": "id_field",
      "value": "test@example.com",
      "objectRepository": "Object Repository/LoginPage/id_input_field"
    }
  ]
}`;

        const result = await this.callGemini(prompt);
        this.analysisResults.step4 = result;
        this.updateProgress(4, `✅ 동작 매핑 완료: ${result.actionMappings.length}개 액션`);
        return result;
    }

    /**
     * 5단계: 조건 충돌 검증
     */
    async verifyConditionConflicts(actionMappings, environmentSetup) {
        this.updateProgress(5, '⚠️ 조건 충돌 검증 중...');

        const prompt = `
실행 중 발생할 수 있는 예외상황과 에러 처리를 분석해주세요.

Action Mappings: ${JSON.stringify(actionMappings)}
Environment: ${JSON.stringify(environmentSetup)}

다음 형식의 JSON만 반환하세요:
{
  "errorHandling": [
    {
      "scenario": "element_not_found",
      "action": "WebUI.waitForElementPresent",
      "fallback": "WebUI.comment('Element not found, test failed')"
    }
  ],
  "conditionalChecks": [
    {
      "condition": "WebUI.verifyElementClickable",
      "element": "login_button",
      "beforeAction": "click"
    }
  ]
}`;

        const result = await this.callGemini(prompt);
        this.analysisResults.step5 = result;
        this.updateProgress(5, `✅ 충돌 검증 완료: ${result.errorHandling.length}개 예외 처리`);
        return result;
    }

    /**
     * 6단계: 결과 수렴 검증
     */
    async verifyResultConvergence(expectedResult, conflictAnalysis) {
        this.updateProgress(6, '🎯 결과 수렴 검증 중...');

        const prompt = `
Expected Result가 달성되는지 검증하는 로직을 설계해주세요.

Expected Result: "${expectedResult}"
Error Handling: ${JSON.stringify(conflictAnalysis)}

다음 형식의 JSON만 반환하세요:
{
  "validationLogic": [
    {
      "assertion": "WebUI.verifyElementVisible",
      "element": "main_dashboard",
      "purpose": "로그인 성공 후 메인 페이지 표시 확인"
    }
  ],
  "successCriteria": ["page_redirect", "element_visible", "no_error_message"],
  "finalActions": [
    {
      "action": "WebUI.closeBrowser",
      "purpose": "테스트 완료 후 정리"
    }
  ]
}`;

        const result = await this.callGemini(prompt);
        this.analysisResults.step6 = result;
        this.updateProgress(6, `✅ 결과 검증 완료: ${result.validationLogic.length}개 검증 로직`);
        return result;
    }

    /**
     * 최종 스크립트 생성
     */
    async generateFinalScript(step1, step2, step3, step4, step5, step6) {
        this.updateProgress(7, '📝 최종 스크립트 생성 중...');

        const timestamp = new Date().toLocaleString();

        let script = `// ========================================
// Katalon Smart Generated Test Script
// Purpose: ${step1.testPurpose}
// Generated at: ${timestamp}
// ========================================
@Test
def ${step1.testScope?.replace(/[^a-zA-Z0-9]/g, '_') || 'loginFunctionalTest'}() {
    try {
        
        // === Environment Setup ===\n`;

        // Setup Actions
        step3.setupActions?.forEach(setup => {
            script += `        // ${setup.purpose}\n`;
            if (setup.action === 'WebUI.navigateToUrl') {
                script += `        ${setup.action}('${setup.target}')\n`;
            } else if (setup.action !== 'prepareTestData') {
                script += `        ${setup.action}('${setup.target}')\n`;
            }
        });

        script += `\n        // === Test Actions ===\n`;

        // Main Actions
        step4.actionMappings?.forEach(mapping => {
            script += `        // ${mapping.step}\n`;
            if (mapping.value) {
                // 비밀번호 필드는 암호화된 텍스트 사용
                if (mapping.step.includes('비밀번호') || mapping.step.includes('password')) {
                    script += `        WebUI.setEncryptedText(findTestObject('${mapping.objectRepository}'), 'encrypted_password')\n`;
                } else {
                    script += `        ${mapping.action}(findTestObject('${mapping.objectRepository}'), '${mapping.value}')\n`;
                }
            } else {
                script += `        ${mapping.action}(findTestObject('${mapping.objectRepository}'))\n`;
            }
        });

        script += `\n        // === Result Validation ===\n`;

        // Validation Logic
        step6.validationLogic?.forEach(validation => {
            script += `        // ${validation.purpose}\n`;
            if (validation.assertion === 'WebUI.verifyUrl') {
                script += `        ${validation.assertion}('https://example.com/dashboard')\n`;
            } else {
                script += `        ${validation.assertion}(findTestObject('Object Repository/${validation.element}'))\n`;
            }
        });

        script += `
    } catch (Exception e) {
        WebUI.comment("Test failed: " + e.getMessage())
        throw e
    } finally {
        WebUI.closeBrowser()
    }
}`;

        this.updateProgress(7, '✅ 스마트 분석 완료!');
        return script;
    }

    /**
     * 테스트케이스 파싱
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
     * Gemini API 호출 (강화된 JSON 파싱)
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

        // 강화된 JSON 파싱
        try {
            // 1차: 기본 JSON 파싱 시도
            return JSON.parse(resultText);
        } catch (e1) {
            try {
                // 2차: 코드 블록 제거 후 파싱
                const cleanedText = resultText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
                return JSON.parse(cleanedText);
            } catch (e2) {
                try {
                    // 3차: JSON 블록 추출
                    const jsonStart = resultText.indexOf('{');
                    const jsonEnd = resultText.lastIndexOf('}');

                    if (jsonStart !== -1 && jsonEnd !== -1) {
                        const jsonText = resultText.substring(jsonStart, jsonEnd + 1);
                        return JSON.parse(jsonText);
                    }
                } catch (e3) {
                    try {
                        // 4차: 문제 문자 정리 후 파싱
                        let fixedText = resultText
                            .replace(/```json\s*/g, '')
                            .replace(/```\s*/g, '')
                            .replace(/[\u201C\u201D]/g, '"')  // 스마트 따옴표 수정
                            .replace(/[\u2018\u2019]/g, "'")  // 스마트 아포스트로피 수정
                            .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')  // 키를 따옴표로 감싸기
                            .trim();

                        const jsonStart = fixedText.indexOf('{');
                        const jsonEnd = fixedText.lastIndexOf('}');

                        if (jsonStart !== -1 && jsonEnd !== -1) {
                            const jsonText = fixedText.substring(jsonStart, jsonEnd + 1);
                            return JSON.parse(jsonText);
                        }
                    } catch (e4) {
                        console.error('JSON 파싱 모든 시도 실패:', e4);
                        console.error('원본 텍스트:', resultText);

                        // 5차: 기본 fallback 객체 반환
                        return this.getFallbackResponse();
                    }
                }
            }
        }

        throw new Error('Invalid JSON response from Gemini');
    }

    /**
     * JSON 파싱 실패 시 기본 응답
     */
    getFallbackResponse() {
        return {
            errorHandling: [
                {
                    scenario: "element_not_found",
                    action: "WebUI.waitForElementPresent",
                    fallback: "WebUI.comment('Element not found, test failed')"
                }
            ],
            conditionalChecks: [
                {
                    condition: "WebUI.verifyElementClickable",
                    element: "target_element",
                    beforeAction: "click"
                }
            ],
            validationLogic: [
                {
                    assertion: "WebUI.verifyElementVisible",
                    element: "result_element",
                    purpose: "결과 확인"
                }
            ],
            successCriteria: ["page_loaded", "element_visible"],
            finalActions: [
                {
                    action: "WebUI.closeBrowser",
                    purpose: "테스트 완료 후 정리"
                }
            ]
        };
    }

    /**
     * UI 업데이트 함수들
     */
    showProgress() {
        document.getElementById('smartProgress').style.display = 'block';
        document.getElementById('smartResult').style.display = 'none';
    }

    updateProgress(step, message) {
        // 단계 표시 업데이트
        for (let i = 1; i <= 6; i++) {
            const stepElement = document.getElementById(`step${i}`);
            if (i < step) {
                stepElement.className = 'step completed';
            } else if (i === step) {
                stepElement.className = 'step active';
            } else {
                stepElement.className = 'step';
            }
        }

        // 상세 정보 업데이트
        const details = document.getElementById('progressDetails');
        const timestamp = new Date().toLocaleTimeString();
        details.innerHTML += `[${timestamp}] ${message}\n`;
        details.scrollTop = details.scrollHeight;
    }

    showResult(script) {
        document.getElementById('smartResult').style.display = 'block';
        document.getElementById('smartGeneratedScript').textContent = script;
        window.smartGeneratedScript = script; // 전역 저장
    }
}

// 전역 함수들
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

console.log('✅ 스마트 매핑 엔진 로드 완료');




