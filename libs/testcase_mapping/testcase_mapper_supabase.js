/**
 * 간단한 테스트케이스 매핑 시스템 (새 버전)
 * 핵심 기능만 200줄로 구현
 */

// ================================
// 전역 변수
// ================================
window.parsedTestcaseData = null;
window.generatedScript = null;
window.geminiExtractor = null;

// ================================
// 1. 테스트케이스 데이터 추출 (기존 파서 사용)
// ================================

async function extractTestcaseData() {
  const input = document.getElementById('testcaseInput').value.trim();
  console.log('📝 입력된 텍스트:', input);

  if (!input) {
    alert('테스트케이스 내용을 입력해주세요.');
    return;
  }

  // 로딩 표시
  const extractBtn = document.querySelector('.extract-btn');
  if (extractBtn) {
    extractBtn.textContent = '🔄 파싱 중...';
    extractBtn.disabled = true;
  }

  try {
    // 기존 파싱 함수 호출
    const parsedData = safeParseTestcase(input);
    console.log('✅ 파싱된 데이터:', parsedData);

    // 기존 표시 함수 호출
    safeDisplayParsedData(parsedData);
    window.parsedTestcaseData = parsedData;

    // 스크립트 전환 버튼 활성화
    const convertBtn = document.getElementById('convertBtn');
    if (convertBtn) convertBtn.disabled = false;

    console.log('🎉 파싱 완료');

  } catch (error) {
    console.error('❌ 파싱 오류:', error);
    alert('파싱 중 오류가 발생했습니다: ' + error.message);
  } finally {
    if (extractBtn) {
      extractBtn.textContent = '📊 데이터 추출';
      extractBtn.disabled = false;
    }
  }
}

// ================================
// 2. 키워드 추출 (단순화)
// ================================

async function extractKeywords(text) {
  console.log(`🤖 Gemini로 키워드 추출 시작: "${text}"`);

  // Gemini 키워드 추출 시도
  if (window.geminiExtractor) {
    try {
      const keywords = await window.geminiExtractor.extractKeywords(text);
      console.log(`✅ Gemini 키워드 추출 성공:`, keywords);
      return keywords;
    } catch (error) {
      console.warn('Gemini 실패, 기존 방식 사용:', error);
    }
  }

  // fallback: 기존 방식
  if (!text) return [];

  const words = text
    .replace(/[^\w\s가-힣]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 2)
    .map(word => word.toLowerCase())
    .filter(word => !/^\d+\.?$/.test(word));

  return [...new Set(words)];
}

// ================================
// 3. 수파베이스 철저한 매핑 검색
// ================================

