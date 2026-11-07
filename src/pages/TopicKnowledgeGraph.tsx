/**
 * File: src/pages/TopicKnowledgeGraph.tsx
 * Mục đích: [Trang 8] Bản Đồ Tri Thức Phân Cấp Dạng Radial (5 Cấp Nhận Thức)
 * 
 * Cấu trúc 5 cấp theo quỹ đạo tỏa tròn:
 * - Trung tâm (Level 0): Core Node "KHÔNG GIAN FEYNMAN"
 * - Cấp 1 (Orbit 1): Nhóm Ngành (Domain Nodes: Toán cao cấp, Toán rời rạc, Thị giác máy tính, Hệ thống)
 * - Cấp 2 (Orbit 2): Ngành Chuyên Môn (Field Nodes: ĐSTT, GTTN, TƯH, ĐTH, LOGIC, TỔ HỢP, CNN, XỬ LÝ, YOLO, HĐH, CSDL, PHÂN TÁN)
 * - Cấp 3 (Orbit 3): Môn Học (Subject Nodes: Thẻ bài bo góc, màu trạng thái Xanh lá/Vàng/Đỏ cam/Xám)
 * - Cấp 4 (Orbit 4): Nhóm Kiến Thức (Topic Group Nodes: Chữ cái viết tắt, thang độ xám)
 * - Cấp 5 (Orbit 5): Kiến Thức Nhỏ (Micro-concept Nodes: Chấm tròn mạng lưới, Trắng/Đỏ sáng/Xám tối)
 * 
 * Tương tác:
 * - Auto-pan camera khi click node (centerAt & zoom)
 * - Bảng Báo Cáo Nhanh góc trên bên phải (142/500, Clarity 88%, 🔥 14 ngày)
 * - Hộp chú thích Legend góc dưới bên trái
 * - Drawer chi tiết khi click đúp hoặc click node
 */

import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import {
  Sparkles,
  Flame,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Activity,
  Layers,
  Compass,
} from "lucide-react";

import { TOPICS_CATALOG, DOMAINS_CATALOG } from "@/data/academic-catalog.data";
import { GRAPH_EDGES } from "@/data/knowledge-graph.data";
import { useStudyStore } from "@/hooks/useStudyStore";

// Node Interface for 5-tier graph
export interface RadialGraphNode {
  id: string;
  level: number; // 0: Core, 1: Domain, 2: Field, 3: Subject, 4: Group, 5: Concept
  name: string;
  shortLabel?: string;
  domainId?: string;
  fieldId?: string;
  subjectId?: string;
  color?: string;
  status?: "MASTERED" | "ACTIVE" | "GAP" | "UNLEARNED";
  clarityScore?: number;
  r?: number;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
  targetRadius?: number;
  targetAngle?: number;
  summary?: string;
  requiredConcepts?: string[];
  jargonTraps?: Array<{ term: string; explanation?: string; recommendedAnalogy?: string }>;
}

export interface RadialGraphLink {
  id: string;
  source: string | RadialGraphNode;
  target: string | RadialGraphNode;
  isHierarchy?: boolean;
  isPrereq?: boolean;
  isCrossLink?: boolean;
}

// Orbit Radii
const ORBIT_1_R = 140; // Domain
const ORBIT_2_R = 270; // Field
const ORBIT_3_R = 420; // Subject
const ORBIT_4_R = 570; // Topic Group
const ORBIT_5_R = 720; // Micro-concept

// Domain Colors & Angle Centers
const DOMAIN_CONFIG: Record<string, { color: string; lightColor: string; angle: number; name: string; symbol: string }> = {
  math: {
    color: "#3b82f6", // Blue
    lightColor: "#60a5fa",
    angle: 0,
    name: "Toán Cao Cấp & Đại Số",
    symbol: "∑",
  },
  discrete: {
    color: "#10b981", // Emerald
    lightColor: "#34d399",
    angle: Math.PI / 2,
    name: "Toán Rời Rạc & Đồ Thị",
    symbol: "⑂",
  },
  cv: {
    color: "#8b5cf6", // Purple
    lightColor: "#a78bfa",
    angle: Math.PI,
    name: "Thị Giác Máy Tính",
    symbol: "👁",
  },
  cs: {
    color: "#f59e0b", // Amber
    lightColor: "#fbbf24",
    angle: (3 * Math.PI) / 2,
    name: "Khoa Học Máy Tính & Hệ Thống",
    symbol: "💻",
  },
};

