/**
 * File: src/components/shared/PageHeroBanner.tsx
 * Mục đích: Hero Banner chuẩn hóa toàn hệ thống theo phong cách Dreamy Pastel của Dashboard.
 * Cấu trúc 3 khối:
 *   - Khối 1 (Trái): Thẻ frosted-glass chứa Eyebrow Badge, Tiêu đề h1, Mô tả & Nút hành động.
 *   - Khối 2 (Giữa): Linh vật Cú Theodore bay nổi với animation float & đổ bóng mềm.
 *   - Khối 3 (Phải): Thẻ frosted-glass hiển thị widget chỉ số, thước đo hoặc trạng thái tóm tắt.
 * Nền:
 *   - Gradient đa sắc pastel: from-[#F0F4FC] via-[#F6F3FC] to-[#FCF4F7]
 *   - Ảnh nền mờ /images/hero-banner-bg.png (opacity-35) kèm lớp phủ backdrop-blur.
 */

import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PageHeroBannerProps {
  badge?: ReactNode;
  title: ReactNode;
  description: ReactNode;
  actions?: ReactNode;
  rightWidget?: ReactNode;
  mascotSrc?: string;
  mascotAlt?: string;
  mascotClassName?: string;
  className?: string;
}

export const PageHeroBanner: React.FC<PageHeroBannerProps> = ({
  badge,
  title,
  description,
  actions,
  rightWidget,
  mascotSrc = "/images/theodore-mascot.png",
  mascotAlt = "Linh vật Theodore",
  mascotClassName,
  className = "",
}) => {
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-r from-[#F0F4FC] via-[#F6F3FC] to-[#FCF4F7] border border-[#E2EAFD] rounded-3xl p-4 sm:p-6 shadow-xs ${className}`}
    >
      {/* Dreamy Hero Background Image (mờ nhẹ nhàng) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <img
          src="/images/hero-banner-bg.png"
          alt="Hero background"
          className="w-full h-full object-cover object-center opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/50 via-white/30 to-white/50 backdrop-blur-[0.5px]" />
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        {/* Khối 1 (Trái): Card nội dung chính & nút hành động */}
        <div
          className={cn(
            "space-y-3 p-5 sm:p-6 rounded-3xl bg-white/75 backdrop-blur-md border border-white/80 shadow-xs shrink-0",
            rightWidget
              ? "max-w-xl lg:max-w-lg xl:max-w-xl"
              : "max-w-xl lg:max-w-2xl xl:max-w-3xl"
          )}
        >
          {badge && <div>{badge}</div>}
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-snug">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {description}
          </p>
          {actions && (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {actions}
            </div>
          )}
        </div>

        {/* Khối 2 (Giữa): Linh vật Cú Theodore bay nổi sinh động ở không gian trung tâm */}
        <div className="flex items-center justify-center flex-1 my-1 lg:my-0 relative">
          <div className="relative group transition-transform duration-300 hover:scale-105">
            <img
              src={mascotSrc}
              alt={mascotAlt}
              className={cn(
                "object-contain filter drop-shadow-[0_16px_32px_rgba(114,134,211,0.32)] animate-float select-none pointer-events-none",
                mascotClassName || "w-36 h-36 sm:w-48 sm:h-48 lg:w-56 lg:h-56 xl:w-60 xl:h-60"
              )}
            />
          </div>
        </div>

        {/* Khối 3 (Phải): Thẻ widget hoặc chỉ số nổi bật */}
        {rightWidget && (
          <div className="shrink-0 bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-white/80 shadow-xs flex flex-col items-center justify-center self-center lg:self-auto min-w-[190px]">
            {rightWidget}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeroBanner;