async function findMapping(text) {
  console.log(`🔍 매핑 검색 시작: "${text}"`);

  const keywords = await extractKeywords(text);  // 👈 await 추가
  console.log(`🔤 추출된 키워드: [${keywords.join(', ')}]`);

  // 1단계: 전체 문장으로 검색
  console.log('🎯 1단계: 전체 문장 검색');
  if (window.findMappingInSupabase) {
    const fullTextResult = await window.findMappingInSupabase(text.trim());
    if (fullTextResult.found) {
      console.log(`✅ 전체 문장 매핑 발견: "${text}" → ${fullTextResult.action}`);
      return {
        action: fullTextResult.action,
        type: fullTextResult.type || 'verification',
        groovyCode: fullTextResult.mapping?.groovy_code || null,
        source: 'supabase_full'
      };
    }
  }

  // 2단계: 키워드 조합으로 검색 (모든 조합 시도)
  console.log('🎯 2단계: 키워드 조합 검색');
  if (keywords.length >= 2 && window.findMappingInSupabase) {
    // 2개 키워드 조합
    for (let i = 0; i < keywords.length - 1; i++) {
      for (let j = i + 1; j < keywords.length; j++) {
        const combination = `${keywords[i]} ${keywords[j]}`;
        console.log(`🔍 조합 검색: "${combination}"`);
        const result = await window.findMappingInSupabase(combination);
        if (result.found) {
          console.log(`✅ 조합 매핑 발견: "${combination}" → ${result.action}`);
          return {
            action: result.action,
            type: result.type || 'verification',
            groovyCode: result.mapping?.groovy_code || null,
            source: 'supabase_combination'
          };
        }
      }
    }

    // 3개 키워드 조합
    if (keywords.length >= 3) {
      for (let i = 0; i < keywords.length - 2; i++) {
        for (let j = i + 1; j < keywords.length - 1; j++) {
          for (let k = j + 1; k < keywords.length; k++) {
            const combination = `${keywords[i]} ${keywords[j]} ${keywords[k]}`;
            console.log(`🔍 3개 조합 검색: "${combination}"`);
            const result = await window.findMappingInSupabase(combination);
            if (result.found) {
              console.log(`✅ 3개 조합 매핑 발견: "${combination}" → ${result.action}`);
              return {
                action: result.action,
                type: result.type || 'verification',
                groovyCode: result.mapping?.groovy_code || null,
                source: 'supabase_triple'
              };
            }
          }
        }
      }
    }
  }

  // 3단계: 개별 키워드 철저 검색 (모든 키워드 시도)
  console.log('🎯 3단계: 개별 키워드 철저 검색');
  const foundMappings = [];

  if (window.findMappingInSupabase) {
    for (const keyword of keywords) {
      console.log(`🔍 개별 키워드 검색: "${keyword}"`);
      const result = await window.findMappingInSupabase(keyword);
      if (result.found) {
        console.log(`✅ 개별 키워드 매핑 발견: "${keyword}" → ${result.action}`);
        foundMappings.push({
          action: result.action,
          type: result.type || 'verification',
          groovyCode: result.mapping?.groovy_code || null,
          source: 'supabase_individual',
          keyword: keyword,
          priority: getPriorityScore(keyword, text)
        });
      }
    }
  }

  // 가장 우선순위 높은 매핑 선택
  if (foundMappings.length > 0) {
    const bestMapping = foundMappings.sort((a, b) => b.priority - a.priority)[0];
    console.log(`🎯 최우선 매핑 선택: "${bestMapping.keyword}" → ${bestMapping.action} (우선순위: ${bestMapping.priority})`);
    return bestMapping;
  }

  // 4단계: 다른 테이블들 검색 시도
  console.log('🎯 4단계: 다른 테이블 검색 시도');
  const alternativeResult = await searchAlternativeTables(text, keywords);
  if (alternativeResult) {
    console.log(`✅ 대체 테이블에서 매핑 발견: ${alternativeResult.action}`);
    return alternativeResult;
  }

  // 5단계: 유사어/동의어로 재검색
  console.log('🎯 5단계: 유사어/동의어 검색');
  const synonymResult = await searchWithSynonyms(keywords);
  if (synonymResult) {
    console.log(`✅ 유사어로 매핑 발견: ${synonymResult.action}`);
    return synonymResult;
  }

  // 최종: 로컬 fallback 매핑
  console.log('🎯 최종 단계: 로컬 fallback 매핑');
  const localMapping = getLocalMapping(text, keywords);
  console.log(`🎯 로컬 매핑 적용: ${localMapping.action}`);
  return localMapping;
}

// 키워드 우선순위 점수 계산
function getPriorityScore(keyword, originalText) {
  let score = 0;

  // 액션 관련 키워드는 높은 점수
  const actionKeywords = ['클릭', 'click', '입력', 'input', '업로드', 'upload', '다운로드', 'download', '확인', 'verify'];
  if (actionKeywords.includes(keyword.toLowerCase())) score += 10;

  // 텍스트 앞부분에 있으면 높은 점수
  const position = originalText.toLowerCase().indexOf(keyword.toLowerCase());
  if (position >= 0) {
    score += Math.max(0, 10 - Math.floor(position / 10));
  }

  // 키워드 길이가 길수록 높은 점수 (더 구체적)
  score += Math.min(5, keyword.length);

  return score;
}

