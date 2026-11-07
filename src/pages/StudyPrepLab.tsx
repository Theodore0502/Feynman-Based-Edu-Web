/**
 * File: src/pages/StudyPrepLab.tsx
 * Mục đích: Giao diện Phòng Học & Chuẩn Bị (Feynman Study & Prep Lab) - Nơi người học nạp kiến thức, đọc tóm tắt chuẩn, nhận diện bẫy thuật ngữ và soạn dàn ý trước khi lên bục giảng.
 * Thành phần chính:
 *   - TopicSelector: Chọn chủ đề có sẵn hoặc nạp văn bản tự do.
 *   - GroundTruthCard: Tóm tắt lý thuyết chuẩn xác của hệ thống.
 *   - JargonTrapsWarning: Cảnh báo các từ ngữ học thuật cần tránh dùng trực tiếp.
 *   - StarterAnalogiesDeck: Gợi ý các phép ẩn dụ mồi.
 *   - SpeakerScratchpadDrawer: Dàn ý bài giảng được tự động lưu.
 *   - LaunchStageCTA: Nút chuyển sang phòng giảng live.
 * Props/Inputs: Không có (Sử dụng URL params và useStudyStore).
 */

import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStudyStore, PRESET_STUDY_TOPICS } from "@/hooks/useStudyStore";
import { DOMAINS_CATALOG } from "@/data/academic-catalog.data";
import { SpeakerScratchpadDrawer } from "@/components/study/SpeakerScratchpadDrawer";
import {
  BookOpen,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Clock,
  Layers,
  FileText,
  UploadCloud,
  CheckCircle2,
  ChevronRight,
  Quote,
  Flame,
  Bookmark,
} from "lucide-react";

