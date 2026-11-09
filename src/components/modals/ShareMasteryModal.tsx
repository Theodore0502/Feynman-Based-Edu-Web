/**
 * File: src/components/modals/ShareMasteryModal.tsx
 * Mục đích: Popup xuất thẻ chứng nhận Feynman Mastery Card thành liên kết hoặc ảnh để chia sẻ lên mạng xã hội.
 * Thành phần chính:
 *   - ShareMasteryModal: Modal tạo link chia sẻ và sao chép thẻ điểm.
 * Props/Inputs: useModalStore ({ topic, score }).
 */

import React, { useState } from "react";
import { useModalStore } from "@/hooks/useModalStore";
import { Share2, X, Copy, Check, Sparkles } from "lucide-react";

export const ShareMasteryModal: React.FC = () => {
  const { activeModal, modalData, closeModal } = useModalStore();
  const [copied, setCopied] = useState(false);

  const isOpen = activeModal === "SHARE_MASTERY";
  const topic = (modalData?.topic as string) || "Cơ chế Docker Container";
  const score = (modalData?.score as number) || 85;

  if (!isOpen) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "https://theodore.feynman.app";
  const shareToken = `cert-${Date.now().toString(36).toUpperCase()}`;
  const shareUrl = `${origin}/share/${shareToken}?topic=${encodeURIComponent(topic)}&score=${score}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 border border-[#E2EAFD] shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#EEF2FC] flex items-center justify-center text-[#7286D3]">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Chia Sẻ Thẻ Điểm Feynman</h3>
              <p className="text-xs text-slate-500">Lan tỏa thành tích thấu hiểu sâu sắc</p>
            </div>
          </div>
          <button onClick={closeModal} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Share Preview Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-[#8EA7E9] via-[#B5B2E8] to-[#FFB4B4] text-white space-y-3 text-center shadow-lg">
          <Sparkles className="w-6 h-6 mx-auto text-amber-200" />
          <h4 className="font-extrabold text-lg">{topic}</h4>
          <p className="text-xs text-white/90">Tôi vừa vượt qua bài kiểm tra bình dân hóa Feynman với điểm số:</p>
          <div className="text-4xl font-black">{score}%</div>
          <span className="inline-block text-[10px] font-bold px-3 py-1 bg-white/20 backdrop-blur-md rounded-full">
            Feynman Technique Stage • Elis
          </span>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-2xl bg-[#F8FAFD] border border-[#E2EAFD]">
          <input
            readOnly
            value={shareUrl}
            className="flex-1 bg-transparent text-xs text-slate-600 px-2 outline-none truncate"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#7286D3] hover:bg-[#5066A1] text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Đã chép" : "Sao chép"}</span>
          </button>
        </div>

        <div className="flex justify-end gap-2">
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-center py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            Xem Trang Thẻ Chứng Nhận Công Khai ↗
          </a>
        </div>
      </div>
    </div>
  );
};