// 대체 테이블 검색 (상위 4개 테이블만 사용)
async function searchAlternativeTables(text, keywords) {
  console.log('🚀 상위 4개 테이블 병렬 검색 시작...');

  // 기존에 동작하는 함수가 있는지 확인
  if (!window.findMappingInSupabase || typeof window.findMappingInSupabase !== 'function') {
    console.warn('findMappingInSupabase 함수를 찾을 수 없습니다.');
    return null;
  }

  console.log('✅ findMappingInSupabase 함수 발견');

  // 상위 4개 테이블 직접 검색 시도
  let supabaseClient = null;
  if (window.getSupabaseClient) {
    supabaseClient = window.getSupabaseClient();
  } else if (typeof window.supabase === 'function') {
    supabaseClient = window.supabase();
  } else {
    supabaseClient = window.supabase;
  }

  const searchPromises = [];

  // 상위 4개 테이블 직접 검색
  if (supabaseClient && typeof supabaseClient.from === 'function') {
    console.log('✅ 수파베이스 직접 접근 가능 - 상위 4개 테이블 검색');

    const topTables = [
      { name: 'keyword_mappings', priority: 10, searchColumns: 'keyword.ilike.%{keyword}%,action.ilike.%{keyword}%,meaning.ilike.%{keyword}%' },
      { name: 'complete_mappings', priority: 9, searchColumns: 'keywords.cs.{"{keyword}"},action.ilike.%{keyword}%,groovy_code.ilike.%{keyword}%' },
      { name: 'katalon_mapping_complete', priority: 8, searchColumns: 'keywords.cs.{"{keyword}"},action.ilike.%{keyword}%' },
      { name: 'katalon_mapping_observer', priority: 7, searchColumns: 'keywords.cs.{"{keyword}"},action.ilike.%{keyword}%' }
    ];

    // 키워드별로 상위 4개 테이블 검색
    for (const keyword of keywords.slice(0, 3)) {
      for (const table of topTables) {
        const searchQuery = table.searchColumns.replace(/{keyword}/g, keyword);

        searchPromises.push(
          supabaseClient
            .from(table.name)
            .select('*')
            .or(searchQuery)
            .limit(1)
            .then(({ data }) => {
              if (data?.[0]) {
                console.log(`✅ ${table.name}에서 발견: "${keyword}" → ${data[0].action}`);
                return {
                  ...data[0],
                  source: table.name,
                  keyword,
                  priority: table.priority + getPriorityScore(keyword, text)
                };
              }
              return null;
            })
            .catch(err => {
              console.warn(`${table.name} 검색 실패 (${keyword}):`, err.message);
              return null;
            })
        );
      }
    }

    // 전체 문장으로도 검색
    for (const table of topTables) {
      const searchQuery = table.searchColumns.replace(/{keyword}/g, text.trim());

      searchPromises.push(
        supabaseClient
          .from(table.name)
          .select('*')
          .or(searchQuery)
          .limit(1)
          .then(({ data }) => {
            if (data?.[0]) {
              console.log(`✅ ${table.name}에서 전체 문장 발견: "${text}" → ${data[0].action}`);
              return {
                ...data[0],
                source: table.name,
                keyword: 'full_text',
                priority: table.priority + 20 // 전체 문장은 높은 우선순위
              };
            }
            return null;
          })
          .catch(err => {
            console.warn(`${table.name} 전체 문장 검색 실패:`, err.message);
            return null;
          })
      );
    }
  }

  // 기존 findMappingInSupabase 함수도 병렬로 실행
  for (const keyword of keywords.slice(0, 3)) {
    searchPromises.push(
      window.findMappingInSupabase(keyword)
        .then(result => {
          if (result && result.found) {
            console.log(`✅ findMappingInSupabase에서 발견: "${keyword}" → ${result.action}`);
            return {
              ...result,
              keyword,
              priority: 5 + getPriorityScore(keyword, text), // 기존 함수는 중간 우선순위
              source: 'findMappingInSupabase'
            };
          }
          return null;
        })
        .catch(err => {
          console.warn(`findMappingInSupabase 검색 실패 (${keyword}):`, err.message);
          return null;
        })
    );
  }

  try {
    console.log(`⚡ ${searchPromises.length}개 검색 병렬 실행 중...`);

    // 모든 검색을 병렬로 실행 (최대 3초 타임아웃)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('검색 타임아웃')), 3000)
    );

    const results = await Promise.race([
      Promise.allSettled(searchPromises),
      timeoutPromise
    ]);

    // 성공한 결과들만 필터링
    const successfulResults = results
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => result.value);

    if (successfulResults.length > 0) {
      // 우선순위로 정렬 (높은 점수 우선)
      const bestResult = successfulResults.sort((a, b) => b.priority - a.priority)[0];

      console.log(`✅ 최고 우선순위 매핑 선택: "${bestResult.keyword}" → ${bestResult.action} (우선순위: ${bestResult.priority}, 소스: ${bestResult.source})`);

      return {
        action: bestResult.action,
        type: bestResult.type || 'verification',
        groovyCode: bestResult.groovy_code || bestResult.mapping?.groovy_code || null,
        source: bestResult.source
      };
    }

    console.log('❌ 모든 검색 실패');
    return null;

  } catch (error) {
    console.warn('병렬 검색 에러:', error.message);
    return null;
  }
}

