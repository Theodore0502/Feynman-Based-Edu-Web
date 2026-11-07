/**
 * File: src/components/shared/PersonaAvatarCard.tsx
 * Mục đích: Hiển thị thẻ Persona đại diện cho người nghe AI với 2 biến thể (compact | full), tái sử dụng ở Trang 1, 4, 5, 7.
 * Thành phần chính:
 *   - PersonaAvatarCard: Thẻ hiển thị avatar, tính cách, lăng kính và phong cách phản biện của Persona.
 * Props/Inputs:
 *   - persona: PersonaDefinition - Thông tin nhân vật.
 *   - isSelected?: boolean - Trạng thái đang được chọn.
 *   - onSelect?: () => void - Callback khi click chọn.
 *   - variant?: 'compact' | 'full' - Kiểu dáng hiển thị.
 */

import React from "react";
import type { PersonaDefinition } from "@/config/personas.config";
import { Check, Sparkles, ShieldCheck, Compass } from "lucide-react";

interface PersonaAvatarCardProps {
  persona: PersonaDefinition;
  isSelected?: boolean;
  onSelect?: () => void;
  variant?: "compact" | "full";
}

export const PersonaAvatarCard: React.FC<PersonaAvatarCardProps> = ({
  persona,
  isSelected = false,
  onSelect,
  variant = "full",
}) => {
  if (variant === "compact") {
    return (
      <div
        onClick={onSelect}
        className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 border ${
          isSelected
            ? "bg-[#EBF0FC] border-[#7286D3] shadow-xs"
            : "bg-white hover:bg-slate-50 border-slate-200/80"
        }`}
      >
        <div className="relative shrink-0">
          <img
            src={persona.avatar}
            alt={persona.name}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-white"
          />
          {isSelected && (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#7286D3] flex items-center justify-center text-white ring-2 ring-white">
              <Check className="w-2.5 h-2.5" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800 truncate">{persona.name}</h4>
            <span className="text-[10px] text-slate-400 font-medium">{persona.age}</span>
          </div>
          <p className="text-xs text-slate-500 truncate">{persona.title}</p>
        </div>
      </div>
    );
  }

  // Chuẩn hóa chuỗi hiển thị Cấp độ
  const levelText = persona.badgeText.startsWith("Cấp độ:")
    ? persona.badgeText
    : `Cấp độ: ${persona.badgeText}`;

  // Chuẩn hóa hiển thị Sở thích
  const hobbiesText = persona.hobbies || persona.description;

  return (
    <div
      onClick={onSelect}
      className={`rounded-3xl p-5 cursor-pointer transition-all duration-300 relative overflow-hidden border flex flex-col justify-between h-full group ${
        isSelected
          ? "bg-white border-[#7286D3] ring-2 ring-[#7286D3]/20 shadow-card"
          : "bg-white hover:border-[#B5B2E8] border-slate-200/80 shadow-subtle hover:-translate-y-1 hover:shadow-card"
      }`}
    >
      <div className="space-y-3.5">
        {/* 1. Avt + Tên tuổi thông tin cơ bản */}
        <div className="flex items-center gap-3.5">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-2xl p-0.5 bg-gradient-to-tr from-[#8EA7E9] via-[#B5B2E8] to-[#FFB4B4] shadow-xs group-hover:scale-105 transition-transform">
              <img
                src={persona.avatar}
                alt={persona.name}
                className="w-full h-full rounded-2xl object-cover"
              />
            </div>
            {isSelected && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#7286D3] flex items-center justify-center text-white shadow-xs ring-2 ring-white">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-1">
              <h4 className="text-base font-extrabold text-slate-800 tracking-tight truncate">
                {persona.name}
              </h4>
              <span className="text-[11px] font-semibold text-slate-400 shrink-0">
                {persona.age}
              </span>
            </div>
            <p className="text-xs font-semibold text-[#5066A1] leading-snug line-clamp-1 mt-0.5">
              {persona.title}
            </p>
          </div>
        </div>

        {/* 2. Cấp độ */}
        <div className="pt-2 border-t border-slate-100/80">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#EEF2FC] text-[#4A64A8] border border-[#D5E1FA]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#7286D3] shrink-0" />
            <span className="truncate">{levelText}</span>
          </span>
        </div>

        {/* 3. Sở thích */}
        <div className="text-xs leading-relaxed text-slate-600 bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
          <div className="flex items-start gap-1.5">
            <span className="font-bold text-slate-700 shrink-0">🎯 Sở thích:</span>
            <span className="text-slate-600 line-clamp-2 leading-relaxed">
              {hobbiesText}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Lăng kính (tóm gọn) */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-600">
        <Sparkles className="w-3.5 h-3.5 text-[#8EA7E9] shrink-0 mt-0.5" />
        <div className="leading-relaxed min-w-0">
          <span className="font-bold text-slate-700">Lăng kính: </span>
          <span className="text-slate-500 line-clamp-2">{persona.worldview}</span>
        </div>
      </div>
    </div>
  );
};

