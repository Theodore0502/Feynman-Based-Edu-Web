/**
 * File: src/pages/FeynmanStageLiveRoom.tsx
 * Mục đích: [Trang 5] The Feynman Stage (Live Room) - Nơi người học thực hành giảng giải theo thời gian thực cho AI Persona bằng giọng nói hoặc văn bản, đồng bộ trực tiếp với Supabase.
 * Thành phần chính:
 *   - FeynmanStageLiveRoom: Tích hợp ChatTranscript, VoiceRecorderButton, RealtimeAnalyzerPanel, LogicFlowMiniMap và SupabaseService.
 * Props/Inputs: Không có.
 */

import React, { useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { getPersonaById } from "@/config/personas.config";
import { ChatTranscript } from "@/components/stage/ChatTranscript";
import { RealtimeAnalyzerPanel } from "@/components/stage/RealtimeAnalyzerPanel";
import { LogicFlowMiniMap } from "@/components/stage/LogicFlowMiniMap";
import { VoiceRecorderButton } from "@/components/shared/VoiceRecorderButton";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { SupabaseService } from "@/lib/services/supabase-service";
import type { ChatMessage } from "@/types/session.types";
import type { AnalyticalResult } from "@/types/agent.types";
import { Send, ArrowLeft } from "lucide-react";

export const FeynmanStageLiveRoom: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const sessionId = params.sessionId as string;

  const initialTopic = searchParams.get("topic") || "Cơ chế Docker Container";
  const initialPersona = searchParams.get("persona") || "child_10yo";

  const [topic] = useState(initialTopic);
  const [personaId] = useState(initialPersona);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [latestAnalysis, setLatestAnalysis] = useState<AnalyticalResult | null>(null);

  const persona = getPersonaById(personaId);

  const { isListening, toggleListening, isSupported } = useSpeechToText((text) =>
    setInput((prev) => (prev ? `${prev} ${text}` : text))
  );

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userText = input.trim();
    setInput("");

    const hasJargons = userText.toLowerCase().includes("kernel") || userText.toLowerCase().includes("container") || userText.toLowerCase().includes("lạm phát");
    const currentClarity = hasJargons ? 65 : 85;

    const mockAnalysis: AnalyticalResult = {
      jargonDetected: hasJargons ? [{ term: "Kernel / Container", isExplainedSimply: false, reason: "Từ học thuật kỹ thuật chưa được ví von đời thường" }] : [],
      logicGaps: [],
      currentClarityScore: currentClarity,
      detectedAnalogy: userText.includes("như") || userText.includes("giống") ? "Phép so sánh đời thường" : null,
      isReadyToComplete: messages.length >= 3,
    };

    setLatestAnalysis(mockAnalysis);

    const newMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sessionId,
      role: "user",
      content: userText,
      analysisMetadata: mockAnalysis,
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setIsStreaming(true);

    // Lưu User message vào Supabase
    SupabaseService.addMessage(sessionId, "user", userText, mockAnalysis);

    // AI Socrates response simulation
    setTimeout(() => {
      const assistantText = hasJargons
        ? `Ủa chú ơi, "Kernel" với "Container" là cái gì trong đời thực vậy ạ? Có giống như cái hộp đựng bút của con không chú?`
        : `A con hiểu rồi! Giống như xây nhà có sẵn bàn ghế phải không ạ? Thế nếu có người muốn đổi bàn ghế khác thì sao chú?`;

      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sessionId,
        role: "assistant",
        content: assistantText,
        createdAt: new Date().toISOString(),
      };

      setMessages([...updatedMessages, assistantMsg]);
      setIsStreaming(false);

      // Lưu Assistant message vào Supabase
      SupabaseService.addMessage(sessionId, "assistant", assistantText);
    }, 800);
  };

  const handleFinishSession = async () => {
    const score = latestAnalysis?.currentClarityScore || 85;
    // Lưu báo cáo vào Supabase
    await SupabaseService.saveEvaluationReport(
      sessionId,
      score,
      88,
      "Docker giống như căn hộ chung cư xây sẵn đầy đủ tiện nghi, chỉ việc dọn vào ở.",
      ["Cơ chế cách ly Namespace", "Cgroup kiểm soát tài nguyên"],
      "Giải thích rất lưu loát và gạt bỏ được các thuật ngữ trừu tượng."
    );

    // Lưu thuật ngữ vào Vault
    await SupabaseService.addVaultItem(
      topic,
      "Đã giải thích bình dân hóa vượt qua kiểm định của người nghe.",
      "Ẩn dụ trực quan sinh động",
      topic
    );

    navigate(`/stage/${sessionId}/report?topic=${encodeURIComponent(topic)}&score=${score}`);
  };

  return (
    <div className="space-y-4">
      {/* Top Session Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-[#E8EEF8] shadow-subtle">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7286D3]">
              Đang Giảng Giải Cho {persona.name} ({persona.title})
            </span>
            <h3 className="text-base font-extrabold text-slate-800">{topic}</h3>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={handleFinishSession}
            className="px-4 py-2 rounded-2xl bg-[#EEF2FC] hover:bg-[#D8E3FB] text-[#5066A1] font-bold text-xs border border-[#D5E1FA] transition-colors cursor-pointer"
          >
            Kết Thúc Buổi Giảng
          </button>
        </div>
      </div>

      {/* Logic Flow Minimap */}
      <LogicFlowMiniMap currentStep={Math.min(3, Math.floor(messages.length / 2))} />

      {/* Main Live Room: Left Transcript + Right Realtime Analyzer */}
      <div className="flex flex-col lg:flex-row gap-5 min-h-[560px]">
        {/* Left: Chat Transcript + Input Box */}
        <div className="flex-1 flex flex-col justify-between space-y-4">
          <ChatTranscript
            messages={messages}
            persona={persona}
            isStreaming={isStreaming}
          />

          {/* Input Box with Voice Recorder */}
          <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Giảng giải cho ${persona.name}... (Nhấn micro để nói)`}
              className="flex-1 py-3.5 pl-5 pr-28 rounded-3xl bg-white border border-[#E2EAFD] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#8EA7E9] shadow-xs"
            />

            <div className="absolute right-2 flex items-center gap-1.5">
              <VoiceRecorderButton
                isListening={isListening}
                onToggle={toggleListening}
                isSupported={isSupported}
              />
              <button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className="p-3 rounded-2xl bg-[#7286D3] hover:bg-[#5066A1] text-white disabled:opacity-40 transition-all cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Right: Realtime Analyzer Panel */}
        <RealtimeAnalyzerPanel
          analysis={latestAnalysis}
          topic={topic}
          personaId={personaId}
          onFinishSession={handleFinishSession}
        />
      </div>
    </div>
  );
};

export default FeynmanStageLiveRoom;
