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

const LOCAL_SESSIONS_STORAGE_KEY = "theodore_persistent_sessions";

function getLocalSessions(userId?: string): FeynmanSession[] {
  if (typeof window === "undefined") return [];
  try {
    // Dọn dẹp key dùng chung cũ nếu còn sót lại từ phiên bản trước
    if (localStorage.getItem(LOCAL_SESSIONS_STORAGE_KEY)) {
      localStorage.removeItem(LOCAL_SESSIONS_STORAGE_KEY);
    }
    if (!userId) return [];
    const raw = localStorage.getItem(`elis_sessions_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalSession(session: FeynmanSession, userId?: string) {
  if (typeof window === "undefined" || !userId) return;
  try {
    const current = getLocalSessions(userId);
    const idx = current.findIndex((s) => s.id === session.id);
    let updated: FeynmanSession[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = { ...updated[idx], ...session };
    } else {
      updated = [session, ...current];
    }
    localStorage.setItem(`elis_sessions_${userId}`, JSON.stringify(updated));
  } catch (e) {
    console.error("Lỗi lưu session local:", e);
  }
}

export const SupabaseService = {
  /**
   * Tạo phiên giảng dạy mới
   */
  async createSession(
    topic: string,
    personaId: string = "child_10yo",
    difficulty: string = "MEDIUM",
    topicId?: string,
    domainId?: string
  ): Promise<FeynmanSession> {
    const newSession: FeynmanSession = {
      id: `ses_${Date.now()}`,
      topic,
      personaId,
      difficulty: difficulty as "EASY" | "MEDIUM" | "HARD",
      status: "ACTIVE",
      clarityScore: 0,
      createdAt: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from("sessions")
        .insert({
          topic,
          topic_id: topicId || null,
          domain_id: domainId || null,
          persona_id: personaId,
          difficulty,
          status: "ACTIVE",
          clarity_score: 0,
        })
        .select()
        .single();

      if (!error && data) {
        newSession.id = data.id;
        newSession.createdAt = data.created_at;
      }
    } catch (err) {
      console.warn("Supabase createSession fallback:", err);
    }

    // Luôn lưu session vào bộ nhớ bền vững phía client
    saveLocalSession(newSession, (typeof window !== "undefined" ? JSON.parse(localStorage.getItem("theodore_auth_session") || "{}")?.state?.user?.id : undefined));
    return newSession;
  },

  /**
   * Lấy danh sách các phiên giảng gần nhất của người dùng
   */
  async getSessions(limit: number = 20, userId?: string): Promise<FeynmanSession[]> {
    let cloudSessions: FeynmanSession[] = [];
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select("*, evaluation_reports(*)")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        cloudSessions = data.map((item: any) => ({
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
      }
    } catch (err) {
      console.warn("Supabase getSessions error:", err);
    }

    // Kết hợp dữ liệu từ Cloud và LocalStorage theo userId
    const effectiveUserId = userId || (typeof window !== "undefined" ? JSON.parse(localStorage.getItem("theodore_auth_session") || "{}")?.state?.user?.id : undefined);
    const local = getLocalSessions(effectiveUserId);
    const mergedMap = new Map<string, FeynmanSession>();

    cloudSessions.forEach((s) => mergedMap.set(s.id, s));
    local.forEach((s) => {
      if (!mergedMap.has(s.id)) {
        mergedMap.set(s.id, s);
      }
    });

    const result = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return result.slice(0, limit);
  },

  /**
   * Lấy chi tiết 1 phiên giảng theo ID
   */
  async getSessionById(id: string): Promise<FeynmanSession | null> {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select("*, evaluation_reports(*)")
        .eq("id", id)
        .single();

      if (!error && data) {
        return {
          id: data.id,
          topic: data.topic,
          personaId: data.persona_id,
          difficulty: data.difficulty,
          status: data.status,
          clarityScore: data.clarity_score,
          createdAt: data.created_at,
          report: data.evaluation_reports?.[0]
            ? {
                id: data.evaluation_reports[0].id,
                sessionId: data.id,
                clarityScore: data.evaluation_reports[0].clarity_score,
                logicCompleteness: data.evaluation_reports[0].logic_completeness,
                bestAnalogy: data.evaluation_reports[0].best_analogy,
                knowledgeGaps: data.evaluation_reports[0].knowledge_gaps || [],
                summaryFeedback: data.evaluation_reports[0].summary_feedback,
                createdAt: data.evaluation_reports[0].created_at,
              }
            : null,
        };
      }
    } catch (err) {
      console.warn("Supabase getSessionById fallback:", err);
    }

    const activeUserId = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("theodore_auth_session") || "{}")?.state?.user?.id : undefined;
    const local = getLocalSessions(activeUserId);
    return local.find((s) => s.id === id) || null;
  },

  /**
   * Xóa 1 phiên giảng
   */
  async deleteSession(id: string, userId?: string): Promise<boolean> {
    try {
      await supabase.from("sessions").delete().eq("id", id);
    } catch (err) {
      console.warn("Supabase deleteSession error:", err);
    }

    if (typeof window !== "undefined") {
      const activeUserId = userId || JSON.parse(localStorage.getItem("theodore_auth_session") || "{}")?.state?.user?.id;
      if (activeUserId) {
        const local = getLocalSessions(activeUserId).filter((s) => s.id !== id);
        localStorage.setItem(`elis_sessions_${activeUserId}`, JSON.stringify(local));
      }
    }
    return true;
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
    const reportData: ReportData = {
      id: `rep_${Date.now()}`,
      sessionId,
      clarityScore,
      logicCompleteness,
      bestAnalogy,
      knowledgeGaps,
      summaryFeedback,
      createdAt: new Date().toISOString(),
    };

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

      if (!error && data) {
        reportData.id = data.id;
        reportData.createdAt = data.created_at;
      }

      // Đánh dấu session COMPLETED trên Supabase
      await supabase
        .from("sessions")
        .update({
          status: "COMPLETED",
          clarity_score: clarityScore,
          best_analogy: bestAnalogy,
          summary_feedback: summaryFeedback,
          completed_at: new Date().toISOString(),
        })
        .eq("id", sessionId);
    } catch (err) {
      console.warn("Supabase saveEvaluationReport fallback:", err);
    }

    // Luôn cập nhật trạng thái session local thành COMPLETED
    if (typeof window !== "undefined") {
      const activeUserId = JSON.parse(localStorage.getItem("theodore_auth_session") || "{}")?.state?.user?.id;
      const local = getLocalSessions(activeUserId);
      const target = local.find((s) => s.id === sessionId);
      if (target) {
        target.status = "COMPLETED";
        target.clarityScore = clarityScore;
        target.report = reportData;
        saveLocalSession(target, activeUserId);
      }
    }

    return reportData;
  },

  /**
   * Lấy danh sách từ vựng trong Vault (trả về danh sách thật từ database, không chèn thẻ giả lập)
   */
  async getVaultItems(): Promise<VaultRecord[]> {
    try {
      const { data, error } = await supabase
        .from("vault_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      return data.map((item: any) => ({
        id: item.id,
        term: item.term,
        plainExplanation: item.plain_explanation,
        analogyUsed: item.analogy_used,
        topic: item.topic,
        createdAt: item.created_at,
      }));
    } catch (err) {
      console.warn("Supabase getVaultItems error:", err);
      return [];
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

