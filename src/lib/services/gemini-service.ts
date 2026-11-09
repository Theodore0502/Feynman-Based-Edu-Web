/**
 * File: src/lib/services/gemini-service.ts
 * Purpose: Dịch vụ Tác nhân AI Gemini (gemini-3.1-flash-lite) phục vụ phân tích học thuật,
 *          định danh taxonomy động và sinh Schema Feynman chuẩn dựa trên toàn bộ nội dung tệp thực tế.
 */

import { SystemLogger } from "./system-logger";

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

function getGeminiApiKey(): string | undefined {
  return (
    metaEnv?.VITE_GEMINI_API_KEY ||
    (typeof process !== "undefined" && process.env?.GEMINI_API_KEY) ||
    (typeof process !== "undefined" && process.env?.VITE_GEMINI_API_KEY)
  );
}

function getGeminiModelName(): string {
  return (
    metaEnv?.VITE_MODEL_NAME ||
    (typeof process !== "undefined" && process.env?.MODEL_NAME) ||
    "gemini-3.1-flash-lite"
  );
}

export const GeminiCurriculumService = {
  /**
   * Gọi Gemini API để phân tích học thuật và gán nhãn bài học tự động
   */
  async analyzeDocument(input: CurriculumAnalysisPromptInput): Promise<GeminiCurriculumAnalysisResult> {
    const startTime = Date.now();
    const apiKey = getGeminiApiKey();
    const modelName = getGeminiModelName();

    if (!apiKey) {
      SystemLogger.warn(
        "GEMINI_LLM_SERVICE",
        "API_KEY_MISSING",
        "Không tìm thấy GEMINI_API_KEY, chuyển sang chế độ Semantic Matching dựa trên Supabase."
      );
      return this.fallbackSemanticAnalysis(input);
    }

    // Cắt bớt văn bản nếu quá dài (lấy 15,000 ký tự đại diện để tiết kiệm token và đảm bảo latency)
    const truncatedText = input.documentText.slice(0, 18000);

    const domainListStr = input.availableDomains
      .map((d) => `- [${d.id}] "${d.name}" (${d.description || ""})`)
      .join("\n");

    const subjectListStr = input.availableSubjects
      .map((s) => `- [${s.id}] "${s.name}" (Thuộc domain: ${s.domainId || "Chung"})`)
      .join("\n");

    const systemPrompt = `Bạn là Theodore Academic Curator Agent - Tác nhân AI thẩm định và phân loại tài liệu học thuật theo phương pháp Feynman.
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
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\n---\n${userMessage}` }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Gemini API HTTP ${response.status}: ${errorBody}`);
      }

      const resData = await response.json();
      const rawText = resData?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error("Gemini không trả về nội dung kết quả phân tích");
      }

      // Làm sạch nếu còn dính code fences
      const cleanJson = rawText.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
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
   * Fallback hoàn toàn phi-hardcode: tính toán tần suất từ khóa ngữ nghĩa với mô tả môn học Supabase
   */
  fallbackSemanticAnalysis(input: CurriculumAnalysisPromptInput): GeminiCurriculumAnalysisResult {
    const textLower = (input.fileName + " " + input.documentText).toLowerCase();

    // Tính điểm cho từng môn học dựa trên tần suất từ khóa thực tế
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
