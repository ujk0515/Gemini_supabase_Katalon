// ==================== UI 유틸리티 함수들 ====================

/**
 * 에러 메시지 표시 함수
 * @param {string} message - 표시할 에러 메시지
 */
function showError(message) {
  const errorDiv = document.getElementById('error');
  if (!errorDiv) return;
  
  errorDiv.innerHTML = `
    <div style="display: flex; align-items: center;">
      <span style="margin-right: 10px;">⚠️</span>
      <span>${message}</span>
    </div>
  `;
  errorDiv.style.display = 'block';
  
  // 3초 후 자동 숨김
  setTimeout(() => {
    errorDiv.style.display = 'none';
  }, 3000);
}

/**
 * 성공 메시지 표시 함수
 * @param {string} message - 표시할 성공 메시지
 */
function showSuccess(message) {
  const errorDiv = document.getElementById('error');
  if (!errorDiv) return;
  
  errorDiv.innerHTML = `
    <div style="display: flex; align-items: center; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); color: #065f46; border-left-color: #10b981;">
      <span style="margin-right: 10px;">✅</span>
      <span>${message}</span>
    </div>
  `;
  errorDiv.style.display = 'block';
  
  // 3초 후 자동 숨김
  setTimeout(() => {
    errorDiv.style.display = 'none';
  }, 3000);
}

/**
 * 로딩 상태 표시 함수
 * @param {HTMLElement} buttonElement - 로딩을 표시할 버튼 요소
 * @param {string} originalText - 버튼의 원래 텍스트
 */
function showLoading(buttonElement, originalText) {
  if (!buttonElement) return;
  
  buttonElement.innerHTML = `<span class="loading"></span>${originalText}`;
  buttonElement.disabled = true;
}

/**
 * 로딩 상태 해제 함수
 * @param {HTMLElement} buttonElement - 로딩을 해제할 버튼 요소
 * @param {string} originalText - 버튼의 원래 텍스트
 */
function hideLoading(buttonElement, originalText) {
  if (!buttonElement) return;
  
  buttonElement.innerHTML = originalText;
  buttonElement.disabled = false;
}

/**
 * 줄바꿈을 HTML <br> 태그로 변환
 * @param {string} text - 변환할 텍스트
 * @returns {string} - 변환된 텍스트
 */
function preserveLineBreaks(text) {
  return (text || '').toString().replace(/\n/g, '<br>');
}

/**
 * HTML 태그 정리 함수
 * @param {string} text - 정리할 텍스트
 * @returns {string} - 정리된 텍스트
 */
function cleanHtmlTags(text) {
  if (!text || typeof text !== 'string') return text;
  
  let cleanedText = text;
  
  // 1. 줄바꿈 관련 태그들을 \n으로 변환
  cleanedText = cleanedText
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(p|div|h[1-6]|li|tr)[^>]*>/gi, '\n')
    .replace(/<\/?(ul|ol|table|tbody|thead)[^>]*>/gi, '\n');
  
  // 2. 텍스트 서식 태그들 처리
  cleanedText = cleanedText
    .replace(/<\/?(?:b|strong)[^>]*>/gi, '')
    .replace(/<\/?(?:i|em)[^>]*>/gi, '')
    .replace(/<\/?u[^>]*>/gi, '')
    .replace(/<\/?s[^>]*>/gi, '');
  
  // 3. 링크 태그 처리
  cleanedText = cleanedText.replace(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, (match, url, text) => {
    if (text.trim() && text.trim().toLowerCase() !== url.trim().toLowerCase()) {
      return `${text.trim()} (${url.trim()})`;
    }
    return url.trim() || text.trim();
  });
  
  // 4. 이미지 태그 처리
  cleanedText = cleanedText.replace(/<img[^>]*alt=["']([^"']*)["'][^>]*>/gi, '[이미지: $1]');
  cleanedText = cleanedText.replace(/<img[^>]*src=["']([^"']*)["'][^>]*>/gi, '[이미지: $1]');
  cleanedText = cleanedText.replace(/<img[^>]*>/gi, '[이미지]');
  
  // 5. 나머지 HTML 태그 제거
  cleanedText = cleanedText.replace(/<script[^>]*>.*?<\/script>/gis, '');
  cleanedText = cleanedText.replace(/<style[^>]*>.*?<\/style>/gis, '');
  cleanedText = cleanedText.replace(/<[^>]+>/g, '');
  
  // 6. HTML 엔티티 디코딩
  cleanedText = cleanedText
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  
  // 7. 연속된 공백과 줄바꿈 정리
  cleanedText = cleanedText
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/^\s+|\s+$/g, '')
    .replace(/\n\s+/g, '\n')
    .replace(/\s+\n/g, '\n');
  
  return cleanedText;
}

/**
 * 텍스트에 자동 번호 매기기
 * @param {string} text - 번호를 매길 텍스트
 * @returns {string} - 번호가 매겨진 텍스트
 */
function addNumberingToText(text) {
  if (!text || !text.toString().trim()) return text;
  
  const textStr = text.toString().trim();
  if (/^1\.\s/.test(textStr)) {
    return textStr;
  }
  
  return `1. ${textStr}`;
}

/**
 * 텍스트 라인별 번호 매기기
 * @param {string} text - 번호를 매길 텍스트
 * @returns {string} - 라인별 번호가 매겨진 텍스트
 */
function addLineNumbering(text) {
  if (!text || !text.toString().trim()) return text;

  const lines = text.toString().trim().split('\n').filter(line => line.trim() !== '');
  return lines.map((line, index) => `${index + 1}. ${line.trim()}`).join('\n');
}

/**
 * Combined Steps를 개별 Step으로 분리
 * @param {string} combinedStepsText - 분리할 Combined Steps 텍스트
 * @returns {Array} - 분리된 Steps 배열 (7개 요소)
 */
function splitCombinedSteps(combinedStepsText) {
  if (!combinedStepsText || !combinedStepsText.toString().trim()) {
    return Array(7).fill('');
  }

  const text = combinedStepsText.toString().trim();
  const steps = Array(7).fill('');
  
  const lines = text.split(/\n/).map(line => line.trim()).filter(line => line.length > 0);
  
  if (lines.length === 0) return steps;
  
  let stepIndex = 0;
  
  for (let i = 0; i < lines.length && stepIndex < 7; i++) {
    const line = lines[i];
    const numberMatch = line.match(/^(\d+)\.\s*(.*)$/);
    
    if (numberMatch) {
      const stepContent = numberMatch[2].trim();
      steps[stepIndex] = stepContent;
      stepIndex++;
    } else if (line.trim() !== '') {
      steps[stepIndex] = line;
      stepIndex++;
    }
  }
  
  return steps;
}

// 전역 함수로 등록 (기존 HTML에서 사용할 수 있도록)
window.showError = showError;
window.showSuccess = showSuccess;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.preserveLineBreaks = preserveLineBreaks;
window.cleanHtmlTags = cleanHtmlTags;
window.addNumberingToText = addNumberingToText;
window.addLineNumbering = addLineNumbering;
window.splitCombinedSteps = splitCombinedSteps;

console.log('✅ ui-utils.js 로드 완료');