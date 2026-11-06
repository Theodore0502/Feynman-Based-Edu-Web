/**
 * File: src/pages/LandingAndDemo.tsx
 * Mục đích: [Trang 1] Landing & Demo - Giới thiệu Phương pháp Feynman và phòng thử nghiệm nhanh (Interactive Mini-Demo).
 * Thành phần chính:
 *   - LandingAndDemo: Giới thiệu 4 bước Feynman, demo thử nghiệm giảng giải trực tiếp không cần đăng nhập.
 * Props/Inputs: Không có.
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { DEFAULT_PERSONAS } from "@/config/personas.config";
import { PersonaAvatarCard } from "@/components/shared/PersonaAvatarCard";
import { VoiceRecorderButton } from "@/components/shared/VoiceRecorderButton";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { ArrowRight, Sparkles, Play } from "lucide-react";

export const LandingAndDemo: React.FC = () => {
  const [demoInput, setDemoInput] = useState("");
  const [demoResponse, setDemoResponse] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState(DEFAULT_PERSONAS[0]);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const { isListening, toggleListening, isSupported } = useSpeechToText((text) =>
    setDemoInput(text)
  );

  const handleRunMiniDemo = () => {
    if (!demoInput.trim()) return;
    setIsDemoLoading(true);
    setTimeout(() => {
      setIsDemoLoading(false);
      setDemoResponse(
        `Dạ chú ơi, chú bảo "công nghệ" với "ảo hóa" là sao ạ? Con chỉ biết đồ chơi Lego thôi, cái này có lắp ráp như Lego được không chú?`
      );
    }, 700);
  };

  return (
    <div className="min-h-screen bg-[#F3F6FA] text-slate-800">
      {/* Top Navbar */}
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#8EA7E9] via-[#B5B2E8] to-[#FFB4B4] flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-800">Theodore</span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/auth"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Đăng Nhập
          </Link>
          <Link
            to="/stage/new"
            className="px-5 py-2.5 rounded-2xl bg-[#7286D3] hover:bg-[#5066A1] text-white text-xs font-bold transition-all shadow-xs"
          >
            Vào Phòng Giảng Ngay
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-6 pt-12 pb-16 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EEF2FC] text-[#5066A1] text-xs font-bold border border-[#D5E1FA]">
          <Sparkles className="w-4 h-4 text-[#7286D3]" />
          <span>Kỹ Thuật Học Sâu Feynman Thế Hệ Mới</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Cách tốt nhất để hiểu sâu một điều gì đó <br />
          <span className="bg-gradient-to-r from-[#7286D3] via-[#8EA7E9] to-[#F79D9D] bg-clip-text text-transparent">
            là giảng giải cho một đứa trẻ 10 tuổi
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Theodore đóng vai người nghe tò mò chưa biết gì. AI sẽ liên tục hỏi vặn để bóc trần những thuật ngữ bạn chưa hiểu thấu đáo và phát hiện các lỗ hổng logic.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            to="/dashboard"
            className="px-6 py-3 rounded-2xl bg-[#7286D3] hover:bg-[#5066A1] text-white text-sm font-bold flex items-center gap-2 shadow-card transition-all cursor-pointer"
          >
            <span>Trải Nghiệm Toàn Diện</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#mini-demo"
            className="px-6 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold border border-slate-200/80 shadow-xs transition-all"
          >
            Thử Giảng Nhanh Dưới Đây
          </a>
        </div>
      </section>

      {/* Interactive Mini-Demo Section */}
      <section id="mini-demo" className="max-w-3xl mx-auto px-6 pb-20">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EAFD] shadow-card space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Phòng Thử Nghiệm Nhanh (Mini-Demo)</h3>
              <p className="text-xs text-slate-500">Chọn người nghe và thử giải thích một khái niệm bạn biết</p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#E8F8F0] text-[#1E7E50]">
              Không cần đăng nhập
            </span>
          </div>

          {/* Chọn Persona */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DEFAULT_PERSONAS.map((p) => (
              <PersonaAvatarCard
                key={p.id}
                persona={p}
                variant="compact"
                isSelected={selectedPersona.id === p.id}
                onSelect={() => setSelectedPersona(p)}
              />
            ))}
          </div>

          {/* Input & Voice */}
          <div className="space-y-3">
            <div className="relative">
              <textarea
                rows={3}
                value={demoInput}
                onChange={(e) => setDemoInput(e.target.value)}
                placeholder={`Ví dụ: "Docker giống như một chiếc hộp thần kỳ chứa sẵn đồ đạc..."`}
                className="w-full p-4 pr-14 rounded-2xl bg-[#F8FAFD] border border-[#E2EAFD] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#8EA7E9]"
              />
              <div className="absolute right-3 bottom-3">
                <VoiceRecorderButton
                  isListening={isListening}
                  onToggle={toggleListening}
                  isSupported={isSupported}
                />
              </div>
            </div>

            <button
              onClick={handleRunMiniDemo}
              disabled={isDemoLoading || !demoInput.trim()}
              className="w-full py-3 rounded-2xl bg-[#7286D3] hover:bg-[#5066A1] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{isDemoLoading ? "Đang phân tích..." : "Thử Xem AI Sẽ Hỏi Lại Thế Nào"}</span>
            </button>
          </div>

          {/* Response Box */}
          {demoResponse && (
            <div className="p-4 rounded-2xl bg-[#FFF9F9] border border-[#FFDADA] space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2">
                <img src={selectedPersona.avatar} alt="P" className="w-6 h-6 rounded-full object-cover" />
                <span className="text-xs font-bold text-slate-800">{selectedPersona.name}:</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed">
                "{demoResponse}"
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default LandingAndDemo;

