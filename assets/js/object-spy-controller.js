/**
 * 오브젝트 스파이 컨트롤러 (완전 기능 버전)
 * assets/js/object-spy-controller.js
 */

class ObjectSpyController {
    constructor() {
        this.iframe = null;
        this.currentUrl = '';
        this.selectedElement = null;
        this.highlightedElement = null;
        this.isSpyMode = false;
        this.capturedObjects = [];
        this.captureInfo = null;
        
        console.log('✅ ObjectSpyController 초기화 시작');
        this.init();
    }

    init() {
        // Object Spy 탭이 이미 있는지 확인
        if (document.getElementById('objectspy')) {
            this.bindEvents();
            this.iframe = document.getElementById('objectSpyFrame');
            this.loadDefaultPage();
            this.setupMessageListener();
            console.log('✅ ObjectSpyController 초기화 완료');
        } else {
            console.warn('Object Spy 탭을 찾을 수 없습니다');
        }
    }

    bindEvents() {
        // 주소 이동
        const goBtn = document.getElementById('goBtn');
        if (goBtn) {
            goBtn.addEventListener('click', () => this.navigateToUrl());
        }

        // Enter 키 이벤트
        const urlInput = document.getElementById('urlInput');
        if (urlInput) {
            urlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.navigateToUrl();
                }
            });
        }

        // Spy 모드 토글
        const spyToggle = document.getElementById('spyToggle');
        if (spyToggle) {
            spyToggle.addEventListener('click', () => this.toggleSpyMode());
        }

        // 선택 방법 변경
        document.querySelectorAll('input[name="method"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.setSelectionMethod(e.target.value);
            });
        });

        // 캡처 버튼
        const captureBtn = document.getElementById('captureBtn');
        if (captureBtn) {
            captureBtn.addEventListener('click', () => this.captureCurrentObject());
        }

        // 내보내기 버튼
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportCurrentObject());
        }

        // 전체 내보내기 버튼
        const exportAllBtn = document.getElementById('exportAllBtn');
        if (exportAllBtn) {
            exportAllBtn.addEventListener('click', () => this.exportAllObjects());
        }

        // iframe 로드 이벤트
        if (this.iframe) {
            this.iframe.addEventListener('load', () => this.onIframeLoad());
        }

        // 키보드 이벤트 바인딩
        this.bindKeyboardEvents();

        console.log('✅ 이벤트 바인딩 완료');
    }

    bindKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            // Alt + ` (백틱) 키 조합으로 객체 캡처
            if (e.altKey && (e.key === '`' || e.code === 'Backquote') && this.isSpyMode) {
                e.preventDefault();
                this.captureHighlightedElement();
                console.log('🎯 Alt + ` 키로 객체 캡처!');
            }
        });
    }

    setupMessageListener() {
        // iframe과의 postMessage 통신 설정
        window.addEventListener('message', (event) => {
            this.handleIframeMessage(event);
        });
    }

    handleIframeMessage(event) {
        if (event.data && event.data.type === 'elementHover') {
            this.highlightedElement = event.data.elementInfo;
            this.updateCaptureInfo(event.data.elementInfo);
            this.updateSelectedLocator(event.data.elementInfo.xpath || '요소 감지됨');
            this.updateObjectProperties(event.data.elementInfo);
        }
    }

    loadDefaultPage() {
        const urlInput = document.getElementById('urlInput');
        if (urlInput) {
            // Object Spy 테스트가 가능한 로컬 HTML 페이지 생성
            const testHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Object Spy Test Page</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        .container { max-width: 800px; margin: 0 auto; }
                        .button { padding: 10px 20px; margin: 5px; background: #007bff; color: white; border: none; cursor: pointer; }
                        .input { padding: 8px; margin: 5px; border: 1px solid #ddd; }
                        .card { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1 id="main-title">Object Spy 테스트 페이지</h1>
                        <p>이 페이지에서 Object Spy 기능을 테스트할 수 있습니다.</p>
                        
                        <div class="card">
                            <h2>버튼 테스트</h2>
                            <button id="test-btn-1" class="button">테스트 버튼 1</button>
                            <button id="test-btn-2" class="button" name="secondBtn">테스트 버튼 2</button>
                            <button class="button btn-danger">삭제 버튼</button>
                        </div>
                        
                        <div class="card">
                            <h2>입력 필드 테스트</h2>
                            <input id="username" class="input" type="text" placeholder="사용자명" name="username">
                            <input id="password" class="input" type="password" placeholder="비밀번호" name="password">
                            <input class="input" type="email" placeholder="이메일">
                        </div>
                        
                        <div class="card">
                            <h2>링크 테스트</h2>
                            <a id="home-link" href="#home">홈으로</a> |
                            <a href="#about" class="nav-link">소개</a> |
                            <a href="https://example.com">외부 링크</a>
                        </div>
                        
                        <div class="card">
                            <h2>기타 요소</h2>
                            <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwN2JmZiIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SVNBRz8vdGV4dD48L3N2Zz4=" alt="테스트 이미지" id="test-image">
                            <select id="country-select" name="country">
                                <option value="">국가 선택</option>
                                <option value="kr">한국</option>
                                <option value="us">미국</option>
                            </select>
                        </div>
                    </div>
                </body>
                </html>
            `;
            
            // Data URL로 테스트 페이지 로드
            urlInput.value = 'data:text/html;charset=utf-8,' + encodeURIComponent(testHtml);
            this.navigateToUrl();
        }
    }

    navigateToUrl() {
        const urlInput = document.getElementById('urlInput');
        if (!urlInput) return;

        let url = urlInput.value.trim();
        if (!url) return;

        // URL 정규화
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        this.currentUrl = url;
        this.showLoading(true);
        
        // 타임아웃 처리 (10초)
        setTimeout(() => {
            this.showLoading(false);
        }, 10000);
        
        console.log(`🌐 페이지 이동: ${url}`);
        
        if (this.iframe) {
            this.iframe.src = url;
        }
    }

    onIframeLoad() {
        this.showLoading(false);
        console.log('✅ 페이지 로드 완료');
        
        // 약간의 지연 후 스파이 스크립트 주입
        setTimeout(() => {
            this.injectSpyScript();
            this.updateSelectedLocator('페이지가 로드되었습니다. Spy 모드를 활성화하세요.');
            this.updateObjectProperties({
                tagName: 'iframe',
                url: this.currentUrl,
                status: '로드 완료'
            });
        }, 1000);
    }

    injectSpyScript() {
        console.log('🔧 스크립트 주입 시도 시작...');
        
        if (!this.iframe) {
            console.error('❌ iframe이 없습니다');
            return;
        }
        
        if (!this.isSpyMode) {
            console.log('❌ Spy 모드가 꺼져있습니다');
            return;
        }

        try {
            // 1단계: iframe contentDocument 체크
            const iframeDoc = this.iframe.contentDocument;
            console.log('iframe contentDocument:', iframeDoc);
            
            if (!iframeDoc) {
                console.error('❌ contentDocument 접근 불가 (CORS 차단)');
                this.updateSelectedLocator('CORS 정책으로 인해 이 사이트에서는 Object Spy를 사용할 수 없습니다');
                return;
            }

            // 2단계: 기존 스크립트/스타일 정리
            const existingScript = iframeDoc.getElementById('katalon-spy-script');
            const existingStyle = iframeDoc.getElementById('katalon-spy-style');
            
            if (existingScript) {
                console.log('🧹 기존 스크립트 제거');
                existingScript.remove();
            }
            
            if (existingStyle) {
                console.log('🧹 기존 스타일 제거');
                existingStyle.remove();
            }

            // 3단계: CSS 스타일 먼저 추가
            const style = iframeDoc.createElement('style');
            style.id = 'katalon-spy-style';
            style.textContent = `
                .katalon-highlight {
                    outline: 3px solid #ff0000 !important;
                    outline-offset: 2px !important;
                    background-color: rgba(255, 0, 0, 0.15) !important;
                    box-shadow: 0 0 10px rgba(255, 0, 0, 0.5) !important;
                }
                .katalon-capture-info {
                    position: fixed !important;
                    top: 10px !important;
                    left: 10px !important;
                    background: rgba(0, 0, 0, 0.9) !important;
                    color: #00ff00 !important;
                    padding: 8px 12px !important;
                    border-radius: 4px !important;
                    font-family: monospace !important;
                    font-size: 14px !important;
                    font-weight: bold !important;
                    z-index: 999999 !important;
                    pointer-events: none !important;
                    border: 1px solid #00ff00 !important;
                }
            `;
            
            if (iframeDoc.head) {
                iframeDoc.head.appendChild(style);
                console.log('✅ CSS 스타일 추가 완료');
            } else {
                console.error('❌ iframe head가 없습니다');
                return;
            }

            // 4단계: JavaScript 스크립트 추가
            const script = iframeDoc.createElement('script');
            script.id = 'katalon-spy-script';
            script.textContent = `
                console.log('🚀 Katalon Object Spy 스크립트 실행 시작');
                
                // 전역 변수 초기화
                window.katalonSpyActive = true;
                let currentHighlight = null;
                let captureInfoDiv = null;
                
                // 모든 기존 하이라이트 제거
                document.querySelectorAll('.katalon-highlight').forEach(el => {
                    el.classList.remove('katalon-highlight');
                    console.log('기존 하이라이트 제거:', el);
                });
                
                // XPath 생성 함수 (개선된 버전)
                function getElementXPath(element) {
                    if (!element || element.nodeType !== 1) return '';
                    
                    if (element.id) {
                        return '//*[@id="' + element.id + '"]';
                    }
                    
                    if (element === document.body) {
                        return '/html/body';
                    }
                    
                    let path = '';
                    let current = element;
                    
                    while (current && current !== document.body) {
                        let index = 1;
                        let sibling = current.previousElementSibling;
                        
                        while (sibling) {
                            if (sibling.tagName === current.tagName) {
                                index++;
                            }
                            sibling = sibling.previousElementSibling;
                        }
                        
                        const tagName = current.tagName.toLowerCase();
                        path = '/' + tagName + '[' + index + ']' + path;
                        current = current.parentElement;
                    }
                    
                    return '/html/body' + path;
                }
                
                // CSS Selector 생성 함수
                function getElementCSSSelector(element) {
                    if (!element || element.nodeType !== 1) return '';
                    
                    if (element.id) {
                        return '#' + element.id;
                    }
                    
                    let selector = element.tagName.toLowerCase();
                    
                    if (element.className) {
                        const classes = element.className.trim().split(/\\s+/).filter(c => c);
                        if (classes.length > 0) {
                            selector += '.' + classes.join('.');
                        }
                    }
                    
                    return selector;
                }
                
                // 캡처 정보 표시 함수
                function showCaptureInfo() {
                    if (captureInfoDiv) {
                        captureInfoDiv.remove();
                    }
                    
                    captureInfoDiv = document.createElement('div');
                    captureInfoDiv.className = 'katalon-capture-info';
                    captureInfoDiv.textContent = 'Capture object: Alt + \`';
                    document.body.appendChild(captureInfoDiv);
                    
                    console.log('캡처 정보 표시됨');
                }
                
                // 캡처 정보 숨기기
                function hideCaptureInfo() {
                    if (captureInfoDiv) {
                        captureInfoDiv.remove();
                        captureInfoDiv = null;
                    }
                }
                
                // 마우스 오버 이벤트 핸들러
                function handleMouseOver(event) {
                    event.preventDefault();
                    
                    console.log('마우스 오버 감지:', event.target);
                    
                    // 이전 하이라이트 제거
                    if (currentHighlight) {
                        currentHighlight.classList.remove('katalon-highlight');
                    }
                    
                    // 새로운 하이라이트 적용
                    currentHighlight = event.target;
                    currentHighlight.classList.add('katalon-highlight');
                    
                    // 캡처 정보 표시
                    showCaptureInfo();
                    
                    // 요소 정보 수집
                    const elementInfo = {
                        tagName: event.target.tagName || '',
                        id: event.target.id || '',
                        className: event.target.className || '',
                        text: (event.target.textContent || '').trim().substring(0, 50),
                        xpath: getElementXPath(event.target),
                        css: getElementCSSSelector(event.target),
                        name: event.target.name || '',
                        type: event.target.type || '',
                        href: event.target.href || '',
                        src: event.target.src || ''
                    };
                    
                    console.log('요소 정보:', elementInfo);
                    
                    // 부모창에 메시지 전송 시도
                    try {
                        window.parent.postMessage({
                            type: 'elementHover',
                            elementInfo: elementInfo
                        }, '*');
                        console.log('부모창에 메시지 전송 완료');
                    } catch (error) {
                        console.error('postMessage 실패:', error);
                    }
                }
                
                // 마우스 아웃 이벤트 핸들러
                function handleMouseOut(event) {
                    console.log('마우스 아웃:', event.target);
                    hideCaptureInfo();
                }
                
                // 이벤트 리스너 등록
                console.log('이벤트 리스너 등록 중...');
                
                // 기존 이벤트 리스너 제거 (중복 방지)
                document.removeEventListener('mouseover', handleMouseOver, true);
                document.removeEventListener('mouseout', handleMouseOut, true);
                
                // 새로운 이벤트 리스너 추가
                document.addEventListener('mouseover', handleMouseOver, true);
                document.addEventListener('mouseout', handleMouseOut, true);
                
                console.log('✅ Katalon Object Spy 스크립트 완전히 로드됨');
                console.log('✅ 이벤트 리스너 등록 완료');
                
                // 테스트용 메시지
                setTimeout(() => {
                    console.log('🎯 Object Spy 준비 완료! 요소에 마우스를 올려보세요.');
                }, 500);
            `;
            
            // 5단계: 스크립트를 body에 추가
            if (iframeDoc.body) {
                iframeDoc.body.appendChild(script);
                console.log('✅ JavaScript 스크립트 추가 완료');
            } else {
                console.error('❌ iframe body가 없습니다');
                return;
            }
            
            // 6단계: 성공 메시지
            console.log('🎉 스파이 스크립트 주입 완전히 성공!');
            this.updateSelectedLocator('Object Spy 활성화됨 - 요소에 마우스를 올려보세요');
            
        } catch (error) {
            console.error('❌ 스크립트 주입 중 오류:', error);
            this.updateSelectedLocator('스크립트 주입 실패: ' + error.message);
        }
    }

    toggleSpyMode() {
        this.isSpyMode = !this.isSpyMode;
        
        const toggleBtn = document.getElementById('spyToggle');
        if (toggleBtn) {
            if (this.isSpyMode) {
                toggleBtn.textContent = '⏸️ Spy 중지';
                toggleBtn.style.background = '#ef4444';
                this.injectSpyScript();
            } else {
                toggleBtn.textContent = '🔍 Spy 시작';
                toggleBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                this.removeCaptureInfo();
            }
        }

        console.log(`🔍 Spy 모드: ${this.isSpyMode ? 'ON' : 'OFF'}`);
    }

    captureHighlightedElement() {
        if (!this.highlightedElement) {
            console.warn('선택된 요소가 없습니다');
            return;
        }

        const nameInput = document.getElementById('objectName');
        const objectName = nameInput?.value.trim() || this.generateObjectName(this.highlightedElement);

        const objectData = {
            name: objectName,
            content: this.generateRealXML(objectName, this.highlightedElement),
            timestamp: new Date().toLocaleString(),
            url: this.currentUrl,
            elementInfo: this.highlightedElement
        };

        this.capturedObjects.push(objectData);
        this.updateCapturedList();
        this.updateExportAllButton();

        if (nameInput) nameInput.value = '';
        
        console.log(`✅ 오브젝트 캡처됨: ${objectName}`, this.highlightedElement);
        
        // 성공 메시지 표시
        this.showSuccessMessage(`객체 "${objectName}" 캡처 완료!`);
    }

    generateObjectName(elementInfo) {
        if (elementInfo.id) return elementInfo.id;
        if (elementInfo.name) return elementInfo.name;
        if (elementInfo.className) {
            const firstClass = elementInfo.className.split(' ')[0];
            return firstClass.replace(/[^a-zA-Z0-9]/g, '_');
        }
        return elementInfo.tagName.toLowerCase() + '_' + Date.now();
    }

    generateRealXML(name, elementInfo) {
        const selectors = {
            XPATH: elementInfo.xpath || `//\${elementInfo.tagName.toLowerCase()}`,
            CSS: elementInfo.css || elementInfo.tagName.toLowerCase(),
            ID: elementInfo.id ? `id('${elementInfo.id}')` : '',
            NAME: elementInfo.name ? `name('${elementInfo.name}')` : ''
        };

        // 빈 값 제거
        Object.keys(selectors).forEach(key => {
            if (!selectors[key]) delete selectors[key];
        });

        let selectorEntries = '';
        Object.entries(selectors).forEach(([key, value]) => {
            selectorEntries += `      <entry>
         <key>${key}</key>
         <value>${value}</value>
      </entry>
`;
        });

        return `<?xml version="1.0" encoding="UTF-8"?>
<WebElementEntity>
   <description>Captured from ${this.currentUrl}</description>
   <name>${name}</name>
   <tag></tag>
   <elementGuidId>${this.generateUUID()}</elementGuidId>
   <selectorCollection>
${selectorEntries}   </selectorCollection>
   <selectorMethod>XPATH</selectorMethod>
   <smartLocatorEnabled>false</smartLocatorEnabled>
   <useRalativeImagePath>true</useRalativeImagePath>
   <webElementProperties>
      <isSelected>false</isSelected>
      <matchCondition>equals</matchCondition>
      <name>tag</name>
      <type>Main</type>
      <value>${elementInfo.tagName.toLowerCase()}</value>
      <webElementGuid>${this.generateUUID()}</webElementGuid>
   </webElementProperties>
${elementInfo.text ? `   <webElementProperties>
      <isSelected>false</isSelected>
      <matchCondition>equals</matchCondition>
      <name>text</name>
      <type>Main</type>
      <value>${elementInfo.text}</value>
      <webElementGuid>${this.generateUUID()}</webElementGuid>
   </webElementProperties>
` : ''}   <webElementXpaths>
      <isSelected>true</isSelected>
      <matchCondition>equals</matchCondition>
      <name>xpath:attributes</name>
      <type>Main</type>
      <value>${elementInfo.xpath}</value>
      <webElementGuid>${this.generateUUID()}</webElementGuid>
   </webElementXpaths>
</WebElementEntity>`;
    }

    setSelectionMethod(method) {
        console.log(`⚙️ 선택 방법 변경: ${method}`);
        if (this.highlightedElement) {
            const selector = this.getSelectedMethodSelector(method);
            this.updateSelectedLocator(selector);
        }
    }

    getSelectedMethodSelector(method) {
        if (!this.highlightedElement) return '요소를 선택하세요';
        
        switch(method) {
            case 'XPATH': return this.highlightedElement.xpath || '//unknown';
            case 'CSS': return this.highlightedElement.css || 'unknown';
            case 'ID': return this.highlightedElement.id || '(ID 없음)';
            case 'NAME': return this.highlightedElement.name || '(Name 없음)';
            default: return this.highlightedElement.xpath || '//unknown';
        }
    }

    updateCaptureInfo(elementInfo) {
        this.captureInfo = elementInfo;
    }

    removeCaptureInfo() {
        this.captureInfo = null;
        this.updateSelectedLocator('Spy 모드가 비활성화되었습니다');
        this.updateObjectProperties('Spy 모드를 활성화해주세요');
    }

    updateSelectedLocator(text) {
        const locatorElement = document.getElementById('selectedLocator');
        if (locatorElement) {
            locatorElement.textContent = text || '요소를 선택하세요';
        }
    }

    updateObjectProperties(data) {
        const propertiesElement = document.getElementById('objectProperties');
        if (!propertiesElement) return;

        if (typeof data === 'string') {
            propertiesElement.innerHTML = `<div class="placeholder">${data}</div>`;
            return;
        }

        let html = '';
        Object.entries(data).forEach(([key, value]) => {
            if (value) {
                html += `
                    <div class="property-row">
                        <span class="property-name">${key}:</span>
                        <span class="property-value">${value}</span>
                    </div>
                `;
            }
        });

        propertiesElement.innerHTML = html || '<div class="placeholder">속성 정보가 없습니다</div>';
        
        // 버튼 활성화
        const captureBtn = document.getElementById('captureBtn');
        const exportBtn = document.getElementById('exportBtn');
        if (captureBtn && data.tagName) captureBtn.disabled = false;
        if (exportBtn && data.tagName) exportBtn.disabled = false;
    }

    captureCurrentObject() {
        if (this.highlightedElement) {
            this.captureHighlightedElement();
        } else {
            console.warn('선택된 요소가 없습니다');
        }
    }

    exportCurrentObject() {
        if (!this.highlightedElement) {
            alert('선택된 요소가 없습니다.');
            return;
        }

        const nameInput = document.getElementById('objectName');
        const objectName = nameInput?.value.trim() || this.generateObjectName(this.highlightedElement);

        const xmlContent = this.generateRealXML(objectName, this.highlightedElement);
        this.downloadFile(objectName + '.rs', xmlContent);
    }

    async exportAllObjects() {
        if (this.capturedObjects.length === 0) {
            alert('캡처된 오브젝트가 없습니다.');
            return;
        }

        if (window.JSZip) {
            const zip = new JSZip();
            const folder = zip.folder('katalon_objects');

            this.capturedObjects.forEach(obj => {
                folder.file(`${obj.name}.rs`, obj.content);
            });

            const content = await zip.generateAsync({ type: 'blob' });
            this.downloadBlob('katalon_objects.zip', content);
        } else {
            console.warn('JSZip not available, downloading first object only');
            if (this.capturedObjects[0]) {
                this.downloadFile(this.capturedObjects[0].name + '.rs', this.capturedObjects[0].content);
            }
        }
    }

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    downloadFile(filename, content) {
        const blob = new Blob([content], { type: 'application/xml' });
        this.downloadBlob(filename, blob);
    }

    downloadBlob(filename, blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        console.log(`✅ ${filename} 다운로드 완료`);
    }

    updateCapturedList() {
        const itemsElement = document.getElementById('capturedItems');
        if (!itemsElement) return;

        if (this.capturedObjects.length === 0) {
            itemsElement.innerHTML = '<div class="placeholder">캡처된 오브젝트가 없습니다</div>';
            return;
        }

        let html = '';
        this.capturedObjects.forEach((obj, index) => {
            html += `
                <div class="captured-item">
                    <div class="item-info">
                        <strong>${obj.name}</strong>
                        <small>${obj.timestamp}</small>
                    </div>
                    <div class="item-actions">
                        <button onclick="objectSpyController.downloadCapturedObject(${index})" 
                                class="item-btn" title="다운로드">💾</button>
                        <button onclick="objectSpyController.removeCapturedObject(${index})" 
                                class="item-btn remove-btn" title="삭제">🗑️</button>
                    </div>
                </div>
            `;
        });

        itemsElement.innerHTML = html;
    }

    updateExportAllButton() {
        const exportAllBtn = document.getElementById('exportAllBtn');
        if (exportAllBtn) {
            exportAllBtn.disabled = this.capturedObjects.length === 0;
            exportAllBtn.textContent = `📦 Export All (${this.capturedObjects.length})`;
        }
    }

    downloadCapturedObject(index) {
        const obj = this.capturedObjects[index];
        if (obj) {
            this.downloadFile(obj.name + '.rs', obj.content);
        }
    }

    removeCapturedObject(index) {
        if (confirm('이 오브젝트를 제거하시겠습니까?')) {
            this.capturedObjects.splice(index, 1);
            this.updateCapturedList();
            this.updateExportAllButton();
            console.log(`🗑️ 오브젝트 제거됨 (인덱스: ${index})`);
        }
    }

    showLoading(show) {
        const indicator = document.getElementById('loadingIndicator');
        if (indicator) {
            indicator.style.display = show ? 'flex' : 'none';
        }
    }

    showSuccessMessage(message) {
        // 간단한 성공 메시지 표시
        console.log(`✅ ${message}`);
        
        // UI에 메시지 표시 (선택사항)
        const captureBtn = document.getElementById('captureBtn');
        if (captureBtn) {
            const originalText = captureBtn.textContent;
            captureBtn.textContent = '✅ 캡처됨!';
            captureBtn.disabled = true;
            
            setTimeout(() => {
                captureBtn.textContent = originalText;
                captureBtn.disabled = false;
            }, 1500);
        }
    }

    // 개발자 도구용 디버그 함수들
    debug() {
        return {
            currentUrl: this.currentUrl,
            isSpyMode: this.isSpyMode,
            highlightedElement: this.highlightedElement,
            capturedCount: this.capturedObjects.length,
            iframe: !!this.iframe
        };
    }

    // 테스트용 가상 요소 선택
    testElementSelection() {
        const mockElement = {
            tagName: 'BUTTON',
            id: 'test-button',
            className: 'btn btn-primary',
            text: '테스트 버튼',
            xpath: '//button[@id="test-button"]',
            css: '#test-button',
            name: 'testBtn',
            type: 'button'
        };
        
        this.highlightedElement = mockElement;
        this.updateSelectedLocator(mockElement.xpath);
        this.updateObjectProperties(mockElement);
        console.log('🧪 테스트 요소 선택 완료');
    }
}

// 전역 인스턴스 생성 및 등록
window.objectSpyController = null;

// Object Spy 탭 활성화 시 초기화
document.addEventListener('click', function(e) {
    if (e.target.matches('[data-tab="objectspy"]')) {
        if (!window.objectSpyController) {
            setTimeout(() => {
                try {
                    window.objectSpyController = new ObjectSpyController();
                    console.log('✅ ObjectSpyController 생성 완료');
                    
                    // 개발자 도구용 전역 함수 등록
                    window.testObjectSpy = () => {
                        if (window.objectSpyController) {
                            window.objectSpyController.testElementSelection();
                        }
                    };
                    
                    window.debugObjectSpy = () => {
                        if (window.objectSpyController) {
                            console.table(window.objectSpyController.debug());
                        }
                    };
                    
                } catch (error) {
                    console.error('❌ ObjectSpyController 생성 실패:', error);
                }
            }, 200);
        }
    }
});

// 개발자를 위한 콘솔 명령어 안내
console.log(`
🔍 Object Spy 개발자 명령어:
- testObjectSpy()     : 가상 요소 선택 테스트
- debugObjectSpy()    : 현재 상태 출력
- objectSpyController : 컨트롤러 인스턴스 접근

🎯 사용법:
1. Object Spy 탭 클릭
2. 원하는 웹페이지로 이동
3. "🔍 Spy 시작" 버튼 클릭
4. 요소에 마우스 올리기 (빨간 하이라이트)
5. Alt + \` 키로 객체 캡처
`);

console.log('✅ object-spy-controller.js (완전 기능 버전) 로드 완료');