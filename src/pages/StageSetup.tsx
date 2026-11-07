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
import { ArrowLeft, ArrowRight, Sparkles, BookOpen, Edit3, Sigma, Network, Eye, Cpu, Layers } from "lucide-react";

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
  const [selectedDomainTab, setSelectedDomainTab] = useState<string>("ALL");

  const DOMAIN_TABS = [
    { id: "ALL", label: "Tất cả khu vực", count: TOPICS_CATALOG.length, icon: Layers },
    { id: "math", label: "Toán Cao Cấp", count: 10, icon: Sigma, color: "text-blue-600" },
    { id: "discrete", label: "Toán Rời Rạc", count: 10, icon: Network, color: "text-emerald-600" },
    { id: "cv", label: "Thị Giác Máy Tính", count: 10, icon: Eye, color: "text-purple-600" },
    { id: "cs", label: "Hệ Thống CNTT", count: 10, icon: Cpu, color: "text-amber-600" },
  ];

  const filteredTopics = selectedDomainTab === "ALL"
    ? TOPICS_CATALOG
    : TOPICS_CATALOG.filter((t) => t.domainId === selectedDomainTab);

  const getDifficultyBadge = (diff?: string, level?: number) => {
    if (diff === "Beginner" || level === 1) {
      return {
        label: "Cơ bản",
        classes: "bg-emerald-50 text-emerald-700 border-emerald-200/90",
      };
    }
    if (diff === "Intermediate" || level === 3) {
      return {
        label: "Trung cấp",
        classes: "bg-blue-50 text-blue-700 border-blue-200/90",
      };
    }
    return {
      label: "Nâng cao",
      classes: "bg-purple-50 text-purple-700 border-purple-200/90",
    };
  };

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

          {/* Gợi ý Preset Topics theo chuyên ngành & phân cấp độ */}
          <div className="space-y-3.5 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <span className="text-xs text-slate-700 font-extrabold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#7286D3]" />
                Gợi ý chủ đề Toán học & CNTT trọng tâm ({filteredTopics.length} chủ đề):
              </span>
              <span className="text-[11px] text-slate-400">
                Click vào thẻ để tự động điền và chọn độ khó phù hợp
              </span>
            </div>

            {/* Phân chia khu vực (Domain Tabs) */}
            <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-[#F4F7FC] border border-[#E2EAFD]">
              {DOMAIN_TABS.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = selectedDomainTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedDomainTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-white text-slate-800 shadow-2xs border border-slate-200/80"
                        : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                    }`}
                  >
                    <IconComponent className={`w-3.5 h-3.5 ${tab.color || "text-slate-500"}`} />
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                        isActive ? "bg-slate-100 text-slate-700" : "bg-slate-200/60 text-slate-500"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Danh sách chủ đề có gán nhãn cấp độ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-96 overflow-y-auto pr-1">
              {filteredTopics.map((item) => {
                const badge = getDifficultyBadge(item.difficulty, item.difficultyLevel);
                const isSelected = topic === item.title;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setTopic(item.title);
                      // Tự động gợi ý mức độ khó phù hợp
                      if (item.difficultyLevel === 1 || item.difficulty === "Beginner") {
                        setDifficulty("EASY");
                      } else if (item.difficultyLevel === 5 || item.difficulty === "Advanced") {
                        setDifficulty("HARD");
                      } else {
                        setDifficulty("MEDIUM");
                      }
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                      isSelected
                        ? "bg-[#EEF2FC] border-[#7286D3] ring-2 ring-[#7286D3]/20 shadow-xs"
                        : "bg-[#F8FAFD] hover:bg-white border-slate-200/80 hover:border-[#B5B2E8] shadow-2xs hover:shadow-xs"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            isSelected ? "bg-[#7286D3]" : "bg-slate-300"
                          }`}
                        />
                        <span
                          className={`text-xs font-bold truncate ${
                            isSelected ? "text-[#5066A1]" : "text-slate-700"
                          }`}
                        >
                          {item.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate pl-3">
                        {item.domainName}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${badge.classes}`}
                    >
                      {badge.label}
                    </span>
                  </button>
                );
              })}
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
