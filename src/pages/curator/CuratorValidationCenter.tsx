/**
 * File: src/pages/curator/CuratorValidationCenter.tsx
 * Mục đích: Bàn Thẩm Định Tri Thức (Knowledge Curator Validation Studio) dành cho Submitter / Curator & Admin.
 * Tính năng chính:
 *   - Lọc theo Nhóm Ngành phụ trách (Curator có thể tự chọn / chuyển đổi các nhóm ngành thuộc chuyên môn của mình).
 *   - Danh sách hàng đợi bài học do AI Agent trích xuất từ tài liệu người dùng.
 *   - Giao diện Dual-Pane / Workspace: Xem trước tóm tắt bài giảng & trích xuất đối chiếu.
 *   - Bộ công cụ hiệu chỉnh nhãn kiến thức tương tác: Thêm / Sửa / Xóa Khái niệm cốt lõi (Required Concepts) và Bẫy thuật ngữ (Jargon Traps).
 *   - Nút "Phê Duyệt & Xuất Bản Tri Thức (Validate & Publish)" -> Lưu vào Supabase academic_topics với status 'VALIDATED'.
 *   - Thừa kế toàn quyền cho Admin.
 */

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileCheck,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Plus,
  X,
  Clock,
  Sparkles,
  Layers,
  BookOpen,
  AlertTriangle,
  Send,
  Eye,
  RefreshCw,
  FolderOpen,
  Save,
  Check,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/hooks/useAuthStore";
import { CurriculumService } from "@/lib/services/curriculum-service";
import {
  DocumentExtractionAgent,
  ExtractedLessonDraft,
} from "@/lib/services/document-extraction-agent";
import { DomainCategory, AcademicSubject } from "@/types/catalog.types";

