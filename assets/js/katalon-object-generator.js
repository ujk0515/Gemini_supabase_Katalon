/**
 * 카탈론 오브젝트 파일 생성기
 * assets/js/katalon-object-generator.js
 */

class KatalonObjectGenerator {
    constructor() {
        this.currentElement = null;
        this.elementProperties = {};
        this.selectors = {};
        this.selectedMethod = 'XPATH';
        console.log('✅ KatalonObjectGenerator 초기화 완료');
    }

    /**
     * UUID 생성
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * 요소명 안전화
     */
    sanitizeElementName(name) {
        return name
            .replace(/[^a-zA-Z0-9가-힣]/g, '_')
            .replace(/_{2,}/g, '_')
            .replace(/^_|_$/g, '')
            .toLowerCase() || 'element';
    }

    /**
     * 요소에서 셀렉터 추출
     */
    extractSelectors(element) {
        const selectors = {};
        
        try {
            // CSS 셀렉터
            if (element.id) {
                selectors.CSS = `#${element.id}`;
            } else if (element.className) {
                const classList = element.className.split(' ').filter(c => c.trim());
                if (classList.length > 0) {
                    selectors.CSS = `.${classList.join('.')}`;
                }
            }

            // XPATH 생성
            selectors.XPATH = this.generateXPath(element);

            // 속성 기반 셀렉터
            if (element.name) {
                selectors.NAME = element.name;
            }
            
            if (element.getAttribute('data-testid')) {
                selectors.CSS = `[data-testid="${element.getAttribute('data-testid')}"]`;
            }

        } catch (error) {
            console.warn('셀렉터 추출 실패:', error);
            selectors.XPATH = '//body';
        }

        return selectors;
    }

    /**
     * XPath 생성
     */
    generateXPath(element) {
        if (!element || element.nodeType !== Node.ELEMENT_NODE) {
            return '//body';
        }

        // ID가 있으면 우선 사용
        if (element.id) {
            return `//*[@id='${element.id}']`;
        }

        // 경로 기반 XPath 생성
        const parts = [];
        let current = element;

        while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body) {
            let selector = current.nodeName.toLowerCase();
            
            // 같은 태그의 형제 요소 중 몇 번째인지 계산
            const siblings = Array.from(current.parentNode.children)
                .filter(child => child.nodeName === current.nodeName);
            
            if (siblings.length > 1) {
                const index = siblings.indexOf(current) + 1;
                selector += `[${index}]`;
            }

            parts.unshift(selector);
            current = current.parentNode;
        }

