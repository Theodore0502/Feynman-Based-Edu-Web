/**
 * File: src/components/stage/ChatTranscript.tsx
 * Mục đích: Hiển thị dòng thời gian đối thoại (Chat Transcript) giữa người học và AI Persona, tích hợp badge Jargon cảnh báo trực tiếp trên tin nhắn.
 * Thành phần chính:
 *   - ChatTranscript: Danh sách tin nhắn cuộn tự động kèm bong bóng chat pastel.
 * Props/Inputs:
 *   - messages: ChatMessage[] - Danh sách tin nhắn.
 *   - persona: PersonaDefinition - Thông tin Persona.
 *   - isStreaming?: boolean - Trạng thái AI đang stream câu trả lời.
 */

import React, { useRef, useEffect } from "react";
import type { ChatMessage } from "@/types/session.types";
import type { PersonaDefinition } from "@/config/personas.config";
import { JargonBadge } from "@/components/shared/JargonBadge";
import { useModalStore } from "@/hooks/useModalStore";
import { User, Sparkles, Volume2, VolumeX } from "lucide-react";

interface ChatTranscriptProps {
  messages: ChatMessage[];
  persona: PersonaDefinition;
  isStreaming?: boolean;
  onSpeakMessage?: (msg: ChatMessage) => void;
  speakingMessageId?: string | null;
  isSpeaking?: boolean;
  onStopSpeaking?: () => void;
}

export const ChatTranscript: React.FC<ChatTranscriptProps> = ({
  messages,
  persona,
  isStreaming = false,
  onSpeakMessage,
  speakingMessageId,
  isSpeaking = false,
  onStopSpeaking,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const { openModal } = useModalStore();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#F9FBFE] rounded-3xl border border-[#E8EEF8]">
      {messages.length === 0 && (
        <div className="text-center py-12 space-y-3">
          <div className="w-16 h-16 rounded-3xl mx-auto p-1 bg-gradient-to-tr from-[#8EA7E9] to-[#FFB4B4] shadow-xs">
            <img src={persona.avatar} alt={persona.name} className="w-full h-full rounded-2xl object-cover" />
          </div>
          <h4 className="font-extrabold text-slate-800 text-sm">
            {persona.name} ({persona.age}) đã sẵn sàng lắng nghe!
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Hãy bắt đầu bằng cách nói hoặc gõ một câu mở đầu thật bình dân. {persona.name} sẽ hỏi lại ngay nếu nghe thấy từ khó hiểu.
          </p>
        </div>
      )}

      {messages.map((msg, idx) => {
        const isUser = msg.role === "user";
        const analysis = msg.analysisMetadata;

        return (
          <div
            key={msg.id || idx}
            className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
          >
            {/* Avatar */}
            {isUser ? (
              <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-[#7286D3] to-[#8EA7E9] flex items-center justify-center text-white shrink-0 shadow-xs">
                <User className="w-4 h-4" />
              </div>
            ) : (
              <img
                src={persona.avatar}
                alt={persona.name}
                className="w-8 h-8 rounded-2xl object-cover shrink-0 ring-1 ring-[#B5B2E8]"
              />
            )}

            {/* Bubble */}
            <div className={`max-w-[80%] space-y-1.5 ${isUser ? "items-end" : "items-start"}`}>
              <div
                className={`p-4 rounded-3xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                  isUser
                    ? "bg-[#7286D3] text-white rounded-tr-xs"
                    : "bg-white text-slate-800 border border-[#E2EAFD] rounded-tl-xs"
                }`}
              >
                {msg.content}
              </div>

              {/* Loa phát giọng nói tiếng Việt cho tin nhắn của AI Persona */}
              {!isUser && onSpeakMessage && (
                <div className="flex items-center gap-2 pt-0.5 pl-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (speakingMessageId === msg.id && isSpeaking) {
                        onStopSpeaking?.();
                      } else {
                        onSpeakMessage(msg);
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                      speakingMessageId === msg.id && isSpeaking
                        ? "bg-purple-100 text-purple-700 animate-pulse border border-purple-300"
                        : "text-slate-400 hover:text-[#5066A1] hover:bg-[#EEF2FC]/90"
                    }`}
                    title={
                      speakingMessageId === msg.id && isSpeaking
                        ? "Đang phát giọng nói... Bấm để dừng"
                        : `Nghe giọng nói của ${persona.name}`
                    }
                  >
                    {speakingMessageId === msg.id && isSpeaking ? (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-purple-600 animate-bounce" />
                        <span>Đang đọc...</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Nghe {persona.name} nói</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Jargon Badges nếu có trong phân tích của tin nhắn người dùng */}
              {isUser && analysis && analysis.jargonDetected?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 justify-end pt-1">
                  {analysis.jargonDetected.map((j, jIdx) => (
                    <JargonBadge
                      key={jIdx}
                      term={j.term}
                      isExplained={j.isExplainedSimply}
                      reason={j.reason}
                      onClick={() => openModal("JARGON_INSPECTOR", { jargons: analysis.jargonDetected })}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {isStreaming && (
        <div className="flex items-center gap-3">
          <img src={persona.avatar} alt={persona.name} className="w-8 h-8 rounded-2xl object-cover" />
          <div className="p-3.5 rounded-2xl bg-white border border-[#E2EAFD] flex items-center gap-2 text-xs text-slate-500 shadow-xs">
            <Sparkles className="w-4 h-4 text-[#7286D3] animate-spin" />
            <span>{persona.name} đang suy nghĩ câu hỏi...</span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

