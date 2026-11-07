/**
 * File: src/components/modals/QuickDrillModal.tsx
 * Mục đích: Popup thử thách ôn tập nhanh trong 60 giây (Quick Drill) ngay tại Dashboard để củng cố phản xạ giải thích.
 * Thành phần chính:
 *   - QuickDrillModal: Popup bộ đếm thời gian 60s và câu hỏi bất ngờ từ một Persona ngẫu nhiên.
 * Props/Inputs: useModalStore.
 */

import React, { useState, useEffect } from "react";
import { useModalStore } from "@/hooks/useModalStore";
import { Zap, X, Clock } from "lucide-react";
import { DEFAULT_PERSONAS } from "@/config/personas.config";

export const QuickDrillModal: React.FC = () => {
  const { activeModal, closeModal } = useModalStore();
  const [timeLeft, setTimeLeft] = useState(60);
  const [answer, setAnswer] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const isOpen = activeModal === "QUICK_DRILL";
  const persona = DEFAULT_PERSONAS[0]; // Bé Bo

  useEffect(() => {
    if (isOpen && timeLeft > 0 && !isSubmitted) {
      const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [isOpen, timeLeft, isSubmitted]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 border border-[#E2EAFD] shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FEF9E7] flex items-center justify-center text-[#E68A00]">
              <Zap className="w-4 h-4 fill-[#E68A00]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Thử Thách 60 Giây</h3>
              <p className="text-xs text-slate-500">Rèn luyện phản xạ bình dân hóa tức thì</p>
            </div>
          </div>
          <button onClick={closeModal} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timer Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-[#F0F5FD] border border-[#D5E4FC]">
          <span className="text-xs font-semibold text-[#5066A1]">Thời gian còn lại:</span>
          <div className="flex items-center gap-1.5 text-sm font-black text-[#5066A1]">
            <Clock className="w-4 h-4" />
            <span>{timeLeft}s</span>
          </div>
        </div>

        {/* Persona Question Box */}
        <div className="p-4 rounded-2xl bg-[#FFF9F9] border border-[#FFDADA] space-y-2">
          <div className="flex items-center gap-2">
            <img src={persona.avatar} alt="Bo" className="w-7 h-7 rounded-full object-cover" />
            <span className="text-xs font-bold text-slate-800">{persona.name} ({persona.age}):</span>
          </div>
          <p className="text-xs font-medium text-slate-700 leading-relaxed italic">
            "Chú ơi, tại sao điện thoại lại biết được con đang ở đâu trên bản đồ vậy ạ? Có người tí hon ngồi bên trong chỉ đường hả chú?"
          </p>
        </div>

        {!isSubmitted ? (
          <div className="space-y-3">
            <textarea
              rows={3}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Giải thích cho bé Bo trong 1-2 câu không dùng từ GPS, Vệ tinh hay Sóng vô tuyến..."
              className="w-full p-3 rounded-2xl bg-[#F8FAFD] border border-[#E2EAFD] text-xs focus:outline-none focus:ring-2 focus:ring-[#8EA7E9]"
            />
            <button
              onClick={() => setIsSubmitted(true)}
              disabled={!answer.trim()}
              className="w-full py-2.5 rounded-2xl bg-[#7286D3] hover:bg-[#5066A1] text-white font-bold text-xs shadow-xs disabled:opacity-50"
            >
              Gửi Câu Trả Lời Cho Bé Bo
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-[#E8F8F0] border border-[#BDE8D2] text-center space-y-2">
            <p className="text-xs font-bold text-[#1E7E50]">Xuất Sắc! Phản hồi của bạn đã được ghi nhận.</p>
            <p className="text-[11px] text-slate-500">Bạn đã hoàn thành thử thách trong {60 - timeLeft} giây.</p>
            <button
              onClick={closeModal}
              className="px-4 py-1.5 rounded-xl bg-white text-[#1E7E50] border border-[#BDE8D2] text-xs font-semibold"
            >
              Đóng Thử Thách
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

