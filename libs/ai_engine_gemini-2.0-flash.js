/**
 * 스마트 매핑 엔진 - 3단계 분석 버전 (점수 표시 기능 포함)
 * libs/ai_engine_gemini-2.0-flash.js
 */

class GeminiFlashEngine {
    constructor() {
        this.apiKey = 'AIzaSyDE-edho0DTkfMbsGF9XoiOQgCPkVJInzU';
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
        this.analysisResults = {};
        this.currentStep = 0;
        this.lastEvaluation = null; // 마지막 평가 결과 저장
    }

    getBaseUrl() {
        const selectedModel = document.getElementById('aiModelSelect').value;
        return `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent`;
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
2. try-finally 구조로 브라우저 종료 보장 (catch 블록 절대 금지)
3. **핵심 주석만**: 각 섹션마다 간단한 주석 (개별 액션마다 불필요)
4. **필수 대기만**: 과도한 waitFor 남발 금지
5. 실제 Object Repository 경로 사용
6. **상태 구분**: disabled vs not present 정확히 구분
7. **하드코딩 절대 금지**: 모든 값을 GlobalVariable 또는 변수로 처리

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

**절대 금지**: import 구문, def 변수 선언, 함수 정의, catch 블록 사용 금지

스크립트 구조:
try {
    // === Environment Setup ===
    WebUI.navigateToUrl(GlobalVariable.BASE_URL)
    WebUI.waitForPageLoad(10)
    
    // === Test Actions ===  
    WebUI.click(findTestObject('LoginPage/input_username'))
    WebUI.setText(findTestObject('LoginPage/input_username'), GlobalVariable.TEST_USERNAME)
    
    // === Result Validation ===
    WebUI.verifyElementPresent(findTestObject('MainPage/welcome_message'), 10)
    
} finally {
    WebUI.closeBrowser()
}

추가 검토: 스크립트 생성 후 실행 가능한 코드, Object Repository 일관성, 논리적 순서, 브라우저 종료 보장, 검증 로직 충분성을 자체 점검하여 수정하세요.`;

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
   - 브라우저 종료 보장
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
- catch 블록 사용: -15점
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
                        const evaluation = JSON.parse(jsonText);
                        this.lastEvaluation = evaluation; // 평가 결과 저장
                        return evaluation;
                    }
                } catch (parseError) {
                    console.warn('AI 평가 JSON 파싱 실패:', parseError);
                }
            } else if (typeof result === 'object') {
                this.lastEvaluation = result; // 평가 결과 저장
                return result;
            }

            // Fallback: 기본 응답
            const fallbackEvaluation = {
                score: 75,
                grade: "보통",
                issues: ["AI 평가 파싱 실패"],
                strengths: ["기본 구조 양호"],
                recommendation: "수동 검토 필요"
            };
            this.lastEvaluation = fallbackEvaluation;
            return fallbackEvaluation;

        } catch (error) {
            console.error('❌ AI 평가 실패:', error);

            // 에러 발생 시 기본 평가
            const errorEvaluation = {
                score: 70,
                grade: "평가불가",
                issues: ["AI 평가 시스템 오류"],
                strengths: ["코드 생성 완료"],
                recommendation: "네트워크 연결 확인 후 재시도"
            };
            this.lastEvaluation = errorEvaluation;
            return errorEvaluation;
        }
    }

    /**
     * AI 기반 스크립트 개선 함수
     */
    async improveScriptBasedOnEvaluation(originalScript, evaluation) {
        console.log('🛠️ AI 검토 반영 v4 시작...');
        
        const prompt = `다음은 이미 생성된 Katalon Groovy 스크립트입니다. 이 스크립트를 거의 그대로 유지하면서, 아래 지적된 문제점들을 분석하여 실제 개선이 필요한 부분만 최소한으로 수정해주세요.

    === 원본 스크립트 (수정 금지 - 개선 필요 부분만 수정) ===
    ${originalScript}

    === 검토된 문제점들 ===
    ${evaluation.issues ? evaluation.issues.map(issue => `• ${issue}`).join('\n') : '특별한 문제점 없음'}

    === 수정 규칙 (엄격히 준수) ===
    1. **99% 보존**: 원본 스크립트의 구조, 순서, 변수명, 주석을 그대로 유지
    2. **개선사항 파악**: 위에 나열된 문제점들을 분석하여 실제 개선이 필요한 부분만 식별
    3. **최소한의 수정**: 개선이 필요한 해당 부분에만 최소한의 수정 적용
    4. **라인별 수정**: 전체 재작성 절대 금지, 개선사항이 확인된 라인만 수정
    5. **추가 금지**: 새로운 코드, 주석, 기능 추가 절대 금지

    === 절대 금지사항 ===
    - 전체 스크립트 구조 변경
    - 새로운 섹션이나 주석 추가  
    - 기존 정상 코드 수정
    - 변수명이나 Object Repository 경로 변경
    - 코드 순서 재배열

    === 출력 조건 ===
    - 수정된 부분이 5줄 이하가 되도록 최소한만 수정
    - 원본과 거의 동일하되 개선사항만 반영된 스크립트 반환
    - 설명 없이 순수 Groovy 코드만 반환

    현재 점수 ${evaluation.score}점에서 85점 이상이 목표입니다.`;

        try {
            const result = await this.callGemini(prompt);
            
            let improvedScript = result;
            if (typeof result === 'string') {
                improvedScript = result
                    .replace(/^```groovy\s*/g, '')
                    .replace(/```\s*$/g, '')
                    .trim();
            }
            
            console.log('✅ 스크립트 개선 완료 (v4)');
            return improvedScript;
        } catch (error) {
            console.error('❌ 스크립트 개선 실패:', error);
            throw error;
        }
    }

    /**
     * 스크립트 개선 및 재평가 전체 프로세스
     */
    async improveAndReEvaluateScript() {
        if (!window.smartGeneratedScript) {
            alert('개선할 스크립트가 없습니다.');
            return;
        }

        if (!this.lastEvaluation) {
            alert('먼저 스크립트 품질 평가가 완료되어야 합니다.');
            return;
        }

        const improveButton = document.querySelector('.improve-script-btn');
        if (improveButton) {
            improveButton.disabled = true;
            improveButton.innerHTML = '<span class="smart-loading"></span>🛠️ 개선 중...';
        }

        // 품질 평가 영역에 로딩 표시
        this.showImprovementLoading();

        try {
            console.log('🚀 스크립트 개선 프로세스 시작');
            
            // 1. 스크립트 개선
            const improvedScript = await this.improveScriptBasedOnEvaluation(
                window.smartGeneratedScript, 
                this.lastEvaluation
            );
            
            // 2. 개선된 스크립트를 화면에 표시
            document.getElementById('smartGeneratedScript').textContent = improvedScript;
            window.smartGeneratedScript = improvedScript;
            
            console.log('🔄 개선된 스크립트로 재평가 시작');
            
            // 3. 재평가 실행
            const newEvaluation = await this.evaluateScriptQuality(improvedScript);
            
            // 4. 새로운 평가 결과를 화면에 표시 (개선 전후 비교 포함)
            await this.displayScriptScoreWithComparison(improvedScript, this.lastEvaluation, newEvaluation);
            
            // 5. 새로운 평가를 현재 평가로 업데이트
            this.lastEvaluation = newEvaluation;
            
            console.log('🎉 스크립트 개선 및 재평가 완료');
            
        } catch (error) {
            console.error('❌ 스크립트 개선 실패:', error);
            alert('스크립트 개선 중 오류가 발생했습니다: ' + error.message);
            
            // 에러 시 품질 평가 영역 복구
            this.showImprovementError();
            
        } finally {
            if (improveButton) {
                improveButton.disabled = false;
                improveButton.innerHTML = '🛠️ AI 검토 반영';
            }
        }
    }

    /**
     * 개선 중 로딩 표시
     */
    showImprovementLoading() {
        const circle = document.getElementById('scoreCircleLarge');
        const value = document.getElementById('scoreValueLarge');
        const details = document.getElementById('scoreDetailsLarge');

        if (circle && value && details) {
            value.textContent = '...';
            circle.className = 'score-circle-large score-waiting';
            details.textContent = '🛠️ AI가 스크립트를 개선하고\n재평가하는 중입니다...\n잠시만 기다려주세요';
        }
    }

    /**
     * 개선 에러 표시
     */
    showImprovementError() {
        const circle = document.getElementById('scoreCircleLarge');
        const value = document.getElementById('scoreValueLarge');
        const details = document.getElementById('scoreDetailsLarge');

        if (circle && value && details) {
            value.textContent = '❌';
            circle.className = 'score-circle-large score-poor';
            details.textContent = '❌ 스크립트 개선 실패\n네트워크를 확인하고\n다시 시도해주세요';
        }
    }

    /**
     * 개선 전후 비교를 포함한 품질 평가 표시
     */
    async displayScriptScoreWithComparison(script, oldEvaluation, newEvaluation) {
        const scoreDisplay = document.getElementById('smartScriptScore');
        const circle = document.getElementById('scoreCircleLarge');
        const value = document.getElementById('scoreValueLarge');
        const details = document.getElementById('scoreDetailsLarge');
        const placeholder = document.getElementById('qualityPlaceholder');

        if (!scoreDisplay || !circle || !value || !details) return;

        // 품질 평가 영역 표시, 플레이스홀더 숨김
        scoreDisplay.style.display = 'flex';
        if (placeholder) placeholder.style.display = 'none';

        // 점수에 따른 등급 및 색상 결정
        let className;
        if (newEvaluation.score >= 90) {
            className = 'score-excellent';
        } else if (newEvaluation.score >= 80) {
            className = 'score-good';
        } else if (newEvaluation.score >= 70) {
            className = 'score-fair';
        } else {
            className = 'score-poor';
        }

        // UI 업데이트 (점수 변화 애니메이션)
        value.textContent = newEvaluation.score;
        circle.className = `score-circle-large ${className}`;

        // 개선 전후 비교 정보 구성
        const scoreDiff = newEvaluation.score - oldEvaluation.score;
        const improvementText = scoreDiff > 0 ? 
            `🔼 +${scoreDiff}점 개선` : 
            scoreDiff < 0 ? 
                `🔻 ${scoreDiff}점 하락` : 
                '🔄 점수 동일';

        let detailText = `등급: ${newEvaluation.grade} (${oldEvaluation.score}점 → ${newEvaluation.score}점)\n${improvementText}`;

        if (newEvaluation.strengths && newEvaluation.strengths.length > 0) {
            detailText += `\n\n✅ 잘된 부분:\n• ${newEvaluation.strengths.join('\n• ')}`;
        }

        if (newEvaluation.issues && newEvaluation.issues.length > 0) {
            detailText += `\n\n⚠️ 남은 개선사항:\n• ${newEvaluation.issues.join('\n• ')}`;
        }

        if (newEvaluation.recommendation) {
            detailText += `\n\n💡 추가 권장사항:\n${newEvaluation.recommendation}`;
        }

        details.textContent = detailText;

        console.log(`🤖 재평가 결과: ${oldEvaluation.score}점 → ${newEvaluation.score}점 (${improvementText})`);
    }

    /**
     * 새로운 품질 평가 UI 업데이트 함수 (큰 영역용)
     */
    async displayScriptScoreLarge(script) {
        const scoreDisplay = document.getElementById('smartScriptScore');
        const circle = document.getElementById('scoreCircleLarge');
        const value = document.getElementById('scoreValueLarge');
        const details = document.getElementById('scoreDetailsLarge');
        const placeholder = document.getElementById('qualityPlaceholder');

        if (!scoreDisplay || !circle || !value || !details) return;

        // 품질 평가 영역 표시, 플레이스홀더 숨김
        scoreDisplay.style.display = 'flex';
        if (placeholder) placeholder.style.display = 'none';

        // 로딩 상태 표시
        value.textContent = '...';
        circle.className = 'score-circle-large score-waiting';
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
            circle.className = `score-circle-large ${className}`;

            // 상세 정보 구성 (큰 영역에 맞게 축약)
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
            circle.className = 'score-circle-large score-poor';
            details.textContent = '❌ 평가 실패\n네트워크를 확인하고\n다시 시도해주세요';
        }
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

        const response = await fetch(`${this.getBaseUrl()}?key=${this.apiKey}`, {
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

        // 새로운 품질 표시 함수 사용 (1초 후)
        setTimeout(async () => {
            await this.displayScriptScoreLarge(script);
        }, 1000);
    }
}

// DOM 로드 완료 후 인스턴스 생성
document.addEventListener('DOMContentLoaded', function() {
    try {
        window.geminiFlashEngine = new GeminiFlashEngine();
        console.log('✅ geminiFlashEngine 인스턴스 생성 완료:', window.geminiFlashEngine);
    } catch (error) {
        console.error('❌ geminiFlashEngine 생성 실패:', error);
    }
});

// 즉시 실행도 시도
try {
    window.geminiFlashEngine = new GeminiFlashEngine();
    console.log('✅ geminiFlashEngine 즉시 생성 완료:', window.geminiFlashEngine);
} catch (error) {
    console.error('❌ geminiFlashEngine 즉시 생성 실패:', error);
}

async function startSmartMappingGemini() {
    const input = document.getElementById('smartTestcaseInput').value.trim();
    if (!input) {
        alert('테스트케이스를 입력해주세요.');
        return;
    }

    const button = document.querySelector('.smart-generate-btn');
    button.disabled = true;
    button.innerHTML = '<span class="smart-loading"></span>🧠 분석 중...';

    try {
        await window.geminiFlashEngine.startAnalysis(input);
    } catch (error) {
        alert('분석 실패: ' + error.message);
    } finally {
        button.disabled = false;
        button.innerHTML = '🧠 스마트 분석 시작';
    }
}

// 새로운 함수: AI 검토 반영 (Gemini Flash용)
function improveSmartScriptGemini() {
    if (window.geminiFlashEngine) {
        window.geminiFlashEngine.improveAndReEvaluateScript();
    } else {
        alert('AI 엔진을 찾을 수 없습니다.');
    }
}

console.log('✅ AI 엔진 gemini-2.0-flash 버전 로드 완료 (AI 검토 반영 기능 포함)');