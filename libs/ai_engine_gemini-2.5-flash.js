/**
* Gemini-2.5-flash 전용 AI 엔진 (최신 모델 지원)
* libs/ai_engine_gemini-2.5-flash.js
*/

class Gemini25FlashEngine {
   constructor() {
       this.analysisResults = {};
       this.currentStep = 0;
       this.lastEvaluation = null;
       this.promptCache = {};
       this.cacheTimestamp = null;
       this.modelName = 'gemini-2.5-flash';
   }

   

   async getPromptStep(stepNumber) {
       const now = Date.now();
       if (!this.cacheTimestamp || (now - this.cacheTimestamp) > 30000) {
           await this.refreshPromptCache();
       }
       
       return this.promptCache[`step${stepNumber}`] || '';
   }

   async refreshPromptCache() {
       try {
           if (window.MASTER_PROMPTS) {
               this.promptCache = {
                   step1: window.MASTER_PROMPTS.step1,
                   step2: window.MASTER_PROMPTS.step2,
                   step3: window.MASTER_PROMPTS.step3,
                   step4: window.MASTER_PROMPTS.step4,
                   step5: window.MASTER_PROMPTS.step5
               };
               this.cacheTimestamp = Date.now();
               console.log('Gemini 2.5 Flash: 프롬프트 캐시 갱신 완료');
           } else {
               throw new Error('MASTER_PROMPTS가 로드되지 않았습니다.');
           }
       } catch (error) {
           console.error('Gemini 2.5 Flash 프롬프트 로딩 실패:', error);
           throw new Error('프롬프트 파일을 읽을 수 없습니다.');
       }
   }

   async loadExamplesFromSupabase() {
       try {
           let client = window.testClient;
           
           if (!client && window.getSupabaseClient) {
               client = window.getSupabaseClient();
           }
           
           if (!client) {
               console.warn('Gemini 2.5 Flash: Supabase 클라이언트가 없습니다. 예제 없이 진행합니다.');
               return [];
           }

           const { data, error } = await client
               .from('katalon_good_examples')
               .select('*')
               .order('created_at', { ascending: false }); // 모든 예제 가져오기

           if (error) {
               console.error('Gemini 2.5 Flash Supabase 예제 로딩 실패:', error);
               return [];
           }

           console.log(`Gemini 2.5 Flash: ${data?.length || 0}개의 고품질 예제 로딩 완료`);
           return data || [];
       } catch (error) {
           console.error('Gemini 2.5 Flash 예제 로딩 중 오류:', error);
           return [];
       }
   }

   processPromptTemplate(prompt, variables) {
       try {
           let processedPrompt = prompt;

           // {{}} 방식 템플릿 처리 (더 안전함)
           if (variables.parsedTC) {
               processedPrompt = processedPrompt.replace(/\{\{parsedTC\.summary\}\}/g, variables.parsedTC.summary || '');
               processedPrompt = processedPrompt.replace(/\{\{parsedTC\.precondition\}\}/g, JSON.stringify(variables.parsedTC.precondition || [], null, 2));
               processedPrompt = processedPrompt.replace(/\{\{parsedTC\.steps\}\}/g, JSON.stringify(variables.parsedTC.steps || [], null, 2));
               processedPrompt = processedPrompt.replace(/\{\{parsedTC\.expectedResult\}\}/g, variables.parsedTC.expectedResult || '');
           }

           if (variables.step1Result) {
               processedPrompt = processedPrompt.replace(/\{\{step1Result\.environmentSetup\}\}/g, JSON.stringify(variables.step1Result.environmentSetup || [], null, 2));
               processedPrompt = processedPrompt.replace(/\{\{step1Result\.preconditionAnalysis\}\}/g, JSON.stringify(variables.step1Result.preconditionAnalysis || [], null, 2));
               processedPrompt = processedPrompt.replace(/\{\{step1Result\}\}/g, JSON.stringify(variables.step1Result, null, 2));
           }

           if (variables.step2Result) {
               processedPrompt = processedPrompt.replace(/\{\{step2Result\}\}/g, JSON.stringify(variables.step2Result, null, 2));
           }

           if (variables.examples) {
               const examplesText = variables.examples.length > 0 ? 
                   variables.examples.map(e => `// 예제: ${e.description}\n${e.script}`).join('\n\n') : 
                   '// 참고할 예제 없음';
               processedPrompt = processedPrompt.replace(/\{\{examples\}\}/g, examplesText);
           }

           if (variables.plan) {
               processedPrompt = processedPrompt.replace(/\{\{plan\}\}/g, JSON.stringify(variables.plan, null, 2));
           }

           if (variables.firstCode) {
               processedPrompt = processedPrompt.replace(/\{\{firstCode\}\}/g, variables.firstCode);
           }

           return processedPrompt;
       } catch (error) {
           console.error('Gemini 2.5 Flash 프롬프트 템플릿 처리 실패:', error);
           return prompt;
       }
   }

