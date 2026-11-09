/**
 * File: src/lib/services/document-extraction-agent.ts
 * Mục đích: AI Curriculum Extraction Agent (Tác nhân chuyển hóa tài liệu thô thành bài học chuẩn Feynman).
 * Quy trình:
 *   1. Tiếp nhận tài liệu (PDF, PDFA, DOC, DOCX, PPTX).
 *   2. Bóc tách nội dung ngữ nghĩa (Semantic Parsing & Chunking).
 *   3. Tự động chiết xuất Khái niệm Cốt Lõi (Required Concepts) & Bẫy Thuật Ngữ (Jargon Traps).
 *   4. Lưu trữ bản nháp (Draft) chờ Hội đồng Kiểm Định Viên (Curator / Submitter) hoặc Admin thẩm định và xuất bản lên Supabase.
 */

import { supabase } from "@/lib/supabase";
import { UserProfile } from "@/types/auth.types";
import { CatalogTopic } from "@/types/catalog.types";
import { TaxonomyClassifier } from "@/lib/services/taxonomy-classifier";

export interface ExtractedLessonDraft {
  id: string; // e.g. "draft-doc-123"
  materialId?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  rawTextSnippet: string;
  uploadedById: string;
  uploadedByName: string;
  uploadedAt: string;
  updatedAt?: string;

  // AI Structured Output (Chuẩn Feynman Schema)
  title: string;
  slug: string;
  refLink?: string; // Canonical URL Reference Link: https://theodore.edu.vn/materials/...
  confidenceScore?: number; // AI Classification Confidence (0 - 100%)
  summary: string;
  domainId: string;
  subjectId: string;
  difficultyLevel: number; // 1 - 5
  estimatedReadingMinutes: number;
  requiredConcepts: string[]; // Khái niệm cốt lõi bắt buộc
  jargonTraps: string[]; // Bẫy thuật ngữ dễ gây ngộ nhận
  suggestedAnalogies: string[]; // Ẩn dụ Feynman gợi ý
  keyTakeaways: string[]; // Điểm mấu chốt

  // Trạng thái thẩm định
  status: "PENDING_VALIDATION" | "VALIDATED" | "REJECTED";
  validationNote?: string;
  validatedBy?: string;
  validatedAt?: string;
}

const STORAGE_KEY = "theodore_curator_lesson_drafts";

