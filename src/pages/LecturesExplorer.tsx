/**
 * File: src/pages/LecturesExplorer.tsx
 * Mục đích: Giao diện Trung Tâm Bài Giảng 3 Tầng (Three-Tier Lectures Explorer)
 *   - Cấp 1: Danh sách 8 Nhóm ngành (Grid 4 cột)
 *   - Cấp 2: Danh sách Môn học (Grid 4 cột thứ tự 1 2 3 4 / 5 6 7 8)
 *   - Cấp 3: Danh sách Bài giảng dọc (Table View kèm bộ lọc trạng thái và action buttons)
 */

import React, { useState, useMemo, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  THREE_TIER_DOMAINS,
  THREE_TIER_SUBJECTS,
  THREE_TIER_LECTURES,
  getDomainBySlug,
  getSubjectBySlug,
  getSubjectsByDomainSlug,
  getLecturesBySubjectSlug,
} from "@/data/three-tier-curriculum.data";
import { CurriculumService } from "@/lib/services/curriculum-service";
import { DomainCard } from "@/components/lectures/DomainCard";
import { SubjectCard } from "@/components/lectures/SubjectCard";
import { LectureRow } from "@/components/lectures/LectureRow";
import type { DomainCategory, AcademicSubject, CatalogTopic, LectureStatus } from "@/types/catalog.types";
import {
  Search,
  BookOpen,
  Filter,
  Layers,
  Sparkles,
  ArrowLeft,
  GraduationCap,
  CheckCircle2,
  Clock,
  AlertCircle,
  Cpu,
  Terminal,
  Code2,
  ShoppingCart,
  Calculator,
  Briefcase,
  Compass,
  Stethoscope,
  Sigma,
  Eye,
  Network,
  Globe,
  TrendingUp,
  HeartPulse,
  BarChart3,
} from "lucide-react";

const DOMAIN_ICONS: Record<string, React.ElementType> = {
  Cpu,
  Terminal,
  Code2,
  ShoppingCart,
  Calculator,
  Briefcase,
  Compass,
  Stethoscope,
  Sigma,
  Eye,
  Network,
  Globe,
  TrendingUp,
  HeartPulse,
  BarChart3,
};