// 카테고리에서 액션 추론
function inferActionFromCategory(category) {
  const categoryActionMap = {
    'click': 'Click',
    'input': 'Set Text',
    'verification': 'Verify Element Present',
    'upload': 'Upload File',
    'download': 'Download File',
    'navigation': 'Navigate To Url'
  };

  return categoryActionMap[category.toLowerCase()] || 'Verify Element Present';
}

// 유사어/동의어로 검색
async function searchWithSynonyms(keywords) {
  const synonymMap = {
    '업로드': ['upload', '올리기', '전송', '파일업로드'],
    '다운로드': ['download', '내려받기', '받기'],
    '클릭': ['click', '누르기', '터치', '선택'],
    '입력': ['input', '작성', '기입', '넣기'],
    '확인': ['verify', '검증', '체크', '점검'],
    '표시': ['display', '노출', '보임', '나타남'],
    '팝업': ['popup', '모달', 'modal', '대화상자'],
    '파일': ['file', '문서', '데이터'],
    '용량': ['size', '크기', '사이즈']
  };

  if (!window.findMappingInSupabase) return null;

  for (const keyword of keywords) {
    const synonyms = synonymMap[keyword.toLowerCase()] || [];

    for (const synonym of synonyms) {
      console.log(`🔍 유사어 검색: "${keyword}" → "${synonym}"`);
      const result = await window.findMappingInSupabase(synonym);
      if (result.found) {
        return {
          action: result.action,
          type: result.type || 'verification',
          groovyCode: result.mapping?.groovy_code || null,
          source: 'supabase_synonym'
        };
      }
    }
  }

  return null;
}

// ================================
// 4. 강화된 로컬 fallback 매핑
// ================================

