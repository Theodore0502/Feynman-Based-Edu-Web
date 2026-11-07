/**
 * File: src/components/study/SpeakerScratchpadDrawer.tsx
 * Mục đích: Khung soạn thảo / xem nhanh Dàn ý bài giảng (Speaker's Scratchpad) hỗ trợ kéo ra trong phòng học hoặc khi đang giảng bài Live.
 * Thành phần chính:
 *   - SpeakerScratchpadDrawer: Cho phép chỉnh sửa câu Hook mở đầu, 3 luận điểm cốt lõi, phép ẩn dụ chuẩn bị và ghi chú tự do.
 * Props/Inputs:
 *   - mode: 'inline' (hiển thị trực tiếp trong trang Study) | 'drawer' (ngăn kéo nổi trượt ra từ bên phải).
 */

import React from "react";
import { useStudyStore } from "@/hooks/useStudyStore";
import { Sparkles, X, Save, Edit3, Lightbulb, BookmarkCheck } from "lucide-react";

interface SpeakerScratchpadDrawerProps {
  mode?: "inline" | "drawer";
  onClose?: () => void;
}

export const SpeakerScratchpadDrawer: React.FC<SpeakerScratchpadDrawerProps> = ({
  mode = "inline",
  onClose,
}) => {
  const { scratchpad, updateScratchpad, activeTopic } = useStudyStore();

  const handlePointChange = (index: number, val: string) => {
    const updated = [...scratchpad.mainPoints];
    updated[index] = val;
    updateScratchpad({ mainPoints: updated });
  };

  const content = (
    <div className="space-y-5">
      {/* Header Info */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E8EEF8]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#E8EEF8] flex items-center justify-center text-[#7286D3]">
            <Edit3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Sổ Tay Bài Giảng</h3>
            <p className="text-xs text-slate-500">Dàn ý & Phao ghi nhớ khi giảng bài</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-medium">
          <Save className="w-3.5 h-3.5" />
          <span>Tự động lưu</span>
        </div>
      </div>

      {/* 1. Core Hook */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-[#F39C12]" />
          1. Câu Mở Đầu Gợi Mở (Dưới 20 chữ)
        </label>
        <input
          type="text"
          value={scratchpad.coreHook}
          onChange={(e) => updateScratchpad({ coreHook: e.target.value })}
          placeholder="Ví dụ: 'Em ơi, máy tính thật ra giống hệt một căn bếp...' "
          className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#E8EEF8] bg-slate-50/50 focus:bg-white focus:border-[#8EA7E9] focus:ring-2 focus:ring-[#8EA7E9]/20 transition-all outline-hidden text-slate-800"
        />
      </div>

      {/* 2. 3 Main Points */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <BookmarkCheck className="w-3.5 h-3.5 text-[#7286D3]" />
          2. Ba luận điểm cốt lõi bạn sẽ truyền đạt
        </label>
        <div className="space-y-2">
          {scratchpad.mainPoints.map((point, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#E8EEF8] text-[#7286D3] text-xs font-bold flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <input
                type="text"
                value={point}
                onChange={(e) => handlePointChange(idx, e.target.value)}
                placeholder={`Luận điểm ${idx + 1}...`}
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-[#E8EEF8] bg-slate-50/50 focus:bg-white focus:border-[#8EA7E9] focus:ring-1 focus:ring-[#8EA7E9] transition-all outline-hidden text-slate-800"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Custom Analogy */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#E07A5F]" />
          3. Phép ẩn dụ đời thường bạn sẽ dùng
        </label>
        <input
          type="text"
          value={scratchpad.customAnalogy}
          onChange={(e) => updateScratchpad({ customAnalogy: e.target.value })}
          placeholder="Ví dụ: 'So sánh Container với hộp cơm Bento chia ngăn...' "
          className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#E8EEF8] bg-slate-50/50 focus:bg-white focus:border-[#8EA7E9] focus:ring-2 focus:ring-[#8EA7E9]/20 transition-all outline-hidden text-slate-800"
        />
      </div>

      {/* 4. Raw Notes */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          4. Ghi chú tự do / Từ khóa nhắc bài
        </label>
        <textarea
          rows={4}
          value={scratchpad.rawNotes}
          onChange={(e) => updateScratchpad({ rawNotes: e.target.value })}
          placeholder="Gõ nháp mọi từ khóa bạn muốn nhớ khi nói..."
          className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#E8EEF8] bg-slate-50/50 focus:bg-white focus:border-[#8EA7E9] focus:ring-2 focus:ring-[#8EA7E9]/20 transition-all outline-hidden text-slate-800 resize-none"
        />
      </div>
    </div>
  );

  if (mode === "drawer") {
    return (
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-[#E8EEF8] p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
        <div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7286D3]">
              Phao cứu sinh khi giảng bài
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {content}
        </div>

        <div className="pt-6 border-t border-[#E8EEF8] mt-6">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#7286D3] text-white font-bold text-xs hover:bg-[#5E72C4] transition-colors shadow-xs"
          >
            Đóng phao & Tiếp tục nói
          </button>
        </div>
      </div>
    );
  }

  // Inline mode
  return (
    <div className="bg-white rounded-3xl p-6 border border-[#E8EEF8] shadow-xs">
      {content}
    </div>
  );
};

