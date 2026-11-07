/**
 * File: src/pages/admin/AdminCurriculumManager.tsx
 * Mục đích: Quản Trị Kho Tri Thức & Chuẩn Mực Học Thuật (Curriculum & Ground Truth Manager) thiết kế dạng Split-Screen công thái học:
 *   - Danh sách 40 chủ đề bên trái (Search & Filter tức thì).
 *   - Bàn chỉnh sửa Ground Truth & bẫy Jargon bên phải (Inline Editor) có nút Lưu 1-click.
 *   - Không cần cuộn trang lên xuống, chuyển chủ đề tức thời.
 */

import React, { useState } from "react";
import { ACADEMIC_TOPICS, ACADEMIC_DOMAINS } from "@/data/academic-catalog.data";
import { CatalogTopic } from "@/types/catalog.types";
import { toast } from "sonner";
import {
  FileText,
  Search,
  Plus,
  Edit3,
  CheckCircle2,
  BookOpen,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Save,
  Layers,
  Sparkles,
} from "lucide-react";

export const AdminCurriculumManager: React.FC = () => {
  const [topics, setTopics] = useState<CatalogTopic[]>(ACADEMIC_TOPICS);
  const [selectedDomain, setSelectedDomain] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    ACADEMIC_TOPICS[0]?.id || ""
  );

  // Active topic being viewed or edited on the right panel
  const activeTopic =
    topics.find((t) => t.id === selectedTopicId) || topics[0];

  // Local draft state for the active topic
  const [draftSummary, setDraftSummary] = useState(activeTopic?.summary || "");
  const [draftDiff, setDraftDiff] = useState(activeTopic?.difficultyLevel || 3);
  const [draftWiki, setDraftWiki] = useState(activeTopic?.wikipediaUrl || "");

  // When user switches topic on the left, sync draft
  const handleSelectTopic = (topic: CatalogTopic) => {
    setSelectedTopicId(topic.id);
    setDraftSummary(topic.summary);
    setDraftDiff(topic.difficultyLevel);
    setDraftWiki(topic.wikipediaUrl || "");
  };

  const filteredTopics = topics.filter((t) => {
    const matchDomain = selectedDomain === "ALL" || t.domainId === selectedDomain;
    const matchSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.titleVi && t.titleVi.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.titleEn && t.titleEn.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchDomain && matchSearch;
  });

  const handleSaveDraft = () => {
    if (!activeTopic) return;
    setTopics((prev) =>
      prev.map((t) =>
        t.id === activeTopic.id
          ? {
              ...t,
              summary: draftSummary,
              difficultyLevel: draftDiff,
              wikipediaUrl: draftWiki,
            }
          : t
      )
    );
    toast.success(`Đã lưu Ground Truth: "${activeTopic.title}"`, {
      description: "Hệ thống AI Persona đã được cập nhật chuẩn mực lý thuyết mới.",
    });
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* 1. Compact Header Bar with Domain Selector */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
                Kho Tri Thức & Ground Truth Học Thuật
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-100 text-purple-700">
                {topics.length} Chủ Đề
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Định nghĩa chuẩn mực khoa học để làm thước đo kiểm định bài giảng của học viên.
            </p>
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative min-w-[260px] self-start md:self-auto">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm nhanh theo tên chủ đề..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* 3. Domain Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedDomain("ALL")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            selectedDomain === "ALL"
              ? "bg-purple-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80"
          }`}
        >
          Tất Cả ({topics.length})
        </button>
        {ACADEMIC_DOMAINS.map((d) => (
          <button
            key={d.id}
            onClick={() => setSelectedDomain(d.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedDomain === d.id
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80"
            }`}
          >
            {d.name.split(" &")[0]}
          </button>
        ))}
      </div>

      {/* 4. Split-Screen Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Topics List (4 cols, scrollable independently) */}
        <div className="lg:col-span-4 space-y-2 max-h-[640px] overflow-y-auto pr-1 scrollbar-thin">
          {filteredTopics.length > 0 ? (
            filteredTopics.map((topic) => {
              const isSelected = activeTopic?.id === topic.id;

              return (
                <div
                  key={topic.id}
                  onClick={() => handleSelectTopic(topic)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-purple-50/90 border-purple-400 ring-2 ring-purple-500/20 shadow-xs"
                      : "bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-[10px] font-bold text-purple-700 bg-white px-2 py-0.5 rounded-md border border-purple-100 truncate max-w-[170px]">
                      {topic.domainName}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      Cấp {topic.difficultyLevel}
                    </span>
                  </div>

                  <h3 className="text-xs font-black text-slate-800 line-clamp-1 mb-1">
                    {topic.title}
                  </h3>

                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-snug">
                    {topic.summary}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 text-xs text-slate-400 font-bold">
              Không tìm thấy chủ đề nào phù hợp.
            </div>
          )}
        </div>

        {/* Right Column: Ground Truth & Pedagogical Studio (8 cols, fixed in view) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          {activeTopic ? (
            <>
              <div className="space-y-4">
                {/* Header: Title & Save Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                        {activeTopic.domainName}
                      </span>
                      {activeTopic.wikipediaUrl && (
                        <a
                          href={activeTopic.wikipediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-purple-600 hover:underline inline-flex items-center gap-1 font-semibold"
                        >
                          <span>Wikipedia</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <h2 className="text-base sm:text-lg font-black text-slate-800 mt-1">
                      {activeTopic.title}
                    </h2>
                    <span className="text-xs text-slate-400">{activeTopic.titleEn}</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
                  >
                    <Save className="w-4 h-4" />
                    <span>Lưu Ground Truth</span>
                  </button>
                </div>

                {/* Ground Truth Textarea */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-slate-700">
                      Định nghĩa Ground Truth (Nguyên lý toán học & khoa học chuẩn mực):
                    </label>
                    <span className="text-[10px] text-slate-400">
                      AI dùng đoạn này để bóc tách lỗi
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={draftSummary}
                    onChange={(e) => setDraftSummary(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Difficulty & Wikipedia URL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Độ Khó Của Chủ Đề:
                    </label>
                    <div className="flex items-center gap-2">
                      {[
                        { level: 1, label: "Cơ bản (1)" },
                        { level: 3, label: "Trung bình (3)" },
                        { level: 5, label: "Nâng cao (5)" },
                      ].map((item) => (
                        <button
                          key={item.level}
                          type="button"
                          onClick={() => setDraftDiff(item.level)}
                          className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            draftDiff === item.level
                              ? "bg-purple-50 border-purple-500 text-purple-700"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Đường Dẫn Wikipedia:
                    </label>
                    <input
                      type="text"
                      value={draftWiki}
                      onChange={(e) => setDraftWiki(e.target.value)}
                      placeholder="https://vi.wikipedia.org/wiki/..."
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Checklist & Jargon Traps Chips (Pedagogical Overview) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* Required Concepts */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                      Tiêu Chí Bắt Buộc ({activeTopic.requiredConcepts.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeTopic.requiredConcepts.map((concept, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-slate-700 border border-slate-200"
                        >
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Jargon Traps */}
                  <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 block">
                      Bẫy Thuật Ngữ Jargon ({(activeTopic.jargonTraps || []).length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(activeTopic.jargonTraps || []).map((trap, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-rose-700 border border-rose-200"
                          title={trap.feynmanTranslation || trap.explanation || trap.term}
                        >
                          {trap.term}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Status */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Trạng thái: Đã kiểm duyệt khoa học</span>
                <span className="text-purple-600 font-bold">1-click để lưu thay đổi</span>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400 font-bold">
              Chọn một chủ đề ở danh sách bên trái để chỉnh sửa Ground Truth.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCurriculumManager;
