/**
 * File: src/components/modals/AnalogyHintModal.tsx
 * Mục đích: Popup hiển thị các gợi ý ẩn dụ đời thường khi người học bị bí ý tưởng giải thích.
 * Thành phần chính:
 *   - AnalogyHintModal: Modal gọi API /api/hint và hiển thị 2 phép so sánh phù hợp với Persona.
 * Props/Inputs: Nhận dữ liệu từ useModalStore ({ topic, term, personaId }).
 */

import React, { useState, useEffect } from "react";
import { useModalStore } from "@/hooks/useModalStore";
import { Sparkles, X, Lightbulb, Copy, Check } from "lucide-react";
import type { AnalogyHint } from "@/types/agent.types";

export const AnalogyHintModal: React.FC = () => {
  const { activeModal, modalData, closeModal } = useModalStore();
  const [hints, setHints] = useState<AnalogyHint[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const isOpen = activeModal === "ANALOGY_HINT";
  const topic = (modalData?.topic as string) || "Chủ đề bài giảng";
  const term = (modalData?.term as string) || "";
  const personaId = (modalData?.personaId as string) || "child_10yo";

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch("/api/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, term, personaId }),
      })
        .then((res) => res.json())
        .then((data) => {
          setHints(data.suggestions || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen, topic, term, personaId]);

  if (!isOpen) return null;

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 border border-[#E2EAFD] shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FEF9E7] flex items-center justify-center text-[#E68A00]">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Gợi Ý Ẩn Dụ Đời Thường</h3>
              <p className="text-xs text-slate-500">Giúp người nghe dễ hình dung khái niệm</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#8EA7E9] animate-spin" />
            <span>Đang tìm kiếm phép ẩn dụ sinh động nhất...</span>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {hints.map((hint, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#E2EAFD] hover:border-[#8EA7E9] transition-all space-y-2 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                    "{hint.analogy}"
                  </p>
                  <button
                    onClick={() => handleCopy(hint.analogy, idx)}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-[#7286D3] transition-colors shrink-0"
                    title="Sao chép câu ví von"
                  >
                    {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500">{hint.explanation}</p>
                <span className="inline-block text-[10px] font-medium text-[#7286D3] bg-[#EEF2FC] px-2 py-0.5 rounded-md">
                  {hint.targetPersonaLens}
                </span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={closeModal}
          className="w-full py-2.5 rounded-2xl bg-[#EEF2FC] text-[#5066A1] font-semibold text-xs hover:bg-[#E0E7FA] transition-colors"
        >
          Đã Hiểu, Quay Lại Giảng Tiếp
        </button>
      </div>
    </div>
  );
};

