/**
 * Gemini API 기반 키워드 추출 전용 모듈
 * libs/gemini-keywords.js
 */

class GeminiKeywordExtractor {
    constructor() {
        console.log('🤖 Gemini 키워드 추출기 생성됨');
    }

    /**
     * 2단계: Gemini API로 키워드 추출
     * @param {string} text - 분석할 텍스트
     * @returns {Array} 추출된 키워드 배열
     */
    async extractKeywords(text) {
        if (!text || !text.trim()) {
            return [];
        }

        const prompt = `
다음 텍스트에서 Katalon 테스트 자동화에 필요한 핵심 키워드를 추출해주세요.
액션 키워드(클릭, 입력, 확인, 업로드, 다운로드 등)와 요소 키워드(버튼, 필드, 팝업, 메시지 등)를 구분해서 추출하세요.

텍스트: "${text}"

출력 형식: JSON만 반환하세요. 다른 설명은 포함하지 마세요.
{
  "actionKeywords": ["클릭", "입력"],
  "elementKeywords": ["버튼", "필드"],
  "allKeywords": ["클릭", "입력", "버튼", "필드"]
}`;

        try {
            console.log(`🚀 Supabase 함수 호출 중... (텍스트: "${text.substring(0, 50)}...")`);
            
            const supabase = window.getSupabaseClient();
            if (!supabase) {
                throw new Error("Supabase client not initialized");
            }

            // Note: The keyword extractor seems to use a specific model.
            // We will hardcode 'gemma-3-27b-it' for now as it was in the original file.
            // A better approach would be to make this configurable if needed.
            const model = 'gemma-3-27b-it';

            const { data: responseData, error } = await supabase.functions.invoke('abcd', {
                body: {
                    model: model,
                    contents: [{ 
                        parts: [{ text: prompt }] 
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 1000
                    }
                }
            });

            if (error) {
                throw new Error(`Supabase function error: ${error.message}`);
            }
            
            if (!responseData.candidates || !responseData.candidates[0] || !responseData.candidates[0].content) {
                throw new Error('API 응답 형식이 올바르지 않습니다');
            }

            const resultText = responseData.candidates[0].content.parts[0].text;
            console.log('📥 원본 응답:', resultText);

            // JSON 파싱 시도
            const cleanedText = this.cleanJsonResponse(resultText);
            const result = JSON.parse(cleanedText);
            
            const keywords = result.allKeywords || [];
            console.log(`✅ 키워드 추출 성공: [${keywords.join(', ')}]`);
            
            return keywords;

        } catch (error) {
            console.warn(`❌ 키워드 추출 실패:`, error.message);
            console.log('🔄 기존 방식으로 fallback 실행');
            return this.fallbackExtractKeywords(text);
        }
    }

    /**
     * JSON 응답 정리 (불필요한 텍스트 제거)
     * @param {string} text - 원본 응답 텍스트
     * @returns {string} 정리된 JSON 문자열
     */
    cleanJsonResponse(text) {
        // ```json 블록 제거
        let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
        
        // 앞뒤 불필요한 텍스트 제거
        const jsonStart = cleaned.indexOf('{');
        const jsonEnd = cleaned.lastIndexOf('}');
        
        if (jsonStart !== -1 && jsonEnd !== -1) {
            cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
        }
        
        return cleaned.trim();
    }

    /**
     * Fallback: 기존 키워드 추출 방식
     * @param {string} text - 분석할 텍스트
     * @returns {Array} 추출된 키워드 배열
     */
    fallbackExtractKeywords(text) {
        if (!text) return [];
        
        console.log('🔄 기존 방식으로 키워드 추출 중...');
        
        const words = text
            .replace(/[^\w\s가-힣]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length >= 2)
            .map(word => word.toLowerCase())
            .filter(word => !/^\d+\.?$/.test(word)); // 숫자 제거
        
        const keywords = [...new Set(words)]; // 중복 제거
        console.log(`✅ 기존 방식 키워드 추출: [${keywords.join(', ')}]`);
        
        return keywords;
    }

    /**
     * 연결 테스트
     * @returns {Promise<boolean>} 연결 성공 여부
     */
    async testConnection() {
        try {
            console.log('🔍 Supabase 함수 연결 테스트 중...');
            
            const testKeywords = await this.extractKeywords('테스트 버튼을 클릭한다');
            
            if (testKeywords && testKeywords.length > 0) {
                console.log('✅ Supabase 함수 연결 테스트 성공');
                return true;
            } else {
                console.warn('⚠️ Supabase 함수 응답이 비어있음');
                return false;
            }
        } catch (error) {
            console.error('❌ Supabase 함수 연결 테스트 실패:', error);
            return false;
        }
    }
}

// 전역 등록
window.GeminiKeywordExtractor = GeminiKeywordExtractor;

// 즉시 초기화 테스트
console.log('📚 Gemini 키워드 추출기 모듈 로드 완료');

// 모듈 로드 완료 후 자동 테스트 (선택적)
setTimeout(async () => {
    if (window.GeminiKeywordExtractor) {
        const testExtractor = new GeminiKeywordExtractor();
        // The API key is now handled by the server, so we can assume the client is always "valid"
        // if the Supabase client is available.
        console.log('✅ 키워드 추출기 클라이언트 준비 완료');
        // You can uncomment the following line to run a connection test on startup.
        // await testExtractor.testConnection();
    }
}, 500);