        return '//' + parts.join('/');
    }

    /**
     * 요소 속성 추출
     */
    extractElementProperties(element) {
        const properties = [];

        // 기본 속성들
        const basicAttributes = ['tag', 'id', 'name', 'class', 'type', 'value', 'placeholder', 'title', 'alt'];
        
        basicAttributes.forEach(attr => {
            let value = '';
            
            if (attr === 'tag') {
                value = element.tagName.toLowerCase();
            } else if (attr === 'class') {
                value = element.className || '';
            } else {
                value = element.getAttribute(attr) || '';
            }

            if (value) {
                properties.push({
                    name: attr,
                    type: 'Main',
                    value: value,
                    isSelected: ['id', 'name', 'tag'].includes(attr),
                    matchCondition: 'equals',
                    guid: this.generateUUID()
                });
            }
        });

        // 추가 속성들
        const additionalAttributes = element.getAttributeNames()
            .filter(attr => !basicAttributes.includes(attr))
            .slice(0, 10); // 최대 10개만

        additionalAttributes.forEach(attr => {
            const value = element.getAttribute(attr);
            if (value && value.length < 200) { // 너무 긴 값 제외
                properties.push({
                    name: attr,
                    type: 'Main',
                    value: value,
                    isSelected: false,
                    matchCondition: 'equals',
                    guid: this.generateUUID()
                });
            }
        });

        return properties;
    }

    /**
     * XPath 목록 생성
     */
    generateXPathList(element, selectors) {
        const xpaths = [];

        // 기본 XPath
        if (selectors.XPATH) {
            xpaths.push({
                name: 'xpath:attributes',
                type: 'Main',
                value: selectors.XPATH,
                guid: this.generateUUID()
            });
        }

        // ID 기반 XPath
        if (element.id) {
            xpaths.push({
                name: 'xpath:idRelative',
                type: 'Main',
                value: `//*[@id="${element.id}"]`,
                guid: this.generateUUID()
            });
        }

        // 위치 기반 XPath
        const positionXPath = this.generatePositionXPath(element);
        if (positionXPath) {
            xpaths.push({
                name: 'xpath:position',
                type: 'Main',
                value: positionXPath,
                guid: this.generateUUID()
            });
        }

        // 텍스트 기반 XPath (텍스트가 있는 경우)
        if (element.textContent && element.textContent.trim().length > 0 && element.textContent.trim().length < 50) {
            const text = element.textContent.trim();
            xpaths.push({
                name: 'xpath:text',
                type: 'Main',
                value: `//*[text()='${text}']`,
                guid: this.generateUUID()
            });
        }

        // 사용자 정의 속성 기반 XPath
        const customAttrs = ['data-testid', 'data-test', 'aria-label'];
        customAttrs.forEach(attr => {
            const value = element.getAttribute(attr);
            if (value) {
                xpaths.push({
                    name: `xpath:${attr}`,
                    type: 'Main',
                    value: `//*[@${attr}='${value}']`,
                    guid: this.generateUUID()
                });
            }
        });

        return xpaths;
    }

    /**
     * 위치 기반 XPath 생성
     */
    generatePositionXPath(element) {
        const tagName = element.tagName.toLowerCase();
        const parent = element.parentElement;
        
        if (!parent) return null;

        const siblings = Array.from(parent.children).filter(child => 
            child.tagName.toLowerCase() === tagName
        );

        if (siblings.length === 1) {
            return `//${tagName}`;
        }

        const index = siblings.indexOf(element) + 1;
        return `//${tagName}[${index}]`;
    }

    /**
     * 카탈론 오브젝트 XML 생성
     */
    generateKatalonObject(elementName, element, selectors, selectedMethod = 'XPATH') {
        const guid = this.generateUUID();
        const properties = this.extractElementProperties(element);
        const xpaths = this.generateXPathList(element, selectors);
        
        // 선택된 셀렉터 결정
        const selectedSelector = selectors[selectedMethod] || selectors.XPATH || '//body';

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<WebElementEntity>
   <description></description>
   <name>${elementName}</name>
   <tag></tag>
   <elementGuidId>${guid}</elementGuidId>
   <selectorCollection>`;

        // 셀렉터 컬렉션 추가
        Object.entries(selectors).forEach(([method, selector]) => {
            xml += `
      <entry>
         <key>${method}</key>
         <value>${this.escapeXml(selector)}</value>
      </entry>`;
        });

        xml += `
   </selectorCollection>
   <selectorMethod>${selectedMethod}</selectorMethod>
   <smartLocatorEnabled>false</smartLocatorEnabled>
   <useRalativeImagePath>true</useRalativeImagePath>`;

        // 요소 속성들 추가
        properties.forEach(prop => {
            xml += `
   <webElementProperties>
      <isSelected>${prop.isSelected}</isSelected>
      <matchCondition>${prop.matchCondition}</matchCondition>
      <name>${this.escapeXml(prop.name)}</name>
      <type>${prop.type}</type>
      <value>${this.escapeXml(prop.value)}</value>
      <webElementGuid>${prop.guid}</webElementGuid>
   </webElementProperties>`;
        });

        // XPath 목록 추가
        xpaths.forEach(xpath => {
            xml += `
   <webElementXpaths>
      <isSelected>${xpath.name === 'xpath:attributes'}</isSelected>
      <matchCondition>equals</matchCondition>
      <name>${xpath.name}</name>
      <type>${xpath.type}</type>
      <value>${this.escapeXml(xpath.value)}</value>
      <webElementGuid>${xpath.guid}</webElementGuid>
   </webElementXpaths>`;
        });

        xml += `
</WebElementEntity>`;

        return xml;
    }

    /**
     * XML 특수문자 이스케이프
     */
    escapeXml(text) {
        if (!text) return '';
        return text.toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * 오브젝트 파일 다운로드
     */
    downloadObjectFile(elementName, content) {
        const fileName = `${elementName}.rs`;
        const blob = new Blob([content], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        console.log(`✅ ${fileName} 다운로드 완료`);
    }

    /**
     * 여러 오브젝트를 ZIP으로 다운로드
     */
    async downloadMultipleObjects(objects) {
        if (!window.JSZip) {
            console.error('JSZip 라이브러리가 필요합니다');
            return;
        }

        const zip = new JSZip();
        const folder = zip.folder('katalon_objects');

        objects.forEach(obj => {
            folder.file(`${obj.name}.rs`, obj.content);
        });

        try {
            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'katalon_objects.zip';
            a.style.display = 'none';
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            console.log(`✅ ${objects.length}개 오브젝트 ZIP 다운로드 완료`);
        } catch (error) {
            console.error('ZIP 생성 실패:', error);
        }
    }

    /**
     * 요소에서 오브젝트 생성 (전체 프로세스)
     */
    createObjectFromElement(element, customName = null) {
        if (!element) {
            console.error('요소가 선택되지 않았습니다');
            return null;
        }

        // 요소명 생성
        let elementName = customName;
        if (!elementName) {
            const id = element.id;
            const className = element.className?.split(' ')[0];
            const tagName = element.tagName.toLowerCase();
            const text = element.textContent?.trim().substring(0, 20);
            
            elementName = id || className || text || tagName || 'element';
            elementName = this.sanitizeElementName(elementName);
        }

        // 셀렉터 추출
        const selectors = this.extractSelectors(element);
        
        // XML 생성
        const xmlContent = this.generateKatalonObject(
            elementName, 
            element, 
            selectors, 
            this.selectedMethod
        );

        return {
            name: elementName,
            content: xmlContent,
            selectors: selectors,
            element: element
        };
    }

    /**
     * 선택 방법 설정
     */
    setSelectionMethod(method) {
        const validMethods = ['XPATH', 'CSS', 'ID', 'NAME', 'CLASS'];
        if (validMethods.includes(method)) {
            this.selectedMethod = method;
            console.log(`✅ 선택 방법 변경: ${method}`);
        }
    }

    /**
     * 미리보기 데이터 생성
     */
    generatePreviewData(element) {
        if (!element) return null;

        const selectors = this.extractSelectors(element);
        const properties = this.extractElementProperties(element);
        
        return {
            tagName: element.tagName.toLowerCase(),
            selectors: selectors,
            properties: properties.slice(0, 8), // 주요 속성만
            text: element.textContent?.trim().substring(0, 100) || '',
            attributes: Object.fromEntries(
                Array.from(element.attributes)
                    .slice(0, 10)
                    .map(attr => [attr.name, attr.value])
            )
        };
    }
}

// 전역 인스턴스 생성
window.katalonGenerator = new KatalonObjectGenerator();

// 전역 함수들
window.createKatalonObject = function(element, name) {
    return window.katalonGenerator.createObjectFromElement(element, name);
};

window.downloadKatalonObject = function(elementName, content) {
    window.katalonGenerator.downloadObjectFile(elementName, content);
};

window.setKatalonSelectionMethod = function(method) {
    window.katalonGenerator.setSelectionMethod(method);
};

console.log('✅ katalon-object-generator.js 로드 완료');