   parseTestcase(text) {
       const lines = text.split('\n').map(line => line.trim()).filter(line => line);
       const result = { summary: '', precondition: [], steps: [], expectedResult: '' };

       let currentSection = null;

       for (const line of lines) {
           if (line.toLowerCase().includes('summary')) {
               currentSection = 'summary';
               const colonIndex = line.indexOf(':');
               if (colonIndex !== -1) result.summary = line.substring(colonIndex + 1).trim();
           } else if (line.toLowerCase().includes('precondition')) {
               currentSection = 'precondition';
           } else if (line.toLowerCase().includes('steps')) {
               currentSection = 'steps';
           } else if (line.toLowerCase().includes('expected result')) {
               currentSection = 'expectedResult';
               const colonIndex = line.indexOf(':');
               if (colonIndex !== -1) result.expectedResult = line.substring(colonIndex + 1).trim();
           } else if (currentSection === 'precondition' && line) {
               result.precondition.push(line);
           } else if (currentSection === 'steps' && line) {
               result.steps.push(line);
           } else if (currentSection === 'expectedResult' && line) {
               if (result.expectedResult) result.expectedResult += ' ' + line;
               else result.expectedResult = line;
           }
       }

       return result;
   }

   async startAnalysis(testcaseText) {
       try {
           this.showProgress();
           this.updateProgress(0, 'Gemini 2.5 Flash 5단계 최신 AI 분석 시작...');

           const parsedTC = this.parseTestcase(testcaseText);

           // Step 1-5: 기본 스크립트 생성 후 예시 비교 개선
           const step1 = await this.analyzeSituationAndEnvironment(parsedTC);
           const step2 = await this.mapActionsAndValidation(parsedTC, step1);
           const step3 = await this.createScriptPlan(parsedTC, step1, step2);
           const step4 = await this.generateFirstScript(step3);
           const step5 = await this.generateFinalScript(step4, step3.examples);

           this.showResult(step5);
           return step5;

       } catch (error) {
           console.error('Gemini 2.5 Flash 5단계 최신 AI 분석 실패:', error);
           this.updateProgress(-1, `분석 실패: ${error.message}`);
           throw error;
       }
   }

   async analyzeSituationAndEnvironment(parsedTC) {
       this.updateProgress(1, '고급 상황 파악 및 환경 설정 분석 중...');

       let prompt = await this.getPromptStep(1);
       
       // Gemini 2.5에 최적화된 프롬프트 확장
       prompt += `\n\n참고: Gemini 2.5 Flash 모델을 사용하여 더 정확하고 상세한 분석을 수행합니다.`;
       
       prompt = this.processPromptTemplate(prompt, { parsedTC });

       const result = await this.callGemini(prompt);
       this.analysisResults.step1 = result;
       this.updateProgress(1, `고급 상황 분석 완료: ${result.testPurpose || '분석 완료'}`);
       return result;
   }

   async mapActionsAndValidation(parsedTC, step1Result) {
       this.updateProgress(2, '지능형 액션 매핑 및 검증 로직 설계 중...');

       let prompt = await this.getPromptStep(2);
       
       // 2.5-flash 특화 프롬프트
       prompt += `\n\n추가 지침: Gemini 2.5 Flash의 향상된 추론 능력을 활용하여 더 정교한 액션 매핑을 수행해주세요.`;
       
       prompt = this.processPromptTemplate(prompt, { parsedTC, step1Result });

       const result = await this.callGemini(prompt);
       this.analysisResults.step2 = result;
       this.updateProgress(2, `지능형 액션 매핑 완료: ${result.mainActions?.length || 0}개 액션, ${result.validationLogic?.length || 0}개 검증`);
       return result;
   }

