/**
 * File: src/components/shared/VoiceRecorderButton.tsx
 * Mục đích: Nút thu âm giọng nói tương tác với Web Speech API kèm hoạt ảnh sóng âm (Dùng ở Trang 1, 5).
 * Thành phần chính:
 *   - VoiceRecorderButton: Nút bấm chuyển đổi trạng thái nghe, hiển thị hiệu ứng xung nhịp âm thanh khi nói.
 * Props/Inputs:
 *   - isListening: boolean - Trạng thái đang ghi âm.
 *   - onToggle: () => void - Callback chuyển đổi bật/tắt ghi âm.
 *   - isSupported?: boolean - Trình duyệt có hỗ trợ Web Speech API không.
 */

import React from "react";
import { Mic, MicOff, Radio } from "lucide-react";

interface VoiceRecorderButtonProps {
  isListening: boolean;
  onToggle: () => void;
  isSupported?: boolean;
}

export const VoiceRecorderButton: React.FC<VoiceRecorderButtonProps> = ({
  isListening,
  onToggle,
  isSupported = true,
}) => {
  if (!isSupported) {
    return (
      <button
        disabled
        title="Trình duyệt không hỗ trợ Web Speech API"
        className="p-3 rounded-2xl bg-slate-100 text-slate-400 cursor-not-allowed"
      >
        <MicOff className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative p-3 rounded-2xl transition-all duration-300 flex items-center justify-center cursor-pointer ${
        isListening
          ? "bg-[#F79D9D] text-white shadow-lg shadow-[#F79D9D]/40 scale-105"
          : "bg-white hover:bg-[#EEF2FC] text-[#5066A1] border border-slate-200/80 shadow-xs"
      }`}
      title={isListening ? "Nhấn để dừng nghe" : "Nói để giảng giải bằng giọng nói"}
    >
      {/* Sóng âm lan tỏa khi đang nghe */}
      {isListening && (
        <>
          <span className="absolute inset-0 rounded-2xl bg-[#F79D9D] animate-ping opacity-40 pointer-events-none" />
          <Radio className="w-5 h-5 relative z-10 animate-pulse" />
        </>
      )}

      {!isListening && <Mic className="w-5 h-5" />}
    </button>
  );
};

