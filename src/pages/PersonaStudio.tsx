/**
 * File: src/pages/PersonaStudio.tsx
 * Mục đích: [Trang 7] Thư Viện AI (Persona Studio) - Khám phá các nhân vật AI đóng vai người nghe theo phương pháp Feynman.
 * Đại diện cho các lăng kính đời sống, độ tuổi và cấp độ đặt câu hỏi khác nhau.
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DEFAULT_PERSONAS,
  type PersonaDefinition,
} from "@/config/personas.config";
import { PersonaAvatarCard } from "@/components/shared/PersonaAvatarCard";
import {
  Bot,
  Sparkles,
  ShieldCheck,
  Compass,
  MessageSquare,
  Mic,
  BookOpen,
  HelpCircle,
  Heart,
} from "lucide-react";

export const PersonaStudio: React.FC = () => {
  const navigate = useNavigate();
  const [personas] = useState<PersonaDefinition[]>(DEFAULT_PERSONAS);
  const [selectedPersona, setSelectedPersona] = useState<PersonaDefinition>(DEFAULT_PERSONAS[0]);

  // Cấp độ text chuẩn hóa
  const levelText = selectedPersona.badgeText.startsWith("Cấp độ:")
    ? selectedPersona.badgeText
    : `Cấp độ: ${selectedPersona.badgeText}`;

  return (
    <div className="space-y-6">
      {/* Page Title Header (Thư Viện AI) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#EEF2FC] via-[#F5F2FB] to-[#FFF5F5] p-4 sm:p-6 border border-[#E8EEF8] shadow-xs">
        {/* Dreamy Hero Background Image (mờ nhẹ) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <img
            src="/images/hero-banner-bg.png"
            alt="Hero background"
            className="w-full h-full object-cover object-center opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/50 via-white/30 to-white/50 backdrop-blur-[0.5px]" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Lớp blur trắng ở dưới các chữ để nhìn rõ chữ */}
          <div className="space-y-2 p-5 sm:p-6 rounded-3xl bg-white/75 backdrop-blur-md border border-white/80 shadow-xs max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#5066A1] text-xs font-black tracking-wide border border-[#D5E1FA] uppercase">
              <Bot className="w-3.5 h-3.5 text-[#7286D3]" />
              <span>Khán Giả Phản Biện Socrates</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
              Thư Viện AI
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Tập hợp các AI đại diện cho các lăng kính đời sống, độ tuổi và cấp độ đặt câu hỏi khác nhau
            </p>
          </div>

          {/* Quick Action Button */}
          <div className="relative z-10">
            <button
              onClick={() => navigate(`/stage/new?persona=${selectedPersona.id}`)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#7286D3] hover:bg-[#5066A1] text-white text-xs font-bold shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <Mic className="w-4 h-4" />
              <span>Giảng Cho {selectedPersona.name} Nghe</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid Danh Sách Khán Giả AI (4 Cột) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {personas.map((p) => (
          <PersonaAvatarCard
            key={p.id}
            persona={p}
            variant="full"
            isSelected={selectedPersona?.id === p.id}
            onSelect={() => setSelectedPersona(p)}
          />
        ))}
      </div>

      {/* Chi Tiết AI Đang Chọn */}
      {selectedPersona && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8EEF8] shadow-subtle space-y-6">
          {/* Header Profile */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl p-0.5 bg-gradient-to-tr from-[#8EA7E9] via-[#B5B2E8] to-[#FFB4B4] shadow-xs">
                <img
                  src={selectedPersona.avatar}
                  alt={selectedPersona.name}
                  className="w-full h-full rounded-2xl object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-black text-slate-800">
                    {selectedPersona.name}
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                    {selectedPersona.age}
                  </span>
                </div>
                <p className="text-xs text-[#5066A1] font-semibold mt-0.5">
                  {selectedPersona.title}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#EEF2FC] text-[#556DAF] border border-[#D5E1FA]">
                <ShieldCheck className="w-4 h-4 text-[#7286D3]" />
                <span>{levelText}</span>
              </span>
            </div>
          </div>

          {/* 3 Khối Nội Dung Chi Tiết */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Sở thích đời sống */}
            <div className="p-5 rounded-2xl bg-[#FFF9F5] border border-[#FFE8D6] space-y-2">
              <span className="font-bold text-[#D96B27] flex items-center gap-1.5 text-xs">
                <Heart className="w-4 h-4 text-[#FF8E53]" />
                Sở thích đời sống:
              </span>
              <p className="text-slate-600 leading-relaxed">
                {selectedPersona.hobbies || selectedPersona.description}
              </p>
            </div>

            {/* Lăng kính thế giới quan */}
            <div className="p-5 rounded-2xl bg-[#F8FAFD] border border-[#E2EAFD] space-y-2">
              <span className="font-bold text-[#5066A1] flex items-center gap-1.5 text-xs">
                <Sparkles className="w-4 h-4 text-[#7286D3]" />
                Lăng kính thế giới quan:
              </span>
              <p className="text-slate-600 leading-relaxed">
                {selectedPersona.worldview}
              </p>
            </div>

            {/* Phong cách hỏi Socrates */}
            <div className="p-5 rounded-2xl bg-[#FEF9E7] border border-[#FDECD2] space-y-2">
              <span className="font-bold text-[#B7791F] flex items-center gap-1.5 text-xs">
                <MessageSquare className="w-4 h-4 text-[#E68A00]" />
                Phong cách hỏi & Phản biện:
              </span>
              <p className="text-slate-600 leading-relaxed">
                {selectedPersona.socraticStyle}
              </p>
            </div>
          </div>

          {/* Hướng dẫn cách giảng giải cho AI này */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-[#F5F2FB] to-[#EEF2FC] border border-[#E2EAFD] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-[#7286D3]" />
                Mẹo làm chủ buổi giảng với {selectedPersona.name}:
              </h5>
              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedPersona.id === "child_10yo"
                  ? "Tuyệt đối không dùng từ chuyên ngành. Mọi thứ phải quy về que kem, bánh kẹo, đồ chơi Lego hoặc trường lớp."
                  : selectedPersona.id === "non_tech"
                  ? "Ví von với quy trình văn phòng, tuyển dụng, đi siêu thị hoặc cuộc sống thường nhật của dân công sở."
                  : selectedPersona.id === "farmer"
                  ? "Dùng từ ngữ mộc mạc, bình dân và so sánh với việc gieo mạ, tưới tiêu, con kênh hoặc thời tiết Nam Bộ."
                  : "Nói thẳng vào bản chất, cắt bỏ mọi buzzword rườm rà và chứng minh mối quan hệ nhân quả logic."}
              </p>
            </div>

            <button
              onClick={() => navigate(`/stage/new?persona=${selectedPersona.id}`)}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-[#D5E1FA] text-[#5066A1] text-xs font-bold shadow-2xs hover:shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              Thử Thách Ngay
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonaStudio;