   async createScriptPlan(parsedTC, step1Result, step2Result) {
       this.updateProgress(3, 'Gemini 2.5 Flash 설계도 작성 및 예제 로딩 중...');

       try {
           // Supabase에서 예제 로딩 후 랜덤 3개 선택
           const allExamples = await this.loadExamplesFromSupabase();
           const shuffled = allExamples.sort(() => 0.5 - Math.random());
           const examples = shuffled.slice(0, 3).map(example => ({
               description: example.description || '예제',
               script: example.script ? example.script.substring(0, 500) + '...' : ''
           }));
           console.log(`Gemini 2.5 Flash - 총 예제 개수: ${allExamples.length}, 랜덤 선택된 예제: ${examples.length}`);

           let prompt = await this.getPromptStep(3);

           // 2.5-flash 특화 지침 추가
           prompt += `\n\n최신 모델 활용: Gemini 2.5 Flash의 개선된 코드 생성 능력을 활용하여 더욱 안정적이고 효율적인 스크립트 설계도를 작성해주세요.`;

           // 예제를 포함한 설계도 작성
           prompt = this.processPromptTemplate(prompt, {
               parsedTC,
               step1Result,
               step2Result,
               examples
           });

           const rawResult = await this.callGemini(prompt);
           this.analysisResults.step3 = rawResult;
           
           // step3는 문자열로 반환되므로 JSON 파싱 시도
           let result;
           try {
               if (typeof rawResult === 'string') {
                   const cleanedText = rawResult.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
                   const jsonStart = cleanedText.indexOf('{');
                   const jsonEnd = cleanedText.lastIndexOf('}');
                   if (jsonStart !== -1 && jsonEnd !== -1) {
                       const jsonText = cleanedText.substring(jsonStart, jsonEnd + 1);
                       result = JSON.parse(jsonText);
                   } else {
                       throw new Error('JSON 구조를 찾을 수 없음');
                   }
               } else {
                   result = rawResult;
               }
           } catch (error) {
               console.warn('Gemini 2.5 Flash step3 JSON 파싱 실패, 기본값 사용:', error);
               result = {
                   scriptName: "Gemini25_고급_테스트",
                   overallStructure: "try-finally",
                   plan: [],
                   finalization: { instruction: "WebUI.closeBrowser()", reason: "브라우저 종료" }
               };
           }
           
           // 예제를 result에 추가하여 step5에서 사용
           result.examples = examples;
           this.updateProgress(3, 'Gemini 2.5 Flash 1차 설계도 작성 완료!');
           return result;

       } catch (error) {
           console.error('Gemini 2.5 Flash 설계도 작성 실패:', error);
           this.updateProgress(3, '설계도 작성 실패');
           return {
               scriptName: "Gemini25_고급_테스트",
               overallStructure: "try-finally",
               plan: [],
               finalization: { instruction: "WebUI.closeBrowser()", reason: "브라우저 종료" }
           };
       }
   }

   async generateFirstScript(plan) {
       this.updateProgress(4, 'Gemini 2.5 Flash 1차 스크립트 생성 중...');

       try {
           let prompt = await this.getPromptStep(4);

           // 2.5-flash 특화 지침
           prompt += `\n\n고급 생성 지침: Gemini 2.5 Flash의 최신 코드 생성 기술을 활용하여 더욱 최적화되고 유지보수가 용이한 Katalon 스크립트를 생성해주세요.`;

           prompt = this.processPromptTemplate(prompt, { plan });

           const result = await this.callGemini(prompt);
           this.analysisResults.step4 = result;

           let cleanedResult = result;
           if (typeof result === 'string') {
               cleanedResult = result
                   .replace(/^```groovy\s*/g, '')
                   .replace(/```\s*$/g, '')
                   .trim();
           }

           this.updateProgress(4, 'Gemini 2.5 Flash 1차 스크립트 생성 완료!');
           return cleanedResult;

       } catch (error) {
           console.error('Gemini 2.5 Flash 1차 스크립트 생성 실패:', error);
           this.updateProgress(4, '1차 스크립트 생성 실패');
           return `// Gemini 2.5 Flash 1차 생성 스크립트 (폴백)
try {
   // 기본 스크립트
   WebUI.navigateToUrl(GlobalVariable.BASE_URL)
   WebUI.waitForPageLoad(10)
   
   // TODO: 상세 구현 필요
   
} finally {
   WebUI.closeBrowser()
}`;
       }
   }