export const CuratorValidationCenter: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [domains, setDomains] = useState<DomainCategory[]>([]);
  const [subjects, setSubjects] = useState<AcademicSubject[]>([]);
  const [drafts, setDrafts] = useState<ExtractedLessonDraft[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Selected domain filter (Curator domain selector)
  const [activeDomainFilter, setActiveDomainFilter] = useState<string>("ALL");

  // Selected Draft for Inspection & Editing
  const [selectedDraft, setSelectedDraft] = useState<ExtractedLessonDraft | null>(null);

  // Editable Form State
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

  // Load Curriculum Data & Drafts
  const loadData = async () => {
    setIsLoading(true);
    try {
      const curr = await CurriculumService.getAllCurriculumGraphData();
      setDomains(curr.domains);
      setSubjects(curr.subjects);

      const allDrafts = await DocumentExtractionAgent.getAllDrafts();
      setDrafts(allDrafts);

      // Select first draft if none selected
      if (allDrafts.length > 0 && !selectedDraft) {
        selectDraftToEdit(allDrafts[0]);
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

  // When a draft is chosen, populate form fields
  const selectDraftToEdit = (draft: ExtractedLessonDraft) => {
    setSelectedDraft(draft);
    setEditTitle(draft.title);
    setEditSlug(draft.slug);
    setEditSummary(draft.summary);
    setEditDifficulty(draft.difficultyLevel);
    setEditReadingMinutes(draft.estimatedReadingMinutes);
    setEditConcepts([...draft.requiredConcepts]);
    setEditJargons([...draft.jargonTraps]);
  };

  // Filter drafts based on curator's chosen domain filter
  const filteredDrafts = useMemo(() => {
    if (activeDomainFilter === "ALL") return drafts;
    return drafts.filter((d) => d.domainId === activeDomainFilter);
  }, [drafts, activeDomainFilter]);

  const pendingCount = useMemo(() => {
    return drafts.filter((d) => d.status === "PENDING_VALIDATION").length;
  }, [drafts]);

  // Handle Tag Addition
  const handleAddConcept = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = newConceptInput.trim();
    if (!val) return;
    if (editConcepts.includes(val)) {
      toast.warning("Khái niệm này đã có trong danh sách!");
      return;
    }
    setEditConcepts((prev) => [...prev, val]);
    setNewConceptInput("");
  };

  const handleRemoveConcept = (index: number) => {
    setEditConcepts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddJargon = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  // Save Edits without validating
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
        toast.success("Đã lưu các thay đổi nhãn và nội dung bản nháp!");
      }
    } catch (err: any) {
      toast.error("Không thể lưu: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validate & Publish to Supabase
  const handleValidateAndPublish = async () => {
    if (!selectedDraft || !user) return;
    if (editConcepts.length === 0) {
      toast.error("Bài học cần có ít nhất 1 Khái niệm cốt lõi (Required Concept) trước khi xuất bản!");
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
        toast.success(
          `🎉 Đã thẩm định & xuất bản bài học "${editTitle}" thành công lên Supabase!`
        );

        // Update local state
        const updatedDraft = {
          ...selectedDraft,
          status: "VALIDATED" as const,
          title: editTitle,
          summary: editSummary,
          requiredConcepts: editConcepts,
          jargonTraps: editJargons,
          validatedBy: user.displayName || user.email,
          validatedAt: new Date().toISOString(),
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

  // Reject Draft
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
        toast.info("Đã từ chối bài học bản nháp");
        setRejectReasonModal(false);
        setRejectReason("");
        const updated = {
          ...selectedDraft,
          status: "REJECTED" as const,
          validationNote: rejectReason,
        };
        setSelectedDraft(updated);
        setDrafts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      }
    } catch (err: any) {
      toast.error("Lỗi khi từ chối: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-300 text-xs font-black tracking-wide border border-white/15">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Hội Đồng Thẩm Định Tri Thức (Curator Studio)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Bàn Thẩm Định & Chuẩn Hóa Nhãn Bài Học AI
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Kiểm định viên phụ trách rà soát các bài giảng do AI Agent phân tích từ tài liệu người dùng, tinh chỉnh
              danh mục Khái niệm cốt lõi & Bẫy thuật ngữ, trước khi phê duyệt đưa vào Cây Tri Thức 360°.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-300 block">
                Chờ Phê Duyệt
              </span>
              <span className="text-xl font-black text-amber-300">
                {pendingCount} bài
              </span>
            </div>
            <button
              onClick={() => navigate("/materials/upload")}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tải Lên Thêm Tài Liệu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Curator Assigned Domains Bar */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-sm flex items-center gap-2 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 shrink-0">
          <Filter className="w-3.5 h-3.5 text-indigo-600" />
          <span>Nhóm ngành phụ trách:</span>
        </div>

        <button
          onClick={() => setActiveDomainFilter("ALL")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
            activeDomainFilter === "ALL"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Tất cả ngành ({drafts.length})
        </button>

        {domains.map((d) => {
          const count = drafts.filter((dr) => dr.domainId === d.id).length;
          const isAssigned = user?.assignedDomains?.includes(d.id);
          return (
            <button
              key={d.id}
              onClick={() => setActiveDomainFilter(d.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeDomainFilter === d.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {isAssigned && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              <span>{d.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeDomainFilter === d.id
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Dual-Pane Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Pane: Draft Queue List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
              Hàng Đợi Bài Học ({filteredDrafts.length})
            </h3>
            <button
              onClick={loadData}
              className="text-[11px] text-slate-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
              Làm mới
            </button>
          </div>

          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            {filteredDrafts.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
                <p className="text-xs font-bold">Không có tài liệu nào chờ duyệt trong nhóm ngành này</p>
              </div>
            ) : (
              filteredDrafts.map((d) => {
                const isSelected = selectedDraft?.id === d.id;
                return (
                  <div
                    key={d.id}
                    onClick={() => selectDraftToEdit(d)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 text-left relative ${
                      isSelected
                        ? "bg-indigo-50/70 border-indigo-400 shadow-sm ring-2 ring-indigo-500/20"
                        : "bg-white hover:bg-slate-50 border-slate-200/90 shadow-2xs"
                    }`}
                  >
                    {/* Status Pill */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                          d.status === "VALIDATED"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : d.status === "REJECTED"
                            ? "bg-rose-100 text-rose-800 border border-rose-300"
                            : "bg-amber-100 text-amber-800 border border-amber-300"
                        }`}
                      >
                        {d.status === "VALIDATED"
                          ? "✓ Đã Xuất Bản"
                          : d.status === "REJECTED"
                          ? "✕ Đã Từ Chối"
                          : "⏳ Chờ Thẩm Định"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {d.fileName.slice(-12)}
                      </span>
                    </div>

                    <h4 className="text-xs font-black text-slate-800 line-clamp-2">
                      {d.title}
                    </h4>

                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-bold truncate max-w-[130px]">
                        {domainNameMap.get(d.domainId) || d.domainId}
                      </span>
                      <span>•</span>
                      <span>{d.estimatedReadingMinutes} phút</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-bold">
                        {d.requiredConcepts.length} nhãn
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100/80 truncate">
                      Tải bởi: <strong className="text-slate-600">{d.uploadedByName}</strong>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Interactive Validation & Tag Editor (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedDraft ? (
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-6">
              {/* Draft Header & Status Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                        selectedDraft.status === "VALIDATED"
                          ? "bg-emerald-100 text-emerald-800"
                          : selectedDraft.status === "REJECTED"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {selectedDraft.status === "VALIDATED"
                        ? "ĐÃ XUẤT BẢN THÀNH CÔNG"
                        : selectedDraft.status === "REJECTED"
                        ? "ĐÃ TỪ CHỐI BÀI HỌC"
                        : "ĐANG TRONG PHIÊN THẨM ĐỊNH"}
                    </span>
                    <span className="text-xs text-slate-400">
                      Tệp nguồn: <strong className="text-slate-600">{selectedDraft.fileName}</strong>
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Thuộc:{" "}
                    <strong className="text-indigo-700">
                      {domainNameMap.get(selectedDraft.domainId)}
                    </strong>{" "}
                    › {subjectNameMap.get(selectedDraft.subjectId) || selectedDraft.subjectId}
                  </div>
                </div>

                {selectedDraft.status === "VALIDATED" && (
                  <button
                    onClick={() => navigate(`/topics`)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem Trên Cây Tri Thức 360°</span>
                  </button>
                )}
              </div>

              {/* Title & Slug Form Inputs */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                    Tên Bài Học (Title)
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      URL Slug
                    </label>
                    <input
                      type="text"
                      value={editSlug}
                      onChange={(e) => setEditSlug(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Độ Khó (1 - 5)
                    </label>
                    <select
                      value={editDifficulty}
                      onChange={(e) => setEditDifficulty(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                    >
                      <option value={1}>Cấp 1 - Khởi Động & Nền Tảng</option>
                      <option value={2}>Cấp 2 - Cơ Bản & Nhập Môn</option>
                      <option value={3}>Cấp 3 - Tiêu Chuẩn Học Thuật</option>
                      <option value={4}>Cấp 4 - Nâng Cao & Tối Ưu</option>
                      <option value={5}>Cấp 5 - Chuyên Gia & Nghiên Cứu</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Thời Lượng Đọc (Phút)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={90}
                      value={editReadingMinutes}
                      onChange={(e) => setEditReadingMinutes(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Summary / Ground Truth */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                    Định Nghĩa Chuẩn & Tóm Tắt (Feynman Ground Truth)
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Cơ sở để AI chấm điểm trong Feynman Stage
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* INTERACTIVE TAG MANAGER 1: Khái Niệm Cốt Lõi (Required Concepts) */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Khái Niệm Cốt Lõi Bắt Buộc ({editConcepts.length})
                  </h4>
                  <span className="text-[10px] text-emerald-700">
                    Nhấn phím Enter để thêm nhanh nhãn
                  </span>
                </div>

                {/* Concept Badges */}
                <div className="flex flex-wrap gap-2">
                  {editConcepts.map((concept, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 text-xs font-bold bg-white text-emerald-900 px-3 py-1 rounded-xl border border-emerald-300 shadow-2xs group"
                    >
                      <span>{concept}</span>
                      <button
                        onClick={() => handleRemoveConcept(idx)}
                        className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Xóa nhãn này"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add Concept Input Form */}
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
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm Nhãn</span>
                  </button>
                </form>
              </div>

              {/* INTERACTIVE TAG MANAGER 2: Bẫy Thuật Ngữ (Jargon Traps) */}
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Bẫy Thuật Ngữ Cần Phòng Tránh ({editJargons.length})
                  </h4>
                  <span className="text-[10px] text-rose-700">
                    Phát hiện lỗi dùng từ sáo rỗng
                  </span>
                </div>

                {/* Jargon Badges */}
                <div className="flex flex-wrap gap-2">
                  {editJargons.map((jargon, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 text-xs font-bold bg-white text-rose-900 px-3 py-1 rounded-xl border border-rose-300 shadow-2xs group"
                    >
                      <span>{jargon}</span>
                      <button
                        onClick={() => handleRemoveJargon(idx)}
                        className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Xóa bẫy thuật ngữ này"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add Jargon Input Form */}
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
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm Bẫy</span>
                  </button>
                </form>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setRejectReasonModal(true)}
                  disabled={isSubmitting || selectedDraft.status === "REJECTED"}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-bold border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Từ Chối Bài Học</span>
                </button>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleSaveEditsOnly}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu Bản Sửa</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleValidateAndPublish}
                    disabled={isSubmitting || selectedDraft.status === "VALIDATED"}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang Xuất Bản...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Phê Duyệt & Xuất Bản Tri Thức (Validate & Publish)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 space-y-3">
              <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-600">Chọn một bài học từ hàng đợi bên trái để bắt đầu thẩm định</p>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {rejectReasonModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-scale-in">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600" />
              Lý Do Từ Chối Bài Học
            </h3>
            <p className="text-xs text-slate-500">
              Vui lòng nêu rõ lý do để người tải lên hoặc tác giả có thể chỉnh sửa và hoàn thiện tài liệu:
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="VD: Cấu trúc khái niệm còn quá sơ sài, cần bổ sung thêm bối cảnh ứng dụng thực tế..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-rose-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectReasonModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-sm"
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
