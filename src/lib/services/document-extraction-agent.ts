/**
 * File: src/lib/services/document-extraction-agent.ts
 * Mục đích: AI Curriculum Extraction Agent (Tác nhân chuyển hóa tài liệu thô thành bài học chuẩn Feynman).
 * Quy trình:
 *   1. Tiếp nhận tài liệu (DOCX, PDF, PPTX, TXT, MD, JSON).
 *   2. Bóc tách 100% văn bản thực tế từ tệp qua DocumentParser (sử dụng mammoth cho docx).
 *   3. Phân tích ngữ nghĩa chuyên sâu bằng Tác nhân Gemini (gemini-3.1-flash-lite) kết nối trực tiếp Supabase.
 *   4. Bóc tách ranh giới ý niệm (Semantic Chunking) & Tiền đề ngữ cảnh Anthropic Contextual Retrieval.
 *   5. Chiếu xạ Đồ thị Tri thức (Master Knowledge Graph Projection) trên Supabase để xác định vị trí tiên quyết.
 *   6. Đóng gói Lesson Draft chuẩn Feynman & Lưu trữ vào Supabase academic_materials.
 *   7. Ghi nhận toàn bộ sự kiện vào SystemLogger.
 */

import { supabase, supabaseAdmin } from "@/lib/supabase";
import { UserProfile } from "@/types/auth.types";
import { CatalogTopic } from "@/types/catalog.types";
import { TaxonomyClassifier } from "@/lib/services/taxonomy-classifier";
import { SemanticChunker, SemanticChunk, PedagogicalRole } from "@/lib/services/semantic-chunker";
import { OntologyProjector, OntologyProjectionResult } from "@/lib/services/ontology-projector";
import { DocumentParser } from "@/lib/services/document-parser";
import { GeminiCurriculumService } from "@/lib/services/gemini-service";
import { SystemLogger } from "@/lib/services/system-logger";

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
  refLink: string;
  confidenceScore: number;
  summary: string;
  domainId: string;
  subjectId: string;
  difficultyLevel: number;
  estimatedReadingMinutes: number;
  requiredConcepts: string[];
  jargonTraps: string[];
  suggestedAnalogies: string[];
  keyTakeaways: string[];

  // Hệ Thống Ranh Giới Ngữ Nghĩa & Đồ Thị Tri Thức Master
  pedagogicalRole: PedagogicalRole;
  pedagogicalRoleLabel: string;
  semanticChunks?: SemanticChunk[];
  ontologyAlignment?: OntologyProjectionResult;
  prerequisiteTopics?: Array<{ id: string; title: string; reason: string }>;
  suggestedRoadmapPosition?: string;

  // Trạng thái thẩm định
  status: "PENDING_VALIDATION" | "VALIDATED" | "REJECTED";
  validationNote?: string;
  validatedBy?: string;
  validatedAt?: string;
}

const STORAGE_KEY = "theodore_curator_lesson_drafts";

