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
import TopicHierarchySearch, { SearchFilterState } from "@/components/topics/TopicHierarchySearch";

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

// Constellation Layout Configuration (Satellite Network 360° Infographic)
const DOMAIN_CONFIG: Record<
  string,
  {
    code: string;
    name: string;
    symbol: string;
    angle: number;
    dist: number;
  }
> = {
  math: {
    code: "MATH",
    name: "Toán Cao Cấp & Đại Số",
    symbol: "∑",
    angle: -2.356, // -135° (Top-Left quadrant)
    dist: 270,
  },
  discrete: {
    code: "DISC",
    name: "Toán Rời Rạc & Đồ Thị",
    symbol: "⑂",
    angle: -0.785, // -45° (Top-Right quadrant)
    dist: 270,
  },
  cv: {
    code: "CV",
    name: "Thị Giác Máy Tính & AI",
    symbol: "👁",
    angle: 0.785, // +45° (Bottom-Right quadrant)
    dist: 270,
  },
  cs: {
    code: "SYS",
    name: "Hệ Thống & Khoa Học Máy Tính",
    symbol: "⚙",
    angle: 2.356, // +135° (Bottom-Left quadrant)
    dist: 270,
  },
};

// Deterministic topic-to-field mapping: guarantees balanced 3 to 4 topics per field (no cramming/overlap)
const TOPIC_TO_FIELD: Record<string, string> = {
  // Math (10 topics)
  "math-linear-transformations": "field-algebra",
  "math-eigenvalues-eigenvectors": "field-algebra",
  "math-svd": "field-algebra",
  "math-gauss-jordan-elimination": "field-algebra",
  "math-taylor-series": "field-calculus",
  "math-fourier-transform": "field-calculus",
  "math-double-integrals-green": "field-calculus",
  "math-gradient-descent": "field-optimization",
  "math-hessian-saddle-points": "field-optimization",
  "math-gram-schmidt": "field-optimization",

  // Discrete (10 topics)
  "discrete-bfs-dfs-graph-traversal": "field-graph-theory",
  "discrete-dijkstra-algorithm": "field-graph-theory",
  "discrete-minimum-spanning-tree": "field-graph-theory",
  "discrete-euler-hamilton-cycles": "field-graph-theory",
  "discrete-propositional-logic-boolean": "field-logic",
  "discrete-equivalence-relations-partitions": "field-logic",
  "discrete-graph-coloring-four-color": "field-logic",
  "discrete-combinatorics-binomial": "field-combinatorics",
  "discrete-pigeonhole-principle": "field-combinatorics",
  "discrete-mathematical-induction-recurrence": "field-combinatorics",

  // CV (10 topics)
  "cv-edge-detection-canny-sobel": "field-image-proc",
  "cv-color-spaces-morphology": "field-image-proc",
  "cv-sift-harris-corner": "field-image-proc",
  "cv-yolo-object-detection": "field-detection",
  "cv-hough-transform": "field-detection",
  "cv-optical-flow-lucas-kanade": "field-detection",
  "cv-convolution-cnn": "field-neural-nets",
  "cv-resnet-skip-connections": "field-neural-nets",
  "cv-unet-semantic-segmentation": "field-neural-nets",
  "cv-vision-transformers-vit": "field-neural-nets",

  // CS Systems (10 topics)
  "cs-pointers-memory-management": "field-os",
  "cs-process-vs-thread-concurrency": "field-os",
  "cs-deadlock-coffman-conditions": "field-os",
  "cs-virtual-memory-paging": "field-os",
  "cs-btree-database-indexing": "field-db",
  "cs-hash-tables-collision-resolution": "field-db",
  "cs-docker-containers-namespaces": "field-db",
  "cs-cap-theorem-distributed-systems": "field-dist-sys",
  "cs-tcp-3way-handshake": "field-dist-sys",
  "cs-message-queues-event-driven": "field-dist-sys",
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

  // Hierarchical Search Filter State (Phương án C - Hybrid Search)
  const [filterState, setFilterState] = useState<SearchFilterState>({
    domainId: "ALL",
    fieldId: "ALL",
    keyword: "",
    selectedTopicId: null,
  });

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

  // Center Camera smoothly on (x, y) with specified zoom
  const centerCamera = useCallback((x: number = 0, y: number = 0, zoom: number = 0.82, duration: number = 700) => {
    if (fgRef.current) {
      fgRef.current.centerAt(x, y, duration);
      fgRef.current.zoom(zoom, duration);
    }
  }, []);

  // Initial centering on (0, 0) when mounted
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0 && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      centerCamera(0, 0, 0.82, 0);
      const t1 = setTimeout(() => centerCamera(0, 0, 0.82, 0), 100);
      const t2 = setTimeout(() => centerCamera(0, 0, 0.82, 0), 300);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [dimensions.width, dimensions.height, centerCamera]);

  // Handle Zoom In / Zoom Out / Reset
  const handleResetCamera = () => {
    setZoomLevel(0.82);
    centerCamera(0, 0, 0.82, 700);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => {
      const next = Math.min(prev * 1.25, 2.5);
      fgRef.current?.zoom(next, 300);
      return next;
    });
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const next = Math.max(prev / 1.25, 0.35);
      fgRef.current?.zoom(next, 300);
      return next;
    });
  };

  // Build Hierarchical Constellation Dataset (Satellites Network 360°)
  const graphData = useMemo(() => {
    const nodes: RadialGraphNode[] = [];
    const links: RadialGraphLink[] = [];

    // 0. Level 0: Core Node (Feynman Matrix Hub at origin)
    nodes.push({
      id: "core-feynman",
      level: 0,
      name: "KHÔNG GIAN FEYNMAN",
      shortLabel: "FEYNMAN CORE",
      r: 46,
      x: 0,
      y: 0,
      fx: 0,
      fy: 0,
      targetRadius: 0,
      targetAngle: 0,
    });

    // 1. Level 1: Domain Hubs (4 Quadrants)
    const domainKeys = ["math", "discrete", "cv", "cs"];
    domainKeys.forEach((dKey) => {
      const cfg = DOMAIN_CONFIG[dKey];
      const x = cfg.dist * Math.cos(cfg.angle);
      const y = cfg.dist * Math.sin(cfg.angle);

      const dNode: RadialGraphNode = {
        id: `domain-${dKey}`,
        level: 1,
        domainId: dKey,
        name: cfg.name,
        shortLabel: cfg.symbol,
        r: 24,
        x,
        y,
        fx: x,
        fy: y,
        targetRadius: cfg.dist,
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

    // 2. Level 2: Field Nodes (12 fields, 3 per domain radiating outward with ample spread)
    const fieldDefinitions: Array<{
      id: string;
      domainId: string;
      name: string;
      shortLabel: string;
      offsetAngle: number;
      dist: number;
    }> = [
      // Math
      { id: "field-algebra", domainId: "math", name: "Đại Số Tuyến Tính", shortLabel: "ĐSTT", offsetAngle: -0.46, dist: 140 },
      { id: "field-calculus", domainId: "math", name: "Giải Tích Nhiều Biến", shortLabel: "GT", offsetAngle: 0, dist: 210 },
      { id: "field-optimization", domainId: "math", name: "Tối Ưu Hóa Vi Phân", shortLabel: "TƯH", offsetAngle: 0.46, dist: 140 },
      // Discrete
      { id: "field-graph-theory", domainId: "discrete", name: "Lý Thuyết Đồ Thị", shortLabel: "ĐTH", offsetAngle: -0.46, dist: 140 },
      { id: "field-logic", domainId: "discrete", name: "Logic & Boole", shortLabel: "LOGIC", offsetAngle: 0, dist: 210 },
      { id: "field-combinatorics", domainId: "discrete", name: "Tổ Hợp & Nhị Thức", shortLabel: "TỔ HỢP", offsetAngle: 0.46, dist: 140 },
      // CV
      { id: "field-image-proc", domainId: "cv", name: "Xử Lý & Lọc Biên", shortLabel: "LỌC", offsetAngle: -0.46, dist: 140 },
      { id: "field-neural-nets", domainId: "cv", name: "Mạng Tích Chập CNN", shortLabel: "CNN", offsetAngle: 0, dist: 210 },
      { id: "field-detection", domainId: "cv", name: "Nhận Diện & Detection", shortLabel: "YOLO", offsetAngle: 0.46, dist: 140 },
      // CS
      { id: "field-os", domainId: "cs", name: "Hệ Điều Hành & Con Trỏ", shortLabel: "HĐH", offsetAngle: -0.46, dist: 140 },
      { id: "field-db", domainId: "cs", name: "Cơ Sở Dữ Liệu B-Tree", shortLabel: "CSDL", offsetAngle: 0, dist: 210 },
      { id: "field-dist-sys", domainId: "cs", name: "Hệ Thống Phân Tán", shortLabel: "PHÂN TÁN", offsetAngle: 0.46, dist: 140 },
    ];

    fieldDefinitions.forEach((f) => {
      const domainCfg = DOMAIN_CONFIG[f.domainId];
      const domainX = domainCfg.dist * Math.cos(domainCfg.angle);
      const domainY = domainCfg.dist * Math.sin(domainCfg.angle);
      const angle = domainCfg.angle + f.offsetAngle;
      const x = domainX + f.dist * Math.cos(angle);
      const y = domainY + f.dist * Math.sin(angle);

      const fNode: RadialGraphNode = {
        id: f.id,
        level: 2,
        domainId: f.domainId,
        name: f.name,
        shortLabel: f.shortLabel,
        r: 14,
        x,
        y,
        fx: x,
        fy: y,
        targetRadius: f.dist,
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

    // Helper: Map subject to field deterministically
    const assignSubjectToField = (topicId: string, domainId: string): string => {
      if (TOPIC_TO_FIELD[topicId]) return TOPIC_TO_FIELD[topicId];
      if (domainId === "math") return "field-algebra";
      if (domainId === "discrete") return "field-graph-theory";
      if (domainId === "cv") return "field-neural-nets";
      if (domainId === "cs") return "field-os";
      return "field-algebra";
    };

    // 3. Level 3: Subject Nodes & Colinear Satellites (Zero-collision ray architecture)
    fieldDefinitions.forEach((f) => {
      const domainCfg = DOMAIN_CONFIG[f.domainId];
      const domainX = domainCfg.dist * Math.cos(domainCfg.angle);
      const domainY = domainCfg.dist * Math.sin(domainCfg.angle);
      const fieldAngle = domainCfg.angle + f.offsetAngle;
      const fx = domainX + f.dist * Math.cos(fieldAngle);
      const fy = domainY + f.dist * Math.sin(fieldAngle);

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

      const numSubs = subjectsToRender.length;
      const angleOffsets =
        numSubs === 3
          ? [-0.26, 0, 0.26]
          : numSubs === 4
          ? [-0.36, -0.12, 0.12, 0.36]
          : [0];

      subjectsToRender.forEach((sub: any, sIdx: number) => {
        const subOffset = angleOffsets[sIdx] ?? (sIdx - (numSubs - 1) / 2) * 0.22;
        const subAngle = fieldAngle + subOffset;
        // Staggered distance to ensure neighboring subjects differ by >= 65px radially
        const subDist = 90 + (sIdx % 3) * 65;
        const sx = fx + subDist * Math.cos(subAngle);
        const sy = fy + subDist * Math.sin(subAngle);

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
          r: 8.5,
          x: sx,
          y: sy,
          fx: sx,
          fy: sy,
          targetRadius: subDist,
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

        // 4. Level 4: Topic Group Nodes (A, B) - strung colinearly along the needle ray
        const modOffsets = [28, 48];
        const gNodeIds: string[] = [];
        for (let gIdx = 0; gIdx < 2; gIdx++) {
          const gDist = modOffsets[gIdx];
          const gx = sx + gDist * Math.cos(subAngle);
          const gy = sy + gDist * Math.sin(subAngle);
          const gLetter = String.fromCharCode(65 + gIdx);
          const gId = `group-${sub.id}-${gIdx}`;
          gNodeIds.push(gId);

          const gNode: RadialGraphNode = {
            id: gId,
            level: 4,
            domainId: sub.domainId,
            fieldId: f.id,
            subjectId: sub.id,
            name: `${sub.title} • Module ${gLetter}`,
            shortLabel: gLetter,
            r: 5,
            x: gx,
            y: gy,
            fx: gx,
            fy: gy,
            targetRadius: gDist,
            targetAngle: subAngle,
          };

          nodes.push(gNode);
          links.push({
            id: `link-sub-${subNode.id}-${gNode.id}`,
            source: gIdx === 0 ? subNode.id : gNodeIds[0],
            target: gNode.id,
            isHierarchy: true,
          });
        }

        // 5. Level 5: Micro-concept Leaves - strung colinearly along the needle ray
        const cOffsets = [64, 74, 84];
        let prevConceptId = gNodeIds[1];
        for (let cIdx = 0; cIdx < 3; cIdx++) {
          const cDist = cOffsets[cIdx];
          const cx = sx + cDist * Math.cos(subAngle);
          const cy = sy + cDist * Math.sin(subAngle);

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
          const cId = `concept-${sub.id}-${cIdx}`;

          const cNode: RadialGraphNode = {
            id: cId,
            level: 5,
            domainId: sub.domainId,
            fieldId: f.id,
            subjectId: sub.id,
            name: cName,
            shortLabel: "•",
            status: cStatus,
            clarityScore: cStatus === "MASTERED" ? 92 : cStatus === "GAP" ? 48 : cStatus === "ACTIVE" ? 75 : 0,
            r: 2.5,
            x: cx,
            y: cy,
            fx: cx,
            fy: cy,
            targetRadius: cDist,
            targetAngle: subAngle,
            summary: sub.summary,
          };

          nodes.push(cNode);
          links.push({
            id: `link-c-${prevConceptId}-${cId}`,
            source: prevConceptId,
            target: cId,
            isHierarchy: true,
          });
          prevConceptId = cId;
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

  // Node Click handler: Select, fly camera smoothly to node, and open details
  const handleNodeClick = useCallback(
    (node: RadialGraphNode) => {
      setSelectedNode(node);
      if (node.x != null && node.y != null) {
        centerCamera(node.x, node.y, Math.max(zoomLevel, 1.0), 650);
      }
      if (node.level === 3 || node.level === 5) {
        setIsDrawerOpen(true);
      }
    },
    [centerCamera, zoomLevel]
  );

  const handleBackgroundClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

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
        if (found.x != null && found.y != null) {
          centerCamera(found.x, found.y, 1.15, 750);
        }
        setIsDrawerOpen(true);
      }
    },
    [graphData.nodes, centerCamera]
  );

  // Auto-center camera when a domain filter is selected from search bar
  useEffect(() => {
    if (filterState.domainId && filterState.domainId !== "ALL") {
      const dNode = graphData.nodes.find((n) => n.id === `domain-${filterState.domainId}`);
      if (dNode && dNode.x != null && dNode.y != null) {
        centerCamera(dNode.x, dNode.y, 1.05, 800);
      }
    } else if (filterState.domainId === "ALL" && !filterState.selectedTopicId && !filterState.keyword) {
      centerCamera(0, 0, 0.82, 800);
    }
  }, [filterState.domainId, filterState.selectedTopicId, filterState.keyword, graphData.nodes, centerCamera]);

  // Pre-frame Render: 360° Astrolabe / Satellite Radar Orbits & Directional Rays
  const handleRenderFramePre = useCallback((ctx: CanvasRenderingContext2D, globalScale: number) => {
    ctx.save();

    // 1. Concentric Guide Radar Orbits (Full 360° Circles centered at origin)
    const orbits = [90, 260, 410, 560];
    orbits.forEach((r) => {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(130, 153, 224, 0.22)";
      ctx.lineWidth = 0.8 / globalScale;
      ctx.setLineDash([4 / globalScale, 6 / globalScale]);
      ctx.stroke();
    });

    // 2. Cardinal & Diagonal Astronomical Axes (8 Rays from radius 90 to 620)
    const axisAngles = [
      0,
      Math.PI / 4,
      Math.PI / 2,
      (3 * Math.PI) / 4,
      Math.PI,
      (-3 * Math.PI) / 4,
      -Math.PI / 2,
      -Math.PI / 4,
    ];
    axisAngles.forEach((ang) => {
      ctx.beginPath();
      ctx.moveTo(90 * Math.cos(ang), 90 * Math.sin(ang));
      ctx.lineTo(620 * Math.cos(ang), 620 * Math.sin(ang));
      ctx.strokeStyle = "rgba(130, 153, 224, 0.16)";
      ctx.lineWidth = 0.6 / globalScale;
      ctx.setLineDash([3 / globalScale, 8 / globalScale]);
      ctx.stroke();
    });

    ctx.restore();
  }, []);

  // Custom Node Canvas Renderer: White fill, #8299E0 border, #5A6678 text
  // On hover or select: #8299E0 fill, white border, white text
  const renderNodeCanvasObject = useCallback(
    (node: RadialGraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
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
      // LEVEL 0: CORE NODE (KHÔNG GIAN FEYNMAN) - 360° Circular Center Hub
      // ==========================================
      if (node.level === 0) {
        const r = node.r ?? 46;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = isActive ? "#8299E0" : "#ffffff";
        if (isActive) {
          ctx.shadowColor = "rgba(130, 153, 224, 0.4)";
          ctx.shadowBlur = 14 / globalScale;
        } else {
          ctx.shadowColor = "rgba(130, 153, 224, 0.22)";
          ctx.shadowBlur = 8 / globalScale;
        }
        ctx.fill();

        ctx.strokeStyle = isActive ? "#ffffff" : "#8299E0";
        ctx.lineWidth = 2.5 / globalScale;
        ctx.stroke();

        // Inner delicate concentric circle
        ctx.beginPath();
        ctx.arc(x, y, r - 6, 0, 2 * Math.PI);
        ctx.strokeStyle = isActive ? "rgba(255, 255, 255, 0.5)" : "rgba(130, 153, 224, 0.4)";
        ctx.lineWidth = 1 / globalScale;
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Subtitle & Core Name (Centered)
        ctx.font = `bold ${6.5 / globalScale}px 'Lato', sans-serif`;
        ctx.fillStyle = isActive ? "#ffffff" : "#8299E0";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("ELISE MATRIX", x, y - 12 / globalScale);

        ctx.font = `900 ${8.5 / globalScale}px 'Lato', sans-serif`;
        ctx.fillStyle = isActive ? "#ffffff" : "#5A6678";
        ctx.fillText("KHÔNG GIAN", x, y - 1 / globalScale);

        ctx.font = `900 ${9.5 / globalScale}px 'Lato', sans-serif`;
        ctx.fillStyle = isActive ? "#ffffff" : "#5A6678";
        ctx.fillText("FEYNMAN", x, y + 11 / globalScale);

        ctx.restore();
        return;
      }

      // ==========================================
      // LEVEL 1: DOMAIN HUBS (Nhóm Ngành)
      // ==========================================
      if (node.level === 1) {
        const r = isActive ? 26 : (node.r ?? 24);

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
        ctx.font = `bold ${13 / globalScale}px 'Lato', sans-serif`;
        ctx.fillStyle = isActive ? "#ffffff" : "#5A6678";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.shortLabel || "∑", x, y);

        // Tooltip / Title text below domain hub in a neat pill
        ctx.font = `bold ${7.5 / globalScale}px 'Lato', sans-serif`;
        const textMetrics = ctx.measureText(node.name);
        const tw = textMetrics.width;
        const th = 13 / globalScale;
        const ty = y + r + 13 / globalScale;

        ctx.fillStyle = isActive ? "#8299E0" : "rgba(255, 255, 255, 0.92)";
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x - tw / 2 - 4 / globalScale, ty - th / 2, tw + 8 / globalScale, th, 4 / globalScale);
        } else {
          ctx.rect(x - tw / 2 - 4 / globalScale, ty - th / 2, tw + 8 / globalScale, th);
        }
        ctx.fill();
        ctx.strokeStyle = isActive ? "#ffffff" : "rgba(130, 153, 224, 0.4)";
        ctx.lineWidth = 0.8 / globalScale;
        ctx.stroke();

        ctx.fillStyle = isActive ? "#ffffff" : "#5A6678";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.name, x, ty);

        ctx.restore();
        return;
      }

      // ==========================================
      // LEVEL 2: FIELD NODES (Ngành Chuyên Môn)
      // ==========================================
      if (node.level === 2) {
        const r = isActive ? 16 : (node.r ?? 14);

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
        ctx.font = `900 ${6.5 / globalScale}px 'Lato', sans-serif`;
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
        const r = isActive ? 12 : (node.r ?? 8.5);

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

        // Subject Name Pill placed at the ray tip (faces outward into empty space, 0% overlap)
        const subAngle = node.targetAngle ?? Math.atan2(y, x);
        const tipDist = 96 / globalScale;
        const tipX = x + tipDist * Math.cos(subAngle);
        const tipY = y + tipDist * Math.sin(subAngle);
        const isRight = tipX >= 0;

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
        const textX = isRight ? tipX + 4 / globalScale : tipX - 4 / globalScale;
        const textY = tipY;
        const pillX = isRight ? textX - 2 / globalScale : textX - textWidth - 6 / globalScale;

        if (isActive) {
          // Highlight badge at the ray tip
          ctx.save();
          ctx.shadowColor = "rgba(130, 153, 224, 0.35)";
          ctx.shadowBlur = 6 / globalScale;
          ctx.fillStyle = "#8299E0";
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(
              pillX,
              textY - textHeight / 2,
              textWidth + 8 / globalScale,
              textHeight,
              textHeight / 2
            );
          } else {
            ctx.rect(
              pillX,
              textY - textHeight / 2,
              textWidth + 8 / globalScale,
              textHeight
            );
          }
          ctx.fill();
          ctx.restore();

          ctx.fillStyle = "#ffffff";
          ctx.textAlign = isRight ? "left" : "right";
          ctx.textBaseline = "middle";
          ctx.fillText(displayText, isRight ? textX + 2 / globalScale : textX - 2 / globalScale, textY);

          // Also draw floating focal title directly above the subject node for instant visual confirmation
          const focalY = y - r - 8 / globalScale;
          const focalMetrics = ctx.measureText(node.name);
          const fw = focalMetrics.width;
          const fh = 14 / globalScale;

          ctx.fillStyle = "#8299E0";
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(x - fw / 2 - 5 / globalScale, focalY - fh / 2, fw + 10 / globalScale, fh, 4 / globalScale);
          } else {
            ctx.rect(x - fw / 2 - 5 / globalScale, focalY - fh / 2, fw + 10 / globalScale, fh);
          }
          ctx.fill();

          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(node.name, x, focalY);
        } else {
          // Soft protective backdrop pill at the ray tip
          ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(
              pillX,
              textY - textHeight / 2,
              textWidth + 6 / globalScale,
              textHeight,
              3 / globalScale
            );
          } else {
            ctx.rect(
              pillX,
              textY - textHeight / 2,
              textWidth + 6 / globalScale,
              textHeight
            );
          }
          ctx.fill();

          ctx.strokeStyle = "rgba(226, 232, 240, 0.85)";
          ctx.lineWidth = 0.6 / globalScale;
          ctx.stroke();

          ctx.fillStyle = "#5A6678";
          ctx.textAlign = isRight ? "left" : "right";
          ctx.textBaseline = "middle";
          ctx.fillText(displayText, textX, textY);
        }

        ctx.restore();
        return;
      }

      // ==========================================
      // LEVEL 4: TOPIC GROUP NODES (Nhóm Kiến Thức A, B)
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

        ctx.font = `bold ${5.5 / globalScale}px 'Lato', sans-serif`;
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
        const r = isActive ? 4 : (node.r ?? 2.5);

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

  // Link Canvas Renderer: Straight Needle Rays (Constellation Style)
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

      ctx.save();

      if (hasActiveFilter && (!isSourceMatch || !isTargetMatch)) {
        ctx.globalAlpha = 0.08;
      }

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);

      if (isConnected) {
        // Active/Hovered: solid bold needle line in #8299E0 with soft glow
        ctx.strokeStyle = "#8299E0";
        ctx.lineWidth = 2.2 / globalScale;
        ctx.setLineDash([]);
        ctx.shadowColor = "rgba(130, 153, 224, 0.45)";
        ctx.shadowBlur = 6 / globalScale;
      } else {
        // Normal: clean dashed ray line
        ctx.strokeStyle = link.isCrossLink
          ? "rgba(130, 153, 224, 0.35)"
          : "rgba(130, 153, 224, 0.65)";
        ctx.lineWidth = 0.9 / globalScale;
        ctx.setLineDash(
          link.isCrossLink
            ? [2 / globalScale, 4 / globalScale]
            : [3 / globalScale, 3 / globalScale]
        );
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
        enableNodeDrag={false}
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
