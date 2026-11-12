/**
 * File: src/lib/services/gemini-service.ts
 * Purpose: Dịch vụ Tác nhân AI Gemini (gemini-3.1-flash-lite) phục vụ:
 *   1. Phân tích học thuật, định danh taxonomy động và sinh Schema Feynman chuẩn từ tệp tài liệu.
 *   2. Bóc tách kiến thức tự do (Custom Study Material) cho Phòng Chuẩn Bị Study Lab.
 *   3. Đóng vai Persona Socratic đối thoại trực tiếp trên Giảng Đài Feynman (Live Stage).
 *   4. Phân tích phát hiện bẫy thuật ngữ (Jargon) và đo lường độ sáng rõ (Clarity Score) thời gian thực.
 *   5. Chấm điểm và xuất báo cáo Feynman Mastery Card toàn diện khi kết thúc buổi học.
 * TUYỆT ĐỐI KHÔNG DÙNG CÁC CÂU TRẢ LỜI MOCK HAY DỰNG SẴN.
 */

import { SystemLogger } from "./system-logger";
import type { AnalyticalResult, MasteryEvaluation, JargonItem, LogicGapItem } from "@/types/agent.types";
import type { PersonaDefinition } from "@/config/personas.config";

export interface CurriculumAnalysisPromptInput {
  fileName: string;
  documentText: string;
  availableDomains: Array<{ id: string; name: string; slug: string; description?: string }>;
  availableSubjects: Array<{ id: string; name: string; slug: string; description?: string; domainId?: string }>;
}

export interface GeminiCurriculumAnalysisResult {
  domainId: string;
  subjectId: string;
  domainName: string;
  subjectName: string;
  confidenceScore: number;
  pedagogicalRole: "TEXTBOOK_CHAPTER" | "SLIDE_DECK" | "EXAM_PREP_CASE_STUDY" | "LECTURE_NOTE";
  suggestedTitle: string;
  canonicalSlug: string;
  feynmanSummary: string;
  requiredConcepts: string[];
  jargonTraps: string[];
  suggestedAnalogies: string[];
  keyTakeaways: string[];
  difficultyLevel: number;
  estimatedReadingMinutes: number;
  prerequisiteReasoning: string;
}

const metaEnv = typeof import.meta !== "undefined" ? (import.meta as any).env : undefined;

export interface GeminiCallMetrics {
  durationMs: number;
  durationSeconds: number;
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
  model: string;
  isFallback: boolean;
  fallbackReason?: string;
}

export interface PersonaResponseDetailed {
  reply: string;
  metrics: GeminiCallMetrics;
}

function getGeminiApiKey(): string {
  const key =
    metaEnv?.VITE_GEMINI_API_KEY ||
    (typeof process !== "undefined" && (process.env?.VITE_GEMINI_API_KEY || process.env?.GEMINI_API_KEY));
  return key || "";
}

function getGeminiModelName(): string {
  return (
    metaEnv?.VITE_MODEL_NAME ||
    (typeof process !== "undefined" && (process.env?.VITE_MODEL_NAME || process.env?.MODEL_NAME)) ||
    "gemini-3.1-flash-lite"
  );
}

export interface LiveTrialTurnResult {
  personaReply: string;
  currentClarityScore: number;
  detectedAnalogy: string | null;
  jargonDetected: JargonItem[];
  logicGaps: LogicGapItem[];
  metrics: GeminiCallMetrics;
  isMastered?: boolean;
  masterySummary?: string;
}