function getLocalMapping(text, keywords) {
  const lowerText = text.toLowerCase();

  // 우선순위 순서로 체크 (더 구체적인 매핑)

  // 1. 파일 업로드 관련 (최우선)
  if (lowerText.includes('업로드') || lowerText.includes('upload') || lowerText.includes('파일선택')) {
    return { action: 'Upload File', type: 'upload', source: 'local' };
  }

  // 2. 파일 다운로드 관련
  if (lowerText.includes('다운로드') || lowerText.includes('download') || lowerText.includes('내려받기')) {
    return { action: 'Download File', type: 'download', source: 'local' };
  }

  // 3. 비밀번호 (보안 최우선)
  if (lowerText.includes('비밀번호') || lowerText.includes('password') || lowerText.includes('패스워드')) {
    return { action: 'Set Encrypted Text', type: 'encrypted_input', source: 'local' };
  }

  // 4. 입력 관련
  if (lowerText.includes('입력') || lowerText.includes('이메일') || lowerText.includes('아이디') || lowerText.includes('작성')) {
    return { action: 'Set Text', type: 'input', source: 'local' };
  }

  // 5. 클릭 관련
  if (lowerText.includes('클릭') || lowerText.includes('버튼') || lowerText.includes('로그인') || lowerText.includes('선택')) {
    return { action: 'Click', type: 'click', source: 'local' };
  }

  // 6. 팝업/모달 관련
  if (lowerText.includes('팝업') || lowerText.includes('모달') || lowerText.includes('대화상자')) {
    return { action: 'Verify Element Visible', type: 'visibility', source: 'local' };
  }

  // 7. 표시/노출 관련
  if (lowerText.includes('표시') || lowerText.includes('노출') || lowerText.includes('메시지') || lowerText.includes('나타남')) {
    return { action: 'Verify Element Visible', type: 'visibility', source: 'local' };
  }

  // 8. 텍스트 가져오기 관련
  if (lowerText.includes('텍스트') || lowerText.includes('내용') || lowerText.includes('값') || lowerText.includes('데이터')) {
    return { action: 'Get Text', type: 'get_text', source: 'local' };
  }

  // 9. 페이지 이동 관련
  if (lowerText.includes('이동') || lowerText.includes('페이지') || lowerText.includes('사이트') || lowerText.includes('접속')) {
    return { action: 'Navigate To Url', type: 'navigation', source: 'local' };
  }

  // 10. 드래그앤드롭 관련
  if (lowerText.includes('드래그') || lowerText.includes('끌어') || lowerText.includes('이동시')) {
    return { action: 'Drag And Drop', type: 'drag_drop', source: 'local' };
  }

  // 11. 기본값 (확인/검증)
  return { action: 'Verify Element Present', type: 'verification', source: 'local' };
}

// ================================
// 5. 그루비 스크립트 생성 (단순화)
// ================================

