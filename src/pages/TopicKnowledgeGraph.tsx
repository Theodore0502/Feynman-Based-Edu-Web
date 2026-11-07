/**
 * File: src/pages/TopicKnowledgeGraph.tsx
 * Mục đích: Màn hình Bản Đồ Tri Thức (Knowledge Graph) theo cấu trúc Bố Cục Tỏa Tròn (Radial Dendrogram)
 * học theo phong cách Cybernetic / Neural Dendrogram:
 *   - Lõi trung tâm ở rìa trái (Core Rim với vòng cung phát sáng đứt đoạn & nhãn mã hóa DE, FE, MATH...)
 *   - Tâm vòng tròn ghim tuyệt đối tại mép trái và chính giữa theo trục dọc (X=0, Y=height/2)
 *   - Hệ thống quỹ đạo đồng tâm mảnh (Concentric Guide Orbits)
 *   - Phân cấp 5 tầng (Domain, Field, Subject, Topic Group, Micro-concept Leaves)
 *   - Bó sợi liên kết uốn cong Bézier mảnh như sợi quang (Fiber-optic Bundles)
 *   - Đường dẫn tín hiệu cảnh báo màu đỏ (Red Tracer Pathways) cho các lỗ hổng kiến thức
 *   - Các node lá dạng vòng tròn li ti (Hollow Ringlets & Pulse Dots)
 *   - BẢNG MÀU HỆ THỐNG: Giao diện sáng chuẩn Theodore (#f8fafc / trắng / slate / xanh / đỏ / ngọc), KHÔNG DÙNG MÀU ĐEN.
 *   - Khóa kéo/pan màn hình, zoom to nhỏ mượt mà bảo toàn tâm.
 */

