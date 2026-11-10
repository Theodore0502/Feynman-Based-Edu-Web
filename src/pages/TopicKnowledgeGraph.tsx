/**
 * File: src/pages/TopicKnowledgeGraph.tsx
 * Mục đích: Bản Đồ Tri Thức (Knowledge Graph) theo CẤU TRÚC CÂY TỎA TRÒN VẬT LÝ ĐỘNG (Dynamic Physics Radial Tree)
 *   - Lõi trung tâm (Gốc cây - Root): Không Gian Feynman cố định tại (0, 0)
 *   - Cành cấp 1 (Thân cành lớn - 8 Domains): Tỏa đều 8 hướng 360° (mỗi 45°)
 *   - Cành cấp 2 (Nhánh môn học - 37 Subjects): Rẽ nhánh hình nan quạt (fork/branch) từ từng Ngành
 *   - Cành cấp 3 & Tán lá (479 Topics): Tỏa thành các chùm tán cây (Canopy Clusters) phân tầng từ Môn học
 *
 * TÍNH NĂNG ĐỘNG & VẬT LÝ (DYNAMIC PHYSICS):
 *   - LỰC VA CHẠM (Collision Force): Bắt buộc các node cách nhau 1 khoảng an toàn (Zero-Overlap).
 *   - NÉ TRÁNH THỜI GIAN THỰC (Real-time Avoidance / Repulsion): Khi kéo thả (drag) 1 node, các node khác lập tức dạt ra né tránh.
 *   - NÚT TỰ ĐỘNG SẮP XẾP (Auto Layout): 1-click đưa toàn bộ các node về lại vị trí cân bằng đối xứng tối ưu.
 *   - DỮ LIỆU ĐƯỢC LOAD 100% ĐỘNG TỪ SUPABASE (CẤM HARDCODE DỮ LIỆU).
 *
 * Giao diện sáng chuẩn Theodore (#f8fafc / trắng / slate / xanh #8299E0), phong cách nhẹ nhàng, tinh tế.
 */