async function generateGroovyScript(mapping, text, sectionName, index) {
  const cleanText = text.replace(/"/g, '\\"');

  // Object Repository 경로 생성 (단순화)
  const objectName = await generateObjectName(text, sectionName, index);
  const objectPath = `Object Repository/${objectName}`;

  // 수파베이스에서 완전한 그루비 코드가 있으면 사용 (Comment 제외)
  if (mapping.groovyCode && !mapping.groovyCode.includes('WebUI.comment')) {
    return mapping.groovyCode.replace(/Object Repository\/[^']+/, objectPath);
  }

  // WebUI.comment가 포함된 액션은 무시하고 일반 액션으로 처리
  if (mapping.action && mapping.action.includes('WebUI.comment')) {
    // Comment 액션을 일반 액션으로 변환
    if (text.toLowerCase().includes('업로드')) {
      mapping.action = 'Upload File';
    } else if (text.toLowerCase().includes('확인') || text.toLowerCase().includes('검증')) {
      mapping.action = 'Verify Element Present';
    } else if (text.toLowerCase().includes('노출') || text.toLowerCase().includes('표시')) {
      mapping.action = 'Verify Element Visible';
    } else {
      mapping.action = 'Verify Element Present';
    }
  }

  // 액션별 그루비 스크립트 생성
  switch (mapping.action) {
    case 'Click':
      return `WebUI.click(findTestObject('${objectPath}'))`;

    case 'Set Text':
      const inputValue = text.toLowerCase().includes('이메일') ? 'test@example.com' : 'testvalue';
      return `WebUI.setText(findTestObject('${objectPath}'), '${inputValue}')`;

    case 'Set Encrypted Text':
      return `WebUI.setEncryptedText(findTestObject('${objectPath}'), 'encrypted_password')`;

    case 'Verify Element Present':
      return `WebUI.verifyElementPresent(findTestObject('${objectPath}'), 10)`;

    case 'Verify Element Visible':
      return `WebUI.verifyElementVisible(findTestObject('${objectPath}'))`;

    case 'Navigate To Url':
      return `WebUI.navigateToUrl('https://example.com')`;

    default:
      return `WebUI.comment("${mapping.action}: ${cleanText}")`;
  }
}

// ================================
// 6. Object Repository 이름 생성 (단순화)
// ================================

async function generateObjectName(text, sectionName, index) {
  // 핵심 키워드만 추출 (최대 3개)
  let keywords = [];
  try {
    const extracted = await extractKeywords(text);
    keywords = Array.isArray(extracted) ? extracted : [];
  } catch (error) {
    console.warn('키워드 추출 실패, 기본값 사용:', error);
    keywords = [];
  }

  const filteredKeywords = keywords
    .filter(word => word && typeof word === 'string' && word.length >= 2)
    .slice(0, 3);

  if (filteredKeywords.length === 0) {
    return `${sectionName.toLowerCase()}_${index}_element`;
  }

  return `${filteredKeywords.join('_')}_element`;
}

// ================================
// 7. 섹션별 스크립트 생성
// ================================

async function generateSectionScript(sectionName, textArray) {
  if (!textArray || textArray.length === 0) {
    return `        // === ${sectionName} ===\n        // No content\n\n`;
  }

  console.log(`🚀 ${sectionName} 섹션 처리 시작 (${textArray.length}개)`);

  let script = `        // === ${sectionName} ===\n`;

  for (let i = 0; i < textArray.length; i++) {
    const text = textArray[i];
    if (!text?.trim()) continue;

    console.log(`🎯 처리 중 [${i + 1}/${textArray.length}]: "${text.substring(0, 30)}..."`);

    try {
      // 매핑 검색
      const mapping = await findMapping(text);

      // 그루비 스크립트 생성
      const groovyScript = await generateGroovyScript(mapping, text, sectionName, i + 1);

      script += `        // ${text.trim()}\n`;
      script += `        ${groovyScript}\n`;

      console.log(`✅ 매핑 완료: ${mapping.action} (${mapping.source})`);

    } catch (error) {
      console.error(`❌ 매핑 실패:`, error);
      script += `        // ${text.trim()}\n`;
      script += `        WebUI.comment("TODO: ${text.replace(/"/g, '\\"')}")\n`;
    }
  }

  script += '\n';
  console.log(`✅ ${sectionName} 섹션 완료`);

  return script;
}

// ================================
// 8. 메인 스크립트 생성
// ================================

async function generateMappingScript() {
  console.log('🚀 간단 매핑 스크립트 생성 시작');

  if (!window.parsedTestcaseData) {
    alert('먼저 테스트케이스 데이터를 추출해주세요.');
    return;
  }

  // 로딩 표시
  const convertBtn = document.getElementById('convertBtn');
  if (convertBtn) {
    convertBtn.textContent = '🔄 매핑 중...';
    convertBtn.disabled = true;
  }

  try {
    const data = window.parsedTestcaseData;

    console.log('📋 데이터 확인:', {
      summary: data.summary ? `✅ (${data.summary.length}자)` : '❌',
      precondition: `✅ ${data.precondition?.length || 0}개`,
      steps: `✅ ${data.steps?.length || 0}개`,
      expectedResult: data.expectedResult ? `✅ (${data.expectedResult.length}자)` : '❌'
    });

    console.log('🔍 철저한 수파베이스 검색 시작 - 시간이 걸릴 수 있습니다...');

    // 각 섹션별 스크립트 생성 (철저한 검색)
    const preconditionScript = await generateSectionScript('Precondition', data.precondition);
    const summaryScript = await generateSectionScript('Summary', [data.summary].filter(Boolean));
    const stepsScript = await generateSectionScript('Steps', data.steps);
    const expectedResultScript = await generateSectionScript('Expected Result', [data.expectedResult].filter(Boolean));

    // 전체 스크립트 조합
    const fullScript = createFullScript(preconditionScript, summaryScript, stepsScript, expectedResultScript);

    // 화면에 표시
    displayScript(fullScript);

    console.log('🎉 매핑 스크립트 생성 완료');

  } catch (error) {
    console.error('❌ 스크립트 생성 실패:', error);
    alert('스크립트 생성 중 오류가 발생했습니다:\n' + error.message);
  } finally {
    if (convertBtn) {
      convertBtn.textContent = '⚡ 스크립트 전환';
      convertBtn.disabled = false;
    }
  }
}

// ================================
// 9. 전체 스크립트 조합
// ================================

function createFullScript(preconditionScript, summaryScript, stepsScript, expectedResultScript) {
  const timestamp = new Date().toLocaleString();

  return `// ========================================
// Katalon Test Script (Simple Version)
// Generated at: ${timestamp}
// ========================================
@Test
def testCase() {
    try {
        
${preconditionScript}${summaryScript}${stepsScript}${expectedResultScript}    } catch (Exception e) {
        WebUI.comment("Test failed: " + e.getMessage())
        throw e
    } finally {
        WebUI.closeBrowser()
    }
}`;
}

// ================================
// 10. UI 함수들
// ================================

function displayScript(script) {
  const scriptElement = document.getElementById('scriptResult');
  if (!scriptElement) return;

  // 간단한 스타일링
  const styledHTML = script
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/(WebUI\.\w+)/g, '<span style="color: #3b82f6; font-weight: bold;">$1</span>')
    .replace(/(\/\/.*)/g, '<span style="color: #6b7280;">$1</span>');

  scriptElement.innerHTML = `<pre style="margin: 0; font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.4;">${styledHTML}</pre>`;
  window.generatedScript = script;

  console.log('✅ 스크립트 화면 표시 완료');
}

// 기존 안전 함수들 (변경 없음)
function safeParseTestcase(input) {
  if (window.TestcaseParser?.parseTestcase) {
    return window.TestcaseParser.parseTestcase(input);
  }
  if (window.parseTestcase) {
    return window.parseTestcase(input);
  }
  return { summary: '', precondition: [], steps: [], expectedResult: '' };
}

function safeDisplayParsedData(data) {
  if (window.TestcaseParser?.displayParsedData) {
    return window.TestcaseParser.displayParsedData(data);
  }
  if (window.displayParsedData) {
    return window.displayParsedData(data);
  }
}

// 스크립트 복사 기능
function copyScript() {
  if (!window.generatedScript) {
    alert('복사할 스크립트가 없습니다.');
    return;
  }

  navigator.clipboard.writeText(window.generatedScript).then(() => {
    alert('✅ 스크립트가 클립보드에 복사되었습니다');
  }).catch(() => {
    alert('복사에 실패했습니다. 수동으로 복사해주세요.');
  });
}

// ================================
// 전역 함수 등록
// ================================

window.extractTestcaseData = extractTestcaseData;
window.generateMappingScript = generateMappingScript;
window.copyScript = copyScript;

console.log('✅ 간단한 테스트케이스 매핑 시스템 로드 완료 (200줄 버전)');

// 👇 이 코드 블록 전체 추가
// Gemini 키워드 추출기 초기화
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (window.GeminiKeywordExtractor) {
      window.geminiExtractor = new window.GeminiKeywordExtractor();
      console.log('✅ Gemini 키워드 추출기 초기화 완료');
    } else {
      console.warn('⚠️ Gemini 키워드 추출기를 찾을 수 없습니다');
    }
  }, 1000);
});