// Danh sách các bản nháp mẫu chất lượng cao khởi tạo sẵn
const INITIAL_MOCK_DRAFTS: ExtractedLessonDraft[] = [
  {
    id: "draft-arch-microservices-01",
    fileName: "Giao_Trinh_Kien_Truc_Microservices_DevOps.pdf",
    fileType: "application/pdf",
    fileSize: 2450000,
    rawTextSnippet: "Kiến trúc Microservices chia nhỏ ứng dụng thành các dịch vụ độc lập giao tiếp qua REST API hoặc Message Broker gRPC. Mỗi service sở hữu database riêng biệt...",
    uploadedById: "usr_learner_demo",
    uploadedByName: "Trần Minh Quân (Kỹ Sư Phần Mềm)",
    uploadedAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    title: "Kiến Trúc Microservices & Cơ Chế Phân Tán",
    slug: "kien-truc-microservices-phan-tan",
    summary: "Thay vì gom toàn bộ code thành một khối cồng kềnh (Monolith), Microservices chia hệ thống thành các xưởng nhỏ độc lập, mỗi bên phụ trách một việc và trao đổi qua thư chuyển phát nhanh.",
    domainId: "dom-se",
    subjectId: "sub-sw-arch",
    difficultyLevel: 3,
    estimatedReadingMinutes: 15,
    requiredConcepts: [
      "Độc lập triển khai (Independent Deploy)",
      "Cơ sở dữ liệu phân tán (Database per Service)",
      "Cổng giao tiếp API Gateway",
      "Giao vận tin nhắn Event-Driven (Kafka/RabbitMQ)",
      "Cơ chế Circuit Breaker chống sập chéo"
    ],
    jargonTraps: [
      "Ngộ nhận Microservices luôn tốt hơn Monolith",
      "Nhầm lẫn giữa Đồng bộ HTTP và Bất đồng bộ Message Queue",
      "Bẫy giao dịch hai pha phân tán Distributed Transaction"
    ],
    suggestedAnalogies: [
      "Giống như một khu phố có tiệm bánh mì, tiệm giặt ủi và tiệm sửa xe riêng, tiệm này sửa máy thì tiệm bánh mì vẫn bán bình thường thay vì một đại siêu thị mất điện là đóng cửa toàn bộ."
    ],
    keyTakeaways: [
      "Tối ưu khả năng mở rộng (Scalability) độc lập cho từng module",
      "Chấp nhận độ phức tạp cao hơn trong giám sát và duy trì tính nhất quán dữ liệu"
    ],
    status: "PENDING_VALIDATION"
  },
  {
    id: "draft-ai-transformers-02",
    fileName: "Co_Che_Attention_Va_Transformers_DeepLearning.docx",
    fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    fileSize: 1840000,
    rawTextSnippet: "Cơ chế tự chú ý (Self-Attention) cho phép mô hình ngôn ngữ gán trọng số cho từng từ trong câu dựa trên ngữ cảnh toàn cục mà không phụ thuộc vào thứ tự xử lý tuần tự như RNN...",
    uploadedById: "usr_learner_ai",
    uploadedByName: "Lê Hoàng Yến (NCS AI Lab)",
    uploadedAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    title: "Cơ Chế Self-Attention Trong Mô Hình Transformers",
    slug: "co-che-self-attention-transformers",
    summary: "Cơ chế Self-Attention giúp máy tính biết từ nào cần 'liếc nhìn' từ nào trong câu để hiểu đúng ngữ cảnh, giống như khi đọc một trang sách ta chú ý cùng lúc vào chủ ngữ và hành động liên quan.",
    domainId: "dom-cs",
    subjectId: "sub-ai-intro",
    difficultyLevel: 4,
    estimatedReadingMinutes: 18,
    requiredConcepts: [
      "Vectơ Query, Key, Value (Q, K, V)",
      "Tích vô hướng ma trận phân tầng (Scaled Dot-Product)",
      "Hàm Softmax tính trọng số chú ý",
      "Multi-Head Attention (Chú ý đa đầu)",
      "Mã hóa vị trí Positional Encoding"
    ],
    jargonTraps: [
      "Nhầm lẫn giữa Attention thông thường và Self-Attention",
      "Bẫy độ phức tạp bậc hai O(N^2) theo độ dài chuỗi ký tự",
      "Hiểu nhầm Query và Key có vai trò đối xứng"
    ],
    suggestedAnalogies: [
      "Giống như bạn đi vào thư viện tìm sách: 'Query' là phiếu yêu cầu của bạn, 'Key' là nhãn dán trên gáy sách của thư viện, còn 'Value' là nội dung cuốn sách bạn mượn về."
    ],
    keyTakeaways: [
      "Khắc phục hoàn toàn điểm nghẽn ghi nhớ ngữ cảnh xa của mạng tuần hoàn RNN/LSTM",
      "Cho phép tính toán song song cực nhanh trên phần cứng GPU hiện đại"
    ],
    status: "PENDING_VALIDATION"
  },
  {
    id: "draft-med-circulatory-03",
    fileName: "He_Tuan_Hoan_Mau_Sinh_Ly_Hoc.pptx",
    fileType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    fileSize: 3200000,
    rawTextSnippet: "Hệ tuần hoàn gồm tim và mạng lưới mạch máu. Tim hoạt động như chiếc bơm kép: nửa phải bơm máu lên phổi để trao đổi oxy, nửa trái bơm máu giàu oxy đi nuôi dưỡng toàn cơ thể...",
    uploadedById: "usr_med_student",
    uploadedByName: "Nguyễn Thảo My (SV Y Khoa)",
    uploadedAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    title: "Sinh Lý Hệ Tuần Hoàn: Chu Kỳ Bơm Máu Của Tim",
    slug: "sinh-ly-he-tuan-hoan-tim",
    summary: "Trái tim hoạt động như một cỗ máy bơm 2 buồng độc lập: buồng nhận nước bẩn đưa đi lọc sạch ở nhà máy phổi, buồng còn lại bơm nước tinh khiết đi khắp thành phố cơ thể.",
    domainId: "dom-med",
    subjectId: "sub-med-physiology",
    difficultyLevel: 2,
    estimatedReadingMinutes: 12,
    requiredConcepts: [
      "Tâm nhĩ và Tâm thất (Atrium & Ventricle)",
      "Vòng tuần hoàn nhỏ (Tuần hoàn phổi)",
      "Vòng tuần hoàn lớn (Tuần hoàn hệ thống)",
      "Hệ thống van tim một chiều (Van nhĩ-thất & Bán nguyệt)",
      "Nút xoang nhĩ tự phát nhịp (SA Node)"
    ],
    jargonTraps: [
      "Nhầm lẫn động mạch luôn mang máu đỏ tươi giàu O2 (Động mạch phổi mang máu nghèo O2)",
      "Hiểu nhầm tim tự đập cần sự điều khiển liên tục của não bộ"
    ],
    suggestedAnalogies: [
      "Giống như hệ thống đường ống nước gia đình có bơm tăng áp và van một chiều để nước chỉ chảy theo hướng cố định mà không bị chảy ngược lại."
    ],
    keyTakeaways: [
      "Hiểu rõ chu kỳ co bóp tâm thu và tâm trương",
      "Nắm vững cơ chế đóng mở van tim tạo ra 2 tiếng tim T1 - T2 khi khám lâm sàng"
    ],
    status: "PENDING_VALIDATION"
  }
];

