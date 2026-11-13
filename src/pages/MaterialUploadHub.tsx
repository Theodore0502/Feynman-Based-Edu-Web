/**
 * File: src/pages/MaterialUploadHub.tsx
 * Mục đích: Trung tâm tải lên tài liệu học tập & Kích hoạt Agent Hệ thống hóa Tri thức (Curriculum Digestion Agent).
 * Đặc điểm:
 *   - Giới hạn định dạng nghiêm ngặt: Chỉ chấp nhận .pdf, .pdfa, .doc, .docx, .pptx.
 *   - Lựa chọn Nhóm Ngành (Cấp 1) và Môn Học (Cấp 2) theo chuẩn Supabase.
 *   - Trình diễn Agent 4 bước: Quét tài liệu -> Chunking -> Gán nhãn khái niệm & Bẫy thuật ngữ -> Schema Feynman.
 *   - Chuyển giao sang Bàn Thẩm Định (Curator Validation Center).
 */

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Clock,
  BookOpen,
  X,
  FileCheck,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  File,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/hooks/useAuthStore";
import { CurriculumService } from "@/lib/services/curriculum-service";
import {
  DocumentExtractionAgent,
  ExtractedLessonDraft,
} from "@/lib/services/document-extraction-agent";
import { TaxonomyClassifier } from "@/lib/services/taxonomy-classifier";
import { DomainCategory, AcademicSubject, TaxonomyClassificationResult } from "@/types/catalog.types";
import { PageHeroBanner } from "@/components/shared/PageHeroBanner";

const ALLOWED_EXTENSIONS = [".pdf", ".pdfa", ".doc", ".docx", ".pptx"];

export interface UploadedDocRecord {
  id: string;
  file: File;
  name: string;
  size: number;
  extension: string;
  uploadedAt: string;
  classification: TaxonomyClassificationResult | null;
  status: "ready" | "processing" | "extracted";
}

