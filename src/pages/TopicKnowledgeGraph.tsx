/**
 * File: src/pages/TopicKnowledgeGraph.tsx
 * Mục đích: Màn hình Bản Đồ Tri Thức (Knowledge Graph) theo cấu trúc Bố Cục Tỏa Tròn (Radial Dendrogram)
 * học theo phong cách Cybernetic / Neural Dendrogram:
 *   - Lõi trung tâm ở rìa trái (Core Rim với vòng cung phát sáng đứt đoạn & nhãn mã hóa DE, FE, MATH...)
 *   - Hệ thống quỹ đạo đồng tâm mảnh (Concentric Guide Orbits)
 *   - Phân cấp 5 tầng (Domain, Field, Subject, Topic Group, Micro-concept Leaves)
 *   - Bó sợi liên kết uốn cong Bézier mảnh như sợi quang (Fiber-optic Bundles)
 *   - Đường dẫn tín hiệu cảnh báo màu đỏ (Red Tracer Pathways) cho các lỗ hổng kiến thức
 *   - Các node lá dạng vòng tròn li ti (Hollow Ringlets & Pulse Dots)
 *   - BẢNG MÀU HỆ THỐNG: Giao diện sáng chuẩn Theodore (#f8fafc / trắng / slate / xanh / đỏ / ngọc), KHÔNG DÙNG MÀU ĐEN.
 */

import React, { useMemo, useState, useRef, useCallback, useEffect } from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import { useNavigate } from "react-router-dom";
import {
  Flame,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  BookOpen,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  X,
  Target,
  GraduationCap,
} from "lucide-react";
import { TOPICS_CATALOG } from "@/data/academic-catalog.data";
import { GRAPH_EDGES } from "@/data/knowledge-graph.data";
import { CatalogTopic, GraphEdge } from "@/types/catalog.types";
import { useStudyStore } from "@/hooks/useStudyStore";

// Type definitions for Radial Dendrogram Nodes & Links
export interface RadialGraphNode {
  id: string;
  level: 0 | 1 | 2 | 3 | 4 | 5;
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

// Radial Dendrogram Orbit Radii (Origin centered at X=0, Y=0 on the left edge)
const ORBIT_0_R = 170; // Core Arc Rim
const ORBIT_1_R = 280; // Domain Hubs (Cấp 1)
const ORBIT_2_R = 420; // Field Hubs (Cấp 2)
const ORBIT_3_R = 580; // Subject Nodes (Cấp 3)
const ORBIT_4_R = 730; // Topic Groups (Cấp 4)
const ORBIT_5_R = 880; // Micro-concept Leaves (Cấp 5)

// Domain Angular Sectors (Fanning out rightwards from -75° to +75°)
const DOMAIN_CONFIG: Record<
  string,
  {
    code: string;
    name: string;
    symbol: string;
    color: string;
    lightColor: string;
    bgColor: string;
    angle: number;
  }
> = {
  math: {
    code: "MATH",
    name: "Toán Cao Cấp & Đại Số",
    symbol: "∑",
    color: "#2563eb", // Royal Blue
    lightColor: "#60a5fa",
    bgColor: "#eff6ff",
    angle: -1.05, // ~ -60°
  },
  discrete: {
    code: "DISC",
    name: "Toán Rời Rạc & Đồ Thị",
    symbol: "⑂",
    color: "#059669", // Emerald
    lightColor: "#34d399",
    bgColor: "#ecfdf5",
    angle: -0.35, // ~ -20°
  },
  cv: {
    code: "CV",
    name: "Thị Giác Máy Tính & AI",
    symbol: "👁",
    color: "#7c3aed", // Violet / Purple
    lightColor: "#a78bfa",
    bgColor: "#f5f3ff",
    angle: 0.35, // ~ +20°
  },
  cs: {
    code: "SYS",
    name: "Hệ Thống & Khoa Học Máy Tính",
    symbol: "⚙",
    color: "#d97706", // Amber
    lightColor: "#fbbf24",
    bgColor: "#fffbeb",
    angle: 1.05, // ~ +60°
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
    width: typeof window !== "undefined" ? window.innerWidth - 260 : 1200,
    height: typeof window !== "undefined" ? window.innerHeight - 80 : 800,
  });

