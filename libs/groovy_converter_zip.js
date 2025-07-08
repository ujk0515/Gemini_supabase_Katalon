// ==================== Groovy 변환기 메뉴 관련 코드 ====================

// Groovy 변환 관련 변수
let testCases = [];

// UUID 생성 함수
function generateUUID() {
  return URL.createObjectURL(new Blob()).split('/').pop();
}

// 파일명 안전화 함수
function sanitizeFileName(name) {
  return name.replace(/[\\/:*?"<>|]/g, '').trim();
}

// Excel 파일 업로드 이벤트 리스너
document.getElementById('excelFile').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;

  testCases = [];
  const container = document.getElementById('preview');
  container.innerHTML = '';

  const reader = new FileReader();
  reader.onload = function (event) {
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet);

    json.forEach((row, idx) => {
      const rawName = row['Summary'] || row['Name'] || `TestCase_${idx + 1}`;
      const name = sanitizeFileName(rawName);
      const numberedName = `${String(idx + 1).padStart(3, '0')}_${name}`;
      const guid = generateUUID();

      const fields = ['Test Level', 'Main Category', 'Sub Category', 'Detail Category', 'Summary', 'Precondition', 'Steps', 'Expected Result'];
      const formatBlock = (label, value) => {
        if (!value) return `${label}   :`;
        return `${label}   : ${value.split(/\n|\\n/).map((l, i) => (i === 0 ? l : ' '.repeat(label.length + 5) + l)).join('\n')}`;
      };

      const comment = `=================== [Testcase] ===================\n\n` +
        fields.map(f => formatBlock(f, row[f])).join('\n') +
        `\n\n===================================================`;

      const groovy = `import static com.kms.katalon.core.checkpoint.CheckpointFactory.findCheckpoint\n` +
        `import static com.kms.katalon.core.testcase.TestCaseFactory.findTestCase\n` +
        `import static com.kms.katalon.core.testdata.TestDataFactory.findTestData\n` +
        `import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject\n` +
        `import static com.kms.katalon.core.testobject.ObjectRepository.findWindowsObject\n` +
        `import com.kms.katalon.core.checkpoint.Checkpoint as Checkpoint\n` +
        `import com.kms.katalon.core.cucumber.keyword.CucumberBuiltinKeywords as CucumberKW\n` +
        `import com.kms.katalon.core.mobile.keyword.MobileBuiltInKeywords as Mobile\n` +
        `import com.kms.katalon.core.model.FailureHandling as FailureHandling\n` +
        `import com.kms.katalon.core.testcase.TestCase as TestCase\n` +
        `import com.kms.katalon.core.testdata.TestData as TestData\n` +
        `import com.kms.katalon.core.testng.keyword.TestNGBuiltinKeywords as TestNGKW\n` +
        `import com.kms.katalon.core.testobject.TestObject as TestObject\n` +
        `import com.kms.katalon.core.webservice.keyword.WSBuiltInKeywords as WS\n` +
        `import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI\n` +
        `import com.kms.katalon.core.windows.keyword.WindowsBuiltinKeywords as Windows\n` +
        `import internal.GlobalVariable as GlobalVariable\n` +
        `import org.openqa.selenium.Keys as Keys\n\n` +
        `WebUI.comment(\""\"\n${comment}\n\""\")`;

      const tc = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n` +
        `<TestCaseEntity>\n` +
        `   <description></description>\n` +
        `   <name>${numberedName}</name>\n` +
        `   <tag></tag>\n` +
        `   <comment></comment>\n` +
        `   <recordOption>OTHER</recordOption>\n` +
        `   <testCaseGuid>${guid}</testCaseGuid>\n` +
        `</TestCaseEntity>`;

      testCases.push({ name: numberedName, tc, groovy });

      const div = document.createElement('div');
      div.innerHTML = `<strong>${numberedName}</strong><br>
        <button onclick="downloadGroovyZip('${numberedName}')\">.groovy ZIP 다운로드</button>
        <button onclick="downloadFile('${numberedName}', 'tc')\">.tc 다운로드</button><hr>`;
      container.appendChild(div);
    });
  };
  reader.readAsArrayBuffer(file);
});

// 개별 Groovy ZIP 다운로드
function downloadGroovyZip(name) {
  const tc = testCases.find(t => t.name === name);
  const zip = new JSZip();
  const folder = zip.folder(tc.name);
  folder.file(`${tc.name}.groovy`, tc.groovy);
  zip.generateAsync({ type: 'blob' }).then(content => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = `${tc.name}.zip`;
    a.click();
  });
}

// 개별 파일 다운로드
function downloadFile(name, type) {
  if (type === 'groovy') {
    downloadGroovyZip(name);
    return;
  }
  const tc = testCases.find(t => t.name === name);
  const content = tc[type];
  const blob = new Blob([content], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${name}.${type}`;
  a.click();
}

// 전체 파일 ZIP 생성
function generateAllZip(type) {
  const zip = new JSZip();
  testCases.forEach(tc => {
    if (type === 'groovy') {
      const folder = zip.folder(tc.name);
      folder.file(`${tc.name}.groovy`, tc.groovy);
    } else {
      zip.file(`${tc.name}.tc`, tc.tc);
    }
  });
  zip.generateAsync({ type: 'blob' }).then(content => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = `all_testcases_${type}.zip`;
    a.click();
  });
}