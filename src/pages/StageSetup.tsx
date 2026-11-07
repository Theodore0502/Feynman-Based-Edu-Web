/**
 * File: src/pages/StageSetup.tsx
 * Mục đích: [Trang 4] Stage Setup - Thiết lập phiên giảng mới, chọn chủ đề bài giảng, Persona người nghe AI và độ khó, lưu trực tiếp vào Supabase.
 * Thành phần chính:
 *   - StageSetup: Form khởi tạo phiên giảng dạy kế thừa Preset Topics và Persona Avatar Cards.
 * Props/Inputs: Không có.
 */

import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { getAllPersonas, type PersonaDefinition } from "@/config/personas.config";
import { TOPICS_CATALOG, DOMAINS_CATALOG } from "@/data/academic-catalog.data";
import { getSubjectBySlug } from "@/data/three-tier-curriculum.data";
import { PersonaAvatarCard } from "@/components/shared/PersonaAvatarCard";
import { SupabaseService } from "@/lib/services/supabase-service";
import { useStudyStore } from "@/hooks/useStudyStore";
import { ArrowLeft, ArrowRight, Sparkles, BookOpen, Edit3 } from "lucide-react";

export const StageSetup: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTopicFromQuery = searchParams.get("topic") || "";
  const domain = searchParams.get("domain");
  const subject = searchParams.get("subject");
  const currentSubject = subject ? getSubjectBySlug(subject) : undefined;

  const { activeTopic, scratchpad } = useStudyStore();
  const [availablePersonas, setAvailablePersonas] = useState<PersonaDefinition[]>([]);
  const [topic, setTopic] = useState(initialTopicFromQuery);
  const [selectedPersonaId, setSelectedPersonaId] = useState("");
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const list = getAllPersonas();
    setAvailablePersonas(list);
    if (list.length > 0 && !selectedPersonaId) {
      setSelectedPersonaId(list[0].id);
    }
  }, []);

  // Auto pre-fill if activeTopic exists in Study Lab and no topic was passed via query
  useEffect(() => {
    if (!topic && activeTopic) {
      setTopic(activeTopic.title);
    }
  }, [activeTopic, topic]);

  // Điều hướng quay lại đúng trình tự cấp bậc
  const handleGoBack = () => {
    if (domain && subject) {
      navigate(`/lectures/${domain}/${subject}`);
    } else if (domain) {
      navigate(`/lectures/${domain}`);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/lectures");
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsSubmitting(true);
    const sessionParams = new URLSearchParams({
      topic: topic.trim(),
      persona: selectedPersonaId,
      diff: difficulty,
    });
    if (domain) sessionParams.set("domain", domain);
    if (subject) sessionParams.set("subject", subject);

    try {
      const createdSession = await SupabaseService.createSession(topic.trim(), selectedPersonaId, difficulty);
      navigate(`/stage/${createdSession.id}?${sessionParams.toString()}`);
    } catch (err) {
      console.error("Create session error:", err);
      const fallbackId = `ses_${Date.now()}`;
      navigate(`/stage/${fallbackId}?${sessionParams.toString()}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-8 pb-12">
      {/* Nút lùi về cấp trước theo đúng trình tự */}
      <div>
        <button
          type="button"
          onClick={handleGoBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-[#E2EAFD] text-xs font-bold text-slate-600 hover:text-[#5066A1] shadow-2xs transition-all cursor-pointer group"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>
            {currentSubject
              ? `Quay lại ${currentSubject.name}`
              : "Quay lại danh sách bài giảng"}
          </span>
        </button>
      </div>

      {/* Step Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF2FC] text-[#5066A1] text-xs font-bold border border-[#D5E1FA]">
          <Sparkles className="w-3.5 h-3.5 text-[#7286D3]" />
          <span>Bước 2: Lên Bục Giảng Feynman</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
          Bạn chuẩn bị giảng giải về điều gì?
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Chọn chủ đề và người nghe phù hợp để thử thách khả năng bình dân hóa khái niệm của bạn.
        </p>
      </div>

      {/* Suggestion to Study First */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#8EA7E9]/15 via-[#B5B2E8]/15 to-[#FFD1D1]/20 border border-[#E8EEF8] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#7286D3] shadow-2xs shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-xs sm:text-sm font-bold text-slate-800">
              Bạn chưa nắm chắc kiến thức?
            </p>
            <p className="text-xs text-slate-500">
              Ghé qua trang <strong>Soạn Bài Giảng</strong> để đọc định nghĩa chuẩn, xem cảnh báo bẫy thuật ngữ và ghi dàn ý.
            </p>
          </div>
        </div>

        <Link
          to="/study"
          className="px-4 py-2 rounded-xl bg-white border border-[#E8EEF8] text-[#7286D3] hover:bg-[#F3F6FA] text-xs font-bold shrink-0 transition-colors shadow-2xs flex items-center gap-1.5"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Vào Soạn Bài Giảng</span>
        </Link>
      </div>

      {scratchpad.coreHook && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Dàn ý đã sẵn sàng:</strong> "{scratchpad.coreHook}"
            </span>
          </div>
          <Link to="/study" className="font-bold underline text-emerald-700 hover:text-emerald-900">
            Chỉnh sửa
          </Link>
        </div>
      )}

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

          {/* Gợi ý Preset Topics theo chuyên ngành */}
          <div className="space-y-2.5 pt-1">
            <span className="text-xs text-slate-500 font-bold block">
              Gợi ý chủ đề Toán học & CNTT trọng tâm:
            </span>
            <div className="flex flex-wrap gap-2">
              {TOPICS_CATALOG.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTopic(item.title)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    topic === item.title
                      ? "bg-[#EEF2FC] border-[#7286D3] text-[#5066A1] ring-1 ring-[#7286D3]"
                      : "bg-[#F8FAFD] hover:bg-[#EEF2FC] text-slate-700 hover:text-[#5066A1] border-slate-200/80"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7286D3]" />
                  <span>{item.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Chọn Khán giả AI */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-extrabold text-slate-800">
              2. Chọn Khán Giả AI
            </label>
            <span className="text-xs text-slate-400">Chọn góc nhìn phù hợp với bài giảng</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {availablePersonas.map((p) => (
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
            3. Mức Độ Phản Biện Của Khán Giả AI
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
            disabled={isSubmitting || !topic.trim()}
            className="w-full py-4 rounded-3xl bg-[#7286D3] hover:bg-[#5066A1] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-card transition-all disabled:opacity-50 cursor-pointer"
          >
            <span>{isSubmitting ? "Đang Đồng Bộ Supabase..." : "Bắt Đầu Giảng Giải Trên Sân Khấu Feynman"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default StageSetup;