   async generateFinalScript(firstCode, examples) {
       this.updateProgress(5, 'Gemini 2.5 Flash 예시 비교 및 최종 스크립트 개선 중...');

       try {
           let prompt = await this.getPromptStep(5);

           // Gemini 2.5 Flash 특화 개선 지침
           prompt += `\n\n최신 AI 개선 지침: Gemini 2.5 Flash의 향상된 코드 최적화 능력을 활용하여 예제와의 비교를 통해 더욱 완성도 높은 최종 스크립트를 생성해주세요.`;

           prompt = this.processPromptTemplate(prompt, { firstCode, examples });

           const result = await this.callGemini(prompt);
           this.analysisResults.step5 = result;

           let cleanedResult = result;
           if (typeof result === 'string') {
               cleanedResult = result
                   .replace(/^```groovy\s*/g, '')
                   .replace(/```\s*$/g, '')
                   .trim();
           }

           this.updateProgress(5, 'Gemini 2.5 Flash 최종 스크립트 완성!');
           return cleanedResult;

       } catch (error) {
           console.error('Gemini 2.5 Flash 최종 스크립트 생성 실패:', error);
           this.updateProgress(5, '최종 스크립트 생성 실패 - 1차 스크립트 반환');
           return firstCode;
       }
   }


   async evaluateScriptQuality(script) {
       const prompt = `당신은 Gemini 2.5 Flash입니다. 다음 Katalon Groovy 스크립트를 최신 AI 기준으로 전문가 수준에서 100점 만점으로 평가해주세요.

=== 평가 대상 스크립트 ===
${script}

=== 평가 기준 (Gemini 2.5 Flash 고급 평가) ===
1. 코드 품질 및 구조 (30점)
2. 실행 가능성 및 안정성 (25점)
3. 성능 및 효율성 (20점)
4. 가독성 및 유지보수성 (15점)
5. Katalon 표준 및 베스트 프랙티스 준수 (10점)

Gemini 2.5 Flash의 향상된 분석 능력을 활용하여 더욱 정교한 평가를 수행해주세요.

다음 JSON 형식으로만 반환하세요:
{
 "score": 85,
 "grade": "우수",
 "issues": ["구체적인 문제점1", "구체적인 문제점2"],
 "strengths": ["잘된 부분1", "잘된 부분2"],
 "recommendation": "개선 권장사항",
 "advanced_notes": "Gemini 2.5 Flash 추가 분석 의견"
}`;

       try {
           console.log('Gemini 2.5 Flash AI 스크립트 품질 평가 시작...');

           const result = await this.callGemini(prompt);
           console.log('Gemini 2.5 Flash AI 평가 완료:', result);

           if (typeof result === 'string') {
               try {
                   const cleanedResult = result
                       .replace(/```json\s*/g, '')
                       .replace(/```\s*$/g, '')
                       .trim();

                   const jsonStart = cleanedResult.indexOf('{');
                   const jsonEnd = cleanedResult.lastIndexOf('}');

                   if (jsonStart !== -1 && jsonEnd !== -1) {
                       const jsonText = cleanedResult.substring(jsonStart, jsonEnd + 1);
                       const evaluation = JSON.parse(jsonText);
                       this.lastEvaluation = evaluation;
                       return evaluation;
                   }
               } catch (parseError) {
                   console.warn('Gemini 2.5 Flash AI 평가 JSON 파싱 실패:', parseError);
               }
           } else if (typeof result === 'object') {
               this.lastEvaluation = result;
               return result;
           }

           const fallbackEvaluation = {
               score: 78,
               grade: "양호",
               issues: ["AI 평가 파싱 실패"],
               strengths: ["Gemini 2.5 구조 양호"],
               recommendation: "수동 검토 필요",
               advanced_notes: "Gemini 2.5 Flash 평가 시스템 이슈"
           };
           this.lastEvaluation = fallbackEvaluation;
           return fallbackEvaluation;

       } catch (error) {
           console.error('Gemini 2.5 Flash AI 평가 실패:', error);

           const errorEvaluation = {
               score: 75,
               grade: "평가불가",
               issues: ["Gemini 2.5 Flash AI 평가 시스템 오류"],
               strengths: ["코드 생성 완료"],
               recommendation: "네트워크 연결 확인 후 재시도",
               advanced_notes: "최신 모델 평가 기능 일시 중단"
           };
           this.lastEvaluation = errorEvaluation;
           return errorEvaluation;
       }
   }