  useEffect(() => {
    const handleResize = () => {
      const sidebar = document.querySelector("aside");
      const sidebarWidth = sidebar ? sidebar.getBoundingClientRect().width : 256;
      setDimensions({
        width: Math.max(800, window.innerWidth - sidebarWidth),
        height: Math.max(620, window.innerHeight - 80),
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initial Camera position: Left-anchored core, viewing fan spreading to the right
  useEffect(() => {
    const timer = setTimeout(() => {
      if (fgRef.current) {
        fgRef.current.centerAt(380, 0, 700);
        fgRef.current.zoom(0.82, 700);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  // Build Hierarchical Radial Dendrogram Dataset
  const graphData = useMemo(() => {
    const nodes: RadialGraphNode[] = [];
    const links: RadialGraphLink[] = [];

    // 0. Level 0: Core Node (Feynman Matrix Hub)
    nodes.push({
      id: "core-feynman",
      level: 0,
      name: "KHÔNG GIAN FEYNMAN",
      shortLabel: "FEYNMAN CORE",
      color: "#2563eb",
      r: 38,
      x: 0,
      y: 0,
      fx: 0,
      fy: 0,
      targetRadius: 0,
      targetAngle: 0,
    });

    // 1. Level 1: Domain Hubs
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
    const fieldDefinitions: Array<{
      id: string;
      domainId: string;
      name: string;
      shortLabel: string;
      offsetAngle: number;
    }> = [
      // Math
      { id: "field-algebra", domainId: "math", name: "Đại Số Tuyến Tính", shortLabel: "ĐSTT", offsetAngle: -0.22 },
      { id: "field-calculus", domainId: "math", name: "Giải Tích Nhiều Biến", shortLabel: "GT", offsetAngle: 0 },
      { id: "field-optimization", domainId: "math", name: "Tối Ưu Hóa Vi Phân", shortLabel: "TƯH", offsetAngle: 0.22 },
      // Discrete
      { id: "field-graph-theory", domainId: "discrete", name: "Lý Thuyết Đồ Thị", shortLabel: "ĐTH", offsetAngle: -0.22 },
      { id: "field-logic", domainId: "discrete", name: "Logic & Boole", shortLabel: "LOGIC", offsetAngle: 0 },
      { id: "field-combinatorics", domainId: "discrete", name: "Tổ Hợp & Nhị Thức", shortLabel: "TỔ HỢP", offsetAngle: 0.22 },
      // CV
      { id: "field-neural-nets", domainId: "cv", name: "Mạng Tích Chập CNN", shortLabel: "CNN", offsetAngle: -0.22 },
      { id: "field-image-proc", domainId: "cv", name: "Xử Lý & Lọc Biên", shortLabel: "LỌC", offsetAngle: 0 },
      { id: "field-detection", domainId: "cv", name: "Nhận Diện & Detection", shortLabel: "YOLO", offsetAngle: 0.22 },
      // CS
      { id: "field-os", domainId: "cs", name: "Hệ Điều Hành & Con Trỏ", shortLabel: "HĐH", offsetAngle: -0.22 },
      { id: "field-db", domainId: "cs", name: "Cơ Sở Dữ Liệu B-Tree", shortLabel: "CSDL", offsetAngle: 0 },
      { id: "field-dist-sys", domainId: "cs", name: "Hệ Thống Phân Tán", shortLabel: "PHÂN TÁN", offsetAngle: 0.22 },
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
        color: domainCfg.color,
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

    // Helper: Map subject to field
    const assignSubjectToField = (topicId: string, domainId: string): string => {
      if (domainId === "math") {
        if (topicId.includes("gradient") || topicId.includes("hessian") || topicId.includes("taylor")) return "field-optimization";
        if (topicId.includes("linear") || topicId.includes("eigenvalues") || topicId.includes("svd") || topicId.includes("gauss") || topicId.includes("gram")) return "field-algebra";
        return "field-calculus";
      }
      if (domainId === "discrete") {
        if (topicId.includes("logic") || topicId.includes("induction") || topicId.includes("equivalence")) return "field-logic";
        if (topicId.includes("combinatorics") || topicId.includes("recurrence") || topicId.includes("pigeonhole")) return "field-combinatorics";
        return "field-graph-theory";
      }
      if (domainId === "cv") {
        if (topicId.includes("sobel") || topicId.includes("filtering") || topicId.includes("histogram") || topicId.includes("morphology")) return "field-image-proc";
        if (topicId.includes("yolo") || topicId.includes("iou") || topicId.includes("rcnn") || topicId.includes("anchor")) return "field-detection";
        return "field-neural-nets";
      }
      if (domainId === "cs") {
        if (topicId.includes("btree") || topicId.includes("transaction") || topicId.includes("acid") || topicId.includes("indexing")) return "field-db";
        if (topicId.includes("raft") || topicId.includes("cap") || topicId.includes("consensus") || topicId.includes("sharding")) return "field-dist-sys";
        return "field-os";
      }
      return "field-algebra";
    };

    // 3. Level 3: Subject Nodes (Môn học)
    fieldDefinitions.forEach((f) => {
      const domainCfg = DOMAIN_CONFIG[f.domainId];
      const fieldAngle = domainCfg.angle + f.offsetAngle;

      const fieldSubjects = TOPICS_CATALOG.filter((c: CatalogTopic) => {
        const assigned = assignSubjectToField(c.id, c.domainId);
        return assigned === f.id;
      });

      const subjectsToRender =
        fieldSubjects.length > 0
          ? fieldSubjects
          : [
              {
                id: `mock-${f.id}-1`,
                domainId: f.domainId,
                title: `${f.name} I`,
                summary: `Nền tảng lý thuyết và ứng dụng của ${f.name}.`,
                requiredConcepts: ["Cơ bản", "Định lý 1"],
                jargonTraps: [],
              },
            ];

      subjectsToRender.forEach((sub: any, sIdx: number) => {
        const totalSubs = subjectsToRender.length;
        const subOffset = totalSubs === 1 ? 0 : (sIdx - (totalSubs - 1) / 2) * 0.085;
        const subAngle = fieldAngle + subOffset;
        const x = ORBIT_3_R * Math.cos(subAngle);
        const y = ORBIT_3_R * Math.sin(subAngle);

        // Status assignment
        let status: RadialGraphNode["status"] = "UNLEARNED";
        let clarityScore = 0;
        if (sIdx === 0 && (f.domainId === "math" || f.domainId === "cv")) {
          status = "MASTERED";
          clarityScore = 92;
        } else if (sIdx === 1 && f.domainId === "math") {
          status = "GAP"; // Knowledge Gap
          clarityScore = 58;
        } else if (sIdx === 0 && f.domainId === "discrete") {
          status = "ACTIVE";
          clarityScore = 74;
        } else if (sIdx === 0 && f.domainId === "cs") {
          status = "MASTERED";
          clarityScore = 88;
        } else if (sIdx === 1 && f.domainId === "cv") {
          status = "GAP";
          clarityScore = 52;
        }

        const subNode: RadialGraphNode = {
          id: `subject-${sub.id}`,
          level: 3,
          domainId: sub.domainId,
          fieldId: f.id,
          name: sub.title,
          shortLabel: sub.title.slice(0, 10),
          status,
          clarityScore,
          r: 13,
          x,
          y,
          fx: x,
          fy: y,
          targetRadius: ORBIT_3_R,
          targetAngle: subAngle,
          summary: sub.summary,
          requiredConcepts: sub.requiredConcepts,
          jargonTraps: sub.jargonTraps,
        };

        nodes.push(subNode);
        links.push({
          id: `link-f-${f.id}-${subNode.id}`,
          source: f.id,
          target: subNode.id,
          isHierarchy: true,
        });

        // 4. Level 4: Topic Group Nodes (Cụm kiến thức)
        const numGroups = 2;
        for (let gIdx = 0; gIdx < numGroups; gIdx++) {
          const gOffset = (gIdx - 0.5) * 0.038;
          const gAngle = subAngle + gOffset;
          const gx = ORBIT_4_R * Math.cos(gAngle);
          const gy = ORBIT_4_R * Math.sin(gAngle);
          const gLetter = String.fromCharCode(65 + gIdx);

          const gNode: RadialGraphNode = {
            id: `group-${sub.id}-${gIdx}`,
            level: 4,
            domainId: sub.domainId,
            fieldId: f.id,
            subjectId: sub.id,
            name: `${sub.title} • Module ${gLetter}`,
            shortLabel: gLetter,
            color: "#64748b",
            r: 7,
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

          // 5. Level 5: Micro-concept Leaves (Khái niệm nhỏ li ti xếp theo chùm)
          const numConcepts = 3;
          for (let cIdx = 0; cIdx < numConcepts; cIdx++) {
            const cOffset = (cIdx - 1) * 0.016;
            const cAngle = gAngle + cOffset;
            const cx = ORBIT_5_R * Math.cos(cAngle);
            const cy = ORBIT_5_R * Math.sin(cAngle);

            let cStatus: RadialGraphNode["status"] = "UNLEARNED";
            if (status === "GAP") {
              cStatus = cIdx === 0 ? "GAP" : "UNLEARNED";
            } else if (status === "MASTERED") {
              cStatus = cIdx === 2 ? "UNLEARNED" : "MASTERED";
            } else if (status === "ACTIVE") {
              cStatus = cIdx === 0 ? "ACTIVE" : "UNLEARNED";
            } else {
              cStatus = "UNLEARNED";
            }

            const cName = sub.requiredConcepts?.[cIdx] || `${sub.title} • Khái niệm con #${cIdx + 1}`;

            const cNode: RadialGraphNode = {
              id: `concept-${sub.id}-${gIdx}-${cIdx}`,
              level: 5,
              domainId: sub.domainId,
              fieldId: f.id,
              subjectId: sub.id,
              name: cName,
              shortLabel: "•",
              status: cStatus,
              clarityScore: cStatus === "MASTERED" ? 92 : cStatus === "GAP" ? 48 : cStatus === "ACTIVE" ? 75 : 0,
              r: 4.2,
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
    GRAPH_EDGES.forEach((edge: GraphEdge, idx: number) => {
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
    if (fgRef.current && typeof node.x === "number" && typeof node.y === "number") {
      fgRef.current.centerAt(node.x, node.y, 800);
      const targetZoom = node.level >= 3 ? 1.5 : 1.05;
      fgRef.current.zoom(targetZoom, 800);
    }
  }, []);

  // Node Click handler
  const handleNodeClick = useCallback(
    (node: RadialGraphNode) => {
      setSelectedNode(node);
      focusOnNode(node);

      if (node.level === 3 || node.level === 5) {
        setIsDrawerOpen(true);
      }
    },
    [focusOnNode]
  );

  const handleBackgroundClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleResetCamera = () => {
    if (fgRef.current) {
      fgRef.current.centerAt(380, 0, 700);
      fgRef.current.zoom(0.82, 700);
    }
  };

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

  const handleTeachTopic = (topicName: string) => {
    navigate(`/stage/new?topic=${encodeURIComponent(topicName)}`);
  };

  const handleStudyTopic = (topicId?: string) => {
    if (topicId) {
      selectTopic(topicId);
      navigate(`/study?topicId=${topicId}`);
    }
  };

  // Pre-frame Render: Clean Light System Orbits & Segmented Glowing Rim
  const handleRenderFramePre = useCallback((ctx: CanvasRenderingContext2D, globalScale: number) => {
    ctx.save();

    // 1. Concentric Guide Orbits (Light Slate / Indigo lines)
    const orbits = [
      { r: ORBIT_0_R, isRim: true },
      { r: ORBIT_1_R, isRim: false },
      { r: ORBIT_2_R, isRim: false },
      { r: ORBIT_3_R, isRim: false },
      { r: ORBIT_4_R, isRim: false },
      { r: ORBIT_5_R, isRim: false },
    ];

    orbits.forEach((orbit) => {
      ctx.beginPath();
      // Draw rightward half arc from -Math.PI / 2 to +Math.PI / 2
      ctx.arc(0, 0, orbit.r, -Math.PI / 2, Math.PI / 2);

      if (orbit.isRim) {
        // Glowing Segmented Core Arc Rim (Inspired by reference image)
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 3 / globalScale;
        ctx.setLineDash([70 / globalScale, 12 / globalScale, 130 / globalScale, 12 / globalScale]);
        ctx.shadowColor = "rgba(59, 130, 246, 0.35)";
        ctx.shadowBlur = 10 / globalScale;
        ctx.stroke();

        // Clear shadow for labels
        ctx.shadowBlur = 0;
        ctx.setLineDash([]);

        // Sector Codes along the rim: DE, FE, MATH, CV, SYS
        const rimLabels = [
          { text: "MATH", angle: -1.05 },
          { text: "DISC", angle: -0.35 },
          { text: "FE", angle: 0 },
          { text: "CV", angle: 0.35 },
          { text: "SYS", angle: 1.05 },
        ];

        rimLabels.forEach((lbl) => {
          const lx = (ORBIT_0_R - 16) * Math.cos(lbl.angle);
          const ly = (ORBIT_0_R - 16) * Math.sin(lbl.angle);
          ctx.font = `bold ${8.5 / globalScale}px monospace`;
          ctx.fillStyle = "#64748b";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(lbl.text, lx, ly);
        });
      } else {
        // Subtle guide orbits
        ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
        ctx.lineWidth = 0.8 / globalScale;
        ctx.setLineDash([6 / globalScale, 6 / globalScale]);
        ctx.shadowBlur = 0;
        ctx.stroke();
      }
    });

    // 2. Faint Radial Sector Separators
    const sectorAngles = [-0.7, 0, 0.7];
    sectorAngles.forEach((ang) => {
      ctx.beginPath();
      ctx.moveTo(ORBIT_0_R * Math.cos(ang), ORBIT_0_R * Math.sin(ang));
      ctx.lineTo((ORBIT_5_R + 30) * Math.cos(ang), (ORBIT_5_R + 30) * Math.sin(ang));
      ctx.strokeStyle = "rgba(203, 213, 225, 0.4)";
      ctx.lineWidth = 0.6 / globalScale;
      ctx.setLineDash([4 / globalScale, 8 / globalScale]);
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
        const r = node.r ?? 38;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "rgba(59, 130, 246, 0.25)";
        ctx.shadowBlur = 12 / globalScale;
        ctx.fill();

        ctx.strokeStyle = "#2563eb";
        ctx.lineWidth = 3 / globalScale;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Subtitle & Core Name
        ctx.font = `bold ${6 / globalScale}px sans-serif`;
        ctx.fillStyle = "#3b82f6";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("ELISE MATRIX", x, y - 7 / globalScale);

        ctx.font = `900 ${8 / globalScale}px sans-serif`;
        ctx.fillStyle = "#0f172a";
        ctx.fillText("FEYNMAN", x, y + 4 / globalScale);

        ctx.restore();
        return;
      }

      // ==========================================
      // LEVEL 1: DOMAIN HUBS (Nhóm Ngành)
      // ==========================================
      if (node.level === 1) {
        const r = isHovered || isSelected ? 24 : (node.r ?? 22);

        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = node.color || "#2563eb";
        ctx.shadowColor = `${node.color}55`;
        ctx.shadowBlur = (isSelected ? 16 : 8) / globalScale;
        ctx.fill();

        ctx.strokeStyle = isSelected ? "#ffffff" : "#ffffff";
        ctx.lineWidth = 2.5 / globalScale;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Domain Symbol Icon
        ctx.font = `bold ${12 / globalScale}px sans-serif`;
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.shortLabel || "∑", x, y);

        // Tooltip text below domain hub
        ctx.font = `bold ${9 / globalScale}px sans-serif`;
        ctx.fillStyle = "#1e293b";
        ctx.fillText(node.name, x, y + r + 13 / globalScale);

        ctx.restore();
        return;
      }

      // ==========================================
      // LEVEL 2: FIELD NODES (Ngành Chuyên Môn)
      // ==========================================
      if (node.level === 2) {
        const r = isHovered || isSelected ? 17 : (node.r ?? 15);

        // Hollow Circle Style (White body with colored border)
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        ctx.strokeStyle = node.color || "#3b82f6";
        ctx.lineWidth = (isSelected ? 3 : 2.2) / globalScale;
        ctx.shadowColor = `${node.color}40`;
        ctx.shadowBlur = (isSelected ? 10 : 4) / globalScale;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Abbreviation
        ctx.font = `900 ${7.5 / globalScale}px sans-serif`;
        ctx.fillStyle = "#1e293b";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.shortLabel || "", x, y);

        ctx.restore();
        return;
      }

      // ==========================================
      // LEVEL 3: SUBJECT NODES (Môn Học - Hubs Tỏa Nhánh)
      // ==========================================
      if (node.level === 3) {
        const r = isHovered || isSelected ? 15 : (node.r ?? 13);

        let fill = "#ffffff";
        let stroke = "#94a3b8";
        let textColor = "#1e293b";
        let glowColor = "transparent";

        if (node.status === "GAP") {
          // Lỗ hổng kiến thức -> Đỏ sáng phát quang (như chấm đỏ trong ảnh mẫu)
          fill = "#ef4444";
          stroke = "#b91c1c";
          textColor = "#ffffff";
          glowColor = "rgba(239, 68, 68, 0.45)";
        } else if (node.status === "MASTERED") {
          // Đã thông thạo -> Xanh ngọc
          fill = "#10b981";
          stroke = "#047857";
          textColor = "#ffffff";
          glowColor = "rgba(16, 185, 129, 0.3)";
        } else if (node.status === "ACTIVE") {
          // Đang học -> Vàng hổ phách
          fill = "#f59e0b";
          stroke = "#b45309";
          textColor = "#ffffff";
          glowColor = "rgba(245, 158, 11, 0.35)";
        } else {
          // Chưa học -> Vòng tròn trắng viền xám (Hollow)
          fill = "#ffffff";
          stroke = "#94a3b8";
          textColor = "#475569";
        }

        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = fill;
        if (glowColor !== "transparent") {
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 12 / globalScale;
        }
        ctx.fill();

        ctx.strokeStyle = stroke;
        ctx.lineWidth = (isSelected ? 3 : 2) / globalScale;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Inner center indicator dot
        ctx.beginPath();
        ctx.arc(x, y, 3 / globalScale, 0, 2 * Math.PI);
        ctx.fillStyle = textColor;
        ctx.fill();

        // Subject Name Pill beside node
        ctx.font = `600 ${8 / globalScale}px sans-serif`;
        ctx.fillStyle = "#334155";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(node.name, x + r + 6 / globalScale, y);

        ctx.restore();
        return;
      }

      // ==========================================
      // LEVEL 4: TOPIC GROUP NODES (Nhóm Kiến Thức)
      // ==========================================
      if (node.level === 4) {
        const r = node.r ?? 7;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        ctx.strokeStyle = isSelected ? "#2563eb" : "#64748b";
        ctx.lineWidth = 1.5 / globalScale;
        ctx.stroke();

        ctx.font = `bold ${6 / globalScale}px sans-serif`;
        ctx.fillStyle = "#475569";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.shortLabel || "", x, y);

        ctx.restore();
        return;
      }

      // ==========================================
      // LEVEL 5: MICRO-CONCEPT LEAVES (Chấm Tri Thức Li Ti)
      // ==========================================
      if (node.level === 5) {
        const r = isHovered || isSelected ? 6.5 : (node.r ?? 4.2);

        if (node.status === "GAP") {
          // Lỗ hổng -> Chấm đỏ neon phát sáng rực rỡ
          ctx.beginPath();
          ctx.arc(x, y, r, 0, 2 * Math.PI);
          ctx.fillStyle = "#ef4444";
          ctx.shadowColor = "rgba(239, 68, 68, 0.6)";
          ctx.shadowBlur = 10 / globalScale;
          ctx.fill();

          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.2 / globalScale;
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else if (node.status === "MASTERED") {
          // Thông thạo -> Chấm xanh ngọc đặc
          ctx.beginPath();
          ctx.arc(x, y, r, 0, 2 * Math.PI);
          ctx.fillStyle = "#10b981";
          ctx.fill();

          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1 / globalScale;
          ctx.stroke();
        } else if (node.status === "ACTIVE") {
          // Đang học -> Chấm vàng hổ phách
          ctx.beginPath();
          ctx.arc(x, y, r, 0, 2 * Math.PI);
          ctx.fillStyle = "#f59e0b";
          ctx.fill();
        } else {
          // Chưa học -> Vòng tròn rỗng (Hollow Ringlet) màu trắng viền xám mảnh
          ctx.beginPath();
          ctx.arc(x, y, r, 0, 2 * Math.PI);
          ctx.fillStyle = "#ffffff";
          ctx.fill();

          ctx.strokeStyle = "#94a3b8";
          ctx.lineWidth = 1.2 / globalScale;
          ctx.stroke();
        }

        ctx.restore();
        return;
      }

      ctx.restore();
    },
    [selectedNode, hoveredNode]
  );

  // Link Canvas Renderer: Fiber-optic Radial Bézier Splines (Bó sợi uốn cong)
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
      ) {
        return;
      }

      const isConnectedToSelected =
        selectedNode != null &&
        (source.id === selectedNode.id || target.id === selectedNode.id);

      // Radial coordinates
      const r1 = Math.sqrt(source.x * source.x + source.y * source.y);
      const theta1 = Math.atan2(source.y, source.x);
      const r2 = Math.sqrt(target.x * target.x + target.y * target.y);
      const theta2 = Math.atan2(target.y, target.x);

      // Fiber-optic Bézier control points (radial tangents)
      const dr = Math.abs(r2 - r1) * 0.48;
      const cp1x = source.x + Math.cos(theta1) * dr;
      const cp1y = source.y + Math.sin(theta1) * dr;
      const cp2x = target.x - Math.cos(theta2) * dr;
      const cp2y = target.y - Math.sin(theta2) * dr;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, target.x, target.y);

      if (isConnectedToSelected) {
        // Active Selected Focus: Royal Blue
        ctx.strokeStyle = "#2563eb";
        ctx.lineWidth = 2.4 / globalScale;
        ctx.shadowColor = "rgba(37, 99, 235, 0.35)";
        ctx.shadowBlur = 6 / globalScale;
      } else if (target.status === "GAP") {
        // Red Tracer Pathway (Lỗ hổng kiến thức dẫn truyền từ rễ ra lá)
        ctx.strokeStyle = "rgba(239, 68, 68, 0.7)";
        ctx.lineWidth = 1.4 / globalScale;
      } else if (target.status === "ACTIVE") {
        // Amber Pathway
        ctx.strokeStyle = "rgba(245, 158, 11, 0.55)";
        ctx.lineWidth = 1.2 / globalScale;
      } else if (link.isPrereq) {
        // Prerequisite Cross-links: Indigo
        ctx.strokeStyle = "rgba(99, 102, 241, 0.4)";
        ctx.lineWidth = 1.2 / globalScale;
      } else {
        // Hair-thin delicate fiber threads (như sợi quang học trong ảnh mẫu)
        ctx.strokeStyle = "rgba(148, 163, 184, 0.28)";
        ctx.lineWidth = 0.75 / globalScale;
      }

      ctx.stroke();
      ctx.restore();
    },
    [selectedNode]
  );

  return (
    <div className="relative w-full h-[calc(100vh-100px)] min-h-[640px] bg-[#f8fafc] rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden select-none">
      {/* 1. Main Interactive ForceGraph2D Canvas */}
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        backgroundColor="#f8fafc"
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
        cooldownTicks={1}
      />

      {/* 2. Top Right Panel: Quick Metrics & Camera Tools */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2.5">
        {/* Metric Summary Card (Light modern theme) */}
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200/90 shadow-lg space-y-3 min-w-[240px]">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Tiến Độ Tri Thức
            </span>
            <div className="flex items-center gap-1 text-xs font-black text-amber-500">
              <Flame className="w-3.5 h-3.5 fill-amber-500" />
              <span>14 Ngày</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-500">Khái niệm đã học:</span>
              <span className="text-slate-900 font-black">142 / 500</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                style={{ width: "28.4%" }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-bold pt-1">
            <span className="text-slate-500">Điểm Clarity TB:</span>
            <span className="text-emerald-600 font-black text-sm">88%</span>
          </div>
        </div>

        {/* Camera Navigation Controls */}
        <div className="flex items-center justify-end gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/90 shadow-md self-end text-slate-600">
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            title="Phóng to"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            title="Thu nhỏ"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-200" />
          <button
            onClick={handleResetCamera}
            className="p-1.5 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            title="Căn giữa lại toàn bộ đồ thị"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Bottom Left Legend Box */}
      <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-lg space-y-2.5 max-w-xs text-[11px] text-slate-700">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block pb-1 border-b border-slate-100">
          Chú Giải Trạng Thái & 5 Cấp Node
        </span>

        {/* 5 Cấp Node */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-blue-600 border border-white shadow-sm flex items-center justify-center text-[7px] text-white font-bold">
              1
            </span>
            <span>Cấp 1: Nhóm Ngành (Domain Hub)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-white border-2 border-blue-500 shadow-sm flex items-center justify-center text-[7px] text-blue-600 font-bold">
              2
            </span>
            <span>Cấp 2: Ngành Chuyên Môn (Field)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 shadow-sm flex items-center justify-center text-[7px] text-white font-bold">
              3
            </span>
            <span>Cấp 3: Môn Học (Subject Hub)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-500 flex items-center justify-center text-[5px] text-slate-600 font-bold">
              •
            </span>
            <span>Cấp 4: Nhóm Kiến Thức (Topic Group)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)]" />
            <span>Cấp 5: Vi Khái Niệm (Micro-concept Leaves)</span>
          </div>
        </div>

        {/* Trạng thái màu sắc */}
        <div className="pt-1.5 border-t border-slate-100 space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
            <span className="font-semibold text-emerald-700">Đã thông thạo (Clarity ≥ 80)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" />
            <span className="font-semibold text-amber-700">Đang học dở (Active)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)] animate-pulse" />
            <span className="font-semibold text-red-600">Lỗ hổng (Cần ôn lại / Giảng lại)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-400" />
            <span className="text-slate-500">Chưa học (Hollow ring / Standby)</span>
          </div>
        </div>
      </div>

      {/* 4. Slide-over Concept Details Drawer */}
      {isDrawerOpen && selectedNode && (
        <div className="absolute top-0 right-0 bottom-0 w-full sm:w-[420px] bg-white/98 backdrop-blur-xl border-l border-slate-200 p-6 z-30 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200 text-slate-800">
          <div className="space-y-5">
            {/* Drawer Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60 inline-block mb-1.5">
                  {selectedNode.level === 3 ? "Cấp 3 • Môn Học" : "Cấp 5 • Vi Khái Niệm"}
                </span>
                <h3 className="text-lg font-black text-slate-900 leading-snug">
                  {selectedNode.name}
                </h3>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status & Clarity Card */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-500">Trạng thái học tập:</span>
                {selectedNode.status === "MASTERED" && (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Thông thạo
                  </span>
                )}
                {selectedNode.status === "GAP" && (
                  <span className="inline-flex items-center gap-1 text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                    <AlertTriangle className="w-3.5 h-3.5" /> Lỗ hổng cần giảng lại
                  </span>
                )}
                {selectedNode.status === "ACTIVE" && (
                  <span className="inline-flex items-center gap-1 text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    <BookOpen className="w-3.5 h-3.5" /> Đang học
                  </span>
                )}
                {(!selectedNode.status || selectedNode.status === "UNLEARNED") && (
                  <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    Chưa kích hoạt
                  </span>
                )}
              </div>

              {selectedNode.clarityScore !== undefined && selectedNode.clarityScore > 0 && (
                <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Điểm Feynman Clarity:</span>
                  <span className="text-emerald-600 font-black text-sm">
                    {selectedNode.clarityScore}/100
                  </span>
                </div>
              )}
            </div>

            {/* Summary */}
            {selectedNode.summary && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-blue-600" />
                  Mô tả Bản Đồ Tri Thức
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  {selectedNode.summary}
                </p>
              </div>
            )}

            {/* Required Concepts */}
            {selectedNode.requiredConcepts && selectedNode.requiredConcepts.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                  Khái Niệm Cốt Lõi Cần Nắm
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.requiredConcepts.map((c, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Jargon Traps */}
            {selectedNode.jargonTraps && selectedNode.jargonTraps.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Thuật ngữ chuyên ngành dễ gây hiểu lầm
                </h4>
                <div className="space-y-2">
                  {selectedNode.jargonTraps.map((jt, idx) => (
                    <div
                      key={idx}
                      className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/80 text-xs space-y-1"
                    >
                      <div className="font-bold text-amber-800">{jt.term}</div>
                      {jt.recommendedAnalogy && (
                        <div className="text-[11px] text-amber-700">
                          💡 <strong>Phép ẩn dụ gợi ý:</strong> {jt.recommendedAnalogy}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <button
              onClick={() => handleStudyTopic(selectedNode.subjectId || selectedNode.id.replace("subject-", ""))}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-slate-200 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              Ôn Luyện Trong Phòng Nghiên Cứu
            </button>

            <button
              onClick={() => handleTeachTopic(selectedNode.name)}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              Giảng Ngay Cho AI (Feynman Stage)
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicKnowledgeGraph;
