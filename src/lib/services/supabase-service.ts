/**
 * File: src/lib/services/supabase-service.ts
 * Mục đích: Tầng dịch vụ (Service Layer) thực thi các tác vụ CRUD dữ liệu phiên học, tin nhắn, báo cáo và kho từ vựng trực tiếp trên Supabase với cơ chế fallback tự động.
 * Thành phần chính:
 *   - createSessionService: Tạo phiên giảng dạy mới trên Supabase.
 *   - getSessionsService: Lấy danh sách các phiên học gần đây.
 *   - addMessageService: Lưu tin nhắn đối thoại kèm metadata phân tích ngầm.
 *   - saveEvaluationReportService: Lưu kết quả thẻ điểm Feynman Mastery Card.
 *   - getVaultItemsService & addVaultItemService: Quản lý kho từ vựng và ẩn dụ.
 * Props/Inputs: Cung cấp API tương tác dữ liệu cho các trang.
 */

import { supabase } from "@/lib/supabase";
import type { FeynmanSession, ChatMessage, ReportData, VaultRecord } from "@/types/session.types";
import type { AnalyticalResult } from "@/types/agent.types";

export const SupabaseService = {
  /**
   * Tạo phiên giảng dạy mới
   */
  async createSession(topic: string, personaId: string = "child_10yo", difficulty: string = "MEDIUM"): Promise<FeynmanSession> {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .insert({
          topic,
          persona_id: personaId,
          difficulty,
          status: "ACTIVE",
          clarity_score: 0,
        })
        .select()
        .single();

      if (error || !data) throw error;

      return {
        id: data.id,
        topic: data.topic,
        personaId: data.persona_id,
        difficulty: data.difficulty,
        status: data.status,
        clarityScore: data.clarity_score,
        createdAt: data.created_at,
      };
    } catch (err) {
      console.warn("Supabase createSession fallback:", err);
      // Fallback local memory ID
      return {
        id: `ses_${Date.now()}`,
        topic,
        personaId,
        difficulty: difficulty as "EASY" | "MEDIUM" | "HARD",
        status: "ACTIVE",
        clarityScore: 0,
        createdAt: new Date().toISOString(),
      };
    }
  },

  /**
   * Lấy danh sách các phiên giảng gần nhất
   */
  async getSessions(limit: number = 10): Promise<FeynmanSession[]> {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select("*, evaluation_reports(*)")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error || !data || data.length === 0) throw error;

      return data.map((item: any) => ({
        id: item.id,
        topic: item.topic,
        personaId: item.persona_id,
        difficulty: item.difficulty,
        status: item.status,
        clarityScore: item.clarity_score,
        createdAt: item.created_at,
        report: item.evaluation_reports?.[0]
          ? {
              id: item.evaluation_reports[0].id,
              sessionId: item.id,
              clarityScore: item.evaluation_reports[0].clarity_score,
              logicCompleteness: item.evaluation_reports[0].logic_completeness,
              bestAnalogy: item.evaluation_reports[0].best_analogy,
              knowledgeGaps: item.evaluation_reports[0].knowledge_gaps || [],
              summaryFeedback: item.evaluation_reports[0].summary_feedback,
              createdAt: item.evaluation_reports[0].created_at,
            }
          : null,
      }));
    } catch (err) {
      console.warn("Supabase getSessions fallback:", err);
      return [
        {
          id: "ses-1",
          topic: "Cơ chế Docker Container",
          personaId: "child_10yo",
          difficulty: "MEDIUM",
          status: "COMPLETED",
          clarityScore: 84,
          createdAt: new Date().toISOString(),
        },
        {
          id: "ses-2",
          topic: "Lạm phát & Sức mua",
          personaId: "non_tech",
          difficulty: "MEDIUM",
          status: "ACTIVE",
          clarityScore: 72,
          createdAt: new Date().toISOString(),
        },
      ];
    }
  },

  /**
   * Lưu tin nhắn đối thoại vào Supabase
   */
  async addMessage(
    sessionId: string,
    role: "user" | "assistant",
    content: string,
    analysisMetadata?: AnalyticalResult | null
  ): Promise<ChatMessage> {
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          session_id: sessionId,
          role,
          content,
          analysis_metadata: analysisMetadata || null,
        })
        .select()
        .single();

      if (error || !data) throw error;

      // Cập nhật điểm clarity nếu là user message có điểm
      if (role === "user" && analysisMetadata?.currentClarityScore) {
        await supabase
          .from("sessions")
          .update({ clarity_score: analysisMetadata.currentClarityScore })
          .eq("id", sessionId);
      }

      return {
        id: data.id,
        sessionId: data.session_id,
        role: data.role,
        content: data.content,
        analysisMetadata: data.analysis_metadata,
        createdAt: data.created_at,
      };
    } catch (err) {
      console.warn("Supabase addMessage fallback:", err);
      return {
        id: `msg_${Date.now()}`,
        sessionId,
        role,
        content,
        analysisMetadata,
        createdAt: new Date().toISOString(),
      };
    }
  },

  /**
   * Lưu báo cáo đánh giá Feynman Mastery Card
   */
  async saveEvaluationReport(
    sessionId: string,
    clarityScore: number,
    logicCompleteness: number,
    bestAnalogy: string,
    knowledgeGaps: string[],
    summaryFeedback: string
  ): Promise<ReportData> {
    try {
      const { data, error } = await supabase
        .from("evaluation_reports")
        .upsert(
          {
            session_id: sessionId,
            clarity_score: clarityScore,
            logic_completeness: logicCompleteness,
            best_analogy: bestAnalogy,
            knowledge_gaps: knowledgeGaps,
            summary_feedback: summaryFeedback,
          },
          { onConflict: "session_id" }
        )
        .select()
        .single();

      // Đánh dấu session COMPLETED
      await supabase
        .from("sessions")
        .update({ status: "COMPLETED", clarity_score: clarityScore })
        .eq("id", sessionId);

      if (error || !data) throw error;

      return {
        id: data.id,
        sessionId: data.session_id,
        clarityScore: data.clarity_score,
        logicCompleteness: data.logic_completeness,
        bestAnalogy: data.best_analogy,
        knowledgeGaps: data.knowledge_gaps || [],
        summaryFeedback: data.summary_feedback,
        createdAt: data.created_at,
      };
    } catch (err) {
      console.warn("Supabase saveEvaluationReport fallback:", err);
      return {
        id: `rep_${Date.now()}`,
        sessionId,
        clarityScore,
        logicCompleteness,
        bestAnalogy,
        knowledgeGaps,
        summaryFeedback,
        createdAt: new Date().toISOString(),
      };
    }
  },

  /**
   * Lấy danh sách từ vựng trong Vault
   */
  async getVaultItems(): Promise<VaultRecord[]> {
    try {
      const { data, error } = await supabase
        .from("vault_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (error || !data || data.length === 0) throw error;

      return data.map((item: any) => ({
        id: item.id,
        term: item.term,
        plainExplanation: item.plain_explanation,
        analogyUsed: item.analogy_used,
        topic: item.topic,
        createdAt: item.created_at,
      }));
    } catch (err) {
      console.warn("Supabase getVaultItems fallback:", err);
      return [
        {
          id: "v-1",
          term: "Container (Docker)",
          plainExplanation: "Một chiếc hộp chứa đầy đủ ứng dụng và mọi đồ đạc cần thiết để chạy ở bất kỳ máy tính nào mà không bị lỗi thiếu file.",
          analogyUsed: "Căn hộ chung cư xây sẵn đầy đủ tiện nghi, chỉ việc xách vali vào ở.",
          topic: "Cơ chế Docker",
          createdAt: new Date().toISOString(),
        },
        {
          id: "v-2",
          term: "Lạm phát (Inflation)",
          plainExplanation: "Hiện tượng đồng tiền bị giảm sức mua, khiến cùng một số tiền nhưng mua được ít hàng hóa hơn trước.",
          analogyUsed: "Cuộc đấu giá chỉ có 5 ổ bánh mì nhưng ai tham gia cũng được phát thêm gấp đôi tiền xu.",
          topic: "Lạm phát",
          createdAt: new Date().toISOString(),
        },
      ];
    }
  },

  /**
   * Thêm từ vựng mới vào Vault
   */
  async addVaultItem(term: string, plainExplanation: string, analogyUsed?: string, topic: string = "Chủ đề chung"): Promise<VaultRecord | null> {
    try {
      const { data, error } = await supabase
        .from("vault_items")
        .insert({
          term,
          plain_explanation: plainExplanation,
          analogy_used: analogyUsed || null,
          topic,
        })
        .select()
        .single();

      if (error || !data) throw error;

      return {
        id: data.id,
        term: data.term,
        plainExplanation: data.plain_explanation,
        analogyUsed: data.analogy_used,
        topic: data.topic,
        createdAt: data.created_at,
        masteryLevel: 1,
        repetitions: 0,
        intervalDays: 1,
        easeFactor: 2.5,
        nextReviewAt: new Date().toISOString(),
      };
    } catch (err) {
      console.warn("Supabase addVaultItem fallback:", err);
      return {
        id: `v-${Date.now()}`,
        term,
        plainExplanation,
        analogyUsed: analogyUsed || null,
        topic,
        createdAt: new Date().toISOString(),
        masteryLevel: 1,
        repetitions: 0,
        intervalDays: 1,
        easeFactor: 2.5,
        nextReviewAt: new Date().toISOString(),
      };
    }
  },

  /**
   * Cập nhật tiến độ ôn tập ngắt quãng SM-2 của thẻ
   */
  async updateVaultCardSM2(cardId: string, sm2Result: any): Promise<boolean> {
    try {
      await supabase
        .from("jargon_vault_cards")
        .update({
          mastery_level: sm2Result.masteryLevel,
          next_review_at: sm2Result.nextReviewAt,
        })
        .eq("id", cardId);

      return true;
    } catch (err) {
      console.warn("Supabase updateVaultCardSM2 fallback:", err);
      return false;
    }
  },
};