   async improveAndReEvaluateScript() {
       if (!window.smartGeneratedScript) {
           alert('개선할 스크립트가 없습니다.');
           return;
       }

       if (!this.lastEvaluation) {
           alert('먼저 스크립트 품질 평가가 완료되어야 합니다.');
           return;
       }

       const improveButton = document.querySelector('.improve-script-btn');
       if (improveButton) {
           improveButton.disabled = true;
           improveButton.innerHTML = '<span class="smart-loading"></span>Gemini 2.5로 개선 중...';
       }

       this.showImprovementLoading();

       try {
           console.log('Gemini 2.5 Flash 스크립트 개선 프로세스 시작');
           
           const improvedScript = await this.improveScriptBasedOnEvaluation(
               window.smartGeneratedScript, 
               this.lastEvaluation
           );
           
           document.getElementById('smartGeneratedScript').textContent = improvedScript;
           window.smartGeneratedScript = improvedScript;
           
           console.log('Gemini 2.5 Flash 개선된 스크립트로 재평가 시작');
           
           const newEvaluation = await this.evaluateScriptQuality(improvedScript);
           
           await this.displayScriptScoreWithComparison(improvedScript, this.lastEvaluation, newEvaluation);
           
           this.lastEvaluation = newEvaluation;
           
           console.log('Gemini 2.5 Flash 스크립트 개선 및 재평가 완료');
           
       } catch (error) {
           console.error('Gemini 2.5 Flash 스크립트 개선 실패:', error);
           alert('스크립트 개선 중 오류가 발생했습니다: ' + error.message);
           this.showImprovementError();
           
       } finally {
           if (improveButton) {
               improveButton.disabled = false;
               improveButton.innerHTML = '🤖 AI 검토 반영';
           }
       }
   }

   async improveScriptBasedOnEvaluation(originalScript, evaluation) {
       console.log('Gemini 2.5 Flash AI 검토 반영 시작...');
       
       const prompt = `당신은 최신 Gemini 2.5 Flash 모델입니다. 다음은 이미 생성된 Katalon Groovy 스크립트입니다. 
이 스크립트를 거의 그대로 유지하면서, 아래 지적된 문제점들을 Gemini 2.5의 향상된 분석 능력으로 정밀하게 분석하여 실제 개선이 필요한 부분만 최소한으로 수정해주세요.

=== 원본 스크립트 ===
${originalScript}

=== 검토된 문제점들 ===
${evaluation.issues ? evaluation.issues.map(issue => `• ${issue}`).join('\n') : '특별한 문제점 없음'}

=== 추가 분석 의견 ===
${evaluation.advanced_notes || '추가 의견 없음'}

Gemini 2.5 Flash의 최신 코드 최적화 기술을 활용하여 완전한 Groovy 스크립트만 반환하세요. 
설명이나 JSON 래핑 없이 순수 코드로만 응답해야 합니다.

목표: 현재 점수 ${evaluation.score}점에서 90점 이상으로 향상`;

       try {
           const result = await this.callGemini(prompt);
           
           let improvedScript = result;
           if (typeof result === 'string') {
               improvedScript = result
                   .replace(/^```groovy\s*/g, '')
                   .replace(/```\s*$/g, '')
                   .trim();
           }
           
           console.log('Gemini 2.5 Flash 스크립트 개선 완료');
           return improvedScript;
       } catch (error) {
           console.error('Gemini 2.5 Flash 스크립트 개선 실패:', error);
           throw error;
       }
   }

