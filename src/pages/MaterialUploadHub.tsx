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

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [aiClassification, setAiClassification] = useState<TaxonomyClassificationResult | null>(null);
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

  // File Validation & AI Auto-Classification
  const validateAndSetFile = (file: File) => {
    setFileError(null);
    const fileName = file.name.toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));

    if (!hasValidExt) {
      setFileError(
        `Định dạng file không hợp lệ! Hệ thống chỉ chấp nhận các tệp tài liệu: ${ALLOWED_EXTENSIONS.join(
          ", "
        )}`
      );
      setUploadedFile(null);
      setAiClassification(null);
      toast.error("Vui lòng tải lên đúng định dạng .pdf, .pdfa, .doc, .docx hoặc .pptx");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setFileError("Dung lượng file vượt quá giới hạn cho phép (tối đa 25MB)");
      setUploadedFile(null);
      setAiClassification(null);
      toast.error("Dung lượng tệp quá lớn!");
      return;
    }

    setUploadedFile(file);

    // AI Semantic Taxonomy Classifier: Tự động phân loại dựa trên Closed-Set JSON State
    const classification = TaxonomyClassifier.classifyDocument(file.name);
    setAiClassification(classification);

    // Tự động gán Nhóm Ngành và Môn Học tương ứng
    setSelectedDomainId(classification.domainId);
    setTimeout(() => {
      setSelectedSubjectId(classification.subjectId);
    }, 50);

    toast.success(
      `AI đã nhận diện: ${classification.domainName} › ${classification.subjectName} (${classification.confidenceScore}% khớp)`
    );
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
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
          email: "guest@theodore.edu.vn",
          fullName: "Người học Theodore",
          displayName: "Người học Theodore",
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
    setUploadedFile(null);
    setFileError(null);
    setExtractedDraft(null);
    setAiClassification(null);
    setCurrentStage(0);
    setStageMessage("");
  };

  const isCuratorOrAdmin = user?.role === "curator" || user?.role === "admin";

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Top Banner Header Đồng Bộ Chuẩn Dashboard */}
      <PageHeroBanner
        mascotSrc="/images/theodore-upload-owl.png"
        mascotAlt="Linh vật Tải tài liệu Theodore"
        mascotClassName="w-52 h-52 sm:w-64 sm:h-64 lg:w-80 lg:h-80 xl:w-96 xl:h-96"
        title={
          <>
            Tải Lên Tài Liệu &amp; Tự Động Hóa{" "}
            <span className="whitespace-nowrap">Bài Học Chuẩn Feynman</span>
          </>
        }
        description="Tác nhân AI đọc sâu tài liệu học thuật (.pdf, .doc, .pptx), bóc tách cấu trúc ngữ nghĩa, tự động định danh các khái niệm cốt lõi (Required Concepts) và phát hiện bẫy thuật ngữ (Jargon Traps)."
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Upload Zone (2 cols) */}
          <div className="lg:col-span-2 space-y-5">
            {/* Classification Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  1. Phân loại Học thuật (Academic Taxonomy)
                </h2>
                {aiClassification && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200/70 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    AI Tự Động Nhận Diện: {aiClassification.confidenceScore}% Độ Khớp
                  </span>
                )}
              </div>

              {/* AI Auto-Detection Details Preview (System Knowledge Repository) */}
              {aiClassification && uploadedFile && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-blue-50/60 to-purple-50/50 border border-indigo-100/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Truy Vấn Kho Tri Thức Hệ Thống (Supabase Curriculum Repository)</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-white px-2.5 py-0.5 rounded-full text-indigo-700 border border-indigo-200/70 shadow-2xs">
                      Kho Dữ Liệu Sống
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-white/90 p-3 rounded-xl border border-indigo-100/80 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                        Tên Bài Học Chuẩn Hóa
                      </span>
                      <span className="font-bold text-slate-800 line-clamp-1 mt-0.5">
                        {aiClassification.suggestedTitle}
                      </span>
                    </div>
                    <div className="bg-white/90 p-3 rounded-xl border border-indigo-100/80 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                        URL Reference Link Chuẩn
                      </span>
                      <span className="font-mono text-[11px] text-indigo-600 truncate block mt-0.5">
                        {aiClassification.refLink}
                      </span>
                    </div>
                  </div>

                  {aiClassification.matchedKeywords.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="text-[11px] font-bold text-slate-500">Từ khóa đối soát trong kho tri thức:</span>
                      {aiClassification.matchedKeywords.map((kw, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-white text-slate-700 text-[10px] font-semibold border border-indigo-100 shadow-2xs"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-[11px] text-slate-500 italic">
                    * Agent trực tiếp truy vấn Kho dữ liệu Supabase để đối soát nhãn học thuật và tự động tổng hợp Khái niệm cốt lõi, Bẫy thuật ngữ & Ẩn dụ phù hợp nhất với nội dung tài liệu.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Domain Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block">
                    Nhóm Ngành (Cấp 1) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedDomainId}
                    onChange={(e) => {
                      const newDomainId = e.target.value;
                      setSelectedDomainId(newDomainId);
                      if (uploadedFile) {
                        const meta = TaxonomyClassifier.generateMetadataForSelection(
                          uploadedFile.name,
                          newDomainId,
                          selectedSubjectId
                        );
                        setAiClassification((prev) =>
                          prev
                            ? {
                                ...prev,
                                domainId: newDomainId,
                                suggestedTitle: meta.suggestedTitle,
                                canonicalSlug: meta.canonicalSlug,
                                refLink: meta.refLink,
                                allowedConcepts: meta.allowedConcepts,
                                allowedJargons: meta.allowedJargons,
                              }
                            : null
                        );
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

                {/* Subject Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block">
                    Môn Học Trực Thuộc (Cấp 2) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => {
                      const newSubId = e.target.value;
                      setSelectedSubjectId(newSubId);
                      if (uploadedFile) {
                        const meta = TaxonomyClassifier.generateMetadataForSelection(
                          uploadedFile.name,
                          selectedDomainId,
                          newSubId
                        );
                        setAiClassification((prev) =>
                          prev
                            ? {
                                ...prev,
                                subjectId: newSubId,
                                suggestedTitle: meta.suggestedTitle,
                                canonicalSlug: meta.canonicalSlug,
                                refLink: meta.refLink,
                                allowedConcepts: meta.allowedConcepts,
                                allowedJargons: meta.allowedJargons,
                              }
                            : null
                        );
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
            </div>

            {/* Drag & Drop File Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-blue-600" />
                  2. Tải Lên Tệp Tài Liệu Học Thuật
                </h2>
                <span className="text-[11px] font-bold text-slate-400">
                  Tối đa 25MB
                </span>
              </div>

              {/* Strict Upload Box */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => !isProcessing && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                  uploadedFile
                    ? "border-emerald-400 bg-emerald-50/40"
                    : fileError
                    ? "border-red-300 bg-red-50/30"
                    : "border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/30"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && validateAndSetFile(e.target.files[0])}
                  accept=".pdf,.pdfa,.doc,.docx,.pptx"
                  className="hidden"
                />

                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                    uploadedFile
                      ? "bg-emerald-500 text-white"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {uploadedFile ? (
                    <FileCheck className="w-7 h-7" />
                  ) : (
                    <UploadCloud className="w-7 h-7" />
                  )}
                </div>

                {uploadedFile ? (
                  <div className="space-y-1">
                    <p className="text-sm font-black text-emerald-800">
                      {uploadedFile.name}
                    </p>
                    <p className="text-xs text-emerald-600 font-medium">
                      {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB • Sẵn sàng để AI phân tích
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 text-center">
                    <p className="text-sm font-bold text-slate-700">
                      Kéo thả tài liệu vào đây, hoặc <span className="text-blue-600 underline">chọn tệp từ máy tính</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      Chỉ cho phép các định dạng: <strong className="text-slate-600 font-semibold">.pdf, .pdfa, .doc, .docx, .pptx</strong>
                    </p>
                  </div>
                )}
              </div>

              {/* Error Notice */}
              {fileError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{fileError}</span>
                </div>
              )}

              {/* Trigger Extraction Button */}
              <button
                onClick={handleStartExtraction}
                disabled={!uploadedFile || isProcessing}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-black shadow-lg shadow-indigo-200 hover:shadow-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>AI Agent Đang Xử Lý & Trích Xuất...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Kích Hoạt Agent Trích Xuất & Hệ Thống Hóa Tri Thức</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sidebar Guidelines & Formats (1 col) */}
          <div className="space-y-5">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                Định Dạng Được Chấp Nhận
              </h3>

              <div className="space-y-2.5">
                {[
                  { ext: ".PDF / .PDFA", desc: "Giáo trình, bài báo nghiên cứu, tài liệu học thuật tiêu chuẩn" },
                  { ext: ".DOC / .DOCX", desc: "Tài liệu đề cương, giáo án bài giảng Word" },
                  { ext: ".PPTX", desc: "Bài thuyết trình slide PowerPoint tổng quan môn học" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-black text-slate-800 block">
                        {item.ext}
                      </span>
                      <span className="text-[11px] text-slate-500 leading-tight block">
                        {item.desc}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quy trình Feynman Box */}
            <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100 space-y-3">
              <h3 className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Quy Trình Kiểm Duyệt 2 Lớp
              </h3>
              <p className="text-xs text-indigo-800/80 leading-relaxed">
                Sau khi AI Agent trích xuất bài học, tài liệu sẽ được đưa vào hàng đợi{" "}
                <strong>Bàn Thẩm Định (Curator Validation Studio)</strong>. Các Kiểm Định Viên chuyên môn sẽ kiểm tra,
                hiệu chỉnh Khái niệm cốt lõi & Bẫy thuật ngữ trước khi chính thức xuất bản lên Cây Tri Thức toàn sàn.
              </p>
              {isCuratorOrAdmin && (
                <button
                  onClick={() => navigate("/curator/validation")}
                  className="w-full mt-2 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Đi đến Bàn Thẩm Định của tôi</span>
                </button>
              )}
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