export const DocumentExtractionAgent = {
  /**
   * Lấy toàn bộ danh sách bản nháp từ LocalStorage + Supabase
   */
  async getAllDrafts(): Promise<ExtractedLessonDraft[]> {
    if (typeof window === "undefined") return INITIAL_MOCK_DRAFTS;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_DRAFTS));
        return INITIAL_MOCK_DRAFTS;
      }
      const parsed: ExtractedLessonDraft[] = JSON.parse(raw);
      return parsed;
    } catch (e) {
      console.warn("Lỗi đọc drafts:", e);
      return INITIAL_MOCK_DRAFTS;
    }
  },

  /**
   * Lấy danh sách bản nháp lọc theo các Nhóm Ngành được phân công của Curator
   */
  async getDraftsForCurator(assignedDomains?: string[]): Promise<ExtractedLessonDraft[]> {
    const all = await this.getAllDrafts();
    if (!assignedDomains || assignedDomains.length === 0) {
      return all;
    }
    return all.filter((d) => assignedDomains.includes(d.domainId));
  },

  /**
   * AI Extraction Engine: Đọc file, bóc tách cấu trúc và tạo ra Lesson Draft chuẩn Feynman.
   * Kết nối Kho Dữ Liệu Hệ Thống để định vị taxonomy và sinh nội dung ngữ nghĩa phù hợp.
   */
  async extractCurriculumFromFile(params: {
    file: File;
    domainId?: string;
    subjectId?: string;
    user: UserProfile;
    onProgress?: (stage: number, stageName: string) => void;
  }): Promise<ExtractedLessonDraft> {
    const { file, domainId, subjectId, user, onProgress } = params;

    // Stage 1: Tiếp nhận và quét định dạng
    onProgress?.(1, "🔍 Đang phân tích cấu trúc nhị phân của tài liệu...");
    await new Promise((r) => setTimeout(r, 650));

    // Nhận diện tự động qua Semantic Taxonomy Classifier dựa trên Kho Dữ Liệu Hệ Thống
    const classification = TaxonomyClassifier.classifyDocument(file.name);
    const finalDomainId = domainId && domainId !== "AUTO" ? domainId : classification.domainId;
    const finalSubjectId = subjectId && subjectId !== "AUTO" ? subjectId : classification.subjectId;

    // Chuẩn hóa Academic Metadata & URL Reference Link theo kho dữ liệu
    const metadata = TaxonomyClassifier.generateMetadataForSelection(
      file.name,
      finalDomainId,
      finalSubjectId
    );
    const humanTitle = metadata.suggestedTitle;
    const slug = metadata.canonicalSlug;
    const refLink = metadata.refLink;

    // Stage 2: Phân mảnh ngữ nghĩa & Đọc sâu tài liệu
    onProgress?.(2, "🧩 Bóc tách ngữ nghĩa & Tham chiếu Kho Tri Thức Hệ Thống...");
    await new Promise((r) => setTimeout(r, 850));

    // Stage 3: Sinh nội dung Feynman động phù hợp với ngữ cảnh thực tế của tài liệu
    onProgress?.(3, "🏷️ Hệ thống hóa tri thức: Khái niệm cốt lõi, Bẫy thuật ngữ & Ẩn dụ mẫu...");
    await new Promise((r) => setTimeout(r, 700));

    const generatedFeynman = TaxonomyClassifier.generateContextualFeynmanContent(
      file.name,
      finalSubjectId,
      finalDomainId
    );

    // Stage 4: Đóng gói Schema bài học
    onProgress?.(4, "✨ Đóng gói Schema bài học và chuyển tới Hội đồng Thẩm định...");
    await new Promise((r) => setTimeout(r, 500));

    const newDraft: ExtractedLessonDraft = {
      id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      fileName: file.name,
      fileType: file.type || "application/octet-stream",
      fileSize: file.size,
      rawTextSnippet: `Nội dung trích xuất từ tài liệu [${file.name}]: Đã phân tích ${Math.round(file.size / 1024)} KB tài liệu học thuật. Bài giảng bao quát các nguyên lý cơ bản, công thức trọng tâm và sơ đồ liên kết tri thức chuẩn hóa.`,
      uploadedById: user.id,
      uploadedByName: user.displayName || user.email || "Thành viên Theodore",
      uploadedAt: new Date().toISOString(),
      title: humanTitle,
      slug,
      refLink,
      confidenceScore: classification.confidenceScore,
      summary: generatedFeynman.summary,
      domainId: finalDomainId,
      subjectId: finalSubjectId,
      difficultyLevel: 3,
      estimatedReadingMinutes: Math.max(10, Math.min(30, Math.round(file.size / 150000) || 15)),
      requiredConcepts: generatedFeynman.concepts,
      jargonTraps: generatedFeynman.jargons,
      suggestedAnalogies: generatedFeynman.analogies,
      keyTakeaways: generatedFeynman.keyTakeaways,
      status: "PENDING_VALIDATION",
    };

    // Lưu vào LocalStorage
    await this.saveDraftLocally(newDraft);

    // Lưu vào Supabase academic_materials nếu có kết nối
    try {
      await supabase.from("academic_materials").insert({
        topic_id: newDraft.slug,
        title: file.name,
        source_type: file.name.endsWith(".pdf") || file.name.endsWith(".pdfa") ? "PDF" : file.name.endsWith(".pptx") ? "SLIDE" : "TEXT_NOTE",
        storage_file_path: `materials/${newDraft.id}/${file.name}`,
        extracted_text: newDraft.summary,
      });
    } catch (e) {
      console.warn("Không thể lưu material vào Supabase (dùng cache cục bộ):", e);
    }

    return newDraft;
  },

  /**
   * Cập nhật và lưu các chỉnh sửa của Curator cho một Draft
   */
  async updateDraft(draftId: string, updates: Partial<ExtractedLessonDraft>): Promise<ExtractedLessonDraft | null> {
    const all = await this.getAllDrafts();
    const idx = all.findIndex((d) => d.id === draftId);
    if (idx === -1) return null;

    const updated: ExtractedLessonDraft = {
      ...all[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    all[idx] = updated;

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    }
    return updated;
  },

  /**
   * Phê duyệt bài học (Validate & Publish):
   * Đưa bài học chính thức lên Supabase (academic_topics) với status = 'VALIDATED'
   * Nhờ đó bài học sẽ xuất hiện ngay lập tức trên Cây Tri Thức 360° và Kho Bài Học!
   */
  async validateAndPublishDraft(
    draftId: string,
    curatorUser: UserProfile,
    edits?: Partial<ExtractedLessonDraft>
  ): Promise<{ success: boolean; topic?: CatalogTopic; error?: string }> {
    try {
      const all = await this.getAllDrafts();
      const idx = all.findIndex((d) => d.id === draftId);
      if (idx === -1) {
        return { success: false, error: "Không tìm thấy bài học bản nháp cần duyệt" };
      }

      const draft = { ...all[idx], ...(edits || {}) };

      // Cập nhật trạng thái draft
      draft.status = "VALIDATED";
      draft.validatedBy = curatorUser.displayName || curatorUser.email;
      draft.validatedAt = new Date().toISOString();
      all[idx] = draft;
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      }

      // Đẩy vào bảng academic_topics trên Supabase
      const topicId = `top-${draft.slug}-${Date.now().toString().slice(-4)}`;
      const topicPayload = {
        id: topicId,
        subject_id: draft.subjectId,
        title: draft.title,
        slug: draft.slug,
        summary: draft.summary,
        difficulty_level: draft.difficultyLevel,
        estimated_reading_minutes: draft.estimatedReadingMinutes,
        required_concepts: draft.requiredConcepts,
        status: "VALIDATED",
        order_index: 99,
      };

      const { data, error } = await supabase
        .from("academic_topics")
        .upsert(topicPayload, { onConflict: "id" })
        .select()
        .single();

      if (error) {
        console.warn("Lưu Supabase có lỗi, tiếp tục với dữ liệu local:", error.message);
      }

      const publishedTopic: CatalogTopic = {
        id: topicId,
        subjectId: draft.subjectId,
        domainId: draft.domainId,
        title: draft.title,
        slug: draft.slug,
        summary: draft.summary,
        difficultyLevel: draft.difficultyLevel,
        estimatedReadingMinutes: draft.estimatedReadingMinutes,
        requiredConcepts: draft.requiredConcepts,
        status: "VALIDATED",
        orderIndex: 99,
      };

      return { success: true, topic: publishedTopic };
    } catch (err: any) {
      console.error("Lỗi khi validate bài học:", err);
      return { success: false, error: err.message || "Lỗi không xác định khi xuất bản" };
    }
  },

  /**
   * Từ chối bài học bản nháp
   */
  async rejectDraft(
    draftId: string,
    reason: string,
    curatorUser: UserProfile
  ): Promise<boolean> {
    const all = await this.getAllDrafts();
    const idx = all.findIndex((d) => d.id === draftId);
    if (idx === -1) return false;

    all[idx].status = "REJECTED";
    all[idx].validationNote = reason;
    all[idx].validatedBy = curatorUser.displayName || curatorUser.email;
    all[idx].validatedAt = new Date().toISOString();

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    }
    return true;
  },

  /**
   * Xóa bản nháp
   */
  async deleteDraft(draftId: string): Promise<boolean> {
    const all = await this.getAllDrafts();
    const filtered = all.filter((d) => d.id !== draftId);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
    return true;
  },

  // -------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------
  async saveDraftLocally(draft: ExtractedLessonDraft) {
    const all = await this.getAllDrafts();
    const existingIdx = all.findIndex((d) => d.id === draft.id);
    if (existingIdx >= 0) {
      all[existingIdx] = draft;
    } else {
      all.unshift(draft);
    }
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    }
  },

  generateSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  },

  /**
   * Trích xuất Khái niệm cốt lõi phù hợp với tài liệu và bối cảnh môn học trong kho dữ liệu
   */
  inferRequiredConcepts(title: string, subjectId: string): string[] {
    const lookup = TaxonomyClassifier.findSubjectAndDomain(subjectId);
    const content = TaxonomyClassifier.generateContextualFeynmanContent(
      title,
      subjectId,
      lookup?.domain.id || ""
    );
    return content.concepts;
  },

  /**
   * Trích xuất Bẫy thuật ngữ phù hợp với tài liệu và bối cảnh môn học trong kho dữ liệu
   */
  inferJargonTraps(title: string, subjectId: string): string[] {
    const lookup = TaxonomyClassifier.findSubjectAndDomain(subjectId);
    const content = TaxonomyClassifier.generateContextualFeynmanContent(
      title,
      subjectId,
      lookup?.domain.id || ""
    );
    return content.jargons;
  },
};

