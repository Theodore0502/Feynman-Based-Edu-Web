/**
 * File: src/pages/TopicKnowledgeGraph.tsx
 * Mục đích: [Trang 8] Bản Đồ Tri Thức Tỏa Tròn & Bóc Tách Lỗ Hổng Kiến Thức
 * (Interactive Radial / Force-directed Knowledge Graph - Feynman Knowledge Gap Radar)
 * 
 * Tính năng chính:
 * 1. Biểu đồ mạng lưới tỏa tròn tương tác (Interactive Radial / Force-directed Graph):
 *    - Tâm điểm (Center Hub): Theodore Core Mascot.
 *    - 3 Vành đai quỹ đạo đồng tâm (Concentric Orbit Rings):
 *        * Orbit 1: Nền tảng cơ sở (Foundation - Beginner - 85% thấu suốt)
 *        * Orbit 2: Cốt lõi & Kỹ thuật (Core - Intermediate - 70% thấu suốt)
 *        * Orbit 3: Chuyên sâu & Vùng Lỗ Hổng (Advanced / Gaps - 50% thấu suốt, phát sáng cảnh báo)
 *    - 4 Góc phần tư chuyên ngành (4 Academic Sectors: Toán cao cấp, Toán rời rạc, Thị giác máy tính, Hệ thống).
 *    - Vật lý lực tương tác d3-force: Chống va chạm (Collision avoidance), lò xo quan hệ tiên quyết (Spring links),
 *      kéo thả chuột tự do (Drag & Drop), phóng to thu nhỏ (Zoom & Pan), rê chuột phát sáng lộ trình (Hover highlight).
 * 2. Chế độ Cây Lộ Trình (Tiered Roadmap) & Bảng Soi Lỗ Hổng (Gap Diagnostics Matrix).
 * 3. Feynman Drawer chi tiết: Ground Truth, Luận điểm cốt lõi, Bẫy Jargon, nút bấm soạn bài & giảng bài cho AI.
 */

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCollide,
  forceRadial,
  forceCenter,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force";

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
  Flame,
  ShieldAlert,
  Compass,
  Radio,
  Move,
  RefreshCw,
  Orbit,
} from "lucide-react";

type ViewMode = "RADIAL" | "ROADMAP" | "GAP_MATRIX";
type GapFilter = "ALL" | "GAPS" | "DEVELOPING" | "MASTERED";

