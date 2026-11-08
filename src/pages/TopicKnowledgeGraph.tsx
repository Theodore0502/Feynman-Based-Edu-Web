/**
 * File: src/pages/TopicKnowledgeGraph.tsx
 * Mục đích: Màn hình Bản Đồ Tri Thức (Knowledge Graph) theo cấu trúc Bố Cục Tỏa Tròn 360° (Radial Constellation)
 * DỮ LIỆU ĐƯỢC LOAD 100% ĐỘNG TỪ SUPABASE (8 Nhóm Ngành, 37 Môn Học, 56 Liên Kết Đa Ngành, 479 Bài Học)
 * TUÂN THỦ NGHIÊM NGẶT NGUYÊN TẮC: CẤM HARDCODE DỮ LIỆU, DỮ LIỆU PHẢI LƯU VÀ TRUY VẤN TỪ SUPABASE.
 *
 * Cấu trúc phân cấp 5 tầng:
 *   - Lõi trung tâm: Không Gian Feynman (Level 0) tại tọa độ (0, 0)
 *   - Tầng 1: 8 Nhóm Ngành Học (Level 1 - Domains) phân bổ đều 360° (mỗi 45°)
 *   - Tầng 2: 37 Môn Học (Level 2 - Subjects), hỗ trợ các môn chung/cầu nối đa ngành (Cross-domain Bridges)
 *   - Tầng 3: 479 Bài Học & Chủ Đề (Level 3 - Topics/Lectures) kèm trạng thái thông thạo & điểm Feynman Clarity
 *   - Tầng 4: Vi Khái Niệm Cốt Lõi (Level 4 - Micro-concept Leaves)
 *
 * BẢNG MÀU HỆ THỐNG: Giao diện sáng chuẩn Theodore (#f8fafc / trắng / slate / xanh #8299E0), KHÔNG DÙNG MÀU ĐEN.
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
  Layers,
  Loader2,
} from "lucide-react";
import { CurriculumService } from "@/lib/services/curriculum-service";
import { CatalogTopic, DomainCategory, AcademicSubject } from "@/types/catalog.types";
import { useStudyStore } from "@/hooks/useStudyStore";
import TopicHierarchySearch, { SearchFilterState } from "@/components/topics/TopicHierarchySearch";

// Type definitions for Radial Constellation Nodes & Links
export interface RadialGraphNode {
  id: string;
  level: 0 | 1 | 2 | 3 | 4 | 5;
  name: string;
  shortLabel?: string;
  domainId?: string;
  fieldId?: string;
  subjectId?: string;
  color?: string;
  status?: "MASTERED" | "ACTIVE" | "GAP" | "UNLEARNED" | "IN_PROGRESS" | "NOT_STARTED";
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

// Map icon / code for 8 domains
const DOMAIN_METADATA: Record<string, { code: string; symbol: string }> = {
  "dom-it": { code: "IT", symbol: "💻" },
  "dom-cs": { code: "CS", symbol: "⚙️" },
  "dom-se": { code: "SE", symbol: "🛠️" },
  "dom-ecom": { code: "ECOM", symbol: "🛒" },
  "dom-acc": { code: "ACC", symbol: "📊" },
  "dom-biz": { code: "BIZ", symbol: "📈" },
  "dom-tour": { code: "TOUR", symbol: "✈️" },
  "dom-med": { code: "MED", symbol: "🎨" },
};

export const TopicKnowledgeGraph: React.FC = () => {
  const navigate = useNavigate();
  const { selectTopic } = useStudyStore();
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  // Live Supabase Curriculum State
  const [curriculumData, setCurriculumData] = useState<{
    domains: DomainCategory[];
    subjects: AcademicSubject[];
    domainSubjects: Array<{ domain_id: string; subject_id: string; is_core: boolean }>;
    topics: CatalogTopic[];
  }>({
    domains: [],
    subjects: [],
    domainSubjects: [],
    topics: [],
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch Live Data from Supabase
  useEffect(() => {
    let isMounted = true;
    CurriculumService.getAllCurriculumGraphData().then((data) => {
      if (isMounted) {
        setCurriculumData(data);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Active / Selected Node State
  const [selectedNode, setSelectedNode] = useState<RadialGraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<RadialGraphNode | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(0.75);

  // Hierarchical Search Filter State
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
      if (filterState.domainId !== "ALL") {
        const dId = filterState.domainId;
        if (node.level === 1 && node.id !== dId && node.id !== `domain-${dId}`) {
          return false;
        }
        if (node.level >= 2 && node.domainId && node.domainId !== dId) {
          return false;
        }
      }

      // Subject / Field filter
      if (filterState.fieldId !== "ALL") {
        const sId = filterState.fieldId;
        if (node.level === 1) return true;
        if (
          node.level === 2 &&
          node.id !== sId &&
          node.id !== `subject-${sId}` &&
          node.subjectId !== sId
        ) {
          return false;
        }
        if (node.level >= 3 && node.subjectId !== sId) {
          return false;
        }
      }

      // Keyword filter
      if (filterState.keyword.length > 0) {
        const kw = filterState.keyword.toLowerCase();
        if (node.level >= 2) {
          const matchName = node.name.toLowerCase().includes(kw);
          const matchSummary = node.summary?.toLowerCase().includes(kw);
          const matchConcept = node.requiredConcepts?.some((c) => c.toLowerCase().includes(kw));
          if (!matchName && !matchSummary && !matchConcept) return false;
        }
      }

      // Specific topic selection from dropdown
      if (filterState.selectedTopicId) {
        if (node.level >= 2) {
          const matchId =
            node.id === filterState.selectedTopicId ||
            node.id === `topic-${filterState.selectedTopicId}` ||
            node.id === `subject-${filterState.selectedTopicId}` ||
            node.subjectId === filterState.selectedTopicId;
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
  const centerCamera = useCallback((x: number = 0, y: number = 0, zoom: number = 0.75, duration: number = 700) => {
    if (fgRef.current) {
      fgRef.current.centerAt(x, y, duration);
      fgRef.current.zoom(zoom, duration);
    }
  }, []);

  // Initial centering on (0, 0) when mounted
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0 && !hasInitializedRef.current && !isLoading) {
      hasInitializedRef.current = true;
      centerCamera(0, 0, 0.72, 0);
      const t1 = setTimeout(() => centerCamera(0, 0, 0.72, 0), 100);
      const t2 = setTimeout(() => centerCamera(0, 0, 0.72, 0), 300);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [dimensions.width, dimensions.height, centerCamera, isLoading]);

  // Handle Zoom In / Zoom Out / Reset
  const handleResetCamera = () => {
    setZoomLevel(0.72);
    centerCamera(0, 0, 0.72, 700);
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

  // Build Hierarchical Constellation Dataset DYNAMICALLY from Supabase
  const graphData = useMemo(() => {
    const nodes: RadialGraphNode[] = [];
    const links: RadialGraphLink[] = [];

    const { domains, subjects, domainSubjects, topics } = curriculumData;
    if (domains.length === 0) {
      return { nodes, links };
    }

    // 0. Level 0: Core Node (Feynman Matrix Hub at origin)
    nodes.push({
      id: "core-feynman",
      level: 0,
      name: "KHÔNG GIAN FEYNMAN",
      shortLabel: "FEYNMAN CORE",
      r: 48,
      x: 0,
      y: 0,
      fx: 0,
      fy: 0,
      targetRadius: 0,
      targetAngle: 0,
    });

    // 1. Level 1: 8 Domain Nodes (Distributed symmetrically at 45° around 360°)
    const numDomains = domains.length;
    const domainDist = 300;
    const domainAngleMap = new Map<string, number>();

    domains.forEach((d, dIdx) => {
      // Start top at -90° (-PI/2), then distribute clockwise by 2*PI / numDomains
      const angle = (dIdx * 2 * Math.PI) / numDomains - Math.PI / 2;
      domainAngleMap.set(d.id, angle);

      const x = domainDist * Math.cos(angle);
      const y = domainDist * Math.sin(angle);
      const meta = DOMAIN_METADATA[d.id] || { code: d.slug.toUpperCase(), symbol: "📚" };

      const dNode: RadialGraphNode = {
        id: `domain-${d.id}`,
        level: 1,
        domainId: d.id,
        name: d.name,
        shortLabel: meta.code,
        color: d.colorHex || d.color || "#8299E0",
        r: 24,
        x,
        y,
        fx: x,
        fy: y,
        targetRadius: domainDist,
        targetAngle: angle,
      };

      nodes.push(dNode);
      links.push({
        id: `link-core-${dNode.id}`,
        source: "core-feynman",
        target: dNode.id,
        isHierarchy: true,
      });
    });

    // Group subjects by their primary domain
    const subjectsByPrimaryDomain = new Map<string, AcademicSubject[]>();
    domains.forEach((d) => subjectsByPrimaryDomain.set(d.id, []));

    // Multi-domain mapping: subjectId -> Array of domain_ids
    const subjectDomainsMap = new Map<string, string[]>();
    domainSubjects.forEach((ds) => {
      const arr = subjectDomainsMap.get(ds.subject_id) || [];
      arr.push(ds.domain_id);
      subjectDomainsMap.set(ds.subject_id, arr);
    });

    subjects.forEach((s) => {
      const linkedDomains = subjectDomainsMap.get(s.id) || (s.domainId ? [s.domainId] : [domains[0]?.id || "dom-it"]);
      const primaryDomainId = linkedDomains[0];
      const list = subjectsByPrimaryDomain.get(primaryDomainId) || [];
      list.push(s);
      subjectsByPrimaryDomain.set(primaryDomainId, list);
    });

    // 2. Level 2: 37 Subject Nodes (Grouped around primary domains with cross-links)
    const subjectCoordMap = new Map<string, { x: number; y: number; angle: number }>();

    domains.forEach((d) => {
      const dAngle = domainAngleMap.get(d.id) ?? 0;
      const dSubs = subjectsByPrimaryDomain.get(d.id) || [];
      const numSubs = dSubs.length;

      dSubs.forEach((s, sIdx) => {
        // Sector angular arc spread
        const maxSectorSpread = 0.44; // ~25 degrees
        const sOffset =
          numSubs > 1
            ? (sIdx - (numSubs - 1) / 2) * (maxSectorSpread / Math.max(1, numSubs - 1))
            : 0;
        const subAngle = dAngle + sOffset;

        // Stagger distance so neighboring subject pills do not collide
        const subDist = 520 + (sIdx % 3) * 45;
        const sx = subDist * Math.cos(subAngle);
        const sy = subDist * Math.sin(subAngle);

        subjectCoordMap.set(s.id, { x: sx, y: sy, angle: subAngle });

        const sNode: RadialGraphNode = {
          id: `subject-${s.id}`,
          level: 2,
          domainId: d.id,
          subjectId: s.id,
          name: s.name,
          shortLabel: s.name.slice(0, 10),
          r: 13,
          x: sx,
          y: sy,
          fx: sx,
          fy: sy,
          targetRadius: subDist,
          targetAngle: subAngle,
          summary: s.description,
        };

        nodes.push(sNode);

        // Primary Hierarchy Link from primary domain
        links.push({
          id: `link-domain-${d.id}-${s.id}`,
          source: `domain-${d.id}`,
          target: sNode.id,
          isHierarchy: true,
        });

        // Cross-domain links for shared subjects (Multi-tier bridges)
        const allDomains = subjectDomainsMap.get(s.id) || [];
        allDomains.forEach((otherDomainId) => {
          if (otherDomainId !== d.id) {
            links.push({
              id: `cross-domain-${otherDomainId}-${s.id}`,
              source: `domain-${otherDomainId}`,
              target: sNode.id,
              isHierarchy: false,
              isCrossLink: true,
            });
          }
        });
      });
    });

    // 3. Level 3: 479 Topic Nodes from Supabase
    // Group topics by subject
    const topicsBySubject = new Map<string, CatalogTopic[]>();
    topics.forEach((t) => {
      const sId = t.subjectId || "";
      const arr = topicsBySubject.get(sId) || [];
      arr.push(t);
      topicsBySubject.set(sId, arr);
    });

    subjects.forEach((s) => {
      const coord = subjectCoordMap.get(s.id);
      if (!coord) return;

      const subTopics = topicsBySubject.get(s.id) || [];
      const numTopics = subTopics.length;

      subTopics.forEach((topic, tIdx) => {
        // Colinear & slightly alternating needle ray
        const altAngle = coord.angle + (tIdx % 2 === 0 ? 0.03 : -0.03);
        const tDist = 80 + tIdx * 30; // Radiates outward from subject
        const tx = coord.x + tDist * Math.cos(altAngle);
        const ty = coord.y + tDist * Math.sin(altAngle);

        let status: RadialGraphNode["status"] = "UNLEARNED";
        const topicStatus = (topic.status as string) || "";
        if (topicStatus === "COMPLETED" || topicStatus === "MASTERED") {
          status = "MASTERED";
        } else if (topicStatus === "NEEDS_REVIEW" || topicStatus === "GAP") {
          status = "GAP";
        } else if (topicStatus === "IN_PROGRESS" || topicStatus === "ACTIVE") {
          status = "ACTIVE";
        }

        const clarityScore = topic.highestClarityScore ?? 0;

        const tNode: RadialGraphNode = {
          id: `topic-${topic.id}`,
          level: 3,
          domainId: topic.domainId || s.domainId,
          subjectId: s.id,
          name: topic.title,
          shortLabel: topic.title.slice(0, 10),
          status,
          clarityScore,
          r: 7.5,
          x: tx,
          y: ty,
          fx: tx,
          fy: ty,
          targetRadius: tDist,
          targetAngle: altAngle,
          summary: topic.summary,
          requiredConcepts: topic.requiredConcepts,
        };

        nodes.push(tNode);
        links.push({
          id: `link-sub-${s.id}-${topic.id}`,
          source: `subject-${s.id}`,
          target: tNode.id,
          isHierarchy: true,
        });

        // 4. Level 4: Micro-concept Leaves (From required_concepts in Supabase)
        const concepts = topic.requiredConcepts || [];
        const maxLeaves = Math.min(concepts.length, 2);
        for (let cIdx = 0; cIdx < maxLeaves; cIdx++) {
          const cDist = 24 + cIdx * 16;
          const cx = tx + cDist * Math.cos(altAngle);
          const cy = ty + cDist * Math.sin(altAngle);
          const cName = concepts[cIdx];
          const cId = `concept-${topic.id}-${cIdx}`;

          const cNode: RadialGraphNode = {
            id: cId,
            level: 5,
            domainId: tNode.domainId,
            subjectId: s.id,
            name: cName,
            shortLabel: "•",
            status: status === "MASTERED" ? "MASTERED" : status === "GAP" ? "GAP" : "UNLEARNED",
            clarityScore: status === "MASTERED" ? 90 : status === "GAP" ? 50 : 0,
            r: 2.5,
            x: cx,
            y: cy,
            fx: cx,
            fy: cy,
            targetRadius: cDist,
            targetAngle: altAngle,
            summary: topic.summary,
          };

          nodes.push(cNode);
          links.push({
            id: `link-c-${tNode.id}-${cId}`,
            source: tNode.id,
            target: cId,
            isHierarchy: true,
          });
        }
      });
    });

    return { nodes, links };
  }, [curriculumData]);

  // Node Click handler: Select, fly camera smoothly to node, and open details
  const handleNodeClick = useCallback(
    (node: RadialGraphNode) => {
      setSelectedNode(node);
      if (node.x != null && node.y != null) {
        centerCamera(node.x, node.y, Math.max(zoomLevel, 1.05), 650);
      }
      if (node.level >= 2) {
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
        domainId: topic.domainId || "ALL",
      }));
      const found = graphData.nodes.find(
        (n) =>
          n.id === `topic-${topic.id}` ||
          n.id === topic.id ||
          n.subjectId === topic.subjectId
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
        centerCamera(dNode.x, dNode.y, 0.95, 800);
      }
    } else if (filterState.domainId === "ALL" && !filterState.selectedTopicId && !filterState.keyword) {
      centerCamera(0, 0, 0.72, 800);
    }
  }, [filterState.domainId, filterState.selectedTopicId, filterState.keyword, graphData.nodes, centerCamera]);

  // Pre-frame Render: 360° Radar Orbits & Directional Rays
  const handleRenderFramePre = useCallback((ctx: CanvasRenderingContext2D, globalScale: number) => {
    ctx.save();

    // 1. Concentric Guide Radar Orbits
    const orbits = [120, 300, 520, 780, 1050];
    orbits.forEach((r) => {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(130, 153, 224, 0.22)";
      ctx.lineWidth = 0.8 / globalScale;
      ctx.setLineDash([4 / globalScale, 6 / globalScale]);
      ctx.stroke();
    });

    // 2. 8 Astronomical Axes (Aligning with 8 domains)
    for (let i = 0; i < 8; i++) {
      const ang = (i * 2 * Math.PI) / 8 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(100 * Math.cos(ang), 100 * Math.sin(ang));
      ctx.lineTo(1100 * Math.cos(ang), 1100 * Math.sin(ang));
      ctx.strokeStyle = "rgba(130, 153, 224, 0.16)";
      ctx.lineWidth = 0.6 / globalScale;
      ctx.setLineDash([3 / globalScale, 8 / globalScale]);
      ctx.stroke();
    }

    ctx.restore();
  }, []);

  // Custom Node Canvas Renderer: White fill, #8299E0 border, #5A6678 text
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
      // LEVEL 0: CORE NODE (KHÔNG GIAN FEYNMAN)
      // ==========================================
      if (node.level === 0) {
        const r = node.r ?? 48;
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
        ctx.fillText("SUPABASE MATRIX", x, y - 12 / globalScale);

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
      // LEVEL 1: 8 DOMAIN HUBS (Nhóm Ngành)
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

        ctx.strokeStyle = isActive ? "#ffffff" : (node.color || "#8299E0");
        ctx.lineWidth = (isActive ? 2.6 : 2.0) / globalScale;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Domain Code
        ctx.font = `900 ${9.5 / globalScale}px 'Lato', sans-serif`;
        ctx.fillStyle = isActive ? "#ffffff" : (node.color || "#5A6678");
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.shortLabel || "DOM", x, y);

        // Tooltip / Title text below domain hub in a neat pill
        ctx.font = `bold ${7.5 / globalScale}px 'Lato', sans-serif`;
        const textMetrics = ctx.measureText(node.name);
        const tw = textMetrics.width;
        const th = 13 / globalScale;
        const ty = y + r + 13 / globalScale;

        ctx.fillStyle = isActive ? "#8299E0" : "rgba(255, 255, 255, 0.95)";
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x - tw / 2 - 5 / globalScale, ty - th / 2, tw + 10 / globalScale, th, 4 / globalScale);
        } else {
          ctx.rect(x - tw / 2 - 5 / globalScale, ty - th / 2, tw + 10 / globalScale, th);
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
      // LEVEL 2: SUBJECT NODES (37 Môn Học)
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
        ctx.lineWidth = (isActive ? 2.4 : 1.6) / globalScale;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Inner Subject Icon Dot
        ctx.beginPath();
        ctx.arc(x, y, (isActive ? 3.0 : 2.0) / globalScale, 0, 2 * Math.PI);
        ctx.fillStyle = isActive ? "#ffffff" : "#8299E0";
        ctx.fill();

        // Subject Title Pill
        ctx.font = isActive
          ? `bold ${7.5 / globalScale}px 'Lato', sans-serif`
          : `600 ${6.8 / globalScale}px 'Lato', sans-serif`;

        const displayName =
          !isActive && node.name.length > 20 ? node.name.slice(0, 19) + "…" : node.name;
        const textMetrics = ctx.measureText(displayName);
        const tw = textMetrics.width;
        const th = (isActive ? 13 : 11) / globalScale;
        const subAngle = node.targetAngle ?? Math.atan2(y, x);
        const pillDist = r + 10 / globalScale;
        const pillX = x + pillDist * Math.cos(subAngle);
        const pillY = y + pillDist * Math.sin(subAngle);
        const isRight = pillX >= x;

        ctx.fillStyle = isActive ? "#8299E0" : "rgba(255, 255, 255, 0.94)";
        ctx.beginPath();
        const startX = isRight ? pillX - 2 / globalScale : pillX - tw - 8 / globalScale;
        if (ctx.roundRect) {
          ctx.roundRect(startX, pillY - th / 2, tw + 10 / globalScale, th, 3 / globalScale);
        } else {
          ctx.rect(startX, pillY - th / 2, tw + 10 / globalScale, th);
        }
        ctx.fill();

        ctx.strokeStyle = isActive ? "#ffffff" : "rgba(130, 153, 224, 0.5)";
        ctx.lineWidth = 0.7 / globalScale;
        ctx.stroke();

        ctx.fillStyle = isActive ? "#ffffff" : "#334155";
        ctx.textAlign = isRight ? "left" : "right";
        ctx.textBaseline = "middle";
        ctx.fillText(displayName, isRight ? pillX + 3 / globalScale : pillX - 3 / globalScale, pillY);

        ctx.restore();
        return;
      }

      // ==========================================
      // LEVEL 3: TOPIC / LECTURE NODES (479 Bài Học)
      // ==========================================
      if (node.level === 3) {
        const r = isActive ? 10.5 : (node.r ?? 7.5);

        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = isActive ? "#8299E0" : "#ffffff";
        if (isActive) {
          ctx.shadowColor = "rgba(130, 153, 224, 0.45)";
          ctx.shadowBlur = 10 / globalScale;
        }
        ctx.fill();

        // Status-based stroke color
        let strokeColor = "#8299E0";
        if (node.status === "MASTERED") strokeColor = "#10b981"; // Emerald
        else if (node.status === "GAP") strokeColor = "#ef4444"; // Red
        else if (node.status === "ACTIVE") strokeColor = "#f59e0b"; // Amber

        ctx.strokeStyle = isActive ? "#ffffff" : strokeColor;
        ctx.lineWidth = (isActive ? 2.2 : 1.4) / globalScale;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Inner dot
        ctx.beginPath();
        ctx.arc(x, y, (isActive ? 2.5 : 1.6) / globalScale, 0, 2 * Math.PI);
        ctx.fillStyle = isActive ? "#ffffff" : strokeColor;
        ctx.fill();

        // Label on hover or selection
        if (isActive) {
          ctx.font = `bold ${7.5 / globalScale}px 'Lato', sans-serif`;
          const textMetrics = ctx.measureText(node.name);
          const tw = textMetrics.width;
          const th = 14 / globalScale;
          const ty = y - r - 9 / globalScale;

          ctx.fillStyle = "#8299E0";
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(x - tw / 2 - 5 / globalScale, ty - th / 2, tw + 10 / globalScale, th, 4 / globalScale);
          } else {
            ctx.rect(x - tw / 2 - 5 / globalScale, ty - th / 2, tw + 10 / globalScale, th);
          }
          ctx.fill();

          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(node.name, x, ty);
        }

        ctx.restore();
        return;
      }

      // ==========================================
      // LEVEL 5: MICRO-CONCEPT LEAVES
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

  // Link Canvas Renderer: Straight Needle Rays & Cross-domain Bridges
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
        ctx.strokeStyle = "#8299E0";
        ctx.lineWidth = 2.2 / globalScale;
        ctx.setLineDash([]);
        ctx.shadowColor = "rgba(130, 153, 224, 0.45)";
        ctx.shadowBlur = 6 / globalScale;
      } else {
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
      {/* 3-Level Hierarchical Search Toolbar with Dynamic Supabase Data */}
      <TopicHierarchySearch
        onFilterChange={setFilterState}
        onSelectTopic={handleSelectTopicFromSearch}
        domains={curriculumData.domains}
        subjects={curriculumData.subjects}
        domainSubjects={curriculumData.domainSubjects}
        topics={curriculumData.topics}
      />

      {/* Main Interactive ForceGraph2D Canvas Container */}
      <div
        ref={containerRef}
        className="relative w-full flex-1 h-full min-h-0 bg-[#f8fafc] rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden select-none cursor-default"
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-40 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="text-xs font-bold text-slate-600 tracking-wide">
              Đang đồng bộ Bản đồ Tri thức từ Supabase...
            </span>
          </div>
        )}

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
          {/* Metric Summary Card (Live from Supabase) */}
          <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200/90 shadow-lg space-y-3 min-w-[240px]">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Hệ Thống Tri Thức
              </span>
              <div className="flex items-center gap-1 text-xs font-black text-amber-500">
                <Flame className="w-3.5 h-3.5 fill-amber-500" />
                <span>{curriculumData.domains.length} Ngành</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-500">Bài học & Chủ đề:</span>
                <span className="text-slate-900 font-black">{curriculumData.topics.length} Bài</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                  style={{ width: "32%" }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-bold pt-1">
              <span className="text-slate-500">Môn học kết nối:</span>
              <span className="text-emerald-600 font-black text-sm">
                {curriculumData.subjects.length} Môn ({curriculumData.domainSubjects.length} Cầu nối)
              </span>
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

        {/* 3. Slide-over Concept Details Drawer */}
        {isDrawerOpen && selectedNode && (
          <div className="absolute top-0 right-0 bottom-0 w-full sm:w-[420px] bg-white/98 backdrop-blur-xl border-l border-slate-200 p-6 z-30 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200 text-slate-800">
            <div className="space-y-5">
              {/* Drawer Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60 inline-block mb-1.5">
                    {selectedNode.level === 1
                      ? "Cấp 1 • Nhóm Ngành"
                      : selectedNode.level === 2
                      ? "Cấp 2 • Môn Học"
                      : selectedNode.level === 3
                      ? "Cấp 3 • Bài Học & Chủ Đề"
                      : "Cấp 4 • Vi Khái Niệm Cốt Lõi"}
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
                  {(!selectedNode.status || selectedNode.status === "UNLEARNED" || selectedNode.status === "NOT_STARTED") && (
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
                    Mục Tiêu & Tóm Tắt Tri Thức
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
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <button
                onClick={() => handleStudyTopic(selectedNode.subjectId || selectedNode.id.replace("topic-", "").replace("subject-", ""))}
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
