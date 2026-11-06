/**
 * File: src/components/stage/LogicFlowMiniMap.tsx
 * Mục đích: Bản đồ thu nhỏ chuỗi logic các luận điểm người học đã trình bày trong phòng giảng.
 * Thành phần chính:
 *   - LogicFlowMiniMap: Hiển thị các chặng đã giải thích (Mở đầu, Cơ chế, Ẩn dụ, Ứng dụng).
 * Props/Inputs: currentStep: number.
 */

import React from "react";
import { Check, Circle } from "lucide-react";

interface LogicFlowMiniMapProps {
  currentStep?: number;
}

export const LogicFlowMiniMap: React.FC<LogicFlowMiniMapProps> = ({
  currentStep = 2,
}) => {
  const steps = [
    { title: "Mở đầu bình dân", desc: "Không dùng thuật ngữ" },
    { title: "Ví von ẩn dụ", desc: "So sánh với vật quen thuộc" },
    { title: "Giải thích cơ chế", desc: "Quan hệ nguyên nhân - kết quả" },
    { title: "Vượt qua phản biện", desc: "Trả lời câu hỏi hóc búa" },
  ];

  return (
    <div className="bg-white rounded-3xl p-4 border border-[#E8EEF8] shadow-subtle">
      <h5 className="text-xs font-bold text-slate-700 mb-3">Chặng Đường Giảng Giải Feynman</h5>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {steps.map((step, idx) => {
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep;

          return (
            <div
              key={idx}
              className={`p-2.5 rounded-2xl border text-xs transition-all ${
                isDone
                  ? "bg-[#E8F8F0] border-[#BDE8D2] text-[#1E7E50]"
                  : isCurrent
                  ? "bg-[#EEF2FC] border-[#7286D3] text-[#5066A1] ring-1 ring-[#7286D3]/30"
                  : "bg-slate-50 border-slate-100 text-slate-400"
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold mb-0.5">
                {isDone ? (
                  <Check className="w-3.5 h-3.5 text-[#1E7E50]" />
                ) : (
                  <Circle className="w-3 h-3" />
                )}
                <span className="truncate">{step.title}</span>
              </div>
              <p className="text-[10px] text-slate-500 truncate">{step.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

