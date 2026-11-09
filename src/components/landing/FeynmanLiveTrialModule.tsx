/**
 * File: src/components/landing/FeynmanLiveTrialModule.tsx
 * Mục đích: Module thử nghiệm trực tiếp 1:1 trên Landing Page cho khách trải nghiệm giảng giải Feynman với Bé Bắp (Gemini AI).
 * Bố cục:
 *   - Phần trên: Bố cục 1:1 (Cột trái: Tài liệu chuẩn bị nạp từ Supabase | Cột phải: Khung chat/voice với Bé Bắp)
 *   - Phần dưới: Bảng minh bạch dữ liệu (Live Audit Console) hiển thị lịch sử đối thoại, các chỉ số chấm điểm từng lượt và Raw JSON State để người dùng copy đánh giá.
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { GeminiCurriculumService } from "@/lib/services/gemini-service";
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

interface TurnRecord {
  turnIndex: number;
  userExplanation: string;
  clarityScore: number;
  detectedAnalogy: string | null;
  jargonDetected: JargonItem[];
  logicGaps: LogicGapItem[];
  assistantResponse: string;
  timestamp: string;
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

  // Lưu trữ danh sách các lượt giảng giải đã phân tích (dùng cho bảng chấm điểm & JSON State)
  const [turnRecords, setTurnRecords] = useState<TurnRecord[]>([]);

  // Tab xem ở bảng minh bạch: 'card' (thẻ trực quan) hoặc 'json' (raw json state)
  const [auditTab, setAuditTab] = useState<"card" | "json">("card");
  const [copiedType, setCopiedType] = useState<"json" | "markdown" | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Web Speech-to-Text hook
  const { isListening, toggleListening, isSupported } = useSpeechToText((transcript) => {
    setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
  });

  // Tự động cuộn xuống cuối khung chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAiThinking]);

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

  // 2. Gửi lời giảng sang Gemini AI
  const handleSendMessage = async (textToSend?: string) => {
    const rawContent = (textToSend || inputText).trim();
    if (!rawContent || isAiThinking) return;

    setInputText("");

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

      // Phân tích Clarity & Jargon thời gian thực
      const analysis = await GeminiCurriculumService.analyzeTurnRealtime(topicTitle, rawContent);
      setCurrentClarityScore(analysis.currentClarityScore);

      // Cập nhật điểm phân tích vào tin nhắn người dùng
      setMessages((prev) =>
        prev.map((m) =>
          m.id === userMsgId
            ? {
                ...m,
                clarityScore: analysis.currentClarityScore,
                detectedAnalogy: analysis.detectedAnalogy || undefined,
                jargonDetected: analysis.jargonDetected,
                logicGaps: analysis.logicGaps,
              }
            : m
        )
      );

      // Chuẩn bị lịch sử hội thoại cho Gemini Persona Bé Bắp
      const historyForGemini = messages
        .filter((m) => m.id !== "msg-welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      historyForGemini.push({ role: "user", content: rawContent });

      // Gọi Gemini LLM tạo phản ứng Socratic của Bé Bắp
      const personaReply = await GeminiCurriculumService.generatePersonaChatResponse({
        topic: topicTitle,
        persona: beBapPersona,
        chatHistory: historyForGemini,
        userMessage: rawContent,
      });

      const assistantMsg: MessageItem = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: personaReply,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Ghi nhận vào danh mục các lượt chấm điểm chi tiết (Turn Records)
      setTurnRecords((prev) => [
        ...prev,
        {
          turnIndex: prev.length + 1,
          userExplanation: rawContent,
          clarityScore: analysis.currentClarityScore,
          detectedAnalogy: analysis.detectedAnalogy || null,
          jargonDetected: analysis.jargonDetected || [],
          logicGaps: analysis.logicGaps || [],
          assistantResponse: personaReply,
          timestamp: now,
        },
      ]);
    } catch (error) {
      console.error("Lỗi tương tác Gemini:", error);
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
        },
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Reset cuộc đối thoại
  const handleResetChat = () => {
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
    setInputText("");
  };

  // Tạo đối tượng JSON State hoàn chỉnh cho toàn bộ phiên
  const sessionInspectionState = useMemo(() => {
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
        status: turnRecords.length === 0 ? "NOT_STARTED" : "ACTIVE_TESTING",
      },
      turns_log: turnRecords,
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
        transparency_mode: "FULL_AUDIT_LOG",
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
    md += `- **Tổng số lượt giảng:** ${turnRecords.length}\n\n`;
    md += `## CHI TIẾT TỪNG LƯỢT GIẢNG GIẢI (TURN-BY-TURN):\n\n`;

    if (turnRecords.length === 0) {
      md += `*Chưa có lượt giảng giải nào được ghi nhận.*\n`;
    } else {
      turnRecords.forEach((t) => {
        md += `### 🔹 Lượt #${t.turnIndex} (${t.timestamp})\n`;
        md += `* **Người học:** "${t.userExplanation}"\n`;
        md += `* **Độ sáng rõ:** \`${t.clarityScore}/100\`\n`;
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
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      console.error("Không thể copy JSON:", err);
    }
  };

  // Hàm sao chép Markdown
  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdownTranscript);
      setCopiedType("markdown");
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      console.error("Không thể copy Markdown:", err);
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
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EEF2FC] text-[#5066A1] text-xs font-bold border border-[#D5E1FA]">
          <Sparkles className="w-4 h-4 text-[#7286D3]" />
          <span>Trải Nghiệm Trực Tuyến Live 1-Click • Không Cần Đăng Nhập</span>
        </div>
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
        <div className="bg-white rounded-3xl border border-[#E2EAFD] p-6 sm:p-7 shadow-card flex flex-col justify-between">
          <div className="space-y-5">
            {/* Tiêu đề & Tag nguồn Supabase */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#EEF2FC] text-[#5066A1] flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5 text-[#7286D3]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">
                    {feynmanTopic?.title || "Lý thuyết & Kỹ thuật Học tập Feynman"}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Khoa Học Giáo Dục & Kỹ Năng Học Thuật • Nguồn Supabase
                  </span>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Live Supabase
              </span>
            </div>

            {/* Khái niệm cốt lõi & Tóm lược */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-[#7286D3]" />
                Bản Chất Phương Pháp (Ground Truth)
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-[#F8FAFD] p-3.5 rounded-2xl border border-slate-100">
                Phương pháp Feynman là kỹ thuật học tập chủ động dựa trên nguyên lý{" "}
                <span className="bg-indigo-100/80 text-indigo-800 font-semibold px-1.5 py-0.5 rounded">
                  Tư duy phản biện
                </span>{" "}
                và{" "}
                <span className="bg-purple-100/80 text-purple-800 font-semibold px-1.5 py-0.5 rounded">
                  Siêu nhận thức
                </span>
                . Thay vì học vẹt thuật ngữ, người học chứng minh sự thấu suốt bằng cách{" "}
                <span className="bg-amber-100 text-amber-900 font-semibold px-1.5 py-0.5 rounded">
                  Đơn giản hóa ngôn từ
                </span>{" "}
                cho một đứa trẻ 10 tuổi và kiến tạo các{" "}
                <span className="bg-emerald-100 text-emerald-900 font-semibold px-1.5 py-0.5 rounded">
                  Phép ẩn dụ
                </span>{" "}
                gần gũi để bóc trần những{" "}
                <span className="bg-rose-100 text-rose-900 font-semibold px-1.5 py-0.5 rounded">
                  Lỗ hổng tri thức
                </span>
                .
              </p>
            </div>

            {/* 4 Bước Vàng của Kỹ thuật Feynman */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#7286D3]" />
                4 Bước Thực Hành Chuẩn
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <span className="w-5 h-5 rounded-full bg-[#EEF2FC] text-[#5066A1] text-[11px] flex items-center justify-center font-black">
                      1
                    </span>
                    <span>Chọn Chủ Đề Cần Học</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Xác định một khái niệm cụ thể và ghi chép lại mọi kiến thức bạn đã biết.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-[#EEF2FC]/50 border border-[#D5E1FA] shadow-2xs space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#5066A1]">
                    <span className="w-5 h-5 rounded-full bg-[#7286D3] text-white text-[11px] flex items-center justify-center font-black">
                      2
                    </span>
                    <span>Giảng Cho Trẻ 10 Tuổi</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Chỉ dùng từ ngữ bình dân, nói mạch lạc không nhìn tài liệu (như giải thích cho Bé Bắp).
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[11px] flex items-center justify-center font-black">
                      3
                    </span>
                    <span>Bắt Lỗ Hổng & Tra Cứu</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Chỗ nào bạn bị ấp úng hoặc phải dùng từ đao to búa lớn, đó chính là điểm chưa hiểu thật.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] flex items-center justify-center font-black">
                      4
                    </span>
                    <span>Đơn Giản Hóa & Ẩn Dụ</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Sáng tạo phép ẩn dụ (như xếp hình Lego, nấu ăn) để neo giữ bản chất tri thức.
                  </p>
                </div>
              </div>
            </div>

            {/* Cảnh báo Bẫy Thuật Ngữ cần tránh */}
            <div className="p-3.5 rounded-2xl bg-[#FFF9F9] border border-[#FFDADA] space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Bẫy Thuật Ngữ Cấm Kỵ Đối Với Bé Bắp:</span>
              </div>
              <ul className="text-[11px] text-rose-700 space-y-1 list-disc pl-5">
                <li>
                  Tránh nói <em>"Metacognition / Siêu nhận thức"</em> ➔ Hãy nói <em>"Tự soi chiếu lại xem đầu mình đã hiểu thật chưa"</em>.
                </li>
                <li>
                  Tránh nói <em>"Cognitive Load / Tải trọng nhận thức"</em> ➔ Hãy nói <em>"Đầu óc bị quá tải như chiếc balo đầy ắp sách"</em>.
                </li>
                <li>
                  Tránh nói <em>"Ảo tưởng thông thạo"</em> ➔ Hãy nói <em>"Tưởng mình biết nhưng thực ra chỉ nhớ mặt chữ"</em>.
                </li>
              </ul>
            </div>
          </div>

          {/* Footer cột trái: Gợi ý thử ngay */}
          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Mẹo: Thử dùng ẩn dụ <strong>"Xếp hình Lego"</strong> xem Bé Bắp phản ứng thế nào nhé!
            </span>
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

          {/* Vùng tin nhắn cuộn tự do */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-[#F8FAFD]/60">
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

            <div ref={messagesEndRef} />
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
              Dữ liệu được cập nhật trực tiếp sau mỗi lượt bạn nói. Bạn có thể sao chép nhanh JSON để gửi cho AI hoặc giáo viên đánh giá.
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

        {/* Thống kê nhanh tổng quan (Metric Badges) */}
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
              <Layers className="w-3.5 h-3.5 text-purple-500" />
              Tổng Lượt Giảng
            </span>
            <span className="text-xl font-black text-slate-800">{turnRecords.length} lượt</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F8FAFD] border border-slate-200/80 space-y-1">
            <span className="text-[11px] text-slate-500 font-semibold block flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              Ẩn Dụ Đã Kiến Tạo
            </span>
            <span className="text-xl font-black text-amber-700">
              {turnRecords.filter((t) => !!t.detectedAnalogy).length} ẩn dụ
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F8FAFD] border border-slate-200/80 space-y-1">
            <span className="text-[11px] text-slate-500 font-semibold block flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              Biệt Ngữ Bị Bắt Bẻ
            </span>
            <span className="text-xl font-black text-rose-600">
              {turnRecords.reduce((sum, t) => sum + (t.jargonDetected?.length || 0), 0)} từ khó
            </span>
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
                  Hãy nhập một câu giảng giải cho Bé Bắp ở khung chat bên trên (ví dụ: "Chào Bắp, phương pháp Feynman giống như việc con xếp hình Lego..."), bảng chấm điểm và JSON State sẽ hiển thị ngay tại đây.
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
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
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