export const MaterialUploadHub: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [domains, setDomains] = useState<DomainCategory[]>([]);
  const [subjects, setSubjects] = useState<AcademicSubject[]>([]);
  const [domainSubjects, setDomainSubjects] = useState<
    Array<{ domain_id: string; subject_id: string }>
  >([]);

  const [selectedDomainId, setSelectedDomainId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");

  // Quản lý danh sách tài liệu đã tải lên
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocRecord[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  const activeDoc = uploadedDocs.find((d) => d.id === activeDocId) || uploadedDocs[0] || null;
  const uploadedFile = activeDoc ? activeDoc.file : null;
  const aiClassification = activeDoc ? activeDoc.classification : null;

  const [fileError, setFileError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Agent State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [stageMessage, setStageMessage] = useState<string>("");
  const [extractedDraft, setExtractedDraft] = useState<ExtractedLessonDraft | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load domains & subjects from Supabase
  useEffect(() => {
    let mounted = true;
    CurriculumService.getAllCurriculumGraphData().then((data) => {
      if (!mounted) return;
      setDomains(data.domains);
      setSubjects(data.subjects);
      setDomainSubjects(data.domainSubjects);

      if (data.domains.length > 0) {
        setSelectedDomainId(data.domains[0].id);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Filter subjects based on selected domain
  const availableSubjects = React.useMemo(() => {
    if (!selectedDomainId) return subjects;
    const allowed = new Set(
      domainSubjects
        .filter((ds) => ds.domain_id === selectedDomainId)
        .map((ds) => ds.subject_id)
    );
    return subjects.filter((s) => allowed.has(s.id) || s.domainId === selectedDomainId);
  }, [selectedDomainId, subjects, domainSubjects]);

  // Update default subject when domain changes
  useEffect(() => {
    if (availableSubjects.length > 0) {
      setSelectedSubjectId(availableSubjects[0].id);
    } else {
      setSelectedSubjectId("");
    }
  }, [selectedDomainId, availableSubjects]);

  // Thêm tệp vào danh sách & Phân loại AI
  const handleAddFiles = (files: FileList | File[]) => {
    setFileError(null);
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const newDocs: UploadedDocRecord[] = [];

    fileArray.forEach((file) => {
      const fileName = file.name.toLowerCase();
      const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));

      if (!hasValidExt) {
        toast.error(`"${file.name}": Chỉ chấp nhận .pdf, .pdfa, .doc, .docx, .pptx`);
        return;
      }

      if (file.size > 25 * 1024 * 1024) {
        toast.error(`"${file.name}": Vượt quá giới hạn 25MB`);
        return;
      }

      const parts = file.name.split(".");
      const ext = parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "DOC";
      const classification = TaxonomyClassifier.classifyDocument(file.name);
      const nowStr = new Date().toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      newDocs.push({
        id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        file,
        name: file.name,
        size: file.size,
        extension: ext,
        uploadedAt: nowStr,
        classification,
        status: "ready",
      });
    });

    if (newDocs.length > 0) {
      setUploadedDocs((prev) => [...newDocs, ...prev]);
      const primary = newDocs[0];
      setActiveDocId(primary.id);

      if (primary.classification) {
        setSelectedDomainId(primary.classification.domainId);
        setTimeout(() => {
          setSelectedSubjectId(primary.classification!.subjectId);
        }, 50);
        toast.success(
          `AI đã nhận diện: ${primary.classification.domainName} › ${primary.classification.subjectName} (${primary.classification.confidenceScore}% khớp)`
        );
      }
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveDoc = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setUploadedDocs((prev) => {
      const remaining = prev.filter((d) => d.id !== id);
      if (activeDocId === id) {
        setActiveDocId(remaining.length > 0 ? remaining[0].id : null);
      }
      return remaining;
    });
    toast.info("Đã xóa tệp khỏi danh sách");
  };

  const handleSelectActiveDoc = (doc: UploadedDocRecord) => {
    setActiveDocId(doc.id);
    if (doc.classification) {
      setSelectedDomainId(doc.classification.domainId);
      setTimeout(() => {
        setSelectedSubjectId(doc.classification!.subjectId);
      }, 50);
    }
  };

  const handleStartExtraction = async () => {
    if (!uploadedFile) {
      toast.error("Vui lòng chọn hoặc kéo thả một tệp tài liệu");
      return;
    }

    if (!selectedDomainId || !selectedSubjectId) {
      toast.error("Vui lòng chọn Nhóm Ngành và Môn Học");
      return;
    }

    setIsProcessing(true);
    setCurrentStage(1);
    setExtractedDraft(null);

    try {
      const draft = await DocumentExtractionAgent.extractCurriculumFromFile({
        file: uploadedFile,
        domainId: selectedDomainId,
        subjectId: selectedSubjectId,
        user: user || {
          id: "usr_guest",
          username: "guest",
          email: "guest@elis.edu.vn",
          fullName: "Người học Elis",
          displayName: "Người học Elis",
          role: "learner",
          createdAt: new Date().toISOString(),
        },
        onProgress: (stage, message) => {
          setCurrentStage(stage);
          setStageMessage(message);
        },
      });

      setExtractedDraft(draft);
      toast.success("AI Agent đã hoàn tất hệ thống hóa bài học thành công!");
    } catch (err: any) {
      console.error("Lỗi trích xuất:", err);
      toast.error("Có lỗi xảy ra trong quá trình xử lý bài học: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setUploadedDocs([]);
    setActiveDocId(null);
    setFileError(null);
    setExtractedDraft(null);
    setCurrentStage(0);
    setStageMessage("");
  };

  const isCuratorOrAdmin = user?.role === "curator" || user?.role === "admin";

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Top Banner Header Đồng Bộ Chuẩn Dashboard - Mở Rộng Theo Nội Dung Kiểm Duyệt 2 Lớp */}
      <PageHeroBanner
        badge={
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black border border-indigo-200/80 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Quy Trình Kiểm Duyệt 2 Lớp</span>
          </div>
        }
        title={
          <>
            Tải Lên Tài Liệu &amp; Tự Động Hóa{" "}
            <span className="whitespace-nowrap">Bài Học Chuẩn Feynman</span>
          </>
        }
        description="Sau khi AI Agent trích xuất bài học, tài liệu sẽ được đưa vào hàng đợi Bàn Thẩm Định (Curator Validation Studio). Các Kiểm Định Viên chuyên môn sẽ kiểm tra, hiệu chỉnh Khái niệm cốt lõi & Bẫy thuật ngữ trước khi chính thức xuất bản lên Cây Tri Thức toàn sàn."
        mascotSrc="/images/theodore-upload-owl.png"
        mascotAlt="Linh vật Tải tài liệu Elis"
        mascotClassName="w-52 h-52 sm:w-64 sm:h-64 lg:w-76 lg:h-76 xl:w-84 xl:h-84"
        actions={
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 rounded-2xl bg-[#7286D3] hover:bg-[#5066A1] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Chọn Tệp Tải Lên Ngay</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/curator/validation")}
              className="px-5 py-2.5 rounded-2xl bg-white/90 hover:bg-white text-slate-700 text-xs font-bold border border-slate-200/80 shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <FileCheck className="w-4 h-4 text-indigo-600" />
              <span>Sang Bàn Thẩm Định</span>
            </button>
          </>
        }
      />

      {!extractedDraft ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* CỘT TRÁI: Khu vực tải tài liệu lên & Danh sách tệp (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
              {/* Header Box */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-2xs">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                      Khu Vực Tải Lên Tài Liệu
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Tự động trích xuất cấu trúc ngữ nghĩa và gán nhãn tri thức
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200/60 shadow-2xs">
                  {uploadedDocs.length} tệp
                </span>
              </div>

              {/* Strict Upload Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => !isProcessing && fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/70 hover:bg-blue-50/30 rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2.5 group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files && handleAddFiles(e.target.files)}
                  accept=".pdf,.pdfa,.doc,.docx,.pptx"
                  multiple
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                  <UploadCloud className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-700">
                    Kéo thả tài liệu vào đây, hoặc <span className="text-blue-600 underline">chọn tệp từ máy tính</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    Hỗ trợ định dạng: <strong className="text-slate-600">.pdf, .pdfa, .doc, .docx, .pptx</strong> • Tối đa 25MB
                  </p>
                </div>
              </div>

              {/* Error Notice */}
              {fileError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{fileError}</span>
                </div>
              )}

              {/* DANH SÁCH TÀI LIỆU (List View khi tải lên) */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span>Danh Sách Tài Liệu Đã Tải Lên ({uploadedDocs.length})</span>
                  </span>
                  {uploadedDocs.length > 0 && (
                    <span className="text-[11px] text-slate-400 font-normal">
                      Nhấp vào tệp để chọn đối soát học thuật
                    </span>
                  )}
                </div>

                {uploadedDocs.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-slate-50/80 border border-dashed border-slate-200 text-center space-y-2">
                    <FileText className="w-9 h-9 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-600">Chưa có tài liệu nào trong danh sách</p>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      Hãy chọn hoặc kéo thả tệp tài liệu giáo trình, slide bài giảng vào khung phía trên để hiển thị thông tin và bắt đầu trích xuất.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {uploadedDocs.map((doc) => {
                      const isSelected = activeDoc?.id === doc.id;
                      const sizeInMB = (doc.size / (1024 * 1024)).toFixed(2);
                      const isPDF = doc.extension === "PDF" || doc.extension === "PDFA";
                      const isWord = doc.extension === "DOC" || doc.extension === "DOCX";

                      return (
                        <div
                          key={doc.id}
                          onClick={() => handleSelectActiveDoc(doc)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? "border-[#7286D3] bg-[#F4F6FD] shadow-xs"
                              : "border-slate-200/90 bg-white hover:bg-slate-50/80"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* File Icon Badge */}
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-[10px] ${
                                isPDF
                                  ? "bg-rose-100 text-rose-700 border border-rose-200"
                                  : isWord
                                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                                  : "bg-amber-100 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {doc.extension}
                            </div>

                            <div className="min-w-0 space-y-1">
                              <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                                {doc.name}
                              </p>
                              <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                                <span className="font-semibold text-slate-600">{sizeInMB} MB</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>{doc.uploadedAt}</span>
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                    isSelected
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {isSelected ? "Đang chọn trích xuất" : "Chờ xử lý"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleRemoveDoc(e, doc.id)}
                            className="p-2 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                            title="Xóa tệp khỏi danh sách"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Trigger Extraction Button */}
              <button
                onClick={handleStartExtraction}
                disabled={!activeDoc || isProcessing}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-black shadow-lg shadow-indigo-200 hover:shadow-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>AI Agent Đang Xử Lý &amp; Trích Xuất...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Kích Hoạt Agent Trích Xuất &amp; Hệ Thống Hóa Tri Thức</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* CỘT PHẢI: Bảng thông tin học thuật (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-2xs">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                      Bảng Thông Tin Học Thuật
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Thuộc tính bài học và kết quả đối soát dữ liệu
                    </p>
                  </div>
                </div>
                {aiClassification && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200/70">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    {aiClassification.confidenceScore}% Khớp
                  </span>
                )}
              </div>

              {/* Trường 1 & 2: Phân loại Ngành & Môn */}
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Nhóm Ngành (Academic Domain)</span>
                    <span className="text-[11px] text-slate-400 font-normal">Cấp 1</span>
                  </label>
                  <select
                    value={selectedDomainId}
                    onChange={(e) => {
                      const newDomainId = e.target.value;
                      setSelectedDomainId(newDomainId);
                      if (activeDoc) {
                        const meta = TaxonomyClassifier.generateMetadataForSelection(
                          activeDoc.name,
                          newDomainId,
                          selectedSubjectId
                        );
                        activeDoc.classification = {
                          domainId: newDomainId,
                          subjectId: selectedSubjectId,
                          confidenceScore: activeDoc.classification?.confidenceScore || 92,
                          matchedKeywords: activeDoc.classification?.matchedKeywords || [],
                          ...meta,
                        };
                        setUploadedDocs([...uploadedDocs]);
                      }
                    }}
                    disabled={isProcessing}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer disabled:opacity-50"
                  >
                    {domains.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Môn Học Trực Thuộc (Academic Subject)</span>
                    <span className="text-[11px] text-slate-400 font-normal">Cấp 2</span>
                  </label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => {
                      const newSubId = e.target.value;
                      setSelectedSubjectId(newSubId);
                      if (activeDoc) {
                        const meta = TaxonomyClassifier.generateMetadataForSelection(
                          activeDoc.name,
                          selectedDomainId,
                          newSubId
                        );
                        activeDoc.classification = {
                          domainId: selectedDomainId,
                          subjectId: newSubId,
                          confidenceScore: activeDoc.classification?.confidenceScore || 92,
                          matchedKeywords: activeDoc.classification?.matchedKeywords || [],
                          ...meta,
                        };
                        setUploadedDocs([...uploadedDocs]);
                      }
                    }}
                    disabled={isProcessing || availableSubjects.length === 0}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer disabled:opacity-50"
                  >
                    {availableSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Trường 3: Thông tin chi tiết AI nhận diện */}
              {aiClassification ? (
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Đối Soát Kho Tri Thức Supabase</span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-white px-2 py-0.5 rounded text-indigo-700 border border-indigo-200/70 shadow-2xs">
                      Chuẩn Hóa
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="bg-white/90 p-2.5 rounded-xl border border-indigo-100 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                        Tên Bài Học Đề Xuất
                      </span>
                      <span className="font-bold text-slate-800 line-clamp-1 mt-0.5">
                        {aiClassification.suggestedTitle}
                      </span>
                    </div>

                    <div className="bg-white/90 p-2.5 rounded-xl border border-indigo-100 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                        URL Reference Link Chuẩn
                      </span>
                      <a
                        href={aiClassification.refLink}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-[11px] text-indigo-600 hover:underline truncate flex items-center gap-1 mt-0.5"
                      >
                        <span className="truncate">{aiClassification.refLink}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                  </div>

                  {aiClassification.matchedKeywords.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-slate-500 block">
                        Từ khóa đối soát trong kho tri thức:
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {aiClassification.matchedKeywords.map((kw, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-white text-slate-700 text-[10px] font-semibold border border-indigo-100 shadow-2xs"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-1">
                  <p className="text-xs font-bold text-slate-600">Chờ nạp tài liệu</p>
                  <p className="text-[11px] text-slate-400">
                    Khi chọn một tài liệu ở bên trái, AI sẽ tự động phân tích và đối soát các nhãn học thuật tại đây.
                  </p>
                </div>
              )}

              {/* Trường 4: Thông tin chỉ tiêu trích xuất */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2 text-xs">
                <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                  Chỉ Tiêu Trích Xuất Feynman
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
                    <span className="text-slate-400 block">Khái niệm cốt lõi:</span>
                    <strong className="text-slate-800">4 - 6 khái niệm</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
                    <span className="text-slate-400 block">Bẫy thuật ngữ:</span>
                    <strong className="text-slate-800">Tự động phát hiện</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Live AI Agent Processing Stepper */}
      {isProcessing && (
        <div className="bg-white rounded-3xl p-8 border border-blue-200 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            </div>
            <h3 className="text-lg font-black text-slate-800">
              AI Agent Đang Hệ Thống Hóa Tri Thức
            </h3>
            <p className="text-xs text-slate-500">{stageMessage}</p>
          </div>

          {/* Stepper Progress */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {[
              { num: 1, title: "Tiếp Nhận & Vai Trò", desc: "Quét nhị phân & nhận diện loại hình sư phạm" },
              { num: 2, title: "Semantic Chunking", desc: "Băm ý niệm & tiền đề Anthropic Context" },
              { num: 3, title: "Chiếu Xạ Master Graph", desc: "Định vị tiên quyết & độ khó trên Supabase" },
              { num: 4, title: "Schema Feynman", desc: "Đóng gói bài học & lưu trữ Supabase" },
            ].map((st) => (
              <div
                key={st.num}
                className={`p-3.5 rounded-2xl border transition-all ${
                  currentStage === st.num
                    ? "bg-blue-50 border-blue-400 shadow-sm"
                    : currentStage > st.num
                    ? "bg-emerald-50 border-emerald-300"
                    : "bg-slate-50 border-slate-200 opacity-60"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                      currentStage > st.num
                        ? "bg-emerald-500 text-white"
                        : currentStage === st.num
                        ? "bg-blue-600 text-white animate-pulse"
                        : "bg-slate-300 text-slate-700"
                    }`}
                  >
                    {currentStage > st.num ? "✓" : st.num}
                  </span>
                  <span className="text-xs font-bold text-slate-800">{st.title}</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extracted Lesson Output Card */}
      {extractedDraft && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-indigo-200 shadow-xl space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                  CHỜ KIỂM ĐỊNH (PENDING)
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Trích xuất từ: {extractedDraft.fileName}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800">
                {extractedDraft.title}
              </h2>
              {extractedDraft.refLink && (
                <div className="flex items-center gap-2 text-xs pt-1 flex-wrap">
                  <span className="font-semibold text-slate-500">URL Tham Chiếu Chuẩn:</span>
                  <a
                    href={extractedDraft.refLink}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-indigo-600 hover:underline hover:text-indigo-800 transition-colors flex items-center gap-1"
                  >
                    <span>{extractedDraft.refLink}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(extractedDraft.refLink || "");
                      setIsCopied(true);
                      toast.success("Đã sao chép liên kết tham chiếu!");
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                    className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title="Sao chép URL"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {extractedDraft.pedagogicalRoleLabel && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200 shadow-2xs">
                  <FileText className="w-3.5 h-3.5 text-purple-600" />
                  {extractedDraft.pedagogicalRoleLabel}
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {extractedDraft.estimatedReadingMinutes} phút đọc
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                Độ khó {extractedDraft.difficultyLevel}/5
              </span>
            </div>
          </div>

          {/* Master Ontology Projection & Roadmap Positioning */}
          {extractedDraft.suggestedRoadmapPosition && (
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Định Vị Trong Cây Tri Thức Chuẩn (Master Ontology Projection)</span>
                </div>
                <span className="text-[10px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded border border-indigo-200">
                  Supabase Knowledge Graph
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700">
                📌 {extractedDraft.suggestedRoadmapPosition}
              </p>
              {extractedDraft.prerequisiteTopics && extractedDraft.prerequisiteTopics.length > 0 && (
                <div className="pt-1 border-t border-indigo-100/60">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">
                    Kiến thức tiên quyết cần nắm vững trước bài này:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {extractedDraft.prerequisiteTopics.map((pt, i) => (
                      <span
                        key={i}
                        className="text-[11px] bg-white text-indigo-900 px-2.5 py-1 rounded-lg border border-indigo-200 font-medium shadow-2xs"
                        title={pt.reason}
                      >
                        🔹 {pt.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Summary / Ground Truth */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Tóm Tắt Khái Quát Bài Học (Feynman Ground Truth)
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
              {extractedDraft.summary}
            </p>
          </div>

          {/* 2-Col Concepts & Jargons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Required Concepts */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-2.5">
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Khái Niệm Cốt Lõi Bắt Buộc ({extractedDraft.requiredConcepts.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {extractedDraft.requiredConcepts.map((c, i) => (
                  <span
                    key={i}
                    className="text-xs font-semibold bg-white text-emerald-900 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Jargon Traps */}
            <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-2.5">
              <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Bẫy Thuật Ngữ Cần Lưu Ý ({extractedDraft.jargonTraps.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {extractedDraft.jargonTraps.map((j, i) => (
                  <span
                    key={i}
                    className="text-xs font-semibold bg-white text-rose-900 px-2.5 py-1 rounded-lg border border-rose-200 shadow-2xs"
                  >
                    {j}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Semantic Chunks / Atomic Knowledge Units Preview */}
          {extractedDraft.semanticChunks && extractedDraft.semanticChunks.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Hạt Nhân Tri Thức Đã Bóc Tách ({extractedDraft.semanticChunks.length} Khối)
                </h4>
                <span className="text-[10px] text-slate-400 font-medium">
                  Đã gắn tiền đề Contextual Retrieval
                </span>
              </div>
              <div className="space-y-2">
                {extractedDraft.semanticChunks.slice(0, 3).map((chunk) => (
                  <div
                    key={chunk.chunkId}
                    className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-slate-700 font-bold">
                      <span className="line-clamp-1">📌 {chunk.heading}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        ~{chunk.estimatedReadingSeconds}s đọc
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-indigo-700 bg-white p-1.5 rounded border border-indigo-100">
                      {chunk.contextualContent.split("\n")[0]}
                    </div>
                    <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">
                      {chunk.rawContent}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={handleReset}
              className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Tải Lên Tài Liệu Khác
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {isCuratorOrAdmin ? (
                <button
                  onClick={() => navigate("/curator/validation")}
                  className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Đi Đến Bàn Thẩm Định Để Phê Duyệt Ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    toast.success("Bài học đã được gửi tới Hội đồng Thẩm định viên thành công!");
                    navigate("/topics");
                  }}
                  className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác Nhận & Gửi Vào Hàng Đợi Thẩm Định</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialUploadHub;