const getDifficultyBadge = (level: number) => {
  if (level <= 2) return { text: "Cơ Bản", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (level <= 3) return { text: "Trung Bình", color: "bg-blue-50 text-blue-700 border-blue-200" };
  if (level <= 4) return { text: "Nâng Cao", color: "bg-amber-50 text-amber-700 border-amber-200" };
  return { text: "Chuyên Sâu", color: "bg-rose-50 text-rose-700 border-rose-200" };
};

export const LecturesExplorer: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();

  const domainSlug = params.domainSlug;
  const subjectSlug = params.subjectSlug;

  // Determine current tier level (1, 2, or 3)
  const currentLevel = subjectSlug ? 3 : domainSlug ? 2 : 1;

  // Cấp 3 Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");

  // Dynamic State with Instant Fallback
  const [domains, setDomains] = useState<DomainCategory[]>(THREE_TIER_DOMAINS);
  const [currentDomain, setCurrentDomain] = useState<DomainCategory | undefined>(() =>
    domainSlug ? getDomainBySlug(domainSlug) : undefined
  );
  const [domainSubjects, setDomainSubjects] = useState<AcademicSubject[]>(() =>
    domainSlug ? getSubjectsByDomainSlug(domainSlug) : []
  );
  const [currentSubject, setCurrentSubject] = useState<AcademicSubject | undefined>(() =>
    subjectSlug ? getSubjectBySlug(subjectSlug) : undefined
  );
  const [subjectLectures, setSubjectLectures] = useState<CatalogTopic[]>(() =>
    subjectSlug ? getLecturesBySubjectSlug(subjectSlug) : []
  );

  // Load Tier 1 (Domains from Supabase or Fallback)
  useEffect(() => {
    let isMounted = true;
    CurriculumService.getDomains().then((res) => {
      if (isMounted && res && res.length > 0) {
        setDomains(res);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Load Tier 2 (Subjects of domainSlug from Supabase or Fallback)
  useEffect(() => {
    let isMounted = true;
    if (domainSlug) {
      setCurrentDomain(getDomainBySlug(domainSlug));
      setDomainSubjects(getSubjectsByDomainSlug(domainSlug));

      CurriculumService.getDomainBySlug(domainSlug).then((d) => {
        if (isMounted && d) setCurrentDomain(d);
      });

      CurriculumService.getSubjectsByDomainSlug(domainSlug).then((subs) => {
        if (isMounted && subs && subs.length > 0) {
          setDomainSubjects(subs);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [domainSlug]);

  // Load Tier 3 (Lectures of subjectSlug from Supabase or Fallback)
  useEffect(() => {
    let isMounted = true;
    if (subjectSlug) {
      setCurrentSubject(getSubjectBySlug(subjectSlug));
      setSubjectLectures(getLecturesBySubjectSlug(subjectSlug));

      CurriculumService.getSubjectBySlug(subjectSlug).then((s) => {
        if (isMounted && s) setCurrentSubject(s);
      });

      CurriculumService.getLecturesBySubjectSlug(subjectSlug).then((lecs) => {
        if (isMounted && lecs && lecs.length > 0) {
          setSubjectLectures(lecs);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [subjectSlug]);

  // Filtered lectures for Level 3
  const filteredLectures = useMemo(() => {
    return subjectLectures.filter((lec) => {
      // 1. Search filter
      const matchesSearch =
        !searchQuery.trim() ||
        lec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lec.requiredConcepts.some((c) =>
          c.toLowerCase().includes(searchQuery.toLowerCase())
        );

      // 2. Status filter
      const matchesStatus =
        selectedStatusFilter === "ALL" ||
        lec.status === selectedStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [subjectLectures, searchQuery, selectedStatusFilter]);

  // Counts for status tabs
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: subjectLectures.length,
      COMPLETED: 0,
      IN_PROGRESS: 0,
      NEEDS_REVIEW: 0,
      NOT_STARTED: 0,
      VALIDATED: 0,
      PENDING_VALIDATION: 0,
    };
    subjectLectures.forEach((l) => {
      const s = l.status || "NOT_STARTED";
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [subjectLectures]);

  // Global totals for Level 1 Hero
  const totalCompletedGlobal = useMemo(() => {
    return THREE_TIER_LECTURES.filter((l) => l.status === "COMPLETED").length;
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ========================================================================= */}
      {/* CẤP 1: DANH SÁCH NHÓM NGÀNH (GRID 4 CỘT)                                   */}
      {/* ========================================================================= */}
      {currentLevel === 1 && (
        <div className="space-y-6">
          <div>
            {/* Page Title Header (Cấp 1: Kho Bài Giảng) */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#EEF2FC] via-[#F5F2FB] to-[#FFF5F5] p-4 sm:p-6 border border-[#E8EEF8] shadow-xs">
              {/* Dreamy Hero Background Image (mờ nhẹ) */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <img
                  src="/images/hero-banner-bg.png"
                  alt="Hero background"
                  className="w-full h-full object-cover object-center opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-white/50 via-white/30 to-white/50 backdrop-blur-[0.5px]" />
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
                {/* Lớp blur trắng ở dưới các chữ để nhìn rõ chữ */}
                <div className="space-y-2 p-5 sm:p-6 rounded-3xl bg-white/75 backdrop-blur-md border border-white/80 shadow-xs max-w-2xl">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                    Kho Bài Giảng Học Thuật
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Lựa chọn nhóm ngành chuyên môn để khám phá các môn học thành phần và bắt đầu chu trình giảng giải bình dân hóa cùng khán giả AI.
                  </p>
                </div>

                {/* Global Quick Metrics (Lớp blur trắng) */}
                <div className="flex items-center gap-4 bg-white/85 backdrop-blur-md p-4 rounded-2xl border border-white/80 shadow-xs shrink-0">
                  <div className="text-center px-2">
                    <div className="text-xl font-black text-slate-800">8</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Nhóm Ngành</div>
                  </div>
                  <div className="w-px h-8 bg-slate-200" />
                  <div className="text-center px-2">
                    <div className="text-xl font-black text-slate-800">{THREE_TIER_SUBJECTS.length}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Môn Học</div>
                  </div>
                  <div className="w-px h-8 bg-slate-200" />
                  <div className="text-center px-2">
                    <div className="text-xl font-black text-[#5066A1]">
                      {totalCompletedGlobal}/{THREE_TIER_LECTURES.length}
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Đã Hoàn Thành</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid 4 Cột: 8 Nhóm Ngành */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {domains.map((domain, idx) => (
              <DomainCard key={domain.id} domain={domain} index={idx} />
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CẤP 2: DANH SÁCH MÔN HỌC (GRID 4 CỘT THEO THỨ TỰ 1 2 3 4 / 5 6 7 8)      */}
      {/* ========================================================================= */}
      {currentLevel === 2 && currentDomain && (
        <div className="space-y-6">
          {/* Page Title Header (Cấp 2: Nhóm Ngành) */}
          <div>
            <button
              onClick={() => navigate("/lectures")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-[#E2EAFD] text-xs font-bold text-slate-600 hover:text-[#5066A1] shadow-2xs transition-all cursor-pointer group mb-3"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>Quay lại Kho Bài Giảng</span>
            </button>

            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8EEF8] shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xs shrink-0 mt-0.5"
                  style={{
                    backgroundColor: `${currentDomain.colorHex || "#7286D3"}15`,
                    color: currentDomain.colorHex || "#7286D3",
                  }}
                >
                  {React.createElement(
                    DOMAIN_ICONS[currentDomain.iconName || "Cpu"] || BookOpen,
                    { className: "w-7 h-7" }
                  )}
                </div>

                <div className="space-y-1.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                    {currentDomain.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                    {currentDomain.description}
                  </p>
                </div>
              </div>

              {/* Summary Stats & Progress Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-[#F8FAFD] p-4 rounded-2xl border border-[#E2EAFD] shrink-0">
                <div className="text-center px-3">
                  <div className="text-xl font-black text-slate-800">
                    {domainSubjects.length}
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">
                    Môn Học
                  </div>
                </div>

                <div className="hidden sm:block w-px h-8 bg-slate-200" />

                <div className="space-y-1.5 min-w-[140px]">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-500">Tiến độ ngành:</span>
                    <span className="text-[#5066A1]">
                      {currentDomain.completedLectures}/{currentDomain.totalLectures} ({currentDomain.completionRate}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${currentDomain.completionRate || 0}%`,
                        backgroundColor: currentDomain.colorHex || "#7286D3",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid 4 Cột Môn Học (1 2 3 4 / 5 6 7 8) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {domainSubjects.map((subject, idx) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                domainSlug={domainSlug!}
                orderNumber={idx + 1}
              />
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CẤP 3: DANH SÁCH BÀI GIẢNG TRONG MÔN (VERTICAL LIST / TABLE VIEW)          */}
      {/* ========================================================================= */}
      {currentLevel === 3 && currentSubject && (
        <div className="space-y-6">
          {/* Page Title Header (Cấp 3: Môn Học) */}
          <div>
            <button
              onClick={() => navigate(`/lectures/${domainSlug}`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-[#E2EAFD] text-xs font-bold text-slate-600 hover:text-[#5066A1] shadow-2xs transition-all cursor-pointer group mb-3"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>Quay lại {currentDomain?.name || "Nhóm Ngành"}</span>
            </button>

            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8EEF8] shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#EEF2FC] text-[#5066A1] flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                  <BookOpen className="w-7 h-7" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EEF2FC] text-[#5066A1] text-[11px] font-black tracking-wide border border-[#D5E1FA] uppercase">
                      <span>{currentDomain?.name || "Môn Học"}</span>
                    </span>

                    {/* Difficulty Badge */}
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        getDifficultyBadge(currentSubject.difficultyLevel).color
                      }`}
                    >
                      {getDifficultyBadge(currentSubject.difficultyLevel).text}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                    {currentSubject.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                    {currentSubject.description}
                  </p>
                </div>
              </div>

              {/* Summary Stats & Progress Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-[#F8FAFD] p-4 rounded-2xl border border-[#E2EAFD] shrink-0">
                <div className="text-center px-3">
                  <div className="text-xl font-black text-slate-800">
                    {subjectLectures.length}
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">
                    Bài Giảng
                  </div>
                </div>

                <div className="hidden sm:block w-px h-8 bg-slate-200" />

                <div className="space-y-1.5 min-w-[140px]">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-500">Đã hoàn thành:</span>
                    <span className="text-emerald-600">
                      {currentSubject.completedCount}/{currentSubject.topicCount} ({Math.round(((currentSubject.completedCount || 0) / (currentSubject.topicCount || 1)) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{
                        width: `${Math.round(((currentSubject.completedCount || 0) / (currentSubject.topicCount || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar & Status Filter Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm bài giảng hoặc khái niệm cốt lõi..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-[#E8EEF8] text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8EA7E9] shadow-subtle"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedStatusFilter === "ALL"
                    ? "bg-[#7286D3] text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-[#E8EEF8]"
                }`}
              >
                Tất cả ({statusCounts.ALL})
              </button>

              <button
                onClick={() => setSelectedStatusFilter("COMPLETED")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  selectedStatusFilter === "COMPLETED"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Đã học ({statusCounts.COMPLETED})</span>
              </button>

              <button
                onClick={() => setSelectedStatusFilter("IN_PROGRESS")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  selectedStatusFilter === "IN_PROGRESS"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-white text-amber-700 hover:bg-amber-50 border border-amber-200"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Đang học ({statusCounts.IN_PROGRESS})</span>
              </button>

              <button
                onClick={() => setSelectedStatusFilter("NEEDS_REVIEW")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  selectedStatusFilter === "NEEDS_REVIEW"
                    ? "bg-rose-500 text-white shadow-xs"
                    : "bg-white text-rose-700 hover:bg-rose-50 border border-rose-200"
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Học lại ({statusCounts.NEEDS_REVIEW})</span>
              </button>

              <button
                onClick={() => setSelectedStatusFilter("NOT_STARTED")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedStatusFilter === "NOT_STARTED"
                    ? "bg-slate-700 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-[#E8EEF8]"
                }`}
              >
                Chưa học ({statusCounts.NOT_STARTED})
              </button>
            </div>
          </div>

          {/* Table View */}
          <div className="bg-white rounded-3xl border border-[#E8EEF8] shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFD] border-b border-[#E8EEF8] text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4 w-12">STT</th>
                    <th className="py-3.5 px-4">Tiêu đề bài giảng & Khái niệm cốt lõi</th>
                    <th className="py-3.5 px-4 w-36">Trạng thái</th>
                    <th className="py-3.5 px-4 w-28 text-center">Điểm Clarity</th>
                    <th className="py-3.5 px-4 w-44 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLectures.length > 0 ? (
                    filteredLectures.map((lecture, idx) => (
                      <LectureRow
                        key={lecture.id}
                        lecture={lecture}
                        orderNumber={idx + 1}
                        domainSlug={domainSlug}
                        subjectSlug={subjectSlug}
                      />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 text-xs font-bold">
                        Không tìm thấy bài giảng nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LecturesExplorer;

