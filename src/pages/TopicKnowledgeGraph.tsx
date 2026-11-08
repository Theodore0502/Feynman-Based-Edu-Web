/**
 * File: src/pages/TopicKnowledgeGraph.tsx
 * Mục đích: Bản Đồ Tri Thức (Knowledge Graph) theo CẤU TRÚC CÂY TỎA TRÒN (Radial Tree / Knowledge Tree)
 *   - Lõi trung tâm (Gốc cây - Root): Không Gian Feynman tại (0, 0)
 *   - Cành cấp 1 (Thân cành chính - 8 Domains): Tỏa đều 8 hướng 360° (mỗi 45°)
 *   - Cành cấp 2 (Nhánh môn học - 37 Subjects): Rẽ nhánh hình nan quạt (fork/branch) từ từng Ngành
 *   - Cành cấp 3 & Tán lá (479 Topics): Tỏa thành các chùm tán cây (Canopy Clusters) phân tầng từ Môn học
 *   - Đường nối dạng nhánh cây uốn cong hữu cơ (Organic Branching Curves) mềm mại, thanh thoát
 *   - DỮ LIỆU ĐƯỢC LOAD 100% ĐỘNG TỪ SUPABASE (CẤM HARDCODE DỮ LIỆU).
 *
 * Giao diện sáng chuẩn Theodore (#f8fafc / trắng / slate / xanh #8299E0), phong cách nhẹ nhàng, tinh tế.
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

// Định nghĩa Node cho Cây Tri Thức
export interface RadialTreeNode {
  id: string;
  level: 0 | 1 | 2 | 3;
  name: string;
  shortLabel?: string;
  domainId?: string;
  subjectId?: string;
  color?: string;
  status?: "MASTERED" | "ACTIVE" | "GAP" | "UNLEARNED";
  clarityScore?: number;
  r?: number;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
  targetRadius?: number;
  targetAngle?: number;
  summary?: string;
  requiredConcepts?: string[];
}

// Định nghĩa Link (Nhánh cây)
export interface RadialTreeLink {
  id: string;
  source: string | RadialTreeNode;
  target: string | RadialTreeNode;
  level: 1 | 2 | 3; // 1: Root->Domain, 2: Domain->Subject, 3: Subject->Topic
  isCrossLink?: boolean;
}

// Metadata nhãn viết tắt cho 8 Ngành
const DOMAIN_CODE_MAP: Record<string, string> = {
  "dom-it": "IT",
  "dom-cs": "CS",
  "dom-se": "SE",
  "dom-ecom": "ECOM",
  "dom-acc": "ACC",
  "dom-biz": "BIZ",
  "dom-tour": "TOUR",
  "dom-med": "MED",
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
  const [selectedNode, setSelectedNode] = useState<RadialTreeNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<RadialTreeNode | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(0.72);

  // Hierarchical Search Filter State
  const [filterState, setFilterState] = useState<SearchFilterState>({
    domainId: "ALL",
    fieldId: "ALL",
    keyword: "",
    selectedTopicId: null,
  });

  const isNodeHighlighted = useCallback(
    (node: RadialTreeNode): boolean => {
      const hasFilters =
        filterState.domainId !== "ALL" ||
        filterState.fieldId !== "ALL" ||
        filterState.keyword.length > 0 ||
        filterState.selectedTopicId != null;

      if (!hasFilters) return true;
      if (node.level === 0) return true; // Gốc luôn sáng

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

      // Subject filter
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
        if (node.level === 3 && node.subjectId !== sId) {
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

      // Specific topic selection
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

  // Track container dimensions via ResizeObserver
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: typeof window !== "undefined" ? Math.max(600, window.innerWidth - 300) : 1000,
    height: typeof window !== "undefined" ? Math.max(450, window.innerHeight - 150) : 600,
  });

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

  // Camera smooth navigation
  const centerCamera = useCallback((x: number = 0, y: number = 0, zoom: number = 0.72, duration: number = 700) => {
    if (fgRef.current) {
      fgRef.current.centerAt(x, y, duration);
      fgRef.current.zoom(zoom, duration);
    }
  }, []);

  // Initial centering
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

  // =========================================================================
  // XÂY DỰNG CẤU TRÚC CÂY TRI THỨC TỎA TRÒN (RADIAL TREE LAYOUT ENGINE)
  // =========================================================================
  const graphData = useMemo(() => {
    const nodes: RadialTreeNode[] = [];
    const links: RadialTreeLink[] = [];

    const { domains, subjects, domainSubjects, topics } = curriculumData;
    if (domains.length === 0) {
      return { nodes, links };
    }

    // -------------------------------------------------------------
    // TẦNG 0: GỐC CÂY (ROOT - KHÔNG GIAN FEYNMAN TẠI TÂM (0, 0))
    // -------------------------------------------------------------
    nodes.push({
      id: "core-feynman",
      level: 0,
      name: "KHÔNG GIAN FEYNMAN",
      shortLabel: "FEYNMAN ROOT",
      r: 44,
      x: 0,
      y: 0,
      fx: 0,
      fy: 0,
      targetRadius: 0,
      targetAngle: 0,
    });

    // -------------------------------------------------------------
    // TẦNG 1: 8 THÂN CÀNH LỚN (8 DOMAIN MAIN BRANCHES)
    // Phân bổ đối xứng 360° (mỗi ngành chiếm rẻ quạt 45°)
    // -------------------------------------------------------------
    const numDomains = domains.length;
    const domainDist = 220; // Bán kính thân cành lớn
    const domainAngleMap = new Map<string, number>();

    domains.forEach((d, dIdx) => {
      // Góc trung tâm của từng ngành (Bắt đầu từ đỉnh -90° = -PI/2)
      const angle = (dIdx * 2 * Math.PI) / numDomains - Math.PI / 2;
      domainAngleMap.set(d.id, angle);

      const x = domainDist * Math.cos(angle);
      const y = domainDist * Math.sin(angle);
      const code = DOMAIN_CODE_MAP[d.id] || d.slug.toUpperCase();

      const dNode: RadialTreeNode = {
        id: `domain-${d.id}`,
        level: 1,
        domainId: d.id,
        name: d.name,
        shortLabel: code,
        color: d.colorHex || d.color || "#8299E0",
        r: 23,
        x,
        y,
        fx: x,
        fy: y,
        targetRadius: domainDist,
        targetAngle: angle,
      };

      nodes.push(dNode);
      links.push({
        id: `link-root-${dNode.id}`,
        source: "core-feynman",
        target: dNode.id,
        level: 1,
      });
    });

    // -------------------------------------------------------------
    // NHÓM MÔN HỌC THEO NGÀNH CHÍNH & XÁC ĐỊNH LIÊN KẾT ĐA NGÀNH
    // -------------------------------------------------------------
    const subjectsByPrimaryDomain = new Map<string, AcademicSubject[]>();
    domains.forEach((d) => subjectsByPrimaryDomain.set(d.id, []));

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

    // -------------------------------------------------------------
    // TẦNG 2: CÁC CÀNH CON RẼ NHÁNH (37 SUBJECT BRANCHES)
    // Từng Ngành rẽ nhánh (fork/branch) ra các Môn học theo hình nan quạt
    // -------------------------------------------------------------
    const subjectCoordMap = new Map<string, { x: number; y: number; angle: number }>();

    domains.forEach((d) => {
      const dAngle = domainAngleMap.get(d.id) ?? 0;
      const dSubs = subjectsByPrimaryDomain.get(d.id) || [];
      const numSubs = dSubs.length;

      // Góc xòe cành của ngành (~28 độ = 0.48 rad)
      const sectorSpread = 0.48;

      dSubs.forEach((s, sIdx) => {
        // Góc của từng nhánh môn học rẽ ra từ ngành
        const sOffset =
          numSubs > 1
            ? (sIdx - (numSubs - 1) / 2) * (sectorSpread / Math.max(1, numSubs - 1))
            : 0;
        const subAngle = dAngle + sOffset;

        // Bán kính so le nhẹ để các nhãn môn học không va chạm nhau
        const subDist = 410 + (sIdx % 2) * 35;
        const sx = subDist * Math.cos(subAngle);
        const sy = subDist * Math.sin(subAngle);

        subjectCoordMap.set(s.id, { x: sx, y: sy, angle: subAngle });

        const sNode: RadialTreeNode = {
          id: `subject-${s.id}`,
          level: 2,
          domainId: d.id,
          subjectId: s.id,
          name: s.name,
          shortLabel: s.name.slice(0, 10),
          r: 12,
          x: sx,
          y: sy,
          fx: sx,
          fy: sy,
          targetRadius: subDist,
          targetAngle: subAngle,
          summary: s.description,
        };

        nodes.push(sNode);

        // Nhánh cây từ Thân Ngành -> Cành Môn Học
        links.push({
          id: `link-domain-${d.id}-${s.id}`,
          source: `domain-${d.id}`,
          target: sNode.id,
          level: 2,
        });

        // Nhánh cầu nối đa ngành (Cross-domain bridge)
        const allDomains = subjectDomainsMap.get(s.id) || [];
        allDomains.forEach((otherDomainId) => {
          if (otherDomainId !== d.id) {
            links.push({
              id: `cross-domain-${otherDomainId}-${s.id}`,
              source: `domain-${otherDomainId}`,
              target: sNode.id,
              level: 2,
              isCrossLink: true,
            });
          }
        });
      });
    });

    // -------------------------------------------------------------
    // TẦNG 3: TÁN LÁ & QUẢ TRI THỨC (479 TOPIC CANOPY CLUSTERS)
    // Các Bài Học xòe rộng thành chùm tán cây (Fan-out Canopy) từ Môn Học
    // -------------------------------------------------------------
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
      if (numTopics === 0) return;

      // Phân bổ các bài học thành 2 hoặc 3 tầng cánh quạt tỏa ra từ Môn Học
      // Không bao giờ xếp 1 hàng dài như xâu hạt nữa!
      const numTiers = 2; // 2 tầng cánh quạt

      subTopics.forEach((topic, tIdx) => {
        const tier = tIdx % numTiers; // Tầng 0 (gần môn hơn), Tầng 1 (xa hơn)
        const slotInTier = Math.floor(tIdx / numTiers);
        const totalInTier = Math.ceil(numTopics / numTiers);

        // Góc xòe nan quạt quanh trục của môn học (~10 độ)
        const fanSpread = 0.16; // rad
        const topicOffset =
          totalInTier > 1
            ? (slotInTier - (totalInTier - 1) / 2) * (fanSpread / Math.max(1, totalInTier - 1))
            : 0;

        // Góc riêng biệt cho từng bài học
        const topicAngle = coord.angle + topicOffset + (tier === 1 ? 0.012 : -0.012);

        // Khoảng cách từ Môn học: Tầng 1 cách 95px, Tầng 2 cách 160px
        const branchDist = tier === 0 ? 95 : 160;
        const tx = coord.x + branchDist * Math.cos(topicAngle);
        const ty = coord.y + branchDist * Math.sin(topicAngle);

        // Trạng thái học tập
        let status: RadialTreeNode["status"] = "UNLEARNED";
        const topicStatus = (topic.status as string) || "";
        if (topicStatus === "COMPLETED" || topicStatus === "MASTERED") {
          status = "MASTERED";
        } else if (topicStatus === "NEEDS_REVIEW" || topicStatus === "GAP") {
          status = "GAP";
        } else if (topicStatus === "IN_PROGRESS" || topicStatus === "ACTIVE") {
          status = "ACTIVE";
        }

        const clarityScore = topic.highestClarityScore ?? 0;

        const tNode: RadialTreeNode = {
          id: `topic-${topic.id}`,
          level: 3,
          domainId: topic.domainId || s.domainId,
          subjectId: s.id,
          name: topic.title,
          shortLabel: topic.title.slice(0, 10),
          status,
          clarityScore,
          r: 6.5,
          x: tx,
          y: ty,
          fx: tx,
          fy: ty,
          targetRadius: branchDist,
          targetAngle: topicAngle,
          summary: topic.summary,
          requiredConcepts: topic.requiredConcepts,
        };

        nodes.push(tNode);

        // Nhánh cây con (Twig branch) nối từ Môn học đến từng Bài học
        links.push({
          id: `link-sub-${s.id}-${topic.id}`,
          source: `subject-${s.id}`,
          target: tNode.id,
          level: 3,
        });
      });
    });

    return { nodes, links };
  }, [curriculumData]);

  // Click handler
  const handleNodeClick = useCallback(
    (node: RadialTreeNode) => {
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

  // Search handler
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

  // Auto-focus camera on domain filter
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

  // Vòng nền tinh tế làm mốc cự ly (Watermark Tree Rings)
  const handleRenderFramePre = useCallback((ctx: CanvasRenderingContext2D, globalScale: number) => {
    ctx.save();
    // Vòng mốc cự ly thanh mảnh, không có trục đứt đoạn thô ráp
    const rings = [220, 420, 560];
    rings.forEach((r) => {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(130, 153, 224, 0.12)";
      ctx.lineWidth = 0.8 / globalScale;
      ctx.setLineDash([3 / globalScale, 6 / globalScale]);
      ctx.stroke();
    });
    ctx.restore();
  }, []);

  // =========================================================================
  // VẼ ĐƯỜNG NHÁNH CÂY UỐN CONG HỮU CƠ (ORGANIC TREE BRANCH LINKS)
  // =========================================================================
  const renderLinkCanvasObject = useCallback(
    (link: RadialTreeLink, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const source = link.source as RadialTreeNode;
      const target = link.target as RadialTreeNode;

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

      // Đường cong nhánh cây hữu cơ (Smooth Quadratic Curve)
      ctx.beginPath();
      ctx.moveTo(source.x, source.y);

      if (link.level === 1) {
        // Gốc -> Thân ngành: Thẳng hoặc uốn nhẹ
        ctx.lineTo(target.x, target.y);
      } else {
        // Thân -> Môn học hoặc Môn -> Bài học: Uốn cong tự nhiên
        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2;
        // Điểm uốn cong nhẹ theo hướng bán kính
        const cpX = midX * 1.015;
        const cpY = midY * 1.015;
        ctx.quadraticCurveTo(cpX, cpY, target.x, target.y);
      }

      if (isConnected) {
        // Nhánh cây đang được chọn / hover: Sáng rực nổi bật
        ctx.strokeStyle = "#4F46E5";
        ctx.lineWidth = (link.level === 1 ? 3.0 : link.level === 2 ? 2.4 : 1.8) / globalScale;
        ctx.setLineDash([]);
        ctx.shadowColor = "rgba(79, 70, 229, 0.4)";
        ctx.shadowBlur = 8 / globalScale;
      } else {
        // Nhánh cây bình thường
        if (link.isCrossLink) {
          ctx.strokeStyle = "rgba(130, 153, 224, 0.35)";
          ctx.lineWidth = 0.8 / globalScale;
          ctx.setLineDash([3 / globalScale, 4 / globalScale]);
        } else if (link.level === 1) {
          // Thân cành lớn
          ctx.strokeStyle = "rgba(114, 134, 211, 0.65)";
          ctx.lineWidth = 2.2 / globalScale;
          ctx.setLineDash([]);
        } else if (link.level === 2) {
          // Cành môn học
          ctx.strokeStyle = "rgba(130, 153, 224, 0.55)";
          ctx.lineWidth = 1.4 / globalScale;
          ctx.setLineDash([]);
        } else {
          // Nhánh tán lá bài học
          ctx.strokeStyle = "rgba(148, 163, 184, 0.45)";
          ctx.lineWidth = 0.9 / globalScale;
          ctx.setLineDash([]);
        }
        ctx.shadowBlur = 0;
      }

      ctx.stroke();
      ctx.restore();
    },
    [selectedNode, hoveredNode, filterState, isNodeHighlighted]
  );

  // =========================================================================
  // VẼ NODE CÂY TRI THỨC (GỐC, THÂN, CÀNH, LÁ)
  // =========================================================================
  const renderNodeCanvasObject = useCallback(
    (node: RadialTreeNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
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

      // Spotlight / Dimming
      if (hasActiveFilter && !isMatch) {
        ctx.globalAlpha = 0.12;
      } else if (hasActiveFilter && isMatch && node.level >= 1) {
        ctx.shadowColor = "#8299E0";
        ctx.shadowBlur = (isSelected ? 16 : 8) / globalScale;
      }

      // -------------------------------------------------------------
      // LEVEL 0: GỐC CÂY (ROOT - KHÔNG GIAN FEYNMAN)
      // -------------------------------------------------------------
      if (node.level === 0) {
        const r = node.r ?? 44;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = isActive ? "#7286D3" : "#ffffff";
        ctx.shadowColor = "rgba(114, 134, 211, 0.35)";
        ctx.shadowBlur = 12 / globalScale;
        ctx.fill();

        ctx.strokeStyle = isActive ? "#ffffff" : "#7286D3";
        ctx.lineWidth = 2.4 / globalScale;
        ctx.stroke();

        // Vòng tròn trang trí bên trong
        ctx.beginPath();
        ctx.arc(x, y, r - 5, 0, 2 * Math.PI);
        ctx.strokeStyle = isActive ? "rgba(255, 255, 255, 0.4)" : "rgba(114, 134, 211, 0.3)";
        ctx.lineWidth = 1 / globalScale;
        ctx.stroke();

        ctx.shadowBlur = 0;

        ctx.font = `900 ${7.5 / globalScale}px 'Lato', sans-serif`;
        ctx.fillStyle = isActive ? "#ffffff" : "#475569";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("CÂY TRI THỨC", x, y - 5 / globalScale);

        ctx.font = `900 ${9.0 / globalScale}px 'Lato', sans-serif`;
        ctx.fillStyle = isActive ? "#ffffff" : "#1E293B";
        ctx.fillText("FEYNMAN", x, y + 8 / globalScale);

        ctx.restore();
        return;
      }

      // -------------------------------------------------------------
      // LEVEL 1: THÂN CÀNH LỚN (8 DOMAINS)
      // -------------------------------------------------------------
      if (node.level === 1) {
        const r = isActive ? 25 : (node.r ?? 23);

        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = isActive ? "#7286D3" : "#ffffff";
        if (isActive) {
          ctx.shadowColor = "rgba(114, 134, 211, 0.45)";
          ctx.shadowBlur = 12 / globalScale;
        }
        ctx.fill();

        ctx.strokeStyle = isActive ? "#ffffff" : (node.color || "#7286D3");
        ctx.lineWidth = (isActive ? 2.6 : 2.0) / globalScale;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Mã ngành viết tắt (IT, CS, SE, ACC...)
        ctx.font = `900 ${9.5 / globalScale}px 'Lato', sans-serif`;
        ctx.fillStyle = isActive ? "#ffffff" : (node.color || "#334155");
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.shortLabel || "DOM", x, y);

        // Thẻ tên ngành bên dưới node
        ctx.font = `bold ${7.5 / globalScale}px 'Lato', sans-serif`;
        const textMetrics = ctx.measureText(node.name);
        const tw = textMetrics.width;
        const th = 13 / globalScale;
        const ty = y + r + 13 / globalScale;

        ctx.fillStyle = isActive ? "#7286D3" : "rgba(255, 255, 255, 0.95)";
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x - tw / 2 - 5 / globalScale, ty - th / 2, tw + 10 / globalScale, th, 4 / globalScale);
        } else {
          ctx.rect(x - tw / 2 - 5 / globalScale, ty - th / 2, tw + 10 / globalScale, th);
        }
        ctx.fill();

        ctx.strokeStyle = isActive ? "#ffffff" : "rgba(114, 134, 211, 0.4)";
        ctx.lineWidth = 0.8 / globalScale;
        ctx.stroke();

        ctx.fillStyle = isActive ? "#ffffff" : "#475569";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.name, x, ty);

        ctx.restore();
        return;
      }

      // -------------------------------------------------------------
      // LEVEL 2: CÀNH CON MÔN HỌC (37 SUBJECTS)
      // -------------------------------------------------------------
      if (node.level === 2) {
        const r = isActive ? 14 : (node.r ?? 12);

        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = isActive ? "#7286D3" : "#ffffff";
        if (isActive) {
          ctx.shadowColor = "rgba(114, 134, 211, 0.4)";
          ctx.shadowBlur = 8 / globalScale;
        }
        ctx.fill();

        ctx.strokeStyle = isActive ? "#ffffff" : "#7286D3";
        ctx.lineWidth = (isActive ? 2.2 : 1.6) / globalScale;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Chấm tâm nhỏ màu xanh
        ctx.beginPath();
        ctx.arc(x, y, (isActive ? 2.8 : 2.0) / globalScale, 0, 2 * Math.PI);
        ctx.fillStyle = isActive ? "#ffffff" : "#7286D3";
        ctx.fill();

        // Thẻ tên môn học thanh lịch
        ctx.font = isActive
          ? `bold ${7.5 / globalScale}px 'Lato', sans-serif`
          : `600 ${6.8 / globalScale}px 'Lato', sans-serif`;

        const displayName =
          !isActive && node.name.length > 18 ? node.name.slice(0, 17) + "…" : node.name;
        const textMetrics = ctx.measureText(displayName);
        const tw = textMetrics.width;
        const th = (isActive ? 13 : 11) / globalScale;
        const subAngle = node.targetAngle ?? Math.atan2(y, x);
        const pillDist = r + 9 / globalScale;
        const pillX = x + pillDist * Math.cos(subAngle);
        const pillY = y + pillDist * Math.sin(subAngle);
        const isRight = pillX >= x;

        ctx.fillStyle = isActive ? "#7286D3" : "rgba(255, 255, 255, 0.94)";
        ctx.beginPath();
        const startX = isRight ? pillX - 2 / globalScale : pillX - tw - 8 / globalScale;
        if (ctx.roundRect) {
          ctx.roundRect(startX, pillY - th / 2, tw + 10 / globalScale, th, 3 / globalScale);
        } else {
          ctx.rect(startX, pillY - th / 2, tw + 10 / globalScale, th);
        }
        ctx.fill();

        ctx.strokeStyle = isActive ? "#ffffff" : "rgba(114, 134, 211, 0.45)";
        ctx.lineWidth = 0.7 / globalScale;
        ctx.stroke();

        ctx.fillStyle = isActive ? "#ffffff" : "#334155";
        ctx.textAlign = isRight ? "left" : "right";
        ctx.textBaseline = "middle";
        ctx.fillText(displayName, isRight ? pillX + 3 / globalScale : pillX - 3 / globalScale, pillY);

        ctx.restore();
        return;
      }

      // -------------------------------------------------------------
      // LEVEL 3: TÁN LÁ BÀI HỌC (479 TOPICS)
      // -------------------------------------------------------------
      if (node.level === 3) {
        const r = isActive ? 9.5 : (node.r ?? 6.5);

        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = isActive ? "#7286D3" : "#ffffff";
        if (isActive) {
          ctx.shadowColor = "rgba(114, 134, 211, 0.45)";
          ctx.shadowBlur = 8 / globalScale;
        }
        ctx.fill();

        // Màu viền thể hiện trạng thái học tập
        let strokeColor = "#94a3b8"; // Mặc định xám nhạt
        if (node.status === "MASTERED") strokeColor = "#10b981"; // Xanh ngọc
        else if (node.status === "GAP") strokeColor = "#ef4444"; // Đỏ cảnh báo
        else if (node.status === "ACTIVE") strokeColor = "#f59e0b"; // Vàng cam

        ctx.strokeStyle = isActive ? "#ffffff" : strokeColor;
        ctx.lineWidth = (isActive ? 2.0 : 1.4) / globalScale;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Chấm tâm nhỏ bên trong
        ctx.beginPath();
        ctx.arc(x, y, (isActive ? 2.4 : 1.6) / globalScale, 0, 2 * Math.PI);
        ctx.fillStyle = isActive ? "#ffffff" : strokeColor;
        ctx.fill();

        // Hiển thị nhãn khi hover hoặc chọn
        if (isActive) {
          ctx.font = `bold ${7.5 / globalScale}px 'Lato', sans-serif`;
          const textMetrics = ctx.measureText(node.name);
          const tw = textMetrics.width;
          const th = 14 / globalScale;
          const ty = y - r - 9 / globalScale;

          ctx.fillStyle = "#7286D3";
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

      ctx.restore();
    },
    [selectedNode, hoveredNode, filterState, isNodeHighlighted]
  );

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 space-y-2">
      {/* 3-Level Hierarchical Search Toolbar */}
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
              Đang kiến tạo Cây Tri Thức từ Supabase...
            </span>
          </div>
        )}

        {/* ForceGraph2D Canvas */}
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
          onNodeHover={(node) => setHoveredNode((node as RadialTreeNode) || null)}
          onBackgroundClick={handleBackgroundClick}
          enableNodeDrag={false}
          enableZoomInteraction={true}
          enablePanInteraction={true}
          cooldownTicks={1}
        />

        {/* Top Right Panel: Quick Metrics & Camera Tools */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2.5">
          {/* Metric Summary Card */}
          <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200/90 shadow-lg space-y-3 min-w-[240px]">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Cây Tri Thức
              </span>
              <div className="flex items-center gap-1 text-xs font-black text-amber-500">
                <Flame className="w-3.5 h-3.5 fill-amber-500" />
                <span>{curriculumData.domains.length} Nhánh Ngành</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-500">Tán lá bài học:</span>
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
              <span className="text-slate-500">Môn học phân nhánh:</span>
              <span className="text-emerald-600 font-black text-sm">
                {curriculumData.subjects.length} Môn
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

        {/* Slide-over Concept Details Drawer */}
        {isDrawerOpen && selectedNode && (
          <div className="absolute top-0 right-0 bottom-0 w-full sm:w-[420px] bg-white/98 backdrop-blur-xl border-l border-slate-200 p-6 z-30 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200 text-slate-800">
            <div className="space-y-5">
              {/* Drawer Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60 inline-block mb-1.5">
                    {selectedNode.level === 1
                      ? "Cấp 1 • Thân Nhánh Ngành"
                      : selectedNode.level === 2
                      ? "Cấp 2 • Nhánh Môn Học"
                      : "Cấp 3 • Tán Lá Bài Học"}
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
