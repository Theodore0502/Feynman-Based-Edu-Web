/**
 * File: src/types/catalog.types.ts
 * Mục đích: Định nghĩa các kiểu dữ liệu cho Danh mục Học thuật (Academic Catalog), Bản đồ Đồ thị Tri thức và Lộ trình Tiên quyết.
 * Thành phần chính:
 *   - DomainCategory / DomainCatalog: Lĩnh vực học thuật (Toán cao cấp, Toán rời rạc, Thị giác máy tính, KHMT).
 *   - CatalogTopic: Chi tiết bài học kèm Ground Truth, Bẫy Jargon và Ẩn dụ mẫu.
 *   - GraphNode / KnowledgeGraphNode & GraphEdge / KnowledgeGraphEdge: Cấu trúc Topology Đồ thị tri thức (Nodes & Edges).
 */

export type LectureStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "NEEDS_REVIEW";

export interface AcademicSubject {
  id: string;
  domainId: string;
  domainSlug?: string;
  name: string;
  slug: string;
  description: string;
  orderIndex: number;
  difficultyLevel: number; // 1 - 5
  topicCount?: number;
  completedCount?: number;
}

export interface DomainCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  iconName?: string;
  icon?: string;
  color?: string;
  colorHex?: string;
  accentBg?: string;
  orderIndex?: number;
  subjectCount?: number;
  totalLectures?: number;
  completedLectures?: number;
  completionRate?: number; // 0 - 100
  topicCount?: number;
  topics?: CatalogTopic[];
}

export type DomainCatalog = DomainCategory;

export interface JargonTrapItem {
  term: string;
  trap?: string;
  explanation?: string;
  feynmanTranslation?: string;
  recommendedAnalogy?: string;
}

export interface StarterAnalogyItem {
  title: string;
  metaphor: string;
  applicableAudience?: string;
  targetAudience?: string;
}

export interface CatalogTopic {
  id: string;
  domainId: string;
  domainName: string;
  subjectId?: string;
  subjectSlug?: string;
  subjectName?: string;
  orderIndex?: number;
  title: string;
  slug: string;
  summary: string; // Ground Truth chuẩn mực
  difficultyLevel: number; // 1 - 5
  estimatedReadingMinutes: number;
  requiredConcepts: string[];
  jargonTraps: JargonTrapItem[];
  starterAnalogies: StarterAnalogyItem[];
  fullMaterialMarkdown?: string;
  prerequisiteIds?: string[];

  // Dynamic Learning Status
  status?: LectureStatus;
  highestClarityScore?: number | null;
  activeSessionId?: string | null;
  lastReportId?: string | null;

  // Extended optional properties for deep academic metadata
  titleVi?: string;
  titleEn?: string;
  difficulty?: string;
  groundTruthVi?: string;
  coreConcepts?: string[];
  analogyHints?: StarterAnalogyItem[];
  prerequisites?: string[];
  subConcepts?: string[];
  practicalApplications?: string[];
  wikipediaUrl?: string;
  wikipediaSummary?: string;
  thumbnailUrl?: string;
}

export interface GraphNode {
  id: string;
  topicId?: string;
  label: string;
  domainId: string;
  domain?: string;
  category?: string;
  level?: string;
  score?: number; // % Clarity thấu suốt
  masteryScore?: number;
  x: string | number;
  y: string | number;
  color?: string;
  difficulty?: number | string;
  prerequisites?: string[];
}

export type KnowledgeGraphNode = GraphNode;

export interface GraphEdge {
  id?: string;
  source: string; // ID node nguồn
  target: string; // ID node đích
  relationType?: "PREREQUISITE" | "SUB_CONCEPT" | "RELATED" | string;
  relationship?: "PREREQUISITE" | "SUB_CONCEPT" | "RELATED" | string;
  label?: string;
}

export type KnowledgeGraphEdge = GraphEdge;
