/**
 * File: src/pages/TopicKnowledgeGraph.tsx
 * Mục đích: [Trang 8] Bản Đồ Tri Thức & Bóc Tách Lỗ Hổng Kiến Thức (Feynman Knowledge Gap Radar)
 * Trực quan hóa mạng lưới liên kết giữa 40 chủ đề trọng tâm (Toán Cao Cấp, Toán Rời Rạc, Thị Giác Máy Tính, Hệ Thống CNTT).
 * Tự động phát hiện các lỗ hổng tri thức (Knowledge Gaps), quan hệ tiên quyết và đề xuất lộ trình giảng giải bù đắp cho AI.
 */

import React, { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { GRAPH_NODES, GRAPH_EDGES } from "@/data/knowledge-graph.data";
import { DOMAINS_CATALOG, TOPICS_CATALOG } from "@/data/academic-catalog.data";
import { useStudyStore } from "@/hooks/useStudyStore";
import type { GraphNode, CatalogTopic } from "@/types/catalog.types";
import {
  ArrowRight,
  BookOpen,
  Sparkles,
  Layers,
  X,
  CheckCircle2,
  AlertTriangle,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Activity,
  GitFork,
  GraduationCap,
  Flame,
  ShieldAlert,
  Compass,
  LayoutGrid,
  Eye,
  Check,
} from "lucide-react";

type ViewMode = "ROADMAP" | "GRAPH" | "GAP_MATRIX";
type GapFilter = "ALL" | "GAPS" | "DEVELOPING" | "MASTERED";

interface CalculatedNodePosition {
  x: number;
  y: number;
  node: GraphNode;
  topic?: CatalogTopic;
}

export const TopicKnowledgeGraph: React.FC = () => {
  const navigate = useNavigate();
  const { selectTopic } = useStudyStore();

  // State
  const [selectedDomain, setSelectedDomain] = useState<string>("ALL");
  const [gapFilter, setGapFilter] = useState<GapFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("ROADMAP");
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  // Graph Canvas Zoom & Pan
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Map topic detail by ID
  const topicMap = useMemo(() => {
    const map = new Map<string, CatalogTopic>();
    TOPICS_CATALOG.forEach((t) => map.set(t.id, t));
    return map;
  }, []);

  // Filtered nodes based on Domain, Gap status, and Search
  const filteredNodes = useMemo(() => {
    return GRAPH_NODES.filter((node) => {
      // 1. Domain filter
      if (selectedDomain !== "ALL" && node.domainId !== selectedDomain) {
        return false;
      }
      // 2. Gap status filter
      const score = node.score ?? 50;
      if (gapFilter === "GAPS" && score >= 60) return false;
      if (gapFilter === "DEVELOPING" && (score < 60 || score >= 80)) return false;
      if (gapFilter === "MASTERED" && score < 80) return false;

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesLabel = node.label.toLowerCase().includes(q);
        const topic = topicMap.get(node.topicId || node.id);
        const matchesSummary = topic?.summary.toLowerCase().includes(q) ?? false;
        if (!matchesLabel && !matchesSummary) return false;
      }

      return true;
    });
  }, [selectedDomain, gapFilter, searchQuery, topicMap]);

  // Overall Statistics for Barometer
  const stats = useMemo(() => {
    const all = GRAPH_NODES;
    const gaps = all.filter((n) => (n.score ?? 0) < 60);
    const developing = all.filter((n) => (n.score ?? 0) >= 60 && (n.score ?? 0) < 80);
    const mastered = all.filter((n) => (n.score ?? 0) >= 80);
    const avgScore = Math.round(
      all.reduce((acc, n) => acc + (n.score ?? 0), 0) / (all.length || 1)
    );

    // Critical bottleneck: choose the lowest score topic that has dependent topics
    const criticalGap = gaps[0] || all[0];

    return {
      total: all.length,
      gapsCount: gaps.length,
      developingCount: developing.length,
      masteredCount: mastered.length,
      avgScore,
      criticalGap,
    };
  }, []);

  // Node Inspector detail
  const activeNode = useMemo(() => {
    if (!activeNodeId) return null;
    return GRAPH_NODES.find((n) => n.id === activeNodeId) || null;
  }, [activeNodeId]);

  const activeTopic = useMemo(() => {
    if (!activeNode) return null;
    return topicMap.get(activeNode.topicId || activeNode.id) || null;
  }, [activeNode, topicMap]);

  // Tiered layout for Roadmap View (Categorized by Level / Tier)
  const tieredNodes = useMemo(() => {
    const beginner: GraphNode[] = [];
    const intermediate: GraphNode[] = [];
    const advanced: GraphNode[] = [];

    filteredNodes.forEach((node) => {
      const lvl = node.level || "";
      if (lvl === "Beginner" || node.difficulty === 1) {
        beginner.push(node);
      } else if (lvl === "Advanced" || (typeof node.difficulty === "number" && node.difficulty >= 4)) {
        advanced.push(node);
      } else {
        intermediate.push(node);
      }
    });

    return { beginner, intermediate, advanced };
  }, [filteredNodes]);

  // Canvas positions for Graph View (Calculated cleanly to prevent collision)
  const canvasLayout = useMemo(() => {
    const positions: CalculatedNodePosition[] = [];
    const domainOrder = ["math", "discrete", "cv", "cs"];

    if (selectedDomain !== "ALL") {
      // 1 domain = 10 nodes layout in 3 columns
      const beginner = filteredNodes.filter((n) => n.level === "Beginner");
      const intermediate = filteredNodes.filter((n) => n.level === "Intermediate");
      const advanced = filteredNodes.filter((n) => n.level === "Advanced");

      const colX = [180, 560, 940];
      const startY = 100;
      const stepY = 120;

      beginner.forEach((node, idx) => {
        positions.push({
          x: colX[0],
          y: startY + idx * stepY,
          node,
          topic: topicMap.get(node.topicId || node.id),
        });
      });

      intermediate.forEach((node, idx) => {
        positions.push({
          x: colX[1],
          y: startY + idx * stepY,
          node,
          topic: topicMap.get(node.topicId || node.id),
        });
      });

      advanced.forEach((node, idx) => {
        positions.push({
          x: colX[2],
          y: startY + idx * stepY,
          node,
          topic: topicMap.get(node.topicId || node.id),
        });
      });

      return {
        positions,
        width: 1150,
        height: Math.max(720, Math.max(beginner.length, intermediate.length, advanced.length) * stepY + 160),
      };
    }

    // ALL domains view: Arrange into 4 dedicated lanes with clean spacing
    const laneHeight = 260;
    const laneStartY = 80;

    domainOrder.forEach((dId, dIdx) => {
      const domainNodes = filteredNodes.filter((n) => n.domainId === dId);
      const sorted = [...domainNodes].sort((a, b) => {
        const order: Record<string, number> = { Beginner: 1, Intermediate: 2, Advanced: 3 };
        return (order[a.level || "Intermediate"] || 2) - (order[b.level || "Intermediate"] || 2);
      });

      const itemsPerRow = 5;
      const itemSpacingX = 290;
      const itemStartX = 160;

      sorted.forEach((node, idx) => {
        const row = Math.floor(idx / itemsPerRow);
        const col = idx % itemsPerRow;
        const x = itemStartX + col * itemSpacingX;
        const y = laneStartY + dIdx * laneHeight + row * 105;

        positions.push({
          x,
          y,
          node,
          topic: topicMap.get(node.topicId || node.id),
        });
      });
    });

    return {
      positions,
      width: 1650,
      height: laneStartY + 4 * laneHeight + 60,
    };
  }, [filteredNodes, selectedDomain, topicMap]);

  // Edges that connect the currently rendered positions
  const visibleEdges = useMemo(() => {
    const nodeIds = new Set(canvasLayout.positions.map((p) => p.node.id));
    return GRAPH_EDGES.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
  }, [canvasLayout.positions]);

  // Navigation handlers
  const handleStudyTopic = (topicId: string) => {
    selectTopic(topicId);
    navigate(`/study?topicId=${topicId}`);
  };

  const handleTeachTopic = (topicTitle: string) => {
    navigate(`/stage/new?topic=${encodeURIComponent(topicTitle)}`);
  };

  // Drag & Pan handlers for Graph Canvas
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".graph-node-card")) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetCanvas = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Helper colors & labels
  const getDomainColor = (domainId: string) => {
    switch (domainId) {
      case "math":
        return { text: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-700", hex: "#3b82f6" };
      case "discrete":
        return { text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-700", hex: "#10b981" };
      case "cv":
        return { text: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", badge: "bg-purple-100 text-purple-700", hex: "#8b5cf6" };
      case "cs":
        return { text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-700", hex: "#f59e0b" };
      default:
        return { text: "text-[#7286D3]", bg: "bg-[#EEF2FC]", border: "border-[#D5E1FA]", badge: "bg-[#E5ECFB] text-[#5066A1]", hex: "#7286D3" };
    }
  };

  const getScoreStyle = (score: number) => {
    if (score >= 80) {
      return {
        label: "Đã Thấu Suốt",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        bar: "bg-emerald-500",
        icon: CheckCircle2,
      };
    }
    if (score >= 60) {
      return {
        label: "Đang Củng Cố",
        badge: "bg-amber-50 text-amber-700 border-amber-200",
        bar: "bg-amber-500",
        icon: Activity,
      };
    }
    return {
      label: "Lỗ Hổng Cần Vá",
      badge: "bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-300",
      bar: "bg-rose-500",
      icon: ShieldAlert,
    };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Header & Knowledge Gap Radar Barometer */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5ECFB] text-[#5066A1] text-xs font-bold border border-[#D3E0FA] mb-1.5">
              <Compass className="w-3.5 h-3.5 text-[#7286D3]" />
              <span>Bóc Tách Lỗ Hổng Tri Thức (Feynman Gap Radar)</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">
              Bản Đồ Tri Thức Toán Học & Khoa Học Máy Tính
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
              Hệ thống theo dõi mức độ thấu suốt, tự động phát hiện các lỗ hổng tri thức tiên quyết và định hướng lộ trình giảng giải bù đắp cho AI theo phương pháp Feynman.
            </p>
          </div>

          {/* View Mode Switcher */}
          <div className="inline-flex items-center p-1 bg-white rounded-2xl border border-slate-200/80 shadow-xs self-start md:self-auto">
            <button
              onClick={() => setViewMode("ROADMAP")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "ROADMAP"
                  ? "bg-[#7286D3] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Cây Lộ Trình</span>
            </button>
            <button
              onClick={() => setViewMode("GRAPH")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "GRAPH"
                  ? "bg-[#7286D3] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Đồ Thị Không Gian</span>
            </button>
            <button
              onClick={() => setViewMode("GAP_MATRIX")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "GAP_MATRIX"
                  ? "bg-[#7286D3] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Soi Lỗ Hổng ({stats.gapsCount})</span>
            </button>
          </div>
        </div>

        {/* 4 Diagnostic Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: System Clarity */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#EEF2FC] flex items-center justify-center shrink-0 border border-[#D5E1FA]">
              <Flame className="w-5 h-5 text-[#7286D3]" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Độ Thấu Suốt Chung
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-slate-800">
                  {stats.avgScore}%
                </span>
                <span className="text-[11px] font-semibold text-emerald-600">Đang tiến bộ</span>
              </div>
            </div>
          </div>

          {/* Card 2: Knowledge Gaps */}
          <div
            onClick={() => setGapFilter(gapFilter === "GAPS" ? "ALL" : "GAPS")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              gapFilter === "GAPS"
                ? "bg-rose-50 border-rose-300 ring-2 ring-rose-400/20"
                : "bg-white border-slate-200/80 shadow-xs hover:border-rose-200"
            } flex items-center gap-3.5`}
          >
            <div className="w-11 h-11 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0 border border-rose-200">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Lỗ Hổng Cần Vá
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-rose-600">
                  {stats.gapsCount}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">chủ đề &lt; 60%</span>
              </div>
            </div>
          </div>

          {/* Card 3: Developing */}
          <div
            onClick={() => setGapFilter(gapFilter === "DEVELOPING" ? "ALL" : "DEVELOPING")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              gapFilter === "DEVELOPING"
                ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400/20"
                : "bg-white border-slate-200/80 shadow-xs hover:border-amber-200"
            } flex items-center gap-3.5`}
          >
            <div className="w-11 h-11 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-200">
              <Activity className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Đang Củng Cố
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-amber-600">
                  {stats.developingCount}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">chủ đề 60-79%</span>
              </div>
            </div>
          </div>

          {/* Card 4: Mastered */}
          <div
            onClick={() => setGapFilter(gapFilter === "MASTERED" ? "ALL" : "MASTERED")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              gapFilter === "MASTERED"
                ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/20"
                : "bg-white border-slate-200/80 shadow-xs hover:border-emerald-200"
            } flex items-center gap-3.5`}
          >
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Đã Thấu Suốt
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-emerald-600">
                  {stats.masteredCount}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">chủ đề ≥ 80%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Critical Bottleneck Alert Banner */}
        {stats.criticalGap && (
          <div className="bg-gradient-to-r from-amber-50/80 via-orange-50/50 to-white p-3.5 sm:p-4 rounded-2xl border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                    Khuyến nghị Feynman
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    Lỗ hổng trọng tâm cần bù đắp:{" "}
                    <span className="text-amber-800 underline font-black">{stats.criticalGap.label}</span> (
                    {stats.criticalGap.score}% Thấu suốt)
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Đây là khái niệm then chốt làm tiền đề cho nhiều thuật toán nâng cao. Hãy thử giải thích lại bằng ẩn dụ bình dân.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleTeachTopic(stats.criticalGap.label)}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shrink-0 shadow-xs cursor-pointer self-end sm:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>⚡ Giảng Bài Vá Lỗ Hổng Này</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Filter Toolbar (Domains, Gap Status, Search) */}
      <div className="bg-white p-3 sm:p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Domain Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedDomain("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDomain === "ALL"
                  ? "bg-[#7286D3] text-white shadow-xs"
                  : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              Tất Cả ({GRAPH_NODES.length})
            </button>
            {DOMAINS_CATALOG.map((domain) => {
              const isSelected = selectedDomain === domain.id;
              const colorInfo = getDomainColor(domain.id);
              return (
                <button
                  key={domain.id}
                  onClick={() => setSelectedDomain(domain.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/80"
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: colorInfo.hex }}
                  />
                  <span>{domain.name}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm chủ đề, thuật ngữ..."
              className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7286D3]/30 focus:border-[#7286D3]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Pill Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="font-semibold text-[11px]">Trạng thái:</span>
            <button
              onClick={() => setGapFilter("ALL")}
              className={`px-2 py-0.5 rounded-lg font-bold text-[11px] cursor-pointer ${
                gapFilter === "ALL" ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setGapFilter("GAPS")}
              className={`px-2 py-0.5 rounded-lg font-bold text-[11px] cursor-pointer flex items-center gap-1 ${
                gapFilter === "GAPS" ? "bg-rose-600 text-white" : "text-rose-600 hover:bg-rose-50"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
              Lỗ hổng (&lt;60%)
            </button>
            <button
              onClick={() => setGapFilter("DEVELOPING")}
              className={`px-2 py-0.5 rounded-lg font-bold text-[11px] cursor-pointer flex items-center gap-1 ${
                gapFilter === "DEVELOPING" ? "bg-amber-600 text-white" : "text-amber-600 hover:bg-amber-50"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
              Đang củng cố (60-79%)
            </button>
            <button
              onClick={() => setGapFilter("MASTERED")}
              className={`px-2 py-0.5 rounded-lg font-bold text-[11px] cursor-pointer flex items-center gap-1 ${
                gapFilter === "MASTERED" ? "bg-emerald-600 text-white" : "text-emerald-600 hover:bg-emerald-50"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Đã thấu suốt (≥80%)
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-medium">
            Hiển thị <span className="font-bold text-slate-700">{filteredNodes.length}</span> / {GRAPH_NODES.length} chủ đề
          </div>
        </div>
      </div>

      {/* 3. MAIN CONTENT: Switch between View Modes */}

      {/* VIEW 1: TIERED ROADMAP TREE (No overlap, organized by level & progression) */}
      {viewMode === "ROADMAP" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Tầng 1: Nền tảng (Beginner) */}
            <div className="space-y-3.5 bg-slate-50/70 p-4 rounded-3xl border border-slate-200/80">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center">
                    1
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800">
                      Tầng 1: Nền Tảng Cơ Sở
                    </h3>
                    <p className="text-[10px] text-slate-500">Khái niệm & quy tắc tiên quyết</p>
                  </div>
                </div>
                <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {tieredNodes.beginner.length} chủ đề
                </span>
              </div>

              <div className="space-y-3">
                {tieredNodes.beginner.map((node) => {
                  const isSelected = activeNodeId === node.id;
                  const color = getDomainColor(node.domainId);
                  const scoreStyle = getScoreStyle(node.score ?? 50);
                  const ScoreIcon = scoreStyle.icon;

                  return (
                    <div
                      key={node.id}
                      onClick={() => setActiveNodeId(node.id)}
                      className={`p-3.5 rounded-2xl bg-white border transition-all cursor-pointer shadow-2xs hover:shadow-md space-y-2.5 ${
                        isSelected
                          ? "border-[#7286D3] ring-3 ring-[#7286D3]/20 shadow-md"
                          : "border-slate-200 hover:border-[#8EA7E9]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${color.badge}`}
                        >
                          {node.category || node.domainId}
                        </span>
                        <div
                          className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${scoreStyle.badge}`}
                        >
                          <ScoreIcon className="w-2.5 h-2.5" />
                          <span>{node.score}%</span>
                        </div>
                      </div>

                      <h4 className="text-xs font-black text-slate-800 leading-snug">
                        {node.label}
                      </h4>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${scoreStyle.bar}`}
                          style={{ width: `${node.score}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                        <span className="font-semibold text-slate-400">Độ khó: Cơ bản</span>
                        <span className="text-[#7286D3] font-bold hover:underline">Chi tiết →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tầng 2: Cốt lõi & Kỹ thuật (Intermediate) */}
            <div className="space-y-3.5 bg-slate-50/70 p-4 rounded-3xl border border-slate-200/80">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center">
                    2
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800">
                      Tầng 2: Cốt Lõi & Thuật Toán
                    </h3>
                    <p className="text-[10px] text-slate-500">Cấu trúc dữ liệu & tối ưu hóa</p>
                  </div>
                </div>
                <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  {tieredNodes.intermediate.length} chủ đề
                </span>
              </div>

              <div className="space-y-3">
                {tieredNodes.intermediate.map((node) => {
                  const isSelected = activeNodeId === node.id;
                  const color = getDomainColor(node.domainId);
                  const scoreStyle = getScoreStyle(node.score ?? 50);
                  const ScoreIcon = scoreStyle.icon;

                  return (
                    <div
                      key={node.id}
                      onClick={() => setActiveNodeId(node.id)}
                      className={`p-3.5 rounded-2xl bg-white border transition-all cursor-pointer shadow-2xs hover:shadow-md space-y-2.5 ${
                        isSelected
                          ? "border-[#7286D3] ring-3 ring-[#7286D3]/20 shadow-md"
                          : "border-slate-200 hover:border-[#8EA7E9]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${color.badge}`}
                        >
                          {node.category || node.domainId}
                        </span>
                        <div
                          className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${scoreStyle.badge}`}
                        >
                          <ScoreIcon className="w-2.5 h-2.5" />
                          <span>{node.score}%</span>
                        </div>
                      </div>

                      <h4 className="text-xs font-black text-slate-800 leading-snug">
                        {node.label}
                      </h4>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${scoreStyle.bar}`}
                          style={{ width: `${node.score}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                        <span className="font-semibold text-slate-400">Độ khó: Trung cấp</span>
                        <span className="text-[#7286D3] font-bold hover:underline">Chi tiết →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tầng 3: Chuyên sâu & Lỗ hổng (Advanced / Gaps) */}
            <div className="space-y-3.5 bg-rose-50/40 p-4 rounded-3xl border border-rose-200/80">
              <div className="flex items-center justify-between pb-2 border-b border-rose-200">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-500 text-white font-black text-xs flex items-center justify-center shadow-2xs">
                    3
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-rose-950 flex items-center gap-1.5">
                      <span>Tầng 3: Chuyên Sâu</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-200 text-rose-800">
                        Vùng Lỗ Hổng
                      </span>
                    </h3>
                    <p className="text-[10px] text-rose-700/80">Khái niệm phức hợp & hệ thống phân tán</p>
                  </div>
                </div>
                <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-white text-rose-700 border border-rose-200 shadow-2xs">
                  {tieredNodes.advanced.length} chủ đề
                </span>
              </div>

              <div className="space-y-3">
                {tieredNodes.advanced.map((node) => {
                  const isSelected = activeNodeId === node.id;
                  const color = getDomainColor(node.domainId);
                  const scoreStyle = getScoreStyle(node.score ?? 50);
                  const isGap = (node.score ?? 0) < 60;

                  return (
                    <div
                      key={node.id}
                      onClick={() => setActiveNodeId(node.id)}
                      className={`p-3.5 rounded-2xl bg-white border transition-all cursor-pointer shadow-2xs hover:shadow-md space-y-2.5 relative overflow-hidden ${
                        isSelected
                          ? "border-rose-500 ring-3 ring-rose-400/20 shadow-md"
                          : isGap
                          ? "border-rose-300 hover:border-rose-400"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {isGap && (
                        <div className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-bl-md" />
                      )}

                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${color.badge}`}
                        >
                          {node.category || node.domainId}
                        </span>
                        <div
                          className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${scoreStyle.badge}`}
                        >
                          <ShieldAlert className="w-2.5 h-2.5 text-rose-500" />
                          <span>{node.score}% Thấu suốt</span>
                        </div>
                      </div>

                      <h4 className="text-xs font-black text-slate-800 leading-snug">
                        {node.label}
                      </h4>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${scoreStyle.bar}`}
                          style={{ width: `${node.score}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100">
                        <span className="font-bold text-rose-600 flex items-center gap-1">
                          ⚠️ Cần giảng giải cho AI
                        </span>
                        <span className="text-[#7286D3] font-bold hover:underline">Vá ngay →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: INTERACTIVE GRAPH CANVAS (Pan & Zoom, non-overlapping nodes, Bezier lines) */}
      {viewMode === "GRAPH" && (
        <div className="relative w-full h-[620px] bg-gradient-to-br from-[#FAFCFF] via-[#F4F7FC] to-[#EEF3FA] rounded-3xl border border-[#DDE5F5] shadow-sm overflow-hidden select-none">
          {/* Canvas Floating Controls */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-sm">
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.15))}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 cursor-pointer"
              title="Phóng to"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-bold text-slate-600 px-1 min-w-[40px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.15))}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 cursor-pointer"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-200 mx-0.5" />
            <button
              onClick={resetCanvas}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 cursor-pointer"
              title="Căn giữa lại"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Canvas Legend */}
          <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-200 text-[11px] space-y-1 shadow-2xs">
            <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider">
              Chú giải liên kết:
            </span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-3.5 h-0.5 bg-[#7286D3] inline-block" /> Tiên quyết
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-3.5 h-0.5 border-b border-dashed border-[#E07A5F] inline-block" /> Bao hàm
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Lỗ hổng &lt;60%
              </span>
            </div>
          </div>

          {/* Draggable Pan Area */}
          <div
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`w-full h-full cursor-grab ${isDragging ? "cursor-grabbing" : ""}`}
          >
            <div
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                transformOrigin: "top left",
                width: `${canvasLayout.width}px`,
                height: `${canvasLayout.height}px`,
                position: "relative",
                transition: isDragging ? "none" : "transform 0.1s ease-out",
              }}
            >
              {/* SVG Edges Layer */}
              <svg
                className="absolute inset-0 pointer-events-none"
                width={canvasLayout.width}
                height={canvasLayout.height}
              >
                <defs>
                  <marker
                    id="arrow-prereq"
                    viewBox="0 0 10 10"
                    refX="18"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#7286D3" />
                  </marker>
                  <marker
                    id="arrow-sub"
                    viewBox="0 0 10 10"
                    refX="18"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#E07A5F" />
                  </marker>
                </defs>

                {visibleEdges.map((edge) => {
                  const sourcePos = canvasLayout.positions.find((p) => p.node.id === edge.source);
                  const targetPos = canvasLayout.positions.find((p) => p.node.id === edge.target);
                  if (!sourcePos || !targetPos) return null;

                  const isPrereq = edge.relationType === "PREREQUISITE";
                  const strokeColor = isPrereq ? "#7286D3" : "#E07A5F";
                  const markerId = isPrereq ? "url(#arrow-prereq)" : "url(#arrow-sub)";

                  // Curved Bezier calculation
                  const dx = targetPos.x - sourcePos.x;
                  const dy = targetPos.y - sourcePos.y;
                  const cx = sourcePos.x + dx / 2;
                  const cy = sourcePos.y + dy / 2 + (dx > 0 ? 0 : 30);

                  return (
                    <path
                      key={edge.id || `${edge.source}-${edge.target}`}
                      d={`M ${sourcePos.x} ${sourcePos.y} Q ${cx} ${cy} ${targetPos.x} ${targetPos.y}`}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isPrereq ? 1.8 : 1.2}
                      strokeDasharray={!isPrereq ? "4 3" : undefined}
                      opacity={0.5}
                      markerEnd={markerId}
                    />
                  );
                })}
              </svg>

              {/* Node Cards Layer */}
              {canvasLayout.positions.map((pos) => {
                const isSelected = activeNodeId === pos.node.id;
                const color = getDomainColor(pos.node.domainId);
                const isGap = (pos.node.score ?? 0) < 60;

                return (
                  <div
                    key={pos.node.id}
                    onClick={() => setActiveNodeId(pos.node.id)}
                    style={{
                      left: pos.x,
                      top: pos.y,
                    }}
                    className={`graph-node-card absolute -translate-x-1/2 -translate-y-1/2 w-56 p-3 rounded-2xl border transition-all cursor-pointer group shadow-xs ${
                      isSelected
                        ? "bg-white border-[#7286D3] ring-4 ring-[#7286D3]/20 shadow-lg scale-105 z-30"
                        : "bg-white/95 backdrop-blur-md hover:scale-102 hover:shadow-md border-slate-200 z-10"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider truncate max-w-[90px]">
                          {pos.node.category || pos.node.domainId}
                        </span>
                      </div>

                      <span
                        className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${
                          isGap
                            ? "bg-rose-100 text-rose-700"
                            : (pos.node.score ?? 0) >= 80
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {pos.node.score}%
                      </span>
                    </div>

                    <h5 className="text-[11px] font-black text-slate-800 line-clamp-2 leading-tight">
                      {pos.node.label}
                    </h5>

                    {isGap && (
                      <div className="mt-1.5 flex items-center gap-1 text-[9px] font-bold text-rose-600">
                        <ShieldAlert className="w-2.5 h-2.5" />
                        <span>Lỗ hổng cần bù đắp</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: GAP DIAGNOSTICS MATRIX (Deep tabular breakdown of knowledge gaps) */}
      {viewMode === "GAP_MATRIX" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-6 bg-gradient-to-r from-rose-50/50 via-white to-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <h3 className="text-base font-black text-slate-800">
                  Bảng Chẩn Đoán Lỗ Hổng Tri Thức Cần Vá Ngay
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Danh sách các chủ đề có điểm thấu suốt thấp (&lt; 60%) hoặc học viên thường gặp ngộ nhận (Jargon Trap) cần giảng giải cho AI.
              </p>
            </div>

            <div className="text-xs font-bold px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 border border-rose-200 self-start sm:self-auto">
              Phát hiện {stats.gapsCount} lỗ hổng trọng tâm
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {GRAPH_NODES.filter((n) => (n.score ?? 0) < 60).map((node) => {
              const topic = topicMap.get(node.topicId || node.id);
              const color = getDomainColor(node.domainId);
              const primaryTrap = topic?.jargonTraps?.[0];

              return (
                <div
                  key={node.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${color.badge}`}>
                        {node.category || node.domainId}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700">
                        {node.score}% Thấu suốt
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-slate-800">
                      {node.label}
                    </h4>

                    {primaryTrap && (
                      <div className="text-xs text-slate-600 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/60 mt-2">
                        <span className="font-bold text-amber-800 block text-[11px] mb-0.5">
                          ⚠️ Bẫy ngộ nhận (Jargon Trap):
                        </span>
                        <span>{primaryTrap.trap || primaryTrap.explanation}</span>
                        {primaryTrap.recommendedAnalogy && (
                          <div className="mt-1 text-[11px] text-emerald-800 font-medium">
                            💡 Ẩn dụ bình dân: "{primaryTrap.recommendedAnalogy}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                    <button
                      onClick={() => handleStudyTopic(node.topicId || node.id)}
                      className="px-3 py-2 rounded-xl bg-white border border-[#D5E1FA] text-[#7286D3] hover:bg-[#EEF2FC] text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Soạn bài</span>
                    </button>

                    <button
                      onClick={() => handleTeachTopic(node.label)}
                      className="px-3.5 py-2 rounded-xl bg-[#7286D3] text-white hover:bg-[#5E72C4] text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Vá Lỗ Hổng Này</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Topic Detail & Gap Resolution Drawer (Modal slide-over when a node is selected) */}
      {activeNode && activeTopic && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#7286D3]/40 shadow-lg animate-in slide-in-from-bottom duration-200 space-y-5">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-[#EEF2FC] text-[#5066A1]">
                  {activeTopic.domainName}
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                  Cấp độ: {activeNode.level || "Cơ bản"}
                </span>
                <span
                  className={`text-xs font-black px-2.5 py-0.5 rounded-lg border ${
                    getScoreStyle(activeNode.score ?? 50).badge
                  }`}
                >
                  {activeNode.score}% Độ thấu suốt
                </span>
              </div>

              <h2 className="text-xl font-black text-slate-800 mt-2">
                {activeTopic.title}
              </h2>
            </div>

            <button
              onClick={() => setActiveNodeId(null)}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Ground Truth & Core Concepts */}
            <div className="md:col-span-2 space-y-4">
              {/* Ground Truth */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Định nghĩa chuẩn (Ground Truth)
                </span>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  "{activeTopic.summary}"
                </p>
              </div>

              {/* Core Concepts */}
              {activeTopic.requiredConcepts && activeTopic.requiredConcepts.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Các luận điểm cốt lõi cần giải thích được:
                  </span>
                  <div className="space-y-1.5">
                    {activeTopic.requiredConcepts.map((concept, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 flex items-start gap-2 shadow-2xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{concept}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Jargon Traps if available */}
              {activeTopic.jargonTraps && activeTopic.jargonTraps.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Bẫy thuật ngữ (Jargon Trap) cần tránh lạm dụng:
                  </span>
                  <div className="space-y-2">
                    {activeTopic.jargonTraps.map((jt, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-xs space-y-1"
                      >
                        <div className="font-bold text-amber-900">
                          Thuật ngữ: <span className="underline">{jt.term}</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          Ngộ nhận: {jt.trap || jt.explanation}
                        </p>
                        {jt.recommendedAnalogy && (
                          <p className="text-emerald-700 font-semibold text-[11px] pt-1 border-t border-amber-200/50">
                            💡 Gợi ý giải thích bình dân: "{jt.recommendedAnalogy}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions & Gap Assessment */}
            <div className="flex flex-col justify-between gap-4 bg-[#F8FAFD] p-5 rounded-2xl border border-[#E8EEF8]">
              <div className="space-y-3">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                  Đánh giá thấu suốt
                </span>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">Độ thấu suốt:</span>
                    <span className="font-black text-slate-900">{activeNode.score}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getScoreStyle(activeNode.score ?? 50).bar}`}
                      style={{ width: `${activeNode.score}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 pt-1 leading-snug">
                    {(activeNode.score ?? 0) < 60
                      ? "⚠️ Khái niệm này đang là lỗ hổng tri thức. Hãy giảng lại bằng từ ngữ đời thường để nâng điểm thấu suốt."
                      : (activeNode.score ?? 0) < 80
                      ? "🟡 Đang củng cố. Cần thêm các ví dụ thực tiễn để đạt cấp độ hoàn toàn thấu suốt."
                      : "🟢 Bạn đã làm chủ khái niệm này. Sẵn sàng liên kết sang các chủ đề nâng cao."}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-slate-200">
                <button
                  onClick={() => handleStudyTopic(activeTopic.id)}
                  className="w-full py-2.5 px-4 rounded-xl bg-white border border-[#D5E1FA] text-[#7286D3] hover:bg-[#EEF2FC] text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>1. Soạn Bài Trong Study Lab</span>
                </button>

                <button
                  onClick={() => handleTeachTopic(activeTopic.title)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#7286D3] text-white hover:bg-[#5E72C4] text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>2. Lên Bục Giảng Cho AI</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicKnowledgeGraph;