   parseTestcase(text) {
       const lines = text.split('\n').map(line => line.trim()).filter(line => line);
       const result = { summary: '', precondition: [], steps: [], expectedResult: '' };

       let currentSection = null;

       for (const line of lines) {
           if (line.toLowerCase().includes('summary')) {
               currentSection = 'summary';
               const colonIndex = line.indexOf(':');
               if (colonIndex !== -1) result.summary = line.substring(colonIndex + 1).trim();
           } else if (line.toLowerCase().includes('precondition')) {
               currentSection = 'precondition';
           } else if (line.toLowerCase().includes('steps')) {
               currentSection = 'steps';
           } else if (line.toLowerCase().includes('expected result')) {
               currentSection = 'expectedResult';
               const colonIndex = line.indexOf(':');
               if (colonIndex !== -1) result.expectedResult = line.substring(colonIndex + 1).trim();
           } else if (currentSection === 'precondition' && line) {
               result.precondition.push(line);
           } else if (currentSection === 'steps' && line) {
               result.steps.push(line);
           } else if (currentSection === 'expectedResult' && line) {
               if (result.expectedResult) result.expectedResult += ' ' + line;
               else result.expectedResult = line;
           }
       }

       return result;
   }

   async callGemini(prompt) {
       await new Promise(resolve => setTimeout(resolve, 800)); // 2.5-flash는 더 빠름

       const supabase = window.getSupabaseClient();

       if (!supabase) {
           throw new Error("Supabase client not initialized");
       }

       // 모델명을 2.5-flash로 고정
       const { data, error } = await supabase.functions.invoke('abcd', {
           body: {
               model: 'gemini-2.5-flash',
               contents: [{ parts: [{ text: prompt }] }]
           }
       });

       if (error) {
           console.error('Gemini 2.5 Flash Supabase function error:', error);
           throw new Error(`Function Error: ${error.message}`);
       }

       const resultText = data.candidates[0].content.parts[0].text;

       console.log('Gemini 2.5 Flash 원본 응답:', resultText);

       if (this.currentStep === 3 || this.currentStep === 4 || this.currentStep === 5) {
           return resultText;
       }

       try {
           return JSON.parse(resultText);
       } catch (e1) {
           try {
               const cleanedText = resultText.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
               return JSON.parse(cleanedText);
           } catch (e2) {
               try {
                   const jsonStart = resultText.indexOf('{');
                   const jsonEnd = resultText.lastIndexOf('}');
                   if (jsonStart !== -1 && jsonEnd !== -1) {
                       const jsonText = resultText.substring(jsonStart, jsonEnd + 1);
                       return JSON.parse(jsonText);
                   }
               } catch (e3) {
                   console.error('Gemini 2.5 Flash JSON 파싱 실패:', e3);
                   return this.getFallbackResponse();
               }
           }
       }
   }

   getFallbackResponse() {
       return {
           testPurpose: "Gemini 2.5 테스트 목적 파악 실패",
           testScope: "gemini25_fallback_test",
           environmentSetup: [
               {
                   action: "WebUI.navigateToUrl",
                   target: "GlobalVariable.BASE_URL",
                   purpose: "기본 페이지 접속",
                   required: true
               }
           ],
           preconditionAnalysis: [
               {
                   originalCondition: "Gemini 2.5 분석 실패",
                   actionType: "manual_check",
                   katalonAction: "WebUI.comment",
                   objectPath: "Manual verification required",
                   technicalNeed: "수동 확인 필요"
               }
           ]
       };
   }

   showProgress() {
       document.getElementById('smartProgress').style.display = 'block';
       document.getElementById('smartResult').style.display = 'none';
   }

   updateProgress(step, message) {
       this.currentStep = step;

       const stepMapping = {
           1: [1, 2],
           2: [3, 4],
           3: [5, 6],
           4: [7, 8],
           5: [9, 10]  // 신규 Step 5
       };

       const mappedSteps = stepMapping[step] || [];

       for (let i = 1; i <= 10; i++) {  // 8에서 10으로 확장
           const stepElement = document.getElementById(`step${i}`);
           if (stepElement) {
               if (mappedSteps.includes(i)) {
                   stepElement.className = 'step active';
               } else if (i < Math.min(...mappedSteps)) {
                   stepElement.className = 'step completed';
               } else {
                   stepElement.className = 'step';
               }
           }
       }

       const details = document.getElementById('progressDetails');
       if (details) {
           const timestamp = new Date().toLocaleTimeString();
           details.innerHTML += `[${timestamp}] ${message}\n`;
           details.scrollTop = details.scrollHeight;
       }
   }

