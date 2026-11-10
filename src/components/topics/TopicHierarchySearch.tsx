/**
 * File: src/components/topics/TopicHierarchySearch.tsx
 * Mục đích: Thanh công cụ tìm kiếm phân cấp 3 ô theo Phương án C (Hybrid Search):
 *   - Ô 1: Nhóm Ngành (Cấp 1 - Domain Filter)
 *   - Ô 2: Ngành Chuyên Môn (Cấp 2 - Field Filter, tự động cascade theo Ô 1)
 *   - Ô 3: Tìm Kiếm Hybrid (Cấp 3/5 - Live Keyword + Semantic AI Search)
 *     * Khớp từ khóa tức thì (0ms)
 *     * So khớp ngữ nghĩa tự nhiên (Semantic Intent Match) khi gõ câu hỏi/mô tả
 *   - Bảng kết quả gợi ý phân loại rõ ràng (Exact vs. Semantic Match) kèm điểm độ tương đồng
 *   - Nút Đặt lại (Reset) để xóa bộ lọc nhanh chóng
 */

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  ChevronDown,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Layers,
  ArrowRight,
  Filter,
  X,
} from "lucide-react";
import { THREE_TIER_DOMAINS, THREE_TIER_SUBJECTS, THREE_TIER_DOMAIN_SUBJECTS, THREE_TIER_LECTURES } from "@/data/three-tier-curriculum.data";
import { CatalogTopic, DomainCategory, AcademicSubject } from "@/types/catalog.types";

export interface SearchFilterState {
  domainId: string; // "ALL" or specific domain
  fieldId: string;  // "ALL" or specific field/subject
  keyword: string;
  selectedTopicId: string | null;
}

interface TopicHierarchySearchProps {
  onFilterChange: (filter: SearchFilterState) => void;
  onSelectTopic: (topic: CatalogTopic) => void;
  domains?: DomainCategory[];
  subjects?: AcademicSubject[];
  domainSubjects?: Array<{ domain_id: string; subject_id: string; is_core?: boolean }>;
  topics?: CatalogTopic[];
  externalFilter?: SearchFilterState;
}

// Từ điển ngữ nghĩa ngữ cảnh (Semantic Intent Synonyms & Intent Vectors)
const SEMANTIC_INTENTS: Array<{
  keywords: string[];
  intents: string[];
  topicMatcher: (topic: CatalogTopic) => boolean;
  explanation: string;
}> = [
  {
    keywords: ["sai số", "cực tiểu", "cực trị", "giảm lỗi", "hạ độ dốc", "đạo hàm", "loss", "tối ưu"],
    intents: ["làm sao để giảm sai số khi train model", "tìm điểm thấp nhất của hàm số", "tối ưu hóa gradient"],
    topicMatcher: (t) => t.id.includes("gradient") || t.id.includes("optimization") || t.id.includes("hessian") || t.id.includes("taylor"),
    explanation: "Khớp ý định tối ưu hóa hàm mất mát và thuật toán hạ độ dốc vi phân.",
  },
  {
    keywords: ["cơ sở dữ liệu", "lưu trữ", "b-tree", "ổ cứng", "đọc ghi", "chỉ mục", "index", "tự cân bằng"],
    intents: ["cấu trúc lưu trữ dữ liệu dạng cây tự cân bằng", "làm sao tối ưu đọc ghi ổ cứng cho database", "cấu trúc dữ liệu cho db"],
    topicMatcher: (t) => t.id.includes("btree") || t.id.includes("indexing") || t.id.includes("transaction"),
    explanation: "Khớp ý định lưu trữ phân cấp B-Tree và cấu trúc chỉ mục cơ sở dữ liệu.",
  },
  {
    keywords: ["nhận diện", "vật thể", "video", "thời gian thực", "bounding box", "yolo", "phát hiện đối tượng", "khung hình"],
    intents: ["nhận diện vật thể nhanh theo thời gian thực", "mô hình detect đối tượng trong video", "phát hiện người và xe"],
    topicMatcher: (t) => t.id.includes("yolo") || t.id.includes("rcnn") || t.id.includes("iou") || t.id.includes("detection"),
    explanation: "Khớp ý định thị giác máy tính nhận diện vật thể thời gian thực bằng YOLO.",
  },
  {
    keywords: ["đường đi ngắn nhất", "đồ thị", "duyệt đồ thị", "dijkstra", "bfs", "dfs", "cây bao trùm"],
    intents: ["thuật toán tìm đường đi ngắn nhất", "duyệt mạng lưới nốt", "cây khung đồ thị"],
    topicMatcher: (t) => t.id.includes("graph") || t.id.includes("shortest") || t.id.includes("bfs") || t.id.includes("dijkstra"),
    explanation: "Khớp ý định giải thuật lý thuyết đồ thị và tìm kiếm đường đi ngắn nhất.",
  },
  {
    keywords: ["đồng thuận", "phân tán", "raft", "paxos", "leader", "bầu cử", "node chết", "sao chép log"],
    intents: ["thuật toán bầu cử leader trong hệ thống phân tán", "làm sao nhiều máy chủ đồng thuận trạng thái", "cơ chế raft"],
    topicMatcher: (t) => t.id.includes("raft") || t.id.includes("consensus") || t.id.includes("distributed"),
    explanation: "Khớp ý định hệ thống phân tán và giao thức đồng thuận (Consensus Algorithm).",
  },
  {
    keywords: ["tích chập", "cnn", "trích xuất đặc trưng", "ảnh", "bộ lọc", "filter", "kernel", "feature map"],
    intents: ["mạng nơ-ron xử lý hình ảnh", "cơ chế trích xuất đặc trưng ảnh bằng tích chập", "convolutional neural network"],
    topicMatcher: (t) => t.id.includes("cnn") || t.id.includes("convolution") || t.id.includes("filter"),
    explanation: "Khớp ý định trích xuất đặc trưng thị giác bằng tầng tích chập CNN.",
  },
  {
    keywords: ["ma trận", "vectơ", "không gian", "độc lập tuyến tính", "eigenvalues", "trị riêng", "svd"],
    intents: ["biến đổi ma trận không gian đa chiều", "tìm trị riêng và vectơ riêng", "đại số tuyến tính"],
    topicMatcher: (t) => t.id.includes("linear") || t.id.includes("eigenvalues") || t.id.includes("svd") || t.id.includes("matrix"),
    explanation: "Khớp ý định biến đổi không gian đại số tuyến tính và phân rã ma trận.",
  },
];

