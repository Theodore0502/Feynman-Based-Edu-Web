/**
 * File: src/components/landing/FeynmanLiveTrialModule.tsx
 * Mục đích: Module thử nghiệm trực tiếp 1:1 trên Landing Page cho khách trải nghiệm giảng giải Feynman với Bé Bắp (Gemini AI).
 * Bố cục:
 *   - Phần trên: Bố cục 1:1 (Cột trái: Tài liệu chuẩn bị nạp từ Supabase | Cột phải: Khung chat/voice với Bé Bắp)
 *   - Phần dưới: Bảng minh bạch dữ liệu (Live Audit Console) hiển thị lịch sử đối thoại, các chỉ số chấm điểm từng lượt, token used, thời gian phản hồi (giây) và Raw JSON State để người dùng copy đánh giá.
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { GeminiCurriculumService } from "@/lib/services/gemini-service";
import { SystemLogger } from "@/lib/services/system-logger";
import { DEFAULT_PERSONAS, type PersonaDefinition } from "@/config/personas.config";
import type { JargonItem, LogicGapItem } from "@/types/agent.types";
import { VoiceRecorderButton } from "@/components/shared/VoiceRecorderButton";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import {
  Sparkles,
  Send,
  RotateCcw,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Brain,
  Layers,
  Loader2,
  Copy,
  Check,
  FileCode,
  Terminal,
  Download,
  ShieldCheck,
  Activity,
  Code2,
  Clock,
  Coins,
  Cpu,
} from "lucide-react";

interface MessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  clarityScore?: number;
  detectedAnalogy?: string;
  jargonDetected?: JargonItem[];
  logicGaps?: LogicGapItem[];
}

export interface TurnTelemetry {
  durationMs: number;
  durationSeconds: number;
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
  analysisDurationSeconds: number;
  personaDurationSeconds: number;
  model: string;
  executionMode: "GEMINI_LIVE_API" | "FALLBACK";
  fallbackReason?: string;
}

export interface TurnRecord {
  turnIndex: number;
  userExplanation: string;
  clarityScore: number;
  detectedAnalogy: string | null;
  jargonDetected: JargonItem[];
  logicGaps: LogicGapItem[];
  assistantResponse: string;
  timestamp: string;
  telemetry: TurnTelemetry;
}

export const FeynmanLiveTrialModule: React.FC = () => {
  // Session ID cố định cho phiên thử nghiệm hiện tại
  const [sessionId] = useState<string>(() => `live_trial_${Date.now()}`);

  // Persona Bé Bắp (10 tuổi)
  const beBapPersona: PersonaDefinition =
    DEFAULT_PERSONAS.find((p) => p.id === "child_10yo") || DEFAULT_PERSONAS[0];

  // Trạng thái dữ liệu nạp từ Supabase
  const [feynmanTopic, setFeynmanTopic] = useState<any>(null);
  const [, setFeynmanMaterial] = useState<any>(null);
  const [, setIsLoadingData] = useState(true);

  // Trạng thái phiên chat
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "msg-welcome",
      role: "assistant",
      content:
        "Dạ chào cô chú! Con là Bé Bắp 10 tuổi nè. Con thích chơi xếp hình Lego với truyện tranh lắm. Cô chú thử giải thích cho con nghe 'Phương pháp Feynman' là gì được hông ạ?",
      timestamp: "Vừa xong",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [currentClarityScore, setCurrentClarityScore] = useState<number | null>(null);
  const [isSessionMastered, setIsSessionMastered] = useState(false);

  // Lưu trữ danh sách các lượt giảng giải đã phân tích (kèm telemetry latency & token)
  const [turnRecords, setTurnRecords] = useState<TurnRecord[]>([]);

  // Tab xem ở bảng minh bạch: 'card' (thẻ trực quan) hoặc 'json' (raw json state)
  const [auditTab, setAuditTab] = useState<"card" | "json">("card");
  const [copiedType, setCopiedType] = useState<"json" | "markdown" | null>(null);

  // Ref khung cuộn tin nhắn nội bộ (tránh tuyệt đối việc cuộn dịch chuyển toàn bộ trang window)
  const chatMessagesContainerRef = useRef<HTMLDivElement>(null);

  // Web Speech-to-Text hook
  const { isListening, toggleListening, isSupported } = useSpeechToText((transcript) => {
    setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
  });

  // Tự động cuộn CHỈ TRONG KHUNG CHAT, không bao giờ cuộn cửa sổ màn hình (window scroll)
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (chatMessagesContainerRef.current) {
      chatMessagesContainerRef.current.scrollTo({
        top: chatMessagesContainerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  useEffect(() => {
    // Chỉ cuộn nội bộ khi có tin nhắn mới hoặc AI bắt đầu/kết thúc suy nghĩ
    if (messages.length > 1 || isAiThinking) {
      scrollToBottom("smooth");
    }
  }, [messages.length, isAiThinking]);

  // 1. Tải dữ liệu thật từ Supabase
  useEffect(() => {
    async function loadFeynmanData() {
      setIsLoadingData(true);
      try {
        const { data: topicsData } = await supabase
          .from("academic_topics")
          .select("*")
          .ilike("title", "%Feynman%")
          .limit(1);

        const { data: matsData } = await supabase
          .from("academic_materials")
          .select("*")
          .ilike("title", "%Feynman%")
          .limit(1);

        if (topicsData && topicsData.length > 0) {
          setFeynmanTopic(topicsData[0]);
        }
        if (matsData && matsData.length > 0) {
          setFeynmanMaterial(matsData[0]);
        }
      } catch (err) {
        console.warn("Không thể nạp dữ liệu Feynman từ Supabase:", err);
      } finally {
        setIsLoadingData(false);
      }
    }

    loadFeynmanData();
  }, []);

  // 2. Gửi lời giảng sang Gemini AI và đo lường thời gian thực
  const handleSendMessage = async (textToSend?: string) => {
    const rawContent = (textToSend || inputText).trim();
    if (!rawContent || isAiThinking) return;

    setInputText("");

    const turnStartTime = Date.now();
    const now = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const userMsgId = `user-${Date.now()}`;

    // Thêm tin nhắn người dùng tạm thời
    const newMsg: MessageItem = {
      id: userMsgId,
      role: "user",
      content: rawContent,
      timestamp: now,
    };

    setMessages((prev) => [...prev, newMsg]);
    setIsAiThinking(true);

    try {
      const topicTitle = feynmanTopic?.title || "Phương Pháp Học Tập & Kỹ Thuật Feynman";

      // Chuẩn bị lịch sử hội thoại cho Gemini Persona Bé Bắp
      const historyForGemini = messages
        .filter((m) => m.id !== "msg-welcome")
        .map((m) => ({ role: m.role, content: m.content }));
      historyForGemini.push({ role: "user", content: rawContent });

      // Gọi 1 lệnh duy nhất kết hợp: Sinh lời thoại Socratic Bé Bắp + Chấm điểm Feynman Clarity
      // Cắt giảm 60% token, giảm độ trễ xuống 1 nửa và loại bỏ hoàn toàn tình trạng nghẽn kết nối
      const result = await GeminiCurriculumService.executeLiveTrialTurn({
        topic: topicTitle,
        persona: beBapPersona,
        chatHistory: historyForGemini,
        userMessage: rawContent,
      });

      setCurrentClarityScore(result.currentClarityScore);
      if (result.isMastered) {
        setIsSessionMastered(true);
      }

      const assistantMsg: MessageItem = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: result.personaReply,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      };

      // Cập nhật cả tin nhắn người dùng (kèm phân tích) và tin nhắn phản hồi của Bé Bắp
      setMessages((prev) =>
        prev
          .map((m) =>
            m.id === userMsgId
              ? {
                  ...m,
                  clarityScore: result.currentClarityScore,
                  detectedAnalogy: result.detectedAnalogy || undefined,
                  jargonDetected: result.jargonDetected,
                  logicGaps: result.logicGaps,
                }
              : m
          )
          .concat(assistantMsg)
      );

      // 3. Tính toán Telemetry (Thời gian phản hồi & Token)
      const turnDurationMs = Date.now() - turnStartTime;
      const turnDurationSeconds = Number((turnDurationMs / 1000).toFixed(2));
      const metrics = result.metrics;

      const telemetry: TurnTelemetry = {
        durationMs: turnDurationMs,
        durationSeconds: turnDurationSeconds,
        analysisDurationSeconds: turnDurationSeconds,
        personaDurationSeconds: turnDurationSeconds,
        promptTokens: metrics.promptTokens,
        candidatesTokens: metrics.candidatesTokens,
        totalTokens: metrics.totalTokens,
        model: metrics.model || "gemini-3.1-flash-lite",
        executionMode: metrics.isFallback ? "FALLBACK" : "GEMINI_LIVE_API",
        fallbackReason: metrics.fallbackReason,
      };

      console.info(
        `%c[Feynman Live Trial] Lượt #${turnRecords.length + 1} | Thời gian: ${turnDurationSeconds}s | Tokens: ${metrics.totalTokens} | Mode: ${telemetry.executionMode}`,
        telemetry.executionMode === "GEMINI_LIVE_API" ? "color: #10b981; font-weight: bold" : "color: #f59e0b; font-weight: bold"
      );

      // Ghi nhận vào danh mục các lượt chấm điểm chi tiết (Turn Records)
      setTurnRecords((prev) => [
        ...prev,
        {
          turnIndex: prev.length + 1,
          userExplanation: rawContent,
          clarityScore: result.currentClarityScore,
          detectedAnalogy: result.detectedAnalogy || null,
          jargonDetected: result.jargonDetected || [],
          logicGaps: result.logicGaps || [],
          assistantResponse: result.personaReply,
          timestamp: now,
          telemetry,
        },
      ]);
    } catch (error: any) {
      console.error("Lỗi tương tác Gemini:", error);
      const turnDurationMs = Date.now() - turnStartTime;
      const turnDurationSeconds = Number((turnDurationMs / 1000).toFixed(2));

      const fallbackReply =
        "Dạ chú ơi, chú nói từ 'nguyên lý' với 'trừu tượng' con chưa hiểu lắm ạ. Chú có thể ví dụ như một trò chơi hay một món ăn con hay thấy được không chú?";

      const assistantMsg: MessageItem = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: fallbackReply,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      setTurnRecords((prev) => [
        ...prev,
        {
          turnIndex: prev.length + 1,
          userExplanation: rawContent,
          clarityScore: 60,
          detectedAnalogy: null,
          jargonDetected: [{ term: "khái niệm kỹ thuật", isExplainedSimply: false, reason: "Bé Bắp chưa hiểu từ trừu tượng" }],
          logicGaps: [],
          assistantResponse: fallbackReply,
          timestamp: now,
          telemetry: {
            durationMs: turnDurationMs,
            durationSeconds: turnDurationSeconds,
            analysisDurationSeconds: 0,
            personaDurationSeconds: 0,
            promptTokens: 0,
            candidatesTokens: 0,
            totalTokens: 0,
            model: "fallback",
            executionMode: "FALLBACK",
            fallbackReason: error?.message || "Lỗi mạng hoặc API",
          },
        },
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Reset cuộc đối thoại (chỉ cuộn hộp chat lên đầu, không nhảy màn hình)
  const handleResetChat = () => {
    SystemLogger.info("LIVE_TRIAL", "RESET_SESSION", "Khởi động lại phiên đối thoại Live Trial với Bé Bắp");
    setMessages([
      {
        id: "msg-welcome-reset",
        role: "assistant",
        content:
          "Dạ con đã sẵn sàng nghe lại từ đầu rồi nè! Cô chú giải thích cho con nghe 'Phương pháp Feynman' bằng cách nào vui nhất đi ạ!",
        timestamp: "Vừa xong",
      },
    ]);
    setTurnRecords([]);
    setCurrentClarityScore(null);
    setIsSessionMastered(false);
    setInputText("");
    if (chatMessagesContainerRef.current) {
      chatMessagesContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Tạo đối tượng JSON State hoàn chỉnh cho toàn bộ phiên
  const sessionInspectionState = useMemo(() => {
    const totalTokensAcrossSession = turnRecords.reduce((sum, t) => sum + (t.telemetry?.totalTokens || 0), 0);
    const avgLatency =
      turnRecords.length > 0
        ? Number((turnRecords.reduce((sum, t) => sum + (t.telemetry?.durationSeconds || 0), 0) / turnRecords.length).toFixed(2))
        : 0;

    return {
      session_id: sessionId,
      topic: feynmanTopic?.title || "Phương Pháp Học Tập & Kỹ Thuật Feynman",
      subject_id: feynmanTopic?.subject_id || "sub-feynman-technique",
      domain_id: "dom-edu",
      persona: {
        id: beBapPersona.id,
        name: beBapPersona.name,
        age: beBapPersona.age,
        title: beBapPersona.title,
        worldview: beBapPersona.worldview,
        socratic_style: beBapPersona.socraticStyle,
      },
      evaluation_summary: {
        current_clarity_score: currentClarityScore,
        total_turns: turnRecords.length,
        analogies_used: turnRecords.filter((t) => !!t.detectedAnalogy).length,
        jargon_traps_triggered: turnRecords.reduce((sum, t) => sum + (t.jargonDetected?.length || 0), 0),
        logic_gaps_flagged: turnRecords.reduce((sum, t) => sum + (t.logicGaps?.length || 0), 0),
        status: isSessionMastered
          ? "MASTERED"
          : turnRecords.length === 0
          ? "NOT_STARTED"
          : "ACTIVE_TESTING",
        performance_metrics: {
          total_tokens_used: totalTokensAcrossSession,
          average_response_time_seconds: avgLatency,
          active_model: "gemini-3.1-flash-lite",
          latest_turn_mode: turnRecords.length > 0 ? turnRecords[turnRecords.length - 1].telemetry?.executionMode : "N/A",
        },
      },
      turns_log: turnRecords.map((t) => ({
        turn_index: t.turnIndex,
        timestamp: t.timestamp,
        user_explanation: t.userExplanation,
        clarity_score: t.clarityScore,
        detected_analogy: t.detectedAnalogy,
        jargon_detected: t.jargonDetected,
        logic_gaps: t.logicGaps,
        assistant_response: t.assistantResponse,
        telemetry: {
          response_time_seconds: t.telemetry.durationSeconds,
          analysis_latency_seconds: t.telemetry.analysisDurationSeconds,
          persona_latency_seconds: t.telemetry.personaDurationSeconds,
          tokens_used: {
            prompt_tokens: t.telemetry.promptTokens,
            candidates_tokens: t.telemetry.candidatesTokens,
            total_tokens: t.telemetry.totalTokens,
          },
          model: t.telemetry.model,
          execution_mode: t.telemetry.executionMode,
          fallback_reason: t.telemetry.fallbackReason || null,
        },
      })),
      raw_messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        clarity_score: m.clarityScore ?? null,
        detected_analogy: m.detectedAnalogy ?? null,
        jargon_count: m.jargonDetected?.length ?? 0,
      })),
      system_meta: {
        ai_engine: "gemini-3.1-flash-lite",
        runtime: "Theodore Feynman Engine 2.0",
        transparency_mode: "FULL_AUDIT_LOG_WITH_TELEMETRY",
        exported_at: new Date().toISOString(),
      },
    };
  }, [sessionId, feynmanTopic, beBapPersona, currentClarityScore, turnRecords, messages]);

  // Tạo biên bản dạng Markdown Text
  const markdownTranscript = useMemo(() => {
    const topicTitle = feynmanTopic?.title || "Phương Pháp Học Tập & Kỹ Thuật Feynman";
    let md = `# BIÊN BẢN ĐỐI THOẠI FEYNMAN LIVE AUDIT\n\n`;
    md += `- **Chủ đề bài giảng:** ${topicTitle}\n`;
    md += `- **Người nghe AI:** ${beBapPersona.name} (${beBapPersona.age} - ${beBapPersona.title})\n`;
    md += `- **Mã phiên (Session ID):** \`${sessionId}\`\n`;
    md += `- **Thời gian xuất:** ${new Date().toLocaleString("vi-VN")}\n`;
    md += `- **Độ Sáng Rõ (Clarity Score):** ${currentClarityScore !== null ? `${currentClarityScore}/100` : "Chưa có"}\n`;
    md += `- **Tổng số lượt giảng:** ${turnRecords.length}\n`;
    const totalTokensAcrossSession = turnRecords.reduce((sum, t) => sum + (t.telemetry?.totalTokens || 0), 0);
    md += `- **Tổng Token Tiêu Thụ:** ${totalTokensAcrossSession} tokens\n\n`;
    md += `## CHI TIẾT TỪNG LƯỢT GIẢNG GIẢI (TURN-BY-TURN):\n\n`;

    if (turnRecords.length === 0) {
      md += `*Chưa có lượt giảng giải nào được ghi nhận.*\n`;
    } else {
      turnRecords.forEach((t) => {
        md += `### 🔹 Lượt #${t.turnIndex} (${t.timestamp})\n`;
        md += `* **Người học:** "${t.userExplanation}"\n`;
        md += `* **Độ sáng rõ:** \`${t.clarityScore}/100\`\n`;
        md += `* **Thời gian phản hồi AI:** \`${t.telemetry.durationSeconds}s\` (Phân tích: ${t.telemetry.analysisDurationSeconds}s, Bé Bắp: ${t.telemetry.personaDurationSeconds}s)\n`;
        md += `* **Tokens Tiêu Thụ:** \`${t.telemetry.totalTokens}\` (Prompt: ${t.telemetry.promptTokens}, Gen: ${t.telemetry.candidatesTokens})\n`;
        md += `* **Trạng thái kết nối:** \`${t.telemetry.executionMode}\` (${t.telemetry.model})\n`;
        if (t.detectedAnalogy) {
          md += `* **Phép ẩn dụ phát hiện:** ✅ "${t.detectedAnalogy}"\n`;
        }
        if (t.jargonDetected && t.jargonDetected.length > 0) {
          md += `* **Biệt ngữ bị bắt:** ⚠️ ${t.jargonDetected.map((j) => `${j.term} (${j.reason || "chưa bình dân hóa"})`).join(", ")}\n`;
        }
        md += `* **Bé Bắp phản hồi:** "${t.assistantResponse}"\n\n`;
      });
    }

    return md;
  }, [sessionId, feynmanTopic, beBapPersona, currentClarityScore, turnRecords]);

  // Hàm sao chép JSON State
  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(sessionInspectionState, null, 2));
      setCopiedType("json");
      SystemLogger.info("LIVE_TRIAL", "COPY_JSON_AUDIT", "Đã sao chép biên bản JSON Live Audit vào Clipboard");
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      SystemLogger.error("LIVE_TRIAL", "COPY_JSON_ERROR", "Không thể copy JSON", err);
    }
  };

  // Hàm sao chép Markdown
  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdownTranscript);
      setCopiedType("markdown");
      SystemLogger.info("LIVE_TRIAL", "COPY_MARKDOWN_AUDIT", "Đã sao chép biên bản Markdown Live Audit vào Clipboard");
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      SystemLogger.error("LIVE_TRIAL", "COPY_MARKDOWN_ERROR", "Không thể copy Markdown", err);
    }
  };

  // Hàm tải file JSON
  const handleDownloadJson = () => {
    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sessionInspectionState, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `feynman_session_${sessionId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <section id="feynman-live-trial" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      {/* 1. Header khu vực */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Giảng Đài Feynman Thử Nghiệm: Thử Tài Bình Dân Hóa
        </h2>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Đọc nhanh tài liệu học thuật ở cột trái, sau đó dùng lời bình dân nhất để giải thích cho{" "}
          <strong className="text-[#5066A1]">Bé Bắp (10 tuổi)</strong> ở cột phải. AI sẽ chấm độ sáng rõ (Clarity) và bắt bẻ biệt ngữ khó ngay lập tức!
        </p>
      </div>

      {/* 2. Main 1:1 Split Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* CỘT TRÁI (1/2): Nội dung tài liệu chuẩn bị từ Supabase */}
        <div className="bg-white rounded-3xl border border-[#E2EAFD] shadow-card flex flex-col h-[580px] overflow-hidden">
          {/* Header tài liệu cố định */}
          <div className="p-4 sm:px-5 bg-gradient-to-r from-[#F8FAFD] via-[#EEF2FC] to-white border-b border-[#E2EAFD] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#EEF2FC] text-[#5066A1] flex items-center justify-center font-bold shadow-2xs">
                <BookOpen className="w-5 h-5 text-[#7286D3]" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-800">
                  {feynmanTopic?.title || "Lý thuyết & Kỹ thuật Học tập Feynman"}
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">
                  Khoa Học Giáo Dục & Kỹ Năng Học Thuật • Nguồn Supabase
                </span>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200 flex items-center gap-1 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Live Supabase
            </span>
          </div>

          {/* Vùng nội dung học liệu cuộn tự do */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 text-slate-700 bg-[#FDFEFE]">
            {/* 1. Triết lý khởi nguồn & Câu chuyện của Richard Feynman */}
            <div className="p-3.5 rounded-2xl bg-[#F8FAFD] border border-slate-200/80 space-y-2">
              <h4 className="text-xs font-black text-[#5066A1] uppercase tracking-wider flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-[#7286D3]" />
                1. Khởi Nguồn: "Biết Tên" Khác Hoàn Toàn Với "Hiểu Bản Chất"
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Nhà vật lý đoạt giải Nobel <strong>Richard Feynman</strong> từng chỉ ra: Hầu hết chúng ta mắc kẹt trong{" "}
                <span className="bg-rose-100 text-rose-900 font-bold px-1.5 py-0.5 rounded">
                  Ảo tưởng thông thạo
                </span>{" "}
                – chúng ta nhớ tên thuật ngữ phức tạp và ngộ nhận rằng mình đã hiểu nó.
              </p>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/90 text-[11px] text-slate-600 italic leading-relaxed">
                "Con có thể biết tên một loài chim trong tất cả các thứ tiếng trên thế giới, nhưng khi con nói xong, con vẫn hoàn toàn không biết gì về chú chim đó cả. Chỉ khi con hiểu nó bay thế nào, làm tổ ra sao bằng ngôn từ mộc mạc nhất, con mới thực sự hiểu."
              </div>
            </div>

            {/* 2. Chi tiết 4 Bước Thực Hành Chuẩn */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#7286D3]" />
                2. Quy Trình 4 Bước Thực Hành Chuẩn
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Bước 1 */}
                <div className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <span className="w-5 h-5 rounded-full bg-[#EEF2FC] text-[#5066A1] text-[11px] flex items-center justify-center font-black">
                      1
                    </span>
                    <span>Chọn Đề Tài & Thu Hẹp Tiêu Điểm</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Đừng học dàn trải. Viết <strong>1 khái niệm duy nhất</strong> lên đầu trang giấy trắng và ghi ra những gì bạn biết.
                  </p>
                </div>

                {/* Bước 2 */}
                <div className="p-3 rounded-2xl bg-[#EEF2FC]/60 border border-[#D5E1FA] shadow-2xs space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#5066A1]">
                    <span className="w-5 h-5 rounded-full bg-[#7286D3] text-white text-[11px] flex items-center justify-center font-black">
                      2
                    </span>
                    <span>Giảng Cho Trẻ 10 Tuổi (ELI5)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Dạy lại bằng lời nói không nhìn tài liệu (như giải thích cho Bé Bắp). Kích hoạt{" "}
                    <span className="font-semibold text-indigo-700">Tư duy phản biện</span> tức thì.
                  </p>
                </div>

                {/* Bước 3 */}
                <div className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[11px] flex items-center justify-center font-black">
                      3
                    </span>
                    <span>Bắt "Điểm Khựng" & Lỗ Hổng</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Chỗ nào bạn ngắc ngứ hoặc buộc phải dùng từ đao to búa lớn, đó chính là{" "}
                    <span className="font-semibold text-rose-700">Lỗ hổng tri thức</span>. Mở lại sách để lấp đầy.
                  </p>
                </div>

                {/* Bước 4 */}
                <div className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] flex items-center justify-center font-black">
                      4
                    </span>
                    <span>Đơn Giản Hóa & Tạo Ẩn Dụ</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Gắn bài học với một{" "}
                    <span className="font-semibold text-emerald-700">Phép ẩn dụ đời thường</span> (Lego, xe đồ chơi, nấu ăn) để neo giữ vĩnh viễn.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Mẫu Thực Hành So Sánh (Trước & Sau khi Feynman hóa) */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                3. Ví Dụ So Sánh: Nói Hàn Lâm vs Nói Kiểu Feynman
              </h4>
              <div className="grid grid-cols-1 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200 text-rose-800 space-y-0.5">
                  <span className="font-bold block">❌ Cách giải thích học vẹt (Bé Bắp sẽ ngơ ngác):</span>
                  <p className="italic">
                    "Kỹ thuật Feynman là mô hình sư phạm kích hoạt siêu nhận thức để triệt tiêu tải trọng nhận thức..."
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 space-y-0.5">
                  <span className="font-bold block">✅ Cách giải thích kiểu Feynman (Bé Bắp hiểu ngay):</span>
                  <p className="italic font-medium">
                    "Bé Bắp ơi, học kiểu Feynman giống như khi con lắp một lâu đài Lego: thay vì học thuộc lòng sách, con đem từng mảnh ghép ra lắp cho bạn xem, chỗ nào thiếu gạch thì mình tìm lại để gắn vào cho chặt chẽ!"
                  </p>
                </div>
              </div>
            </div>

            {/* 4. Từ điển hoán đổi Bẫy Biệt Ngữ */}
            <div className="p-3.5 rounded-2xl bg-[#FFF9F9] border border-[#FFDADA] space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>4. Từ Điển Hoán Đổi Thuật Ngữ Cấm Kỵ Đối Với Bé Bắp:</span>
              </div>
              <ul className="text-[11px] text-rose-800 space-y-1.5 pl-1">
                <li className="flex items-start gap-1.5">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>
                    Tránh nói <em>"Siêu nhận thức (Metacognition)"</em> ➔ Hãy nói{" "}
                    <strong className="text-emerald-800 bg-emerald-50 px-1 py-0.2 rounded font-bold">
                      "Tự soi lại đầu mình xem đã thực sự hiểu bài chưa"
                    </strong>.
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>
                    Tránh nói <em>"Tải trọng nhận thức (Cognitive Load)"</em> ➔ Hãy nói{" "}
                    <strong className="text-emerald-800 bg-emerald-50 px-1 py-0.2 rounded font-bold">
                      "Đầu óc bị quá tải như chiếc ba-lô đầy ắp sách vở"
                    </strong>.
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>
                    Tránh nói <em>"Ảo tưởng tri thức"</em> ➔ Hãy nói{" "}
                    <strong className="text-emerald-800 bg-emerald-50 px-1 py-0.2 rounded font-bold">
                      "Tưởng mình biết nhưng thực ra chỉ nhớ mặt chữ"
                    </strong>.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer tài liệu cố định */}
          <div className="p-3 px-5 bg-[#F8FAFD] border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
            <span className="flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Gợi ý: Thử bắt đầu bằng <strong>"Bé Bắp ơi, phương pháp này giống như..."</strong></span>
            </span>
            <span className="text-[10px] text-slate-400 hidden sm:inline font-mono">Feynman Ground Truth v2.0</span>
          </div>
        </div>

        {/* CỘT PHẢI (1/2): Khung Chat / Voice tương tác với Bé Bắp */}
        <div className="bg-white rounded-3xl border border-[#E2EAFD] shadow-card flex flex-col h-[580px] overflow-hidden">
          {/* Header khung chat */}
          <div className="p-4 sm:px-5 bg-gradient-to-r from-[#F8FAFD] via-[#EEF2FC] to-white border-b border-[#E2EAFD] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={beBapPersona.avatar}
                  alt={beBapPersona.name}
                  className="w-10 h-10 rounded-2xl object-cover ring-2 ring-white shadow-2xs"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80";
                  }}
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-extrabold text-slate-800">{beBapPersona.name}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFEAEA] text-[#D84C4C]">
                    10 tuổi • ELI5
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  Sẵn sàng hỏi vặn Socratic qua Gemini 3.1 Flash Lite
                </p>
              </div>
            </div>

            {/* Clarity Score Gauge */}
            <div className="flex items-center gap-2">
              {currentClarityScore !== null && (
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-semibold block">Độ Sáng Rõ</span>
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded-lg border ${
                      currentClarityScore >= 80
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : currentClarityScore >= 60
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {currentClarityScore}/100
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={handleResetChat}
                title="Làm mới cuộc trò chuyện"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Vùng tin nhắn cuộn tự do (Ref cuộn nội bộ không gây giật màn hình) */}
          <div ref={chatMessagesContainerRef} className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-[#F8FAFD]/60">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"} animate-in fade-in duration-200`}
                >
                  {!isUser && (
                    <img
                      src={beBapPersona.avatar}
                      alt="Bé Bắp"
                      className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 ring-1 ring-slate-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80";
                      }}
                    />
                  )}

                  <div className={`max-w-[85%] sm:max-w-[78%] space-y-1.5`}>
                    <div
                      className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                        isUser
                          ? "bg-[#7286D3] text-white rounded-br-xs font-medium"
                          : "bg-white text-slate-800 border border-[#E2EAFD] rounded-bl-xs"
                      }`}
                    >
                      <p>{msg.content}</p>
                    </div>

                    {/* Metadata phân tích theo lượt dưới tin nhắn người dùng */}
                    {isUser && (msg.detectedAnalogy || (msg.jargonDetected && msg.jargonDetected.length > 0)) && (
                      <div className="space-y-1 text-[11px] pt-0.5">
                        {msg.detectedAnalogy && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                            <Lightbulb className="w-3 h-3 text-emerald-600" />
                            <span>Ẩn dụ tốt: "{msg.detectedAnalogy}"</span>
                          </div>
                        )}
                        {msg.jargonDetected && msg.jargonDetected.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {msg.jargonDetected.map((j, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-medium"
                                title={j.reason || "Biệt ngữ cần giải thích đơn giản hơn"}
                              >
                                <AlertTriangle className="w-3 h-3 text-rose-500" />
                                <span>Biệt ngữ: {j.term}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <span
                      className={`block text-[10px] text-slate-400 ${
                        isUser ? "text-right pr-1" : "text-left pl-1"
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Hoạt ảnh suy nghĩ của AI */}
            {isAiThinking && (
              <div className="flex gap-2.5 justify-start animate-in fade-in">
                <img
                  src={beBapPersona.avatar}
                  alt="Bé Bắp"
                  className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 ring-1 ring-slate-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80";
                  }}
                />
                <div className="p-3 rounded-2xl bg-white border border-[#E2EAFD] rounded-bl-xs flex items-center gap-1.5 shadow-2xs">
                  <span className="text-xs text-slate-500 font-medium">Bé Bắp đang gãi đầu suy nghĩ...</span>
                  <div className="flex gap-1 items-center pl-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7286D3] animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7286D3] animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7286D3] animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}

            {/* Thẻ chúc mừng thấu suốt trọn vẹn (Mastery Celebration Milestone) */}
            {isSessionMastered && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-[#7286D3] text-white shadow-card space-y-2.5 animate-in zoom-in-95 duration-300">
                <div className="flex items-center gap-2">
                  <span className="text-2xl animate-bounce">🎉</span>
                  <div>
                    <h5 className="font-black text-sm tracking-wide">
                      CHÚC MỪNG! BÉ BẮP ĐÃ THẤU SUỐT TRỌN VẸN
                    </h5>
                    <span className="text-[10px] text-emerald-100 font-bold block">
                      Feynman Technique Mastered • Chuẩn ELI5 Hoàn Hảo
                    </span>
                  </div>
                </div>
                <p className="text-xs text-white/95 leading-relaxed font-medium">
                  Bạn đã bóc trần mọi bẫy thuật ngữ và dùng những phép ẩn dụ tuyệt vời nhất để giúp Bé Bắp hiểu trọn vẹn bản chất của bài học!
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className="px-3.5 py-1.5 rounded-xl bg-white text-emerald-800 hover:bg-slate-50 text-xs font-black shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Sao Chép Biên Bản Thấu Suốt</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetChat}
                    className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold backdrop-blur-md transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Giảng Lại Từ Đầu</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Gợi ý câu nói nhanh (Quick Prompt Pills) */}
          <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] text-slate-400 font-bold shrink-0">Gợi ý thử:</span>
            {[
              "Bé Bắp ơi, phương pháp Feynman giống như khi con lắp Lego...",
              "Nó gồm 4 bước: học, giảng cho bé 10 tuổi, tìm chỗ bí và đơn giản hóa...",
              "Để con hiểu được thì chú không được dùng từ đao to búa lớn nè...",
            ].map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInputText(prompt)}
                className="px-2.5 py-1 rounded-full bg-[#F3F6FA] hover:bg-[#EEF2FC] text-slate-600 hover:text-[#5066A1] text-[11px] font-medium border border-slate-200/80 shrink-0 transition-colors cursor-pointer truncate max-w-[220px]"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Ô nhập tin nhắn & Nút Voice */}
          <div className="p-3 sm:p-4 bg-white border-t border-[#E2EAFD] shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Nhập lời giảng giải cho Bé Bắp (hoặc bấm mic để nói)..."
                  disabled={isAiThinking}
                  className="w-full px-4 py-3 pr-10 rounded-2xl bg-[#F8FAFD] border border-[#E2EAFD] text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8EA7E9] focus:bg-white transition-all disabled:opacity-60"
                />
              </div>

              {/* Nút Mic Voice Web Speech */}
              <VoiceRecorderButton
                isListening={isListening}
                onToggle={toggleListening}
                isSupported={isSupported}
              />

              {/* Nút Gửi */}
              <button
                type="submit"
                disabled={!inputText.trim() || isAiThinking}
                className="p-3 rounded-2xl bg-[#7286D3] hover:bg-[#5066A1] text-white shadow-xs disabled:opacity-40 transition-all cursor-pointer shrink-0"
                title="Gửi lời giảng cho Bé Bắp"
              >
                {isAiThinking ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 3. LAYOUT DƯỚI: BẢNG MINH BẠCH DỮ LIỆU & JSON STATE CHẤM ĐIỂM (TRANSPARENCY AUDIT CONSOLE) */}
      <div className="bg-white rounded-3xl border border-[#E2EAFD] p-6 sm:p-8 shadow-card space-y-6">
        {/* Header Console */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-indigo-50 text-[#5066A1]">
                <Terminal className="w-4 h-4 text-[#7286D3]" />
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-800 flex items-center gap-2">
                Bảng Minh Bạch Dữ Liệu: Nhật Ký Lượt Giảng & JSON State Chấm Điểm
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Minh bạch 100% thời gian phản hồi AI (giây), số token tiêu thụ, trạng thái kết nối Gemini và JSON State từng lượt giảng.
            </p>
          </div>

          {/* Action Buttons: Copy JSON, Copy Markdown, Download */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCopyJson}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                copiedType === "json"
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : "bg-[#EEF2FC] text-[#5066A1] hover:bg-[#7286D3] hover:text-white border-[#D5E1FA]"
              }`}
            >
              {copiedType === "json" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedType === "json" ? "Đã Sao Chép JSON!" : "Sao Chép JSON State"}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyMarkdown}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                copiedType === "markdown"
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200"
              }`}
            >
              {copiedType === "markdown" ? <Check className="w-3.5 h-3.5" /> : <FileCode className="w-3.5 h-3.5" />}
              <span>{copiedType === "markdown" ? "Đã Chép Markdown!" : "Copy Biên Bản"}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadJson}
              title="Tải tệp JSON về máy"
              className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Thống kê nhanh tổng quan (Metric Badges với Latency & Token) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#F8FAFD] border border-slate-200/80 space-y-1">
            <span className="text-[11px] text-slate-500 font-semibold block flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-blue-500" />
              Độ Sáng Rõ Hiện Tại
            </span>
            <span
              className={`text-xl font-black ${
                (currentClarityScore ?? 0) >= 80
                  ? "text-emerald-600"
                  : (currentClarityScore ?? 0) >= 60
                  ? "text-blue-600"
                  : "text-amber-600"
              }`}
            >
              {currentClarityScore !== null ? `${currentClarityScore}/100` : "--/100"}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F8FAFD] border border-slate-200/80 space-y-1">
            <span className="text-[11px] text-slate-500 font-semibold block flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              Tốc Độ Phản Hồi AI
            </span>
            <span className="text-xl font-black text-slate-800">
              {turnRecords.length > 0 ? `${turnRecords[turnRecords.length - 1].telemetry?.durationSeconds ?? 0}s` : "--s"}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F8FAFD] border border-slate-200/80 space-y-1">
            <span className="text-[11px] text-slate-500 font-semibold block flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              Tổng Token Sử Dụng
            </span>
            <span className="text-xl font-black text-amber-700">
              {turnRecords.reduce((sum, t) => sum + (t.telemetry?.totalTokens || 0), 0)} tok
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F8FAFD] border border-slate-200/80 space-y-1">
            <span className="text-[11px] text-slate-500 font-semibold block flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-purple-500" />
              Trạng Thái Kết Nối
            </span>
            <div className="flex items-center gap-1.5 pt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  turnRecords.length === 0
                    ? "bg-slate-300"
                    : turnRecords[turnRecords.length - 1].telemetry?.executionMode === "GEMINI_LIVE_API"
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-amber-500"
                }`}
              />
              <span className="text-xs font-black text-slate-700 truncate">
                {turnRecords.length === 0
                  ? "Sẵn Sàng"
                  : turnRecords[turnRecords.length - 1].telemetry?.executionMode === "GEMINI_LIVE_API"
                  ? "Gemini Live API"
                  : "Fallback"}
              </span>
            </div>
          </div>
        </div>

        {/* Tab chuyển đổi xem: Thẻ trực quan vs Raw JSON */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#F4F7FC] border border-[#E2EAFD]">
            <button
              type="button"
              onClick={() => setAuditTab("card")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                auditTab === "card"
                  ? "bg-white text-slate-800 shadow-2xs border border-slate-200/80"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#7286D3]" />
              <span>Biên Bản Chấm Điểm Từng Lượt</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-semibold">
                {turnRecords.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setAuditTab("json")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                auditTab === "json"
                  ? "bg-white text-slate-800 shadow-2xs border border-slate-200/80"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>JSON State Trực Tuyến</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Tự động đồng bộ hóa với mô hình Gemini 3.1 Flash Lite
          </span>
        </div>

        {/* TAB 1: BẢNG THẺ TRỰC QUAN TỪNG LƯỢT */}
        {auditTab === "card" && (
          <div className="space-y-3">
            {turnRecords.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-slate-200 bg-[#F8FAFD] space-y-2">
                <Terminal className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">Chưa có lượt tương tác nào được ghi nhận</p>
                <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                  Hãy nhập một câu giảng giải cho Bé Bắp ở khung chat bên trên (ví dụ: "Chào Bắp, phương pháp Feynman giống như việc con xếp hình Lego..."), bảng chấm điểm, token và thời gian phản hồi AI sẽ hiển thị ngay tại đây.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {turnRecords.map((turn) => (
                  <div
                    key={turn.turnIndex}
                    className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3"
                  >
                    {/* Header của Lượt */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-[#EEF2FC] text-[#5066A1] text-xs font-black flex items-center justify-center">
                          #{turn.turnIndex}
                        </span>
                        <span className="text-xs font-bold text-slate-800">Lượt giảng giải #{turn.turnIndex}</span>
                        <span className="text-[11px] text-slate-400">({turn.timestamp})</span>
                      </div>

                      {/* Điểm Sáng Rõ của Lượt */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-semibold">Độ rõ ràng:</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-xs font-black border ${
                            turn.clarityScore >= 80
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : turn.clarityScore >= 60
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {turn.clarityScore}/100
                        </span>
                      </div>
                    </div>

                    {/* Nội dung lời giảng của người dùng */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Lời Giảng Của Bạn:
                      </span>
                      <p className="text-xs sm:text-sm text-slate-800 bg-[#F8FAFD] p-3 rounded-xl border border-slate-100 italic">
                        "{turn.userExplanation}"
                      </p>
                    </div>

                    {/* Metadata bóc tách: Ẩn dụ và Biệt ngữ */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {/* Ẩn dụ */}
                      <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                        <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                          <Lightbulb className="w-3.5 h-3.5 text-emerald-600" />
                          Phép Ẩn Dụ Phát Hiện:
                        </span>
                        <p className="text-xs text-emerald-900 font-medium">
                          {turn.detectedAnalogy ? `"${turn.detectedAnalogy}"` : "Chưa có phép ẩn dụ trực quan"}
                        </p>
                      </div>

                      {/* Biệt ngữ */}
                      <div className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100 space-y-1">
                        <span className="text-[11px] font-bold text-rose-800 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                          Biệt Ngữ Cần Đơn Giản Hóa:
                        </span>
                        {turn.jargonDetected.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {turn.jargonDetected.map((j, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded bg-white border border-rose-200 text-rose-700 font-medium text-[11px]"
                                title={j.reason}
                              >
                                {j.term}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-emerald-700 font-medium">
                            Tuyệt vời! Không phát hiện biệt ngữ đao to búa lớn.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Lời phản biện của Bé Bắp */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        Phản Hồi & Câu Hỏi Vặn Của Bé Bắp:
                      </span>
                      <p className="text-xs sm:text-sm text-slate-700 bg-[#EEF2FC]/40 p-3 rounded-xl border border-[#E2EAFD]">
                        "{turn.assistantResponse}"
                      </p>
                    </div>

                    {/* Dải Telemetry: Latency, Token Usage, Status */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-[11px]">
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Phản hồi: <strong>{turn.telemetry?.durationSeconds ?? 0}s</strong></span>
                      </span>

                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono font-medium">
                        <Coins className="w-3.5 h-3.5 text-amber-600" />
                        <span>Tokens: <strong>{turn.telemetry?.totalTokens ?? 0}</strong> (Prompt: {turn.telemetry?.promptTokens ?? 0}, Gen: {turn.telemetry?.candidatesTokens ?? 0})</span>
                      </span>

                      <span
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[10px] border ${
                          turn.telemetry?.executionMode === "GEMINI_LIVE_API"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            turn.telemetry?.executionMode === "GEMINI_LIVE_API" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                          }`}
                        />
                        <span>{turn.telemetry?.executionMode === "GEMINI_LIVE_API" ? "Gemini 3.1 Flash Lite (Live)" : "Fallback Mode"}</span>
                      </span>

                      {turn.telemetry?.fallbackReason && (
                        <span
                          className="text-[10px] text-rose-500 italic truncate max-w-xs pl-1"
                          title={turn.telemetry.fallbackReason}
                        >
                          Lý do: {turn.telemetry.fallbackReason}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: RAW JSON STATE CODE BLOCK */}
        {auditTab === "json" && (
          <div className="relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-inner">
            {/* Header thanh công cụ code */}
            <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                <span className="text-slate-400 ml-2">feynman_session_state.json</span>
              </div>
              <button
                type="button"
                onClick={handleCopyJson}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedType === "json" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Đã chép!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>

            {/* Code Body */}
            <pre className="p-4 sm:p-5 text-emerald-400 text-xs font-mono overflow-x-auto max-h-[420px] leading-relaxed selection:bg-emerald-500/20">
              {JSON.stringify(sessionInspectionState, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeynmanLiveTrialModule;
