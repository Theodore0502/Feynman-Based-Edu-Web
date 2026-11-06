/**
 * File: src/components/shared/ClarityMeter.tsx
 * Mục đích: Hiển thị đồng hồ/thanh đo độ mạch lạc và bình dân hóa của bài giảng (0-100) theo thời gian thực (Dùng ở Trang 3, 5, 6).
 * Thành phần chính:
 *   - ClarityMeter: Component đo điểm kèm trạng thái (Xuất sắc, Rõ ràng, Cơ bản, Cần cải thiện).
 * Props/Inputs:
 *   - score: number - Điểm số từ 0 đến 100.
 *   - showLabel?: boolean - Có hiển thị tiêu đề chi tiết không.
 *   - variant?: 'bar' | 'circle' - Kiểu dáng hiển thị thanh ngang hay vòng tròn.
 */

import React from "react";
import { getClarityBadge } from "@/lib/utils";
import { Activity } from "lucide-react";

interface ClarityMeterProps {
  score: number;
  showLabel?: boolean;
  variant?: "bar" | "circle";
}

export const ClarityMeter: React.FC<ClarityMeterProps> = ({
  score,
  showLabel = true,
  variant = "bar",
}) => {
  const badge = getClarityBadge(score);

  if (variant === "circle") {
    const strokeDashoffset = 283 - (283 * score) / 100;
    return (
      <div className="flex flex-col items-center justify-center text-center">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              className="stroke-[#EDF2FA]"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              className="stroke-[#7286D3] transition-all duration-700 ease-out"
              strokeWidth="8"
              strokeDasharray="283"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-2xl font-black text-slate-800">{score}%</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Clarity</span>
          </div>
        </div>
        {showLabel && (
          <span className={`mt-2 text-xs font-bold px-3 py-1 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
            {badge.label}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 w-full">
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <Activity className="w-3.5 h-3.5 text-[#7286D3]" />
            <span>Độ Mạch Lạc & Bình Dân Hóa</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
              {badge.label}
            </span>
            <span className="font-extrabold text-[#5066A1] text-sm">{score}%</span>
          </div>
        </div>
      )}

      {/* Progress Bar Pastel */}
      <div className="w-full h-2.5 bg-[#EDF2FA] rounded-full overflow-hidden p-0.5 border border-slate-100">
        <div
          className="h-full bg-gradient-to-r from-[#8EA7E9] via-[#A0B4EB] to-[#76D7C4] rounded-full transition-all duration-700 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
};