export const TopicKnowledgeGraph: React.FC = () => {
  const navigate = useNavigate();
  const { selectTopic } = useStudyStore();
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);

  // Active / Selected Node State
  const [selectedNode, setSelectedNode] = useState<RadialGraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<RadialGraphNode | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Responsive dimensions
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: typeof window !== "undefined" ? window.innerWidth - 256 : 1200,
    height: typeof window !== "undefined" ? window.innerHeight - 80 : 800,
  });

  useEffect(() => {
    const handleResize = () => {
      const sidebar = document.querySelector("aside");
      const sidebarWidth = sidebar ? sidebar.getBoundingClientRect().width : 256;
      setDimensions({
        width: Math.max(800, window.innerWidth - sidebarWidth),
        height: Math.max(600, window.innerHeight - 80),
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Build the Complete 5-Tier Hierarchical Dataset
  const graphData = useMemo(() => {
    const nodes: RadialGraphNode[] = [];
    const links: RadialGraphLink[] = [];

    // 0. Level 0: Core Node
    nodes.push({
      id: "core-feynman",
      level: 0,
      name: "KHÔNG GIAN FEYNMAN",
      shortLabel: "FEYNMAN CORE",
      color: "#1e1b4b",
      r: 36,
      x: 0,
      y: 0,
      fx: 0,
      fy: 0,
      targetRadius: 0,
      targetAngle: 0,
    });

    // 1. Level 1: 4 Domain Nodes
    const domainKeys = ["math", "discrete", "cv", "cs"];
    domainKeys.forEach((dKey) => {
      const cfg = DOMAIN_CONFIG[dKey];
      const x = ORBIT_1_R * Math.cos(cfg.angle);
      const y = ORBIT_1_R * Math.sin(cfg.angle);

      const dNode: RadialGraphNode = {
        id: `domain-${dKey}`,
        level: 1,
        domainId: dKey,
        name: cfg.name,
        shortLabel: cfg.symbol,
        color: cfg.color,
        r: 22,
        x,
        y,
        fx: x,
        fy: y,
        targetRadius: ORBIT_1_R,
        targetAngle: cfg.angle,
      };

      nodes.push(dNode);
      links.push({
        id: `link-core-${dNode.id}`,
        source: "core-feynman",
        target: dNode.id,
        isHierarchy: true,
      });
    });

    // 2. Level 2: Field Nodes (12 fields, 3 per domain)
    const fieldDefinitions: Array<{ id: string; domainId: string; name: string; shortLabel: string; offsetAngle: number }> = [
      // Math
      { id: "field-algebra", domainId: "math", name: "Đại Số Tuyến Tính", shortLabel: "ĐSTT", offsetAngle: -0.28 },
      { id: "field-calculus", domainId: "math", name: "Giải Tích Nhiều Biến", shortLabel: "GT", offsetAngle: 0 },
      { id: "field-optimization", domainId: "math", name: "Tối Ưu Hóa Vi Phân", shortLabel: "TƯH", offsetAngle: 0.28 },
      // Discrete
      { id: "field-graph-theory", domainId: "discrete", name: "Lý Thuyết Đồ Thị", shortLabel: "ĐTH", offsetAngle: -0.28 },
      { id: "field-logic", domainId: "discrete", name: "Logic & Boole", shortLabel: "LOGIC", offsetAngle: 0 },
      { id: "field-combinatorics", domainId: "discrete", name: "Tổ Hợp & Nhị Thức", shortLabel: "TỔ HỢP", offsetAngle: 0.28 },
      // CV
      { id: "field-neural-nets", domainId: "cv", name: "Mạng Tích Chập CNN", shortLabel: "CNN", offsetAngle: -0.28 },
      { id: "field-image-proc", domainId: "cv", name: "Xử Lý & Lọc Biên", shortLabel: "LỌC", offsetAngle: 0 },
      { id: "field-detection", domainId: "cv", name: "Nhận Diện & Detection", shortLabel: "YOLO", offsetAngle: 0.28 },
      // CS
      { id: "field-os", domainId: "cs", name: "Hệ Điều Hành & Con Trỏ", shortLabel: "HĐH", offsetAngle: -0.28 },
      { id: "field-db", domainId: "cs", name: "Cơ Sở Dữ Liệu B-Tree", shortLabel: "CSDL", offsetAngle: 0 },
      { id: "field-dist-sys", domainId: "cs", name: "Hệ Thống Phân Tán", shortLabel: "PHÂN TÁN", offsetAngle: 0.28 },
    ];

    fieldDefinitions.forEach((f) => {
      const domainCfg = DOMAIN_CONFIG[f.domainId];
      const angle = domainCfg.angle + f.offsetAngle;
      const x = ORBIT_2_R * Math.cos(angle);
      const y = ORBIT_2_R * Math.sin(angle);

      const fNode: RadialGraphNode = {
        id: f.id,
        level: 2,
        domainId: f.domainId,
        name: f.name,
        shortLabel: f.shortLabel,
        color: domainCfg.lightColor,
        r: 15,
        x,
        y,
        fx: x,
        fy: y,
        targetRadius: ORBIT_2_R,
        targetAngle: angle,
      };

      nodes.push(fNode);
      links.push({
        id: `link-domain-${f.domainId}-${f.id}`,
        source: `domain-${f.domainId}`,
        target: f.id,
        isHierarchy: true,
      });
    });

    // Helper to map subject to field
    const assignSubjectToField = (topicId: string, domainId: string): string => {
      if (domainId === "math") {
        if (topicId.includes("gradient") || topicId.includes("hessian") || topicId.includes("taylor")) return "field-optimization";
        if (topicId.includes("linear") || topicId.includes("eigenvalues") || topicId.includes("svd") || topicId.includes("gauss") || topicId.includes("gram")) return "field-algebra";
        return "field-calculus";
      }
      if (domainId === "discrete") {
        if (topicId.includes("logic") || topicId.includes("induction") || topicId.includes("equivalence")) return "field-logic";
        if (topicId.includes("pigeonhole") || topicId.includes("combinatorics")) return "field-combinatorics";
        return "field-graph-theory";
      }
      if (domainId === "cv") {
        if (topicId.includes("yolo") || topicId.includes("sift") || topicId.includes("transformer")) return "field-detection";
        if (topicId.includes("canny") || topicId.includes("color") || topicId.includes("hough") || topicId.includes("optical")) return "field-image-proc";
        return "field-neural-nets";
      }
      if (domainId === "cs") {
        if (topicId.includes("btree") || topicId.includes("hash")) return "field-db";
        if (topicId.includes("cap") || topicId.includes("queues") || topicId.includes("tcp")) return "field-dist-sys";
        return "field-os";
      }
      return "field-os";
    };

    // 3. Level 3: 40 Subject Nodes from TOPICS_CATALOG
    const subjectsByField: Record<string, typeof TOPICS_CATALOG> = {};
    TOPICS_CATALOG.forEach((t) => {
      const fId = assignSubjectToField(t.id, t.domainId);
      subjectsByField[fId] = subjectsByField[fId] || [];
      subjectsByField[fId].push(t);
    });

    const groupLetters = ["A", "B", "C", "D", "E", "F", "G", "H", "K", "L", "M", "N", "P", "Q", "R", "S", "T", "V"];

    fieldDefinitions.forEach((f) => {
      const fieldSubjects = subjectsByField[f.id] || [];
      const fieldNode = nodes.find((n) => n.id === f.id);
      const baseAngle = fieldNode?.targetAngle ?? 0;
      const count = fieldSubjects.length;
      const spread = 0.22; // Sector spread

      fieldSubjects.forEach((sub, sIdx) => {
        const angleOffset = count > 1 ? -spread / 2 + (sIdx / (count - 1)) * spread : 0;
        const angle = baseAngle + angleOffset;
        const x = ORBIT_3_R * Math.cos(angle);
        const y = ORBIT_3_R * Math.sin(angle);

        // Derive learning status from subject clarity
        const score = sub.difficultyLevel >= 4 ? 50 : sub.difficultyLevel === 3 ? 70 : 85;
        let status: RadialGraphNode["status"] = "UNLEARNED";
        if (score >= 80) status = "MASTERED";
        else if (score >= 60) status = "ACTIVE";
        else status = "GAP";

        const subNode: RadialGraphNode = {
          id: `subject-${sub.id}`,
          level: 3,
          domainId: sub.domainId,
          fieldId: f.id,
          subjectId: sub.id,
          name: sub.title,
          shortLabel: sub.title.length > 18 ? `${sub.title.slice(0, 17)}…` : sub.title,
          status,
          clarityScore: score,
          width: 82,
          height: 24,
          r: 12,
          x,
          y,
          fx: x,
          fy: y,
          targetRadius: ORBIT_3_R,
          targetAngle: angle,
          summary: sub.summary,
          requiredConcepts: sub.requiredConcepts,
          jargonTraps: sub.jargonTraps,
        };

        nodes.push(subNode);
        links.push({
          id: `link-field-${f.id}-${subNode.id}`,
          source: f.id,
          target: subNode.id,
          isHierarchy: true,
        });

        // 4. Level 4: Topic Group Nodes (1 to 2 per subject)
        const numGroups = 2;
        for (let gIdx = 0; gIdx < numGroups; gIdx++) {
          const gAngle = angle + (gIdx === 0 ? -0.04 : 0.04);
          const gx = ORBIT_4_R * Math.cos(gAngle);
          const gy = ORBIT_4_R * Math.sin(gAngle);
          const gLetter = groupLetters[(sIdx * 2 + gIdx) % groupLetters.length];

          const gNode: RadialGraphNode = {
            id: `group-${sub.id}-${gIdx}`,
            level: 4,
            domainId: sub.domainId,
            fieldId: f.id,
            subjectId: sub.id,
            name: `${sub.title} - Module ${gLetter}`,
            shortLabel: gLetter,
            color: gIdx % 2 === 0 ? "#cbd5e1" : "#64748b",
            r: 9,
            x: gx,
            y: gy,
            fx: gx,
            fy: gy,
            targetRadius: ORBIT_4_R,
            targetAngle: gAngle,
          };

          nodes.push(gNode);
          links.push({
            id: `link-sub-${subNode.id}-${gNode.id}`,
            source: subNode.id,
            target: gNode.id,
            isHierarchy: true,
          });

          // 5. Level 5: Micro-concept Nodes (2 per topic group = ~160 micro-concepts)
          const numConcepts = 2;
          for (let cIdx = 0; cIdx < numConcepts; cIdx++) {
            const cAngle = gAngle + (cIdx === 0 ? -0.022 : 0.022);
            const cx = ORBIT_5_R * Math.cos(cAngle);
            const cy = ORBIT_5_R * Math.sin(cAngle);

            // Determine micro-concept status:
            // If parent subject has GAP (red), make micro-concept RED (lỗ hổng);
            // else alternate between MASTERED (white) and UNLEARNED (dark gray).
            let cStatus: RadialGraphNode["status"] = "UNLEARNED";
            if (status === "GAP") {
              cStatus = cIdx === 0 ? "GAP" : "UNLEARNED";
            } else if (status === "MASTERED") {
              cStatus = "MASTERED";
            } else {
              cStatus = cIdx === 0 ? "MASTERED" : "UNLEARNED";
            }

            const cName = sub.requiredConcepts?.[cIdx] || `${sub.title} - Định lý con #${cIdx + 1}`;

            const cNode: RadialGraphNode = {
              id: `concept-${sub.id}-${gIdx}-${cIdx}`,
              level: 5,
              domainId: sub.domainId,
              fieldId: f.id,
              subjectId: sub.id,
              name: cName,
              shortLabel: "•",
              status: cStatus,
              clarityScore: cStatus === "MASTERED" ? 90 : cStatus === "GAP" ? 45 : 0,
              r: 5,
              x: cx,
              y: cy,
              fx: cx,
              fy: cy,
              targetRadius: ORBIT_5_R,
              targetAngle: cAngle,
              summary: sub.summary,
            };

            nodes.push(cNode);
            links.push({
              id: `link-grp-${gNode.id}-${cNode.id}`,
              source: gNode.id,
              target: cNode.id,
              isHierarchy: true,
            });
          }
        }
      });
    });

    // 6. Cross-Links: Direct prerequisite connections from GRAPH_EDGES
    GRAPH_EDGES.forEach((edge, idx) => {
      const srcId = `subject-${edge.source}`;
      const tgtId = `subject-${edge.target}`;
      const srcNode = nodes.find((n) => n.id === srcId);
      const tgtNode = nodes.find((n) => n.id === tgtId);

      if (srcNode && tgtNode) {
        links.push({
          id: `cross-edge-${idx}`,
          source: srcId,
          target: tgtId,
          isPrereq: true,
          isCrossLink: true,
        });
      }
    });

    return { nodes, links };
  }, []);

  // Center camera to specific node
  const focusOnNode = useCallback((node: RadialGraphNode) => {
    if (fgRef.current && node.x != null && node.y != null) {
      fgRef.current.centerAt(node.x, node.y, 800);
      const targetZoom = node.level >= 3 ? 1.6 : 1.1;
      fgRef.current.zoom(targetZoom, 800);
    }
  }, []);

  // Node Click handler
  const handleNodeClick = useCallback(
    (node: RadialGraphNode) => {
      setSelectedNode(node);
      focusOnNode(node);
      if (node.level >= 3) {
        setIsDrawerOpen(true);
      }
    },
    [focusOnNode]
  );

  // Background Click handler (Deselect)
  const handleBackgroundClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Reset Camera View
  const handleResetCamera = useCallback(() => {
    if (fgRef.current) {
      fgRef.current.centerAt(0, 0, 800);
      fgRef.current.zoom(0.68, 800);
    }
  }, []);

  // Zoom controls
  const handleZoomIn = () => {
    if (fgRef.current) {
      const curZoom = fgRef.current.zoom();
      fgRef.current.zoom(curZoom * 1.3, 400);
    }
  };

  const handleZoomOut = () => {
    if (fgRef.current) {
      const curZoom = fgRef.current.zoom();
      fgRef.current.zoom(curZoom / 1.3, 400);
    }
  };

  // Launch Feynman Stage
  const handleTeachTopic = (topicName: string) => {
    navigate(`/stage/new?topic=${encodeURIComponent(topicName)}`);
  };

  const handleStudyTopic = (topicId?: string) => {
    if (topicId) {
      selectTopic(topicId);
      navigate(`/study?topicId=${topicId}`);
    }
  };

  // Pre-frame Render: Draw 5 Concentric Slate-700 Orbits on Canvas
  const handleRenderFramePre = useCallback((ctx: CanvasRenderingContext2D, globalScale: number) => {
    ctx.save();
    const orbits = [
      { r: ORBIT_1_R, label: "ORBIT 1 • NHÓM NGÀNH", color: "rgba(51, 65, 85, 0.7)" },
      { r: ORBIT_2_R, label: "ORBIT 2 • NGÀNH CHUYÊN MÔN", color: "rgba(51, 65, 85, 0.6)" },
      { r: ORBIT_3_R, label: "ORBIT 3 • MÔN HỌC", color: "rgba(51, 65, 85, 0.6)" },
      { r: ORBIT_4_R, label: "ORBIT 4 • NHÓM KIẾN THỨC", color: "rgba(51, 65, 85, 0.45)" },
      { r: ORBIT_5_R, label: "ORBIT 5 • VI KHÁI NIỆM", color: "rgba(51, 65, 85, 0.45)" },
    ];

    orbits.forEach((orbit) => {
      ctx.beginPath();
      ctx.arc(0, 0, orbit.r, 0, 2 * Math.PI);
      ctx.strokeStyle = orbit.color;
      ctx.lineWidth = 1.2 / globalScale;
      ctx.setLineDash([6 / globalScale, 6 / globalScale]);
      ctx.stroke();
    });

    ctx.restore();
  }, []);

  // Custom Node Canvas Renderer
  const renderNodeCanvasObject = useCallback(
    (node: RadialGraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const isSelected = selectedNode?.id === node.id;
      const isHovered = hoveredNode?.id === node.id;
      const x = node.x ?? 0;
      const y = node.y ?? 0;

      ctx.save();

      // ==========================================
      // LEVEL 0: CORE NODE (KHÔNG GIAN FEYNMAN)
      // ==========================================
      if (node.level === 0) {
        const r = node.r ?? 36;
        // Outer pulsing glow
        ctx.beginPath();
        ctx.arc(x, y, r + 6, 0, 2 * Math.PI);
        ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
        ctx.lineWidth = 3 / globalScale;
        ctx.stroke();

        // Main core circle
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = "#1e1b4b";
        ctx.fill();
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2.5 / globalScale;
        ctx.stroke();

        // Core Text
        ctx.font = `bold ${8.5 / globalScale}px sans-serif`;
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("KHÔNG GIAN", x, y - 5 / globalScale);
        ctx.fillText("FEYNMAN", x, y + 6 / globalScale);
        ctx.restore();
        return;
      }

      // ==========================================
      // LEVEL 1: DOMAIN NODES (Nhóm Ngành)
      // ==========================================
      if (node.level === 1) {
        const r = isHovered || isSelected ? 26 : (node.r ?? 22);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = node.color || "#3b82f6";
        ctx.fill();
        ctx.strokeStyle = isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.85)";
        ctx.lineWidth = (isSelected ? 3 : 2) / globalScale;
        ctx.stroke();

        // Icon glyph
        ctx.font = `bold ${13 / globalScale}px sans-serif`;
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.shortLabel || "D", x, y);

        // Tooltip text below domain node
        ctx.font = `bold ${9 / globalScale}px sans-serif`;
        ctx.fillStyle = "#e2e8f0";
        ctx.fillText(node.name, x, y + r + 12 / globalScale);
        ctx.restore();
        return;
      }

      // ==========================================
      // LEVEL 2: FIELD NODES (Ngành)
      // ==========================================
      if (node.level === 2) {
        const r = isHovered || isSelected ? 18 : (node.r ?? 15);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = node.color || "#60a5fa";
        ctx.fill();
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 1.8 / globalScale;
        ctx.stroke();

        // Abbreviation inside circle (VD: "ĐSTT", "CNN")
        ctx.font = `900 ${7.5 / globalScale}px sans-serif`;
        ctx.fillStyle = "#0f172a";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.shortLabel || "", x, y);
        ctx.restore();
        return;
      }

      // ==========================================
      // LEVEL 3: SUBJECT NODES (Môn Học - Thẻ Bo Góc)
      // ==========================================
      if (node.level === 3) {
        const w = (node.width ?? 80) / globalScale;
        const h = (node.height ?? 24) / globalScale;
        const radius = 6 / globalScale;

        // Map status to color
        let statusFill = "#94a3b8"; // Xám nhạt (Chưa học)
        let strokeColor = "#cbd5e1";
        let textColor = "#0f172a";

        if (node.status === "MASTERED") {
          statusFill = "#22c55e"; // Xanh lá
          strokeColor = "#86efac";
          textColor = "#ffffff";
        } else if (node.status === "ACTIVE") {
          statusFill = "#eab308"; // Vàng
          strokeColor = "#fde047";
          textColor = "#0f172a";
        } else if (node.status === "GAP") {
          statusFill = "#ef4444"; // Đỏ cam
          strokeColor = "#fca5a5";
          textColor = "#ffffff";
        }

        // Rounded rectangle draw
        ctx.beginPath();
        ctx.roundRect(x - w / 2, y - h / 2, w, h, radius);
        ctx.fillStyle = statusFill;
        ctx.fill();
        ctx.strokeStyle = isSelected ? "#38bdf8" : strokeColor;
        ctx.lineWidth = (isSelected ? 2.5 : 1) / globalScale;
        ctx.stroke();

        // Label text inside card
        ctx.font = `bold ${7.5 / globalScale}px sans-serif`;
        ctx.fillStyle = textColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.shortLabel || node.name, x, y);
        ctx.restore();
        return;
      }

      // ==========================================
      // LEVEL 4: TOPIC GROUP NODES (Nhóm Kiến Thức)
      // ==========================================
      if (node.level === 4) {
        const r = node.r ?? 9;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = node.color || "#64748b"; // Grayscale
        ctx.fill();
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 1 / globalScale;
        ctx.stroke();

        // Single letter inside
        ctx.font = `bold ${8 / globalScale}px sans-serif`;
        ctx.fillStyle = "#0f172a";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.shortLabel || "•", x, y);
        ctx.restore();
        return;
      }

      // ==========================================
      // LEVEL 5: MICRO-CONCEPT NODES (Chấm Tròn Mạng Lưới)
      // ==========================================
      if (node.level === 5) {
        const r = isHovered || isSelected ? 8 : (node.r ?? 5);

        let dotColor = "#334155"; // Xám tối (Chưa học)
        if (node.status === "MASTERED") {
          dotColor = "#f8fafc"; // Trắng sáng (Đã thông thạo)
        } else if (node.status === "GAP") {
          dotColor = "#f43f5e"; // Đỏ sáng (Cần ôn lại)
        }

        // Glowing outer pulse for GAP micro-concepts
        if (node.status === "GAP") {
          ctx.beginPath();
          ctx.arc(x, y, r + 4, 0, 2 * Math.PI);
          ctx.strokeStyle = "rgba(244, 63, 94, 0.45)";
          ctx.lineWidth = 1.5 / globalScale;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = dotColor;
        ctx.fill();
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 0.8 / globalScale;
        ctx.stroke();
        ctx.restore();
        return;
      }

      ctx.restore();
    },
    [selectedNode, hoveredNode]
  );

  // Link Canvas Renderer: Delicate subtle thread lines & highlighted prerequisites
  const renderLinkCanvasObject = useCallback(
    (link: RadialGraphLink, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const source = link.source as RadialGraphNode;
      const target = link.target as RadialGraphNode;
      if (
        !source ||
        !target ||
        source.x == null ||
        source.y == null ||
        target.x == null ||
        target.y == null
      )
        return;

      const isConnectedToSelected =
        selectedNode != null &&
        (source.id === selectedNode.id || target.id === selectedNode.id);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);

      if (isConnectedToSelected) {
        ctx.strokeStyle = "#38bdf8"; // Cyan highlight
        ctx.lineWidth = 2 / globalScale;
      } else if (link.isPrereq) {
        ctx.strokeStyle = "rgba(129, 140, 248, 0.4)"; // Indigo for prereq
        ctx.lineWidth = 1.2 / globalScale;
      } else {
        ctx.strokeStyle = "rgba(148, 163, 184, 0.12)"; // Delicate thread
        ctx.lineWidth = 0.8 / globalScale;
      }

      ctx.stroke();
      ctx.restore();
    },
    [selectedNode]
  );

  return (
    <div className="relative w-full h-[calc(100vh-100px)] min-h-[640px] bg-[#0f172a] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden select-none">
      {/* 1. Main Interactive ForceGraph2D Canvas */}
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        backgroundColor="#0f172a"
        nodeId="id"
        nodeCanvasObject={renderNodeCanvasObject as any}
        linkCanvasObject={renderLinkCanvasObject as any}
        onRenderFramePre={handleRenderFramePre}
        onNodeClick={handleNodeClick as any}
        onNodeHover={(node) => setHoveredNode((node as RadialGraphNode) || null)}
        onBackgroundClick={handleBackgroundClick}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        cooldownTicks={1} // Positioned cleanly at targets
      />

      {/* 2. Top Right Panel: Quick Metrics & Camera Tools */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2.5">
        {/* Metric Summary Card */}
        <div className="bg-slate-900/85 backdrop-blur-md p-4 rounded-2xl border border-slate-700/80 shadow-xl space-y-3 min-w-[240px]">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Tiến Độ Tri Thức
            </span>
            <div className="flex items-center gap-1 text-xs font-black text-amber-400">
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              <span>14 Ngày</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-400">Khái niệm đã học:</span>
              <span className="text-white font-black">142 / 500</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full"
                style={{ width: "28.4%" }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-bold pt-1">
            <span className="text-slate-400">Điểm Clarity TB:</span>
            <span className="text-emerald-400 font-black text-sm">88%</span>
          </div>
        </div>

        {/* Camera Navigation Controls */}
        <div className="flex items-center justify-end gap-1.5 bg-slate-900/85 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/80 shadow-md self-end">
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
            title="Phóng to"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
            title="Thu nhỏ"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-700" />
          <button
            onClick={handleResetCamera}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
            title="Căn giữa lại toàn bộ đồ thị"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Bottom Left Legend Box */}
      <div className="absolute bottom-4 left-4 z-20 bg-slate-900/85 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-slate-700/80 shadow-xl space-y-2.5 max-w-xs text-[11px]">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block pb-1 border-b border-slate-800">
          Chú Giải Trạng Thái & 5 Cấp Node
        </span>

        {/* Cấp bậc phân tầng */}
        <div className="space-y-1 text-slate-300 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
            <span>Cấp 1: Nhóm Ngành • Cấp 2: Ngành</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-2 rounded bg-slate-400 shrink-0" />
            <span>Cấp 3: Môn Học (Thẻ bài chữ nhật)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-500 shrink-0" />
            <span>Cấp 4: Nhóm KT • Cấp 5: Vi Khái Niệm</span>
          </div>
        </div>

        {/* Trạng thái học */}
        <div className="pt-1.5 border-t border-slate-800 space-y-1 text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-2xs" />
            <span>Xanh lá: Đã thông thạo (≥ 80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-2xs" />
            <span>Vàng: Đang học dở (60 - 79%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-2xs" />
            <span className="text-rose-300 font-bold">Đỏ cam: Lỗ hổng cần giảng lại (&lt; 60%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block" />
            <span>Xám: Chưa học</span>
          </div>
        </div>
      </div>

      {/* 4. Slide-over Detail Drawer (Opens when Subject or Concept node is selected) */}
      {isDrawerOpen && selectedNode && (
        <div className="absolute top-0 right-0 bottom-0 w-full sm:w-[420px] bg-slate-900/95 backdrop-blur-xl border-l border-slate-700 p-6 z-30 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200 text-slate-100">
          <div className="space-y-4">
            {/* Header with Close */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 inline-block mb-1">
                  Cấp {selectedNode.level}: {selectedNode.level === 3 ? "Môn Học" : selectedNode.level === 5 ? "Vi Khái Niệm" : "Nhóm Kiến Thức"}
                </span>
                <h3 className="text-lg font-black text-white leading-snug">
                  {selectedNode.name}
                </h3>
              </div>

              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Clarity Score Card */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400">Độ Thấu Suốt Hiện Tại:</span>
                <span
                  className={`text-sm font-black ${
                    (selectedNode.clarityScore ?? 0) >= 80
                      ? "text-emerald-400"
                      : (selectedNode.clarityScore ?? 0) >= 60
                      ? "text-amber-400"
                      : "text-rose-400"
                  }`}
                >
                  {selectedNode.clarityScore ?? 0}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    (selectedNode.clarityScore ?? 0) >= 80
                      ? "bg-emerald-500"
                      : (selectedNode.clarityScore ?? 0) >= 60
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`}
                  style={{ width: `${selectedNode.clarityScore ?? 0}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                {(selectedNode.clarityScore ?? 0) < 60
                  ? "⚠️ Cần giảng lại: Khái niệm này đang là lỗ hổng tri thức cần ưu tiên bù đắp."
                  : (selectedNode.clarityScore ?? 0) >= 80
                  ? "🟢 Đã thông thạo: Bạn có thể giải thích trôi chảy cho người mới bắt đầu."
                  : "🟡 Đang củng cố: Hãy tiếp tục rèn luyện để đạt mức độ thông thạo."}
              </p>
            </div>

            {/* Ground Truth definition if available */}
            {selectedNode.summary && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Định Nghĩa Chuẩn (Ground Truth)
                </span>
                <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
                  "{selectedNode.summary}"
                </p>
              </div>
            )}

            {/* Required concepts checklist */}
            {selectedNode.requiredConcepts && selectedNode.requiredConcepts.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Luận Điểm Cốt Lõi Cần Nắm:
                </span>
                <div className="space-y-1.5">
                  {selectedNode.requiredConcepts.slice(0, 3).map((concept, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-300 flex items-start gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{concept}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-4 border-t border-slate-800">
            {selectedNode.subjectId && (
              <button
                onClick={() => handleStudyTopic(selectedNode.subjectId)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Soạn Bài Trong Study Lab</span>
              </button>
            )}

            <button
              onClick={() => handleTeachTopic(selectedNode.name)}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>⚡ Giảng Ngay Cho AI (Bục Giảng Live)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicKnowledgeGraph;