export const DocumentExtractionAgent = {
  /**
   * Lấy toàn bộ danh sách bản nháp từ LocalStorage và Supabase (Không dùng mock data)
   */
  async getAllDrafts(): Promise<ExtractedLessonDraft[]> {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed: ExtractedLessonDraft[] = JSON.parse(raw);
      return parsed;
    } catch (e: any) {
      SystemLogger.warn("AGENT_EXTRACTION", "GET_DRAFTS", `Lỗi đọc drafts: ${e.message}`);
      return [];
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
   * AI Extraction Engine: Đọc file thực tế, gọi Gemini LLM và tạo ra Lesson Draft chuẩn Feynman.
   */
  async extractCurriculumFromFile(params: {
    file: File | { name: string; buffer: Buffer; type?: string };
    domainId?: string;
    subjectId?: string;
    user: UserProfile;
    onProgress?: (stage: number, stageName: string) => void;
  }): Promise<ExtractedLessonDraft> {
    const { file, domainId, subjectId, user, onProgress } = params;
    const startTime = Date.now();
    const fileName = "name" in file ? file.name : "document";

    SystemLogger.info(
      "AGENT_EXTRACTION",
      "START_PIPELINE",
      `Bắt đầu quy trình bóc tách tài liệu học thuật cho tệp [${fileName}] bởi người dùng [${user.displayName || user.email}]`
    );

    // =========================================================================
    // Stage 1: Bóc tách văn bản thực tế từ nhị phân DOCX/PDF/TXT
    // =========================================================================
    onProgress?.(1, "🔍 Đang bóc tách toàn bộ văn bản thực tế từ tệp tài liệu...");
    const parsedDoc = await DocumentParser.parseDocument(file);

    // Đồng bộ taxonomy mới nhất từ Supabase
    const liveTaxonomy = await TaxonomyClassifier.syncSystemTaxonomy();

    // =========================================================================
    // Stage 2: Nhận diện học thuật & Sinh Feynman Schema bằng Gemini LLM
    // =========================================================================
    onProgress?.(2, "🧠 Tác nhân Gemini (gemini-3.1-flash-lite) đang phân tích học thuật & tạo Schema Feynman...");

    const availableDomains = liveTaxonomy.domains.map((d) => ({
      id: d.id,
      name: d.name,
      slug: d.slug,
      description: d.description,
    }));

    const availableSubjects = liveTaxonomy.subjects.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description,
      domainId: s.domainId,
    }));

    const geminiAnalysis = await GeminiCurriculumService.analyzeDocument({
      fileName: parsedDoc.fileName,
      documentText: parsedDoc.extractedText,
      availableDomains,
      availableSubjects,
    });

    const finalDomainId = domainId && domainId !== "AUTO" ? domainId : geminiAnalysis.domainId;
    const finalSubjectId = subjectId && subjectId !== "AUTO" ? subjectId : geminiAnalysis.subjectId;

    const metadata = TaxonomyClassifier.generateMetadataForSelection(
      parsedDoc.fileName,
      finalDomainId,
      finalSubjectId,
      parsedDoc.extractedText.slice(0, 500)
    );

    const humanTitle = geminiAnalysis.suggestedTitle || metadata.suggestedTitle;
    const slug = geminiAnalysis.canonicalSlug || metadata.canonicalSlug;
    const refLink = metadata.refLink;

    // =========================================================================
    // Stage 3: Băm theo ranh giới ý niệm (Semantic Chunking & Contextual Prefix)
    // =========================================================================
    onProgress?.(3, "🧩 Bóc tách ngữ nghĩa theo ranh giới ý niệm & gắn tiền đề Anthropic Context...");

    const chunkAnalysis = SemanticChunker.chunkDocument({
      fileName: parsedDoc.fileName,
      rawText: parsedDoc.extractedText,
      subjectName: geminiAnalysis.subjectName,
      domainName: geminiAnalysis.domainName,
    });

    // =========================================================================
    // Stage 4: Chiếu xạ Đồ thị Tri thức Master trên Supabase (Ontology Projection)
    // =========================================================================
    onProgress?.(4, "🌐 Chiếu xạ vào Master Knowledge Graph trên Supabase để xác định vị trí tiên quyết...");

    const ontologyResult = await OntologyProjector.projectToMasterGraph({
      subjectId: finalSubjectId,
      documentTitle: humanTitle,
      extractedConcepts: geminiAnalysis.requiredConcepts,
      rawTextSnippet: parsedDoc.extractedText.slice(0, 1500),
    });

    // Nếu Gemini cung cấp lý giải tiên quyết hợp lý cho môn này, ưu tiên ghi nhận
    if (geminiAnalysis.prerequisiteReasoning && ontologyResult.prerequisiteTopics.length === 0) {
      ontologyResult.prerequisiteTopics.push({
        id: "prereq-foundational",
        title: "Kiến thức nền tảng",
        reason: geminiAnalysis.prerequisiteReasoning,
      });
    }

    // =========================================================================
    // Đóng gói Lesson Draft chuẩn
    // =========================================================================
    const newDraft: ExtractedLessonDraft = {
      id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      fileName: parsedDoc.fileName,
      fileType: parsedDoc.fileType,
      fileSize: parsedDoc.fileSizeBytes,
      rawTextSnippet: parsedDoc.extractedText.slice(0, 400),
      uploadedById: user.id,
      uploadedByName: user.displayName || user.email || "Thành viên Theodore",
      uploadedAt: new Date().toISOString(),
      title: humanTitle,
      slug,
      refLink,
      confidenceScore: geminiAnalysis.confidenceScore,
      summary: geminiAnalysis.feynmanSummary,
      domainId: finalDomainId,
      subjectId: finalSubjectId,
      difficultyLevel: geminiAnalysis.difficultyLevel || ontologyResult.calculatedDifficulty || 2,
      estimatedReadingMinutes: geminiAnalysis.estimatedReadingMinutes || 15,
      requiredConcepts: geminiAnalysis.requiredConcepts,
      jargonTraps: geminiAnalysis.jargonTraps,
      suggestedAnalogies: geminiAnalysis.suggestedAnalogies,
      keyTakeaways: geminiAnalysis.keyTakeaways,
      pedagogicalRole: geminiAnalysis.pedagogicalRole || chunkAnalysis.pedagogicalRole,
      pedagogicalRoleLabel: chunkAnalysis.pedagogicalRoleLabel,
      semanticChunks: chunkAnalysis.chunks,
      ontologyAlignment: ontologyResult,
      prerequisiteTopics: ontologyResult.prerequisiteTopics,
      suggestedRoadmapPosition: ontologyResult.suggestedRoadmapPosition,
      status: "PENDING_VALIDATION",
    };

    // Lưu vào LocalStorage
    await this.saveDraftLocally(newDraft);

    // =========================================================================
    // Lưu vào Supabase academic_materials
    // =========================================================================
    try {
      const db = supabaseAdmin || supabase;
      const targetTopicId =
        ontologyResult.matchedMasterTopics?.[0]?.id || "top-toan-roi-rac-01";

      const { data: insertedMat, error: insertErr } = await db
        .from("academic_materials")
        .insert({
          topic_id: targetTopicId,
          title: parsedDoc.fileName,
          source_type:
            parsedDoc.fileName.endsWith(".pdf") || parsedDoc.fileName.endsWith(".pdfa")
              ? "PDF"
              : parsedDoc.fileName.endsWith(".pptx")
              ? "SLIDE"
              : "TEXT_NOTE",
          storage_file_path: `materials/${newDraft.id}/${parsedDoc.fileName}`,
          extracted_text: newDraft.summary,
        })
        .select()
        .single();

      if (insertErr) {
        SystemLogger.warn(
          "SUPABASE_CLIENT",
          "INSERT_ACADEMIC_MATERIAL",
          `Cảnh báo lưu academic_materials: ${insertErr.message}`
        );
      } else if (insertedMat) {
        newDraft.materialId = insertedMat.id;
        await this.saveDraftLocally(newDraft);
        SystemLogger.info(
          "SUPABASE_CLIENT",
          "INSERT_ACADEMIC_MATERIAL",
          `Đã lưu thành công academic_materials trên Supabase! ID: ${insertedMat.id}`
        );
      }
    } catch (e: any) {
      SystemLogger.error(
        "SUPABASE_CLIENT",
        "INSERT_ACADEMIC_MATERIAL",
        `Lỗi khi lưu material vào Supabase: ${e.message}`,
        e
      );
    }

    const duration = Date.now() - startTime;
    SystemLogger.info(
      "AGENT_EXTRACTION",
      "PIPELINE_COMPLETE",
      `Hoàn tất bóc tách & hệ thống hóa tài liệu [${fileName}] trong ${duration}ms (Draft ID: ${newDraft.id})`,
      { draftId: newDraft.id, domainId: newDraft.domainId, subjectId: newDraft.subjectId },
      duration
    );

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
    SystemLogger.info("CURATOR_HUB", "UPDATE_DRAFT", `Curator cập nhật bản nháp [${draftId}]`);
    return updated;
  },

  /**
   * Phê duyệt bài học (Validate & Publish):
   * Đưa bài học chính thức lên Supabase (academic_topics) với status = 'VALIDATED'
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

      let draft = all[idx];
      if (edits) {
        draft = { ...draft, ...edits };
      }

      const nowIso = new Date().toISOString();
      draft.status = "VALIDATED";
      draft.validatedBy = curatorUser.displayName || curatorUser.email;
      draft.validatedAt = nowIso;
      draft.updatedAt = nowIso;
      all[idx] = draft;

      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      }

      const topicId = `top-${draft.slug}-${Date.now().toString(36).slice(-4)}`;
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

      const db = supabaseAdmin || supabase;
      const { data, error } = await db
        .from("academic_topics")
        .upsert(topicPayload, { onConflict: "id" })
        .select()
        .single();

      if (error) {
        SystemLogger.warn("SUPABASE_CLIENT", "PUBLISH_TOPIC", `Lưu academic_topics có cảnh báo: ${error.message}`);
      } else {
        SystemLogger.info(
          "SUPABASE_CLIENT",
          "PUBLISH_TOPIC",
          `Đã xuất bản bài học mới vào academic_topics trên Supabase! ID: ${topicId}`
        );
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
      SystemLogger.error("CURATOR_HUB", "PUBLISH_TOPIC", `Lỗi khi validate bài học: ${err.message}`, err);
      return { success: false, error: err.message || "Lỗi không xác định khi xuất bản" };
    }
  },

  /**
   * Từ chối bài học bản nháp
   */
  async rejectDraft(draftId: string, reason: string, curatorUser: UserProfile): Promise<boolean> {
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
    SystemLogger.info("CURATOR_HUB", "REJECT_DRAFT", `Curator từ chối bản nháp [${draftId}]: ${reason}`);
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
    SystemLogger.info("CURATOR_HUB", "DELETE_DRAFT", `Đã xóa bản nháp [${draftId}]`);
    return true;
  },

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
};
