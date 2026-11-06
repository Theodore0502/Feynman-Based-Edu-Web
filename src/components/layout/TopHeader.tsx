/**
 * File: src/components/layout/TopHeader.tsx
 * Mục đích: Thanh tiêu đề trên cùng dùng chung cho các màn hình Workspace, hiển thị Breadcrumb, nút Quick Drill và thông tin người dùng.
 * Thành phần chính:
 *   - TopHeader: Breadcrumbs, nút Thử thách 60s và avatar profile.
 * Props/Inputs: title?: string, subtitle?: string.
 */

"use client";

import React from "react";
import { useModalStore } from "@/hooks/useModalStore";
import { Zap, Flame, Bell, User } from "lucide-react";

interface TopHeaderProps {
  title?: string;
  subtitle?: string;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  title = "Feynman Stage",
  subtitle = "Học sâu qua giảng giải",
}) => {
  const { openModal } = useModalStore();

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
      <div>
        <div className="text-[11px] font-bold tracking-widest text-[#7286D3] uppercase flex items-center gap-2">
          <span>WORKSPACE</span>
          <span>/</span>
          <span>{title}</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight mt-0.5">
          {title}
        </h2>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Nút Thử thách ôn tập 60s */}
        <button
          onClick={() => openModal("QUICK_DRILL")}
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#FEF9E7] border border-[#FDECD2] text-xs font-bold text-[#E68A00] hover:bg-[#FDF3D5] transition-all cursor-pointer shadow-xs"
        >
          <Zap className="w-4 h-4 fill-[#E68A00]" />
          <span className="hidden sm:inline">Thử Thách 60s</span>
        </button>

        {/* Streak badge */}
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white border border-[#E8EEF8] text-xs font-bold text-slate-700 shadow-xs">
          <Flame className="w-4 h-4 text-[#FFA929] fill-[#FFA929]" />
          <span>14 Ngày</span>
        </div>

        {/* Thông báo */}
        <button className="p-2.5 rounded-2xl bg-white border border-[#E8EEF8] text-slate-500 hover:text-slate-800 transition-colors shadow-xs">
          <Bell className="w-4 h-4" />
        </button>

        {/* User Avatar */}
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#8EA7E9] to-[#FFB4B4] p-0.5 shadow-xs">
          <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center text-slate-700">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
};

