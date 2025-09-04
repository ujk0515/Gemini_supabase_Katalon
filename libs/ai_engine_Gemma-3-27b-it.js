/**
* Gemma-3-27b-it 전용 AI 엔진 (4단계 구조)
* libs/ai_engine_Gemma-3-27b-it.js
*/

class GemmaEngine {
   constructor() {
       this.analysisResults = {};
       this.currentStep = 0;
       this.lastEvaluation = null;
       this.promptCache = {};
       this.cacheTimestamp = null;
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
               console.log('프롬프트 캐시 갱신 완료');
           } else {
               throw new Error('MASTER_PROMPTS가 로드되지 않았습니다.');
           }
       } catch (error) {
           console.error('프롬프트 로딩 실패:', error);
           throw new Error('프롬프트 파일을 읽을 수 없습니다.');
       }
   }

   async getPromptStep(stepNumber) {
       const now = Date.now();
       if (!this.cacheTimestamp || (now - this.cacheTimestamp) > 30000) {
           await this.refreshPromptCache();
       }
       
       return this.promptCache[`step${stepNumber}`] || '';
   }

   async loadExamplesFromSupabase() {
       try {
           let client = window.testClient;
           
           if (!client && window.getSupabaseClient) {
               client = window.getSupabaseClient();
           }
           
           if (!client) {
               console.warn('Supabase 클라이언트가 없습니다. 예제 없이 진행합니다.');
               return [];
           }

           const { data, error } = await client
               .from('katalon_good_examples')
               .select('*')
               .order('created_at', { ascending: false });

           if (error) {
               console.error('Supabase 예제 로딩 실패:', error);
               return [];
           }

           return data || [];
       } catch (error) {
           console.error('예제 로딩 중 오류:', error);
           return [];
       }
   }

   processPromptTemplate(prompt, variables) {
       try {
           let processedPrompt = prompt;

           // {{}} 방식 템플릿 처리 (더 안전함)
           if (variables.parsedTC) {
               processedPrompt = processedPrompt.replace(/{{parsedTC.summary}}/g, variables.parsedTC.summary || '');
               processedPrompt = processedPrompt.replace(/{{parsedTC.precondition}}/g, JSON.stringify(variables.parsedTC.precondition || [], null, 2));
               processedPrompt = processedPrompt.replace(/{{parsedTC.steps}}/g, JSON.stringify(variables.parsedTC.steps || [], null, 2));
               processedPrompt = processedPrompt.replace(/{{parsedTC.expectedResult}}/g, variables.parsedTC.expectedResult || '');
           }

           if (variables.step1Result) {
               processedPrompt = processedPrompt.replace(/{{step1Result.environmentSetup}}/g, JSON.stringify(variables.step1Result.environmentSetup || [], null, 2));
               processedPrompt = processedPrompt.replace(/{{step1Result.preconditionAnalysis}}/g, JSON.stringify(variables.step1Result.preconditionAnalysis || [], null, 2));
               processedPrompt = processedPrompt.replace(/{{step1Result}}/g, JSON.stringify(variables.step1Result, null, 2));
           }

           if (variables.step2Result) {
               processedPrompt = processedPrompt.replace(/{{step2Result}}/g, JSON.stringify(variables.step2Result, null, 2));
           }

           if (variables.examples) {
               const examplesText = variables.examples.length > 0 ? 
                   variables.examples.map(e => `// 예제: ${e.description}\n${e.script}`).join('\n\n') : 
                   '// 참고할 예제 없음';
               processedPrompt = processedPrompt.replace(/{{examples}}/g, examplesText);
           }

           if (variables.plan) {
               processedPrompt = processedPrompt.replace(/{{plan}}/g, JSON.stringify(variables.plan, null, 2));
           }

           if (variables.firstCode) {
               processedPrompt = processedPrompt.replace(/{{firstCode}}/g, variables.firstCode);
           }

           return processedPrompt;
       } catch (error) {
           console.error('프롬프트 템플릿 처리 실패:', error);
           return prompt;
       }
   }

   async startAnalysis(testcaseText) {
       try {
           this.showProgress();
           this.updateProgress(0, '5단계 스마트 분석 시작...');

           const parsedTC = this.parseTestCaseFromText(testcaseText);

           // Step 1-5: 기본 스크립트 생성 후 예시 비교 개선
           const step1 = await this.analyzeSituationAndEnvironment(parsedTC);
           const step2 = await this.mapActionsAndValidation(parsedTC, step1);
           const step3 = await this.createScriptPlan(parsedTC, step1, step2);
           const step4 = await this.generateFirstScript(step3);
           const step5 = await this.generateFinalScript(step4, step3.examples);

           this.showResult(step5);
           return step5;

       } catch (error) {
           console.error('5단계 스마트 분석 실패:', error);
           this.updateProgress(-1, `분석 실패: ${error.message}`);
           throw error;
       }
   }

   async analyzeSituationAndEnvironment(parsedTC) {
       this.updateProgress(1, '상황 파악 및 환경 설정 분석 중...');

       let prompt = await this.getPromptStep(1);
       
       // 템플릿 변수 처리
       prompt = this.processPromptTemplate(prompt, { parsedTC });

       const result = await this.callGemini(prompt);
       this.analysisResults.step1 = result;
       this.updateProgress(1, `상황 분석 완료: ${result.testPurpose || '분석 완료'}`);
       return result;
   }

   async mapActionsAndValidation(parsedTC, step1Result) {
       this.updateProgress(2, '액션 매핑 및 검증 로직 설계 중...');

       let prompt = await this.getPromptStep(2);
       
       // 템플릿 변수 처리
       prompt = this.processPromptTemplate(prompt, { parsedTC, step1Result });

       const result = await this.callGemini(prompt);
       this.analysisResults.step2 = result;
       this.updateProgress(2, `액션 매핑 완료: ${result.mainActions?.length || 0}개 액션, ${result.validationLogic?.length || 0}개 검증`);
       return result;
   }

   async createScriptPlan(parsedTC, step1Result, step2Result) {
       this.updateProgress(3, '설계도 작성 및 예제 로딩 중...');

       try {
           // Supabase에서 예제 로딩 후 랜덤 3개 선택
           const allExamples = await this.loadExamplesFromSupabase();
           const shuffled = allExamples.sort(() => 0.5 - Math.random());
           const examples = shuffled.slice(0, 3).map(example => ({
               description: example.description || '예제',
               script: example.script ? example.script.substring(0, 500) + '...' : ''
           }));
           console.log(`총 예제 개수: ${allExamples.length}, 랜덤 선택된 예제: ${examples.length}`);

           let prompt = await this.getPromptStep(3);

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
               console.warn('step3 JSON 파싱 실패, 기본값 사용:', error);
               result = {
                   scriptName: "기본_테스트",
                   overallStructure: "try-finally",
                   plan: [],
                   finalization: { instruction: "WebUI.closeBrowser()", reason: "브라우저 종료" }
               };
           }
           
           // 예제를 result에 추가하여 step5에서 사용
           result.examples = examples;
           this.updateProgress(3, '1차 설계도 작성 완료!');
           return result;

       } catch (error) {
           console.error('설계도 작성 실패:', error);
           this.updateProgress(3, '설계도 작성 실패');
           // 기본 plan 반환
           return {
               scriptName: "기본_테스트",
               overallStructure: "try-finally",
               plan: [],
               finalization: { instruction: "WebUI.closeBrowser()", reason: "브라우저 종료" }
           };
       }
   }

   async generateFirstScript(plan) {
       this.updateProgress(4, '1차 스크립트 생성 중...');

       try {
           let prompt = await this.getPromptStep(4);

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

           this.updateProgress(4, '1차 스크립트 생성 완료!');
           return cleanedResult;

       } catch (error) {
           console.error('1차 스크립트 생성 실패:', error);
           this.updateProgress(4, '1차 스크립트 생성 실패');
           // 기본 스크립트 반환
           return `try {\n   // 기본 스크립트\n   WebUI.navigateToUrl(GlobalVariable.BASE_URL)\n   WebUI.waitForPageLoad(10)\n   \n} finally {\n   WebUI.closeBrowser()\n}`;
       }
   }

   async generateFinalScript(firstCode, examples) {
       this.updateProgress(5, '예시 비교 및 최종 스크립트 개선 중...');

       try {
           let prompt = await this.getPromptStep(5);

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

           this.updateProgress(5, '최종 스크립트 완성!');
           return cleanedResult;

       } catch (error) {
           console.error('최종 스크립트 생성 실패:', error);
           this.updateProgress(5, '최종 스크립트 생성 실패 - 1차 스크립트 반환');
           return firstCode;
       }
   }


   async evaluateScriptQuality(script) {
       const prompt = `다음 Katalon Groovy 스크립트를 전문가 수준에서 100점 만점으로 평가해주세요.\n\n=== 평가 대상 스크립트 ===\n${script}\n\n=== 평가 기준 ===\n1. 코드 품질 (30점)\n2. 실행 가능성 (25점)\n3. 효율성 (20점)\n4. 가독성 (15점)\n5. 표준 준수 (10점)\n\n다음 JSON 형식으로만 반환하세요:\n{\n \"score\": 85,\n \"grade\": \"양호\",\n \"issues\": [\"구체적인 문제점1\", \"구체적인 문제점2\"],\n \"strengths\": [\"잘된 부분1\", \"잘된 부분2\"],\n \"recommendation\": \"개선 권장사항\"\n}`;

       try {
           console.log('AI 스크립트 품질 평가 시작...');

           const result = await this.callGemini(prompt);
           console.log('AI 평가 완료:', result);

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
                   console.warn('AI 평가 JSON 파싱 실패:', parseError);
               }
           } else if (typeof result === 'object') {
               this.lastEvaluation = result;
               return result;
           }

           const fallbackEvaluation = {
               score: 75,
               grade: "보통",
               issues: ["AI 평가 파싱 실패"],
               strengths: ["기본 구조 양호"],
               recommendation: "수동 검토 필요"
           };
           this.lastEvaluation = fallbackEvaluation;
          return fallbackEvaluation;
      } catch (error) {
          console.error('AI 평가 오류:', error);
          const fallbackEvaluation = {
              score: 60,
              grade: "불확실",
              issues: ["AI 평가 시스템 오류"],
              strengths: [],
              recommendation: "수동 점검 필요"
          };
          this.lastEvaluation = fallbackEvaluation;
          return fallbackEvaluation;
      }
  }

  async callGemini(prompt) {
       // Small delay to avoid rapid-fire calls
       await new Promise(resolve => setTimeout(resolve, 1000));

       const MAX_PROMPT_CHARS = 8000; // heuristic limit to avoid token issues

       const shrinkPrompt = (p) => {
           let s = p;
           // remove long code blocks and excessive whitespace
           s = s.replace(/```[\s\S]*?```/g, '');
           // remove very long JSON blocks by collapsing inner content
           s = s.replace(/\{[\s\S]{1000,}\}/g, '{...}');
           // remove multiple consecutive newlines/spaces
           s = s.replace(/\s{2,}/g, ' ');
           // trim
           s = s.trim();
           if (s.length > MAX_PROMPT_CHARS) s = s.substring(0, MAX_PROMPT_CHARS - 200);
           return s;
       };

       const modelEl = document.getElementById && document.getElementById('aiModelSelect');
       const selectedModel = modelEl && modelEl.value ? modelEl.value : 'gemma-3-27b-it';
       const supabase = (window.getSupabaseClient && window.getSupabaseClient()) || window.testClient || null;

       if (!supabase) {
           throw new Error("Supabase client not initialized");
       }

       // If prompt is very long, prepare a shrunk version and try that on failure
       let attemptPrompt = prompt;
       let usedShrunk = false;
       if (attemptPrompt.length > MAX_PROMPT_CHARS) {
           attemptPrompt = shrinkPrompt(attemptPrompt);
           usedShrunk = true;
           console.warn('Prompt length exceeded heuristic limit — sending shrunk prompt');
       }

       const invokeOnce = async (p) => {
           const { data, error } = await supabase.functions.invoke('abcd', {
               body: {
                   model: selectedModel,
                   contents: [{ parts: [{ text: p }] }]
               }
           });

           if (error) {
               console.error('Supabase function error:', error);
               throw new Error(`Function Error: ${error.message}`);
           }

           if (!data || !data.candidates || !data.candidates[0]) {
               throw new Error('잘못된 함수 응답 형식');
           }

           return data.candidates[0].content.parts[0].text;
       };

       try {
           const resultText = await invokeOnce(attemptPrompt);
           console.log('Gemini 원본 응답:', resultText);

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
                       console.error('JSON 파싱 실패:', e3);
                       return this.getFallbackResponse();
                   }
               }
           }

       } catch (err) {
           console.warn('첫 요청 실패:', err.message);
           // If we haven't tried shrinking the original prompt, do so and retry once
           if (!usedShrunk) {
               const short = shrinkPrompt(prompt);
               try {
                   const retryText = await invokeOnce(short);
                   if (this.currentStep === 3 || this.currentStep === 4 || this.currentStep === 5) return retryText;
                   try { return JSON.parse(retryText); } catch { return retryText; }
               } catch (err2) {
                   console.error('재시도 실패:', err2);
                   return this.getFallbackResponse();
               }
           }

           return this.getFallbackResponse();
       }
   }

  parseTestCaseFromText(text) {
      const result = {
          summary: '',
          precondition: [],
          steps: [],
          expectedResult: ''
      };

      const lines = text.split('\n');
      let currentSection = '';

      for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;

          if (trimmedLine.toLowerCase().includes('summary')) {
              currentSection = 'summary';
              const colonIndex = trimmedLine.indexOf(':');
              if (colonIndex !== -1) result.summary = trimmedLine.substring(colonIndex + 1).trim();
          } else if (trimmedLine.toLowerCase().includes('precondition')) {
              currentSection = 'precondition';
          } else if (trimmedLine.toLowerCase().includes('steps')) {
              currentSection = 'steps';
          } else if (trimmedLine.toLowerCase().includes('expected result')) {
              currentSection = 'expectedResult';
              const colonIndex = trimmedLine.indexOf(':');
              if (colonIndex !== -1) result.expectedResult = trimmedLine.substring(colonIndex + 1).trim();
          } else if (currentSection === 'precondition' && trimmedLine) {
              result.precondition.push(trimmedLine);
          } else if (currentSection === 'steps' && trimmedLine) {
              result.steps.push(trimmedLine);
          } else if (currentSection === 'expectedResult' && trimmedLine) {
              if (result.expectedResult) result.expectedResult += ' ' + trimmedLine;
              else result.expectedResult = trimmedLine;
          }
      }

      return result;
   }

   showProgress() {
       document.getElementById('smartProgress').style.display = 'block';
       document.getElementById('smartResult').style.display = 'none';
   }

   updateProgress(step, message) {
       this.currentStep = step;

       // 5단계 진행바에 맞게 수정
       for (let i = 1; i <= 5; i++) {
           const stepElement = document.getElementById(`step${i}`);
           if (stepElement) {
               if (i === step) {
                   stepElement.className = 'step active';
               } else if (i < step) {
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
       details.textContent = 'AI가 평가 중...\n잠시만 기다려주세요';

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
           details.innerHTML = `\n               <div class="score-grade">${evaluation.grade}</div>\n               <div class="score-breakdown">
                   <strong>장점:</strong> ${evaluation.strengths.join(', ')}<br>
                   <strong>문제:</strong> ${evaluation.issues.join(', ')}<br>
                   <strong>개선:</strong> ${evaluation.recommendation}\n               </div>\n           `;

           this.lastEvaluation = evaluation;
       } catch (error) {
           console.error('스크립트 평가 실패:', error);
           value.textContent = '?';
           circle.className = 'score-circle-large score-waiting';
           details.textContent = '평가 실패\n다시 시도해 주세요';
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

       let detailText = `등급: ${newEvaluation.grade} (${oldEvaluation.score}점 → ${newEvaluation.score}점)\n${improvementText}`;

       if (newEvaluation.strengths && newEvaluation.strengths.length > 0) {
           detailText += `\n\n잘된 부분:\n• ${newEvaluation.strengths.join('\n• ')}`;
       }

       if (newEvaluation.issues && newEvaluation.issues.length > 0) {
           detailText += `\n\n남은 개선사항:\n• ${newEvaluation.issues.join('\n• ')}`;
       }

       if (newEvaluation.recommendation) {
           detailText += `\n\n추가 권장사항:\n${newEvaluation.recommendation}`;
       }

       details.textContent = detailText;

       console.log(`재평가 결과: ${oldEvaluation.score}점 → ${newEvaluation.score}점 (${improvementText})`);
   }

   showImprovementLoading() {
       const circle = document.getElementById('scoreCircleLarge');
       const value = document.getElementById('scoreValueLarge');
       const details = document.getElementById('scoreDetailsLarge');

       if (circle && value && details) {
           value.textContent = '...';
           circle.className = 'score-circle-large score-waiting';
           details.textContent = 'AI가 스크립트를 개선하고\n재평가하는 중입니다...\n잠시만 기다려주세요';
       }
   }

   showImprovementError() {
       const circle = document.getElementById('scoreCircleLarge');
       const value = document.getElementById('scoreValueLarge');
       const details = document.getElementById('scoreDetailsLarge');

       if (circle && value && details) {
           value.textContent = 'X';
           circle.className = 'score-circle-large score-poor';
           details.textContent = '스크립트 개선 실패\n네트워크를 확인하고\n다시 시도해주세요';
       }
   }
}

document.addEventListener('DOMContentLoaded', function() {
   try {
       window.gemmaEngine = new GemmaEngine();
       console.log('gemmaEngine 인스턴스 생성 완료:', window.gemmaEngine);
   } catch (error) {
       console.error('gemmaEngine 생성 실패:', error);
   }
});

try {
   window.gemmaEngine = new GemmaEngine();
   console.log('gemmaEngine 즉시 생성 완료:', window.gemmaEngine);
} catch (error) {
   console.error('gemmaEngine 즉시 생성 실패:', error);
}

async function startSmartMappingGemma() {
   const input = document.getElementById('smartTestcaseInput').value.trim();
   if (!input) {
       alert('테스트케이스를 입력해주세요.');
       return;
   }

   const button = document.querySelector('.smart-generate-btn');
   button.disabled = true;
   button.innerHTML = '<span class="smart-loading"></span>분석 중...';

   try {
       await window.gemmaEngine.startAnalysis(input);
   } catch (error) {
       alert(`분석 실패: ${error.message}`);
   } finally {
       button.disabled = false;
       button.innerHTML = '스마트 분석 시작';
   }
}

function copySmartScript() {
   if (window.smartGeneratedScript) {
       navigator.clipboard.writeText(window.smartGeneratedScript).then(() => {
           alert('스크립트가 클립보드에 복사되었습니다');
       });
   }
}

function downloadSmartScript() {
   if (window.smartGeneratedScript) {
       const blob = new Blob([window.smartGeneratedScript], { type: 'text/plain' });
       const url = URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = 'smart_katalon_script.groovy';
       a.click();
       URL.revokeObjectURL(url);
   }
}

function improveSmartScript() {
   if (window.gemmaEngine) {
       window.gemmaEngine.improveAndReEvaluateScript();
   } else {
       alert('AI 엔진을 찾을 수 없습니다.');
   }
}

console.log('AI 엔진 Gemma-3-27b-it 버전 로드 완료 (4단계 구조)');