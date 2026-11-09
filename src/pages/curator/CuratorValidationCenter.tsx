/**
 * File: src/pages/curator/CuratorValidationCenter.tsx
 * Mục đích: Bàn Thẩm Định Tri Thức (Knowledge Curator Validation Studio) dành cho Submitter / Curator & Admin.
 * Đặc điểm:
 *   - Có Breadcrumb cụ thể: Trang chủ / Thẩm định tri thức / [Tên bài học].
 *   - Kiến trúc phân tầng 2 lớp trang con:
 *       + Lớp 1: Danh sách tài liệu bài học người dùng tải lên chờ duyệt (Full Width, không dùng icon).
 *       + Lớp 2: Chi tiết thẩm định & hiệu chỉnh bài học chuẩn Feynman (Full Width, không dùng icon).
 *   - Các trường bắt buộc hiển thị:
 *       + Tên bài học
 *       + Ngày giờ tải lên (nếu có chỉnh sửa thì update theo ngày giờ mới nhất)
 *       + Dung lượng file tải lên tính theo KB -> MB -> GB
 *       + Người tải lên & Trạng thái thẩm định
 *   - Hoàn toàn KHÔNG sử dụng icon theo đúng yêu cầu người dùng.
 */

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/hooks/useAuthStore";
import { CurriculumService } from "@/lib/services/curriculum-service";
import {
  DocumentExtractionAgent,
  ExtractedLessonDraft,
} from "@/lib/services/document-extraction-agent";
import { DomainCategory, AcademicSubject } from "@/types/catalog.types";
import { PageHeroBanner } from "@/components/shared/PageHeroBanner";

/**
 * Định dạng dung lượng tệp từ Byte sang KB -> MB -> GB
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 KB";
  const k = 1024;
  if (bytes < k) {
    return `${bytes} B`;
  } else if (bytes < k * k) {
    return `${(bytes / k).toFixed(1)} KB`;
  } else if (bytes < k * k * k) {
    return `${(bytes / (k * k)).toFixed(2)} MB`;
  } else {
    return `${(bytes / (k * k * k)).toFixed(2)} GB`;
  }
}

/**
 * Định dạng ngày giờ: HH:mm DD/MM/YYYY
 */
export function formatDateTime(isoString?: string): string {
  if (!isoString) return "--";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  } catch {
    return isoString;
  }
}

/**
 * Lấy ngày giờ hiển thị mới nhất (nếu có chỉnh sửa thì lấy ngày chỉnh sửa)
 */
export function getLatestTimestampInfo(draft: ExtractedLessonDraft): {
  isEdited: boolean;
  label: string;
  text: string;
} {
  if (draft.updatedAt) {
    return {
      isEdited: true,
      label: "Cập nhật",
      text: formatDateTime(draft.updatedAt),
    };
  }
  if (draft.validatedAt) {
    return {
      isEdited: true,
      label: "Đã thẩm định",
      text: formatDateTime(draft.validatedAt),
    };
  }
  return {
    isEdited: false,
    label: "Tải lên",
    text: formatDateTime(draft.uploadedAt),
  };
}

