/**
 * File: src/pages/StageSetup.tsx
 * Mục đích: [Trang 4] Stage Setup - Thiết lập phiên giảng mới, chọn chủ đề bài giảng, Persona người nghe AI và độ khó.
 * Thành phần chính:
 *   - StageSetup: Form khởi tạo phiên giảng dạy kế thừa Preset Topics và Persona Avatar Cards.
 * Props/Inputs: Không có.
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DEFAULT_PERSONAS } from "@/config/personas.config";
import { PRESET_TOPICS } from "@/config/topics-presets.config";
import { PersonaAvatarCard } from "@/components/shared/PersonaAvatarCard";
import { ArrowRight, Sparkles } from "lucide-react";

export const StageSetup: React.FC = () => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [selectedPersonaId, setSelectedPersonaId] = useState(DEFAULT_PERSONAS[0].id);
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    const generatedId = `ses_${Date.now()}`;
    navigate(`/stage/${generatedId}?topic=${encodeURIComponent(topic)}&persona=${selectedPersonaId}&diff=${difficulty}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Step Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF2FC] text-[#5066A1] text-xs font-bold border border-[#D5E1FA]">
          <Sparkles className="w-3.5 h-3.5 text-[#7286D3]" />
          <span>Bước 1: Thiết Lập Phòng Giảng Feynman</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
          Bạn chuẩn bị giảng giải về điều gì?
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Chọn chủ đề và người nghe phù hợp để thử thách khả năng bình dân hóa khái niệm của bạn.
        </p>
      </div>

      <form onSubmit={handleCreateSession} className="space-y-8">
        {/* 1. Nhập chủ đề hoặc chọn gợi ý */}
        <div className="bg-white rounded-3xl p-6 border border-[#E8EEF8] shadow-subtle space-y-4">
          <label className="block text-sm font-extrabold text-slate-800">
            1. Tên khái niệm / Chủ đề bài giảng
          </label>
          <input
            type="text"
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ví dụ: Cơ chế Lạm phát, Thuật toán Dijkstra, Kháng thể mRNA, Docker Container..."
            className="w-full px-5 py-3 rounded-2xl bg-[#F8FAFD] border border-[#E2EAFD] text-sm focus:outline-none focus:ring-2 focus:ring-[#8EA7E9]"
          />

          {/* Gợi ý Preset Topics */}
          <div>
            <span className="text-xs text-slate-400 font-semibold mb-2 block">
              Hoặc chọn nhanh chủ đề mẫu kinh điển:
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_TOPICS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setTopic(preset.title)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#F1F4FA] hover:bg-[#EEF2FC] text-slate-700 hover:text-[#5066A1] text-xs font-semibold border border-slate-200/60 transition-all cursor-pointer"
                >
                  {preset.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Chọn Persona người nghe */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-extrabold text-slate-800">
              2. Chọn Người Nghe Mục Tiêu (AI Persona)
            </label>
            <span className="text-xs text-slate-400">Chọn lăng kính phù hợp với bài giảng</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DEFAULT_PERSONAS.map((p) => (
              <PersonaAvatarCard
                key={p.id}
                persona={p}
                variant="full"
                isSelected={selectedPersonaId === p.id}
                onSelect={() => setSelectedPersonaId(p.id)}
              />
            ))}
          </div>
        </div>

        {/* 3. Độ khó phản biện */}
        <div className="bg-white rounded-3xl p-6 border border-[#E8EEF8] shadow-subtle space-y-4">
          <label className="block text-sm font-extrabold text-slate-800">
            3. Độ khó phản biện của AI (Socratic Rigor)
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "EASY", label: "Dễ Chịu", desc: "Hỏi nhẹ nhàng, dễ hài lòng với ẩn dụ" },
              { id: "MEDIUM", label: "Tiêu Chuẩn", desc: "Phát hiện thuật ngữ và hỏi vặn vừa phải" },
              { id: "HARD", label: "Khắt Khe", desc: "Soi từng bước nhảy cóc logic và buzzword" },
            ].map((diff) => (
              <button
                key={diff.id}
                type="button"
                onClick={() => setDifficulty(diff.id as "EASY" | "MEDIUM" | "HARD")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  difficulty === diff.id
                    ? "bg-[#EEF2FC] border-[#7286D3] text-[#5066A1] ring-2 ring-[#7286D3]/20"
                    : "bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700"
                }`}
              >
                <span className="font-extrabold text-xs block mb-1">{diff.label}</span>
                <p className="text-[11px] text-slate-500 leading-snug">{diff.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!topic.trim()}
            className="w-full py-4 rounded-3xl bg-[#7286D3] hover:bg-[#5066A1] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-card transition-all disabled:opacity-50 cursor-pointer"
          >
            <span>Bắt Đầu Giảng Giải Trên Sân Khấu Feynman</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default StageSetup;

