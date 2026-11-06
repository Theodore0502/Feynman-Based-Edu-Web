/**
 * File: src/components/shared/JargonBadge.tsx
 * Mục đích: Huy hiệu đánh dấu thuật ngữ chuyên ngành (Xanh: Đã bình dân hóa / Đỏ/Cam: Chưa giải thích), tái sử dụng ở Trang 5, 6, 9.
 * Thành phần chính:
 *   - JargonBadge: Badge thuật ngữ kèm tooltip hoặc click xem chi tiết lỗi.
 * Props/Inputs:
 *   - term: string - Thuật ngữ.
 *   - isExplained: boolean - Đã được giải thích bình dân hay chưa.
 *   - reason?: string - Lý do cảnh báo.
 *   - onClick?: () => void - Callback xem giải thích trong JargonInspectorDrawer.
 */

import React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface JargonBadgeProps {
  term: string;
  isExplained: boolean;
  reason?: string;
  onClick?: () => void;
}

export const JargonBadge: React.FC<JargonBadgeProps> = ({
  term,
  isExplained,
  reason,
  onClick,
}) => {
  return (
    <span
      onClick={onClick}
      title={reason || (isExplained ? "Thuật ngữ đã được giải thích rõ" : "Thuật ngữ chưa được giải thích bình dân")}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all duration-200 border ${
        isExplained
          ? "bg-[#E8F8F0] text-[#1E7E50] border-[#BDE8D2] hover:bg-[#D4F3E2]"
          : "bg-[#FFEAEA] text-[#D9534F] border-[#FFC2C2] hover:bg-[#FFD8D8] animate-pulse"
      }`}
    >
      {isExplained ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-[#52BE80]" />
      ) : (
        <AlertCircle className="w-3.5 h-3.5 text-[#E74C3C]" />
      )}
      <span>{term}</span>
    </span>
  );
};

