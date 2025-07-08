// ==================== 결과값 Report 뷰어 메뉴 관련 코드 ====================

// HTML 결과값 Report 분석기
document.getElementById('reportFileInput')?.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const previewFrame = document.getElementById('reportPreview');
  const resultDiv = document.getElementById('reportResult');

  const reader = new FileReader();
  reader.onload = function(e) {
    const html = e.target.result;
    previewFrame.srcdoc = html;

    previewFrame.onload = function() {
      try {
        const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
        const x = path => doc.evaluate(path, doc, null, XPathResult.STRING_TYPE, null).stringValue.trim() || "-";

        const name = x("/html/body/div[2]/div[2]/div[1]/div[1]");
        const StartTime = x("/html/body/div[2]/div[2]/div[3]/div/div[2]/div/div[1]/div/div/div[1]/div[2]");
        const EndTime = x("/html/body/div[2]/div[2]/div[3]/div/div[2]/div/div[1]/div/div/div[2]/div[2]");
        const Duration = x("/html/body/div[2]/div[2]/div[3]/div/div[2]/div/div[1]/div/div/div[3]/div[2]");
        const total = x("/html/body/div[2]/div[2]/div[3]/div/div[2]/div/div[2]/div/div/div[1]/div[1]");
        const pass = x("/html/body/div[2]/div[2]/div[3]/div/div[2]/div/div[2]/div/div/div[3]/div[1]");
        const fail = x("/html/body/div[2]/div[2]/div[3]/div/div[2]/div/div[2]/div/div/div[4]/div[1]");
        const error = x("/html/body/div[2]/div[2]/div[3]/div/div[2]/div/div[2]/div/div/div[5]/div[1]");
        const incomplete = x("/html/body/div[2]/div[2]/div[3]/div/div[2]/div/div[2]/div/div/div[6]/div[1]");
        const skipped = x("/html/body/div[2]/div[2]/div[3]/div/div[2]/div/div[2]/div/div/div[7]/div[1]");

        const totalNum = parseInt(total) || 0;
        const passNum = parseInt(pass) || 0;
        const failNum = parseInt(fail) || 0;
        const errorNum = parseInt(error) || 0;
        const incompleteNum = parseInt(incomplete) || 0;
        const skippedNum = parseInt(skipped) || 0;

        function percent(n) {
          if (!totalNum) return '0%';
          return ((n / totalNum) * 100).toFixed(1) + '%';
        }

        resultDiv.innerHTML = `
          <h2>📋 테스트 요약</h2>
          <table style="width:100%; border-collapse: collapse;">
            <tr><th align="left">Name : </th><td>${name}</td></tr>
            <tr><th align="left">Start Time : </th><td>${StartTime}</td></tr>
            <tr><th align="left">End Time : </th><td>${EndTime}</td></tr>
            <tr><th align="left">Duration : </th><td>${Duration}</td></tr>
            <tr><th align="left">전체 : </th><td>${totalNum}개 (100%)</td></tr>
            <tr><th align="left">PASS : </th><td>${passNum}개 (${percent(passNum)})</td></tr>
            <tr><th align="left">FAIL : </th><td>${failNum}개 (${percent(failNum)})</td></tr>
            <tr><th align="left">ERROR : </th><td>${errorNum}개 (${percent(errorNum)})</td></tr>
            <tr><th align="left">INCOMPLETE : </th><td>${incompleteNum}개 (${percent(incompleteNum)})</td></tr>
            <tr><th align="left">SKIPPED : </th><td>${skippedNum}개 (${percent(skippedNum)})</td></tr>
          </table>
          <br><canvas id="reportChart"></canvas>`;

        const values = [pass, fail, error, incomplete, skipped].map(v => parseInt(v) || 0);
        const ctx = document.getElementById('reportChart').getContext('2d');
        new Chart(ctx, {
          type: 'pie',
          data: {
            labels: ["Pass", "Fail", "Error", "Incomplete", "Skipped"],
            datasets: [{
              data: values,
              backgroundColor: ["#4caf50", "#f44336", "#ff9800", "#9c27b0", "#03a9f4"]
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'bottom' },
              title: { display: true, text: '테스트 결과 분포' }
            }
          }
        });

      } catch (err) {
        resultDiv.innerHTML = `<p style="color:red">❌ 파싱 실패: ${err.message}</p>`;
      }
    };
  };
  reader.readAsText(file);
});