import React, { useMemo, useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import { useNavigate } from "react-router-dom";
import {
  Flame,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Sparkles,
  BookOpen,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  X,
  Target,
  GraduationCap,
  Compass,
} from "lucide-react";
import { TOPICS_CATALOG } from "@/data/academic-catalog.data";
import { GRAPH_EDGES } from "@/data/knowledge-graph.data";
import { CatalogTopic, GraphEdge } from "@/types/catalog.types";
import { useStudyStore } from "@/hooks/useStudyStore";
import TopicHierarchySearch, { SearchFilterState } from "@/components/topics/TopicHierarchySearch";
import { cn } from "@/lib/utils";

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

// Proportional Orbit Radii (Balanced to fit comfortably inside canvas with generous spacing)
const ORBIT_0_R = 75;  // Core Arc Rim
const ORBIT_1_R = 150; // Domain Hubs (Cấp 1)
const ORBIT_2_R = 235; // Field Hubs (Cấp 2)
const ORBIT_3_R = 330; // Subject Nodes (Cấp 3)
const ORBIT_4_R = 415; // Topic Groups (Cấp 4)
const ORBIT_5_R = 485; // Micro-concept Leaves (Cấp 5)

// 360-Degree Domain Angular Sectors (Distributed evenly around full 360° circle)
const DOMAIN_CONFIG: Record<
  string,
  {
    code: string;
    name: string;
    symbol: string;
    color: string;
    lightColor: string;
    bgColor: string;
    angle: number; // Base angle in radians (0, PI/2, PI, 3*PI/2)
  }
> = {
  math: {
    code: "MATH",
    name: "Toán Cao Cấp & Đại Số",
    symbol: "∑",
    color: "#2563eb", // Royal Blue
    lightColor: "#60a5fa",
    bgColor: "#eff6ff",
    angle: 0, // 0 rad (0°) - Mặt đối diện chính
  },
  discrete: {
    code: "DISC",
    name: "Toán Rời Rạc & Đồ Thị",
    symbol: "⑂",
    color: "#059669", // Emerald
    lightColor: "#34d399",
    bgColor: "#ecfdf5",
    angle: Math.PI / 2, // 90°
  },
  cv: {
    code: "CV",
    name: "Thị Giác Máy Tính & AI",
    symbol: "👁",
    color: "#7c3aed", // Violet / Purple
    lightColor: "#a78bfa",
    bgColor: "#f5f3ff",
    angle: Math.PI, // 180°
  },
  cs: {
    code: "SYS",
    name: "Hệ Thống & Khoa Học Máy Tính",
    symbol: "⚙",
    color: "#d97706", // Amber
    lightColor: "#fbbf24",
    bgColor: "#fffbeb",
    angle: (3 * Math.PI) / 2, // 270° (-90°)
  },
};

export const TopicKnowledgeGraph: React.FC = () => {
  const navigate = useNavigate();
  const { selectTopic } = useStudyStore();
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  // Active / Selected Node State
  const [selectedNode, setSelectedNode] = useState<RadialGraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<RadialGraphNode | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(0.75);

  // Active Domain & 360-Degree Rotary Wheel Rotation State
  const [activeDomainKey, setActiveDomainKey] = useState<string>("math");
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const targetRotationRef = useRef<number>(0);
  const currentRotationRef = useRef<number>(0);

  const rotateToDomain = useCallback((domainKey: string) => {
    const cfg = DOMAIN_CONFIG[domainKey];
    if (!cfg) return;
    setActiveDomainKey(domainKey);
    // Align domain's base angle to 0 (horizontal center)
    targetRotationRef.current = -cfg.angle;
  }, []);

  // Smooth Rotary Lerp Loop for 360-Degree Wheel
  useEffect(() => {
    let animId: number;
    const animate = () => {
      const cur = currentRotationRef.current;
      const target = targetRotationRef.current;
      let diff = target - cur;
      // Shortest circular path around 2*PI
      while (diff < -Math.PI) diff += 2 * Math.PI;
      while (diff > Math.PI) diff -= 2 * Math.PI;

      if (Math.abs(diff) > 0.0008) {
        currentRotationRef.current += diff * 0.10;
        setRotationAngle(currentRotationRef.current);
      }
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Hierarchical Search Filter State (Phương án C - Hybrid Search)
  const [filterState, setFilterState] = useState<SearchFilterState>({
    domainId: "ALL",
    fieldId: "ALL",
    keyword: "",
    selectedTopicId: null,
  });

  // Sync rotation with search filter
  useEffect(() => {
    if (filterState.domainId && filterState.domainId !== "ALL" && DOMAIN_CONFIG[filterState.domainId]) {
      rotateToDomain(filterState.domainId);
    }
  }, [filterState.domainId, rotateToDomain]);

  const isNodeHighlighted = useCallback(
    (node: RadialGraphNode): boolean => {
      const hasFilters =
        filterState.domainId !== "ALL" ||
        filterState.fieldId !== "ALL" ||
        filterState.keyword.length > 0 ||
        filterState.selectedTopicId != null;

      if (!hasFilters) return true;
      if (node.level === 0) return true; // Core stays visible

      // Domain filter
      if (filterState.domainId !== "ALL" && node.domainId && node.domainId !== filterState.domainId) {
        return false;
      }

      // Field filter
      if (filterState.fieldId !== "ALL") {
        if (node.level === 1) return true;
        if (node.level === 2 && node.id !== filterState.fieldId) return false;
        if (node.level >= 3 && node.fieldId !== filterState.fieldId) return false;
      }

      // Keyword filter
      if (filterState.keyword.length > 0) {
        const kw = filterState.keyword.toLowerCase();
        if (node.level >= 3) {
          const matchName = node.name.toLowerCase().includes(kw);
          const matchSummary = node.summary?.toLowerCase().includes(kw);
          const matchConcept = node.requiredConcepts?.some((c) => c.toLowerCase().includes(kw));
          if (!matchName && !matchSummary && !matchConcept) return false;
        }
      }

      // Specific topic selection from dropdown
      if (filterState.selectedTopicId) {
        if (node.level >= 3) {
          const matchId =
            node.id === filterState.selectedTopicId ||
            node.subjectId === filterState.selectedTopicId ||
            node.id === `subject-${filterState.selectedTopicId}`;
          if (!matchId) return false;
        }
      }

      return true;
    },
    [filterState]
  );

  // Exact measurement of container size
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: typeof window !== "undefined" ? Math.max(600, window.innerWidth - 300) : 1000,
    height: typeof window !== "undefined" ? Math.max(450, window.innerHeight - 150) : 600,
  });

  // Track container dimensions via ResizeObserver
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);
      if (w > 0 && h > 0) {
        setDimensions((prev) => (prev.width === w && prev.height === h ? prev : { width: w, height: h }));
      }
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Strict Pinning of Center: Locks world (0,0) to Left Edge (X=0) and Exact Vertical Middle (Y=height/2)
  const pinCamera = useCallback(
    (zoom: number = zoomLevel) => {
      if (fgRef.current && dimensions.width > 0 && dimensions.height > 0) {
        const targetX = dimensions.width / (2 * zoom);
        fgRef.current.zoom(zoom, 0);
        fgRef.current.centerAt(targetX, 0, 0);
      }
    },
    [dimensions.width, dimensions.height, zoomLevel]
  );

  // Apply pin on mount, resize, zoom
  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      pinCamera();
      const t1 = setTimeout(() => pinCamera(), 60);
      const t2 = setTimeout(() => pinCamera(), 180);
      const t3 = setTimeout(() => pinCamera(), 360);
      const t4 = setTimeout(() => pinCamera(), 650);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
  }, [dimensions.width, dimensions.height, zoomLevel, pinCamera]);

  // Apply zoom safely while preserving the pinned center
  const applyZoom = useCallback(
    (newZoom: number) => {
      const clamped = Math.min(Math.max(newZoom, 0.4), 2.2);
      setZoomLevel(clamped);
      if (fgRef.current && dimensions.width > 0 && dimensions.height > 0) {
        const targetX = dimensions.width / (2 * clamped);
        fgRef.current.zoom(clamped, 0);
        fgRef.current.centerAt(targetX, 0, 0);
      }
    },
    [dimensions.width, dimensions.height]
  );

  // Non-passive wheel event on container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      setZoomLevel((prev) => {
        const next = Math.min(Math.max(prev * zoomFactor, 0.4), 2.2);
        if (fgRef.current && dimensions.width > 0 && dimensions.height > 0) {
          const targetX = dimensions.width / (2 * next);
          fgRef.current.zoom(next, 0);
          fgRef.current.centerAt(targetX, 0, 0);
        }
        return next;
      });
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [dimensions.width, dimensions.height]);

  const domainOrder = useMemo(() => ["math", "discrete", "cv", "cs"], []);
  const handlePrevDomain = useCallback(() => {
    const idx = domainOrder.indexOf(activeDomainKey);
    const prevIdx = (idx - 1 + domainOrder.length) % domainOrder.length;
    rotateToDomain(domainOrder[prevIdx]);
  }, [activeDomainKey, domainOrder, rotateToDomain]);

  const handleNextDomain = useCallback(() => {
    const idx = domainOrder.indexOf(activeDomainKey);
    const nextIdx = (idx + 1) % domainOrder.length;
    rotateToDomain(domainOrder[nextIdx]);
  }, [activeDomainKey, domainOrder, rotateToDomain]);

  // Build Base 360-Degree Radial Dendrogram Dataset
  const rawGraphData = useMemo(() => {
    const nodes: RadialGraphNode[] = [];
    const links: RadialGraphLink[] = [];

    // 0. Level 0: Core Node (Feynman Matrix Hub at origin)
    nodes.push({
      id: "core-feynman",
      level: 0,
      name: "KHÔNG GIAN FEYNMAN",
      shortLabel: "FEYNMAN CORE",
      color: "#2563eb",
      r: 36,
      x: 0,
      y: 0,
      fx: 0,
      fy: 0,
      targetRadius: 0,
      targetAngle: 0,
    });

    // 1. Level 1: Domain Hubs across 360 degrees
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
        r: 20,
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

    // 2. Level 2: Field Nodes (12 fields, 3 per domain spaced across 90-degree sector)
    const fieldDefinitions: Array<{
      id: string;
      domainId: string;
      name: string;
      shortLabel: string;
      offsetAngle: number;
    }> = [
      // Math (base: 0 rad)
      { id: "field-algebra", domainId: "math", name: "Đại Số Tuyến Tính", shortLabel: "ĐSTT", offsetAngle: -0.28 },
      { id: "field-calculus", domainId: "math", name: "Giải Tích Nhiều Biến", shortLabel: "GT", offsetAngle: 0 },
      { id: "field-optimization", domainId: "math", name: "Tối Ưu Hóa Vi Phân", shortLabel: "TƯH", offsetAngle: 0.28 },
      // Discrete (base: PI/2 rad)
      { id: "field-graph-theory", domainId: "discrete", name: "Lý Thuyết Đồ Thị", shortLabel: "ĐTH", offsetAngle: -0.28 },
      { id: "field-logic", domainId: "discrete", name: "Logic & Boole", shortLabel: "LOGIC", offsetAngle: 0 },
      { id: "field-combinatorics", domainId: "discrete", name: "Tổ Hợp & Nhị Thức", shortLabel: "TỔ HỢP", offsetAngle: 0.28 },
      // CV (base: PI rad)
      { id: "field-neural-nets", domainId: "cv", name: "Mạng Tích Chập CNN", shortLabel: "CNN", offsetAngle: -0.28 },
      { id: "field-image-proc", domainId: "cv", name: "Xử Lý & Lọc Biên", shortLabel: "LỌC", offsetAngle: 0 },
      { id: "field-detection", domainId: "cv", name: "Nhận Diện & Detection", shortLabel: "YOLO", offsetAngle: 0.28 },
      // CS (base: 3PI/2 rad)
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
        color: domainCfg.color,
        r: 13,
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
          r: 7.5,
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
            r: 5,
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

            const cName = sub.requiredConcepts?.[cIdx] || `${sub.title} • Khái niệm #${cIdx + 1}`;

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
              r: 2.8,
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

  // Dynamic Projected Graph Data reacting in real-time to 360-Degree Wheel rotationAngle
  const graphData = useMemo(() => {
    const projectedNodes = rawGraphData.nodes.map((node) => {
      if (node.level === 0) return node;
      const currentAngle = (node.targetAngle ?? 0) + rotationAngle;
      const r = node.targetRadius ?? 0;
      const x = r * Math.cos(currentAngle);
      const y = r * Math.sin(currentAngle);
      return {
        ...node,
        x,
        y,
        fx: x,
        fy: y,
      };
    });

    return {
      nodes: projectedNodes,
      links: rawGraphData.links,
    };
  }, [rawGraphData, rotationAngle]);

  // Node Click handler: Select, rotate to sector, and open details
  const handleNodeClick = useCallback(
    (node: RadialGraphNode) => {
      setSelectedNode(node);
      if (node.domainId && DOMAIN_CONFIG[node.domainId] && node.domainId !== activeDomainKey) {
        rotateToDomain(node.domainId);
      }
      if (node.level === 3 || node.level === 5) {
        setIsDrawerOpen(true);
      }
    },
    [activeDomainKey, rotateToDomain]
  );

  const handleBackgroundClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleResetCamera = () => {
    applyZoom(0.75);
  };

  const handleZoomIn = () => {
    applyZoom(zoomLevel * 1.25);
  };

  const handleZoomOut = () => {
    applyZoom(zoomLevel / 1.25);
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

  // Handler when user selects a topic from search suggestions
  const handleSelectTopicFromSearch = useCallback(
    (topic: CatalogTopic) => {
      if (topic.domainId && DOMAIN_CONFIG[topic.domainId]) {
        rotateToDomain(topic.domainId);
      }
      setFilterState((prev) => ({
        ...prev,
        selectedTopicId: topic.id,
        domainId: topic.domainId,
      }));
      const found = graphData.nodes.find(
        (n) =>
          n.id === `subject-${topic.id}` ||
          n.subjectId === topic.id ||
          n.id === topic.id
      );
      if (found) {
        setSelectedNode(found);
        setIsDrawerOpen(true);
      }
    },
    [graphData.nodes, rotateToDomain]
  );

  // Pre-frame Render: Clean Light System Orbits & Segmented Glowing Rim
  const handleRenderFramePre = useCallback((ctx: CanvasRenderingContext2D, globalScale: number) => {
    ctx.save();

    // 1. Concentric Guide Orbits
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
        // Glowing Segmented Core Arc Rim
        ctx.strokeStyle = "#8299E0";
        ctx.lineWidth = 2.5 / globalScale;
        ctx.setLineDash([40 / globalScale, 8 / globalScale, 80 / globalScale, 8 / globalScale]);
        ctx.shadowColor = "rgba(130, 153, 224, 0.35)";
        ctx.shadowBlur = 8 / globalScale;
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.setLineDash([]);

        // Dynamic Sector Codes along the rim based on rotationAngle
        Object.entries(DOMAIN_CONFIG).forEach(([key, cfg]) => {
          let ang = (cfg.angle + rotationAngle) % (2 * Math.PI);
          while (ang > Math.PI) ang -= 2 * Math.PI;
          while (ang < -Math.PI) ang += 2 * Math.PI;

          // Only render if visible in the front right arc [-PI/2, PI/2]
          if (Math.abs(ang) <= Math.PI / 2 + 0.12) {
            const lx = (ORBIT_0_R - 13) * Math.cos(ang);
            const ly = (ORBIT_0_R - 13) * Math.sin(ang);
            const isCurrent = key === activeDomainKey;
            ctx.font = `bold ${(isCurrent ? 8.5 : 7.2) / globalScale}px 'Lato', sans-serif`;
            ctx.fillStyle = isCurrent ? "#8299E0" : "#5A6678";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(cfg.code, lx, ly);
          }
        });
      } else {
        // Subtle guide orbits
        ctx.strokeStyle = "rgba(130, 153, 224, 0.35)";
        ctx.lineWidth = 0.8 / globalScale;
        ctx.setLineDash([5 / globalScale, 5 / globalScale]);
        ctx.shadowBlur = 0;
        ctx.stroke();
      }
    });

    // 2. Faint Radial Sector Separators (Rotating with 360-degree wheel)
    const sectorDividers = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
    sectorDividers.forEach((div) => {
      let divAng = (div + rotationAngle) % (2 * Math.PI);
      while (divAng > Math.PI) divAng -= 2 * Math.PI;
      while (divAng < -Math.PI) divAng += 2 * Math.PI;

      if (Math.abs(divAng) <= Math.PI / 2) {
        ctx.beginPath();
        ctx.moveTo(ORBIT_0_R * Math.cos(divAng), ORBIT_0_R * Math.sin(divAng));
        ctx.lineTo((ORBIT_5_R + 25) * Math.cos(divAng), (ORBIT_5_R + 25) * Math.sin(divAng));
        ctx.strokeStyle = "rgba(130, 153, 224, 0.22)";
        ctx.lineWidth = 0.6 / globalScale;
        ctx.setLineDash([4 / globalScale, 6 / globalScale]);
        ctx.stroke();
      }
    });

    ctx.restore();
  }, [rotationAngle, activeDomainKey]);

  // Custom Node Canvas Renderer: White fill, #8299E0 border, #5A6678 text
  // On hover or select: #8299E0 fill, white border, white text
  const renderNodeCanvasObject = useCallback(
    (node: RadialGraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      // Cull nodes rotating behind core (negative X realm)
      if (node.level >= 1 && (node.x ?? 0) < -15) {
        return;
      }

      const isSelected = selectedNode?.id === node.id;
      const isHovered = hoveredNode?.id === node.id;
      const isActive = isSelected || isHovered;
      const x = node.x ?? 0;
      const y = node.y ?? 0;

      const isMatch = isNodeHighlighted(node);
      const hasActiveFilter =
        filterState.domainId !== "ALL" ||
        filterState.fieldId !== "ALL" ||
        filterState.keyword.length > 0 ||
        filterState.selectedTopicId != null;

      ctx.save();

      // Spotlight / Dimming effect based on hierarchical search
      if (hasActiveFilter && !isMatch) {
        ctx.globalAlpha = 0.14;
      } else if (hasActiveFilter && isMatch && node.level >= 1) {
        ctx.shadowColor = "#8299E0";
        ctx.shadowBlur = (isSelected ? 16 : 8) / globalScale;
      }

      // ==========================================
      // LEVEL 0: CORE NODE (KHÔNG GIAN FEYNMAN) - Bán Nguyệt Sát Mép Trái
      // ==========================================
      if (node.level === 0) {
        const r = node.r ?? 36;
        ctx.beginPath();
        // Draw exact semi-circle pointing rightward from x=0
        ctx.arc(x, y, r, -Math.PI / 2, Math.PI / 2);
        ctx.closePath();
        ctx.fillStyle = isActive ? "#8299E0" : "#ffffff";
        if (isActive) {
          ctx.shadowColor = "rgba(130, 153, 224, 0.4)";
          ctx.shadowBlur = 12 / globalScale;
        } else {
          ctx.shadowColor = "rgba(130, 153, 224, 0.2)";
          ctx.shadowBlur = 8 / globalScale;
        }
        ctx.fill();

        ctx.strokeStyle = isActive ? "#ffffff" : "#8299E0";
        ctx.lineWidth = 2.5 / globalScale;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Subtitle & Core Name (Aligned cleanly to the right of x=0)
        ctx.font = `bold ${6 / globalScale}px 'Lato', sans-serif`;
        ctx.fillStyle = isActive ? "#ffffff" : "#8299E0";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText("ELISE MATRIX", x + 8 / globalScale, y - 6 / globalScale);

        ctx.font = `900 ${8 / globalScale}px 'Lato', sans-serif`;
        ctx.fillStyle = isActive ? "#ffffff" : "#5A6678";
        ctx.fillText("FEYNMAN", x + 8 / globalScale, y + 5 / globalScale);

        ctx.restore();
        return;
      }

      // ==========================================
      // LEVEL 1: DOMAIN HUBS (Nhóm Ngành)
      // ==========================================
      if (node.level === 1) {
        const r = isActive ? 22 : (node.r ?? 20);

        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = isActive ? "#8299E0" : "#ffffff";
        if (isActive) {
          ctx.shadowColor = "rgba(130, 153, 224, 0.45)";
          ctx.shadowBlur = (isSelected ? 14 : 8) / globalScale;
        }
        ctx.fill();

        ctx.strokeStyle = isActive ? "#ffffff" : "#8299E0";
        ctx.lineWidth = (isActive ? 2.5 : 2) / globalScale;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Domain Symbol Icon
        ctx.font = `bold ${11 / globalScale}px 'Lato', sans-serif`;
        ctx.fillStyle = isActive ? "#ffffff" : "#5A6678";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.shortLabel || "∑", x, y);

        // Tooltip / Title text below domain hub
        ctx.font = `bold ${8.5 / globalScale}px 'Lato', sans-serif`;
        ctx.fillStyle = isActive ? "#8299E0" : "#5A6678";
        ctx.fillText(node.name, x, y + r + 11 / globalScale);

        ctx.restore();
        return;
      }

      // ==========================================
      // LEVEL 2: FIELD NODES (Ngành Chuyên Môn)
      // ==========================================
      if (node.level === 2) {
        const r = isActive ? 15 : (node.r ?? 13);

        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = isActive ? "#8299E0" : "#ffffff";
        if (isActive) {
          ctx.shadowColor = "rgba(130, 153, 224, 0.4)";
          ctx.shadowBlur = 8 / globalScale;
        }
        ctx.fill();

        ctx.strokeStyle = isActive ? "#ffffff" : "#8299E0";
        ctx.lineWidth = (isActive ? 2.4 : 1.8) / globalScale;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Abbreviation
        ctx.font = `900 ${7 / globalScale}px 'Lato', sans-serif`;
        ctx.fillStyle = isActive ? "#ffffff" : "#5A6678";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.shortLabel || "", x, y);

        ctx.restore();
        return;
      }

      // ==========================================
      // LEVEL 3: SUBJECT NODES (Môn Học)
      // ==========================================
      if (node.level === 3) {
        const r = isActive ? 12 : (node.r ?? 7.5);

        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = isActive ? "#8299E0" : "#ffffff";
        if (isActive) {
          ctx.shadowColor = "rgba(130, 153, 224, 0.45)";
          ctx.shadowBlur = 10 / globalScale;
        }
        ctx.fill();

        ctx.strokeStyle = isActive ? "#ffffff" : "#8299E0";
        ctx.lineWidth = (isActive ? 2.2 : 1.5) / globalScale;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Inner indicator dot
        ctx.beginPath();
        ctx.arc(x, y, (isActive ? 2.5 : 1.8) / globalScale, 0, 2 * Math.PI);
        ctx.fillStyle = isActive ? "#ffffff" : "#8299E0";
        ctx.fill();

        // Subject Name Pill beside node
        const displayText =
          !isActive && node.name.length > 15
            ? node.name.slice(0, 14) + "…"
            : node.name;

        ctx.font = isActive
          ? `bold ${8 / globalScale}px 'Lato', sans-serif`
          : `600 ${6.8 / globalScale}px 'Lato', sans-serif`;

        const textMetrics = ctx.measureText(displayText);
        const textWidth = textMetrics.width;
        const textHeight = (isActive ? 13 : 10) / globalScale;
        const textX = x + r + 4 / globalScale;
        const textY = y;

        if (isActive) {
          // Highlight badge for active/selected node: pops cleanly over other layers
          ctx.save();
          ctx.shadowColor = "rgba(130, 153, 224, 0.35)";
          ctx.shadowBlur = 6 / globalScale;
          ctx.fillStyle = "#8299E0";
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(
              textX - 2 / globalScale,
              textY - textHeight / 2,
              textWidth + 8 / globalScale,
              textHeight,
              textHeight / 2
            );
          } else {
            ctx.rect(
              textX - 2 / globalScale,
              textY - textHeight / 2,
              textWidth + 8 / globalScale,
              textHeight
            );
          }
          ctx.fill();
          ctx.restore();

          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(displayText, textX + 2 / globalScale, textY);
        } else {
          // Soft protective backdrop pill to prevent line bleed through
          ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(
              textX - 2 / globalScale,
              textY - textHeight / 2,
              textWidth + 4 / globalScale,
              textHeight,
              3 / globalScale
            );
          } else {
            ctx.rect(
              textX - 2 / globalScale,
              textY - textHeight / 2,
              textWidth + 4 / globalScale,
              textHeight
            );
          }
          ctx.fill();

          ctx.fillStyle = "#5A6678";
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(displayText, textX, textY);
        }

        ctx.restore();
        return;
      }

      // ==========================================
      // LEVEL 4: TOPIC GROUP NODES (Nhóm Kiến Thức)
      // ==========================================
      if (node.level === 4) {
        const r = isActive ? 7 : (node.r ?? 5);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = isActive ? "#8299E0" : "#ffffff";
        if (isActive) {
          ctx.shadowColor = "rgba(130, 153, 224, 0.4)";
          ctx.shadowBlur = 6 / globalScale;
        }
        ctx.fill();

        ctx.strokeStyle = isActive ? "#ffffff" : "#8299E0";
        ctx.lineWidth = (isActive ? 1.8 : 1.2) / globalScale;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.font = `bold ${5 / globalScale}px 'Lato', sans-serif`;
        ctx.fillStyle = isActive ? "#ffffff" : "#5A6678";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.shortLabel || "", x, y);

        ctx.restore();
        return;
      }

      // ==========================================
      // LEVEL 5: MICRO-CONCEPT LEAVES (Chấm Tri Thức)
      // ==========================================
      if (node.level === 5) {
        const r = isActive ? 4.5 : (node.r ?? 2.8);

        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = isActive ? "#8299E0" : "#ffffff";
        if (isActive) {
          ctx.shadowColor = "rgba(130, 153, 224, 0.5)";
          ctx.shadowBlur = 6 / globalScale;
        }
        ctx.fill();

        ctx.strokeStyle = isActive ? "#ffffff" : "#8299E0";
        ctx.lineWidth = (isActive ? 1.4 : 0.8) / globalScale;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.restore();
        return;
      }

      ctx.restore();
    },
    [selectedNode, hoveredNode, filterState, isNodeHighlighted]
  );

  // Link Canvas Renderer: Radial Tangent Fiber Curves with dashed/solid #8299E0
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

      // Cull links rotating behind core (both endpoints in hidden hemisphere)
      if ((source.level ?? 0) >= 1 && (source.x ?? 0) < -15 && (target.x ?? 0) < -15) {
        return;
      }

      const isConnectedToSelected =
        selectedNode != null &&
        (source.id === selectedNode.id || target.id === selectedNode.id);
      const isConnectedToHovered =
        hoveredNode != null &&
        (source.id === hoveredNode.id || target.id === hoveredNode.id);
      const isConnected = isConnectedToSelected || isConnectedToHovered;

      const isSourceMatch = isNodeHighlighted(source);
      const isTargetMatch = isNodeHighlighted(target);
      const hasActiveFilter =
        filterState.domainId !== "ALL" ||
        filterState.fieldId !== "ALL" ||
        filterState.keyword.length > 0 ||
        filterState.selectedTopicId != null;

      // Radial Fiber Bézier Curve (Rotationally invariant around core 0,0)
      const srcR = Math.hypot(source.x, source.y);
      const tgtR = Math.hypot(target.x, target.y);

      let cp1x: number;
      let cp1y: number;
      let cp2x: number;
      let cp2y: number;

      if (srcR < 2) {
        // Source is core center (0,0)
        cp1x = target.x * 0.35;
        cp1y = target.y * 0.35;
        cp2x = target.x * 0.70;
        cp2y = target.y * 0.70;
      } else {
        const dr = Math.max(10, tgtR - srcR);
        cp1x = source.x + (source.x / srcR) * dr * 0.45;
        cp1y = source.y + (source.y / srcR) * dr * 0.45;
        cp2x = target.x - (target.x / tgtR) * dr * 0.45;
        cp2y = target.y - (target.y / tgtR) * dr * 0.45;
      }

      ctx.save();

      if (hasActiveFilter && (!isSourceMatch || !isTargetMatch)) {
        ctx.globalAlpha = 0.08;
      }

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, target.x, target.y);

      if (isConnected) {
        // Hover/Selected state: nét liền màu #8299E0
        ctx.strokeStyle = "#8299E0";
        ctx.lineWidth = 2.2 / globalScale;
        ctx.setLineDash([]);
        ctx.shadowColor = "rgba(130, 153, 224, 0.45)";
        ctx.shadowBlur = 6 / globalScale;
      } else {
        // Normal state: nét cắt khúc màu #8299E0
        ctx.strokeStyle = "rgba(130, 153, 224, 0.75)";
        ctx.lineWidth = 1 / globalScale;
        ctx.setLineDash([4 / globalScale, 4 / globalScale]);
        ctx.shadowBlur = 0;
      }

      ctx.stroke();
      ctx.restore();
    },
    [selectedNode, hoveredNode, filterState, isNodeHighlighted]
  );

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 space-y-2">
      {/* 3-Level Hierarchical Search Toolbar (Directly beneath Topbar) */}
      <TopicHierarchySearch
        onFilterChange={setFilterState}
        onSelectTopic={handleSelectTopicFromSearch}
      />

      {/* Main Interactive ForceGraph2D Canvas Container */}
      <div
        ref={containerRef}
        className="relative w-full flex-1 h-full min-h-0 bg-[#f8fafc] rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden select-none cursor-default"
      >
      {/* 360-Degree Rotary Domain Wheel Navigator */}
      <div className="absolute top-4 left-4 sm:left-6 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2 py-1.5 rounded-2xl border border-slate-200/90 shadow-md">
        <button
          onClick={handlePrevDomain}
          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          title="Xoay sang nhóm ngành trước"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-slate-200 mx-0.5" />

        {domainOrder.map((dKey) => {
          const cfg = DOMAIN_CONFIG[dKey];
          const isActive = activeDomainKey === dKey;
          return (
            <button
              key={dKey}
              onClick={() => rotateToDomain(dKey)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer",
                isActive
                  ? "bg-[#8299E0] text-white shadow-sm shadow-[#8299E0]/30 scale-[1.02]"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <span className="text-sm leading-none">{cfg.symbol}</span>
              <span className="tracking-wide">{cfg.code}</span>
            </button>
          );
        })}

        <div className="h-4 w-px bg-slate-200 mx-0.5" />

        <button
          onClick={handleNextDomain}
          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          title="Xoay sang nhóm ngành tiếp theo"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 1. Main Interactive ForceGraph2D Canvas */}
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width || 800}
        height={dimensions.height || 600}
        graphData={graphData}
        backgroundColor="#f8fafc"
        nodeId="id"
        nodeCanvasObject={renderNodeCanvasObject as any}
        linkCanvasObject={renderLinkCanvasObject as any}
        onRenderFramePre={handleRenderFramePre}
        onNodeClick={handleNodeClick as any}
        onNodeHover={(node) => setHoveredNode((node as RadialGraphNode) || null)}
        onBackgroundClick={handleBackgroundClick}
        onEngineStop={() => pinCamera()}
        enableNodeDrag={false}
        enableZoomInteraction={false}
        enablePanInteraction={false}
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
            title="Căn lại góc nhìn chuẩn"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
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
    </div>
  );
};

export default TopicKnowledgeGraph;
