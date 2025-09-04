/**
 * Gemma AI 엔진용 마스터 프롬프트
 * libs/prompts/gemma_master_prompt.js
 */

window.MASTER_PROMPTS = {
    step1: `테스트케이스를 종합 분석하여 테스트 목적을 파악하고 환경 설정을 결정해주세요.

=== 테스트케이스 정보 ===
Summary: "{{parsedTC.summary}}"
Precondition: {{parsedTC.precondition}}
Steps: {{parsedTC.steps}}
Expected Result: "{{parsedTC.expectedResult}}"

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

** 출력 규칙 **
오직 유효한 JSON 객체만 반환하세요. 추가 설명, 마크다운, 코드블록 절대 금지.
JSON 생성이 불가능한 경우 정확히 다음 형태로만 반환: {"error":"짧은 사유"}

** 토큰 길이 정책 **
프롬프트가 너무 길어 응답이 중단될 가능성이 있는 경우:
- 요약된 결과를 포함하여 {"partial":true, "summary":"요약내용", ...} 형태로 반환
- 또는 간결한 오류 응답: {"error":"토큰 초과로 요약 응답"}

** 응답 언어 정책 **
JSON 응답의 설명 부분만 한국어로 작성하세요. 스크립트 코드는 영어 변수명과 API 사용. 날짜는 YYYY-MM-DD 형식, 숫자에 천단위 구분자 사용 금지.

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
Steps: {{parsedTC.steps}}
Expected Result: "{{parsedTC.expectedResult}}"
Environment Setup: {{step1Result.environmentSetup}}
Precondition Analysis: {{step1Result.preconditionAnalysis}}

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

** 출력 규칙 **
오직 유효한 JSON 객체만 반환하세요. 추가 설명, 마크다운, 코드블록 절대 금지.
JSON 생성이 불가능한 경우 정확히 다음 형태로만 반환: {"error":"짧은 사유"}

** 토큰 길이 정책 **
프롬프트가 너무 길어 응답이 중단될 가능성이 있는 경우:
- 요약된 결과를 포함하여 {"partial":true, "summary":"요약내용", ...} 형태로 반환
- 또는 간결한 오류 응답: {"error":"토큰 초과로 요약 응답"}

** 응답 언어 정책 **
JSON 응답의 설명 부분만 한국어로 작성하세요. 스크립트 코드는 영어 변수명과 API 사용. 날짜는 YYYY-MM-DD 형식, 숫자에 천단위 구분자 사용 금지.

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
{{step1Result}}

=== 2단계 분석 결과 ===
{{step2Result}}

=== 우수 예제 스크립트 ===
{{examples}}

=== 설계도(Plan) 작성 지침 ===
1. 구조 설계: 전체 스크립트의 try-finally 구조, 섹션 주석 등을 포함한 기본 골격을 설계합니다.
2. 액션 통합: 1, 2단계에서 분석된 환경 설정, 핵심 액션, 검증 로직을 논리적 순서에 맞게 배치합니다.
3. 코드 레벨 지시사항: 각 액션에 필요한 findTestObject, GlobalVariable 사용법을 명시합니다.
4. 예제 스타일 반영: 우수 예제의 코딩 스타일을 반영하여 계획을 세웁니다.

** 출력 규칙 **
오직 유효한 JSON 객체만 반환하세요. 추가 설명, 마크다운, 코드블록 절대 금지.
JSON 생성이 불가능한 경우 정확히 다음 형태로만 반환: {"error":"짧은 사유"}

** 토큰 길이 정책 **
프롬프트가 너무 길어 응답이 중단될 가능성이 있는 경우:
- 요약된 결과를 포함하여 {"partial":true, "summary":"요약내용", ...} 형태로 반환
- 또는 간결한 오류 응답: {"error":"토큰 초과로 요약 응답"}

** 응답 언어 정책 **
JSON 응답의 설명 부분만 한국어로 작성하세요. 스크립트 코드는 영어 변수명과 API 사용. 날짜는 YYYY-MM-DD 형식, 숫자에 천단위 구분자 사용 금지.

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

    step4: `당신은 1차 코드 생성 AI입니다.
아래 제공된 설계도(Plan)를 보고, 지시사항을 정확하게 코드로 변환하는 역할을 수행합니다.

=== 스크립트 설계도 (JSON) ===
{{plan}}

=== 1차 코드 생성 규칙 ===
1. 설계도의 plan 배열에 있는 모든 instruction을 순서대로 코드로 변환합니다.
2. WebUI.openBrowser 사용 시, 항상 WebUI.openBrowser('')와 같이 빈 문자열 인자를 포함하여 생성하세요.
3. overallStructure가 try-finally이면, finalization의 내용은 finally 블록에 위치시켜야 합니다.
4. import 구문, def 변수 선언, 함수 정의, catch 블록은 절대 사용하지 마세요.
5. 모든 주석 절대 금지. 순수한 실행 코드만 작성하세요.

** 코드 품질 금지사항 **
- 
WebUI.verify...
 계열의 메서드는 그 자체로 검증 단계이므로, 절대 if문으로 감싸지 마세요. 특히 빈 if문은 절대 금지입니다.
- 동일한 패턴의 중복 코드 반복 금지
- waitForElementPresent와 verifyElementPresent 중복 사용 금지
- 빈 로그 처리나 의미없는 주석 처리 금지
- TestObject 변수 선언 후 단순 확인만 하는 패턴 금지

** 출력 규칙 **
완전한 Groovy 스크립트만 반환하세요. 주석, 설명, JSON, 마크다운, 코드블록 절대 금지.
바로 실행 가능한 순수 코드로만 응답해야 합니다.`,

    step5: `당신은 코드 품질 검증 및 최종 개선 AI입니다.
1차 생성된 코드와 우수 예제 스크립트들을 비교 분석하여 최종 완성된 코드를 생성합니다.

=== 1차 생성 코드 ===
{{firstCode}}

=== 우수 예제 스크립트 ===
{{examples}}

=== 비교 분석 및 개선 지침 ===

**핵심 원칙**: 예제는 절대적인 규칙이 아닌 모범 사례입니다. 1차 코드의 고유한 로직과 의도를 반드시 존중하세요. 불필요한 기계적 변경을 지양하고, 수정이 필요하지 않다고 판단되면 1차 코드를 그대로 유지해도 좋습니다.

**의미상 중복 제거 원칙**: 하나의 동작이 다른 동작의 결과를 이미 포함하고 있다면, 불필요한 동작을 제거하여 코드를 간결하게 만드세요. 아래 예시를 참고하여 다른 모든 유사한 중복 패턴을 스스로 찾아내어 개선해야 합니다.
- **예시 1**: 
WebUI.verifyElementPresent
는 내부에 
waitForElementPresent
의 기능을 포함하므로, 두 명령어가 같은 객체에 연속으로 사용되면 
waitForElementPresent
를 제거합니다.
- **예시 2**: 
WebUI.click
 후 페이지 로드가 예상된다면, 
WebUI.waitForPageLoad
가 이미 대기 시간을 포함하므로 불필요한 
WebUI.delay
는 제거합니다.
- **예시 3**: 이 외에도, 기능적으로 유사하거나 선행 단계가 후행 단계를 포함하는 모든 중복 패턴을 찾아내어 가장 효율적인 코드로 개선하세요.

** 코드 스타일 비교 **
1. 변수명, 메서드 호출 패턴의 일관성 확인
2. try-finally 구조와 예외 처리 패턴 비교
3. WebUI API 사용법과 파라미터 순서 검토
4. Object Repository 경로 구조와 명명 규칙 확인

** 로직 구조 비교 **
1. 대기 로직 (waitFor~ 메서드) 사용 패턴 분석
2. 검증 로직 (verify~ 메서드) 배치와 순서 검토
3. 페이지 이동과 요소 상호작용 플로우 비교
4. 에러 핸들링과 리소스 정리 패턴 확인

** 개선 우선순위 **
1. 치명적 오류: 문법 오류, API 사용법 오류 즉시 수정
2. 스타일 불일치: 예제와 다른 코딩 패턴을 예제 스타일로 통일
3. 로직 최적화: 불필요한 중복이나 비효율적 순서 개선
4. 안정성 강화: 누락된 대기 로직이나 검증 단계 보완

** 코드 정리 및 최적화 **
- WebUI.openBrowser()가 있다면, WebUI.openBrowser('')로 수정하여 안정성을 높입니다.
- 
if (WebUI.verify...(...)) { ... }
 와 같이 
verify
 메서드를 조건으로 사용하는 불필요한 if문을 제거하고, 
WebUI.verify...(...)
 라인만 남깁니다. 
verify
는 자체적으로 실패를 핸들링합니다.
- TestObject 변수 선언 후 한 번만 사용하는 비효율적 패턴 개선
- 실제 테스트 로직에 집중한 간결한 코드 생성

** 출력 규칙 **
완전한 Groovy 스크립트만 반환하세요. 주석, 설명, JSON, 마크다운, 코드블록 절대 금지.
바로 실행 가능한 순수 코드로만 응답해야 합니다.
예제의 모범 사례를 반영한 최종 완성 코드를 제공하세요.`
};

console.log('MASTER_PROMPTS 설정 완료');