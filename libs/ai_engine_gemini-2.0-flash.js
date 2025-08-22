/**
* Gemini-2.0-flash 전용 AI 엔진 (Gemma-3-27b-it 로직 기반)
* libs/ai_engine_gemini-2.0-flash.js
*/

class GeminiFlashEngine {
   constructor() {
       this.analysisResults = {};
       this.currentStep = 0;
       this.lastEvaluation = null;
       this.promptCache = {};
       this.cacheTimestamp = null;
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
                   step4: window.MASTER_PROMPTS.step4
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

           if (variables.parsedTC) {
               processedPrompt = processedPrompt.replace(/\$\{parsedTC\.summary\}/g, variables.parsedTC.summary || '');
               processedPrompt = processedPrompt.replace(/\$\{JSON\.stringify\(parsedTC\.precondition\)\}/g, JSON.stringify(variables.parsedTC.precondition || []));
               processedPrompt = processedPrompt.replace(/\$\{JSON\.stringify\(parsedTC\.steps\)\}/g, JSON.stringify(variables.parsedTC.steps || []));
               processedPrompt = processedPrompt.replace(/\$\{parsedTC\.expectedResult\}/g, variables.parsedTC.expectedResult || '');
           }

           if (variables.step1Result) {
               processedPrompt = processedPrompt.replace(/\$\{JSON\.stringify\(step1Result\.environmentSetup\)\}/g, JSON.stringify(variables.step1Result.environmentSetup || []));
               processedPrompt = processedPrompt.replace(/\$\{JSON\.stringify\(step1Result\.preconditionAnalysis\)\}/g, JSON.stringify(variables.step1Result.preconditionAnalysis || []));
               processedPrompt = processedPrompt.replace(/\$\{JSON\.stringify\(step1Result, null, 2\)\}/g, JSON.stringify(variables.step1Result, null, 2));
           }

           if (variables.step2Result) {
               processedPrompt = processedPrompt.replace(/\$\{JSON\.stringify\(step2Result, null, 2\)\}/g, JSON.stringify(variables.step2Result, null, 2));
           }

           if (variables.examples) {
               const examplesText = variables.examples.length > 0 ? 
                   variables.examples.map(e => `// 예제: ${e.description}\n${e.script}`).join('\n\n') : 
                   '// 참고할 예제 없음';
               processedPrompt = processedPrompt.replace(/\$\{examples\.length > 0 \? examples\.map\(e => \"\/\* 예제: \" \+ e\.description \+ \\n \\" \+ e\.script\ \)\.join\(\"\\\\n\\\\n\"\) : \"\/\* 참고할 예제 없음\"\}/g, examplesText);
           }

           if (variables.plan) {
               processedPrompt = processedPrompt.replace(/\$\{JSON\.stringify\(plan, null, 2\)\}/g, JSON.stringify(variables.plan, null, 2));
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
           this.updateProgress(0, '분석 시작...');

           const parsedTC = this.parseTestcase(testcaseText);

           const step1 = await this.analyzeSituationAndEnvironment(parsedTC);
           const step2 = await this.mapActionsAndValidation(parsedTC, step1);
           const step3 = await this.createScriptPlan(parsedTC, step1, step2);
           const step4 = await this.generateFinalScript(step3);

           this.showResult(step4);
           return step4;

       } catch (error) {
           console.error('스마트 분석 실패:', error);
           this.updateProgress(-1, `분석 실패: ${error.message}`);
           throw error;
       }
   }

   async analyzeSituationAndEnvironment(parsedTC) {
       this.updateProgress(1, '상황 파악 및 환경 설정 분석 중...');

       let prompt = await this.getPromptStep(1);
       
       prompt = this.processPromptTemplate(prompt, { parsedTC });

       const result = await this.callGemini(prompt);
       this.analysisResults.step1 = result;
       this.updateProgress(1, `상황 분석 완료: ${result.testPurpose || '분석 완료'}`);
       return result;
   }

   async mapActionsAndValidation(parsedTC, step1Result) {
       this.updateProgress(2, '액션 매핑 및 검증 로직 설계 중...');

       let prompt = await this.getPromptStep(2);
       
       prompt = this.processPromptTemplate(prompt, { parsedTC, step1Result });

       const result = await this.callGemini(prompt);
       this.analysisResults.step2 = result;
       this.updateProgress(2, `액션 매핑 완료: ${result.mainActions?.length || 0}개 액션, ${result.validationLogic?.length || 0}개 검증`);
       return result;
   }

   async createScriptPlan(parsedTC, step1Result, step2Result) {
       this.updateProgress(3, '스크립트 설계도 작성 중...');

       try {
           const examples = await this.loadExamplesFromSupabase();
           console.log(`Supabase에서 ${examples.length}개 예제 로딩 완료`);

           let prompt = await this.getPromptStep(3);

           prompt = this.processPromptTemplate(prompt, {
               parsedTC,
               step1Result,
               step2Result,
               examples
           });

           const result = await this.callGemini(prompt);
           this.analysisResults.step3 = result;
           this.updateProgress(3, '설계도 작성 완료!');
           return result;

       } catch (error) {
           console.error('설계도 작성 실패:', error);
           this.updateProgress(3, '설계도 작성 실패');
           return {
               scriptName: "기본_테스트",
               overallStructure: "try-finally",
               plan: [],
               finalization: { instruction: "WebUI.closeBrowser()", reason: "브라우저 종료" }
           };
       }
   }

   async generateFinalScript(plan) {
       this.updateProgress(4, '최종 스크립트 생성 중...');

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

           this.updateProgress(4, '최종 스크립트 생성 완료!');
           return cleanedResult;

       } catch (error) {
           console.error('스크립트 생성 실패:', error);
           this.updateProgress(4, '스크립트 생성 실패');
           return `try {
   // 기본 스크립트
   WebUI.navigateToUrl(GlobalVariable.BASE_URL)
   WebUI.waitForPageLoad(10)
   
} finally {
   WebUI.closeBrowser()
}`;
       }
   }

   async evaluateScriptQuality(script) {
       const prompt = `다음 Katalon Groovy 스크립트를 전문가 수준에서 100점 만점으로 평가해주세요.

=== 평가 대상 스크립트 ===
${script}

=== 평가 기준 ===
1. 코드 품질 (30점)
2. 실행 가능성 (25점)
3. 효율성 (20점)
4. 가독성 (15점)
5. 표준 준수 (10점)

다음 JSON 형식으로만 반환하세요:
{
 "score": 85,
 "grade": "양호",
 "issues": ["구체적인 문제점1", "구체적인 문제점2"],
 "strengths": ["잘된 부분1", "잘된 부분2"],
 "recommendation": "개선 권장사항"
}`;

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
           console.error('AI 평가 실패:', error);

           const errorEvaluation = {
               score: 70,
               grade: "평가불가",
               issues: ["AI 평가 시스템 오류"],
               strengths: ["코드 생성 완료"],
               recommendation: "네트워크 연결 확인 후 재시도"
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
           improveButton.innerHTML = '<span class="smart-loading"></span>개선 중...';
       }

       this.showImprovementLoading();

       try {
           console.log('스크립트 개선 프로세스 시작');
           
           const improvedScript = await this.improveScriptBasedOnEvaluation(
               window.smartGeneratedScript, 
               this.lastEvaluation
           );
           
           document.getElementById('smartGeneratedScript').textContent = improvedScript;
           window.smartGeneratedScript = improvedScript;
           
           console.log('개선된 스크립트로 재평가 시작');
           
           const newEvaluation = await this.evaluateScriptQuality(improvedScript);
           
           await this.displayScriptScoreWithComparison(improvedScript, this.lastEvaluation, newEvaluation);
           
           this.lastEvaluation = newEvaluation;
           
           console.log('스크립트 개선 및 재평가 완료');
           
       } catch (error) {
           console.error('스크립트 개선 실패:', error);
           alert('스크립트 개선 중 오류가 발생했습니다: ' + error.message);
           this.showImprovementError();
           
       } finally {
           if (improveButton) {
               improveButton.disabled = false;
               improveButton.innerHTML = 'AI 검토 반영';
           }
       }
   }

   async improveScriptBasedOnEvaluation(originalScript, evaluation) {
       console.log('AI 검토 반영 시작...');
       
       const prompt = `다음은 이미 생성된 Katalon Groovy 스크립트입니다. 이 스크립트를 거의 그대로 유지하면서, 아래 지적된 문제점들을 분석하여 실제 개선이 필요한 부분만 최소한으로 수정해주세요.

=== 원본 스크립트 ===
${originalScript}

=== 검토된 문제점들 ===
${evaluation.issues ? evaluation.issues.map(issue => `• ${issue}`).join('\n') : '특별한 문제점 없음'}

완전한 Groovy 스크립트만 반환하세요. 설명이나 JSON 래핑 없이 순수 코드로만 응답해야 합니다.

현재 점수 ${evaluation.score}점에서 85점 이상이 목표입니다.`;

       try {
           const result = await this.callGemini(prompt);
           
           let improvedScript = result;
           if (typeof result === 'string') {
               improvedScript = result
                   .replace(/^```groovy\s*/g, '')
                   .replace(/```\s*$/g, '')
                   .trim();
           }
           
           console.log('스크립트 개선 완료');
           return improvedScript;
       } catch (error) {
           console.error('스크립트 개선 실패:', error);
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
       await new Promise(resolve => setTimeout(resolve, 1000));

       const selectedModel = document.getElementById('aiModelSelect').value;
       const supabase = window.getSupabaseClient();

       if (!supabase) {
           throw new Error("Supabase client not initialized");
       }

       const { data, error } = await supabase.functions.invoke('abcd', {
           body: {
               model: selectedModel,
               contents: [{ parts: [{ text: prompt }] }]
           }
       });

       if (error) {
           console.error('Supabase function error:', error);
           throw new Error(`Function Error: ${error.message}`);
       }

       const resultText = data.candidates[0].content.parts[0].text;

       console.log('Gemini 원본 응답:', resultText);

       if (this.currentStep === 3 || this.currentStep === 4) {
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
   }

   getFallbackResponse() {
       return {
           testPurpose: "테스트 목적 파악 실패",
           testScope: "fallback_test",
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
                   originalCondition: "분석 실패",
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
           4: [7, 8]
       };

       const mappedSteps = stepMapping[step] || [];

       for (let i = 1; i <= 8; i++) {
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

           let detailText = `등급: ${evaluation.grade}`;

           if (evaluation.strengths && evaluation.strengths.length > 0) {
               detailText += `\n\n잘된 부분:\n• ${evaluation.strengths.join('\n• ')}`;
           }

           if (evaluation.issues && evaluation.issues.length > 0) {
               detailText += `\n\n개선사항:\n• ${evaluation.issues.join('\n• ')}`;
           }

           if (evaluation.recommendation) {
               detailText += `\n\n권장사항:\n${evaluation.recommendation}`;
           }

           details.textContent = detailText;

           console.log(`AI 평가 결과: ${evaluation.score}점 (${evaluation.grade})`);

       } catch (error) {
           console.error('점수 표시 실패:', error);

           value.textContent = '?';
           circle.className = 'score-circle-large score-poor';
           details.textContent = '평가 실패\n네트워크를 확인하고\n다시 시도해주세요';
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
        window.geminiFlashEngine = new GeminiFlashEngine();
        console.log('geminiFlashEngine 인스턴스 생성 완료:', window.geminiFlashEngine);
    } catch (error) {
        console.error('geminiFlashEngine 생성 실패:', error);
    }
});

try {
    window.geminiFlashEngine = new GeminiFlashEngine();
    console.log('geminiFlashEngine 즉시 생성 완료:', window.geminiFlashEngine);
} catch (error) {
    console.error('geminiFlashEngine 즉시 생성 실패:', error);
}

async function startSmartMappingGemini() {
    const input = document.getElementById('smartTestcaseInput').value.trim();
    if (!input) {
        alert('테스트케이스를 입력해주세요.');
        return;
    }

    const button = document.querySelector('.smart-generate-btn');
    button.disabled = true;
    button.innerHTML = '<span class="smart-loading"></span>분석 중...';

    try {
        await window.geminiFlashEngine.startAnalysis(input);
    } catch (error) {
        alert('분석 실패: ' + error.message);
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

function improveSmartScriptGemini() {
    if (window.geminiFlashEngine) {
        window.geminiFlashEngine.improveAndReEvaluateScript();
    } else {
        alert('AI 엔진을 찾을 수 없습니다.');
    }
}

console.log('AI 엔진 gemini-2.0-flash 버전 로드 완료 (Gemma 로직 기반)');