   showResult(script) {
       document.getElementById('smartResult').style.display = 'block';
       document.getElementById('smartGeneratedScript').textContent = script;
       window.smartGeneratedScript = script;

       setTimeout(async () => {
           await this.displayScriptScoreLarge(script);
       }, 1000);
   }

   async displayScriptScoreLarge(script) {
       const scoreDisplay = document.getElementById('smartScriptScore');
       const circle = document.getElementById('scoreCircleLarge');
       const value = document.getElementById('scoreValueLarge');
       const details = document.getElementById('scoreDetailsLarge');
       const placeholder = document.getElementById('qualityPlaceholder');

       if (!scoreDisplay || !circle || !value || !details) return;

       scoreDisplay.style.display = 'flex';
       if (placeholder) placeholder.style.display = 'none';

       value.textContent = '...';
       circle.className = 'score-circle-large score-waiting';
       details.textContent = 'Gemini 2.5 Flash가 평가 중...\n잠시만 기다려주세요';

       try {
           const evaluation = await this.evaluateScriptQuality(script);

           let className;
           if (evaluation.score >= 90) {
               className = 'score-excellent';
           } else if (evaluation.score >= 80) {
               className = 'score-good';
           } else if (evaluation.score >= 70) {
               className = 'score-fair';
           } else {
               className = 'score-poor';
           }

           value.textContent = evaluation.score;
           circle.className = `score-circle-large ${className}`;

           let detailText = `등급: ${evaluation.grade} (Gemini 2.5 Flash 평가)`;

           if (evaluation.strengths && evaluation.strengths.length > 0) {
               detailText += `\n\n잘된 부분:\n• ${evaluation.strengths.join('\n• ')}`;
           }

           if (evaluation.issues && evaluation.issues.length > 0) {
               detailText += `\n\n개선사항:\n• ${evaluation.issues.join('\n• ')}`;
           }

           if (evaluation.recommendation) {
               detailText += `\n\n권장사항:\n${evaluation.recommendation}`;
           }

           if (evaluation.advanced_notes) {
               detailText += `\n\n고급 분석:\n${evaluation.advanced_notes}`;
           }

           details.textContent = detailText;

           console.log(`Gemini 2.5 Flash AI 평가 결과: ${evaluation.score}점 (${evaluation.grade})`);

       } catch (error) {
           console.error('Gemini 2.5 Flash 점수 표시 실패:', error);

           value.textContent = '?';
           circle.className = 'score-circle-large score-poor';
           details.textContent = 'Gemini 2.5 Flash 평가 실패\n네트워크를 확인하고\n다시 시도해주세요';
       }
   }

   async displayScriptScoreWithComparison(script, oldEvaluation, newEvaluation) {
       const scoreDisplay = document.getElementById('smartScriptScore');
       const circle = document.getElementById('scoreCircleLarge');
       const value = document.getElementById('scoreValueLarge');
       const details = document.getElementById('scoreDetailsLarge');
       const placeholder = document.getElementById('qualityPlaceholder');

       if (!scoreDisplay || !circle || !value || !details) return;

       scoreDisplay.style.display = 'flex';
       if (placeholder) placeholder.style.display = 'none';

       let className;
       if (newEvaluation.score >= 90) {
           className = 'score-excellent';
       } else if (newEvaluation.score >= 80) {
           className = 'score-good';
       } else if (newEvaluation.score >= 70) {
           className = 'score-fair';
       } else {
           className = 'score-poor';
       }

       value.textContent = newEvaluation.score;
       circle.className = `score-circle-large ${className}`;

       const scoreDiff = newEvaluation.score - oldEvaluation.score;
       const improvementText = scoreDiff > 0 ? 
           `+${scoreDiff}점 개선` : 
           scoreDiff < 0 ? 
               `${scoreDiff}점 하락` : 
               '점수 동일';

       let detailText = `등급: ${newEvaluation.grade} (${oldEvaluation.score}점 → ${newEvaluation.score}점)\n${improvementText} [Gemini 2.5 Flash]`;

       if (newEvaluation.strengths && newEvaluation.strengths.length > 0) {
           detailText += `\n\n잘된 부분:\n• ${newEvaluation.strengths.join('\n• ')}`;
       }

       if (newEvaluation.issues && newEvaluation.issues.length > 0) {
           detailText += `\n\n남은 개선사항:\n• ${newEvaluation.issues.join('\n• ')}`;
       }

       if (newEvaluation.recommendation) {
           detailText += `\n\n추가 권장사항:\n${newEvaluation.recommendation}`;
       }

       if (newEvaluation.advanced_notes) {
           detailText += `\n\n고급 분석:\n${newEvaluation.advanced_notes}`;
       }

       details.textContent = detailText;

       console.log(`Gemini 2.5 Flash 재평가 결과: ${oldEvaluation.score}점 → ${newEvaluation.score}점 (${improvementText})`);
   }

