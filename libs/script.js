// TC Merger 전용 전역 변수
let tcMergeData = [];
let tcSplitData = [];
let tcMergedExport = [];
let tcSplitExport = [];

// TESTMO 원본 탭 전환 함수 (기존 유지)
function switchTab(tab) {
  // 탭 버튼 활성화 상태 변경
  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[onclick="switchTab('${tab}')"]`).classList.add('active');
  
  // 탭 내용 표시/숨김
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  document.getElementById(tab + 'Tab').classList.add('active');
}

// 병합 탭 파일 업로드 (HTML ID에 맞춤)
document.addEventListener('DOMContentLoaded', function() {
  const mergeInput = document.getElementById('mergeFileInput');
  if (mergeInput) {
    mergeInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (!file) return;
      
      if (!file.name.endsWith('.csv')) {
        alert('CSV 파일만 업로드할 수 있습니다.');
        this.value = '';
        return;
      }
      
      // 파일 레이블 업데이트
      const label = this.nextElementSibling;
      if (label) {
        label.innerHTML = `✅ ${file.name}`;
        label.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      }
      
      const fileInfo = document.getElementById('mergeFileInfo');
      if (fileInfo) {
        fileInfo.innerHTML = `📁 파일: ${file.name} (${(file.size/1024).toFixed(1)}KB)`;
        fileInfo.style.display = 'block';
      }
      
      const cleaningInfo = document.getElementById('mergeCleaningInfo');
      if (cleaningInfo) {
        cleaningInfo.style.display = 'block';
      }
      
      const reader = new FileReader();
      reader.onload = function(evt) {
        const csvText = evt.target.result;
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: false,
          complete: function(results) {
            tcMergeData = results.data.map(row => {
              const cleanedRow = {};
              Object.keys(row).forEach(key => {
                let value = row[key];
                if (typeof value === 'string') {
                  value = cleanHtmlTags(value);
                }
                cleanedRow[key] = value;
              });
              return cleanedRow;
            });
            
            // 자동으로 병합 실행
            executeMerge();
          }
        });
      };
      reader.readAsText(file, 'utf-8');
    });
  }

  // 분리 탭 파일 업로드
  const splitInput = document.getElementById('splitFileInput');
  if (splitInput) {
    splitInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (!file) return;
      
      if (!file.name.endsWith('.xlsx')) {
        alert('Excel 파일(.xlsx)만 업로드할 수 있습니다.');
        this.value = '';
        return;
      }
      
      // 파일 레이블 업데이트
      const label = this.nextElementSibling;
      if (label) {
        label.innerHTML = `✅ ${file.name}`;
        label.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      }
      
      const fileInfo = document.getElementById('splitFileInfo');
      if (fileInfo) {
        fileInfo.innerHTML = `📁 파일: ${file.name} (${(file.size/1024).toFixed(1)}KB)`;
        fileInfo.style.display = 'block';
      }
      
      const cleaningInfo = document.getElementById('splitCleaningInfo');
      if (cleaningInfo) {
        cleaningInfo.style.display = 'block';
      }
      
      const reader = new FileReader();
      reader.onload = function(evt) {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawJson = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
        
        tcSplitData = rawJson.map(row => {
          const cleanedRow = {};
          Object.keys(row).forEach(key => {
            let value = row[key];
            if (typeof value === 'string') {
              value = cleanHtmlTags(value);
            }
            cleanedRow[key] = value;
          });
          return cleanedRow;
        });

        // Combined Steps가 없으면 생성 (유연한 열 매칭)
        tcSplitData.forEach((row, index) => {
          if (!row['Steps']) {
            let combinedSteps = '';
            
            // 1. Steps (Step) 유형의 열 찾기 (유연한 매칭)
            const stepLikeKeys = Object.keys(row).filter(k => {
              const normalized = k.toLowerCase().replace(/[\s\(\)]/g, '');
              return normalized.includes('stepsstep') || normalized.includes('steps') || normalized === 'step';
            });
            
            if (stepLikeKeys.length > 0) {
              const key = stepLikeKeys[0];
              if (row[key] && row[key].toString().trim()) {
                combinedSteps += row[key].toString().trim() + '\n';
              }
            }
            
            // 2. Step 1-6 개별 열들 찾기 (유연한 매칭)
            for (let i = 1; i <= 6; i++) {
              const possibleKeys = Object.keys(row).filter(k => {
                const normalized = k.toLowerCase().replace(/[\s\(\)]/g, '');
                return normalized === `step${i}` || 
                       normalized === `step${i}step${i}` ||
                       normalized.includes(`step${i}`);
              });
              
              if (possibleKeys.length > 0) {
                const key = possibleKeys[0];
                if (row[key] && row[key].trim()) {
                  combinedSteps += `${i}. ${row[key].trim()}\n`;
                }
              }
            }
            
            tcSplitData[index]['Steps'] = combinedSteps.trim();
          }
        });
        
        // 자동으로 분리 실행
        executeSplit();
      };
      reader.readAsArrayBuffer(file);
    });
  }
});

function executeMerge() {
  if (tcMergeData.length === 0) {
    const resultDiv = document.getElementById('mergeResult');
    if (resultDiv) {
      resultDiv.innerHTML = '<div class="warning-message">⚠️ CSV 파일을 먼저 업로드해주세요.</div>';
    }
    return;
  }

  tcMergedExport = [];
  let html = `<table class="tcmerger-table"><thead><tr>
      <th>Folder</th><th>Main Category</th><th>Sub Category</th><th>Detail Category</th>
      <th>Summary</th><th>Precondition</th><th>Test Level</th>
      <th>Expected Result</th><th>Steps</th>
  </tr></thead><tbody>`;

  tcMergeData.forEach((row, index) => {
    let combinedSteps = '';
    let stepIndex = 1;
    
    // Steps (Step) 찾기
    const stepLikeKeys = Object.keys(row).filter(k => k.toLowerCase().replace(/\s+/g, '') === 'steps(step)');
    if (stepLikeKeys.length > 0) {
      const key = stepLikeKeys[0];
      if (row[key] && row[key].toString().trim()) {
        combinedSteps += `${stepIndex++}. ${row[key].toString().trim()}\n`;
      }
    }
    
    // Step 1-6 병합
    for (let i = 1; i <= 6; i++) {
      const key = `Step ${i} (Step ${i})`;
      if (row[key] && row[key].trim()) {
        combinedSteps += `${stepIndex++}. ${row[key].trim()}\n`;
      }
    }
    
    const finalCombinedSteps = combinedSteps.trim();
    const expectedResult = row['Expected Result (Expected Result)'] || row['Expected Result'] || '';
    const numberedExpectedResult = addNumberingToText(expectedResult);
    
    tcMergedExport.push({
        'Folder': row['Folder'],
        'Main Category': row['Main Category'],
        'Sub Category': row['Sub Category'],
        'Detail Category': row['Detail Category'],
        'Summary': row['TC Summary'] || row['Summary'] || '',
        'Precondition': row['Precondition'],
        'Test Level': row['Test Level'],
        'Expected Result': numberedExpectedResult,
        'Steps': finalCombinedSteps
    });
        
    html += `<tr>
        <td>${preserveLineBreaks(row['Folder'])}</td>
        <td>${preserveLineBreaks(row['Main Category'])}</td>
        <td>${preserveLineBreaks(row['Sub Category'])}</td>
        <td>${preserveLineBreaks(row['Detail Category'])}</td>
        <td>${preserveLineBreaks(row['TC Summary'] || row['Summary'] || '')}</td>
        <td>${preserveLineBreaks(row['Precondition'])}</td>
        <td>${preserveLineBreaks(row['Test Level'])}</td>
        <td>${preserveLineBreaks(numberedExpectedResult)}</td>
        <td>${preserveLineBreaks(finalCombinedSteps)}</td>
    </tr>`;
  });
  
  html += '</tbody></table>';
  const resultDiv = document.getElementById('mergeResult');
  if (resultDiv) {
    resultDiv.innerHTML = html;
  }
}

function executeSplit() {
  if (tcSplitData.length === 0) {
    const resultDiv = document.getElementById('splitResult');
    if (resultDiv) {
      resultDiv.innerHTML = '<div class="warning-message">⚠️ Excel 파일을 먼저 업로드해주세요.</div>';
    }
    return;
  }

  tcSplitExport = [];
  let html = `<table class="tcmerger-table"><thead><tr>
    <th>Folder</th><th>Main Category</th><th>Sub Category</th><th>Detail Category</th>
    <th>TC Summary</th><th>Precondition</th><th>Test Level</th>
    <th>Expected Result</th><th>Steps (Step)</th>
    <th>Step 1</th><th>Step 2</th><th>Step 3</th><th>Step 4</th><th>Step 5</th><th>Step 6</th>
  </tr></thead><tbody>`;

  tcSplitData.forEach(row => {
    // Combined Steps 데이터 가져오기 (유연한 매칭)
    let combinedSteps = '';
    const combinedStepsKeys = Object.keys(row).filter(k => {
      const normalized = k.toLowerCase().replace(/[\s]/g, '');
      return normalized.includes('combinedsteps') || normalized === 'steps';
    });
    
    if (combinedStepsKeys.length > 0) {
      combinedSteps = row[combinedStepsKeys[0]] || '';
    }
    
    const steps = splitCombinedSteps(combinedSteps);
    
    // Expected Result 유연한 매칭
    let expectedResult = '';
    const expectedResultKeys = Object.keys(row).filter(k => {
      const normalized = k.toLowerCase().replace(/[\s\(\)]/g, '');
      return normalized.includes('expectedresult') || normalized === 'expected';
    });
    
    if (expectedResultKeys.length > 0) {
      expectedResult = row[expectedResultKeys[0]] || '';
    }
    
    // Summary 유연한 매칭 (summary, tc summary 대소문자 무관)
    let tcSummary = '';
    const summaryKeys = Object.keys(row).filter(k => {
      const normalized = k.toLowerCase().replace(/[\s]/g, '');
      return normalized.includes('summary') || normalized === 'summary';
    });
    
    if (summaryKeys.length > 0) {
      tcSummary = row[summaryKeys[0]] || '';
    }

    tcSplitExport.push({
      'Folder': row['Folder'] || '',
      'Main Category': row['Main Category'] || '',
      'Sub Category': row['Sub Category'] || '',
      'Detail Category': row['Detail Category'] || '',
      'TC Summary': tcSummary,
      'Precondition': row['Precondition'] || '',
      'Test Level': row['Test Level'] || '',
      'Expected Result': expectedResult,
      'Steps (Step)': steps[0],
      'Step 1': steps[1], 'Step 2': steps[2], 'Step 3': steps[3],
      'Step 4': steps[4], 'Step 5': steps[5], 'Step 6': steps[6],
    });

    html += `<tr>
      <td>${preserveLineBreaks(row['Folder'] || '')}</td>
      <td>${preserveLineBreaks(row['Main Category'] || '')}</td>
      <td>${preserveLineBreaks(row['Sub Category'] || '')}</td>
      <td>${preserveLineBreaks(row['Detail Category'] || '')}</td>
      <td>${preserveLineBreaks(tcSummary)}</td>
      <td>${preserveLineBreaks(row['Precondition'] || '')}</td>
      <td>${preserveLineBreaks(row['Test Level'] || '')}</td>
      <td>${preserveLineBreaks(expectedResult)}</td>
      <td>${preserveLineBreaks(steps[0])}</td>
      <td>${preserveLineBreaks(steps[1])}</td>
      <td>${preserveLineBreaks(steps[2])}</td>
      <td>${preserveLineBreaks(steps[3])}</td>
      <td>${preserveLineBreaks(steps[4])}</td>
      <td>${preserveLineBreaks(steps[5])}</td>
      <td>${preserveLineBreaks(steps[6])}</td>
    </tr>`;
  });

  html += '</tbody></table>';
  const resultDiv = document.getElementById('splitResult');
  if (resultDiv) {
    resultDiv.innerHTML = html;
  }
}

function downloadResult(type) {
  const wb = XLSX.utils.book_new();
  let ws;
  
  if (type === 'merged') {
    if (tcMergedExport.length === 0) {
      alert('병합 결과가 없습니다. CSV 파일을 업로드하고 병합을 실행해주세요.');
      return;
    }
    ws = XLSX.utils.json_to_sheet(tcMergedExport);
    XLSX.utils.book_append_sheet(wb, ws, 'Merged Result');
    XLSX.writeFile(wb, 'merged_result.xlsx');
  } else if (type === 'split') {
    if (tcSplitExport.length === 0) {
      alert('분리 결과가 없습니다. Excel 파일을 업로드하고 분리를 실행해주세요.');
      return;
    }
    ws = XLSX.utils.json_to_sheet(tcSplitExport);
    XLSX.utils.book_append_sheet(wb, ws, 'Split Result');
    XLSX.writeFile(wb, 'split_result.xlsx');
  }
}

// HTML에서 호출하는 함수들 추가
function downloadMergeResult() {
  downloadResult('merged');
}

function downloadSplitResult() {
  downloadResult('split');
}

// 유틸리티 함수들
function preserveLineBreaks(text) {
  return (text || '').toString().replace(/\n/g, '<br>');
}

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

function addNumberingToText(text) {
  if (!text || !text.toString().trim()) return text;
  
  const textStr = text.toString().trim();
  if (/^1\.\s/.test(textStr)) {
    return textStr;
  }
  
  return `1. ${textStr}`;
}

function addLineNumbering(text) {
  if (!text || !text.toString().trim()) return text;

  const lines = text.toString().trim().split('\n').filter(line => line.trim() !== '');
  return lines.map((line, index) => `${index + 1}. ${line.trim()}`).join('\n');
}

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