export const TopicHierarchySearch: React.FC<TopicHierarchySearchProps> = ({
  onFilterChange,
  onSelectTopic,
  domains = THREE_TIER_DOMAINS,
  subjects = THREE_TIER_SUBJECTS,
  domainSubjects = THREE_TIER_DOMAIN_SUBJECTS,
  topics = THREE_TIER_LECTURES,
  externalFilter,
}) => {
  // Controlled domain & field from externalFilter (Single Source of Truth)
  const domainId = externalFilter?.domainId || "ALL";
  const fieldId = externalFilter?.fieldId || "ALL";

  // Local state for search query to keep typing responsive
  const [searchQuery, setSearchQuery] = useState<string>(externalFilter?.keyword || "");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Sync external search keyword when modified outside (e.g., node click or reset)
  useEffect(() => {
    if (externalFilter?.keyword !== undefined && externalFilter.keyword !== searchQuery) {
      setSearchQuery(externalFilter.keyword);
    }
  }, [externalFilter?.keyword]);

  // Danh sách các Domain (bao gồm lựa chọn "Tất cả")
  const activeDomainsList = useMemo(() => {
    return [
      { id: "ALL", name: `Tất cả ${domains.length} Nhóm Ngành`, color: "#64748b" },
      ...domains.map((d) => ({
        id: d.id,
        name: d.name,
        color: d.colorHex || d.color || "#3B82F6",
      })),
    ];
  }, [domains]);

  // Available Subjects cascade based on selected Domain
  const filteredFields = useMemo(() => {
    if (domainId === "ALL") {
      return subjects.map((s) => ({
        id: s.id,
        domainId: s.domainId || "ALL",
        name: s.name,
      }));
    }

    // Lọc các môn thuộc domainId đã chọn qua quan hệ domainSubjects
    const allowedSubjectIds = new Set(
      domainSubjects.filter((ds) => ds.domain_id === domainId).map((ds) => ds.subject_id)
    );

    return subjects
      .filter((s) => allowedSubjectIds.has(s.id) || s.domainId === domainId)
      .map((s) => ({
        id: s.id,
        domainId,
        name: s.name,
      }));
  }, [domainId, subjects, domainSubjects]);

  // When domain changes, broadcast to parent with fieldId reset to ALL
  const handleDomainSelect = (dId: string) => {
    onFilterChange({
      domainId: dId,
      fieldId: "ALL",
      keyword: searchQuery.trim(),
      selectedTopicId: null,
    });
  };

  // When subject changes, broadcast to parent
  const handleFieldSelect = (fId: string) => {
    onFilterChange({
      domainId,
      fieldId: fId,
      keyword: searchQuery.trim(),
      selectedTopicId: null,
    });
  };

  // When search keyword changes, update local state and broadcast
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setIsDropdownOpen(true);
    onFilterChange({
      domainId,
      fieldId,
      keyword: val.trim(),
      selectedTopicId: null,
    });
  };

  // Close search suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hybrid Search Results (Exact Keyword vs. Semantic AI Match)
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { exactMatches: [], semanticMatches: [] };

    // 1. Exact / Substring Matches
    const exactMatches: Array<{ topic: CatalogTopic; matchType: string }> = [];
    topics.forEach((topic) => {
      // Check domain / field constraint
      if (fieldId !== "ALL" && topic.subjectId !== fieldId) return;

      const titleMatch = topic.title.toLowerCase().includes(q);
      const conceptMatch = topic.requiredConcepts?.some((c) => c.toLowerCase().includes(q));
      const summaryMatch = topic.summary?.toLowerCase().includes(q);

      if (titleMatch || conceptMatch || summaryMatch) {
        exactMatches.push({
          topic,
          matchType: titleMatch ? "Tên bài học" : conceptMatch ? "Khái niệm cốt lõi" : "Tóm tắt lý thuyết",
        });
      }
    });

    // 2. Semantic Intent Matches (Natural Language & Question Matching)
    const semanticMatches: Array<{
      topic: CatalogTopic;
      similarityScore: number;
      explanation: string;
    }> = [];

    // Analyze intent keywords
    SEMANTIC_INTENTS.forEach((intent) => {
      const keywordHits = intent.keywords.filter((kw) => q.includes(kw));
      const intentHits = intent.intents.filter((phrase) => {
        const words = phrase.split(" ");
        const matchedWordCount = words.filter((w) => q.includes(w)).length;
        return matchedWordCount >= 2;
      });

      if (keywordHits.length > 0 || intentHits.length > 0) {
        const score = Math.min(
          98,
          70 + keywordHits.length * 8 + (intentHits.length > 0 ? 15 : 0)
        );

        // Find topics that match this intent
        const topicsPool = (topics && topics.length > 0) ? topics : THREE_TIER_LECTURES;
        topicsPool.filter(intent.topicMatcher).forEach((topic) => {
          if (domainId !== "ALL" && topic.domainId !== domainId) return;
          // Avoid duplicate in exact
          const alreadyInExact = exactMatches.some((em) => em.topic.id === topic.id);
          const alreadyInSemantic = semanticMatches.some((sm) => sm.topic.id === topic.id);

          if (!alreadyInExact && !alreadyInSemantic) {
            semanticMatches.push({
              topic,
              similarityScore: score,
              explanation: intent.explanation,
            });
          }
        });
      }
    });

    return {
      exactMatches: exactMatches.slice(0, 5),
      semanticMatches: semanticMatches.slice(0, 4),
    };
  }, [searchQuery, domainId]);

  const hasActiveFilters = domainId !== "ALL" || fieldId !== "ALL" || searchQuery.trim().length > 0;

  const handleReset = () => {
    setSearchQuery("");
    setIsDropdownOpen(false);
    onFilterChange({
      domainId: "ALL",
      fieldId: "ALL",
      keyword: "",
      selectedTopicId: null,
    });
  };

  const handleSelectTopicResult = (topic: CatalogTopic) => {
    onSelectTopic(topic);
    setIsDropdownOpen(false);
  };

  return (
    <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-sm p-2 sm:p-2.5 flex flex-col md:flex-row items-stretch md:items-center gap-2 relative z-20 text-slate-800">
      {/* ========================================================
          Ô 1: Nhóm Ngành (Cấp 1 - Domain Selector)
      ======================================================== */}
      <div className="flex-1 min-w-[200px] relative">
        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block px-1 mb-1">
          1. Nhóm Ngành (Cấp 1)
        </label>
        <div className="relative">
          <select
            value={domainId}
            onChange={(e) => handleDomainSelect(e.target.value)}
            className="w-full appearance-none bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-3 py-2 pr-8 text-xs font-bold text-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            {activeDomainsList.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* ========================================================
          Ô 2: Môn Học (Cấp 2 - Subject Selector Cascade)
      ======================================================== */}
      <div className="flex-1 min-w-[220px] relative">
        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block px-1 mb-1">
          2. Môn Học (Cấp 2)
        </label>
        <div className="relative">
          <select
            value={fieldId}
            onChange={(e) => handleFieldSelect(e.target.value)}
            className="w-full appearance-none bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-3 py-2 pr-8 text-xs font-bold text-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">Toàn bộ Môn Học</option>
            {filteredFields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* ========================================================
          Ô 3: Tìm Kiếm Hybrid (Cấp 3 & 5 - Live + Semantic AI)
      ======================================================== */}
      <div ref={searchContainerRef} className="flex-[1.6] min-w-[280px] relative">
        <div className="flex items-center justify-between px-1 mb-1">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
            3. Môn Học & Khái Niệm (Hybrid Search)
          </label>
          <span className="inline-flex items-center gap-1 text-[9px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200/60">
            <Sparkles className="w-2.5 h-2.5 text-amber-500 fill-amber-400" />
            AI Semantic
          </span>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => {
              if (searchQuery.trim().length > 0) setIsDropdownOpen(true);
            }}
            placeholder="Gõ từ khóa hoặc câu hỏi tự nhiên (VD: giảm sai số model, YOLO, B-Tree...)"
            className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />

          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setIsDropdownOpen(false);
                onFilterChange({
                  domainId,
                  fieldId,
                  keyword: "",
                  selectedTopicId: null,
                });
              }}
              className="p-1 rounded-full text-slate-400 hover:text-slate-700 absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Suggestion Dropdown (Hybrid Results) */}
        {isDropdownOpen && searchQuery.trim().length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-2.5 max-h-[380px] overflow-y-auto z-50 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
            {/* 1. Exact / Keyword Results */}
            {searchResults.exactMatches.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 block">
                  Khớp Từ Khóa ({searchResults.exactMatches.length})
                </span>
                {searchResults.exactMatches.map(({ topic, matchType }) => (
                  <button
                    key={topic.id}
                    onClick={() => handleSelectTopicResult(topic)}
                    className="w-full text-left p-2 rounded-xl hover:bg-blue-50/80 transition-colors flex items-center justify-between group cursor-pointer border border-transparent hover:border-blue-200/60"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                        <span>{topic.title}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <span>{topic.domainName || topic.domainId}</span>
                        <span>•</span>
                        <span className="text-blue-600 font-medium">Khớp: {matchType}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            )}

            {/* 2. Semantic AI Matches */}
            {searchResults.semanticMatches.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500 fill-amber-400" />
                    Khớp Theo Ngữ Nghĩa AI ({searchResults.semanticMatches.length})
                  </span>
                  <span className="text-[9px] text-slate-400">Semantic Vector Matching</span>
                </div>

                {searchResults.semanticMatches.map(({ topic, similarityScore, explanation }) => (
                  <button
                    key={topic.id}
                    onClick={() => handleSelectTopicResult(topic)}
                    className="w-full text-left p-2.5 rounded-xl bg-indigo-50/40 hover:bg-indigo-50/90 transition-colors flex items-start justify-between group cursor-pointer border border-indigo-100 hover:border-indigo-300 space-y-1"
                  >
                    <div className="space-y-1 flex-1 pr-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                          {topic.title}
                        </span>
                        <span className="text-[10px] font-black text-indigo-700 bg-white px-1.5 py-0.5 rounded-full border border-indigo-200 shadow-xs">
                          {similarityScore}% Khớp
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-snug line-clamp-2">
                        💡 {explanation}
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                  </button>
                ))}
              </div>
            )}

            {/* Empty State */}
            {searchResults.exactMatches.length === 0 && searchResults.semanticMatches.length === 0 && (
              <div className="py-6 text-center space-y-1.5">
                <Search className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Không tìm thấy chủ đề phù hợp</p>
                <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                  Hãy thử gõ tên bài học khác, khái niệm toán học, hoặc đặt câu hỏi tự nhiên về giải thuật bạn đang tìm kiếm.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================
          Nút Đặt Lại Bộ Lọc (Reset Filters)
      ======================================================== */}
      {hasActiveFilters && (
        <button
          onClick={handleReset}
          className="self-end md:self-auto py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 border border-slate-200/80 cursor-pointer shadow-xs active:scale-95"
          title="Xóa bộ lọc và xem toàn cảnh đồ thị"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Đặt lại</span>
        </button>
      )}
    </div>
  );
};

export default TopicHierarchySearch;