import React, { useMemo, useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import { forceCollide, forceManyBody, forceX, forceY } from "d3-force";
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
  Wand2,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
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
  initialX?: number;
  initialY?: number;
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

  // Tính toán chuỗi liên kết và nốt dẫn truyền từ nốt đang chọn (hoặc hover) về tận Gốc Cây Feynman (Level 0)
  const activeAncestry = useMemo(() => {
    const target = selectedNode || hoveredNode;
    if (!target) {
      return {
        nodeIds: new Set<string>(),
        linkIds: new Set<string>(),
        linkEndpoints: new Set<string>(),
      };
    }

    const nodeIds = new Set<string>();
    const linkIds = new Set<string>();
    const linkEndpoints = new Set<string>();

    const addLink = (id: string, a: string, b: string) => {
      linkIds.add(id);
      linkEndpoints.add(a < b ? `${a}__${b}` : `${b}__${a}`);
    };

    nodeIds.add(target.id);

    if (target.level === 3) {
      // 1. Nốt Cấp 3 (Bài học): Nối về Subject -> Domain -> Root
      const topicId = target.id.replace("topic-", "");
      const subjectId = target.subjectId;
      if (subjectId) {
        const subNodeId = `subject-${subjectId}`;
        nodeIds.add(subNodeId);
        addLink(`link-sub-${subjectId}-${topicId}`, subNodeId, target.id);

        let domainId = target.domainId;
        if (!domainId) {
          const sObj = curriculumData.subjects.find((s) => s.id === subjectId);
          domainId = sObj?.domainId;
          if (!domainId) {
            const dsObj = curriculumData.domainSubjects.find((ds) => ds.subject_id === subjectId);
            domainId = dsObj?.domain_id;
          }
        }

        if (domainId) {
          const domNodeId = `domain-${domainId}`;
          nodeIds.add(domNodeId);
          addLink(`link-domain-${domainId}-${subjectId}`, domNodeId, subNodeId);

          nodeIds.add("core-feynman");
          addLink(`link-root-${domNodeId}`, "core-feynman", domNodeId);
        }
      }
    } else if (target.level === 2) {
      // 2. Nốt Cấp 2 (Môn học): Nối về Domain -> Root
      const subjectId = target.subjectId || target.id.replace("subject-", "");
      let domainId = target.domainId;
      if (!domainId) {
        const sObj = curriculumData.subjects.find((s) => s.id === subjectId);
        domainId = sObj?.domainId;
        if (!domainId) {
          const dsObj = curriculumData.domainSubjects.find((ds) => ds.subject_id === subjectId);
          domainId = dsObj?.domain_id;
        }
      }

      if (domainId) {
        const domNodeId = `domain-${domainId}`;
        nodeIds.add(domNodeId);
        addLink(`link-domain-${domainId}-${subjectId}`, domNodeId, target.id);

        nodeIds.add("core-feynman");
        addLink(`link-root-${domNodeId}`, "core-feynman", domNodeId);
      }
    } else if (target.level === 1) {
      // 3. Nốt Cấp 1 (Ngành): Nối thẳng về Root
      nodeIds.add("core-feynman");
      addLink(`link-root-${target.id}`, "core-feynman", target.id);
    } else if (target.level === 0) {
      nodeIds.add("core-feynman");
    }

    return { nodeIds, linkIds, linkEndpoints };
  }, [selectedNode, hoveredNode, curriculumData]);

  const isNodeHighlighted = useCallback(
    (node: RadialTreeNode): boolean => {
      // Luôn làm nổi bật các node nằm trên đường truyền về gốc
      if (activeAncestry.nodeIds.has(node.id)) {
        return true;
      }

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
    [filterState, activeAncestry]
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
    // Gốc luôn cố định tại tâm (fx=0, fy=0)
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
      initialX: 0,
      initialY: 0,
      targetRadius: 0,
      targetAngle: 0,
    });

    // -------------------------------------------------------------
    // TẦNG 1: 8 THÂN CÀNH LỚN (8 DOMAIN MAIN BRANCHES)
    // Phân bổ đối xứng 360° (mỗi ngành chiếm rẻ quạt 45°)
    // -------------------------------------------------------------
    const numDomains = domains.length;
    // Tỷ lệ co dãn hình Oval / Ellipse sang trái - phải (Widescreen landscape layout)
    const ELLIPSE_SCALE_X = 1.48; // Giãn rộng trục ngang (trái - phải)
    const ELLIPSE_SCALE_Y = 0.82; // Thu gọn nhẹ trục dọc (trên - dưới)

    const domainDist = 220; // Bán kính thân cành lớn
    const domainAngleMap = new Map<string, number>();

    domains.forEach((d, dIdx) => {
      // Góc trung tâm của từng ngành (Bắt đầu từ đỉnh -90° = -PI/2)
      const angle = (dIdx * 2 * Math.PI) / numDomains - Math.PI / 2;
      domainAngleMap.set(d.id, angle);

      const x = domainDist * ELLIPSE_SCALE_X * Math.cos(angle);
      const y = domainDist * ELLIPSE_SCALE_Y * Math.sin(angle);
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
        initialX: x,
        initialY: y,
        targetRadius: domainDist,
        targetAngle: angle,
        summary: d.description,
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
      const sectorSpread = 0.48;

      dSubs.forEach((s, sIdx) => {
        const sOffset =
          numSubs > 1
            ? (sIdx - (numSubs - 1) / 2) * (sectorSpread / Math.max(1, numSubs - 1))
            : 0;
        const subAngle = dAngle + sOffset;

        const subDist = 410 + (sIdx % 2) * 35;
        const sx = subDist * ELLIPSE_SCALE_X * Math.cos(subAngle);
        const sy = subDist * ELLIPSE_SCALE_Y * Math.sin(subAngle);

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
          initialX: sx,
          initialY: sy,
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

        // Nhánh cầu nối đa ngành
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

      const sPrimaryDomain =
        s.domainId ||
        subjectDomainsMap.get(s.id)?.[0] ||
        (domains[0]?.id || "dom-it");

      const numTiers = 2; // 2 tầng cánh quạt

      subTopics.forEach((topic, tIdx) => {
        const tier = tIdx % numTiers;
        const slotInTier = Math.floor(tIdx / numTiers);
        const totalInTier = Math.ceil(numTopics / numTiers);

        const fanSpread = 0.16;
        const topicOffset =
          totalInTier > 1
            ? (slotInTier - (totalInTier - 1) / 2) * (fanSpread / Math.max(1, totalInTier - 1))
            : 0;

        const topicAngle = coord.angle + topicOffset + (tier === 1 ? 0.012 : -0.012);
        const branchDist = tier === 0 ? 95 : 160;
        const tx = coord.x + branchDist * ELLIPSE_SCALE_X * Math.cos(topicAngle);
        const ty = coord.y + branchDist * ELLIPSE_SCALE_Y * Math.sin(topicAngle);

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
          domainId: topic.domainId || s.domainId || sPrimaryDomain,
          subjectId: s.id,
          name: topic.title,
          shortLabel: topic.title.slice(0, 10),
          status,
          clarityScore,
          r: 6.5,
          x: tx,
          y: ty,
          initialX: tx,
          initialY: ty,
          targetRadius: branchDist,
          targetAngle: topicAngle,
          summary: topic.summary,
          requiredConcepts: topic.requiredConcepts,
        };

        nodes.push(tNode);

        // Nhánh cây con nối từ Môn học đến Bài học
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

  // =========================================================================
  // CẤU HÌNH D3 FORCE SIMULATION: VA CHẠM, LỰC ĐẨY, NÉ TRÁNH & TỎA TRÒN
  // =========================================================================
  useEffect(() => {
    if (!fgRef.current || graphData.nodes.length === 0) return;

    // 1. Collision Force: Bắt buộc các node cách nhau 1 khoảng an toàn (Zero Overlap)
    fgRef.current.d3Force(
      "collide",
      forceCollide()
        .radius((node: any) => {
          if (node.level === 0) return 60; // Gốc
          if (node.level === 1) return 40; // Ngành
          if (node.level === 2) return 26; // Môn
          return 16; // Bài học (level 3)
        })
        .iterations(3)
    );

    // 2. Many-Body Charge Repulsion: Lực đẩy tĩnh điện giúp các node né nhau khi tới gần
    fgRef.current.d3Force(
      "charge",
      forceManyBody()
        .strength((node: any) => {
          if (node.level === 0) return -1200;
          if (node.level === 1) return -450;
          if (node.level === 2) return -180;
          return -60;
        })
        .distanceMax(650)
    );

    // 3. Elliptical Anchor Forces: Lực hút định hướng theo hình Oval (Widescreen landscape)
    fgRef.current.d3Force(
      "x",
      forceX((node: any) => node.initialX ?? 0).strength((node: any) => {
        if (node.level === 0) return 1.0;
        if (node.level === 1) return 0.85;
        if (node.level === 2) return 0.65;
        return 0.45;
      })
    );

    fgRef.current.d3Force(
      "y",
      forceY((node: any) => node.initialY ?? 0).strength((node: any) => {
        if (node.level === 0) return 1.0;
        if (node.level === 1) return 0.85;
        if (node.level === 2) return 0.65;
        return 0.45;
      })
    );

    // 4. Link Force: Chiều dài và độ đàn hồi của cành cây thích ứng theo khoảng cách tự nhiên
    const linkForce: any = fgRef.current.d3Force("link");
    if (linkForce) {
      linkForce
        .distance((link: any) => {
          const src = link.source as RadialTreeNode;
          const tgt = link.target as RadialTreeNode;
          if (src && tgt && src.initialX != null && tgt.initialX != null) {
            const dx = tgt.initialX - src.initialX;
            const dy = (tgt.initialY ?? 0) - (src.initialY ?? 0);
            return Math.hypot(dx, dy);
          }
          if (link.level === 1) return 220;
          if (link.level === 2) return 150;
          return 80;
        })
        .strength((link: any) => {
          if (link.isCrossLink) return 0.04;
          if (link.level === 1) return 0.75;
          if (link.level === 2) return 0.55;
          return 0.4;
        });
    }

    fgRef.current.d3ReheatSimulation();
  }, [graphData]);

  // =========================================================================
  // XỬ LÝ KÉO THẢ NODE (DRAG & REAL-TIME AVOIDANCE)
  // =========================================================================
  const handleNodeDrag = useCallback((node: any) => {
    // Khi đang kéo 1 node, liên tục hâm nóng mô phỏng để các node khác dạt ra né tránh
    if (fgRef.current) {
      fgRef.current.d3ReheatSimulation();
    }
  }, []);

  const handleNodeDragEnd = useCallback((node: any) => {
    // Giữ node tại vị trí mới được thả
    if (node.level !== 0) {
      node.fx = node.x;
      node.fy = node.y;
    }
    if (fgRef.current) {
      fgRef.current.d3ReheatSimulation();
    }
  }, []);

  // =========================================================================
  // TÍNH NĂNG AUTO LAYOUT (TỰ ĐỘNG SẮP XẾP LẠI TOÀN BỘ CÂY TRI THỨC)
  // =========================================================================
  const handleAutoLayout = useCallback(() => {
    if (!fgRef.current) return;

    // Tháo gỡ ghim tọa độ của tất cả các node (trừ gốc) và đưa về vị trí cân bằng
    graphData.nodes.forEach((node) => {
      if (node.level === 0) {
        node.fx = 0;
        node.fy = 0;
        node.x = 0;
        node.y = 0;
      } else {
        node.fx = undefined;
        node.fy = undefined;
        if (node.initialX !== undefined && node.initialY !== undefined) {
          node.x = node.initialX;
          node.y = node.initialY;
        }
      }
    });

    // Kích hoạt mô phỏng vật lý thư giãn (Relaxation)
    fgRef.current.d3ReheatSimulation();
    centerCamera(0, 0, 0.72, 700);

    toast.success("Đã tự động sắp xếp lại Cây Tri Thức về vị trí cân đối");
  }, [graphData, centerCamera]);

  // Click handler
  const handleNodeClick = useCallback(
    (node: RadialTreeNode) => {
      setSelectedNode(node);
      if (node.x != null && node.y != null) {
        centerCamera(node.x, node.y, Math.max(zoomLevel, 1.05), 650);
      }
      if (node.level >= 1) {
        setIsDrawerOpen(true);
      }

      // ĐỒNG BỘ BỘ LỌC TÌM KIẾM THEO CÁC NODE THỪA KẾ
      if (node.level === 3) {
        // Cấp 3 (Bài học): gán domainId của bài, fieldId là subjectId của bài
        const sId = node.subjectId || "ALL";
        let dId = node.domainId;
        if (!dId && sId !== "ALL") {
          const sObj = curriculumData.subjects.find((s) => s.id === sId);
          dId = sObj?.domainId;
          if (!dId) {
            const dsObj = curriculumData.domainSubjects.find((ds) => ds.subject_id === sId);
            dId = dsObj?.domain_id;
          }
        }
        setFilterState({
          domainId: dId || "ALL",
          fieldId: sId,
          keyword: "",
          selectedTopicId: node.id.replace("topic-", ""),
        });
      } else if (node.level === 2) {
        // Cấp 2 (Môn học): gán domainId của môn, fieldId là subjectId của môn
        const sId = node.subjectId || node.id.replace("subject-", "");
        let dId = node.domainId;
        if (!dId) {
          const sObj = curriculumData.subjects.find((s) => s.id === sId);
          dId = sObj?.domainId;
          if (!dId) {
            const dsObj = curriculumData.domainSubjects.find((ds) => ds.subject_id === sId);
            dId = dsObj?.domain_id;
          }
        }
        setFilterState({
          domainId: dId || "ALL",
          fieldId: sId,
          keyword: "",
          selectedTopicId: null,
        });
      } else if (node.level === 1) {
        // Cấp 1 (Ngành): gán domainId, reset fieldId về "ALL"
        const dId = node.domainId || node.id.replace("domain-", "");
        setFilterState({
          domainId: dId,
          fieldId: "ALL",
          keyword: "",
          selectedTopicId: null,
        });
      } else if (node.level === 0) {
        // Cấp 0 (Gốc Cây): reset về tất cả
        setFilterState({
          domainId: "ALL",
          fieldId: "ALL",
          keyword: "",
          selectedTopicId: null,
        });
      }
    },
    [centerCamera, zoomLevel, curriculumData]
  );

  const handleBackgroundClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Danh sách các node con 1 cấp bên dưới của node đang được chọn
  const childNodes = useMemo(() => {
    if (!selectedNode) return [];

    // Cấp 0 (Gốc) -> Cấp 1 (8 Ngành)
    if (selectedNode.level === 0) {
      return curriculumData.domains.map((d) => {
        const subCount = curriculumData.domainSubjects.filter((ds) => ds.domain_id === d.id).length;
        return {
          id: `domain-${d.id}`,
          name: d.name,
          code: DOMAIN_CODE_MAP[d.id] || d.slug.toUpperCase(),
          subtitle: `${subCount} Môn học trực thuộc`,
          color: d.colorHex || d.color || "#7286D3",
          level: 1 as const,
        };
      });
    }

    // Cấp 1 (Ngành) -> Cấp 2 (Môn học)
    if (selectedNode.level === 1) {
      const dId = selectedNode.domainId || selectedNode.id.replace("domain-", "");
      const allowedSubjectIds = new Set(
        curriculumData.domainSubjects.filter((ds) => ds.domain_id === dId).map((ds) => ds.subject_id)
      );
      const subjectsInDomain = curriculumData.subjects.filter(
        (s) => allowedSubjectIds.has(s.id) || s.domainId === dId
      );
      return subjectsInDomain.map((s) => {
        const topCount = curriculumData.topics.filter((t) => t.subjectId === s.id).length;
        return {
          id: `subject-${s.id}`,
          name: s.name,
          code: s.slug.toUpperCase(),
          subtitle: `${topCount} Bài học & Chủ đề`,
          level: 2 as const,
        };
      });
    }

    // Cấp 2 (Môn học) -> Cấp 3 (Bài học)
    if (selectedNode.level === 2) {
      const sId = selectedNode.subjectId || selectedNode.id.replace("subject-", "");
      const topicsInSubject = curriculumData.topics.filter((t) => t.subjectId === sId);
      return topicsInSubject.map((t) => {
        return {
          id: `topic-${t.id}`,
          name: t.title,
          status: t.status,
          clarityScore: t.highestClarityScore,
          subtitle: t.summary ? (t.summary.length > 55 ? `${t.summary.slice(0, 52)}…` : t.summary) : undefined,
          level: 3 as const,
        };
      });
    }

    return [];
  }, [selectedNode, curriculumData]);

  // Click vào 1 node con trong Drawer để camera bay tới và chọn node đó
  const handleSelectChildNode = useCallback(
    (childNodeId: string) => {
      const found = graphData.nodes.find((n) => n.id === childNodeId);
      if (found) {
        handleNodeClick(found);
      }
    },
    [graphData.nodes, handleNodeClick]
  );

  const handleTeachTopic = (topicName: string) => {
    navigate(`/stage/new?topic=${encodeURIComponent(topicName)}`);
  };

  const handleStudyTopic = (topicId?: string) => {
    if (topicId) {
      selectTopic(topicId);
      navigate(`/study?topicId=${topicId}`);
    }
  };

  // Search handler: focus camera directly on the selected topic node
  const handleSelectTopicFromSearch = useCallback(
    (topic: CatalogTopic) => {
      setFilterState((prev) => ({
        ...prev,
        selectedTopicId: topic.id,
        domainId: topic.domainId || "ALL",
      }));
      const found = graphData.nodes.find(
        (n) => n.id === `topic-${topic.id}` || n.id === topic.id
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

  // Auto-focus camera on filter changes initiated from the search bar
  const handleFilterChangeFromSearch = useCallback(
    (newFilter: SearchFilterState) => {
      setFilterState((prev) => {
        // Only pan camera if user deliberately changed domain in the search toolbar
        if (newFilter.domainId !== prev.domainId) {
          if (newFilter.domainId && newFilter.domainId !== "ALL") {
            const dNode = graphData.nodes.find((n) => n.id === `domain-${newFilter.domainId}`);
            if (dNode && dNode.x != null && dNode.y != null) {
              centerCamera(dNode.x, dNode.y, 0.95, 800);
            }
          } else if (newFilter.domainId === "ALL" && !newFilter.selectedTopicId && !newFilter.keyword) {
            centerCamera(0, 0, 0.72, 800);
          }
        } else if (newFilter.fieldId !== prev.fieldId && newFilter.fieldId !== "ALL") {
          const sNode = graphData.nodes.find((n) => n.id === `subject-${newFilter.fieldId}`);
          if (sNode && sNode.x != null && sNode.y != null) {
            centerCamera(sNode.x, sNode.y, 1.05, 800);
          }
        }
        return newFilter;
      });
    },
    [graphData.nodes, centerCamera]
  );

  // Vòng nền tinh tế làm mốc cự ly hình Oval (Watermark Oval Tree Rings)
  const handleRenderFramePre = useCallback((ctx: CanvasRenderingContext2D, globalScale: number) => {
    ctx.save();
    const rings = [220, 420, 560];
    rings.forEach((r) => {
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.48, r * 0.82, 0, 0, 2 * Math.PI);
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

      const sourceId = typeof link.source === "object" ? (link.source as any).id : link.source;
      const targetId = typeof link.target === "object" ? (link.target as any).id : link.target;
      const pairKey = sourceId < targetId ? `${sourceId}__${targetId}` : `${targetId}__${sourceId}`;

      // Đường dẫn phát sáng nối từ node được chọn (hoặc hover) về tận Gốc Cây Feynman
      const isInActivePath =
        activeAncestry.linkIds.has(link.id) ||
        activeAncestry.linkEndpoints.has(pairKey) ||
        (selectedNode != null && (source.id === selectedNode.id || target.id === selectedNode.id));

      const isSourceMatch = isNodeHighlighted(source);
      const isTargetMatch = isNodeHighlighted(target);
      const hasActiveFilter =
        filterState.domainId !== "ALL" ||
        filterState.fieldId !== "ALL" ||
        filterState.keyword.length > 0 ||
        filterState.selectedTopicId != null;

      ctx.save();

      // Đường cong nhánh cây hữu cơ (Smooth Quadratic Curve)
      ctx.beginPath();
      ctx.moveTo(source.x, source.y);

      if (link.level === 1) {
        ctx.lineTo(target.x, target.y);
      } else {
        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2;
        const cpX = midX * 1.015;
        const cpY = midY * 1.015;
        ctx.quadraticCurveTo(cpX, cpY, target.x, target.y);
      }

      if (isInActivePath) {
        // ĐƯỜNG NỐI TỪ NODE VỀ TẬN GỐC SÁNG RỰC RỠ (ELECTRIC GLOWING PATH TO ROOT)
        ctx.strokeStyle = "#4338CA";
        ctx.lineWidth = (link.level === 1 ? 4.2 : link.level === 2 ? 3.4 : 2.6) / globalScale;
        ctx.setLineDash([]);
        ctx.shadowColor = "rgba(67, 56, 202, 0.9)";
        ctx.shadowBlur = 14 / globalScale;
        ctx.globalAlpha = 1.0;
      } else {
        // Làm mờ các nhánh không nằm trên đường dẫn truyền để làm nổi bật luồng sáng về gốc
        if (selectedNode != null || hoveredNode != null) {
          ctx.globalAlpha = 0.12;
        } else if (hasActiveFilter && (!isSourceMatch || !isTargetMatch)) {
          ctx.globalAlpha = 0.08;
        }

        if (link.isCrossLink) {
          ctx.strokeStyle = "rgba(130, 153, 224, 0.35)";
          ctx.lineWidth = 0.8 / globalScale;
          ctx.setLineDash([3 / globalScale, 4 / globalScale]);
        } else if (link.level === 1) {
          ctx.strokeStyle = "rgba(114, 134, 211, 0.65)";
          ctx.lineWidth = 2.2 / globalScale;
          ctx.setLineDash([]);
        } else if (link.level === 2) {
          ctx.strokeStyle = "rgba(130, 153, 224, 0.55)";
          ctx.lineWidth = 1.4 / globalScale;
          ctx.setLineDash([]);
        } else {
          ctx.strokeStyle = "rgba(148, 163, 184, 0.45)";
          ctx.lineWidth = 0.9 / globalScale;
          ctx.setLineDash([]);
        }
        ctx.shadowBlur = 0;
      }

      ctx.stroke();
      ctx.restore();
    },
    [selectedNode, hoveredNode, filterState, isNodeHighlighted, activeAncestry]
  );

  // =========================================================================
  // VẼ NODE CÂY TRI THỨC (GỐC, THÂN, CÀNH, LÁ)
  // =========================================================================
  const renderNodeCanvasObject = useCallback(
    (node: RadialTreeNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const isSelected = selectedNode?.id === node.id;
      const isHovered = hoveredNode?.id === node.id;
      const isActive = isSelected || isHovered;
      const isOnActivePath = activeAncestry.nodeIds.has(node.id);
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
      if (hasActiveFilter && !isMatch && !isOnActivePath) {
        ctx.globalAlpha = 0.12;
      } else if ((hasActiveFilter && isMatch) || isOnActivePath) {
        if (node.level >= 1) {
          ctx.shadowColor = isOnActivePath ? "#4338CA" : "#8299E0";
          ctx.shadowBlur = (isSelected || isOnActivePath ? 14 : 8) / globalScale;
        }
      }

      // -------------------------------------------------------------
      // LEVEL 0: GỐC CÂY (ROOT - KHÔNG GIAN FEYNMAN)
      // -------------------------------------------------------------
      if (node.level === 0) {
        const r = node.r ?? 44;

        // Vòng hào quang phát sáng khi có nhánh con đang được chọn
        if (isOnActivePath && activeAncestry.nodeIds.size > 1) {
          ctx.beginPath();
          ctx.arc(x, y, r + 5 / globalScale, 0, 2 * Math.PI);
          ctx.strokeStyle = "#4338CA";
          ctx.lineWidth = 2.6 / globalScale;
          ctx.shadowColor = "rgba(67, 56, 202, 0.7)";
          ctx.shadowBlur = 12 / globalScale;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = isActive || isOnActivePath ? "#7286D3" : "#ffffff";
        ctx.shadowColor = "rgba(114, 134, 211, 0.35)";
        ctx.shadowBlur = 12 / globalScale;
        ctx.fill();

        ctx.strokeStyle = isActive || isOnActivePath ? "#ffffff" : "#7286D3";
        ctx.lineWidth = 2.4 / globalScale;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, y, r - 5, 0, 2 * Math.PI);
        ctx.strokeStyle = isActive || isOnActivePath ? "rgba(255, 255, 255, 0.4)" : "rgba(114, 134, 211, 0.3)";
        ctx.lineWidth = 1 / globalScale;
        ctx.stroke();

        ctx.shadowBlur = 0;

        ctx.font = `900 ${7.5 / globalScale}px 'Lato', sans-serif`;
        ctx.fillStyle = isActive || isOnActivePath ? "#ffffff" : "#475569";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("CÂY TRI THỨC", x, y - 5 / globalScale);

        ctx.font = `900 ${9.0 / globalScale}px 'Lato', sans-serif`;
        ctx.fillStyle = isActive || isOnActivePath ? "#ffffff" : "#1E293B";
        ctx.fillText("FEYNMAN", x, y + 8 / globalScale);

        ctx.restore();
        return;
      }

      // -------------------------------------------------------------
      // LEVEL 1: THÂN CÀNH LỚN (8 DOMAINS)
      // -------------------------------------------------------------
      if (node.level === 1) {
        const r = isActive ? 25 : (node.r ?? 23);

        // Vòng phát sáng nếu thuộc chuỗi liên kết về gốc
        if (isOnActivePath) {
          ctx.beginPath();
          ctx.arc(x, y, r + 4 / globalScale, 0, 2 * Math.PI);
          ctx.strokeStyle = "#4338CA";
          ctx.lineWidth = 2.4 / globalScale;
          ctx.shadowColor = "rgba(67, 56, 202, 0.7)";
          ctx.shadowBlur = 10 / globalScale;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

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

        ctx.font = `900 ${9.5 / globalScale}px 'Lato', sans-serif`;
        ctx.fillStyle = isActive ? "#ffffff" : (node.color || "#334155");
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.shortLabel || "DOM", x, y);

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

        // Vòng phát sáng nếu thuộc chuỗi liên kết về gốc
        if (isOnActivePath) {
          ctx.beginPath();
          ctx.arc(x, y, r + 3 / globalScale, 0, 2 * Math.PI);
          ctx.strokeStyle = "#4338CA";
          ctx.lineWidth = 2.2 / globalScale;
          ctx.shadowColor = "rgba(67, 56, 202, 0.7)";
          ctx.shadowBlur = 8 / globalScale;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

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

        ctx.beginPath();
        ctx.arc(x, y, (isActive ? 2.8 : 2.0) / globalScale, 0, 2 * Math.PI);
        ctx.fillStyle = isActive ? "#ffffff" : "#7286D3";
        ctx.fill();

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

        // Vòng phát sáng nổi bật cho bài học được chọn
        if (isSelected || isOnActivePath) {
          ctx.beginPath();
          ctx.arc(x, y, r + 3 / globalScale, 0, 2 * Math.PI);
          ctx.strokeStyle = "#4338CA";
          ctx.lineWidth = 2.0 / globalScale;
          ctx.shadowColor = "rgba(67, 56, 202, 0.9)";
          ctx.shadowBlur = 10 / globalScale;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = isActive ? "#7286D3" : "#ffffff";
        if (isActive) {
          ctx.shadowColor = "rgba(114, 134, 211, 0.45)";
          ctx.shadowBlur = 8 / globalScale;
        }
        ctx.fill();

        let strokeColor = "#94a3b8";
        if (node.status === "MASTERED") strokeColor = "#10b981";
        else if (node.status === "GAP") strokeColor = "#ef4444";
        else if (node.status === "ACTIVE") strokeColor = "#f59e0b";

        ctx.strokeStyle = isActive ? "#ffffff" : strokeColor;
        ctx.lineWidth = (isActive ? 2.0 : 1.4) / globalScale;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(x, y, (isActive ? 2.4 : 1.6) / globalScale, 0, 2 * Math.PI);
        ctx.fillStyle = isActive ? "#ffffff" : strokeColor;
        ctx.fill();

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
    [selectedNode, hoveredNode, filterState, isNodeHighlighted, activeAncestry]
  );

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 space-y-2">
      {/* 3-Level Hierarchical Search Toolbar */}
      <TopicHierarchySearch
        onFilterChange={handleFilterChangeFromSearch}
        onSelectTopic={handleSelectTopicFromSearch}
        domains={curriculumData.domains}
        subjects={curriculumData.subjects}
        domainSubjects={curriculumData.domainSubjects}
        topics={curriculumData.topics}
        externalFilter={filterState}
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

        {/* Dynamic Physics ForceGraph2D Canvas */}
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
          enableNodeDrag={true}
          onNodeDrag={handleNodeDrag}
          onNodeDragEnd={handleNodeDragEnd}
          enableZoomInteraction={true}
          enablePanInteraction={true}
          cooldownTicks={120}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
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

          {/* Interactive Navigation Controls with Auto Layout */}
          <div className="flex items-center justify-end gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/90 shadow-md self-end text-slate-600">
            {/* Auto Layout Button */}
            <button
              onClick={handleAutoLayout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer border border-indigo-200/60 shadow-sm"
              title="Tự động sắp xếp lại Cây Tri Thức về vị trí cân đối"
            >
              <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Auto Layout</span>
            </button>

            <div className="w-px h-4 bg-slate-200" />

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

              {/* Danh sách các Node con 1 cấp bên dưới */}
              {childNodes.length > 0 && (
                <div className="space-y-2.5 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      {selectedNode.level === 0
                        ? `8 Nhóm Ngành Trực Thuộc (${childNodes.length})`
                        : selectedNode.level === 1
                        ? `Danh Sách Môn Học (${childNodes.length} Môn)`
                        : `Danh Sách Bài Học (${childNodes.length} Bài)`}
                    </h4>
                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/50">
                      Bấm để chọn
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                    {childNodes.map((child: any) => (
                      <div
                        key={child.id}
                        onClick={() => handleSelectChildNode(child.id)}
                        className="p-2.5 rounded-xl bg-slate-50/80 hover:bg-indigo-50/80 border border-slate-200/80 hover:border-indigo-300 transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs group-hover:border-indigo-300">
                            {child.level === 1 && <Sparkles className="w-3 h-3 text-indigo-600" />}
                            {child.level === 2 && <BookOpen className="w-3 h-3 text-blue-600" />}
                            {child.level === 3 && (
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  child.status === "COMPLETED" || child.status === "MASTERED"
                                    ? "bg-emerald-500"
                                    : child.status === "GAP" || child.status === "NEEDS_REVIEW"
                                    ? "bg-red-500"
                                    : child.status === "ACTIVE" || child.status === "IN_PROGRESS"
                                    ? "bg-amber-500"
                                    : "bg-slate-300"
                                }`}
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-700">
                              {child.name}
                            </div>
                            {child.subtitle && (
                              <div className="text-[10px] text-slate-400 truncate">
                                {child.subtitle}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {child.clarityScore !== undefined && child.clarityScore > 0 && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              {child.clarityScore}%
                            </span>
                          )}
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
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