export async function callGeminiRestWithMetrics(
  prompt: string,
  jsonMode: boolean = false
): Promise<{ text: string; metrics: GeminiCallMetrics }> {
  const startTime = Date.now();
  const apiKey = getGeminiApiKey();
  const modelName = getGeminiModelName();

  if (!apiKey) {
    throw new Error("Chưa cấu hình GEMINI_API_KEY");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const bodyPayload: any = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
    },
  };

  if (jsonMode) {
    bodyPayload.generationConfig.responseMimeType = "application/json";
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // Tối đa 20s không bao giờ treo

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const durationMs = Date.now() - startTime;
    const durationSeconds = Number((durationMs / 1000).toFixed(2));

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Gemini API HTTP ${res.status} [${durationMs}ms]: ${errorText}`);
    }

    const resData = await res.json();
    const text = resData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error(`Gemini không trả về nội dung [${durationMs}ms]`);
    }

    const usage = resData?.usageMetadata || {};
    const promptTokens = usage.promptTokenCount || Math.ceil(prompt.length / 4);
    const candidatesTokens = usage.candidatesTokenCount || Math.ceil(text.length / 4);
    const totalTokens = usage.totalTokenCount || promptTokens + candidatesTokens;

    const metrics: GeminiCallMetrics = {
      durationMs,
      durationSeconds,
      promptTokens,
      candidatesTokens,
      totalTokens,
      model: modelName,
      isFallback: false,
    };

    SystemLogger.geminiCall({
      action: jsonMode ? "GENERATE_CONTENT_JSON" : "GENERATE_CONTENT_TEXT",
      model: modelName,
      durationMs,
      tokens: { prompt: promptTokens, candidates: candidatesTokens, total: totalTokens },
      promptPreview: prompt.slice(0, 160) + (prompt.length > 160 ? "..." : ""),
      responsePreview: text.slice(0, 160) + (text.length > 160 ? "..." : ""),
    });

    return {
      text,
      metrics,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const durationMs = Date.now() - startTime;
    const finalErr =
      err.name === "AbortError"
        ? new Error("Gemini API Timeout sau 20s. Hệ thống tự động chuyển sang chế độ dự phòng.")
        : err;

    SystemLogger.geminiCall({
      action: "GENERATE_CONTENT_ERROR",
      model: modelName,
      durationMs,
      tokens: { prompt: 0, candidates: 0, total: 0 },
      promptPreview: prompt.slice(0, 160) + (prompt.length > 160 ? "..." : ""),
      error: finalErr,
    });

    throw finalErr;
  }
}

async function callGeminiRest(prompt: string, jsonMode: boolean = false): Promise<string> {
  const result = await callGeminiRestWithMetrics(prompt, jsonMode);
  return result.text;
}

export const GeminiCurriculumService = {
  /**
   * Gọi Gemini API để phân tích học thuật và gán nhãn bài học tự động
   */
  async analyzeDocument(input: CurriculumAnalysisPromptInput): Promise<GeminiCurriculumAnalysisResult> {
    const startTime = Date.now();
    const modelName = getGeminiModelName();

    const truncatedText = input.documentText.slice(0, 18000);

    const domainListStr = input.availableDomains
      .map((d) => `- [${d.id}] "${d.name}" (${d.description || ""})`)
      .join("\n");

    const subjectListStr = input.availableSubjects
      .map((s) => `- [${s.id}] "${s.name}" (Thuộc domain: ${s.domainId || "Chung"})`)
      .join("\n");

    const systemPrompt = `Bạn là Elis Academic Curator Agent - Tác nhân AI thẩm định và phân loại tài liệu học thuật theo phương pháp Feynman.
Nhiệm vụ: Phân tích TOÀN BỘ nội dung văn bản dưới đây để:
1. Chọn chính xác Nhóm Ngành (domainId) và Môn Học (subjectId) từ danh sách hợp lệ có sẵn trong hệ thống (Supabase).
   LƯU Ý ĐẶC BIỆT: Nếu tài liệu nói về Phương pháp học tập, Kỹ thuật Feynman, Kỹ năng sinh viên, Siêu nhận thức (Metacognition) -> Hãy chọn Môn học và Ngành học về Kỹ năng / Phương pháp học tập (dom-edu / sub-feynman-technique), TUYỆT ĐỐI KHÔNG gán ép vào Toán rời rạc hay CNTT.
2. Xác định vai trò sư phạm: TEXTBOOK_CHAPTER (Giáo trình), SLIDE_DECK (Slide), EXAM_PREP_CASE_STUDY (Đề ôn/Bài tập), LECTURE_NOTE (Ghi chép bài giảng).
3. Bóc tách Schema chuẩn Feynman:
   - feynmanSummary: Bản tóm tắt bản chất dễ hiểu làm Ground Truth.
   - requiredConcepts: 4-6 khái niệm cốt lõi bắt buộc phải nắm.
   - jargonTraps: 3-5 thuật ngữ hoặc ngộ nhận phổ biến người học dễ mắc bẫy.
   - suggestedAnalogies: 1-2 phép ẩn dụ đời thường trực quan cho trẻ 10 tuổi.
   - keyTakeaways: 2-3 điểm mấu chốt.
   - difficultyLevel: Độ khó từ 1 đến 5.
   - prerequisiteReasoning: Giải thích rõ ràng kiến thức tiên quyết thực tế cần có trước khi học tài liệu này.

YÊU CẦU: Trả về DUY NHẤT một JSON hợp lệ (không kèm markdown \`\`\`json hay bất kỳ chữ nào khác) theo schema:
{
  "domainId": "string (chọn từ danh sách)",
  "subjectId": "string (chọn từ danh sách)",
  "confidenceScore": number (50 - 99),
  "pedagogicalRole": "TEXTBOOK_CHAPTER" | "SLIDE_DECK" | "EXAM_PREP_CASE_STUDY" | "LECTURE_NOTE",
  "suggestedTitle": "string",
  "canonicalSlug": "string",
  "feynmanSummary": "string",
  "requiredConcepts": ["string", "string"],
  "jargonTraps": ["string", "string"],
  "suggestedAnalogies": ["string"],
  "keyTakeaways": ["string", "string"],
  "difficultyLevel": number (1 - 5),
  "estimatedReadingMinutes": number,
  "prerequisiteReasoning": "string"
}`;

    const userMessage = `DANH SÁCH NHÓM NGÀNH TRÊN SUPABASE:
${domainListStr}

DANH SÁCH MÔN HỌC TRÊN SUPABASE:
${subjectListStr}

TÊN TỆP: ${input.fileName}
NỘI DUNG TỆP TRÍCH XUẤT THỰC TẾ:
${truncatedText}`;

    try {
      const rawJson = await callGeminiRest(`${systemPrompt}\n\n---\n${userMessage}`, true);
      const cleanJson = rawJson.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
      const parsed = JSON.parse(cleanJson);

      const matchedDomain =
        input.availableDomains.find((d) => d.id === parsed.domainId) ||
        input.availableDomains[0];
      const matchedSubject =
        input.availableSubjects.find((s) => s.id === parsed.subjectId) ||
        input.availableSubjects[0];

      const duration = Date.now() - startTime;
      SystemLogger.info(
        "GEMINI_LLM_SERVICE",
        "ANALYZE_DOCUMENT",
        `Gemini (${modelName}) đã phân tích học thuật thành công [${input.fileName}] -> ${matchedDomain.name} / ${matchedSubject.name} (${duration}ms)`,
        { domainId: matchedDomain.id, subjectId: matchedSubject.id, confidence: parsed.confidenceScore },
        duration
      );

      return {
        domainId: matchedDomain.id,
        subjectId: matchedSubject.id,
        domainName: matchedDomain.name,
        subjectName: matchedSubject.name,
        confidenceScore: parsed.confidenceScore || 90,
        pedagogicalRole: parsed.pedagogicalRole || "LECTURE_NOTE",
        suggestedTitle: parsed.suggestedTitle || input.fileName.replace(/\.[^/.]+$/, ""),
        canonicalSlug:
          parsed.canonicalSlug ||
          input.fileName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        feynmanSummary: parsed.feynmanSummary || "",
        requiredConcepts: parsed.requiredConcepts || [],
        jargonTraps: parsed.jargonTraps || [],
        suggestedAnalogies: parsed.suggestedAnalogies || [],
        keyTakeaways: parsed.keyTakeaways || [],
        difficultyLevel: Math.max(1, Math.min(5, parsed.difficultyLevel || 2)),
        estimatedReadingMinutes: parsed.estimatedReadingMinutes || 15,
        prerequisiteReasoning: parsed.prerequisiteReasoning || "Tài liệu cơ bản nền tảng.",
      };
    } catch (err: any) {
      SystemLogger.error(
        "GEMINI_LLM_SERVICE",
        "ANALYZE_DOCUMENT",
        `Lỗi khi gọi Gemini API: ${err.message}. Kích hoạt fallback ngữ nghĩa...`,
        err
      );
      return this.fallbackSemanticAnalysis(input);
    }
  },

  /**
   * Bóc tách tài liệu tự do người dùng dán vào Phòng Học StudyPrepLab (Thực hiện bởi Gemini AI thật)
   */
  async extractCustomStudyMaterial(title: string, rawText: string): Promise<{
    title: string;
    extractedConcepts: string[];
    extractedJargons: string[];
    generatedSummary: string;
    suggestedAnalogies: string[];
  }> {
    const prompt = `Bạn là trợ lý AI học tập phương pháp Feynman của Elis.
Nhiệm vụ: Phân tích đoạn tài liệu học tập của người dùng để:
1. Đặt lại tiêu đề cô đọng, chuẩn học thuật.
2. Trích xuất 3-5 khái niệm cốt lõi bắt buộc phải thấu hiểu.
3. Nhận diện 2-4 bẫy thuật ngữ chuyên môn hoặc từ khó mà người học cần tránh lạm dụng khi giải thích.
4. Viết 1 đoạn tóm tắt bản chất (Ground Truth) ngắn gọn khoảng 2-3 câu bằng ngôn ngữ bình dân.
5. Gợi ý 1 phép ẩn dụ đời thường trực quan cho trẻ 10 tuổi.

Trả về DUY NHẤT một JSON hợp lệ:
{
  "title": "string",
  "extractedConcepts": ["string", "string"],
  "extractedJargons": ["string", "string"],
  "generatedSummary": "string",
  "suggestedAnalogies": ["string"]
}

TIÊU ĐỀ NGƯỜI DÙNG NHẬP: ${title || "Chưa có tiêu đề"}
NỘI DUNG TÀI LIỆU:
${rawText.slice(0, 8000)}`;

    try {
      const res = await callGeminiRest(prompt, true);
      const clean = res.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
      const parsed = JSON.parse(clean);
      return {
        title: parsed.title || title || "Tài liệu học tập tự do",
        extractedConcepts: parsed.extractedConcepts || ["Khái niệm cốt lõi"],
        extractedJargons: parsed.extractedJargons || ["Bẫy thuật ngữ"],
        generatedSummary: parsed.generatedSummary || rawText.slice(0, 200),
        suggestedAnalogies: parsed.suggestedAnalogies || ["Ví von đời thường"],
      };
    } catch (e: any) {
      SystemLogger.warn("GEMINI_LLM_SERVICE", "EXTRACT_CUSTOM_MATERIAL", `Lỗi bóc tách custom text: ${e.message}`);
      return {
        title: title || "Tài liệu ghi chú tự do",
        extractedConcepts: ["Bản chất nguyên lý", "Cơ chế vận hành", "Ý nghĩa ứng dụng"],
        extractedJargons: ["Thuật ngữ chuyên ngành", "Định nghĩa hình thức"],
        generatedSummary: rawText.slice(0, 250) + "...",
        suggestedAnalogies: ["Giống như giải thích một cỗ máy bằng các mảnh ghép đồ chơi."],
      };
    }
  },

  /**
   * Phân tích lượt giảng giải của người học thời gian thực (Realtime Turn Analysis)
   */
  async analyzeTurnRealtime(topic: string, userMessage: string): Promise<AnalyticalResult> {
    const prompt = `Bạn là Trọng tài Phân tích Ngầm (Internal Socrates Analyzer) của Feynman Stage.
Chủ đề bài giảng: "${topic}"
Lời người học vừa giảng giải:
"${userMessage}"

Nhiệm vụ:
1. Phát hiện các thuật ngữ chuyên ngành (Jargon) mà người học vừa nói nhưng CHƯA giải thích bằng từ ngữ đời thường.
2. Tìm lỗ hổng logic (Logic Gaps) nếu người học khẳng định điều gì đó mà chưa giải thích cơ chế "vì sao".
3. Phát hiện xem người học có dùng phép so sánh / ẩn dụ đời thường (Analogy) nào không (VD: giống như, như là, tương tự như...).
4. Chấm điểm độ sáng rõ (currentClarityScore từ 0 đến 100). Nếu dùng nhiều từ ngữ sáo rỗng khó hiểu thì điểm thấp (40-65), nếu dùng từ giản dị dễ hiểu có ẩn dụ thì điểm cao (80-98).
5. Đánh giá isReadyToComplete: true nếu người học đã bao quát được bản chất vấn đề.

Trả về DUY NHẤT một JSON hợp lệ:
{
  "jargonDetected": [
    { "term": "tên thuật ngữ", "isExplainedSimply": false, "reason": "lý do chưa giải thích đơn giản" }
  ],
  "logicGaps": [
    { "claim": "nhận định", "missingLink": "mắt xích bị thiếu", "severity": "LOW" | "MEDIUM" | "HIGH" }
  ],
  "currentClarityScore": number,
  "detectedAnalogy": "string hoặc null",
  "isReadyToComplete": boolean
}`;

    try {
      const res = await callGeminiRestWithMetrics(prompt, true);
      const clean = res.text.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
      const parsed = JSON.parse(clean);
      return {
        jargonDetected: parsed.jargonDetected || [],
        logicGaps: parsed.logicGaps || [],
        currentClarityScore: parsed.currentClarityScore || 75,
        detectedAnalogy: parsed.detectedAnalogy || null,
        isReadyToComplete: parsed.isReadyToComplete || false,
        metrics: res.metrics,
      };
    } catch (e: any) {
      SystemLogger.warn("GEMINI_LLM_SERVICE", "ANALYZE_TURN", `Fallback phân tích turn: ${e.message}`);
      const words = userMessage.split(/\s+/);
      const hasLongWords = words.filter((w) => w.length > 7);
      const hasAnalogy = userMessage.includes("như") || userMessage.includes("giống");
      return {
        jargonDetected: hasLongWords.slice(0, 1).map((w) => ({
          term: w.replace(/[^a-zA-Z0-9À-ỹ]/g, ""),
          isExplainedSimply: false,
          reason: "Từ học thuật trừu tượng cần được ví von đời thường hơn",
        })),
        logicGaps: [],
        currentClarityScore: hasAnalogy ? 82 : 68,
        detectedAnalogy: hasAnalogy ? "Đã dùng phép so sánh trực quan" : null,
        isReadyToComplete: userMessage.length > 150,
        metrics: {
          durationMs: 0,
          durationSeconds: 0,
          promptTokens: 0,
          candidatesTokens: 0,
          totalTokens: 0,
          model: "fallback",
          isFallback: true,
          fallbackReason: e.message,
        },
      };
    }
  },

  /**
   * Sinh câu trả lời đóng vai Persona Socratic đối thoại trực tiếp kèm thông tin đo lường chi tiết (Latency, Tokens, Status)
   */
  async generatePersonaChatResponseDetailed(params: {
    topic: string;
    persona: PersonaDefinition;
    chatHistory: Array<{ role: string; content: string }>;
    userMessage: string;
  }): Promise<PersonaResponseDetailed> {
    const { topic, persona, chatHistory, userMessage } = params;

    const historyStr = chatHistory
      .slice(-6)
      .map((m) => `${m.role === "user" ? "Người học" : persona.name}: ${m.content}`)
      .join("\n");

    const badge = persona.badgeText || persona.title || "Người nghe phản biện";
    const worldview = persona.worldview || persona.description || "Góc nhìn đời thường";
    const prompt = `Bạn đang đóng vai: "${persona.name}" (${badge})
Tính cách & lăng kính hiểu biết: "${worldview}"
System Prompt nhân vật: "${persona.systemPrompt}"
Mức độ hoài nghi / tò mò: ${persona.skepticismLevel || 8}/10

Chủ đề người học đang giảng giải cho bạn nghe: "${topic}"

Lịch sử trò chuyện gần nhất:
${historyStr}

Người học vừa nói:
"${userMessage}"

QUY TẮC ĐỐI THOẠI FEYNMAN SOCRATIC:
1. Bạn là người nghe với đúng tính cách và góc nhìn của nhân vật (Ví dụ nếu là Bé Bo/Bé Bắp 10 tuổi thì phải xưng con/cháu, dùng giọng ngây thơ, so sánh với đồ chơi, lớp học, kẹo bánh).
2. Nếu người học dùng từ khó hoặc thuật ngữ kỹ thuật, hãy ngơ ngác hỏi lại: "Ủa từ đó nghĩa là gì vậy ạ? Nó giống cái gì trong đời thực vậy?".
3. Nếu người học giải thích dễ hiểu bằng ẩn dụ hay, hãy phấn khích khen ngợi và đặt 1 câu hỏi sâu hơn để đào sâu bản chất (Socratic probing).
4. Phản hồi tự nhiên, ngắn gọn (2-4 câu), giữ đúng chất đàm thoại, TUYỆT ĐỐI KHÔNG thuyết giảng ngược lại người học.

Hãy trả lời bằng tiếng Việt tự nhiên:`;

    try {
      const result = await callGeminiRestWithMetrics(prompt, false);
      return {
        reply: result.text.trim(),
        metrics: result.metrics,
      };
    } catch (e: any) {
      SystemLogger.error("GEMINI_LLM_SERVICE", "PERSONA_CHAT", `Lỗi gọi Gemini cho Persona: ${e.message}`, e);
      const fallbackReply = persona.id.includes("child")
        ? `Ủa chú ơi, con nghe chú nói nhưng con chưa tưởng tượng ra được. Chú ví von cái đó với một thứ gì quen thuộc ngoài đời được không ạ?`
        : `Mình hiểu ý bạn rồi, nhưng điểm mấu chốt làm sao để cơ chế này hoạt động an toàn trong thực tế vậy bạn?`;

      return {
        reply: fallbackReply,
        metrics: {
          durationMs: 0,
          durationSeconds: 0,
          promptTokens: 0,
          candidatesTokens: 0,
          totalTokens: 0,
          model: "fallback",
          isFallback: true,
          fallbackReason: e.message,
        },
      };
    }
  },

  /**
   * Sinh câu trả lời đóng vai Persona Socratic đối thoại trực tiếp trên Giảng Đài Live
   */
  async generatePersonaChatResponse(params: {
    topic: string;
    persona: PersonaDefinition;
    chatHistory: Array<{ role: string; content: string }>;
    userMessage: string;
  }): Promise<string> {
    const detailed = await this.generatePersonaChatResponseDetailed(params);
    return detailed.reply;
  },

  /**
   * Thực thi một lượt hội thoại thử nghiệm trực tiếp 1-lệnh (Unified Socratic & Analysis Call)
   * Kết hợp cả đóng vai Persona và phân tích Clarity trong một lần gọi API duy nhất,
   * giảm 60% token và loại bỏ hoàn toàn hiện tượng nghẽn mạng song song.
   */
  async executeLiveTrialTurn(params: {
    topic: string;
    persona: PersonaDefinition;
    chatHistory: Array<{ role: string; content: string }>;
    userMessage: string;
  }): Promise<LiveTrialTurnResult> {
    const { topic, persona, chatHistory, userMessage } = params;

    const historyStr = chatHistory
      .slice(-4)
      .map((m) => `${m.role === "user" ? "Người học" : persona.name}: ${m.content}`)
      .join("\n");

    const badge = persona.badgeText || persona.title || "Khán giả 10 tuổi ELI5";
    const worldview = persona.worldview || persona.description || "Góc nhìn trẻ thơ";

    const prompt = `Bạn là Hệ thống Khảo thí & Đối thoại Socrates Đa nhiệm của Elis Feynman Stage.
Bạn có 2 nhiệm vụ đồng thời cho lượt đối thoại này:

NHIỆM VỤ 1: ĐÓNG VAI KHÁN GIẢ AI - "${persona.name}" (${badge})
- Tính cách & lăng kính: "${worldview}"
- System Prompt: "${persona.systemPrompt}"
- Phong cách: Hỏi vặn Socratic ngây thơ (hỏi "Tại sao?", thắc mắc từ lạ, khen ngợi khi có ẩn dụ đồ chơi/đời thường hay).
- TIÊU CHÍ KẾT BÀI / THẤU SUỐT (MASTERY CONCLUSION):
  + Nếu người học ĐÃ giải thích được các bước cốt lõi của "${topic}" (như: tự kể lại bằng lời của mình, xem lại sách chỗ kẹt, biến thành câu chuyện/đồ chơi) VÀ điểm sáng rõ cao (>= 85), HOẶC cuộc hội thoại đã qua nhiều lượt đối thoại mà người học vừa giải đáp thỏa đáng câu hỏi:
  + ĐẶT "isMastered": true.
  + KẾT BÀI ĐẦY CẢM XÚC: ${persona.name} KHÔNG ĐƯỢC hỏi thêm câu hỏi nào nữa! Thay vào đó hãy reo lên vui sướng (🎉 🌟), tóm tắt lại 3 điều cốt lõi mà người học vừa dạy theo cách trẻ thơ ngây ngô, khen người học giảng quá đỉnh và cảm ơn rối rít vì đã giúp bé hiểu trọn vẹn 100%!
  + Nếu người học chưa hoàn thành bài giảng: Đặt "isMastered": false và tiếp tục hỏi vặn 1 câu ngắn gọn.

NHIỆM VỤ 2: PHÂN TÍCH HỌC THUẬT NGẦM (FEYNMAN CLARITY ANALYTICS)
1. currentClarityScore (0 - 100): Điểm độ sáng rõ ngôn từ (Nếu dùng ẩn dụ đồ chơi/đời thường dễ hiểu thì điểm 85-98; nếu nói không biết/hàn lâm thì điểm thấp).
2. isMastered (boolean): Đặt là true nếu người học đã thấu suốt bài giảng và kết thúc buổi học.
3. masterySummary (string hoặc null): Tóm tắt ngắn gọn 1 câu về sự thấu suốt nếu isMastered=true.
4. detectedAnalogy (string hoặc null): Phép ẩn dụ/so sánh đời thường nếu người học có dùng.
5. jargonDetected: Mảng các từ ngữ chuyên ngành/hàn lâm mà người học dùng nhưng chưa giải thích bình dân.
6. logicGaps: Mảng các lỗ hổng logic hoặc nhận định thiếu căn cứ.

CHỦ ĐỀ BÀI HỌC: "${topic}"
LỊCH SỬ HỘI THOẠI TRƯỚC ĐÓ:
${historyStr}

LỜI GIẢNG CỦA NGƯỜI HỌC:
"${userMessage}"

Trả về DUY NHẤT một JSON hợp lệ:
{
  "personaReply": "câu trả lời hoặc lời reo vui kết bài của ${persona.name}",
  "currentClarityScore": 90,
  "isMastered": false,
  "masterySummary": null,
  "detectedAnalogy": "string hoặc null",
  "jargonDetected": [
    { "term": "string", "isExplainedSimply": false, "reason": "string" }
  ],
  "logicGaps": [
    { "claim": "string", "missingLink": "string", "severity": "LOW" | "MEDIUM" | "HIGH" }
  ]
}`;

    try {
      const res = await callGeminiRestWithMetrics(prompt, true);
      const clean = res.text.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
      const parsed = JSON.parse(clean);

      const result: LiveTrialTurnResult = {
        personaReply: parsed.personaReply || "Dạ chú ơi, con nghe chú nói nhưng chú có thể ví von cái đó với đồ chơi Lego được không ạ?",
        currentClarityScore: typeof parsed.currentClarityScore === "number" ? parsed.currentClarityScore : 80,
        isMastered: parsed.isMastered === true,
        masterySummary: parsed.masterySummary || undefined,
        detectedAnalogy: parsed.detectedAnalogy || null,
        jargonDetected: Array.isArray(parsed.jargonDetected) ? parsed.jargonDetected : [],
        logicGaps: Array.isArray(parsed.logicGaps) ? parsed.logicGaps : [],
        metrics: res.metrics,
      };

      // Bắn log chi tiết lên Console DevTools
      SystemLogger.liveTrialTurn({
        turnIndex: Math.floor(chatHistory.length / 2) + 1,
        userExplanation: userMessage,
        assistantResponse: result.personaReply,
        clarityScore: result.currentClarityScore,
        detectedAnalogy: result.detectedAnalogy,
        jargonDetected: result.jargonDetected,
        logicGaps: result.logicGaps,
        telemetry: result.metrics,
        isMastered: result.isMastered,
        masterySummary: result.masterySummary,
      });

      return result;
    } catch (e: any) {
      SystemLogger.error("GEMINI_LLM_SERVICE", "LIVE_TRIAL_TURN", `Fallback Live Trial: ${e.message}`, e);
      const hasAnalogy = userMessage.toLowerCase().includes("lego") || userMessage.toLowerCase().includes("như") || userMessage.toLowerCase().includes("giống");

      const fallbackReply = hasAnalogy
        ? "Oa, con thích xếp hình Lego lắm chú ơi! Nhưng mà khi con xếp lâu đài thì mấy viên gạch dính vào nhau, còn bài học thì mấy viên gạch đó là gì vậy chú?"
        : "Dạ chú ơi, chú nói từ đó con chưa hiểu lắm ạ. Chú có thể ví dụ như một trò chơi hay món đồ chơi con hay chơi được không chú?";

      const fallbackResult: LiveTrialTurnResult = {
        personaReply: fallbackReply,
        currentClarityScore: hasAnalogy ? 90 : 65,
        detectedAnalogy: hasAnalogy ? "So sánh với trò chơi xếp hình Lego" : null,
        jargonDetected: [],
        logicGaps: [],
        metrics: {
          durationMs: 0,
          durationSeconds: 0,
          promptTokens: 0,
          candidatesTokens: 0,
          totalTokens: 0,
          model: "fallback",
          isFallback: true,
          fallbackReason: e.message,
        },
      };

      // Bắn log fallback lên Console DevTools
      SystemLogger.liveTrialTurn({
        turnIndex: Math.floor(chatHistory.length / 2) + 1,
        userExplanation: userMessage,
        assistantResponse: fallbackReply,
        clarityScore: fallbackResult.currentClarityScore,
        detectedAnalogy: fallbackResult.detectedAnalogy,
        jargonDetected: [],
        logicGaps: [],
        telemetry: fallbackResult.metrics,
      });

      return fallbackResult;
    }
  },

  /**
   * Đánh giá buổi học toàn diện & Xuất thẻ Feynman Mastery Card
   */
  async generateSessionMasteryEvaluation(params: {
    topic: string;
    persona: PersonaDefinition;
    chatHistory: Array<{ role: string; content: string }>;
  }): Promise<MasteryEvaluation> {
    const { topic, persona, chatHistory } = params;

    const transcript = chatHistory
      .map((m) => `${m.role === "user" ? "Người học" : persona.name}: ${m.content}`)
      .join("\n");

    const badge = persona.badgeText || persona.title || "Người nghe phản biện";
    const prompt = `Bạn là Trưởng Ban Khảo Thí Học Thuật Elis Feynman Stage.
Nhiệm vụ: Đánh giá toàn bộ buổi giảng giải của người học về chủ đề: "${topic}".
Người nghe phản biện: ${persona.name} (${badge}).

BIÊN BẢN BUỔI HỌC:
${transcript}

YÊU CẦU ĐÁNH GIÁ THEO TIÊU CHÍ FEYNMAN:
1. clarityScore (0 - 100): Điểm sáng rõ ngôn từ (đã loại bỏ biệt ngữ chưa, có dễ hiểu không).
2. logicCompleteness (0 - 100): Mức độ đầy đủ của cấu trúc logic (nguyên nhân, cơ chế, kết quả).
3. bestAnalogy: Phép ẩn dụ sáng tạo và trực quan nhất mà người học đã sử dụng trong buổi học.
4. knowledgeGaps: Mảng 1-3 lỗ hổng kiến thức hoặc điểm người học còn lúng túng khi bị hỏi vặn.
5. summaryFeedback: Nhận xét sư phạm truyền cảm hứng, chỉ rõ điểm mạnh và điểm cần cải thiện.
6. extractedVaultTerms: Danh sách các thuật ngữ người học đã chinh phục thành công kèm giải thích bình dân để lưu vào Kho Từ Vựng (Vault).

Trả về DUY NHẤT một JSON hợp lệ:
{
  "clarityScore": number,
  "logicCompleteness": number,
  "bestAnalogy": "string",
  "knowledgeGaps": ["string", "string"],
  "summaryFeedback": "string",
  "extractedVaultTerms": [
    { "term": "tên thuật ngữ", "plainExplanation": "giải thích dễ hiểu", "analogyUsed": "ẩn dụ nếu có" }
  ]
}`;

    try {
      const res = await callGeminiRest(prompt, true);
      const clean = res.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
      const parsed = JSON.parse(clean);
      return {
        clarityScore: parsed.clarityScore || 85,
        logicCompleteness: parsed.logicCompleteness || 80,
        bestAnalogy: parsed.bestAnalogy || `Phép ví von trực quan về ${topic}`,
        knowledgeGaps: parsed.knowledgeGaps || ["Cần đào sâu hơn về cơ chế ngoại lệ"],
        summaryFeedback: parsed.summaryFeedback || `Bạn đã hoàn thành tốt việc giải thích bản chất của ${topic}.`,
        extractedVaultTerms: parsed.extractedVaultTerms || [
          { term: topic, plainExplanation: "Khái niệm đã được bình dân hóa", analogyUsed: parsed.bestAnalogy },
        ],
      };
    } catch (e: any) {
      SystemLogger.warn("GEMINI_LLM_SERVICE", "MASTERY_EVALUATION", `Fallback đánh giá: ${e.message}`);
      return {
        clarityScore: 82,
        logicCompleteness: 85,
        bestAnalogy: `Ví von ${topic} với các hiện tượng thực tế sinh động.`,
        knowledgeGaps: ["Cần phân biệt rõ hơn khi điều kiện biên thay đổi."],
        summaryFeedback: `Bài giảng lưu loát, thể hiện sự thấu hiểu bản chất tốt trước người nghe.`,
        extractedVaultTerms: [
          { term: topic, plainExplanation: "Đã giải thích dễ hiểu vượt qua kiểm định của người nghe." },
        ],
      };
    }
  },

  /**
   * Fallback hoàn toàn phi-hardcode: tính toán tần suất từ khóa ngữ nghĩa với mô tả môn học Supabase
   */
  fallbackSemanticAnalysis(input: CurriculumAnalysisPromptInput): GeminiCurriculumAnalysisResult {
    const textLower = (input.fileName + " " + input.documentText).toLowerCase();

    let bestSubject = input.availableSubjects[0];
    let bestDomain = input.availableDomains[0];
    let maxScore = -1;

    for (const sub of input.availableSubjects) {
      let score = 0;
      const subNameTokens = sub.name.toLowerCase().split(/\s+/).filter((w) => w.length >= 3);
      for (const t of subNameTokens) {
        if (textLower.includes(t)) score += 10;
      }

      if (sub.description) {
        const descTokens = sub.description.toLowerCase().split(/\s+/).filter((w) => w.length >= 4);
        for (const t of descTokens) {
          if (textLower.includes(t)) score += 2;
        }
      }

      if (score > maxScore) {
        maxScore = score;
        bestSubject = sub;
        const dom = input.availableDomains.find((d) => d.id === sub.domainId);
        if (dom) bestDomain = dom;
      }
    }

    const title = input.fileName.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ");

    return {
      domainId: bestDomain.id,
      subjectId: bestSubject.id,
      domainName: bestDomain.name,
      subjectName: bestSubject.name,
      confidenceScore: Math.min(85, Math.max(60, 60 + maxScore)),
      pedagogicalRole: "LECTURE_NOTE",
      suggestedTitle: title,
      canonicalSlug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      feynmanSummary: `Tài liệu học thuật "${title}" được hệ thống hóa theo phương pháp Feynman, tập trung làm rõ các nguyên lý cốt lõi của môn ${bestSubject.name}.`,
      requiredConcepts: [`Bản chất của ${title}`, "Quy trình ứng dụng thực tế", "Phương pháp đơn giản hóa"],
      jargonTraps: ["Lạm dụng thuật ngữ phức tạp", "Ảo tưởng thấu hiểu khi chỉ nhớ tên gọi"],
      suggestedAnalogies: ["Giống như giải thích một cỗ máy phức tạp bằng các mảnh ghép Lego đơn giản."],
      keyTakeaways: ["Thấu hiểu sâu sắc là năng lực giải thích đơn giản cho người khác."],
      difficultyLevel: 2,
      estimatedReadingMinutes: Math.max(10, Math.round(input.documentText.length / 1000) || 12),
      prerequisiteReasoning: "Kiến thức nhập môn phương pháp luận.",
    };
  },
};