   showImprovementLoading() {
       const circle = document.getElementById('scoreCircleLarge');
       const value = document.getElementById('scoreValueLarge');
       const details = document.getElementById('scoreDetailsLarge');

       if (circle && value && details) {
           value.textContent = '...';
           circle.className = 'score-circle-large score-waiting';
           details.textContent = 'Gemini 2.5 Flash가 스크립트를\n개선하고 재평가하는 중입니다...\n잠시만 기다려주세요';
       }
   }

   showImprovementError() {
       const circle = document.getElementById('scoreCircleLarge');
       const value = document.getElementById('scoreValueLarge');
       const details = document.getElementById('scoreDetailsLarge');

       if (circle && value && details) {
           value.textContent = 'X';
           circle.className = 'score-circle-large score-poor';
           details.textContent = 'Gemini 2.5 Flash\n스크립트 개선 실패\n네트워크를 확인하고\n다시 시도해주세요';
       }
   }
}

// DOM 로드 완료 시 인스턴스 생성
document.addEventListener('DOMContentLoaded', function() {
    try {
        window.gemini25FlashEngine = new Gemini25FlashEngine();
        console.log('✅ Gemini 2.5 Flash Engine 인스턴스 생성 완료:', window.gemini25FlashEngine);
    } catch (error) {
        console.error('❌ Gemini 2.5 Flash Engine 생성 실패:', error);
    }
});

// 즉시 실행으로도 생성 시도
try {
    window.gemini25FlashEngine = new Gemini25FlashEngine();
    console.log('✅ Gemini 2.5 Flash Engine 즉시 생성 완료:', window.gemini25FlashEngine);
} catch (error) {
    console.error('❌ Gemini 2.5 Flash Engine 즉시 생성 실패:', error);
}

// 외부에서 사용할 수 있는 함수들
async function startSmartMappingGemini25() {
    const input = document.getElementById('smartTestcaseInput').value.trim();
    if (!input) {
        alert('테스트케이스를 입력해주세요.');
        return;
    }

    const button = document.querySelector('.smart-generate-btn');
    button.disabled = true;
    button.innerHTML = '<span class="smart-loading"></span>Gemini 2.5로 분석 중...';

    try {
        await window.gemini25FlashEngine.startAnalysis(input);
    } catch (error) {
        alert(`Gemini 2.5 Flash 분석 실패: ${error.message}`);
    } finally {
        button.disabled = false;
        button.innerHTML = '🧠 스마트 분석 시작';
    }
}

function copySmartScript() {
    if (window.smartGeneratedScript) {
        navigator.clipboard.writeText(window.smartGeneratedScript).then(() => {
            alert('Gemini 2.5 Flash 생성 스크립트가 클립보드에 복사되었습니다');
        });
    }
}

function downloadSmartScript() {
    if (window.smartGeneratedScript) {
        const blob = new Blob([window.smartGeneratedScript], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'gemini25_smart_katalon_script.groovy';
        a.click();
        URL.revokeObjectURL(url);
    }
}

function improveSmartScriptGemini25() {
    if (window.gemini25FlashEngine) {
        window.gemini25FlashEngine.improveAndReEvaluateScript();
    } else {
        alert('Gemini 2.5 Flash AI 엔진을 찾을 수 없습니다.');
    }
}

// 전역 함수 등록
window.startSmartMappingGemini25 = startSmartMappingGemini25;
window.improveSmartScriptGemini25 = improveSmartScriptGemini25;

console.log('🚀 AI 엔진 Gemini-2.5-flash 버전 로드 완료 (최신 모델 지원)');