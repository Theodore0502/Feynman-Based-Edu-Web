/**
 * File: src/lib/services/curriculum-service.ts
 * Purpose: Dịch vụ truy vấn dữ liệu Kho Bài Giảng 3 Tầng (Three-Tier Curriculum) từ Supabase
 *          với cơ chế Fallback tự động 100% về static dataset three-tier-curriculum.data.ts
 *          nếu Supabase chưa kết nối hoặc đang offline.
 */

import { supabase } from "@/lib/supabase";
import {
  THREE_TIER_DOMAINS,
  THREE_TIER_SUBJECTS,
  THREE_TIER_DOMAIN_SUBJECTS,
  THREE_TIER_LECTURES,
  getDomainBySlug,
  getSubjectBySlug,
  getSubjectsByDomainSlug,
  getLecturesBySubjectSlug,
} from "@/data/three-tier-curriculum.data";
import type { DomainCategory, AcademicSubject, CatalogTopic } from "@/types/catalog.types";

export const CurriculumService = {
  /**
   * Lấy danh sách 8 Nhóm Ngành học (Tier 1)
   */
  async getDomains(): Promise<DomainCategory[]> {
    try {
      const { data, error } = await supabase
        .from("academic_domains")
        .select("*")
        .order("order_index", { ascending: true });

      if (error || !data || data.length === 0) {
        return THREE_TIER_DOMAINS;
      }

      // Map Supabase rows sang format DomainCategory
      return data.map((d: any) => {
        const fallbackDomain = THREE_TIER_DOMAINS.find((fd) => fd.id === d.id || fd.slug === d.slug);
        return {
          id: d.id,
          slug: d.slug,
          name: d.name,
          description: d.description,
          iconName: d.icon_name || fallbackDomain?.iconName || "Cpu",
          color: d.color || fallbackDomain?.color || "#3B82F6",
          colorHex: d.color_hex || fallbackDomain?.colorHex || "#3B82F6",
          accentBg: d.accent_bg || fallbackDomain?.accentBg || "bg-blue-500/10",
          orderIndex: d.order_index,
          subjectCount: fallbackDomain?.subjectCount || 4,
          totalLectures: fallbackDomain?.totalLectures || 0,
          completedLectures: fallbackDomain?.completedLectures || 0,
          completionRate: fallbackDomain?.completionRate || 0,
          topicCount: fallbackDomain?.topicCount || 0,
        };
      });
    } catch (err) {
      console.warn("CurriculumService.getDomains fallback:", err);
      return THREE_TIER_DOMAINS;
    }
  },

  /**
   * Lấy chi tiết một Domain theo slug
   */
  async getDomainBySlug(slug: string): Promise<DomainCategory | undefined> {
    try {
      const { data, error } = await supabase
        .from("academic_domains")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error || !data) {
        return getDomainBySlug(slug);
      }

      const fallback = getDomainBySlug(slug);
      return {
        id: data.id,
        slug: data.slug,
        name: data.name,
        description: data.description,
        iconName: data.icon_name || fallback?.iconName || "Cpu",
        color: data.color || fallback?.color || "#3B82F6",
        colorHex: data.color_hex || fallback?.colorHex || "#3B82F6",
        accentBg: data.accent_bg || fallback?.accentBg || "bg-blue-500/10",
        orderIndex: data.order_index,
        subjectCount: fallback?.subjectCount || 4,
        totalLectures: fallback?.totalLectures || 0,
        completedLectures: fallback?.completedLectures || 0,
        completionRate: fallback?.completionRate || 0,
        topicCount: fallback?.topicCount || 0,
      };
    } catch (err) {
      return getDomainBySlug(slug);
    }
  },

  /**
   * Lấy danh sách Môn học thuộc một Ngành học (Tier 2 - Hỗ trợ môn chung N-N)
   */
  async getSubjectsByDomainSlug(domainSlug: string): Promise<AcademicSubject[]> {
    try {
      // 1. Tìm domainId từ slug
      const { data: domData, error: domErr } = await supabase
        .from("academic_domains")
        .select("id")
        .eq("slug", domainSlug)
        .maybeSingle();

      if (domErr || !domData) {
        return getSubjectsByDomainSlug(domainSlug);
      }

      // 2. Query bảng quan hệ domain_subjects liên kết academic_subjects
      const { data: links, error: linkErr } = await supabase
        .from("domain_subjects")
        .select(`
          order_index,
          is_core,
          academic_subjects (
            id,
            slug,
            name,
            description,
            difficulty_level,
            order_index
          )
        `)
        .eq("domain_id", domData.id)
        .order("order_index", { ascending: true });

      if (linkErr || !links || links.length === 0) {
        return getSubjectsByDomainSlug(domainSlug);
      }

      const subjects: AcademicSubject[] = [];
      for (const item of links) {
        const sub: any = item.academic_subjects;
        if (!sub) continue;

        const fallbackSub = THREE_TIER_SUBJECTS.find((fs) => fs.id === sub.id || fs.slug === sub.slug);
        subjects.push({
          id: sub.id,
          domainId: domData.id,
          domainSlug,
          name: sub.name,
          slug: sub.slug,
          description: sub.description,
          difficultyLevel: sub.difficulty_level,
          orderIndex: item.order_index || sub.order_index,
          topicCount: fallbackSub?.topicCount || 12,
          completedCount: fallbackSub?.completedCount || 4,
        });
      }

      return subjects.length > 0 ? subjects : getSubjectsByDomainSlug(domainSlug);
    } catch (err) {
      console.warn("CurriculumService.getSubjectsByDomainSlug fallback:", err);
      return getSubjectsByDomainSlug(domainSlug);
    }
  },

  /**
   * Lấy chi tiết Môn học theo slug
   */
  async getSubjectBySlug(subjectSlug: string): Promise<AcademicSubject | undefined> {
    try {
      const { data, error } = await supabase
        .from("academic_subjects")
        .select("*")
        .eq("slug", subjectSlug)
        .maybeSingle();

      if (error || !data) {
        return getSubjectBySlug(subjectSlug);
      }

      const fallback = getSubjectBySlug(subjectSlug);
      return {
        id: data.id,
        domainId: fallback?.domainId || "",
        name: data.name,
        slug: data.slug,
        description: data.description,
        difficultyLevel: data.difficulty_level,
        orderIndex: data.order_index,
        topicCount: fallback?.topicCount || 12,
        completedCount: fallback?.completedCount || 4,
      };
    } catch (err) {
      return getSubjectBySlug(subjectSlug);
    }
  },

  /**
   * Lấy danh sách Bài học từ trên xuống thuộc một Môn học (Tier 3)
   */
  async getLecturesBySubjectSlug(subjectSlug: string): Promise<CatalogTopic[]> {
    try {
      // 1. Tìm subjectId
      const { data: subData, error: subErr } = await supabase
        .from("academic_subjects")
        .select("id, name, slug")
        .eq("slug", subjectSlug)
        .maybeSingle();

      if (subErr || !subData) {
        return getLecturesBySubjectSlug(subjectSlug);
      }

      // 2. Query các bài học thuộc môn
      const { data: topicsData, error: topErr } = await supabase
        .from("academic_topics")
        .select("*")
        .eq("subject_id", subData.id)
        .order("order_index", { ascending: true });

      if (topErr || !topicsData || topicsData.length === 0) {
        return getLecturesBySubjectSlug(subjectSlug);
      }

      return topicsData.map((t: any) => ({
        id: t.id,
        domainId: "",
        domainName: "",
        subjectId: subData.id,
        subjectSlug: subData.slug,
        subjectName: subData.name,
        title: t.title,
        slug: t.slug,
        summary: t.summary,
        difficultyLevel: t.difficulty_level,
        orderIndex: t.order_index,
        estimatedReadingMinutes: t.estimated_reading_minutes || 10,
        requiredConcepts: Array.isArray(t.required_concepts) ? t.required_concepts : [],
        jargonTraps: [],
        starterAnalogies: [],
        status: t.status || "NOT_STARTED",
        highestClarityScore: t.highest_clarity_score,
        activeSessionId: t.active_session_id,
      }));
    } catch (err) {
      console.warn("CurriculumService.getLecturesBySubjectSlug fallback:", err);
      return getLecturesBySubjectSlug(subjectSlug);
    }
  },

  /**
   * Truy vấn toàn bộ hệ thống tri thức (8 Ngành, 37 Môn, 56 Liên kết, 479 Bài học) từ Supabase
   * Phục vụ trực tiếp cho Đồ Thị Tri Thức 360° (/topics) và Hệ Thống Tìm Kiếm Phân Cấp.
   */
  async getAllCurriculumGraphData(): Promise<{
    domains: DomainCategory[];
    subjects: AcademicSubject[];
    domainSubjects: Array<{ domain_id: string; subject_id: string; is_core: boolean }>;
    topics: CatalogTopic[];
  }> {
    try {
      const [domRes, subRes, linkRes, topRes] = await Promise.all([
        supabase.from("academic_domains").select("*").order("order_index", { ascending: true }),
        supabase.from("academic_subjects").select("*").order("order_index", { ascending: true }),
        supabase.from("domain_subjects").select("*").order("order_index", { ascending: true }),
        supabase.from("academic_topics").select("*").order("order_index", { ascending: true }),
      ]);

      if (domRes.error || subRes.error || !domRes.data || !subRes.data) {
        return {
          domains: THREE_TIER_DOMAINS,
          subjects: THREE_TIER_SUBJECTS,
          domainSubjects: THREE_TIER_DOMAIN_SUBJECTS,
          topics: THREE_TIER_LECTURES,
        };
      }

      const domains: DomainCategory[] = domRes.data.map((d: any) => ({
        id: d.id,
        slug: d.slug,
        name: d.name,
        description: d.description,
        iconName: d.icon_name || "Cpu",
        color: d.color || "#3B82F6",
        colorHex: d.color_hex || d.color || "#3B82F6",
        accentBg: d.accent_bg || "bg-blue-500/10",
        orderIndex: d.order_index,
      }));

      const subjects: AcademicSubject[] = subRes.data.map((s: any) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        description: s.description,
        difficultyLevel: s.difficulty_level,
        orderIndex: s.order_index,
      }));

      const domainSubjects = (linkRes.data || []).map((ds: any) => ({
        domain_id: ds.domain_id,
        subject_id: ds.subject_id,
        is_core: ds.is_core ?? true,
      }));

      const topics: CatalogTopic[] = (topRes.data || []).map((t: any) => {
        const sub = subjects.find((s) => s.id === t.subject_id);
        const link = domainSubjects.find((ds: any) => ds.subject_id === t.subject_id);
        const dom = domains.find((d) => d.id === link?.domain_id);
        return {
          id: t.id,
          domainId: dom?.id || link?.domain_id || "",
          domainName: dom?.name || "",
          subjectId: t.subject_id,
          subjectSlug: sub?.slug,
          subjectName: sub?.name,
          title: t.title,
          slug: t.slug,
          summary: t.summary,
          difficultyLevel: t.difficulty_level,
          orderIndex: t.order_index,
          estimatedReadingMinutes: t.estimated_reading_minutes || 10,
          requiredConcepts: Array.isArray(t.required_concepts) ? t.required_concepts : [],
          status: t.status || "NOT_STARTED",
          highestClarityScore: t.highest_clarity_score,
          activeSessionId: t.active_session_id,
        };
      });

      return { domains, subjects, domainSubjects, topics };
    } catch (err) {
      console.warn("CurriculumService.getAllCurriculumGraphData fallback:", err);
      return {
        domains: THREE_TIER_DOMAINS,
        subjects: THREE_TIER_SUBJECTS,
        domainSubjects: THREE_TIER_DOMAIN_SUBJECTS,
        topics: THREE_TIER_LECTURES,
      };
    }
  },
};

