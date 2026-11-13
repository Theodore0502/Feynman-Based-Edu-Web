/**
 * File: src/lib/services/fast-document-scanner.ts
 * Mục đích: AI Document Inspection Agent (Tác nhân đọc hiểu & bóc tách cấu trúc học thuật).
 * ĐƯỢC VẬN HÀNH 100% BỞI MÔ HÌNH GEMINI LLM (gemini-3.1-flash-lite) KẾT HỢP CÂY TRI THỨC SUPABASE.
 * TUYỆT ĐỐI KHÔNG DÙNG PIPELINE RULE-BASED REGEX ĐỂ GÁN ÉP NỘI DUNG.
 */

import { DocumentParser } from "./document-parser";
import { TaxonomyClassifier } from "./taxonomy-classifier";
import { callGeminiRestWithMetrics, GeminiCallMetrics } from "./gemini-service";
import { SystemLogger } from "./system-logger";

export interface SubjectDistribution {
  subjectId: string;
  subjectName: string;
  domainId: string;
  domainName: string;
  domainSlug: string;
  percentage: number;
  color: string;
  matchedKeywords: string[];
}

export interface DetectedChapterModule {
  id: string;
  index: number;
  heading: string;
  dominantSubjectId: string;
  dominantSubjectName: string;
  dominantDomainName: string;
  percentageInDoc: number;
  wordCount: number;
  previewSnippet: string;
}

export interface EducationalAssessment {
  isLearningMaterial: boolean;
  materialType:
    | "lecture"
    | "textbook"
    | "thesis_research"
    | "exercise_exam"
    | "administrative_form"
    | "general_document";
  materialTypeLabel: string;
  confidenceScore: number;
  reasoning: string;
  recommendation: string;
  pedagogicalIndicators: {
    hasTheoreticalConcepts: boolean;
    hasInstructionalStructure: boolean;
    hasFormOrAdministrativeMarkers: boolean;
    matchedFormKeywords: string[];
    matchedAcademicKeywords: string[];
  };
}

export interface FastScanResult {
  fileName: string;
  fileSizeBytes: number;
  totalCharacters: number;
  totalWords: number;
  suggestedTitle: string;
  canonicalSlug: string;
  refLink: string;
  distributions: SubjectDistribution[];
  isMultiSubject: boolean;
  primarySubject: SubjectDistribution;
  secondarySubject?: SubjectDistribution;
  detectedModules: DetectedChapterModule[];
  splitMode: "integrated" | "split";
  allowedConcepts: string[];
  allowedJargons: string[];
  educationalAssessment: EducationalAssessment;
  geminiMetrics?: GeminiCallMetrics;
  summary?: string;
  isFallback?: boolean;
}

function toUrlSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function getDomainColor(domainId: string): string {
  const colors: Record<string, string> = {
    "dom-it": "bg-blue-600 text-blue-700",
    "dom-cs": "bg-indigo-600 text-indigo-700",
    "dom-se": "bg-cyan-600 text-cyan-700",
    "dom-ecom": "bg-emerald-600 text-emerald-700",
    "dom-acc": "bg-amber-600 text-amber-700",
    "dom-biz": "bg-orange-600 text-orange-700",
    "dom-tour": "bg-teal-600 text-teal-700",
    "dom-med": "bg-rose-600 text-rose-700",
    "dom-edu": "bg-purple-600 text-purple-700",
  };
  return colors[domainId] || "bg-slate-600 text-slate-700";
}