// Simulation Datum interfaces
interface RadialSimNode extends SimulationNodeDatum {
  id: string;
  topicId: string;
  label: string;
  domainId: string;
  category: string;
  level: string;
  score: number;
  difficulty: number | string;
  targetRadius: number;
  targetAngle: number;
  color: string;
  r: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

interface RadialSimLink extends SimulationLinkDatum<RadialSimNode> {
  id: string;
  source: string | RadialSimNode;
  target: string | RadialSimNode;
  relationType: string;
}

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 1000;
const CENTER_X = CANVAS_WIDTH / 2;
const CENTER_Y = CANVAS_HEIGHT / 2;

// Orbit Radii
const ORBIT_1_R = 190; // Foundation (Beginner)
const ORBIT_2_R = 330; // Core (Intermediate)
const ORBIT_3_R = 460; // Advanced / Gaps (Nâng cao)

// Domain Sector angles (Radians)
// Math: Right (-pi/4 to pi/4, center = 0)
// Discrete: Bottom (pi/4 to 3pi/4, center = pi/2)
// CV: Left (3pi/4 to 5pi/4, center = pi)
// CS: Top (5pi/4 to 7pi/4, center = 3pi/2)
const DOMAIN_SECTOR_CENTERS: Record<string, number> = {
  math: 0,
  discrete: Math.PI / 2,
  cv: Math.PI,
  cs: (3 * Math.PI) / 2,
};

export const TopicKnowledgeGraph: React.FC = () => {
  const navigate = useNavigate();
  const { selectTopic } = useStudyStore();

  // Primary State
  const [selectedDomain, setSelectedDomain] = useState<string>("ALL");
  const [gapFilter, setGapFilter] = useState<GapFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("RADIAL");
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [radialConstraintEnabled, setRadialConstraintEnabled] = useState<boolean>(true);

  // Canvas Zoom & Pan
  const [zoomLevel, setZoomLevel] = useState<number>(0.85);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // d3-force Simulation State
  const [simNodes, setSimNodes] = useState<RadialSimNode[]>([]);
  const [simLinks, setSimLinks] = useState<RadialSimLink[]>([]);
  const simRef = useRef<Simulation<RadialSimNode, RadialSimLink> | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Dragging node state
  const draggingNodeRef = useRef<RadialSimNode | null>(null);

  // Topic Catalog Map for rapid lookup
  const topicMap = useMemo(() => {
    const map = new Map<string, CatalogTopic>();
    TOPICS_CATALOG.forEach((t) => map.set(t.id, t));
    return map;
  }, []);

  // Diagnostics & KPI Stats
  const stats = useMemo(() => {
    const all = GRAPH_NODES;
    const gaps = all.filter((n) => (n.score ?? 0) < 60);
    const developing = all.filter((n) => (n.score ?? 0) >= 60 && (n.score ?? 0) < 80);
    const mastered = all.filter((n) => (n.score ?? 0) >= 80);
    const avgScore = Math.round(
      all.reduce((acc, n) => acc + (n.score ?? 0), 0) / (all.length || 1)
    );
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

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return GRAPH_NODES.filter((node) => {
      if (selectedDomain !== "ALL" && node.domainId !== selectedDomain) return false;
      const score = node.score ?? 50;
      if (gapFilter === "GAPS" && score >= 60) return false;
      if (gapFilter === "DEVELOPING" && (score < 60 || score >= 80)) return false;
      if (gapFilter === "MASTERED" && score < 80) return false;

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

  // Active node and topic details
  const activeNode = useMemo(() => {
    if (!activeNodeId) return null;
    return GRAPH_NODES.find((n) => n.id === activeNodeId) || null;
  }, [activeNodeId]);

  const activeTopic = useMemo(() => {
    if (!activeNode) return null;
    return topicMap.get(activeNode.topicId || activeNode.id) || null;
  }, [activeNode, topicMap]);

  // Connected nodes map for hover highlighting (Incoming prerequisites & Outgoing dependents)
  const connectedNodeIds = useMemo(() => {
    const targetId = hoveredNodeId || activeNodeId;
    if (!targetId) return null;

    const set = new Set<string>();
    set.add(targetId);

    GRAPH_EDGES.forEach((edge) => {
      const srcId = typeof edge.source === "object" ? (edge.source as any).id : edge.source;
      const tgtId = typeof edge.target === "object" ? (edge.target as any).id : edge.target;

      if (srcId === targetId) set.add(tgtId);
      if (tgtId === targetId) set.add(srcId);
    });

    return set;
  }, [hoveredNodeId, activeNodeId]);

  // Initialize and run d3-force Simulation
  useEffect(() => {
    // 1. Prepare simulation nodes with radial orbit targets
    const initialNodes: RadialSimNode[] = GRAPH_NODES.map((node, idx) => {
      // Determine target radius by level
      let targetRadius = ORBIT_2_R;
      if (node.level === "Beginner" || node.difficulty === 1) {
        targetRadius = ORBIT_1_R;
      } else if (node.level === "Advanced" || (typeof node.difficulty === "number" && node.difficulty >= 4)) {
        targetRadius = ORBIT_3_R;
      }

      // Determine target angle by domain sector + spread
      const domainNodes = GRAPH_NODES.filter((n) => n.domainId === node.domainId);
      const indexInDomain = domainNodes.findIndex((n) => n.id === node.id);
      const sectorCenter = DOMAIN_SECTOR_CENTERS[node.domainId] ?? 0;
      const angleSpread = Math.PI / 2.6; // ~70 degree sector width
      const step = domainNodes.length > 1 ? angleSpread / (domainNodes.length - 1) : 0;
      const targetAngle = sectorCenter - angleSpread / 2 + indexInDomain * step;

      // Initial position placed near radial target with slight jitter
      const jitter = (Math.random() - 0.5) * 20;
      const x = CENTER_X + (targetRadius + jitter) * Math.cos(targetAngle);
      const y = CENTER_Y + (targetRadius + jitter) * Math.sin(targetAngle);

      return {
        id: node.id,
        topicId: node.topicId || node.id,
        label: node.label,
        domainId: node.domainId,
        category: node.category || "",
        level: node.level || "Intermediate",
        score: node.score ?? 50,
        difficulty: node.difficulty ?? 3,
        targetRadius,
        targetAngle,
        color: node.color || "#3b82f6",
        r: 22,
        x,
        y,
      };
    });

    // 2. Prepare simulation links
    const validNodeIdSet = new Set(initialNodes.map((n) => n.id));
    const initialLinks: RadialSimLink[] = GRAPH_EDGES
      .filter((e) => validNodeIdSet.has(e.source) && validNodeIdSet.has(e.target))
      .map((e) => ({
        id: e.id || `${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
        relationType: e.relationType || "PREREQUISITE",
      }));

    // 3. Create d3-force simulation
    const simulation = forceSimulation<RadialSimNode>(initialNodes)
      .force(
        "link",
        forceLink<RadialSimNode, RadialSimLink>(initialLinks)
          .id((d) => d.id)
          .distance((d) => (d.relationType === "PREREQUISITE" ? 110 : 80))
          .strength(0.12)
      )
      .force("charge", forceManyBody().strength(-180).distanceMax(350))
      .force(
        "collide",
        forceCollide<RadialSimNode>()
          .radius((d) => d.r + 26)
          .strength(0.85)
      )
      .force("center", forceCenter(CENTER_X, CENTER_Y));

    if (radialConstraintEnabled) {
      simulation.force(
        "radial",
        forceRadial<RadialSimNode>(
          (d) => d.targetRadius,
          CENTER_X,
          CENTER_Y
        ).strength(0.75)
      );
    }

    simulation.alpha(0.8).restart();

    // Listen to tick events to update React state
    simulation.on("tick", () => {
      setSimNodes([...initialNodes]);
      setSimLinks([...initialLinks]);
    });

    simRef.current = simulation;

    return () => {
      simulation.stop();
    };
  }, [radialConstraintEnabled]);

  // Restart / Jiggle simulation
  const handleReheatSimulation = () => {
    if (simRef.current) {
      simRef.current.alpha(0.6).restart();
    }
  };

  // Node Drag handlers (Touch & Mouse)
  const handleNodeMouseDown = (e: React.MouseEvent, node: RadialSimNode) => {
    e.stopPropagation();
    draggingNodeRef.current = node;
    node.fx = node.x;
    node.fy = node.y;

    if (simRef.current) {
      simRef.current.alphaTarget(0.25).restart();
    }
  };

  const handleSvgMouseMove = (e: React.MouseEvent) => {
    // 1. If dragging a node
    if (draggingNodeRef.current && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - panOffset.x) / zoomLevel;
      const mouseY = (e.clientY - rect.top - panOffset.y) / zoomLevel;
      draggingNodeRef.current.fx = mouseX;
      draggingNodeRef.current.fy = mouseY;
      return;
    }

    // 2. If panning the canvas
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
    }
  };

  const handleSvgMouseUp = () => {
    if (draggingNodeRef.current) {
      draggingNodeRef.current.fx = null;
      draggingNodeRef.current.fy = null;
      draggingNodeRef.current = null;
      if (simRef.current) {
        simRef.current.alphaTarget(0);
      }
    }
    setIsPanning(false);
  };

  const handleCanvasPanStart = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".interactive-node-group")) return;
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y,
    };
  };

  const resetCanvasView = () => {
    setZoomLevel(0.85);
    setPanOffset({ x: 0, y: 0 });
    handleReheatSimulation();
  };

  // Navigation handlers
  const handleStudyTopic = (topicId: string) => {
    selectTopic(topicId);
    navigate(`/study?topicId=${topicId}`);
  };

  const handleTeachTopic = (topicTitle: string) => {
    navigate(`/stage/new?topic=${encodeURIComponent(topicTitle)}`);
  };

  // Color helper functions
  const getDomainStyle = (domainId: string) => {
    switch (domainId) {
      case "math":
        return {
          hex: "#3b82f6",
          badge: "bg-blue-100 text-blue-700 border-blue-200",
          glow: "rgba(59, 130, 246, 0.4)",
          name: "Toán Cao Cấp",
        };
      case "discrete":
        return {
          hex: "#10b981",
          badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
          glow: "rgba(16, 185, 129, 0.4)",
          name: "Toán Rời Rạc",
        };
      case "cv":
        return {
          hex: "#8b5cf6",
          badge: "bg-purple-100 text-purple-700 border-purple-200",
          glow: "rgba(139, 92, 246, 0.4)",
          name: "Thị Giác Máy Tính",
        };
      case "cs":
        return {
          hex: "#f59e0b",
          badge: "bg-amber-100 text-amber-700 border-amber-200",
          glow: "rgba(245, 158, 11, 0.4)",
          name: "Hệ Thống CNTT",
        };
      default:
        return {
          hex: "#7286D3",
          badge: "bg-[#E5ECFB] text-[#5066A1] border-[#D3E0FA]",
          glow: "rgba(114, 134, 211, 0.4)",
          name: "Học Thuật",
        };
    }
  };

  const getScoreVerdict = (score: number) => {
    if (score >= 80) {
      return {
        label: "Đã Thấu Suốt",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        color: "#10b981",
        bar: "bg-emerald-500",
        icon: CheckCircle2,
      };
    }
    if (score >= 60) {
      return {
        label: "Đang Củng Cố",
        badge: "bg-amber-50 text-amber-700 border-amber-200",
        color: "#f59e0b",
        bar: "bg-amber-500",
        icon: Activity,
      };
    }
    return {
      label: "Lỗ Hổng Cần Vá",
      badge: "bg-rose-50 text-rose-700 border-rose-300 ring-1 ring-rose-400",
      color: "#f43f5e",
      bar: "bg-rose-500",
      icon: ShieldAlert,
    };
  };

  // Tiered nodes for Roadmap View
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Top Diagnostic Header & Radar Barometer */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5ECFB] text-[#5066A1] text-xs font-bold border border-[#D3E0FA] mb-1.5">
              <Orbit className="w-3.5 h-3.5 text-[#7286D3]" />
              <span>Biểu Đồ Tri Thức Mạng Lưới Tỏa Tròn (Interactive Radial Graph)</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">
              Bản Đồ Tri Thức Toán Học & Khoa Học Máy Tính
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
              Khám phá không gian tri thức đa chiều qua 3 vành đai quỹ đạo (Nền tảng $\rightarrow$ Cốt lõi $\rightarrow$ Chuyên sâu).
              Kéo thả các node vật lý, phát hiện lỗ hổng tri thức và định hình lộ trình giảng giải cho AI.
            </p>
          </div>

          {/* View Mode Switcher */}
          <div className="inline-flex items-center p-1 bg-white rounded-2xl border border-slate-200/80 shadow-xs self-start md:self-auto">
            <button
              onClick={() => setViewMode("RADIAL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "RADIAL"
                  ? "bg-[#7286D3] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Orbit className="w-3.5 h-3.5" />
              <span>Mạng Lưới Tỏa Tròn</span>
            </button>
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

        {/* 4 KPI Diagnostic Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
                <span className="text-[11px] font-semibold text-emerald-600">Hệ Thống Feynman</span>
              </div>
            </div>
          </div>

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
                Vành Đai Lỗ Hổng
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-rose-600">
                  {stats.gapsCount}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">Orbit 3 (&lt; 60%)</span>
              </div>
            </div>
          </div>

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
                Vành Đai Cốt Lõi
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-amber-600">
                  {stats.developingCount}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">Orbit 2 (60-79%)</span>
              </div>
            </div>
          </div>

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
                Vành Đai Nền Tảng
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-emerald-600">
                  {stats.masteredCount}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">Orbit 1 (≥ 80%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottleneck Recommendation */}
        {stats.criticalGap && (
          <div className="bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-white p-3.5 sm:p-4 rounded-2xl border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                    Khuyến nghị bù đắp lỗ hổng
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    Lỗ hổng nằm ở Vành đai 3:{" "}
                    <span className="text-amber-800 underline font-black">{stats.criticalGap.label}</span> (
                    {stats.criticalGap.score}% Thấu suốt)
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Chủ đề này đang là nút thắt làm chậm tiến độ làm chủ các mô hình phức hợp. Hãy thử giảng giải lại bằng các ẩn dụ trực quan.
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

      {/* 2. Filter & Interactive Control Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Domain Filter Tabs */}
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
              const colorInfo = getDomainStyle(domain.id);
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

        {/* Filter Badges & Radial Graph Physics Toggles */}
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

          {/* Physics Toggles when in Radial View */}
          {viewMode === "RADIAL" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRadialConstraintEnabled(!radialConstraintEnabled)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                  radialConstraintEnabled
                    ? "bg-[#EEF2FC] text-[#5066A1] border-[#D3E0FA]"
                    : "bg-slate-50 text-slate-600 border-slate-200"
                }`}
                title="Bật/tắt giữ các node bám theo 3 vành đai quỹ đạo"
              >
                <Radio className={`w-3 h-3 ${radialConstraintEnabled ? "text-[#7286D3]" : "text-slate-400"}`} />
                <span>{radialConstraintEnabled ? "Lực Quỹ Đạo: Bật" : "Lực Mạng Nhện Tự Do"}</span>
              </button>

              <button
                onClick={handleReheatSimulation}
                className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                title="Kích hoạt lại lực đẩy để sắp xếp lại các node"
              >
                <RefreshCw className="w-3 h-3 text-slate-500" />
                <span>Lắc Đồ Thị</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. MAIN CONTENT: Switch between View Modes */}

      {/* VIEW 1: INTERACTIVE RADIAL / FORCE-DIRECTED KNOWLEDGE GRAPH */}
      {viewMode === "RADIAL" && (
        <div className="relative w-full h-[760px] bg-gradient-to-br from-[#0c1222] via-[#0f172a] to-[#1e1b4b] rounded-3xl border border-slate-700/60 shadow-2xl overflow-hidden select-none">
          {/* Subtle Starfield / Grid Pattern Background */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, #94a3b8 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />

          {/* Canvas Floating Controls */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700 shadow-md">
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.8, z + 0.15))}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 cursor-pointer transition-colors"
              title="Phóng to"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-bold text-slate-300 px-1 min-w-[42px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.45, z - 0.15))}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 cursor-pointer transition-colors"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-700 mx-0.5" />
            <button
              onClick={resetCanvasView}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 cursor-pointer transition-colors"
              title="Căn giữa lại"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Top-Left Legend */}
          <div className="absolute top-4 left-4 z-20 bg-slate-900/85 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-slate-700/80 text-[11px] space-y-1.5 shadow-md">
            <div className="flex items-center gap-1.5 text-slate-200 font-black text-xs uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5 text-[#8EA7E9]" />
              <span>3 Vành Đai Quỹ Đạo Tri Thức</span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-2xs" />
                <span>Orbit 1: Nền Tảng (Foundation - ≥ 80%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block shadow-2xs" />
                <span>Orbit 2: Cốt Lõi (Core Concepts - 70%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-pulse shadow-2xs" />
                <span className="font-bold text-rose-300">Orbit 3: Vùng Lỗ Hổng (&lt; 60%)</span>
              </div>
            </div>
            <div className="pt-1 border-t border-slate-800 flex items-center gap-2 text-[10px] text-slate-400">
              <Move className="w-3 h-3 text-slate-400" />
              <span>Kéo thả node để co giãn đàn hồi</span>
            </div>
          </div>

          {/* Interactive SVG Canvas */}
          <svg
            ref={svgRef}
            onMouseDown={handleCanvasPanStart}
            onMouseMove={handleSvgMouseMove}
            onMouseUp={handleSvgMouseUp}
            onMouseLeave={handleSvgMouseUp}
            className={`w-full h-full cursor-grab ${isPanning ? "cursor-grabbing" : ""}`}
            viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
          >
            <defs>
              {/* Arrow markers */}
              <marker
                id="radial-arrow-prereq"
                viewBox="0 0 10 10"
                refX="24"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#818cf8" />
              </marker>
              <marker
                id="radial-arrow-active"
                viewBox="0 0 10 10"
                refX="24"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
              </marker>

              {/* Glowing filters */}
              <filter id="glow-rose" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-core" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Transform Layer for Pan & Zoom */}
            <g
              transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`}
              transformOrigin={`${CENTER_X} ${CENTER_Y}`}
              style={{ transition: isPanning || draggingNodeRef.current ? "none" : "transform 0.1s ease-out" }}
            >
              {/* 1. SECTOR RADIAL LINES (Dividing 4 academic domains) */}
              <g opacity={0.18}>
                {/* Diagonal sector lines */}
                <line
                  x1={CENTER_X - 520}
                  y1={CENTER_Y - 520}
                  x2={CENTER_X + 520}
                  y2={CENTER_Y + 520}
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  strokeDasharray="4 6"
                />
                <line
                  x1={CENTER_X - 520}
                  y1={CENTER_Y + 520}
                  x2={CENTER_X + 520}
                  y2={CENTER_Y - 520}
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  strokeDasharray="4 6"
                />
              </g>

              {/* 2. CONCENTRIC ORBIT RINGS */}
              <g className="orbit-rings-layer">
                {/* Orbit 3 (Outer - Advanced / Knowledge Gaps) */}
                <circle
                  cx={CENTER_X}
                  cy={CENTER_Y}
                  r={ORBIT_3_R}
                  fill="rgba(244, 63, 94, 0.02)"
                  stroke="#f43f5e"
                  strokeWidth="2"
                  strokeDasharray="8 8"
                  opacity={0.35}
                />
                <text
                  x={CENTER_X}
                  y={CENTER_Y - ORBIT_3_R - 8}
                  textAnchor="middle"
                  fill="#f43f5e"
                  fontSize="11"
                  fontWeight="bold"
                  opacity={0.7}
                  letterSpacing="1"
                >
                  ORBIT 3: CHUYÊN SÂU & VÙNG LỖ HỔNG (KNOWLEDGE GAPS)
                </text>

                {/* Orbit 2 (Middle - Core Concepts) */}
                <circle
                  cx={CENTER_X}
                  cy={CENTER_Y}
                  r={ORBIT_2_R}
                  fill="rgba(59, 130, 246, 0.02)"
                  stroke="#3b82f6"
                  strokeWidth="1.8"
                  strokeDasharray="6 6"
                  opacity={0.3}
                />
                <text
                  x={CENTER_X}
                  y={CENTER_Y - ORBIT_2_R - 8}
                  textAnchor="middle"
                  fill="#60a5fa"
                  fontSize="11"
                  fontWeight="bold"
                  opacity={0.65}
                  letterSpacing="1"
                >
                  ORBIT 2: CỐT LÕI & KỸ THUẬT (CORE CONCEPTS)
                </text>

                {/* Orbit 1 (Inner - Foundation) */}
                <circle
                  cx={CENTER_X}
                  cy={CENTER_Y}
                  r={ORBIT_1_R}
                  fill="rgba(16, 185, 129, 0.03)"
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  opacity={0.35}
                />
                <text
                  x={CENTER_X}
                  y={CENTER_Y - ORBIT_1_R - 8}
                  textAnchor="middle"
                  fill="#34d399"
                  fontSize="10"
                  fontWeight="bold"
                  opacity={0.7}
                  letterSpacing="1"
                >
                  ORBIT 1: NỀN TẢNG CƠ SỞ (FOUNDATION)
                </text>
              </g>

              {/* 3. FOUR DOMAIN QUADRANT LABELS */}
              <g className="quadrant-labels" opacity={0.75}>
                {/* Sector 1 (Right): Math */}
                <text
                  x={CENTER_X + 480}
                  y={CENTER_Y + 10}
                  textAnchor="start"
                  fill="#60a5fa"
                  fontSize="12"
                  fontWeight="900"
                  letterSpacing="1"
                >
                  📐 TOÁN CAO CẤP & ĐẠI SỐ
                </text>

                {/* Sector 2 (Bottom): Discrete */}
                <text
                  x={CENTER_X}
                  y={CENTER_Y + 500}
                  textAnchor="middle"
                  fill="#34d399"
                  fontSize="12"
                  fontWeight="900"
                  letterSpacing="1"
                >
                  🔀 TOÁN RỜI RẠC & ĐỒ THỊ
                </text>

                {/* Sector 3 (Left): CV */}
                <text
                  x={CENTER_X - 480}
                  y={CENTER_Y + 10}
                  textAnchor="end"
                  fill="#c084fc"
                  fontSize="12"
                  fontWeight="900"
                  letterSpacing="1"
                >
                  👁️ THỊ GIÁC MÁY TÍNH
                </text>

                {/* Sector 4 (Top): CS */}
                <text
                  x={CENTER_X}
                  y={CENTER_Y - 490}
                  textAnchor="middle"
                  fill="#fbbf24"
                  fontSize="12"
                  fontWeight="900"
                  letterSpacing="1"
                >
                  💻 KHOA HỌC MÁY TÍNH & HỆ THỐNG
                </text>
              </g>

              {/* 4. EDGES LAYER (Prerequisite & Sub-concept connections) */}
              <g className="edges-layer">
                {simLinks.map((link) => {
                  const source = link.source as RadialSimNode;
                  const target = link.target as RadialSimNode;
                  if (!source || !target || source.x == null || target.x == null) return null;

                  const isConnectedToHover =
                    hoveredNodeId != null &&
                    (source.id === hoveredNodeId || target.id === hoveredNodeId);

                  const isDimmed =
                    hoveredNodeId != null &&
                    !isConnectedToHover &&
                    connectedNodeIds != null &&
                    (!connectedNodeIds.has(source.id) || !connectedNodeIds.has(target.id));

                  const isPrereq = link.relationType === "PREREQUISITE";

                  // Curved Bezier calculation
                  const dx = (target.x ?? 0) - (source.x ?? 0);
                  const dy = (target.y ?? 0) - (source.y ?? 0);
                  const cx = (source.x ?? 0) + dx / 2;
                  const cy = (source.y ?? 0) + dy / 2 + (dx > 0 ? 15 : -15);

                  return (
                    <path
                      key={link.id}
                      d={`M ${source.x} ${source.y} Q ${cx} ${cy} ${target.x} ${target.y}`}
                      fill="none"
                      stroke={
                        isConnectedToHover
                          ? "#38bdf8"
                          : isPrereq
                          ? "#818cf8"
                          : "#f97316"
                      }
                      strokeWidth={isConnectedToHover ? 2.5 : isPrereq ? 1.6 : 1.2}
                      strokeDasharray={!isPrereq ? "4 3" : undefined}
                      opacity={isDimmed ? 0.08 : isConnectedToHover ? 0.95 : 0.38}
                      markerEnd={
                        isConnectedToHover
                          ? "url(#radial-arrow-active)"
                          : "url(#radial-arrow-prereq)"
                      }
                      style={{ transition: "stroke 0.2s, opacity 0.2s" }}
                    />
                  );
                })}
              </g>

              {/* 5. CENTER HUB: THEODORE CORE */}
              <g
                className="center-hub-group cursor-pointer"
                onClick={resetCanvasView}
              >
                <title>Theodore Core: Bấm để căn giữa lại</title>
                {/* Glowing Aura Rings */}
                <circle
                  cx={CENTER_X}
                  cy={CENTER_Y}
                  r="56"
                  fill="rgba(114, 134, 211, 0.12)"
                  stroke="#7286D3"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  opacity={0.6}
                  className="animate-spin"
                  style={{ animationDuration: "25s", transformOrigin: `${CENTER_X}px ${CENTER_Y}px` }}
                />
                <circle
                  cx={CENTER_X}
                  cy={CENTER_Y}
                  r="42"
                  fill="#1e1b4b"
                  stroke="#8EA7E9"
                  strokeWidth="2.5"
                  filter="url(#glow-core)"
                />

                {/* Mascot Owl Image */}
                <image
                  href="/images/theodore-logo.png"
                  x={CENTER_X - 28}
                  y={CENTER_Y - 28}
                  width="56"
                  height="56"
                  preserveAspectRatio="xMidYMid meet"
                />

                {/* Badge text below center */}
                <rect
                  x={CENTER_X - 52}
                  y={CENTER_Y + 44}
                  width="104"
                  height="20"
                  rx="10"
                  fill="#1e293b"
                  stroke="#7286D3"
                  strokeWidth="1"
                />
                <text
                  x={CENTER_X}
                  y={CENTER_Y + 58}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="9"
                  fontWeight="900"
                  letterSpacing="0.8"
                >
                  THEODORE CORE
                </text>
              </g>

              {/* 6. NODES LAYER (Nodes + Text Cards) */}
              <g className="nodes-layer">
                {simNodes.map((node) => {
                  const isHovered = hoveredNodeId === node.id;
                  const isSelected = activeNodeId === node.id;
                  const isDimmed =
                    hoveredNodeId != null &&
                    !isHovered &&
                    connectedNodeIds != null &&
                    !connectedNodeIds.has(node.id);

                  const isGap = node.score < 60;
                  const scoreInfo = getScoreVerdict(node.score);
                  const domainInfo = getDomainStyle(node.domainId);

                  const nx = node.x ?? CENTER_X;
                  const ny = node.y ?? CENTER_Y;

                  return (
                    <g
                      key={node.id}
                      className="interactive-node-group cursor-pointer"
                      transform={`translate(${nx}, ${ny})`}
                      opacity={isDimmed ? 0.2 : 1}
                      onMouseEnter={() => setHoveredNodeId(node.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                      onMouseDown={(e) => handleNodeMouseDown(e, node)}
                      onClick={() => setActiveNodeId(node.id)}
                      style={{ transition: "opacity 0.2s" }}
                    >
                      {/* Pulsing ring for Knowledge Gaps */}
                      {isGap && (
                        <circle
                          r="30"
                          fill="none"
                          stroke="#f43f5e"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                          opacity={0.8}
                          className="animate-spin"
                          style={{ animationDuration: "12s" }}
                        />
                      )}

                      {/* Selection / Hover Aura */}
                      {(isSelected || isHovered) && (
                        <circle
                          r="34"
                          fill="none"
                          stroke={isHovered ? "#38bdf8" : "#818cf8"}
                          strokeWidth="2.5"
                          opacity={0.8}
                        />
                      )}

                      {/* Main Node Circle */}
                      <circle
                        r={isHovered || isSelected ? 24 : 20}
                        fill={domainInfo.hex}
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        style={{
                          filter: isGap ? "drop-shadow(0 0 8px rgba(244,63,94,0.6))" : `drop-shadow(0 0 6px ${domainInfo.glow})`,
                          transition: "r 0.15s ease",
                        }}
                      />

                      {/* Score or Level inside circle */}
                      <text
                        textAnchor="middle"
                        dy="4.5"
                        fill="#ffffff"
                        fontSize={isHovered || isSelected ? "11" : "10"}
                        fontWeight="900"
                        pointerEvents="none"
                      >
                        {node.score}%
                      </text>

                      {/* Vietnamese Title Card Pill */}
                      <g
                        transform={`translate(0, ${isHovered || isSelected ? 34 : 28})`}
                        pointerEvents="none"
                      >
                        <rect
                          x="-80"
                          y="0"
                          width="160"
                          height="22"
                          rx="11"
                          fill={isSelected ? "#1e293b" : "rgba(15, 23, 42, 0.9)"}
                          stroke={isSelected ? "#38bdf8" : isHovered ? "#818cf8" : isGap ? "#f43f5e" : "#334155"}
                          strokeWidth={isSelected || isHovered ? 1.8 : 1}
                          style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}
                        />
                        <text
                          textAnchor="middle"
                          y="14"
                          fill="#f8fafc"
                          fontSize="9.5"
                          fontWeight="bold"
                        >
                          {node.label.length > 22 ? `${node.label.slice(0, 21)}…` : node.label}
                        </text>
                      </g>

                      {/* Knowledge Gap warning flag on hover */}
                      {isGap && (
                        <g transform="translate(14, -14)" pointerEvents="none">
                          <circle r="7" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
                          <text textAnchor="middle" dy="3" fill="#ffffff" fontSize="8" fontWeight="black">
                            !
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            </g>
          </svg>
        </div>
      )}

      {/* VIEW 2: TIERED ROADMAP TREE */}
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
                    <p className="text-[10px] text-slate-500">Orbit 1 • Định lý & Tiên quyết</p>
                  </div>
                </div>
                <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {tieredNodes.beginner.length} chủ đề
                </span>
              </div>

              <div className="space-y-3">
                {tieredNodes.beginner.map((node) => {
                  const isSelected = activeNodeId === node.id;
                  const domainInfo = getDomainStyle(node.domainId);
                  const scoreInfo = getScoreVerdict(node.score ?? 50);

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
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${domainInfo.badge}`}>
                          {domainInfo.name}
                        </span>
                        <div className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${scoreInfo.badge}`}>
                          <span>{node.score}%</span>
                        </div>
                      </div>

                      <h4 className="text-xs font-black text-slate-800 leading-snug">
                        {node.label}
                      </h4>

                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${scoreInfo.bar}`}
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
                    <p className="text-[10px] text-slate-500">Orbit 2 • Tối ưu hóa & Kỹ thuật</p>
                  </div>
                </div>
                <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  {tieredNodes.intermediate.length} chủ đề
                </span>
              </div>

              <div className="space-y-3">
                {tieredNodes.intermediate.map((node) => {
                  const isSelected = activeNodeId === node.id;
                  const domainInfo = getDomainStyle(node.domainId);
                  const scoreInfo = getScoreVerdict(node.score ?? 50);

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
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${domainInfo.badge}`}>
                          {domainInfo.name}
                        </span>
                        <div className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${scoreInfo.badge}`}>
                          <span>{node.score}%</span>
                        </div>
                      </div>

                      <h4 className="text-xs font-black text-slate-800 leading-snug">
                        {node.label}
                      </h4>

                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${scoreInfo.bar}`}
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

            {/* Tầng 3: Chuyên sâu & Vùng Lỗ Hổng (Advanced / Gaps) */}
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
                        Orbit 3 • Vùng Lỗ Hổng
                      </span>
                    </h3>
                    <p className="text-[10px] text-rose-700/80">Hệ thống phân tán & Mô hình phức hợp</p>
                  </div>
                </div>
                <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-white text-rose-700 border border-rose-200 shadow-2xs">
                  {tieredNodes.advanced.length} chủ đề
                </span>
              </div>

              <div className="space-y-3">
                {tieredNodes.advanced.map((node) => {
                  const isSelected = activeNodeId === node.id;
                  const domainInfo = getDomainStyle(node.domainId);
                  const scoreInfo = getScoreVerdict(node.score ?? 50);
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
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${domainInfo.badge}`}>
                          {domainInfo.name}
                        </span>
                        <div className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${scoreInfo.badge}`}>
                          <ShieldAlert className="w-2.5 h-2.5 text-rose-500" />
                          <span>{node.score}% Thấu suốt</span>
                        </div>
                      </div>

                      <h4 className="text-xs font-black text-slate-800 leading-snug">
                        {node.label}
                      </h4>

                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${scoreInfo.bar}`}
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

      {/* VIEW 3: GAP DIAGNOSTICS MATRIX */}
      {viewMode === "GAP_MATRIX" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-6 bg-gradient-to-r from-rose-50/50 via-white to-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <h3 className="text-base font-black text-slate-800">
                  Bảng Chẩn Đoán Lỗ Hổng Tri Thức (Orbit 3 Gaps)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Các chủ đề nằm tại Vành đai 3 có điểm thấu suốt &lt; 60% và học viên thường vướng vào bẫy ngộ nhận (Jargon Trap).
              </p>
            </div>

            <div className="text-xs font-bold px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 border border-rose-200 self-start sm:self-auto">
              Phát hiện {stats.gapsCount} lỗ hổng trọng tâm
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {GRAPH_NODES.filter((n) => (n.score ?? 0) < 60).map((node) => {
              const topic = topicMap.get(node.topicId || node.id);
              const domainInfo = getDomainStyle(node.domainId);
              const primaryTrap = topic?.jargonTraps?.[0];

              return (
                <div
                  key={node.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${domainInfo.badge}`}>
                        {domainInfo.name}
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

      {/* 4. Topic Detail & Gap Resolution Drawer */}
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
                    getScoreVerdict(activeNode.score ?? 50).badge
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
            <div className="md:col-span-2 space-y-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Định nghĩa chuẩn (Ground Truth)
                </span>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  "{activeTopic.summary}"
                </p>
              </div>

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
                      className={`h-full rounded-full ${getScoreVerdict(activeNode.score ?? 50).bar}`}
                      style={{ width: `${activeNode.score}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 pt-1 leading-snug">
                    {(activeNode.score ?? 0) < 60
                      ? "⚠️ Khái niệm này đang là lỗ hổng tri thức tại Orbit 3. Hãy giảng lại bằng từ ngữ đời thường để nâng điểm thấu suốt."
                      : (activeNode.score ?? 0) < 80
                      ? "🟡 Đang củng cố tại Orbit 2. Cần thêm các ví dụ thực tiễn để đạt cấp độ hoàn toàn thấu suốt."
                      : "🟢 Bạn đã làm chủ khái niệm này tại Orbit 1. Sẵn sàng liên kết sang các chủ đề nâng cao."}
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