export const CuratorValidationCenter: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();

  const [domains, setDomains] = useState<DomainCategory[]>([]);
  const [subjects, setSubjects] = useState<AcademicSubject[]>([]);
  const [drafts, setDrafts] = useState<ExtractedLessonDraft[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Bộ lọc danh sách (Lớp 1)
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [domainFilter, setDomainFilter] = useState<string>("ALL");
  const [searchKeyword, setSearchKeyword] = useState<string>("");

  // Bài học đang chọn cho Lớp 2 (Chi tiết thẩm định)
  const [selectedDraft, setSelectedDraft] = useState<ExtractedLessonDraft | null>(null);

  // Form chỉnh sửa nội dung bài học
  const [editTitle, setEditTitle] = useState<string>("");
  const [editSlug, setEditSlug] = useState<string>("");
  const [editSummary, setEditSummary] = useState<string>("");
  const [editDifficulty, setEditDifficulty] = useState<number>(3);
  const [editReadingMinutes, setEditReadingMinutes] = useState<number>(15);
  const [editConcepts, setEditConcepts] = useState<string[]>([]);
  const [editJargons, setEditJargons] = useState<string[]>([]);
  const [newConceptInput, setNewConceptInput] = useState<string>("");
  const [newJargonInput, setNewJargonInput] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [rejectReasonModal, setRejectReasonModal] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>("");

  const urlDraftId = searchParams.get("draftId");

  // Nạp dữ liệu từ LocalStorage & Supabase
  const loadData = async () => {
    setIsLoading(true);
    try {
      const curr = await CurriculumService.getAllCurriculumGraphData();
      setDomains(curr.domains);
      setSubjects(curr.subjects);

      const allDrafts = await DocumentExtractionAgent.getAllDrafts();
      setDrafts(allDrafts);

      // Nếu URL có tham số draftId, mở trực tiếp Lớp 2
      if (urlDraftId) {
        const found = allDrafts.find((d) => d.id === urlDraftId);
        if (found) {
          selectDraftToEdit(found);
        }
      }
    } catch (err) {
      console.error("Lỗi nạp dữ liệu thẩm định:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Lắng nghe URL thay đổi để đồng bộ bài học được chọn
  useEffect(() => {
    if (!urlDraftId) {
      setSelectedDraft(null);
    } else if (drafts.length > 0) {
      const found = drafts.find((d) => d.id === urlDraftId);
      if (found && found.id !== selectedDraft?.id) {
        selectDraftToEdit(found);
      }
    }
  }, [urlDraftId, drafts]);

  // Chọn bài học để xem chi tiết / hiệu chỉnh (Chuyển sang Lớp 2)
  const selectDraftToEdit = (draft: ExtractedLessonDraft | null) => {
    if (draft) {
      setSelectedDraft(draft);
      setEditTitle(draft.title);
      setEditSlug(draft.slug);
      setEditSummary(draft.summary);
      setEditDifficulty(draft.difficultyLevel || 3);
      setEditReadingMinutes(draft.estimatedReadingMinutes || 15);
      setEditConcepts([...draft.requiredConcepts]);
      setEditJargons([...draft.jargonTraps]);
      setSearchParams({ draftId: draft.id });
    } else {
      setSelectedDraft(null);
      setSearchParams({});
    }
  };

  // Maps tra cứu tên nhóm ngành và môn học
  const domainNameMap = useMemo(() => {
    const map = new Map<string, string>();
    domains.forEach((d) => map.set(d.id, d.name));
    return map;
  }, [domains]);

  const subjectNameMap = useMemo(() => {
    const map = new Map<string, string>();
    subjects.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [subjects]);

  // Danh sách bài học sau khi lọc
  const filteredDrafts = useMemo(() => {
    return drafts.filter((d) => {
      // Lọc trạng thái
      if (statusFilter !== "ALL" && d.status !== statusFilter) {
        return false;
      }
      // Lọc nhóm ngành
      if (domainFilter !== "ALL" && d.domainId !== domainFilter) {
        return false;
      }
      // Tìm kiếm từ khóa
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        const matchTitle = d.title.toLowerCase().includes(q);
        const matchFileName = d.fileName.toLowerCase().includes(q);
        const matchUploader = d.uploadedByName.toLowerCase().includes(q);
        if (!matchTitle && !matchFileName && !matchUploader) {
          return false;
        }
      }
      return true;
    });
  }, [drafts, statusFilter, domainFilter, searchKeyword]);

  // Thống kê nhanh số lượng
  const stats = useMemo(() => {
    const pending = drafts.filter((d) => d.status === "PENDING_VALIDATION").length;
    const validated = drafts.filter((d) => d.status === "VALIDATED").length;
    const rejected = drafts.filter((d) => d.status === "REJECTED").length;
    return { total: drafts.length, pending, validated, rejected };
  }, [drafts]);

  // Xử lý thêm / bớt nhãn
  const handleAddConcept = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newConceptInput.trim();
    if (!val) return;
    if (editConcepts.includes(val)) {
      toast.warning("Khái niệm này đã tồn tại trong danh sách!");
      return;
    }
    setEditConcepts((prev) => [...prev, val]);
    setNewConceptInput("");
  };

  const handleRemoveConcept = (index: number) => {
    setEditConcepts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddJargon = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newJargonInput.trim();
    if (!val) return;
    if (editJargons.includes(val)) {
      toast.warning("Bẫy thuật ngữ này đã có trong danh sách!");
      return;
    }
    setEditJargons((prev) => [...prev, val]);
    setNewJargonInput("");
  };

  const handleRemoveJargon = (index: number) => {
    setEditJargons((prev) => prev.filter((_, i) => i !== index));
  };

  // Lưu chỉnh sửa (Cập nhật thời gian updatedAt)
  const handleSaveEditsOnly = async () => {
    if (!selectedDraft) return;
    setIsSubmitting(true);
    try {
      const updated = await DocumentExtractionAgent.updateDraft(selectedDraft.id, {
        title: editTitle,
        slug: editSlug,
        summary: editSummary,
        difficultyLevel: editDifficulty,
        estimatedReadingMinutes: editReadingMinutes,
        requiredConcepts: editConcepts,
        jargonTraps: editJargons,
      });

      if (updated) {
        setSelectedDraft(updated);
        setDrafts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
        toast.success("Đã lưu các thay đổi nội dung và cập nhật ngày giờ!");
      }
    } catch (err: any) {
      toast.error("Không thể lưu: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Phê duyệt và xuất bản lên Supabase
  const handleValidateAndPublish = async () => {
    if (!selectedDraft || !user) return;
    if (editConcepts.length === 0) {
      toast.error("Bài học cần có ít nhất 1 Khái niệm cốt lõi trước khi xuất bản!");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await DocumentExtractionAgent.validateAndPublishDraft(
        selectedDraft.id,
        user,
        {
          title: editTitle,
          slug: editSlug,
          summary: editSummary,
          difficultyLevel: editDifficulty,
          estimatedReadingMinutes: editReadingMinutes,
          requiredConcepts: editConcepts,
          jargonTraps: editJargons,
        }
      );

      if (result.success) {
        toast.success(`Đã thẩm định và xuất bản thành công bài học "${editTitle}"!`);
        const nowIso = new Date().toISOString();
        const updatedDraft = {
          ...selectedDraft,
          status: "VALIDATED" as const,
          title: editTitle,
          summary: editSummary,
          requiredConcepts: editConcepts,
          jargonTraps: editJargons,
          validatedBy: user.displayName || user.email,
          validatedAt: nowIso,
          updatedAt: nowIso,
        };
        setSelectedDraft(updatedDraft);
        setDrafts((prev) => prev.map((d) => (d.id === updatedDraft.id ? updatedDraft : d)));
      } else {
        toast.error("Xuất bản thất bại: " + result.error);
      }
    } catch (err: any) {
      toast.error("Lỗi khi xuất bản: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Từ chối bài học
  const handleConfirmReject = async () => {
    if (!selectedDraft || !user) return;
    setIsSubmitting(true);
    try {
      const ok = await DocumentExtractionAgent.rejectDraft(
        selectedDraft.id,
        rejectReason || "Chưa đạt tiêu chuẩn chuẩn hóa Feynman",
        user
      );
      if (ok) {
        toast.info("Đã từ chối bài học");
        setRejectReasonModal(false);
        setRejectReason("");
        const nowIso = new Date().toISOString();
        const updated = {
          ...selectedDraft,
          status: "REJECTED" as const,
          validationNote: rejectReason,
          validatedBy: user.displayName || user.email,
          validatedAt: nowIso,
          updatedAt: nowIso,
        };
        setSelectedDraft(updated);
        setDrafts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      }
    } catch (err: any) {
      toast.error("Lỗi khi từ chối bài học: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-5 pb-16">
      {/* =========================================================================
          BREADCRUMB CỤ THỂ (HOÀN TOÀN KHÔNG DÙNG ICON)
          ========================================================================= */}
      <nav aria-label="Breadcrumb" className="text-xs font-semibold text-slate-500">
        <ol className="flex items-center flex-wrap gap-2">
          <li>
            <Link
              to="/dashboard"
              className="text-slate-500 hover:text-indigo-600 transition-colors"
            >
              Trang chủ
            </Link>
          </li>
          <li className="text-slate-300">/</li>
          <li>
            <button
              type="button"
              onClick={() => selectDraftToEdit(null)}
              className={`transition-colors cursor-pointer ${
                selectedDraft
                  ? "text-slate-500 hover:text-indigo-600 underline"
                  : "text-indigo-900 font-bold"
              }`}
            >
              Thẩm định tri thức
            </button>
          </li>
          {selectedDraft && (
            <>
              <li className="text-slate-300">/</li>
              <li
                className="text-indigo-950 font-bold truncate max-w-lg"
                title={selectedDraft.title}
              >
                {selectedDraft.title}
              </li>
            </>
          )}
        </ol>
      </nav>

      {/* =========================================================================
          LỚP 1: DANH SÁCH BÀI HỌC TÀI LIỆU CHỜ DUYỆT (FULL WIDTH VIEW)
          ========================================================================= */}
      {!selectedDraft && (
        <div className="space-y-4">
          {/* Header Trang Danh Sách Đồng Bộ Chuẩn Dashboard */}
          <PageHeroBanner
            mascotSrc="/images/theodore-curator-owl.png"
            mascotAlt="Linh vật Thẩm định viên Theodore"
            badge={
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200/60 shadow-2xs">
                <span>Hội Đồng Thẩm Định Tri Thức (Curator Studio)</span>
              </div>
            }
            title={
              <>
                Bàn Thẩm Định &amp; Chuẩn Hóa{" "}
                <span className="whitespace-nowrap">Nhãn Bài Học AI</span>
              </>
            }
            description="Kiểm định viên phụ trách rà soát các bài giảng do AI Agent phân tích từ tài liệu người dùng, tinh chỉnh danh mục Khái niệm cốt lõi & Bẫy thuật ngữ, trước khi phê duyệt đưa vào Cây Tri Thức 360°."
            actions={
              <>
                <button
                  type="button"
                  onClick={() => navigate("/materials/upload")}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  Tải lên tài liệu mới
                </button>
                <button
                  type="button"
                  onClick={loadData}
                  disabled={isLoading}
                  className="px-4 py-2.5 rounded-2xl bg-white/90 hover:bg-white text-slate-700 text-xs font-bold border border-slate-200/80 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? "Đang tải..." : "Làm mới dữ liệu"}
                </button>
              </>
            }
            rightWidget={
              <div className="space-y-2.5 w-full text-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Tổng Quan Hàng Đợi
                </span>
                <div className="grid grid-cols-2 gap-2 text-center w-full">
                  <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/70">
                    <span className="text-lg font-black text-amber-700 block">
                      {stats.pending}
                    </span>
                    <span className="text-[9.5px] font-bold text-amber-800">Chờ duyệt</span>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200/70">
                    <span className="text-lg font-black text-emerald-700 block">
                      {stats.validated}
                    </span>
                    <span className="text-[9.5px] font-bold text-emerald-800">Đã xuất bản</span>
                  </div>
                </div>
                <div className="pt-1.5 border-t border-slate-100 text-[10px] text-slate-500 font-semibold">
                  Tổng số tài liệu: <strong className="text-slate-800">{stats.total} bài</strong>
                </div>
              </div>
            }
          />

          {/* Search & Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Keyword Search */}
              <div className="md:col-span-6">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Tìm theo tên bài học, tên file, hoặc người tải lên..."
                  className="w-full bg-[#F8FAFD] border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              {/* Status Filter */}
              <div className="md:col-span-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-[#F8FAFD] border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">Tất cả trạng thái ({stats.total})</option>
                  <option value="PENDING_VALIDATION">Chờ thẩm định ({stats.pending})</option>
                  <option value="VALIDATED">Đã xuất bản ({stats.validated})</option>
                  <option value="REJECTED">Đã từ chối ({stats.rejected})</option>
                </select>
              </div>

              {/* Domain Filter */}
              <div className="md:col-span-3">
                <select
                  value={domainFilter}
                  onChange={(e) => setDomainFilter(e.target.value)}
                  className="w-full bg-[#F8FAFD] border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">Tất cả nhóm ngành</option>
                  {domains.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Full Width Table of Documents */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Tên Bài Học & Tệp Nguồn</th>
                    <th className="py-3 px-4">Nhóm Ngành</th>
                    <th className="py-3 px-4">Dung Lượng</th>
                    <th className="py-3 px-4">Thời Gian</th>
                    <th className="py-3 px-4">Người Tải Lên</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredDrafts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                        Không tìm thấy tài liệu nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredDrafts.map((draft) => {
                      const timeInfo = getLatestTimestampInfo(draft);
                      const formattedSize = formatFileSize(draft.fileSize);

                      return (
                        <tr
                          key={draft.id}
                          onClick={() => selectDraftToEdit(draft)}
                          className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                        >
                          {/* 1. Tên Bài Học & Tệp Nguồn */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors line-clamp-1">
                              {draft.title}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-sm">
                              {draft.fileName}
                            </div>
                          </td>

                          {/* 2. Nhóm Ngành */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold">
                              {domainNameMap.get(draft.domainId) || draft.domainId}
                            </span>
                          </td>

                          {/* 3. Dung Lượng (KB -> MB -> GB) */}
                          <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-slate-700">
                            {formattedSize}
                          </td>

                          {/* 4. Ngày Giờ (Tải lên hoặc cập nhật mới nhất) */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-semibold text-slate-700">
                              {timeInfo.text}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {timeInfo.label}
                            </div>
                          </td>

                          {/* 5. Người Tải Lên */}
                          <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-600">
                            {draft.uploadedByName}
                          </td>

                          {/* 6. Trạng Thái Thẩm Định */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {draft.status === "VALIDATED" && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                                Đã xuất bản
                              </span>
                            )}
                            {draft.status === "REJECTED" && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-300">
                                Đã từ chối
                              </span>
                            )}
                            {draft.status === "PENDING_VALIDATION" && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                                Chờ thẩm định
                              </span>
                            )}
                          </td>

                          {/* 7. Thao Tác */}
                          <td className="py-3 px-4 whitespace-nowrap text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                selectDraftToEdit(draft);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-bold text-xs transition-colors cursor-pointer"
                            >
                              Thẩm định ngay
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          LỚP 2: CHI TIẾT THẨM ĐỊNH & HIỆU CHỈNH BÀI HỌC (DETAIL / WORKSPACE VIEW)
          ========================================================================= */}
      {selectedDraft && (
        <div className="space-y-4">
          {/* Header & Thanh Điều Hướng Lớp 2 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <button
                type="button"
                onClick={() => selectDraftToEdit(null)}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                ← Quay lại danh sách tài liệu
              </button>

              <div className="flex items-center gap-2">
                {selectedDraft.status === "VALIDATED" && (
                  <button
                    type="button"
                    onClick={() => navigate("/topics")}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Xem trên Cây Tri Thức 360°
                  </button>
                )}
                <span
                  className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${
                    selectedDraft.status === "VALIDATED"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : selectedDraft.status === "REJECTED"
                      ? "bg-rose-100 text-rose-800 border border-rose-300"
                      : "bg-amber-100 text-amber-800 border border-amber-300"
                  }`}
                >
                  {selectedDraft.status === "VALIDATED"
                    ? "ĐÃ XUẤT BẢN THÀNH CÔNG"
                    : selectedDraft.status === "REJECTED"
                    ? "ĐÃ TỪ CHỐI BÀI HỌC"
                    : "ĐANG CHỜ THẨM ĐỊNH"}
                </span>
              </div>
            </div>

            {/* Thông tin tổng quan file */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Tệp Nguồn
                </span>
                <span className="font-mono font-semibold text-slate-700 truncate block" title={selectedDraft.fileName}>
                  {selectedDraft.fileName}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Dung Lượng File
                </span>
                <span className="font-mono font-bold text-indigo-700">
                  {formatFileSize(selectedDraft.fileSize)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  {getLatestTimestampInfo(selectedDraft).label}
                </span>
                <span className="font-semibold text-slate-700">
                  {getLatestTimestampInfo(selectedDraft).text}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Người Tải Lên
                </span>
                <span className="font-semibold text-slate-700 truncate block">
                  {selectedDraft.uploadedByName}
                </span>
              </div>

              {selectedDraft.suggestedRoadmapPosition && (
                <div className="col-span-2 sm:col-span-4 bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-100">
                  <span className="text-[10px] uppercase font-bold text-indigo-600 block">
                    Định Vị Trong Master Knowledge Graph (Supabase)
                  </span>
                  <span className="font-semibold text-slate-800 text-xs">
                    {selectedDraft.suggestedRoadmapPosition}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Form Hiệu Chỉnh Chuẩn Feynman (Full Width) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-6">
            <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
              Nội Dung Bài Học & Chuẩn Hóa Nhãn Kiến Thức
            </h2>

            {/* Title & Slug */}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Tên Bài Học
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#F8FAFD] border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value)}
                    className="w-full bg-[#F8FAFD] border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Độ Khó (1 - 5)
                  </label>
                  <select
                    value={editDifficulty}
                    onChange={(e) => setEditDifficulty(Number(e.target.value))}
                    className="w-full bg-[#F8FAFD] border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  >
                    <option value={1}>Cấp 1 - Khởi Động & Nền Tảng</option>
                    <option value={2}>Cấp 2 - Cơ Bản & Nhập Môn</option>
                    <option value={3}>Cấp 3 - Tiêu Chuẩn Học Thuật</option>
                    <option value={4}>Cấp 4 - Nâng Cao & Tối Ưu</option>
                    <option value={5}>Cấp 5 - Chuyên Gia & Nghiên Cứu</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Thời Lượng Đọc (Phút)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={90}
                    value={editReadingMinutes}
                    onChange={(e) => setEditReadingMinutes(Number(e.target.value))}
                    className="w-full bg-[#F8FAFD] border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                {/* Reference Link (No icons rule maintained) */}
                <div className="sm:col-span-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                    URL Reference Link Học Thuật (Đóng Gói Tự Động)
                  </span>
                  <span className="font-mono text-xs text-indigo-700 block truncate select-all">
                    {selectedDraft.refLink ||
                      `https://theodore.edu.vn/materials/${selectedDraft.domainId}/${selectedDraft.subjectId}/${editSlug}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Summary / Ground Truth */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Định Nghĩa Chuẩn & Tóm Tắt (Feynman Ground Truth)
                </label>
                <span className="text-[10px] text-slate-400">
                  Cơ sở chấm điểm trong Feynman Stage
                </span>
              </div>
              <textarea
                rows={3}
                value={editSummary}
                onChange={(e) => setEditSummary(e.target.value)}
                className="w-full bg-[#F8FAFD] border border-slate-200 rounded-xl p-3 text-xs text-slate-800 leading-relaxed focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            {/* Tag Manager 1: Khái Niệm Cốt Lõi Bắt Buộc */}
            <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                  Khái Niệm Cốt Lõi Bắt Buộc ({editConcepts.length})
                </h3>
                <span className="text-[10px] text-emerald-700">
                  Người học bắt buộc phải giải thích được các khái niệm này
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {editConcepts.map((concept, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 text-xs font-bold bg-white text-emerald-900 px-3 py-1 rounded-lg border border-emerald-300 shadow-2xs"
                  >
                    <span>{concept}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveConcept(idx)}
                      className="text-slate-400 hover:text-red-600 font-bold ml-1 cursor-pointer"
                      title="Xóa nhãn này"
                    >
                      [Xóa]
                    </button>
                  </span>
                ))}
              </div>

              <form onSubmit={handleAddConcept} className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newConceptInput}
                  onChange={(e) => setNewConceptInput(e.target.value)}
                  placeholder="Thêm khái niệm cốt lõi mới..."
                  className="flex-1 bg-white border border-emerald-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Thêm Nhãn
                </button>
              </form>
            </div>

            {/* Tag Manager 2: Bẫy Thuật Ngữ */}
            <div className="p-4 rounded-xl bg-rose-50/40 border border-rose-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-rose-900 uppercase tracking-wider">
                  Bẫy Thuật Ngữ Cần Phòng Tránh ({editJargons.length})
                </h3>
                <span className="text-[10px] text-rose-700">
                  Các từ ngữ sáo rỗng hoặc hiểu lầm phổ biến
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {editJargons.map((jargon, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 text-xs font-bold bg-white text-rose-900 px-3 py-1 rounded-lg border border-rose-300 shadow-2xs"
                  >
                    <span>{jargon}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveJargon(idx)}
                      className="text-slate-400 hover:text-red-600 font-bold ml-1 cursor-pointer"
                      title="Xóa bẫy thuật ngữ này"
                    >
                      [Xóa]
                    </button>
                  </span>
                ))}
              </div>

              <form onSubmit={handleAddJargon} className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newJargonInput}
                  onChange={(e) => setNewJargonInput(e.target.value)}
                  placeholder="Thêm bẫy thuật ngữ hoặc quan niệm sai lầm..."
                  className="flex-1 bg-white border border-rose-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Thêm Bẫy
                </button>
              </form>
            </div>

            {/* Semantic Preview Snippet */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                Trích Xuất Nội Dung Đối Chiếu Từ Tài Liệu Gốc
              </span>
              <p className="text-xs text-slate-600 leading-relaxed italic bg-white p-3 rounded-lg border border-slate-200">
                "{selectedDraft.rawTextSnippet}"
              </p>
            </div>

            {/* Toolbar Hành Động (Không dùng icon) */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setRejectReasonModal(true)}
                disabled={isSubmitting || selectedDraft.status === "REJECTED"}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-bold border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                Từ Chối Bài Học
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSaveEditsOnly}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Đang lưu..." : "Lưu Bản Sửa"}
                </button>

                <button
                  type="button"
                  onClick={handleValidateAndPublish}
                  disabled={isSubmitting || selectedDraft.status === "VALIDATED"}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Đang xuất bản..." : "Phê Duyệt & Xuất Bản Tri Thức"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL TỪ CHỐI BÀI HỌC (KHÔNG DÙNG ICON)
          ========================================================================= */}
      {rejectReasonModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-scale-in">
            <h3 className="text-sm font-black text-slate-800">
              Lý Do Từ Chối Bài Học
            </h3>
            <p className="text-xs text-slate-500">
              Vui lòng nêu rõ lý do để người tải lên có thể hoàn thiện tài liệu:
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="VD: Cấu trúc khái niệm còn sơ sài, thiếu ví dụ thực tế..."
              className="w-full bg-[#F8FAFD] border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-rose-500 focus:bg-white"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectReasonModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                Xác Nhận Từ Chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CuratorValidationCenter;