export const FastDocumentScanner = {
  /**
   * Đọc hiểu và phân tích văn bản thực tế bằng Tác nhân Gemini (gemini-3.1-flash-lite)
   * và đối soát động với toàn bộ Cây Tri Thức CSDL Supabase.
   */
  async scanDocument(
    file: File | { name: string; buffer: Buffer; size: number }
  ): Promise<FastScanResult> {
    const fileName = "name" in file ? file.name : "document";
    const fileSizeBytes = "size" in file ? file.size : (file as any).buffer?.length || 0;

    // 1. Bóc tách văn bản thô thực tế từ DOCX (mammoth) / PDF (pdfjs) / TXT
    const parsed = await DocumentParser.parseDocument(file);
    const fullText = parsed.extractedText || "";
    const totalCharacters = fullText.length;
    const totalWords = fullText.trim().split(/\s+/).filter(Boolean).length;

    // 2. Đồng bộ danh mục Cây Tri Thức động từ Supabase
    const liveTaxonomy = await TaxonomyClassifier.syncSystemTaxonomy();
    const domains = liveTaxonomy.domains;
    const subjects = liveTaxonomy.subjects;

    const domainList = domains
      .map((d) => `- [${d.id}] "${d.name}" (slug: ${d.slug})`)
      .join("\n");
    const subjectList = subjects
      .map((s) => `- [${s.id}] "${s.name}" (thuộc domainId: ${s.domainId || "Chung"})`)
      .join("\n");

    const textSnippet = fullText.slice(0, 18000);

    const prompt = `Bạn là Elis AI Curriculum & Educational Document Inspection Agent.
Nhiệm vụ của bạn là đọc hiểu TOÀN BỘ văn bản tài liệu được tải lên, thẩm định học thuật và bóc tách cấu trúc chuẩn hóa để đưa vào Cây Tri Thức CSDL Supabase.

DANH SÁCH NHÓM NGÀNH HỢP LỆ (DOMAINS TRÊN SUPABASE):
${domainList}

DANH SÁCH MÔN HỌC HỢP LỆ (SUBJECTS TRÊN SUPABASE):
${subjectList}

QUY TẮC THẨM ĐỊNH BẮT BUỘC (TUYỆT ĐỐI TUÂN THỦ):
1. Đánh giá tính học thuật (isLearningMaterial):
   - ĐẶC BIỆT CHÚ Ý: Báo cáo thực tập tốt nghiệp, Khóa luận tốt nghiệp, Đồ án môn học, Chuyên đề kỹ thuật CÓ NỘI DUNG NGHIÊN CỨU/TRIỂN KHAI KỸ THUẬT (ví dụ: Chatbot RAG, Xây dựng phần mềm, Hệ thống AI, Xử lý dữ liệu, Machine Learning...) LÀ TÀI LIỆU HỌC THUẬT HỢP LỆ (isLearningMaterial: true, materialType: "thesis_research").
   - Chỉ đánh giá isLearningMaterial: false nếu tài liệu là biểu mẫu hành chính thuần túy, phiếu chấm điểm trống, biên bản họp, giấy tờ tùy thân, không chứa kiến thức kỹ thuật/khoa học.
2. Tiêu đề chuẩn hóa (suggestedTitle):
   - Trích xuất tiêu đề chính xác của đề tài/bài học có dấu tiếng Việt chuẩn (ví dụ: "Nghiên cứu và Xây dựng Hệ thống Chatbot Hỏi Đáp Đa Tài Liệu Dựa Trên RAG"). Không dùng tên file chung chung.
3. Phân loại Ngành và Môn học:
   - Chọn primaryDomainId và primarySubjectId CHÍNH XÁC từ danh sách trên.
   - Nếu tài liệu liên ngành/đa môn (ví dụ vừa về AI/Chatbot vừa về Công nghệ phần mềm/Web), hãy chỉ định secondaryDomainId, secondarySubjectId và phân bổ tỷ lệ phần trăm (ví dụ: 70% primary, 30% secondary).
4. Khái niệm cốt lõi (allowedConcepts) & Bẫy thuật ngữ (allowedJargons):
   - Bóc tách 5-8 khái niệm cốt lõi thực tế xuất hiện trong văn bản.
   - Bóc tách 4-6 thuật ngữ chuyên sâu cần giải thích.
5. Cấu trúc chương mục (detectedChapters):
   - Trích xuất 3-6 chương mục chính có trong văn bản.

HÃY TRẢ VỀ DUY NHẤT ĐỊNH DẠNG JSON NHƯ SAU (không bọc markdown \`\`\`json hoặc text phụ):
{
  "isLearningMaterial": boolean,
  "materialType": "thesis_research" | "lecture" | "textbook" | "exercise_exam" | "administrative_form" | "general_document",
  "materialTypeLabel": string,
  "confidenceScore": number,
  "reasoning": string,
  "recommendation": string,
  "suggestedTitle": string,
  "primaryDomainId": string,
  "primarySubjectId": string,
  "primaryPercentage": number,
  "isMultiSubject": boolean,
  "secondaryDomainId": string,
  "secondarySubjectId": string,
  "secondaryPercentage": number,
  "summary": string,
  "allowedConcepts": string[],
  "allowedJargons": string[],
  "detectedChapters": string[]
}

NỘI DUNG VĂN BẢN TÀI LIỆU:
${textSnippet}`;

    SystemLogger.info(
      "AGENT_EXTRACTION",
      "START_GEMINI_SCAN",
      `Khởi động Tác nhân Gemini (gemini-3.1-flash-lite) để bóc tách tệp [${fileName}] (${totalWords} từ)`
    );

    console.log(
      "%c[GEMINI AI INSPECTION AGENT] 🚀 Đang gửi văn bản đến Gemini LLM (gemini-3.1-flash-lite) để bóc tách ngữ nghĩa...",
      "color: #2563eb; font-weight: bold;",
      { fileName, fileSizeBytes, totalWords, totalCharacters }
    );

    try {
      const geminiRes = await callGeminiRestWithMetrics(prompt, true);
      const cleanJson = geminiRes.text.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
      const aiData = JSON.parse(cleanJson);

      console.log(
        `%c[GEMINI AI INSPECTION AGENT] ✅ Gemini LLM bóc tách thành công (${geminiRes.metrics.durationMs}ms - ${geminiRes.metrics.totalTokens} tokens):`,
        "color: #059669; font-weight: bold;",
        {
          title: aiData.suggestedTitle,
          domain: aiData.primaryDomainId,
          subject: aiData.primarySubjectId,
          isLearning: aiData.isLearningMaterial,
          type: aiData.materialTypeLabel,
          concepts: aiData.allowedConcepts,
          jargons: aiData.allowedJargons,
        }
      );

      // Map domain & subject đối soát từ CSDL
      let primarySub = subjects.find((s) => s.id === aiData.primarySubjectId);
      if (!primarySub) {
        primarySub = subjects[0];
      }

      let primaryDom = domains.find((d) => d.id === (aiData.primaryDomainId || primarySub?.domainId));
      if (!primaryDom) {
        primaryDom = domains[0];
      }

      const primaryPercentage = Number(aiData.primaryPercentage) || 75;

      const primaryDistribution: SubjectDistribution = {
        subjectId: primarySub.id,
        subjectName: primarySub.name,
        domainId: primaryDom.id,
        domainName: primaryDom.name,
        domainSlug: primaryDom.slug,
        percentage: primaryPercentage,
        color: getDomainColor(primaryDom.id),
        matchedKeywords: aiData.allowedConcepts ? aiData.allowedConcepts.slice(0, 4) : [primarySub.name],
      };

      const distributions: SubjectDistribution[] = [primaryDistribution];

      let secondaryDistribution: SubjectDistribution | undefined;
      if (aiData.isMultiSubject && aiData.secondarySubjectId) {
        const secSub = subjects.find((s) => s.id === aiData.secondarySubjectId);
        if (secSub && secSub.id !== primarySub.id) {
          const secDom = domains.find((d) => d.id === (aiData.secondaryDomainId || secSub.domainId)) || domains[0];
          const secPercentage = Number(aiData.secondaryPercentage) || (100 - primaryPercentage);
          secondaryDistribution = {
            subjectId: secSub.id,
            subjectName: secSub.name,
            domainId: secDom.id,
            domainName: secDom.name,
            domainSlug: secDom.slug,
            percentage: secPercentage,
            color: getDomainColor(secDom.id),
            matchedKeywords: aiData.allowedJargons ? aiData.allowedJargons.slice(0, 3) : [secSub.name],
          };
          distributions.push(secondaryDistribution);
        }
      }

      const suggestedTitle = aiData.suggestedTitle?.trim() || fileName.replace(/\.[^/.]+$/, "");
      const canonicalSlug = toUrlSlug(suggestedTitle);
      const refLink = `https://elis.edu.vn/materials/${primaryDom.slug}/${primarySub.slug}/${canonicalSlug}`;

      const rawChapters: string[] = Array.isArray(aiData.detectedChapters) && aiData.detectedChapters.length > 0
        ? aiData.detectedChapters
        : ["Tổng quan lý thuyết", "Kiến trúc hệ thống", "Triển khai thực nghiệm"];

      const detectedModules: DetectedChapterModule[] = rawChapters.map((ch, idx) => ({
        id: `mod-${idx + 1}`,
        index: idx + 1,
        heading: ch,
        dominantSubjectId: primarySub.id,
        dominantSubjectName: primarySub.name,
        dominantDomainName: primaryDom.name,
        percentageInDoc: Math.round(100 / rawChapters.length),
        wordCount: Math.round(totalWords / rawChapters.length),
        previewSnippet: `${ch}: Nội dung học thuật do Tác nhân Gemini bóc tách từ tệp.`,
      }));

      const rawScore = Number(aiData.confidenceScore) || 90;
      const confidenceScore = rawScore <= 1 ? Math.round(rawScore * 100) : Math.round(rawScore);

      const educationalAssessment: EducationalAssessment = {
        isLearningMaterial: Boolean(aiData.isLearningMaterial),
        materialType: aiData.materialType || (aiData.isLearningMaterial ? "thesis_research" : "administrative_form"),
        materialTypeLabel: aiData.materialTypeLabel || (aiData.isLearningMaterial ? "Tài Liệu Học Thuật" : "Biểu Mẫu Hành Chính"),
        confidenceScore,
        reasoning: aiData.reasoning || (aiData.isLearningMaterial ? "Tài liệu đạt chuẩn học thuật." : "Tài liệu biểu mẫu hành chính."),
        recommendation: aiData.recommendation || "Sẵn sàng trích xuất bài giảng chuẩn Feynman.",
        pedagogicalIndicators: {
          hasTheoreticalConcepts: (aiData.allowedConcepts?.length || 0) > 0,
          hasInstructionalStructure: rawChapters.length > 0,
          hasFormOrAdministrativeMarkers: !aiData.isLearningMaterial,
          matchedFormKeywords: !aiData.isLearningMaterial ? ["Văn bản hành chính"] : [],
          matchedAcademicKeywords: aiData.allowedConcepts || [],
        },
      };

      SystemLogger.info(
        "GEMINI_LLM_SERVICE",
        "SCAN_COMPLETED",
        `Đã bóc tách thành công [${fileName}] qua Gemini: [${primarySub.name}] (${primaryPercentage}%), Chuẩn học thuật: ${aiData.isLearningMaterial}`
      );

      return {
        fileName,
        fileSizeBytes,
        totalCharacters,
        totalWords,
        suggestedTitle,
        canonicalSlug,
        refLink,
        distributions,
        isMultiSubject: Boolean(aiData.isMultiSubject && secondaryDistribution),
        primarySubject: primaryDistribution,
        secondarySubject: secondaryDistribution,
        detectedModules,
        splitMode: aiData.isMultiSubject ? "split" : "integrated",
        allowedConcepts: aiData.allowedConcepts || ["Khái niệm cốt lõi"],
        allowedJargons: aiData.allowedJargons || ["Bẫy thuật ngữ"],
        educationalAssessment,
        geminiMetrics: geminiRes.metrics,
        summary: aiData.summary || "",
      };
    } catch (err: any) {
      console.error("[GEMINI AI INSPECTION AGENT] Lỗi gọi Gemini LLM:", err);
      SystemLogger.warn(
        "GEMINI_LLM_SERVICE",
        "SCAN_FALLBACK",
        `Lỗi gọi Gemini LLM cho tệp [${fileName}], kích hoạt cơ chế an toàn: ${err.message}`
      );

      // Fallback an toàn nếu mạng ngắt hoặc lỗi API
      const fallbackDomain = domains[0] || { id: "dom-it", name: "Công Nghệ Thông Tin", slug: "cong-nghe-thong-tin" };
      const fallbackSubject = subjects[0] || { id: "sub-it-web", name: "Phát Triển Web & API", slug: "lap-trinh-web" };
      const fallbackTitle = fileName.replace(/\.[^/.]+$/, "");
      const fallbackSlug = toUrlSlug(fallbackTitle);

      const primaryDist: SubjectDistribution = {
        subjectId: fallbackSubject.id,
        subjectName: fallbackSubject.name,
        domainId: fallbackDomain.id,
        domainName: fallbackDomain.name,
        domainSlug: fallbackDomain.slug,
        percentage: 80,
        color: getDomainColor(fallbackDomain.id),
        matchedKeywords: [fallbackSubject.name],
      };

      return {
        fileName,
        fileSizeBytes,
        totalCharacters,
        totalWords,
        suggestedTitle: fallbackTitle,
        canonicalSlug: fallbackSlug,
        refLink: `https://elis.edu.vn/materials/${fallbackDomain.slug}/${fallbackSubject.slug}/${fallbackSlug}`,
        distributions: [primaryDist],
        isMultiSubject: false,
        primarySubject: primaryDist,
        detectedModules: [
          {
            id: "mod-1",
            index: 1,
            heading: "Tổng quan tài liệu",
            dominantSubjectId: fallbackSubject.id,
            dominantSubjectName: fallbackSubject.name,
            dominantDomainName: fallbackDomain.name,
            percentageInDoc: 100,
            wordCount: totalWords,
            previewSnippet: fullText.slice(0, 200),
          },
        ],
        splitMode: "integrated",
        allowedConcepts: ["Khái niệm tổng quan"],
        allowedJargons: ["Thuật ngữ kỹ thuật"],
        educationalAssessment: {
          isLearningMaterial: true,
          materialType: "general_document",
          materialTypeLabel: "Tài Liệu Tổng Hợp",
          confidenceScore: 70,
          reasoning: "Tài liệu được phân tích theo chế độ kết nối dự phòng.",
          recommendation: "Kiểm tra kết nối mạng và tài khoản Gemini để đạt độ chính xác tối ưu.",
          pedagogicalIndicators: {
            hasTheoreticalConcepts: true,
            hasInstructionalStructure: true,
            hasFormOrAdministrativeMarkers: false,
            matchedFormKeywords: [],
            matchedAcademicKeywords: [],
          },
        },
        isFallback: true,
      };
    }
  },
};
