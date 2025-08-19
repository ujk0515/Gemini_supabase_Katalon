/**
* Gemma-3-27b-it 전용 AI 엔진 (개선된 프롬프트 적용)
* libs/ai_engine_Gemma-3-27b-it.js
*/

class GemmaEngine {
   constructor() {
       this.apiKey = 'AIzaSyDE-edho0DTkfMbsGF9XoiOQgCPkVJInzU';
       this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent';
       this.analysisResults = {};
       this.currentStep = 0;
       this.lastEvaluation = null;
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

           const parsedTC = this.parseTestcase(testcaseText);

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
    * 1단계: 상황 파악 + 환경 설정 (개선된 프롬프트)
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

=== 분석 지침 ===

** 입력 데이터 우선 원칙 **
1. 명시된 Precondition은 있는 그대로 해석하고 구현
2. 명시된 Steps 순서와 내용을 충실히 분석
3. 명시된 Expected Result를 정확히 파악

** 합리적 상상 허용 범위 **
✅ 기술적 필수 요소:
- 브라우저/페이지 초기 설정 (navigateToUrl, waitForPageLoad)
- Precondition 검증을 위한 요소 확인
- Steps 실행을 위한 기본 환경 준비

✅ 자연스러운 플로우 연결:
- A단계에서 B단계로 넘어가기 위한 중간 과정
- UI 상호작용의 일반적 순서
- 페이지 이동이나 상태 변화가 암시된 경우

❌ 금지되는 과도한 상상:
- 입력에 없는 데이터 준비/초기화 작업
- 입력에 없는 권한 설정이나 계정 관리
- 입력에 없는 비즈니스 로직이나 추가 검증

🎯 판단 기준: "이 설정 없이는 입력된 테스트가 기술적으로 불가능한가?"

=== 분석 요구사항 ===
1. 테스트의 핵심 목적과 검증 포인트 파악
2. 입력된 Precondition 기반 환경 설정 (필요한 기술적 보완 포함)
3. Steps 실행을 위한 최소 필수 환경 요소 식별
4. Object Repository 경로 구조 설계

** 절대 금지사항 **
- 하드코딩된 문자열 사용 금지 (URL, 데이터값 등)
- 모든 값은 GlobalVariable, 테스트 데이터, 또는 변수로 처리

다음 형식의 JSON만 반환하세요:
{
 "testPurpose": "테스트의 핵심 목적 (한 문장)",
 "testScope": "groovy_method_name_format",
 "environmentSetup": [
   {
     "action": "WebUI.navigateToUrl",
     "target": "GlobalVariable.BASE_URL", 
     "purpose": "설정 목적",
     "required": true
   }
 ],
 "preconditionAnalysis": [
   {
     "originalCondition": "입력된 원본 Precondition",
     "actionType": "verify_existing|setup_and_verify|manual_check",
     "katalonAction": "구체적인 Katalon 액션",
     "objectPath": "Object Repository 경로",
     "technicalNeed": "기술적 필요성 (합리적 상상 포함)"
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
    * 2단계: 핵심 액션 + 검증 통합 (개선된 프롬프트)
    */
   async mapActionsAndValidation(parsedTC, step1Result) {
       this.updateProgress(2, '⚡ 액션 매핑 및 검증 로직 설계 중...');

       const prompt = `
테스트 Steps와 Expected Result를 분석하여 실행 액션과 검증 로직을 통합 설계해주세요.

=== 입력 정보 ===
Steps: ${JSON.stringify(parsedTC.steps)}
Expected Result: "${parsedTC.expectedResult}"
Environment Setup: ${JSON.stringify(step1Result.environmentSetup)}
Precondition Analysis: ${JSON.stringify(step1Result.preconditionAnalysis)}

=== 액션 매핑 지침 ===

** 입력 데이터 충실성 **
1. 입력된 각 Step을 순서대로 정확히 구현
2. 입력된 Expected Result의 모든 포인트를 검증에 반영
3. Step간 연결고리는 자연스럽게 보완

** 합리적 상상 허용 범위 **
✅ 기술적 필수 요소:
- 액션 전 요소 로드 대기 (waitForElementPresent/Visible/Clickable)
- 액션 후 결과 확인 대기 (페이지 전환, 데이터 로드 등)
- 네트워크 처리 대기 (업로드/다운로드/서버 통신 후)

✅ 자연스러운 UI 플로우:
- 클릭 → 페이지 이동 → 다음 액션을 위한 대기
- 입력 → 검증 → 저장의 일반적 순서
- 모달/팝업 처리의 표준 패턴

✅ 안전성/안정성 확보:
- 중요 액션 전 요소 존재 확인
- 중요 액션 후 성공 여부 확인
- 예외 상황 방지를 위한 최소 검증

❌ 금지되는 과도한 상상:
- 입력에 없는 추가 검증 포인트
- 입력에 없는 데이터 조작이나 설정
- 과도한 로깅, 스크린샷, 성능 측정

🎯 판단 기준: "이 액션 없이는 다음 Step이 기술적으로 실행 불가능한가?"

=== 설계 요구사항 ===
1. 각 Step을 정확한 Katalon WebUI 액션으로 매핑
2. Expected Result의 모든 검증 포인트를 개별 assertion으로 분리  
3. disabled/enabled 상태와 present/not present 구분 정확히
4. 필수 대기 로직만 포함, 중복 제거
5. Object Repository 경로를 실무 표준에 맞게 구성
6. GlobalVariable, 테스트 데이터 활용으로 하드코딩 금지

다음 형식의 JSON만 반환하세요:
{
 "mainActions": [
   {
     "stepDescription": "입력된 Steps의 원본 설명",
     "executionFlow": [
       {
         "type": "technical_prep|main_action|verification",
         "action": "구체적인 Katalon 액션",
         "element": "대상 요소", 
         "value": "입력값 (해당시)",
         "objectPath": "Object Repository/PageName/element_name",
         "purpose": "기술적 필요성 설명",
         "timeout": "대기 시간 (필요시)"
       }
     ]
   }
 ],
 "validationLogic": [
   {
     "expectedPoint": "Expected Result의 각 포인트",
     "assertion": "정확한 Katalon 검증 액션",
     "element": "검증 대상 요소",
     "expectedValue": "예상값",
     "objectPath": "Object Repository 경로",
     "preparationSteps": ["검증 전 필요한 기술적 준비사항"]
   }
 ]
}`;

       const result = await this.callGemini(prompt);
       this.analysisResults.step2 = result;
       this.updateProgress(2, `✅ 액션 매핑 완료: ${result.mainActions.length}개 액션, ${result.validationLogic.length}개 검증`);
       return result;
   }

   /**
    * 3단계: 완성도 검토 + 스크립트 생성 (개선된 프롬프트)
    */
   async reviewAndGenerateScript(parsedTC, step1Result, step2Result) {
       this.updateProgress(3, '📝 스크립트 검토 및 최종 생성 중...');

       const prompt = `
앞선 분석 결과를 종합하여 실제 실행 가능한 Katalon Groovy 스크립트를 생성해주세요.

=== 통합 정보 ===
Original TC Summary: "${parsedTC.summary}"
Step1 Result: ${JSON.stringify(step1Result)}
Step2 Result: ${JSON.stringify(step2Result)}

=== 스크립트 생성 지침 ===

** 입력 데이터 충실성 **
1. 분석된 환경 설정을 정확히 구현
2. 분석된 액션 플로우를 순서대로 구현
3. 분석된 검증 로직을 모두 포함

** 합리적 상상 허용 범위 **
✅ 기술적 완성도:
- try-finally 구조로 브라우저 종료 보장
- 필수 대기 로직 (과도하지 않게)
- 액션 간 자연스러운 연결 처리

✅ 코드 품질:
- 섹션별 명확한 주석 (// === Environment Setup === 등)
- 논리적 그룹핑과 순서
- 에러 상황 대비 최소한의 안전장치

❌ 금지되는 과도한 상상:
- 분석에 없던 새로운 액션 추가
- 과도한 에러 처리나 예외 상황 처리
- 불필요한 로깅, 리포팅, 성능 측정

🎯 판단 기준: "이 코드 없이는 분석된 테스트가 안정적으로 실행되지 않는가?"

=== 코드 생성 요구사항 ===
1. **간결성 우선**: 불필요한 중복 코드 제거
2. **안정성 확보**: try-finally 구조, 필수 대기만
3. **명확한 구조**: 섹션별 간단한 주석
4. **실행 가능성**: 실제 Object Repository 경로 사용
5. **유연성**: GlobalVariable 활용, 하드코딩 금지

=== 스크립트 구조 지침 ===

** 구조 유연성 원칙 **
- 아래 예시는 참고용이며, 실제 테스트케이스에 맞게 구조 조정 필요
- 섹션 개수, 순서, 내용은 분석 결과에 따라 자유롭게 변경
- 예시와 다른 구조여도 논리적이고 실행 가능하면 정답

** 적응적 구조 가이드 **
✅ 필수 요소만 유지:
- try-finally 구조 (브라우저 종료 보장)
- 논리적 실행 순서
- 적절한 섹션 구분 주석

✅ 상황에 따라 조정:
- 섹션 이름: 테스트 내용에 맞게 변경
- 섹션 개수: 필요에 따라 증감  
- 액션 순서: 테스트 플로우에 따라 조정
- 검증 위치: 액션 중간 또는 마지막에 배치

=== 코드 품질 체크리스트 ===
- [ ] 스크립트 길이가 적정한가? (분석 결과에 따라 20-60라인)
- [ ] 분석된 모든 액션이 포함되었는가?
- [ ] 분석된 모든 검증이 포함되었는가?
- [ ] 논리적 모순이 없는가?
- [ ] 하드코딩된 문자열이 전혀 없는가?
- [ ] 기술적 필수 요소만 포함하고 과도한 추가는 없는가?

완전한 Groovy 스크립트를 반환하세요. JSON이 아닌 순수 코드로만 반환하세요.

**절대 금지**: import 구문, def 변수 선언, 함수 정의, catch 블록 사용 금지

** 예시 구조 (참고용 - 강제 아님) **
try {
   // === 상황에 맞는 섹션명 사용 ===
   WebUI.navigateToUrl(GlobalVariable.BASE_URL)
   WebUI.waitForPageLoad(10)
   
   // === 실제 테스트에 맞는 섹션 구성 ===
   WebUI.verifyElementPresent(findTestObject('Header/user_profile'), 5)
   
   // === 분석 결과에 따른 액션들 ===  
   WebUI.waitForElementClickable(findTestObject('Menu/upload_button'), 10)
   WebUI.click(findTestObject('Menu/upload_button'))
   WebUI.waitForElementPresent(findTestObject('Upload/file_input'), 10)
   WebUI.uploadFile(findTestObject('Upload/file_input'), GlobalVariable.TEST_FILE_PATH)
   WebUI.waitForElementVisible(findTestObject('Upload/success_message'), 30)
   
   // === 검증은 중간/마지막 어디든 적절히 ===
   WebUI.verifyElementVisible(findTestObject('Upload/success_message'))
   WebUI.verifyTextPresent('업로드가 완료되었습니다')
   
} finally {
   WebUI.closeBrowser()
}

** 핵심 원칙 **
1. 예시는 영감을 주는 참고 자료일 뿐
2. 실제 테스트케이스 분석 결과가 구조를 결정
3. 논리적 흐름과 실행 가능성이 최우선
4. 섹션명, 순서, 내용 모두 자유롭게 조정 가능

추가 검토: 예시 구조에 얽매이지 말고, 분석 결과에 가장 적합한 구조로 스크립트를 생성하되, 실행 가능성과 논리적 순서는 반드시 보장하세요.`;

       const result = await this.callGemini(prompt);
       this.analysisResults.step3 = result;

       let cleanedResult = result;
       if (typeof result === 'string') {
           cleanedResult = result
               .replace(/^```groovy\s*/g, '')
               .replace(/```\s*$/g, '')
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
                       this.lastEvaluation = evaluation;
                       return evaluation;
                   }
               } catch (parseError) {
                   console.warn('AI 평가 JSON 파싱 실패:', parseError);
               }
           } else if (typeof result === 'object') {
               this.lastEvaluation = result;
               return result;
           }

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
    * AI 기반 스크립트 개선 및 재평가
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

       this.showImprovementLoading();

       try {
           console.log('🚀 스크립트 개선 프로세스 시작');
           
           const improvedScript = await this.improveScriptBasedOnEvaluation(
               window.smartGeneratedScript, 
               this.lastEvaluation
           );
           
           document.getElementById('smartGeneratedScript').textContent = improvedScript;
           window.smartGeneratedScript = improvedScript;
           
           console.log('🔄 개선된 스크립트로 재평가 시작');
           
           const newEvaluation = await this.evaluateScriptQuality(improvedScript);
           
           await this.displayScriptScoreWithComparison(improvedScript, this.lastEvaluation, newEvaluation);
           
           this.lastEvaluation = newEvaluation;
           
           console.log('🎉 스크립트 개선 및 재평가 완료');
           
       } catch (error) {
           console.error('❌ 스크립트 개선 실패:', error);
           alert('스크립트 개선 중 오류가 발생했습니다: ' + error.message);
           this.showImprovementError();
           
       } finally {
           if (improveButton) {
               improveButton.disabled = false;
               improveButton.innerHTML = '🛠️ AI 검토 반영';
           }
       }
   }

   /**
    * AI 기반 스크립트 개선 함수
    */
   async improveScriptBasedOnEvaluation(originalScript, evaluation) {
       console.log('🛠️ AI 검토 반영 시작...');
       
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
           
           console.log('✅ 스크립트 개선 완료');
           return improvedScript;
       } catch (error) {
           console.error('❌ 스크립트 개선 실패:', error);
           throw error;
       }
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
    * Gemini API 호출
    */
   async callGemini(prompt) {
       await new Promise(resolve => setTimeout(resolve, 5000));

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
    * JSON 파싱 실패 시 기본 응답
    */
   getFallbackResponse() {
       return {
           testPurpose: "테스트 목적 파악 실패",
           testScope: "fallback_test",
           environmentSetup: [{
               action: "WebUI.navigateToUrl",
               target: "GlobalVariable.BASE_URL",
               purpose: "기본 페이지 접속",
               required: true
           }],
           preconditionAnalysis: [{
               originalCondition: "분석 실패",
               actionType: "manual_check",
               katalonAction: "WebUI.comment",
               objectPath: "Manual verification required",
               technicalNeed: "수동 확인 필요"
           }]
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
       this.currentStep = step;

       const stepMapping = {
           1: [1, 2], // 1단계 → 1,2단계 표시
           2: [3, 4], // 2단계 → 3,4단계 표시  
           3: [5, 6]  // 3단계 → 5,6단계 표시
       };

       const mappedSteps = stepMapping[step] || [];

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

       setTimeout(async () => {
           await this.displayScriptScoreLarge(script);
       }, 1000);
   }

   /**
    * 품질 평가 UI 업데이트 함수들
    */
   async displayScriptScoreLarge(script) {
       const scoreDisplay = document.getElementById('smartScriptScore');
       const circle = document.getElementById('scoreCircleLarge');
       const value = document.getElementById('scoreValueLarge');
       const details = document.getElementById('scoreDetailsLarge');
       const placeholder = document.getElementById('qualityPlaceholder');

       if (!scoreDisplay || !circle || !value || !details) return;

       scoreDisplay.style.display = 'flex';
       if (placeholder) placeholder.style.display = 'none';

       value.textContent = '...';
       circle.className = 'score-circle-large score-waiting';
       details.textContent = '🤖 AI가 평가 중...\n잠시만 기다려주세요';

       try {
           const evaluation = await this.evaluateScriptQuality(script);

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

           value.textContent = evaluation.score;
           circle.className = `score-circle-large ${className}`;

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

           value.textContent = '?';
           circle.className = 'score-circle-large score-poor';
           details.textContent = '❌ 평가 실패\n네트워크를 확인하고\n다시 시도해주세요';
       }
   }

   async displayScriptScoreWithComparison(script, oldEvaluation, newEvaluation) {
       const scoreDisplay = document.getElementById('smartScriptScore');
       const circle = document.getElementById('scoreCircleLarge');
       const value = document.getElementById('scoreValueLarge');
       const details = document.getElementById('scoreDetailsLarge');
       const placeholder = document.getElementById('qualityPlaceholder');

       if (!scoreDisplay || !circle || !value || !details) return;

       scoreDisplay.style.display = 'flex';
       if (placeholder) placeholder.style.display = 'none';

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

       value.textContent = newEvaluation.score;
       circle.className = `score-circle-large ${className}`;

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
}

// DOM 로드 완료 후 인스턴스 생성
document.addEventListener('DOMContentLoaded', function() {
   try {
       window.gemmaEngine = new GemmaEngine();
       console.log('✅ gemmaEngine 인스턴스 생성 완료:', window.gemmaEngine);
   } catch (error) {
       console.error('❌ gemmaEngine 생성 실패:', error);
   }
});

// 즉시 실행도 시도
try {
   window.gemmaEngine = new GemmaEngine();
   console.log('✅ gemmaEngine 즉시 생성 완료:', window.gemmaEngine);
} catch (error) {
   console.error('❌ gemmaEngine 즉시 생성 실패:', error);
}

// 전역 함수들
async function startSmartMappingGemma() {
   const input = document.getElementById('smartTestcaseInput').value.trim();
   if (!input) {
       alert('테스트케이스를 입력해주세요.');
       return;
   }

   const button = document.querySelector('.smart-generate-btn');
   button.disabled = true;
   button.innerHTML = '<span class="smart-loading"></span>🧠 분석 중...';

   try {
       await window.gemmaEngine.startAnalysis(input);
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

function improveSmartScript() {
   if (window.gemmaEngine) {
       window.gemmaEngine.improveAndReEvaluateScript();
   } else {
       alert('AI 엔진을 찾을 수 없습니다.');
   }
}

console.log('✅ AI 엔진 Gemma-3-27b-it 버전 로드 완료 (개선된 프롬프트 적용)');