// ==================== CSV 파싱 메뉴 관련 코드 ====================

// CSV 파싱 로직
let parsed = [];

// 표준 필드 정의
const standardFields = [
  'Test Level', 'Main Category', 'Sub Category', 'Detail Category',
  'Summary', 'Precondition', 'Steps', 'Expected Result'
];

// CSV 파일 업로드 이벤트 리스너
document.getElementById('csvFile').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const errorDiv = document.getElementById('error');
  errorDiv.textContent = '';

  const reader = new FileReader();
  reader.onload = function(event) {
    const csv = event.target.result;
    const matches = [...csv.matchAll(/comment\(""[\r\n]+([\s\S]*?)[\r\n]+""\)/g)];
    parsed = [];

    for (let i = 0; i < matches.length; i++) {
      const lines = matches[i][1].split(/\r?\n/);
      const obj = { Index: i + 1 };
      let currentKey = null;
      let currentValue = [];

      const pushCurrent = () => {
        if (currentKey) {
          obj[currentKey] = currentValue.join('<br>');
          currentKey = null;
          currentValue = [];
        }
      };

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (line.startsWith('=') || line === '') continue;

        const parts = line.split(':');
        if (parts.length >= 2) {
          pushCurrent();
          currentKey = parts[0].trim();
          currentValue.push(parts.slice(1).join(':').trim());
        } else if (currentKey) {
          currentValue.push(line);
        }
      }
      pushCurrent();

      // 표준 필드만 추출하고 누락된 필드는 빈 문자열로 채움
      const standardObj = { Index: i + 1 };
      standardFields.forEach(field => {
        standardObj[field] = obj[field] || '';
      });
      
      parsed.push(standardObj);
    }

    if (parsed.length === 0) {
      errorDiv.textContent = '⚠️ 유용한 comment(""" ... """) 메타데이터 블록을 찾을 수 없습니다.';
      return;
    }

    // 고정된 컬럼 순서 사용
    const fixedColumns = ['Index', ...standardFields];
    const data = parsed.map(row => fixedColumns.map(k => row[k] || ''));

    const table = $('#resultTable');
    table.show();
    table.DataTable({
      data: data,
      columns: fixedColumns.map(h => ({ title: h })),
      destroy: true,
      scrollX: true,
      pageLength: 10
    });
  };
  reader.readAsText(file, 'UTF-8');
});

// Excel 다운로드 버튼 이벤트
document.getElementById('downloadBtn').addEventListener('click', function() {
  if (!parsed || parsed.length === 0) {
    alert("다운로드할 데이터가 없습니다.");
    return;
  }

  const converted = parsed.map(row => {
    const newRow = {};
    for (const key in row) {
      const raw = row[key];
      newRow[key] = typeof raw === 'string' ? raw.replace(/<br\s*\/?>/g, '\n') : raw;
    }
    return newRow;
  });

  const worksheet = XLSX.utils.json_to_sheet(converted);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Metadata");

  const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "testcase_metadata.xlsx";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// 예시 파일 다운로드 버튼 이벤트
document.getElementById('exampleDownloadBtn').addEventListener('click', function() {
  const headers = [
    "Index", "Test Level", "Main Category", "Sub Category", "Detail Category",
    "Summary", "Precondition", "Steps", "Expected Result"
  ];

  const data = [headers];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Testcase");

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/octet-stream" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "testcase_예시파일.xlsx";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});