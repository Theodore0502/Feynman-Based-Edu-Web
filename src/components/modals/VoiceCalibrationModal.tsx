/**
 * File: src/components/modals/VoiceCalibrationModal.tsx
 * Mục đích: Popup kiểm tra Micro, độ nhạy âm thanh và âm lượng đầu vào của Web Speech API trước khi bắt đầu phiên giảng.
 * Thành phần chính:
 *   - VoiceCalibrationModal: Modal kiểm tra micro và âm lượng.
 * Props/Inputs: useModalStore.
 */

import React, { useState } from "react";
import { useModalStore } from "@/hooks/useModalStore";
import { Mic, X, CheckCircle2, Volume2 } from "lucide-react";
import { useSpeechToText } from "@/hooks/useSpeechToText";

export const VoiceCalibrationModal: React.FC = () => {
  const { activeModal, closeModal } = useModalStore();
  const [testText, setTestText] = useState("");
  const { isListening, toggleListening, isSupported } = useSpeechToText((text) => setTestText(text));

  const isOpen = activeModal === "VOICE_CALIBRATION";
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 border border-[#E2EAFD] shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#EEF2FC] flex items-center justify-center text-[#7286D3]">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Kiểm Tra Micro Giọng Nói</h3>
              <p className="text-xs text-slate-500">Đảm bảo Web Speech API nhận diện chính xác</p>
            </div>
          </div>
          <button onClick={closeModal} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 rounded-2xl bg-[#F8FAFD] border border-[#E2EAFD] text-center space-y-4">
          <button
            type="button"
            onClick={toggleListening}
            className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center transition-all ${
              isListening ? "bg-[#F79D9D] text-white animate-pulse" : "bg-[#EEF2FC] text-[#7286D3]"
            }`}
          >
            <Mic className="w-7 h-7" />
          </button>

          <p className="text-xs text-slate-600 font-medium">
            {isListening ? "Đang lắng nghe... Hãy thử nói một câu tiếng Việt!" : "Nhấn nút micro ở trên để bắt đầu thử giọng"}
          </p>

          <div className="min-h-16 p-3 rounded-xl bg-white border border-slate-200 text-left text-xs text-slate-700">
            {testText || <span className="text-slate-400 italic">Văn bản nhận diện sẽ hiển thị ở đây...</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Hỗ trợ Web Speech API tiếng Việt: {isSupported ? "Sẵn sàng" : "Chưa hỗ trợ"}</span>
        </div>

        <button
          onClick={closeModal}
          className="w-full py-2.5 rounded-2xl bg-[#7286D3] text-white font-bold text-xs shadow-xs hover:bg-[#5066A1] transition-colors"
        >
          Hoàn Tất Cấu Hình Micro
        </button>
      </div>
    </div>
  );
};

