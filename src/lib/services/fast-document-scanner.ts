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
  conciseReview: string;          // Đoạn review nội dung tổng quát súc tích, tối đa 30 từ
  keyKnowledgePoints: string[];   // Các gạch đầu dòng liệt kê kiến thức trong tệp
  suggestedLearningGoal: string;  // Mục tiêu cần đạt được AI đề xuất sẵn (nắm bắt trọn bộ kiến thức)
  pedagogicalIndicators: {
    hasTheoreticalConcepts: boolean;
    hasInstructionalStructure: boolean;
    hasFormOrAdministrativeMarkers: boolean;
    matchedFormKeywords: string[];
    matchedAcademicKeywords: string[];
  };
}

export interface RelatedSubjectTag {
  subjectId: string;
  subjectName: string;
  domainId: string;
  domainName: string;
  percentage: number;
  isPrimary: boolean;
  reason?: string;
  color: string;
}

export interface RelatedDomainTag {
  domainId: string;
  domainName: string;
  domainSlug: string;
  percentage: number;
  isPrimary: boolean;
  reason?: string;
  color: string;
}

export interface FastScanResult {
  fileName: string;
  fileSizeBytes: number;
  totalCharacters: number;
  totalWords: number;
  suggestedTitle: string;
  canonicalSlug: string;
  refLink: string;
  relatedDomains: RelatedDomainTag[];
  relatedSubjects: RelatedSubjectTag[];
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

function truncateToMaxWords(str: string, maxWords: number = 30): string {
  if (!str) return "";
  const words = str.trim().split(/\s+/);
  if (words.length <= maxWords) return str;
  return words.slice(0, maxWords).join(" ") + "...";
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
Nhiệm vụ của bạn là đọc hiểu TOÀN BỘ văn bản tài liệu được tải lên, thẩm định học thuật và bóc tách cấu trúc đa nhãn (Multi-label) chuẩn hóa để đưa vào Cây Tri Thức CSDL Supabase.

DANH SÁCH NHÓM NGÀNH HỢP LỆ (DOMAINS TRÊN SUPABASE):
${domainList}

DANH SÁCH MÔN HỌC HỢP LỆ (SUBJECTS TRÊN SUPABASE):
${subjectList}

QUY TẮC THẨM ĐỊNH BẮT BUỘC (TUYỆT ĐỐI TUÂN THỦ):
1. Đánh giá tính học thuật (isLearningMaterial):
   - Báo cáo thực tập tốt nghiệp, Khóa luận tốt nghiệp, Đồ án môn học, Chuyên đề kỹ thuật CÓ NỘI DUNG NGHIÊN CỨU/TRIỂN KHAI KỸ THUẬT (ví dụ: Chatbot RAG, Xây dựng phần mềm, Hệ thống AI, Xử lý dữ liệu, Machine Learning...) LÀ TÀI LIỆU HỌC THUẬT HỢP LỆ (isLearningMaterial: true, materialType: "thesis_research").
   - Chỉ đánh giá isLearningMaterial: false nếu tài liệu là biểu mẫu hành chính thuần túy, phiếu chấm điểm trống, biên bản họp, không chứa kiến thức kỹ thuật/khoa học.
2. Tiêu đề chuẩn hóa (suggestedTitle):
   - Trích xuất tiêu đề chính xác của đề tài/bài học có dấu tiếng Việt chuẩn (ví dụ: "Nghiên cứu và Xây dựng Hệ thống Chatbot Hỏi Đáp Đa Tài Liệu Dựa Trên RAG"). Không dùng tên file chung chung.
3. Đoạn review súc tích (conciseReview):
   - BẮT BUỘC TỐI ĐA 30 TỪ: Viết một đoạn ngắn gọn tổng quát về nội dung tài liệu, đầy đủ ý chính nhưng không lan man (ví dụ: "Báo cáo nghiên cứu kiến trúc RAG, phương pháp hybrid retrieval và kỹ thuật tích hợp LLM nhằm xây dựng chatbot hỏi đáp văn bản chính xác.").
4. Danh sách kiến thức cốt lõi (keyKnowledgePoints):
   - Mảng 4-6 chuỗi liệt kê các kiến thức cốt lõi có trong tệp, ngắn gọn (ví dụ: ["Kiến trúc RAG (Retrieval-Augmented Generation)", "Vector Database & Kỹ thuật Embedding", "Hybrid Search (Keyword + Semantic)", "Mô hình ngôn ngữ lớn (LLM)"]). KHÔNG viết dấu '-' ở đầu chuỗi.
5. Mục tiêu cần đạt AI đề xuất (suggestedLearningGoal):
   - Một câu súc tích xác định mục tiêu nắm bắt trọn bộ kiến thức cốt lõi của tài liệu (ví dụ: "Nắm vững toàn diện kiến trúc RAG, cơ chế truy vấn dữ liệu ngữ nghĩa và quy trình triển khai chatbot thông minh.").
6. Phân loại Đa Nhãn Ngành và Môn học (Multi-label):
   - relatedDomains: Liệt kê các Nhóm Ngành liên quan (1 - 3 ngành), chỉ định isPrimary cho ngành chính và tỷ lệ phần trăm % (tổng = 100%).
   - relatedSubjects: Liệt kê các Môn Học liên quan (1 - 4 môn), chỉ định isPrimary cho môn học cốt lõi nhất và tỷ lệ phần trăm % tương ứng (ví dụ: 65% Trí Tuệ Nhân Tạo & Học Máy, 20% Kiến Trúc Phần Mềm, 15% Phát Triển Web & API).
7. Khái niệm cốt lõi (allowedConcepts) & Bẫy thuật ngữ (allowedJargons):
   - Bóc tách 5-8 khái niệm cốt lõi thực tế xuất hiện trong văn bản.
   - Bóc tách 4-6 thuật ngữ chuyên sâu cần giải thích.
8. Cấu trúc chương mục (detectedChapters):
   - Trích xuất 3-6 chương mục chính có trong văn bản kèm subjectId của môn học phụ trách chương đó (ví dụ: Chương lý thuyết thuộc AI, Chương triển khai thuộc Phần mềm/Web).

HÃY TRẢ VỀ DUY NHẤT ĐỊNH DẠNG JSON NHƯ SAU (không bọc markdown \`\`\`json hoặc text phụ):
{
  "isLearningMaterial": boolean,
  "materialType": "thesis_research" | "lecture" | "textbook" | "exercise_exam" | "administrative_form" | "general_document",
  "materialTypeLabel": string,
  "confidenceScore": number,
  "conciseReview": string,
  "keyKnowledgePoints": string[],
  "suggestedLearningGoal": string,
  "reasoning": string,
  "recommendation": string,
  "suggestedTitle": string,
  "relatedDomains": [
    { "domainId": string, "percentage": number, "isPrimary": boolean, "reason": string }
  ],
  "relatedSubjects": [
    { "subjectId": string, "percentage": number, "isPrimary": boolean, "reason": string }
  ],
  "summary": string,
  "allowedConcepts": string[],
  "allowedJargons": string[],
  "detectedChapters": [
    { "heading": string, "subjectId": string, "percentage": number }
  ]
}

NỘI DUNG VĂN BẢN TÀI LIỆU:
${textSnippet}`;

    SystemLogger.info(
      "AGENT_EXTRACTION",
      "START_GEMINI_SCAN",
      `Khởi động Tác nhân Gemini (gemini-3.1-flash-lite) để bóc tách tệp [${fileName}] (${totalWords} từ)`
    );

    console.log(
      "%c[GEMINI AI INSPECTION AGENT] 🚀 Đang gửi văn bản đến Gemini LLM (gemini-3.1-flash-lite) để bóc tách đa nhãn...",
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
          relatedDomains: aiData.relatedDomains,
          relatedSubjects: aiData.relatedSubjects,
          isLearning: aiData.isLearningMaterial,
          type: aiData.materialTypeLabel,
        }
      );

      // Xử lý danh sách Ngành liên quan (relatedDomains)
      const rawDomains = Array.isArray(aiData.relatedDomains) ? aiData.relatedDomains : [];
      const relatedDomains: RelatedDomainTag[] = [];
      rawDomains.forEach((rd: any, idx: number) => {
        const dom = domains.find((d) => d.id === rd.domainId);
        if (dom && !relatedDomains.some((d) => d.domainId === dom.id)) {
          relatedDomains.push({
            domainId: dom.id,
            domainName: dom.name,
            domainSlug: dom.slug,
            percentage: Number(rd.percentage) || (idx === 0 ? 60 : 40),
            isPrimary: Boolean(rd.isPrimary ?? idx === 0),
            reason: rd.reason || "",
            color: getDomainColor(dom.id),
          });
        }
      });
      if (relatedDomains.length === 0) {
        const fallbackDom = domains[0] || { id: "dom-it", name: "Công Nghệ Thông Tin", slug: "cong-nghe-thong-tin" };
        relatedDomains.push({
          domainId: fallbackDom.id,
          domainName: fallbackDom.name,
          domainSlug: fallbackDom.slug,
          percentage: 100,
          isPrimary: true,
          color: getDomainColor(fallbackDom.id),
        });
      }

      // Xử lý danh sách Môn học liên quan (relatedSubjects)
      const rawSubjects = Array.isArray(aiData.relatedSubjects) ? aiData.relatedSubjects : [];
      const relatedSubjects: RelatedSubjectTag[] = [];
      rawSubjects.forEach((rs: any, idx: number) => {
        const sub = subjects.find((s) => s.id === rs.subjectId);
        if (sub && !relatedSubjects.some((s) => s.subjectId === sub.id)) {
          const dom = domains.find((d) => d.id === sub.domainId) || domains[0];
          relatedSubjects.push({
            subjectId: sub.id,
            subjectName: sub.name,
            domainId: dom.id,
            domainName: dom.name,
            percentage: Number(rs.percentage) || (idx === 0 ? 70 : 30),
            isPrimary: Boolean(rs.isPrimary ?? idx === 0),
            reason: rs.reason || "",
            color: getDomainColor(dom.id),
          });
        }
      });
      if (relatedSubjects.length === 0) {
        const fallbackSub = subjects[0] || { id: "sub-cs-ai-ml", name: "Trí Tuệ Nhân Tạo & Học Máy", domainId: "dom-cs" };
        const dom = domains.find((d) => d.id === fallbackSub.domainId) || domains[0];
        relatedSubjects.push({
          subjectId: fallbackSub.id,
          subjectName: fallbackSub.name,
          domainId: dom.id,
          domainName: dom.name,
          percentage: 100,
          isPrimary: true,
          color: getDomainColor(dom.id),
        });
      }

      // Chọn Primary Subject & Domain
      const primarySubjectTag = relatedSubjects.find((s) => s.isPrimary) || relatedSubjects[0];
      let primarySub = subjects.find((s) => s.id === primarySubjectTag.subjectId) || subjects[0];
      let primaryDom = domains.find((d) => d.id === primarySub.domainId) || domains.find((d) => d.id === primarySubjectTag.domainId) || domains[0];

      const primaryDistribution: SubjectDistribution = {
        subjectId: primarySub.id,
        subjectName: primarySub.name,
        domainId: primaryDom.id,
        domainName: primaryDom.name,
        domainSlug: primaryDom.slug,
        percentage: primarySubjectTag.percentage,
        color: getDomainColor(primaryDom.id),
        matchedKeywords: aiData.allowedConcepts ? aiData.allowedConcepts.slice(0, 4) : [primarySub.name],
      };

      const distributions: SubjectDistribution[] = relatedSubjects.map((s) => ({
        subjectId: s.subjectId,
        subjectName: s.subjectName,
        domainId: s.domainId,
        domainName: s.domainName,
        domainSlug: domains.find((d) => d.id === s.domainId)?.slug || "general",
        percentage: s.percentage,
        color: s.color,
        matchedKeywords: [s.subjectName],
      }));

      const secondarySubjectTag = relatedSubjects.length > 1 ? relatedSubjects[1] : undefined;
      let secondaryDistribution: SubjectDistribution | undefined;
      if (secondarySubjectTag) {
        const secSub = subjects.find((s) => s.id === secondarySubjectTag.subjectId) || primarySub;
        const secDom = domains.find((d) => d.id === secSub.domainId) || primaryDom;
        secondaryDistribution = {
          subjectId: secSub.id,
          subjectName: secSub.name,
          domainId: secDom.id,
          domainName: secDom.name,
          domainSlug: secDom.slug,
          percentage: secondarySubjectTag.percentage,
          color: getDomainColor(secDom.id),
          matchedKeywords: aiData.allowedJargons ? aiData.allowedJargons.slice(0, 3) : [secSub.name],
        };
      }

      const suggestedTitle = aiData.suggestedTitle?.trim() || fileName.replace(/\.[^/.]+$/, "");
      const canonicalSlug = toUrlSlug(suggestedTitle);
      const refLink = `https://elis.edu.vn/materials/${primaryDom.slug}/${primarySub.slug}/${canonicalSlug}`;

      // Xử lý các chương mục và gán đúng môn học
      const rawChapters = Array.isArray(aiData.detectedChapters) && aiData.detectedChapters.length > 0
        ? aiData.detectedChapters
        : ["Đặt vấn đề & Cơ sở lý thuyết", "Kiến trúc hệ thống", "Triển khai & Đánh giá thực nghiệm"];

      const detectedModules: DetectedChapterModule[] = rawChapters.map((ch: any, idx: number) => {
        const headingStr = typeof ch === "string" ? ch : ch.heading || `Chương ${idx + 1}`;
        const targetSubId = typeof ch === "object" && ch.subjectId ? ch.subjectId : primarySub.id;
        const subObj = subjects.find((s) => s.id === targetSubId) || primarySub;
        const domObj = domains.find((d) => d.id === subObj.domainId) || primaryDom;
        const pct = typeof ch === "object" && ch.percentage ? Number(ch.percentage) : Math.round(100 / rawChapters.length);

        return {
          id: `mod-${idx + 1}`,
          index: idx + 1,
          heading: headingStr,
          dominantSubjectId: subObj.id,
          dominantSubjectName: subObj.name,
          dominantDomainName: domObj.name,
          percentageInDoc: pct,
          wordCount: Math.round((totalWords * pct) / 100),
          previewSnippet: `${headingStr}: Nội dung học thuật chuyên sâu thuộc môn ${subObj.name}.`,
        };
      });

      const rawScore = Number(aiData.confidenceScore) || 95;
      const confidenceScore = rawScore <= 1 ? Math.round(rawScore * 100) : Math.round(rawScore);

      const conciseReview = truncateToMaxWords(
        aiData.conciseReview || aiData.reasoning || "Tài liệu học thuật cung cấp nội dung nghiên cứu và triển khai chuyên sâu.",
        30
      );

      const keyKnowledgePoints = Array.isArray(aiData.keyKnowledgePoints) && aiData.keyKnowledgePoints.length > 0
        ? aiData.keyKnowledgePoints.map((p: any) => String(p).replace(/^[-*•\s]+/, "").trim()).filter(Boolean)
        : (aiData.allowedConcepts && aiData.allowedConcepts.length > 0
            ? aiData.allowedConcepts.slice(0, 5)
            : ["Kiến thức chuyên môn"]);

      const suggestedLearningGoal = aiData.suggestedLearningGoal?.trim() || "Nắm bắt trọn bộ kiến thức cốt lõi, phương pháp luận và kỹ thuật triển khai thực tế của tài liệu.";

      const educationalAssessment: EducationalAssessment = {
        isLearningMaterial: Boolean(aiData.isLearningMaterial),
        materialType: aiData.materialType || (aiData.isLearningMaterial ? "thesis_research" : "administrative_form"),
        materialTypeLabel: aiData.materialTypeLabel || (aiData.isLearningMaterial ? "Tài Liệu Học Thuật" : "Biểu Mẫu Hành Chính"),
        confidenceScore,
        reasoning: aiData.reasoning || (aiData.isLearningMaterial ? "Tài liệu đạt chuẩn học thuật." : "Tài liệu biểu mẫu hành chính."),
        recommendation: aiData.recommendation || "Sẵn sàng trích xuất bài giảng chuẩn Feynman.",
        conciseReview,
        keyKnowledgePoints,
        suggestedLearningGoal,
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
        `Đã bóc tách thành công [${fileName}] qua Gemini: [${primarySub.name}] (${primaryDistribution.percentage}%), Chuẩn học thuật: ${aiData.isLearningMaterial}`
      );

      return {
        fileName,
        fileSizeBytes,
        totalCharacters,
        totalWords,
        suggestedTitle,
        canonicalSlug,
        refLink,
        relatedDomains,
        relatedSubjects,
        distributions,
        isMultiSubject: relatedSubjects.length > 1,
        primarySubject: primaryDistribution,
        secondarySubject: secondaryDistribution,
        detectedModules,
        splitMode: relatedSubjects.length > 1 ? "split" : "integrated",
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
        relatedDomains: [
          {
            domainId: fallbackDomain.id,
            domainName: fallbackDomain.name,
            domainSlug: fallbackDomain.slug,
            percentage: 100,
            isPrimary: true,
            color: getDomainColor(fallbackDomain.id),
          },
        ],
        relatedSubjects: [
          {
            subjectId: fallbackSubject.id,
            subjectName: fallbackSubject.name,
            domainId: fallbackDomain.id,
            domainName: fallbackDomain.name,
            percentage: 100,
            isPrimary: true,
            color: getDomainColor(fallbackDomain.id),
          },
        ],
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
          conciseReview: "Tài liệu học thuật tổng hợp được phân tích tự động theo chế độ dự phòng an toàn.",
          keyKnowledgePoints: [
            "Kiến thức cốt lõi chuyên ngành",
            "Mô hình và phương pháp luận kỹ thuật",
            "Kỹ năng thực hành và triển khai thực nghiệm",
          ],
          suggestedLearningGoal: "Nắm bắt trọn bộ kiến thức cốt lõi và các kỹ năng kỹ thuật chính trong tài liệu.",
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
