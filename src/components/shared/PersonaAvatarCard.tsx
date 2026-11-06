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
import { Check, Sparkles } from "lucide-react";

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
        <div className="relative">
          <img
            src={persona.avatar}
            alt={persona.name}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-white"
          />
          {isSelected && (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#7286D3] flex items-center justify-center text-white">
              <Check className="w-2.5 h-2.5" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800 truncate">{persona.name}</h4>
            <span className="text-[10px] text-slate-400">{persona.age}</span>
          </div>
          <p className="text-xs text-slate-500 truncate">{persona.title}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onSelect}
      className={`rounded-3xl p-5 cursor-pointer transition-all duration-300 relative overflow-hidden border ${
        isSelected
          ? "bg-white border-[#7286D3] ring-2 ring-[#7286D3]/20 shadow-card"
          : "bg-white hover:border-[#B5B2E8] border-slate-200/80 shadow-subtle hover:-translate-y-1"
      }`}
    >
      {/* Top Banner Gradient Badge */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl p-0.5 bg-gradient-to-tr from-[#8EA7E9] via-[#B5B2E8] to-[#FFB4B4] shadow-xs">
              <img
                src={persona.avatar}
                alt={persona.name}
                className="w-full h-full rounded-2xl object-cover"
              />
            </div>
            {isSelected && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#7286D3] flex items-center justify-center text-white shadow-xs">
                <Check className="w-3 h-3" />
              </div>
            )}
          </div>
          <div>
            <h4 className="text-base font-extrabold text-slate-800">{persona.name}</h4>
            <p className="text-xs font-semibold text-[#5066A1]">{persona.title}</p>
            <span className="text-[11px] text-slate-400 font-medium">{persona.age}</span>
          </div>
        </div>

        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#EEF2FC] text-[#556DAF] border border-[#D5E1FA]">
          {persona.badgeText}
        </span>
      </div>

      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
        {persona.description}
      </p>

      {/* Worldview Lens pill */}
      <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
        <Sparkles className="w-3.5 h-3.5 text-[#8EA7E9] shrink-0" />
        <span className="truncate"><b>Lăng kính:</b> {persona.worldview}</span>
      </div>
    </div>
  );
};

