/**
 * Object Spy 컨트롤러
 * assets/js/object-spy-controller.js
 */

document.addEventListener('DOMContentLoaded', () => {
    // Object Spy 탭이 없으면 실행하지 않음
    if (!document.getElementById('object-spy')) {
        return;
    }

    /**
     * 입력된 정보를 바탕으로 XML (.rs 파일) 콘텐츠 생성
     */
    function generateObjectXml(data) {
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

        // selectorCollection 생성
        let selectorEntries = '';
        if (data.selectors.css) {
            selectorEntries += `\n      <entry>\n         <key>CSS</key>\n         <value>${escapeXml(data.selectors.css)}</value>\n      </entry>`;
        }
        if (data.selectors.xpath) {
            selectorEntries += `\n      <entry>\n         <key>XPATH</key>\n         <value>${escapeXml(data.selectors.xpath)}</value>\n      </entry>`;
        }
        if (data.selectors.basic) {
            selectorEntries += `\n      <entry>\n         <key>BASIC</key>\n         <value>${escapeXml(data.selectors.basic)}</value>\n      </entry>`;
        }

        // smartLocatorCollection 생성
        let smartLocatorSection = '';
        if (data.smartLocator) {
            smartLocatorSection = `\n   <smartLocatorCollection>\n      <entry>\n         <key>SMART_LOCATOR</key>\n         <value>${escapeXml(data.smartLocator)}</value>\n      </entry>\n   </smartLocatorCollection>\n   <smartLocatorEnabled>false</smartLocatorEnabled>`;
        } else {
            smartLocatorSection = '\n   <smartLocatorEnabled>false</smartLocatorEnabled>';
        }

        // webElementProperties 생성
        let webElementProperties = '';
        if (data.properties.tag) {
            webElementProperties += `\n   <webElementProperties>\n      <isSelected>false</isSelected>\n      <matchCondition>equals</matchCondition>\n      <name>tag</name>\n      <type>Main</type>\n      <value>${escapeXml(data.properties.tag)}</value>\n      <webElementGuid>${guid()}</webElementGuid>\n   </webElementProperties>`;
        }
        if (data.properties.class) {
            webElementProperties += `\n   <webElementProperties>\n      <isSelected>false</isSelected>\n      <matchCondition>equals</matchCondition>\n      <name>class</name>\n      <type>Main</type>\n      <value>${escapeXml(data.properties.class)}</value>\n      <webElementGuid>${guid()}</webElementGuid>\n   </webElementProperties>`;
        }
        if (data.properties.id) {
            webElementProperties += `\n   <webElementProperties>\n      <isSelected>true</isSelected>\n      <matchCondition>equals</matchCondition>\n      <name>id</name>\n      <type>Main</type>\n      <value>${escapeXml(data.properties.id)}</value>\n      <webElementGuid>${guid()}</webElementGuid>\n   </webElementProperties>`;
        }
        if (data.properties.type) {
            webElementProperties += `\n   <webElementProperties>\n      <isSelected>true</isSelected>\n      <matchCondition>equals</matchCondition>\n      <name>type</name>\n      <type>Main</type>\n      <value>${escapeXml(data.properties.type)}</value>\n      <webElementGuid>${guid()}</webElementGuid>\n   </webElementProperties>`;
        }
        if (data.properties.name) {
            webElementProperties += `\n   <webElementProperties>\n      <isSelected>false</isSelected>\n      <matchCondition>equals</matchCondition>\n      <name>name</name>\n      <type>Main</type>\n      <value>${escapeXml(data.properties.name)}</value>\n      <webElementGuid>${guid()}</webElementGuid>\n   </webElementProperties>`;
        }
        if (data.properties.text) {
            webElementProperties += `\n   <webElementProperties>\n      <isSelected>true</isSelected>\n      <matchCondition>equals</matchCondition>\n      <name>text</name>\n      <type>Main</type>\n      <value>${escapeXml(data.properties.text)}</value>\n      <webElementGuid>${guid()}</webElementGuid>\n   </webElementProperties>`;
        }

        // 기타 속성들 추가
        if (data.otherAttributes) {
            try {
                const attrs = JSON.parse(data.otherAttributes);
                for (const [key, value] of Object.entries(attrs)) {
                    webElementProperties += `\n   <webElementProperties>\n      <isSelected>false</isSelected>\n      <matchCondition>equals</matchCondition>\n      <name>${escapeXml(key)}</name>\n      <type>Main</type>\n      <value>${escapeXml(value)}</value>\n      <webElementGuid>${guid()}</webElementGuid>\n   </webElementProperties>`;
                }
            } catch (e) {
                console.warn('기타 속성 JSON 파싱 오류:', e);
            }
        }

        // webElementXpaths 생성
        let webElementXpaths = '';
        if (data.xpaths.attributes) {
            webElementXpaths += `\n   <webElementXpaths>\n      <isSelected>true</isSelected>\n      <matchCondition>equals</matchCondition>\n      <name>xpath:attributes</name>\n      <type>Main</type>\n      <value>${escapeXml(data.xpaths.attributes)}</value>\n      <webElementGuid>${guid()}</webElementGuid>\n   </webElementXpaths>`;
        }
        if (data.xpaths.neighbor) {
            webElementXpaths += `\n   <webElementXpaths>\n      <isSelected>false</isSelected>\n      <matchCondition>equals</matchCondition>\n      <name>xpath:neighbor</name>\n      <type>Main</type>\n      <value>${escapeXml(data.xpaths.neighbor)}</value>\n      <webElementGuid>${guid()}</webElementGuid>\n   </webElementXpaths>`;
        }
        if (data.xpaths.position) {
            webElementXpaths += `\n   <webElementXpaths>\n      <isSelected>false</isSelected>\n      <matchCondition>equals</matchCondition>\n      <name>xpath:position</name>\n      <type>Main</type>\n      <value>${escapeXml(data.xpaths.position)}</value>\n      <webElementGuid>${guid()}</webElementGuid>\n   </webElementXpaths>`;
        }
        if (data.xpaths.custom) {
            webElementXpaths += `\n   <webElementXpaths>\n      <isSelected>false</isSelected>\n      <matchCondition>equals</matchCondition>\n      <name>xpath:customAttributes</name>\n      <type>Main</type>\n      <value>${escapeXml(data.xpaths.custom)}</value>\n      <webElementGuid>${guid()}</webElementGuid>\n   </webElementXpaths>`;
        }

        // 전체 XML 구성
        return `<?xml version="1.0" encoding="UTF-8"?>
<WebElementEntity>
   <description></description>
   <name>${escapeXml(data.objectName)}</name>
   <tag></tag>
   <elementGuidId>${guid()}</elementGuidId>
   <imagePath></imagePath>
   <selectorCollection>${selectorEntries}
   </selectorCollection>
   <selectorMethod>${data.selectorMethod}</selectorMethod>${smartLocatorSection}
   <useRalativeImagePath>true</useRalativeImagePath>${webElementProperties}
   <webElementProperties>
      <isSelected>false</isSelected>
      <matchCondition>equals</matchCondition>
      <name>xpath</name>
      <type>Main</type>
      <value>${escapeXml(data.selectors.xpath)}</value>
      <webElementGuid>${guid()}</webElementGuid>
   </webElementProperties>${webElementXpaths}
</WebElementEntity>`;
    }

    /**
     * 파일 다운로드 함수
     */
    function downloadFile(filename, content) {
        const blob = new Blob([content], { type: 'text/xml' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    /**
     * Object Repository 파일 생성 함수
     */
    window.generateObjectFile = function() {
        const objectName = document.getElementById('objectName').value.trim();
        const selectorMethod = document.querySelector('input[name="selectorMethod"]:checked').value;
        
        if (!objectName) {
            alert('Object Name은 필수 항목입니다.');
            return;
        }

        const xpath = document.getElementById('xpath').value.trim();
        if (!xpath) {
            alert('XPath는 필수 항목입니다.');
            return;
        }

        // 수집된 데이터
        const data = {
            objectName: objectName,
            selectorMethod: selectorMethod,
            selectors: {
                xpath: xpath,
                css: document.getElementById('cssSelector').value.trim(),
                basic: document.getElementById('basicSelector').value.trim()
            },
            xpaths: {
                attributes: document.getElementById('xpathAttributes').value.trim(),
                position: document.getElementById('xpathPosition').value.trim(),
                neighbor: document.getElementById('xpathNeighbor').value.trim(),
                custom: document.getElementById('xpathCustom').value.trim()
            },
            properties: {
                tag: document.getElementById('tagName').value.trim(),
                class: document.getElementById('className').value.trim(),
                id: document.getElementById('idValue').value.trim(),
                type: document.getElementById('typeValue').value.trim(),
                name: document.getElementById('nameValue').value.trim(),
                text: document.getElementById('textValue').value.trim()
            },
            smartLocator: document.getElementById('smartLocator').value.trim(),
            otherAttributes: document.getElementById('otherAttributes').value.trim()
        };

        // XML 생성
        const xmlContent = generateObjectXml(data);
        
        // 파일 다운로드
        downloadFile(objectName + '.rs', xmlContent);
    };

    /**
     * 전체 초기화 함수
     */
    window.clearAll = function() {
        if (confirm('모든 입력 내용을 초기화하시겠습니까?')) {
            document.querySelectorAll('.input-field').forEach(field => {
                field.value = '';
            });
            document.getElementById('xpath').checked = true;
        }
    };

    console.log('✅ Object Spy 컨트롤러 초기화 완료');
});