/**
 * File: src/components/shared/PageHeroBanner.tsx
 * Mục đích: Hero Banner tinh giản (Simplified Hero Banner) cho toàn bộ hệ thống Theodore.
 * Đặc điểm:
 *   - Thiết kế tinh gọn, phẳng và hiện đại, loại bỏ các lớp thẻ lồng thẻ cồng kềnh.
 *   - Tiết kiệm chiều cao giao diện (Vertical Space), giúp người dùng xem ngay nội dung chức năng.
 *   - Bố cục 2 phía cân đối:
 *       + Trái: Badge phân loại, Tiêu đề h1/h2, Mô tả ngắn gọn & Nút hành động.
 *       + Phải: Khối tiện ích tóm tắt (rightWidget) và Linh vật nhỏ gọn (mascotSrc).
 *   - Nền màu trắng phối gradient pastel nhẹ nhàng, viền mỏng và đổ bóng thanh mảnh.
 */

import React, { ReactNode } from "react";

export interface PageHeroBannerProps {
  badge?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  rightWidget?: ReactNode;
  mascotSrc?: string;
  mascotAlt?: string;
  className?: string;
}

export const PageHeroBanner: React.FC<PageHeroBannerProps> = ({
  badge,
  title,
  description,
  actions,
  rightWidget,
  mascotSrc,
  mascotAlt = "Linh vật Theodore",
  className = "",
}) => {
  return (
    <div
      className={`relative overflow-hidden bg-white rounded-2xl border border-[#E2EAFD] p-5 sm:p-6 shadow-2xs transition-all ${className}`}
    >
      {/* Background gradient nhẹ nhàng, tinh tế */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/40 via-indigo-50/20 to-purple-50/30 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Nội dung chính bên trái */}
        <div className="space-y-2 flex-1 min-w-0">
          {badge && <div className="inline-block">{badge}</div>}
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-snug">
            {title}
          </h1>
          {description && (
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
              {description}
            </p>
          )}
          {actions && (
            <div className="flex flex-wrap items-center gap-2.5 pt-1.5">
              {actions}
            </div>
          )}
        </div>

        {/* Khối tiện ích bên phải: Gọn gàng, tinh tế, không chiếm diện tích */}
        {(rightWidget || mascotSrc) && (
          <div className="flex items-center gap-3.5 shrink-0 self-start md:self-center">
            {rightWidget && (
              <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/70 text-xs shadow-2xs">
                {rightWidget}
              </div>
            )}
            {mascotSrc && (
              <img
                src={mascotSrc}
                alt={mascotAlt}
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain select-none pointer-events-none drop-shadow-sm hidden md:block"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeroBanner;