export const StudyPrepLab: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const topicParam = searchParams.get("topicId");

  const { activeTopic, selectTopic, setCustomMaterial } = useStudyStore();

  const [activeTab, setActiveTab] = useState<"preset" | "custom">("preset");
  const [selectedDomain, setSelectedDomain] = useState<string>("ALL");
  const [customTitle, setCustomTitle] = useState("");
  const [customText, setCustomText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);

  const displayedTopics =
    selectedDomain === "ALL"
      ? PRESET_STUDY_TOPICS
      : PRESET_STUDY_TOPICS.filter((t) => t.domainId === selectedDomain);

  // Sync param from URL if present
  useEffect(() => {
    if (topicParam) {
      selectTopic(topicParam);
    }
  }, [topicParam, selectTopic]);

  // Handle custom paste extraction
  const handleExtractCustomText = () => {
    if (!customText.trim()) return;
    setIsExtracting(true);

    setTimeout(() => {
      // Mock AI extraction
      const extractedConcepts = [
        "Khái niệm cốt lõi 1",
        "Cơ chế vận hành chính",
        "Tác động thực tế",
      ];
      const extractedJargons = ["Thuật ngữ kỹ thuật A", "Cơ chế B"];

      setCustomMaterial({
        title: customTitle.trim() || "Tài liệu ghi chú tự do",
        rawText: customText,
        extractedConcepts,
        extractedJargons,
        generatedSummary: customText.slice(0, 250) + "...",
      });
      setIsExtracting(false);
      setActiveTab("preset");
    }, 600);
  };

  const handleLaunchStage = () => {
    navigate("/stage/new");
  };

  if (!activeTopic) return null;

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* 1. Header Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#8EA7E9]/20 via-[#B5B2E8]/20 to-[#FFD1D1]/30 p-4 sm:p-6 border border-[#E8EEF8] shadow-xs">
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
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              Phòng Chuẩn Bị & Nghiên Cứu
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Hãy đọc kỹ định nghĩa chuẩn (**Ground Truth**), ghi nhớ các bẫy thuật ngữ cần tránh và phác thảo dàn ý nói. Khi bạn tự tin có thể giảng lại cho một đứa trẻ, hãy bước lên bục giảng!
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 p-3 sm:p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-white/80 shadow-xs">
            <button
              onClick={handleLaunchStage}
              className="px-6 py-3.5 rounded-2xl bg-[#7286D3] hover:bg-[#5E72C4] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 group cursor-pointer"
            >
              <span>Lên bục giảng ngay</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Source Selector Tabs */}
      <div className="flex items-center gap-3 border-b border-[#E8EEF8] pb-3">
        <button
          onClick={() => setActiveTab("preset")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "preset"
              ? "bg-[#7286D3] text-white shadow-xs"
              : "text-slate-600 hover:bg-white hover:text-slate-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Chủ đề chuẩn hóa ({PRESET_STUDY_TOPICS.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("custom")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "custom"
              ? "bg-[#7286D3] text-white shadow-xs"
              : "text-slate-600 hover:bg-white hover:text-slate-800"
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Tự nạp tài liệu riêng</span>
        </button>
      </div>

      {/* Custom Material Input View */}
      {activeTab === "custom" && (
        <div className="bg-white rounded-3xl p-6 border border-[#E8EEF8] shadow-xs space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8EEF8] flex items-center justify-center text-[#7286D3]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Dán ghi chú hoặc tài liệu bạn vừa đọc</h3>
              <p className="text-xs text-slate-500">AI sẽ tự động chắt lọc ý chính và tìm ra các bẫy thuật ngữ cho bạn.</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tên bài học / Chủ đề
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="VD: Định luật Cung Cầu, Cơ chế hoạt động của GPU..."
              className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-[#E8EEF8] focus:border-[#8EA7E9] focus:ring-2 focus:ring-[#8EA7E9]/20 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nội dung tài liệu (Đoạn văn, sách, tóm tắt)
            </label>
            <textarea
              rows={6}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Dán nội dung tài liệu học vào đây..."
              className="w-full text-xs sm:text-sm p-4 rounded-xl border border-[#E8EEF8] focus:border-[#8EA7E9] focus:ring-2 focus:ring-[#8EA7E9]/20 outline-hidden resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setActiveTab("preset")}
              className="px-4 py-2 rounded-xl border border-[#E8EEF8] text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              onClick={handleExtractCustomText}
              disabled={isExtracting || !customText.trim()}
              className="px-6 py-2.5 rounded-xl bg-[#7286D3] text-white text-xs font-bold hover:bg-[#5E72C4] disabled:opacity-50 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isExtracting ? "Đang phân tích..." : "Chắt lọc kiến thức"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Preset Topics Carousel / Badges */}
      {activeTab === "preset" && (
        <div className="space-y-3">
          {/* Domain Category Filter Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedDomain("ALL")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedDomain === "ALL"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-[#E8EEF8]"
              }`}
            >
              Tất cả các môn ({PRESET_STUDY_TOPICS.length})
            </button>
            {DOMAINS_CATALOG.map((domain) => (
              <button
                key={domain.id}
                onClick={() => setSelectedDomain(domain.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  selectedDomain === domain.id
                    ? "bg-[#7286D3] text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-[#E8EEF8]"
                }`}
              >
                <span>{domain.name}</span>
                <span className="text-[10px] opacity-75 font-normal">
                  ({PRESET_STUDY_TOPICS.filter((t) => t.domainId === domain.id).length})
                </span>
              </button>
            ))}
          </div>

          {/* Topics Badges */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {displayedTopics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => selectTopic(topic.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0 transition-all border flex items-center gap-2 ${
                  activeTopic.id === topic.id
                    ? "bg-white border-[#7286D3] text-[#7286D3] shadow-xs ring-2 ring-[#7286D3]/15"
                    : "bg-white/80 border-[#E8EEF8] text-slate-600 hover:bg-white hover:text-slate-800"
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${activeTopic.id === topic.id ? "text-[#7286D3]" : "text-slate-400"}`} />
                <span>{topic.title}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-medium">
                  {topic.domainName}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Academic Material & Ground Truth (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: Ground Truth Definition */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8EEF8] shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E8EEF8]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#7286D3]">
                <span className="px-2.5 py-1 rounded-lg bg-[#E8EEF8] text-[#7286D3] uppercase tracking-wider">
                  {activeTopic.domainName}
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1 text-slate-500 font-normal">
                  <Clock className="w-3.5 h-3.5" />
                  {activeTopic.estimatedReadingMinutes} phút đọc
                </span>
              </div>

              <div className="flex items-center gap-1 text-xs text-slate-500">
                <span className="font-semibold">Độ khó:</span>
                <div className="flex gap-0.5 text-[#F39C12]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < activeTopic.difficultyLevel ? "opacity-100" : "opacity-25"}>
                      ★
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 mb-2">
                {activeTopic.title}
              </h2>
              <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">
                Định nghĩa chuẩn (Ground Truth)
              </p>
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E8EEF8] text-sm text-slate-700 leading-relaxed italic border-l-4 border-l-[#7286D3]">
                "{activeTopic.summary}"
              </div>
            </div>

            {/* Required Concepts */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Các luận điểm bạn phải truyền đạt được:
              </h4>
              <div className="flex flex-wrap gap-2">
                {activeTopic.requiredConcepts.map((concept, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 border border-[#E8EEF8] text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7286D3]" />
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Card: Jargon Traps (Bẫy thuật ngữ) */}
          <div className="bg-gradient-to-br from-[#FFF5F5] to-[#FFF0F0] rounded-3xl p-6 sm:p-7 border border-[#FFE0E0] shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-[#E07A5F]">
              <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Cảnh báo: Bẫy Thuật Ngữ (Jargon Traps)</h3>
                <p className="text-xs text-slate-500">
                  Khi giảng bài cho AI, đừng nói những từ này mà hãy tìm cách so sánh dân dã!
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {activeTopic.jargonTraps.map((trap, idx) => (
                <div key={idx} className="bg-white/90 backdrop-blur-xs p-4 rounded-2xl border border-rose-100 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-700 px-2.5 py-0.5 rounded-md bg-rose-50 border border-rose-200">
                      ⚠️ "{trap.term}"
                    </span>
                    <span className="text-[11px] text-slate-400">Từ chuyên ngành</span>
                  </div>
                  <p className="text-slate-600">
                    <strong className="text-slate-700">Ý nghĩa:</strong> {trap.explanation}
                  </p>
                  <p className="text-[#7286D3] bg-[#F3F6FA] p-2 rounded-xl flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 shrink-0 text-[#F39C12]" />
                    <span>
                      <strong>Gợi ý bình dân hóa:</strong> {trap.recommendedAnalogy}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Starter Analogies (Ý tưởng ẩn dụ mồi) */}
          {activeTopic.starterAnalogies.length > 0 && (
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8EEF8] shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 text-[#7286D3]">
                <div className="w-8 h-8 rounded-xl bg-[#E8EEF8] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">Gợi ý Ẩn Dụ Mồi (Starter Analogies)</h3>
                  <p className="text-xs text-slate-500">Các phép so sánh đã được kiểm chứng hiệu quả theo đối tượng.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeTopic.starterAnalogies.map((analogy, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50/70 border border-[#E8EEF8] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                        <Quote className="w-3 h-3 text-[#7286D3]" />
                        {analogy.title}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-100">
                        {analogy.applicableAudience}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 italic leading-relaxed">
                      "{analogy.metaphor}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Material Markdown (if any) */}
          {activeTopic.fullMaterialMarkdown && (
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8EEF8] shadow-xs space-y-3">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#7286D3]" />
                Tài liệu đọc chi tiết
              </h4>
              <div className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-3 whitespace-pre-line bg-slate-50/50 p-4 rounded-2xl border border-[#E8EEF8]">
                {activeTopic.fullMaterialMarkdown}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Speaker's Scratchpad & Action Deck (5 Cols) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
          {/* Speaker Scratchpad */}
          <SpeakerScratchpadDrawer mode="inline" />

          {/* Feynman Readiness Checklist */}
          <div className="bg-white rounded-3xl p-6 border border-[#E8EEF8] shadow-xs space-y-4">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#E07A5F]" />
              Tiêu chí sẵn sàng lên đài (Feynman Checklist)
            </h4>

            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Tôi có thể mở đầu bằng 1 ví dụ đời thường mà không cần đọc định nghĩa.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Tôi đã chuẩn bị câu trả lời nếu AI hỏi "Tại sao lại thế?".</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Tôi sẵn sàng thừa nhận điểm mình chưa hiểu rõ nếu bị AI phản biện trúng.</span>
              </li>
            </ul>

            <button
              onClick={handleLaunchStage}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#7286D3] to-[#8EA7E9] hover:from-[#5E72C4] hover:to-[#7286D3] text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Tôi đã sẵn sàng ➔ Bắt đầu giảng cho AI</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyPrepLab;

