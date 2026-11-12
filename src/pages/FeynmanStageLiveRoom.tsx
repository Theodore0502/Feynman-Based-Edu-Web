/**
 * File: src/pages/FeynmanStageLiveRoom.tsx
 * Mục đích: [Trang 5] The Feynman Stage (Live Room) - Nơi người học thực hành giảng giải theo thời gian thực cho AI Persona bằng giọng nói hoặc văn bản, đồng bộ trực tiếp với Supabase.
 * Thành phần chính:
 *   - FeynmanStageLiveRoom: Tích hợp ChatTranscript, VoiceRecorderButton, RealtimeAnalyzerPanel, LogicFlowMiniMap và SupabaseService.
 * Props/Inputs: Không có.
 */

import React, { useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { getPersonaById, DEFAULT_PERSONAS } from "@/config/personas.config";
import { ChatTranscript } from "@/components/stage/ChatTranscript";
import { RealtimeAnalyzerPanel } from "@/components/stage/RealtimeAnalyzerPanel";
import { LogicFlowMiniMap } from "@/components/stage/LogicFlowMiniMap";
import { VoiceRecorderButton } from "@/components/shared/VoiceRecorderButton";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { SupabaseService } from "@/lib/services/supabase-service";
import { SpeakerScratchpadDrawer } from "@/components/study/SpeakerScratchpadDrawer";
import { useGamificationStore } from "@/hooks/useGamificationStore";
import { useNotificationStore } from "@/hooks/useNotificationStore";
import { getSubjectBySlug } from "@/data/three-tier-curriculum.data";
import { toast } from "sonner";
import { GeminiCurriculumService } from "@/lib/services/gemini-service";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import type { ChatMessage } from "@/types/session.types";
import type { AnalyticalResult } from "@/types/agent.types";
import { Send, ArrowLeft, BookOpen, Edit3, Volume2, VolumeX } from "lucide-react";

export const FeynmanStageLiveRoom: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const sessionId = params.sessionId as string;

  const initialTopic = searchParams.get("topic") || "Cơ chế Docker Container";
  const initialPersona = searchParams.get("persona") || "child_10yo";
  const domain = searchParams.get("domain");
  const subject = searchParams.get("subject");
  const currentSubject = subject ? getSubjectBySlug(subject) : undefined;

  const [topic] = useState(initialTopic);
  const [personaId] = useState(initialPersona);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [latestAnalysis, setLatestAnalysis] = useState<AnalyticalResult | null>(null);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);

  const persona = getPersonaById(personaId);

  // Hook phát giọng nói AI hai chiều (Speech-to-Speech)
  const {
    isSpeaking,
    speakingMessageId,
    isMuted,
    autoSpeak,
    speak,
    stop,
    toggleMute,
    toggleAutoSpeak,
  } = useTextToSpeech();

  // Điều hướng quay lại theo đúng trình tự cấp bậc
  const handleGoBack = () => {
    stop();
    if (domain && subject) {
      navigate(`/lectures/${domain}/${subject}`);
    } else if (domain) {
      navigate(`/lectures/${domain}`);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/lectures");
    }
  };

  const { isListening, toggleListening, isSupported } = useSpeechToText((text) =>
    setInput((prev) => (prev ? `${prev} ${text}` : text))
  );

  // Khi bắt đầu nói qua micro, dừng ngay lập tức âm thanh TTS để tránh xung đột
  const handleToggleListening = () => {
    if (isSpeaking) {
      stop();
    }
    toggleListening();
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userText = input.trim();
    setInput("");
    setIsStreaming(true);

    try {
      // 1. Phân tích lượt giảng giải thời gian thực bằng Gemini AI
      const analysis = await GeminiCurriculumService.analyzeTurnRealtime(topic, userText);
      setLatestAnalysis(analysis);

      const newMsg: ChatMessage = {
        id: `usr-${Date.now()}`,
        sessionId,
        role: "user",
        content: userText,
        analysisMetadata: analysis,
        createdAt: new Date().toISOString(),
      };

      const updatedMessages = [...messages, newMsg];
      setMessages(updatedMessages);

      // Lưu User message vào Supabase
      await SupabaseService.addMessage(sessionId, "user", userText, analysis);

      // 2. Sinh câu trả lời đối thoại Socratic bằng Gemini AI theo tính cách Persona
      const chatHistory = updatedMessages.map((m) => ({ role: m.role, content: m.content }));
      const assistantText = await GeminiCurriculumService.generatePersonaChatResponse({
        topic,
        persona: persona || DEFAULT_PERSONAS[0],
        chatHistory,
        userMessage: userText,
      });

      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sessionId,
        role: "assistant",
        content: assistantText,
        createdAt: new Date().toISOString(),
      };

      setMessages([...updatedMessages, assistantMsg]);

      // Lưu Assistant message vào Supabase
      await SupabaseService.addMessage(sessionId, "assistant", assistantText);

      // 3. Tự động phát âm thanh giọng nói Persona AI nếu autoSpeak được bật
      if (autoSpeak && !isMuted) {
        speak(assistantText, {
          personaId: persona?.id,
          customAge: persona?.age,
          skepticismLevel: persona?.skepticismLevel,
          messageId: assistantMsg.id,
        });
      }
    } catch (err: any) {
      console.error("Lỗi Feynman Stage Live:", err);
      toast.error("Lỗi khi kết nối với AI: " + err.message);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleFinishSession = async () => {
    stop();
    try {
      const chatHistory = messages.map((m) => ({ role: m.role, content: m.content }));
      const evaluation = await GeminiCurriculumService.generateSessionMasteryEvaluation({
        topic,
        persona: persona || DEFAULT_PERSONAS[0],
        chatHistory,
      });

      const score = evaluation.clarityScore;

      // Lưu báo cáo đánh giá vào Supabase
      await SupabaseService.saveEvaluationReport(
        sessionId,
        evaluation.clarityScore,
        evaluation.logicCompleteness,
        evaluation.bestAnalogy,
        evaluation.knowledgeGaps,
        evaluation.summaryFeedback
      );

      // Lưu các thuật ngữ vào Vault trên Supabase
      if (evaluation.extractedVaultTerms && evaluation.extractedVaultTerms.length > 0) {
        for (const item of evaluation.extractedVaultTerms) {
          await SupabaseService.addVaultItem(
            item.term,
            item.plainExplanation,
            item.analogyUsed || evaluation.bestAnalogy,
            topic
          );
        }
      }

      // Cập nhật chuỗi ngày và XP trong Gamification Store
      useGamificationStore.getState().recordSessionComplete(score);

      const reportParams = new URLSearchParams({
        topic,
        score: String(score),
      });
      if (domain) reportParams.set("domain", domain);
      if (subject) reportParams.set("subject", subject);

      // Lưu vào Notification Center
      useNotificationStore.getState().addNotification(
        {
          type: "REPORT_READY",
          title: "Báo cáo Feynman đã sẵn sàng",
          message: `Đã chấm xong bài giảng "${topic}". Điểm Clarity: ${score}/100.`,
          actionUrl: `/stage/${sessionId}/report?${reportParams.toString()}`,
          metadata: { score, topicId: sessionId },
        },
        false
      );

      toast.success("Buổi giảng đã hoàn tất!", {
        description: `Báo cáo đánh giá đã sẵn sàng với điểm Clarity ${score}/100.`,
      });

      navigate(`/stage/${sessionId}/report?${reportParams.toString()}`);
    } catch (err: any) {
      console.error("Lỗi khi kết thúc phiên:", err);
      toast.error("Không thể hoàn tất đánh giá: " + err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Session Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-[#E8EEF8] shadow-subtle">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleGoBack}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            title={
              currentSubject
                ? `Quay lại ${currentSubject.name}`
                : "Quay lại danh sách bài giảng"
            }
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7286D3]">
              Đang Giảng Giải Cho {persona.name} ({persona.title})
            </span>
            <h3 className="text-base font-extrabold text-slate-800">{topic}</h3>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {/* Nút bật/tắt đọc giọng nói AI */}
          <button
            type="button"
            onClick={toggleAutoSpeak}
            className={`px-3 py-2 rounded-2xl font-bold text-xs border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              autoSpeak && !isMuted
                ? "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                : "bg-[#F8FAFD] text-slate-500 border-[#E2EAFD] hover:bg-slate-100"
            }`}
            title={
              autoSpeak && !isMuted
                ? `Tự động phát âm thanh ${persona.name}: Đang BẬT (Bấm để tắt)`
                : `Tự động phát âm thanh ${persona.name}: Đang TẮT (Bấm để bật)`
            }
          >
            {autoSpeak && !isMuted ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden sm:inline">Giọng AI: Bật</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Giọng AI: Tắt</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsScratchpadOpen(true)}
            className="px-3.5 py-2 rounded-2xl bg-[#F8FAFD] hover:bg-[#EEF2FC] text-slate-700 hover:text-[#5066A1] font-bold text-xs border border-[#E2EAFD] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#7286D3]" />
            <span>Xem Phao Dàn Ý</span>
          </button>

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
            onSpeakMessage={(msg) =>
              speak(msg.content, {
                personaId: persona?.id,
                customAge: persona?.age,
                skepticismLevel: persona?.skepticismLevel,
                messageId: msg.id,
              })
            }
            speakingMessageId={speakingMessageId}
            isSpeaking={isSpeaking}
            onStopSpeaking={stop}
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
                onToggle={handleToggleListening}
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

      {/* Slide-over Speaker Scratchpad Drawer */}
      {isScratchpadOpen && (
        <SpeakerScratchpadDrawer
          mode="drawer"
          onClose={() => setIsScratchpadOpen(false)}
        />
      )}
    </div>
  );
};

export default FeynmanStageLiveRoom;
