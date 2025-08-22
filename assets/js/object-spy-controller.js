/**
 * Object Spy 컨트롤러 (기존 AI 엔진 연동)
 * assets/js/object-spy-controller.js
 */

document.addEventListener('DOMContentLoaded', () => {
    // Object Spy 탭이 없으면 실행하지 않음
    if (!document.getElementById('object-spy')) {
        return;
    }

    // XPath Neighbor 동적 관리
    let xpathNeighborCount = 1;

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
        const propertyOrder = ['tag', 'class', 'id', 'type', 'name', 'text'];
        const selectedProperties = ['id', 'type', 'text']; // 기본 선택 속성들
        
        propertyOrder.forEach(prop => {
            if (data.properties[prop]) {
                const isSelected = selectedProperties.includes(prop);
                webElementProperties += `\n   <webElementProperties>\n      <isSelected>${isSelected}</isSelected>\n      <matchCondition>equals</matchCondition>\n      <name>${prop}</name>\n      <type>Main</type>\n      <value>${escapeXml(data.properties[prop])}</value>\n      <webElementGuid>${guid()}</webElementGuid>\n   </webElementProperties>`;
            }
        });

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
        
        // XPath Attributes
        if (data.xpaths.attributes) {
            webElementXpaths += `\n   <webElementXpaths>\n      <isSelected>true</isSelected>\n      <matchCondition>equals</matchCondition>\n      <name>xpath:attributes</name>\n      <type>Main</type>\n      <value>${escapeXml(data.xpaths.attributes)}</value>\n      <webElementGuid>${guid()}</webElementGuid>\n   </webElementXpaths>`;
        }
        
        // XPath Neighbors - 첫 번째만 선택, 나머지는 비선택
        if (data.xpaths.neighbors && data.xpaths.neighbors.length > 0) {
            data.xpaths.neighbors.forEach((neighbor, index) => {
                if (neighbor) {
                    webElementXpaths += `\n   <webElementXpaths>\n      <isSelected>${index === 0 ? 'true' : 'false'}</isSelected>\n      <matchCondition>equals</matchCondition>\n      <name>xpath:neighbor</name>\n      <type>Main</type>\n      <value>${escapeXml(neighbor)}</value>\n      <webElementGuid>${guid()}</webElementGuid>\n   </webElementXpaths>`;
                }
            });
        }
        
        // XPath Position
        if (data.xpaths.position) {
            webElementXpaths += `\n   <webElementXpaths>\n      <isSelected>false</isSelected>\n      <matchCondition>equals</matchCondition>\n      <name>xpath:position</name>\n      <type>Main</type>\n      <value>${escapeXml(data.xpaths.position)}</value>\n      <webElementGuid>${guid()}</webElementGuid>\n   </webElementXpaths>`;
        }
        
        // XPath Custom
        if (data.xpaths.custom) {
            webElementXpaths += `\n   <webElementXpaths>\n      <isSelected>false</isSelected>\n      <matchCondition>equals</matchCondition>\n      <name>xpath:customAttributes</name>\n      <type>Main</type>\n      <value>${escapeXml(data.xpaths.custom)}</value>\n      <webElementGuid>${guid()}</webElementGuid>\n   </webElementXpaths>`;
        }

        // 메인 XPath는 기본 XPath 또는 첫 번째 neighbor 사용
        const mainXpath = data.selectors.xpath || (data.xpaths.neighbors && data.xpaths.neighbors[0]) || '';

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
      <value>${escapeXml(mainXpath)}</value>
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
     * XPath Neighbor 동적 추가
     */
    window.addXpathNeighbor = function() {
        xpathNeighborCount++;
        const container = document.getElementById('xpathNeighborContainer');
        const newItem = document.createElement('div');
        newItem.className = 'xpath-neighbor-item';
        newItem.innerHTML = `
            <input type="text" class="input-field xpath-neighbor-input" 
                   placeholder="(.//*[normalize-space(text())='텍스트'])[1]/following::*[name()='svg'][1]">
            <button type="button" class="remove-neighbor-btn" onclick="removeXpathNeighbor(this)">-</button>
        `;
        container.appendChild(newItem);
    };

    /**
     * XPath Neighbor 삭제
     */
    window.removeXpathNeighbor = function(button) {
        if (xpathNeighborCount > 1) {
            button.parentElement.remove();
            xpathNeighborCount--;
        }
    };

    /**
     * XPath 분석용 고급 프롬프트 생성
     */
    function generateXPathAnalysisPrompt(xpath, url) {
        return `당신은 XPath 전문가이자 웹 자동화 엔지니어입니다. 
주어진 XPath를 카탈론 Object Spy 방식의 안정적이고 유지보수가 용이한 XPath Neighbor들로 변환해주세요.

**입력 정보:**
- 원본 XPath: ${xpath}
- 페이지 URL: ${url}

**변환 규칙:**
1. **텍스트 기반 안정성**: normalize-space(text()) 함수를 활용하여 공백에 강건한 XPath 생성
2. **상대적 위치 지정**: following-sibling::, preceding-sibling::, following::, preceding:: 축 적극 활용
3. **요소 이름 명시**: *[name()='tagname'] 형태로 명확한 요소 지정
4. **인덱스 활용**: [1], [2] 등으로 정확한 순서 명시
5. **다층 접근**: 여러 단계의 탐색 경로 제공

**카탈론 표준 예시:**
- (.//*[normalize-space(text()) and normalize-space(.)='로그인'])[1]/following::*[name()='input'][1]
- (.//*[normalize-space(text()) and normalize-space(.)='검색'])[1]/preceding-sibling::*[name()='div'][1]
- (.//*[@class='header'])[1]/following::*[normalize-space(text()) and normalize-space(.)='메뉴'][1]/following::*[name()='button'][1]

**요구사항:**
1. 최소 3개, 최대 6개의 서로 다른 XPath Neighbor 생성
2. 각각 다른 접근 방식 사용 (텍스트 기반, 속성 기반, 구조 기반)
3. 안정성을 위해 가능한 한 텍스트나 고유 속성 활용
4. 페이지 변경에 강건한 XPath 우선 순위

**응답 형식:**
반드시 JSON 배열 형태로만 응답하세요:
["xpath1", "xpath2", "xpath3", ...]

예시:
["(.//*[normalize-space(text()) and normalize-space(.)='검색'])[1]/following::*[name()='button'][1]", "(.//*[@id='search-form'])[1]/following::*[name()='input'][1]"]

원본 XPath를 분석하고 페이지 구조를 추론하여 실용적이고 안정적인 XPath Neighbor들을 생성해주세요.`;
    }

    /**
     * AI 응답에서 XPath 배열 추출
     */
    function extractXPathArray(aiResponse) {
        try {
            console.log('AI 응답 타입:', typeof aiResponse);
            console.log('원본 AI 응답:', aiResponse);
            
            // AI 응답이 이미 배열인 경우
            if (Array.isArray(aiResponse)) {
                return aiResponse.filter(item => typeof item === 'string' && item.trim());
            }
            
            // AI 응답이 문자열인 경우
            if (typeof aiResponse === 'string') {
                // JSON 배열 패턴 찾기
                const jsonMatch = aiResponse.match(/\[[\s\S]*?\]/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    if (Array.isArray(parsed)) {
                        return parsed.filter(item => typeof item === 'string' && item.trim());
                    }
                }
                
                // JSON 형태가 아닌 경우 라인별로 파싱 시도
                const lines = aiResponse.split('\n')
                    .map(line => line.trim())
                    .filter(line => line && !line.startsWith('//') && !line.startsWith('#'))
                    .filter(line => line.includes('normalize-space') || line.includes('following') || line.includes('preceding'));
                
                if (lines.length > 0) {
                    return lines.slice(0, 6); // 최대 6개
                }
            }
            
            // 다른 타입인 경우 문자열로 변환 후 처리
            const responseText = String(aiResponse);
            const jsonMatch = responseText.match(/\[[\s\S]*?\]/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (Array.isArray(parsed)) {
                    return parsed.filter(item => typeof item === 'string' && item.trim());
                }
            }
            
            throw new Error('유효한 XPath를 찾을 수 없습니다.');
        } catch (error) {
            console.warn('AI 응답 파싱 오류:', error);
            console.log('원본 AI 응답:', aiResponse);
            return generateFallbackXpaths();
        }
    }

    /**
     * AI 호출 실패시 폴백 XPath 생성
     */
    function generateFallbackXpaths() {
        return [
            "(.//*[normalize-space(text()) and normalize-space(.)='검색'])[1]/following::*[name()='button'][1]",
            "(.//*[normalize-space(text()) and normalize-space(.)='로그인'])[1]/preceding::*[name()='input'][1]",
            "(.//*[normalize-space(text()) and normalize-space(.)='메뉴'])[1]/following-sibling::*[name()='div'][1]",
            "(.//*[@class='header'])[1]/following::*[normalize-space(text()) and normalize-space(.)='홈'][1]"
        ];
    }

    /**
     * 기존 AI 엔진을 활용한 XPath 분석
     */
    window.analyzeXPathWithAI = async function() {
        const selectedModel = document.getElementById('aiModelSelectSpy').value;
        const xpathInput = document.getElementById('xpathInput').value.trim();
        const urlInput = document.getElementById('pageUrl').value.trim() || 'https://example.com';
        
        if (!xpathInput) {
            showNotification('XPath를 먼저 입력해주세요.', 'warning');
            return;
        }
        
        const analyzeBtn = document.getElementById('analyzeBtn');
        const originalText = analyzeBtn.innerHTML;
        
        // 로딩 상태 표시
        analyzeBtn.innerHTML = `
            <span class="spinner"></span>
            분석 중...
        `;
        analyzeBtn.disabled = true;
        
        try {
            // 프롬프트 생성
            const prompt = generateXPathAnalysisPrompt(xpathInput, urlInput);
            let aiResponse;
            
            // 선택된 AI 모델에 따라 분기
            if (selectedModel === 'gemma-3-27b-it') {
                // Gemma 엔진 사용
                if (typeof GemmaEngine === 'undefined') {
                    throw new Error('Gemma AI 엔진이 로드되지 않았습니다.');
                }
                
                if (!window.gemmaEngine) {
                    window.gemmaEngine = new GemmaEngine();
                }
                
                aiResponse = await window.gemmaEngine.callGemini(prompt);
                
            } else if (selectedModel === 'gemini-2.0-flash') {
                // Gemini Flash 엔진 사용
                if (typeof GeminiFlashEngine === 'undefined') {
                    throw new Error('Gemini Flash AI 엔진이 로드되지 않았습니다.');
                }
                
                if (!window.geminiFlashEngine) {
                    window.geminiFlashEngine = new GeminiFlashEngine();
                }
                
                aiResponse = await window.geminiFlashEngine.callGemini(prompt);
                
            } else {
                throw new Error('지원하지 않는 AI 모델입니다.');
            }
            
            // AI 응답에서 XPath 배열 추출
            const xpaths = extractXPathArray(aiResponse);
            
            if (xpaths.length === 0) {
                throw new Error('AI가 유효한 XPath를 생성하지 못했습니다.');
            }
            
            // UI에 결과 적용
            populateXPathNeighbors(xpaths);
            
            showNotification(`${selectedModel.toUpperCase()} AI가 ${xpaths.length}개의 XPath Neighbor를 생성했습니다!`, 'success');
            
        } catch (error) {
            console.error('AI 분석 오류:', error);
            
            // 에러 타입에 따른 처리
            if (error.message.includes('로드되지 않았습니다')) {
                showNotification('AI 엔진 로딩 오류: 페이지를 새로고침해주세요.', 'error');
            } else if (error.message.includes('API')) {
                showNotification('AI API 호출 오류: 네트워크 상태를 확인해주세요.', 'error');
            } else {
                showNotification('AI 분석 중 오류가 발생했습니다. 기본 XPath를 제공합니다.', 'warning');
            }
            
            // 폴백 XPath 제공
            populateXPathNeighbors(generateFallbackXpaths());
            
        } finally {
            analyzeBtn.innerHTML = originalText;
            analyzeBtn.disabled = false;
        }
    };

    /**
     * 향상된 알림 시스템
     */
    function showNotification(message, type = 'info') {
        // 기존 알림이 있으면 제거
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const colors = {
            'info': '#2196f3',
            'success': '#4caf50',
            'warning': '#ff9800',
            'error': '#f44336'
        };

        const icons = {
            'info': 'ℹ️',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌'
        };

        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 16px;">${icons[type] || 'ℹ️'}</span>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: none; 
                    border: none; 
                    color: white; 
                    font-size: 18px; 
                    cursor: pointer;
                    margin-left: auto;
                    padding: 0;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">×</button>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 20px;
            background: ${colors[type] || colors.info};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 400px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.4;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        // 자동 제거
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
    }

    /**
     * 애니메이션 CSS 동적 추가
     */
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
            
            .spinner {
                display: inline-block;
                width: 12px;
                height: 12px;
                border: 2px solid #ffffff40;
                border-left-color: #ffffff;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-right: 8px;
            }
            
            @keyframes spin {
                to {
                    transform: rotate(360deg);
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * XPath Neighbor 항목들을 UI에 채우기
     */
    function populateXPathNeighbors(xpaths) {
        const container = document.getElementById('xpathNeighborContainer');
        container.innerHTML = '';
        xpathNeighborCount = 0;
        
        xpaths.forEach((xpath, index) => {
            xpathNeighborCount++;
            const newItem = document.createElement('div');
            newItem.className = 'xpath-neighbor-item';
            newItem.innerHTML = `
                <input type="text" class="input-field xpath-neighbor-input" value="${xpath.replace(/"/g, '&quot;')}">
                ${index === 0 ? 
                    '<button type="button" class="add-neighbor-btn" onclick="addXpathNeighbor()">+</button>' :
                    '<button type="button" class="remove-neighbor-btn" onclick="removeXpathNeighbor(this)">-</button>'
                }
            `;
            container.appendChild(newItem);
        });
    }

    /**
     * Object Repository 파일 생성 함수
     */
    window.generateObjectFile = function() {
        const objectName = document.getElementById('objectName').value.trim();
        const selectorMethod = document.querySelector('input[name="selectorMethod"]:checked').value;
        
        if (!objectName) {
            showNotification('Object Name은 필수 항목입니다.', 'warning');
            return;
        }

        const xpath = document.getElementById('xpathInput').value.trim();
        const neighborInputs = document.querySelectorAll('.xpath-neighbor-input');
        const neighbors = Array.from(neighborInputs).map(input => input.value.trim()).filter(value => value);
        
        // XPath 또는 XPath Neighbor 중 하나는 필수
        if (!xpath && neighbors.length === 0) {
            showNotification('XPath 또는 XPath Neighbor 중 하나는 입력해야 합니다.', 'warning');
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
                neighbors: neighbors,
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

        try {
            // XML 생성
            const xmlContent = generateObjectXml(data);
            
            // 파일 다운로드
            downloadFile(objectName + '.rs', xmlContent);
            
            showNotification('Object Repository 파일이 성공적으로 생성되었습니다!', 'success');
        } catch (error) {
            console.error('파일 생성 오류:', error);
            showNotification('파일 생성 중 오류가 발생했습니다.', 'error');
        }
    };

    /**
     * 전체 초기화 함수
     */
    window.clearAll = function() {
        if (confirm('모든 입력 내용을 초기화하시겠습니까?')) {
            document.querySelectorAll('.input-field').forEach(field => {
                field.value = '';
            });
            document.getElementById('xpathRadio').checked = true;
            
            // XPath Neighbor 컨테이너 초기화
            const container = document.getElementById('xpathNeighborContainer');
            container.innerHTML = `
                <div class="xpath-neighbor-item">
                    <input type="text" class="input-field xpath-neighbor-input" id="xpathNeighbor" 
                           placeholder="(.//*[normalize-space(text())='텍스트'])[1]/following::*[name()='svg'][1]">
                    <button type="button" class="add-neighbor-btn" onclick="addXpathNeighbor()">+</button>
                </div>
            `;
            xpathNeighborCount = 1;
            
            showNotification('모든 내용이 초기화되었습니다.', 'info');
        }
    };

    console.log('✅ Object Spy 컨트롤러 (기존 AI 엔진 연동) 초기화 완료');
    
    // main.js에서 ObjectSpyController를 찾기 때문에 더미 객체 등록
    window.ObjectSpyController = {
        initialized: true,
        version: '1.0.0'
    };
});