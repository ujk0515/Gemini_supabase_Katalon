/**
 * Katalon Object Generator 컨트롤러
 * assets/js/object-spy-controller.js (기존 파일 재활용)
 */

document.addEventListener('DOMContentLoaded', () => {
    // Object Generator 탭이 없으면 실행하지 않음
    if (!document.getElementById('object-generator')) {
        return;
    }

    // UI 요소 가져오기
    const objectNameInput = document.getElementById('obj_name');
    const xpathInput = document.getElementById('obj_xpath');
    const cssInput = document.getElementById('obj_css');
    const idInput = document.getElementById('obj_id');
    const nameAttrInput = document.getElementById('obj_name_attr');
    const tagInput = document.getElementById('obj_tag');
    const textInput = document.getElementById('obj_text');
    const addBtn = document.getElementById('addObjectBtn');
    const objectList = document.getElementById('generatedObjectList');
    const exportAllBtn = document.getElementById('exportAllBtn');

    // 상태 변수
    let capturedObjects = [];

    /**
     * 입력된 정보를 바탕으로 XML (.rs 파일) 콘텐츠 생성
     */
    function generateObjectXml(name, properties) {
        const guid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });

        const escapeXml = (text) => {
            if (!text) return '';
            return text.toString()
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        };

        let selectorEntries = '';
        if (properties.xpath) selectorEntries += `\n      <entry>\n         <key>XPATH</key>\n         <value>${escapeXml(properties.xpath)}</value>\n      </entry>`;
        if (properties.css) selectorEntries += `\n      <entry>\n         <key>CSS</key>\n         <value>${escapeXml(properties.css)}</value>\n      </entry>`;
        if (properties.id) selectorEntries += `\n      <entry>\n         <key>ID</key>\n         <value>${escapeXml(properties.id)}</value>\n      </entry>`;
        if (properties.name) selectorEntries += `\n      <entry>\n         <key>NAME</key>\n         <value>${escapeXml(properties.name)}</value>\n      </entry>`;

        let webElementProperties = '';
        if (properties.tag) {
            webElementProperties += `\n   <webElementProperties>\n      <isSelected>true</isSelected>\n      <matchCondition>equals</matchCondition>\n      <name>tag</name>\n      <type>Main</type>\n      <value>${escapeXml(properties.tag)}</value>\n      <webElementGuid>${guid()}</webElementGuid>\n   </webElementProperties>`;
        }
        if (properties.text) {
            webElementProperties += `\n   <webElementProperties>\n      <isSelected>false</isSelected>\n      <matchCondition>equals</matchCondition>\n      <name>text</name>\n      <type>Main</type>\n      <value>${escapeXml(properties.text)}</value>\n      <webElementGuid>${guid()}</webElementGuid>\n   </webElementProperties>`;
        }

        return `<?xml version="1.0" encoding="UTF-8"?>\n<WebElementEntity>\n   <description></description>\n   <name>${escapeXml(name)}</name>\n   <tag></tag>\n   <elementGuidId>${guid()}</elementGuidId>\n   <selectorCollection>${selectorEntries}\n   </selectorCollection>\n   <selectorMethod>XPATH</selectorMethod>\n   <smartLocatorEnabled>false</smartLocatorEnabled>\n   <useRalativeImagePath>false</useRalativeImagePath>${webElementProperties}\n</WebElementEntity>`;
    }

    /**
     * 생성된 오브젝트 목록 UI 업데이트
     */
    function updateListView() {
        if (capturedObjects.length === 0) {
            objectList.innerHTML = '<li style="text-align: center; color: #888; padding: 50px 0;">목록이 비어있습니다.</li>';
            exportAllBtn.disabled = true;
        } else {
            objectList.innerHTML = capturedObjects.map((obj, index) => `\n                <li class="object-list-item" data-index="${index}">\n                    <span class="object-name">${obj.name}</span>\n                    <div class="object-actions">\n                        <button class="download-btn">💾</button>\n                        <button class="delete-btn">🗑️</button>\n                    </div>\n                </li>\n            `).join('');
            exportAllBtn.disabled = false;
        }
        exportAllBtn.textContent = `[📦] Export All as ZIP (${capturedObjects.length})`;
    }

    /**
     * 입력 필드 초기화
     */
    function clearInputFields() {
        objectNameInput.value = '';
        xpathInput.value = '';
        cssInput.value = '';
        idInput.value = '';
        nameAttrInput.value = '';
        tagInput.value = '';
        textInput.value = '';
        objectNameInput.focus();
    }

    /**
     * 오브젝트 추가 버튼 클릭 핸들러
     */
    function handleAddObject() {
        const objectName = objectNameInput.value.trim();
        const xpath = xpathInput.value.trim();

        if (!objectName || !xpath) {
            alert('Object Name과 XPath는 필수 항목입니다.');
            return;
        }

        const properties = {
            xpath: xpath,
            css: cssInput.value.trim(),
            id: idInput.value.trim(),
            name: nameAttrInput.value.trim(),
            tag: tagInput.value.trim(),
            text: textInput.value.trim(),
        };

        const xmlContent = generateObjectXml(objectName, properties);

        capturedObjects.push({
            name: objectName,
            content: xmlContent,
            timestamp: new Date().toLocaleString()
        });

        updateListView();
        clearInputFields();
    }

    /**
     * 목록의 버튼 클릭 핸들러 (이벤트 위임)
     */
    function handleListClick(event) {
        const target = event.target;
        const item = target.closest('.object-list-item');
        if (!item) return;

        const index = parseInt(item.dataset.index, 10);
        const obj = capturedObjects[index];

        if (target.classList.contains('download-btn')) {
            // 개별 다운로드
            if (window.katalonGenerator) {
                window.katalonGenerator.downloadObjectFile(obj.name, obj.content);
            } else {
                alert('katalon-object-generator.js가 로드되지 않았습니다.');
            }
        } else if (target.classList.contains('delete-btn')) {
            // 삭제
            capturedObjects.splice(index, 1);
            updateListView();
        }
    }

    /**
     * 전체 내보내기 버튼 클릭 핸들러
     */
    function handleExportAll() {
        if (capturedObjects.length === 0) return;

        if (window.katalonGenerator) {
            window.katalonGenerator.downloadMultipleObjects(capturedObjects);
        } else {
            alert('katalon-object-generator.js가 로드되지 않았습니다.');
        }
    }

    // 이벤트 리스너 등록
    addBtn.addEventListener('click', handleAddObject);
    objectList.addEventListener('click', handleListClick);
    exportAllBtn.addEventListener('click', handleExportAll);

    // 초기 뷰 업데이트
    updateListView();

    console.log('✅ Katalon Object Generator 컨트롤러 초기화 완료');
});
