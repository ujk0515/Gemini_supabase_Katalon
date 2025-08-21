/**
 * Gemma AI 엔진용 마스터 프롬프트
 * libs/prompts/gemma_master_prompt.js
 */

window.MASTER_PROMPTS = {
    step1: `테스트케이스를 종합 분석하여 테스트 목적을 파악하고 환경 설정을 결정해주세요.

=== 테스트케이스 정보 ===
Summary: "\${parsedTC.summary}"
Precondition: \${JSON.stringify(parsedTC.precondition)}
Steps: \${JSON.stringify(parsedTC.steps)}
Expected Result: "\${parsedTC.expectedResult}"

=== 분석 지침 ===

** 입력 데이터 우선 원칙 **
1. 명시된 Precondition은 있는 그대로 해석하고 구현
2. 명시된 Steps 순서와 내용을 충실히 분석
3. 명시된 Expected Result를 정확히 파악

** 합리적 상상 허용 범위 **
기술적 필수 요소:
- 브라우저/페이지 초기 설정 (navigateToUrl, waitForPageLoad)
- Precondition 검증을 위한 요소 확인
- Steps 실행을 위한 기본 환경 준비

자연스러운 플로우 연결:
- A단계에서 B단계로 넘어가기 위한 중간 과정
- UI 상호작용의 일반적 순서
- 페이지 이동이나 상태 변화가 암시된 경우

금지되는 과도한 상상:
- 입력에 없는 데이터 준비/초기화 작업
- 입력에 없는 권한 설정이나 계정 관리
- 입력에 없는 비즈니스 로직이나 추가 검증

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
 ] ,
 "preconditionAnalysis": [
   {
     "originalCondition": "입력된 원본 Precondition",
     "actionType": "verify_existing|setup_and_verify|manual_check",
     "katalonAction": "구체적인 Katalon 액션",
     "objectPath": "Object Repository 경로",
     "technicalNeed": "기술적 필요성 (합리적 상상 포함)"
   }
 ] ,
 "elementStructure": {
   "pageObject": "페이지 분류",
   "expectedElements": ["필요한 요소1", "필요한 요소2"]
 }
}`,

    step2: `테스트 Steps와 Expected Result를 분석하여 실행 액션과 검증 로직을 통합 설계해주세요.

=== 입력 정보 ===
Steps: \${JSON.stringify(parsedTC.steps)}
Expected Result: "\${parsedTC.expectedResult}"
Environment Setup: \${JSON.stringify(step1Result.environmentSetup)}
Precondition Analysis: \${JSON.stringify(step1Result.preconditionAnalysis)}

=== 액션 매핑 지침 ===

** 입력 데이터 충실성 **
1. 입력된 각 Step을 순서대로 정확히 구현
2. 입력된 Expected Result의 모든 포인트를 검증에 반영
3. Step간 연결고리는 자연스럽게 보완

** 합리적 상상 허용 범위 **
기술적 필수 요소:
- 액션 전 요소 로드 대기 (waitForElementPresent/Visible/Clickable)
- 액션 후 결과 확인 대기 (페이지 전환, 데이터 로드 등)
- 네트워크 처리 대기 (업로드/다운로드/서버 통신 후)

자연스러운 UI 플로우:
- 클릭 → 페이지 이동 → 다음 액션을 위한 대기
- 입력 → 검증 → 저장의 일반적 순서
- 모달/팝업 처리의 표준 패턴

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
 ] ,
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
}`,

    step3: `당신은 Katalon 스크립트 설계 전문가입니다.
앞선 분석 결과와 우수 예제 스크립트를 종합적으로 참고하여, 최종 스크립트 생성을 위한 완벽한 설계도(Plan)를 작성해주세요.

=== 1단계 분석 결과 ===
\${JSON.stringify(step1Result, null, 2)}

=== 2단계 분석 결과 ===
\${JSON.stringify(step2Result, null, 2)}

=== 우수 예제 스크립트 ===
\${examples.length > 0 ? examples.map(e => "// 예제: " + e.description + "\\n" + e.script).join("\\n\\n") : "// 참고할 예제 없음"}

=== 설계도(Plan) 작성 지침 ===
1. 구조 설계: 전체 스크립트의 try-finally 구조, 섹션 주석 등을 포함한 기본 골격을 설계합니다.
2. 액션 통합: 1, 2단계에서 분석된 환경 설정, 핵심 액션, 검증 로직을 논리적 순서에 맞게 배치합니다.
3. 코드 레벨 지시사항: 각 액션에 필요한 findTestObject, GlobalVariable 사용법을 명시합니다.
4. 예제 스타일 반영: 우수 예제의 코딩 스타일을 반영하여 계획을 세웁니다.

다음 형식의 JSON만 반환하세요:
{
  "scriptName": "생성될 스크립트의 이름",
  "overallStructure": "try-finally",
  "plan": [
    { "section": "Environment Setup", "steps": [ { "instruction": "WebUI.navigateToUrl(GlobalVariable.BASE_URL)", "reason": "기본 URL로 이동" } ] },
    { "section": "Main Actions", "steps": [ { "instruction": "WebUI.setText(findTestObject('Page_Login/input_username'), 'user1')", "reason": "아이디 입력" } ] },
    { "section": "Validation", "steps": [ { "instruction": "WebUI.verifyElementPresent(findTestObject('Page_Main/lbl_welcome'), 10)", "reason": "로그인 성공 후 환영 메시지 확인" } ] }
  ],
  "finalization": {
    "instruction": "WebUI.closeBrowser()", "reason": "리소스 정리를 위해 브라우저 종료"
  }
}`,

    step4: `당신은 코드 생성 AI입니다.
오직 아래 제공된 설계도(Plan)를 보고, 지시사항을 정확하게 코드로 변환하는 역할만 수행합니다.

=== 스크립트 설계도 (JSON) ===
\${JSON.stringify(plan, null, 2)}

=== 코드 생성 규칙 ===
1. 설계도의 plan 배열에 있는 모든 instruction을 순서대로 코드로 변환합니다.
2. overallStructure가 try-finally이면, finalization의 내용은 finally 블록에 위치시켜야 합니다.
3. 각 section은 주석으로 구분해주세요.
4. import 구문, def 변수 선언, 함수 정의, catch 블록은 절대 사용하지 마세요.

완전한 Groovy 스크립트만 반환하세요. 설명이나 JSON 래핑 없이 순수 코드로만 응답해야 합니다.`
};

console.log('MASTER_PROMPTS 설정 완료');