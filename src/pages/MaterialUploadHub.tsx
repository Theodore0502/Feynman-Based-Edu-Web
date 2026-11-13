/**
 * File: src/pages/MaterialUploadHub.tsx
 * Mục đích: Trung tâm tải lên tài liệu học tập & Kích hoạt AI Agent Hệ thống hóa Tri thức.
 * Tính năng nâng cao:
 *   1. Quét siêu tốc văn bản (.docx, .pdf) qua FastDocumentScanner & tính toán ma trận % phân bổ (GitHub-style language bar).
 *   2. Tự động gom nhóm các tệp tải lên theo Bộ Chuyên Ngành (Bundle Clustering).
 *   3. Xử lý tài liệu liên ngành đa môn:
 *      - Phương án A: Phân bổ % ngữ nghĩa (GitHub-style multi-domain bar).
 *      - Phương án B: Tự động phát hiện ranh giới chương/học phần (Semantic Chapter Splitter) với tùy chọn tách module độc lập.
 *   4. Quy chuẩn UI: TUYỆT ĐỐI KHÔNG DÙNG ICON (No Lucide, no SVG, typographic badges, progress bars & status dots only).
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/hooks/useAuthStore";
import { CurriculumService } from "@/lib/services/curriculum-service";
import {
  DocumentExtractionAgent,
  ExtractedLessonDraft,
} from "@/lib/services/document-extraction-agent";
import { TaxonomyClassifier } from "@/lib/services/taxonomy-classifier";
import {
  FastDocumentScanner,
  FastScanResult,
  SubjectDistribution,
  DetectedChapterModule,
} from "@/lib/services/fast-document-scanner";
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
  scanResult: FastScanResult | null;
  isScanning: boolean;
  selectedSplitMode: "integrated" | "split";
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

  // Chế độ xem: Từng tệp hoặc Gom theo Bộ chuyên ngành
  const [viewMode, setViewMode] = useState<"list" | "bundles">("list");

  const activeDoc = uploadedDocs.find((d) => d.id === activeDocId) || uploadedDocs[0] || null;
  const uploadedFile = activeDoc ? activeDoc.file : null;
  const aiClassification = activeDoc ? activeDoc.classification : null;
  const activeScanResult = activeDoc ? activeDoc.scanResult : null;

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
  const availableSubjects = useMemo(() => {
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
      if (!availableSubjects.some((s) => s.id === selectedSubjectId)) {
        setSelectedSubjectId(availableSubjects[0].id);
      }
    } else {
      setSelectedSubjectId("");
    }
  }, [selectedDomainId, availableSubjects, selectedSubjectId]);

  // Gom nhóm các tệp tải lên theo Bộ chuyên ngành (Bundle Clustering)
  const clusteredBundles = useMemo(() => {
    const groups: Record<
      string,
      {
        subjectName: string;
        domainName: string;
        subjectId: string;
        domainId: string;
        color: string;
        docs: UploadedDocRecord[];
      }
    > = {};

    uploadedDocs.forEach((doc) => {
      const subjectName =
        doc.scanResult?.primarySubject.subjectName ||
        doc.classification?.subjectName ||
        "Chưa Phân Loại";
      const domainName =
        doc.scanResult?.primarySubject.domainName ||
        doc.classification?.domainName ||
        "Đại Cương";
      const subjectId =
        doc.scanResult?.primarySubject.subjectId || doc.classification?.subjectId || "";
      const domainId =
        doc.scanResult?.primarySubject.domainId || doc.classification?.domainId || "";
      const color = doc.scanResult?.primarySubject.color || "#3B82F6";

      if (!groups[subjectName]) {
        groups[subjectName] = {
          subjectName,
          domainName,
          subjectId,
          domainId,
          color,
          docs: [],
        };
      }
      groups[subjectName].docs.push(doc);
    });

    return Object.values(groups);
  }, [uploadedDocs]);

  // Quét tài liệu bằng FastDocumentScanner trong nền
  const runFastScanForDoc = async (recordId: string, file: File) => {
    try {
      const scanRes = await FastDocumentScanner.scanDocument(file);

      setUploadedDocs((prev) =>
        prev.map((doc) => {
          if (doc.id !== recordId) return doc;
          return {
            ...doc,
            scanResult: scanRes,
            isScanning: false,
            selectedSplitMode: scanRes.splitMode,
            classification: {
              domainId: scanRes.primarySubject.domainId,
              domainSlug: scanRes.primarySubject.domainSlug,
              domainName: scanRes.primarySubject.domainName,
              subjectId: scanRes.primarySubject.subjectId,
              subjectSlug: scanRes.primarySubject.subjectId.replace(/^sub-/, ""),
              subjectName: scanRes.primarySubject.subjectName,
              confidenceScore: Math.min(99, Math.max(75, scanRes.primarySubject.percentage)),
              matchedKeywords: scanRes.primarySubject.matchedKeywords,
              suggestedTitle: scanRes.suggestedTitle,
              canonicalSlug: scanRes.canonicalSlug,
              refLink: scanRes.refLink,
              allowedConcepts: scanRes.primarySubject.matchedKeywords.slice(0, 4),
              allowedJargons: ["Thuật ngữ chuyên ngành", "Cơ chế vận hành"],
            },
          };
        })
      );

      // Nếu đây là tài liệu đang được chọn, đồng bộ nhóm ngành và môn học lên bảng thông tin
      if (activeDocId === recordId || (!activeDocId && uploadedDocs[0]?.id === recordId)) {
        setSelectedDomainId(scanRes.primarySubject.domainId);
        setTimeout(() => {
          setSelectedSubjectId(scanRes.primarySubject.subjectId);
        }, 50);

        if (scanRes.isMultiSubject) {
          toast.success(
            `Phát hiện tài liệu liên ngành: ${scanRes.primarySubject.subjectName} (${scanRes.primarySubject.percentage}%) và ${scanRes.secondarySubject?.subjectName} (${scanRes.secondarySubject?.percentage}%)`
          );
        } else {
          toast.success(
            `AI đã quét xong: ${scanRes.primarySubject.subjectName} (${scanRes.primarySubject.percentage}% khớp)`
          );
        }
      }
    } catch (err: any) {
      console.warn("Fast scan non-blocking warning:", err);
      setUploadedDocs((prev) =>
        prev.map((doc) => (doc.id === recordId ? { ...doc, isScanning: false } : doc))
      );
    }
  };

  // Thêm tệp vào danh sách & Kích hoạt Quét AI
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
      const fallbackClassification = TaxonomyClassifier.classifyDocument(file.name);
      const nowStr = new Date().toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      const newId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      newDocs.push({
        id: newId,
        file,
        name: file.name,
        size: file.size,
        extension: ext,
        uploadedAt: nowStr,
        classification: fallbackClassification,
        scanResult: null,
        isScanning: true,
        selectedSplitMode: "integrated",
        status: "ready",
      });

      // Kích hoạt quét AI lướt siêu tốc
      runFastScanForDoc(newId, file);
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
    const domainId = doc.scanResult?.primarySubject.domainId || doc.classification?.domainId;
    const subjectId = doc.scanResult?.primarySubject.subjectId || doc.classification?.subjectId;

    if (domainId) {
      setSelectedDomainId(domainId);
    }
    if (subjectId) {
      setTimeout(() => {
        setSelectedSubjectId(subjectId);
      }, 50);
    }
  };

  const handleToggleSplitMode = (mode: "integrated" | "split") => {
    if (!activeDoc) return;
    setUploadedDocs((prev) =>
      prev.map((d) => {
        if (d.id !== activeDoc.id) return d;
        return {
          ...d,
          selectedSplitMode: mode,
        };
      })
    );
    if (mode === "split") {
      toast.info("Chế độ Tách Module: AI sẽ trích xuất thành các bài học độc lập theo chương.");
    } else {
      toast.info("Chế độ Tích Hợp: AI sẽ đóng gói thành bài học liên ngành thống nhất.");
    }
  };

  // Nạp nhanh tệp mẫu thử nghiệm
  const handleLoadSampleDoc = async (fileName: string) => {
    try {
      toast.info(`Đang nạp tệp mẫu: ${fileName}...`);
      const response = await fetch(`/sample-documents/cntt/${fileName}`);
      if (!response.ok) throw new Error("Không thể nạp tệp từ thư mục mẫu");
      const blob = await response.blob();
      const file = new File([blob], fileName, {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      handleAddFiles([file]);
    } catch (err: any) {
      toast.error(`Lỗi nạp tệp mẫu: ${err.message}`);
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

      // Bổ sung thông tin phân bổ nếu có
      if (activeScanResult?.isMultiSubject && activeDoc?.selectedSplitMode === "integrated") {
        draft.suggestedRoadmapPosition = `[Bài Học Liên Ngành] ${draft.suggestedRoadmapPosition} • Kết nối chuyên môn: ${activeScanResult.secondarySubject?.subjectName}`;
      }

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
      {/* Top Banner Header Đồng Bộ Chuẩn Dashboard - TUYỆT ĐỐI KHÔNG DÙNG ICON */}
      <PageHeroBanner
        badge={
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black border border-indigo-200/80 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block animate-pulse" />
            <span className="uppercase tracking-wider">Quy Trình Kiểm Duyệt 2 Lớp</span>
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
              className="px-5 py-2.5 rounded-2xl bg-[#7286D3] hover:bg-[#5066A1] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              [ Chọn Tệp Tải Lên Ngay ]
            </button>
            <button
              type="button"
              onClick={() => navigate("/curator/validation")}
              className="px-5 py-2.5 rounded-2xl bg-white/90 hover:bg-white text-slate-700 text-xs font-bold border border-slate-200/80 shadow-xs transition-all cursor-pointer"
            >
              [ Sang Bàn Thẩm Định ]
            </button>
          </>
        }
      />

      {!extractedDraft ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* CỘT TRÁI: Khu vực tải tài liệu lên & Quản lý tệp/bộ chuyên ngành (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
              {/* Header Box - Không Dùng Icon */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-black tracking-wider uppercase">
                      TẢI LÊN
                    </span>
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                      Khu Vực Tải Lên Tài Liệu
                    </h2>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    AI đọc lướt cấu trúc siêu tốc, phân tích nhãn đa ngành &amp; gom nhóm tự động
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200/60 shadow-2xs">
                    {uploadedDocs.length} tệp
                  </span>
                </div>
              </div>

              {/* Dropzone Tải Lên - Hoàn toàn không dùng icon */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => !isProcessing && fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/70 hover:bg-blue-50/30 rounded-2xl p-7 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files && handleAddFiles(e.target.files)}
                  accept=".pdf,.pdfa,.doc,.docx,.pptx"
                  multiple
                  className="hidden"
                />

                <span className="px-3.5 py-1.5 rounded-full bg-blue-600 text-white font-mono text-[11px] font-black tracking-wider uppercase shadow-xs group-hover:scale-105 transition-transform">
                  [ KÉO THẢ TỆP VÀO ĐÂY HOẶC NHẤP ĐỂ TẢI ]
                </span>

                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-bold text-slate-700">
                    Hỗ trợ định dạng: .DOCX, .DOC, .PDF, .PDFA, .PPTX
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Dung lượng tối đa 25MB • AI sẽ quét nội dung và xác định tỷ lệ kiến thức trong giây lát
                  </p>
                </div>
              </div>

              {/* Error Notice */}
              {fileError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold">
                  [LỖI] {fileError}
                </div>
              )}

              {/* Quick Sample Files Strip (Tệp mẫu chuẩn và liên ngành đa môn) */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/70 to-purple-50/60 border border-indigo-100/90 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-mono text-[10px] font-black uppercase">
                      MẪU TEST
                    </span>
                    <span className="text-xs font-bold text-indigo-950">
                      Tệp Mẫu Ngành CNTT Có Sẵn (Bấm để nạp test luồng AI):
                    </span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-white px-2 py-0.5 rounded text-indigo-700 border border-indigo-200/70 shadow-2xs">
                    7 Tệp Mẫu
                  </span>
                </div>

                <div className="space-y-2">
                  {/* Hàng 1: Tài liệu Liên ngành (2 môn trong 1 tệp) */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-purple-700 uppercase tracking-wider block">
                      Tài Liệu Liên Ngành Đa Môn (Test Phương Án A &amp; B):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleLoadSampleDoc("Do-An-Web-Dashboard-Va-Thi-Giac-May-Tinh-AI-Camera.docx")
                        }
                        disabled={isProcessing}
                        className="px-2.5 py-1.5 rounded-xl bg-purple-100/80 hover:bg-purple-600 text-purple-900 hover:text-white text-[11px] font-bold transition-all border border-purple-300 shadow-2xs cursor-pointer"
                      >
                        [DOCX] Đồ Án Web + AI Camera (2 Môn)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleLoadSampleDoc("Giao-Trinh-Tich-Hop-Co-So-Du-Lieu-Va-Mang-May-Tinh.docx")
                        }
                        disabled={isProcessing}
                        className="px-2.5 py-1.5 rounded-xl bg-purple-100/80 hover:bg-purple-600 text-purple-900 hover:text-white text-[11px] font-bold transition-all border border-purple-300 shadow-2xs cursor-pointer"
                      >
                        [DOCX] Giáo Trình CSDL + Mạng Máy Tính (2 Môn)
                      </button>
                    </div>
                  </div>

                  {/* Hàng 2: Tài liệu Đơn môn */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                      Tài Liệu Đơn Môn Chuẩn:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        {
                          file: "Giao-Trinh-Phat-Trien-Ung-Dung-Web-RESTful-API.docx",
                          label: "[DOCX] Phát Triển Web REST API",
                        },
                        {
                          file: "Giao-Trinh-Co-So-Du-Lieu-SQL-Chuan-Hoa-ACID.docx",
                          label: "[DOCX] Cơ Sở Dữ Liệu SQL",
                        },
                        {
                          file: "Giao-Trinh-Mang-May-Tinh-Mo-Hinh-OSI-TCP-IP.docx",
                          label: "[DOCX] Mạng Máy Tính (OSI/TCP)",
                        },
                        {
                          file: "Giao-Trinh-Dien-Toan-Dam-May-Cloud-Container-Docker.docx",
                          label: "[DOCX] Điện Toán Đám Mây",
                        },
                        {
                          file: "Giao-Trinh-An-Toan-Thong-Tin-Ma-Hoa-Cong-Khai-Cybersecurity.docx",
                          label: "[DOCX] An Toàn Thông Tin",
                        },
                      ].map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleLoadSampleDoc(s.file)}
                          disabled={isProcessing}
                          className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-indigo-600 text-slate-700 hover:text-white text-[11px] font-bold transition-all border border-indigo-100/90 shadow-2xs cursor-pointer"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* TÙY CHỌN CHẾ ĐỘ XEM: TỪNG TỆP vs GOM THEO BỘ CHUYÊN NGÀNH */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Chế Độ Xem:
                  </span>
                  <div className="inline-flex rounded-xl bg-slate-100 p-0.5 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        viewMode === "list"
                          ? "bg-white text-blue-700 shadow-2xs font-black"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Danh Sách Từng Tệp ({uploadedDocs.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("bundles")}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        viewMode === "bundles"
                          ? "bg-white text-blue-700 shadow-2xs font-black"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Gom Nhóm Bộ Chuyên Ngành ({clusteredBundles.length} Bộ)
                    </button>
                  </div>
                </div>

                <span className="text-[11px] text-slate-400">
                  {viewMode === "list"
                    ? "Nhấp vào từng tệp để kiểm tra nhãn"
                    : "AI tự động phân loại tệp vào các bộ môn"}
                </span>
              </div>

              {/* DANH SÁCH TÀI LIỆU HOẶC GOM NHÓM THEO BỘ */}
              {uploadedDocs.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-50/80 border border-dashed border-slate-200 text-center space-y-2">
                  <span className="px-3 py-1 rounded-md bg-slate-200 text-slate-600 font-mono text-[11px] font-black uppercase inline-block">
                    DANH SÁCH TRỐNG
                  </span>
                  <p className="text-xs font-bold text-slate-600">Chưa có tài liệu nào được nạp</p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Hãy bấm chọn tệp mẫu phía trên hoặc kéo thả tệp giáo trình từ máy tính để AI tiến hành phân loại và đối soát.
                  </p>
                </div>
              ) : viewMode === "list" ? (
                /* CHẾ ĐỘ XEM 1: DANH SÁCH TỪNG TỆP */
                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                  {uploadedDocs.map((doc) => {
                    const isSelected = activeDoc?.id === doc.id;
                    const sizeInMB = (doc.size / (1024 * 1024)).toFixed(2);
                    const isPDF = doc.extension === "PDF" || doc.extension === "PDFA";
                    const isWord = doc.extension === "DOC" || doc.extension === "DOCX";
                    const scan = doc.scanResult;

                    return (
                      <div
                        key={doc.id}
                        onClick={() => handleSelectActiveDoc(doc)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                          isSelected
                            ? "border-blue-500 bg-blue-50/30 shadow-xs ring-1 ring-blue-500/20"
                            : "border-slate-200 bg-white hover:bg-slate-50/80"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Typographic Format Badge */}
                            <span
                              className={`px-2 py-1 rounded-lg font-mono text-[10px] font-black uppercase shrink-0 ${
                                isPDF
                                  ? "bg-rose-100 text-rose-700 border border-rose-200"
                                  : isWord
                                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                                  : "bg-amber-100 text-amber-800 border border-amber-200"
                              }`}
                            >
                              [{doc.extension}]
                            </span>

                            <div className="min-w-0 space-y-0.5">
                              <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                                {doc.name}
                              </p>
                              <div className="flex items-center gap-2.5 text-[11px] text-slate-500 flex-wrap">
                                <span className="font-semibold text-slate-600">{sizeInMB} MB</span>
                                <span>•</span>
                                <span>{doc.uploadedAt}</span>
                                <span>•</span>
                                {doc.isScanning ? (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] animate-pulse">
                                    [ AI Đang Đọc Lướt... ]
                                  </span>
                                ) : scan?.isMultiSubject ? (
                                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px]">
                                    [ Đa Môn / Liên Ngành ]
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                    [ Đơn Môn: {scan?.primarySubject.subjectName || "Đã Nhận Diện"} ]
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-black ${
                                isSelected
                                  ? "bg-blue-600 text-white shadow-2xs"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              {isSelected ? "ĐANG CHỌN" : "CHỌN"}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleRemoveDoc(e, doc.id)}
                              className="px-2 py-1 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-[11px] font-bold transition-colors cursor-pointer"
                              title="Xóa tệp khỏi danh sách"
                            >
                              [XÓA]
                            </button>
                          </div>
                        </div>

                        {/* GitHub-style mini distribution bar for this file */}
                        {scan && scan.distributions && scan.distributions.length > 0 && (
                          <div className="space-y-1 pt-1 border-t border-slate-100">
                            {/* Segmented flex bar */}
                            <div className="h-1.5 w-full bg-slate-100 rounded-full flex overflow-hidden">
                              {scan.distributions.map((d, dIdx) => (
                                <div
                                  key={dIdx}
                                  style={{
                                    width: `${d.percentage}%`,
                                    backgroundColor: d.color,
                                  }}
                                  title={`${d.subjectName}: ${d.percentage}%`}
                                />
                              ))}
                            </div>

                            {/* Legend labels */}
                            <div className="flex items-center gap-3 text-[10px] text-slate-600 flex-wrap">
                              {scan.distributions.map((d, dIdx) => (
                                <span key={dIdx} className="inline-flex items-center gap-1">
                                  <span
                                    className="w-2 h-2 rounded-full inline-block"
                                    style={{ backgroundColor: d.color }}
                                  />
                                  <strong className="text-slate-700">{d.subjectName}</strong>
                                  <span className="text-slate-400">{d.percentage}%</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* CHẾ ĐỘ XEM 2: GOM NHÓM THEO BỘ CHUYÊN NGÀNH (Bundle Clustering) */
                <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
                  {clusteredBundles.map((bundle, bIdx) => (
                    <div
                      key={bIdx}
                      className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/90 space-y-2.5"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{ backgroundColor: bundle.color }}
                          />
                          <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                            Bộ Môn: {bundle.subjectName}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            ({bundle.domainName})
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-white text-blue-700 border border-blue-200 text-[10px] font-black">
                          {bundle.docs.length} Tài Liệu
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {bundle.docs.map((doc) => {
                          const isSelected = activeDoc?.id === doc.id;
                          return (
                            <div
                              key={doc.id}
                              onClick={() => handleSelectActiveDoc(doc)}
                              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-white border-blue-500 shadow-2xs font-bold"
                                  : "bg-white/80 border-slate-200 hover:bg-white"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-mono text-[10px] text-slate-500 font-bold shrink-0">
                                  [{doc.extension}]
                                </span>
                                <span className="text-slate-800 truncate">{doc.name}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {doc.scanResult?.isMultiSubject && (
                                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                    Đa Môn
                                  </span>
                                )}
                                <span
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                    isSelected
                                      ? "bg-blue-600 text-white"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {isSelected ? "ĐANG CHỌN" : "XEM"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Main Action Button - Kích Hoạt Agent */}
              <button
                type="button"
                onClick={handleStartExtraction}
                disabled={!activeDoc || isProcessing}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <span>[ AI AGENT ĐANG HỆ THỐNG HÓA BÀI HỌC... ]</span>
                ) : (
                  <span>
                    [ KÍCH HOẠT AGENT TRÍCH XUẤT &amp; HỆ THỐNG HÓA TRI THỨC FEYNMAN → ]
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* CỘT PHẢI: Bảng thông tin học thuật, GitHub Language Bar & Semantic Chapter Splitter (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              {/* Header Box */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase">
                      ĐỐI SOÁT
                    </span>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                      Bảng Thông Tin Học Thuật
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Ma trận nhãn đa ngành &amp; đối soát kho tri thức Supabase
                  </p>
                </div>
                {aiClassification && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-black border border-emerald-200">
                    {aiClassification.confidenceScore}% Khớp Tri Thức
                  </span>
                )}
              </div>

              {/* PHƯƠNG ÁN A: GITHUB-STYLE MULTI-DOMAIN LANGUAGE BAR */}
              {activeScanResult && activeScanResult.distributions.length > 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Ma Trận Phân Bổ Ngữ Nghĩa (Multi-Tag Distribution)
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      Chuẩn GitHub Language Bar
                    </span>
                  </div>

                  {/* Thanh tỷ lệ % phân bổ ngang đa màu */}
                  <div className="h-3 w-full bg-slate-200 rounded-full flex overflow-hidden p-0.5 shadow-inner">
                    {activeScanResult.distributions.map((dist, idx) => (
                      <div
                        key={idx}
                        style={{
                          width: `${dist.percentage}%`,
                          backgroundColor: dist.color,
                        }}
                        className="h-full rounded-sm transition-all duration-300"
                        title={`${dist.subjectName}: ${dist.percentage}%`}
                      />
                    ))}
                  </div>

                  {/* Bảng chú giải các môn học và % tương ứng */}
                  <div className="space-y-1.5 pt-1">
                    {activeScanResult.distributions.map((dist, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs p-2 rounded-xl bg-white border border-slate-200/70"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                            style={{ backgroundColor: dist.color }}
                          />
                          <span className="font-bold text-slate-800 truncate">
                            {dist.subjectName}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                            [{dist.domainName}]
                          </span>
                        </div>
                        <span className="font-mono text-xs font-black text-slate-800 shrink-0">
                          {dist.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Từ khóa đối soát trong tài liệu */}
                  {activeScanResult.primarySubject.matchedKeywords.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-slate-200/60">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Từ khóa ngữ nghĩa nhận diện được:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {activeScanResult.primarySubject.matchedKeywords.map((kw, kIdx) => (
                          <span
                            key={kIdx}
                            className="px-2 py-0.5 rounded-md bg-white text-slate-700 text-[10px] font-bold border border-slate-200"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {/* PHƯƠNG ÁN B: SEMANTIC CHAPTER SPLITTER (Khi phát hiện tài liệu đa học phần / liên ngành) */}
              {activeScanResult?.isMultiSubject && (
                <div className="p-4 rounded-2xl bg-purple-50/80 border-2 border-purple-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-purple-700 text-white font-mono text-[10px] font-black uppercase">
                        PHƯƠNG ÁN B
                      </span>
                      <span className="text-xs font-black text-purple-950 uppercase tracking-wider">
                        Phát Hiện Tài Liệu Đa Môn / Liên Ngành
                      </span>
                    </div>
                    <span className="text-[10px] font-black uppercase bg-purple-200 text-purple-900 px-2 py-0.5 rounded">
                      Semantic Splitter
                    </span>
                  </div>

                  <p className="text-xs text-purple-900 leading-relaxed">
                    Tài liệu này chứa nội dung của <strong>2 môn học khác nhau</strong> (
                    {activeScanResult.primarySubject.subjectName} và{" "}
                    {activeScanResult.secondarySubject?.subjectName}). Hãy chọn phương án xử lý phù hợp:
                  </p>

                  {/* 2 Tùy chọn xử lý: Tích Hợp vs Tách Module */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleToggleSplitMode("integrated")}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        activeDoc?.selectedSplitMode === "integrated"
                          ? "bg-white border-purple-600 shadow-sm ring-2 ring-purple-600/20"
                          : "bg-white/70 border-purple-200 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-purple-950">
                          Tích Hợp Liên Ngành
                        </span>
                        {activeDoc?.selectedSplitMode === "integrated" && (
                          <span className="text-[10px] font-black text-purple-700">[ĐANG CHỌN]</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        Giữ nguyên 1 bài học tổng hợp, liên kết chéo trên Cây Tri Thức toàn sàn.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleSplitMode("split")}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        activeDoc?.selectedSplitMode === "split"
                          ? "bg-white border-purple-600 shadow-sm ring-2 ring-purple-600/20"
                          : "bg-white/70 border-purple-200 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-purple-950">
                          Tách Thành Các Module
                        </span>
                        {activeDoc?.selectedSplitMode === "split" && (
                          <span className="text-[10px] font-black text-purple-700">[ĐANG CHỌN]</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        Tự động cắt theo ranh giới chương thành các bài học độc lập cho từng môn.
                      </p>
                    </button>
                  </div>

                  {/* Hiển thị chi tiết các phân đoạn chương mục được phát hiện khi chọn Tách Module */}
                  {activeDoc?.selectedSplitMode === "split" &&
                    activeScanResult.detectedModules &&
                    activeScanResult.detectedModules.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-purple-200">
                        <span className="text-[11px] font-black text-purple-950 uppercase tracking-wider block">
                          Các Module Bài Học Độc Lập Dự Kiến Tách:
                        </span>
                        <div className="space-y-2">
                          {activeScanResult.detectedModules.map((mod) => (
                            <div
                              key={mod.id}
                              className="p-2.5 rounded-xl bg-white border border-purple-200 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between font-bold text-slate-800">
                                <span className="line-clamp-1">{mod.heading}</span>
                                <span className="text-[10px] text-purple-700 font-mono font-bold shrink-0">
                                  ~{mod.percentageInDoc}% tệp
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                <span className="font-bold text-indigo-700">
                                  Môn: {mod.dominantSubjectName}
                                </span>
                                <span>•</span>
                                <span>{mod.wordCount} từ</span>
                              </div>
                              <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                                "{mod.previewSnippet}"
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* Trường 1 & 2: Nhóm Ngành & Môn Học */}
              <div className="space-y-3.5 pt-1">
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

              {/* Chi tiết định danh học thuật */}
              {aiClassification && (
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100/90 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-950 uppercase tracking-wider text-[11px]">
                      Định Danh Bài Học Đề Xuất
                    </span>
                    <span className="text-[10px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                      Master Schema
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-indigo-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      Tiêu Đề Bài Giảng
                    </span>
                    <span className="font-bold text-slate-800 block line-clamp-1">
                      {aiClassification.suggestedTitle}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-indigo-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        URL Reference Chuẩn
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(aiClassification.refLink);
                          setIsCopied(true);
                          toast.success("Đã sao chép liên kết!");
                          setTimeout(() => setIsCopied(false), 2000);
                        }}
                        className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        {isCopied ? "[ĐÃ SAO CHÉP]" : "[SAO CHÉP LINK]"}
                      </button>
                    </div>
                    <span className="font-mono text-[11px] text-indigo-600 block truncate">
                      {aiClassification.refLink}
                    </span>
                  </div>
                </div>
              )}

              {/* Chỉ tiêu trích xuất */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                  Chỉ Tiêu Trích Xuất Chuẩn Feynman
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

      {/* Live AI Agent Processing Stepper - Không Dùng Icon */}
      {isProcessing && (
        <div className="bg-white rounded-3xl p-8 border border-blue-200 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <span className="px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-800 font-mono text-xs font-black uppercase inline-block animate-pulse">
              [ AI AGENT ĐANG XỬ LÝ DỮ LIỆU ]
            </span>
            <h3 className="text-lg font-black text-slate-800">
              Hệ Thống Hóa Tri Thức Học Thuật
            </h3>
            <p className="text-xs text-slate-500 font-mono">{stageMessage}</p>
          </div>

          {/* Stepper Progress */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {[
              { num: 1, title: "Tiếp Nhận & Quét Cấu Trúc", desc: "Bóc tách văn bản & ma trận ngữ nghĩa" },
              { num: 2, title: "Semantic Chunking", desc: "Băm ý niệm & gán tiền đề Contextual Retrieval" },
              { num: 3, title: "Chiếu Xạ Master Graph", desc: "Định vị tiên quyết & độ khó trên Supabase" },
              { num: 4, title: "Schema Feynman", desc: "Đóng gói bài học & chuẩn bị đưa sang Bàn Thẩm Định" },
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
                    className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center font-mono ${
                      currentStage > st.num
                        ? "bg-emerald-600 text-white"
                        : currentStage === st.num
                        ? "bg-blue-600 text-white animate-pulse"
                        : "bg-slate-300 text-slate-700"
                    }`}
                  >
                    {currentStage > st.num ? "OK" : st.num}
                  </span>
                  <span className="text-xs font-bold text-slate-800">{st.title}</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extracted Lesson Output Card - Không Dùng Icon */}
      {extractedDraft && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-indigo-200 shadow-xl space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                  [ TRẠNG THÁI: CHỜ KIỂM ĐỊNH ]
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
                    className="font-mono text-indigo-600 hover:underline hover:text-indigo-800 transition-colors"
                  >
                    {extractedDraft.refLink}
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(extractedDraft.refLink || "");
                      setIsCopied(true);
                      toast.success("Đã sao chép liên kết tham chiếu!");
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    {isCopied ? "[ĐÃ SAO CHÉP]" : "[SAO CHÉP]"}
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {extractedDraft.pedagogicalRoleLabel && (
                <span className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200 shadow-2xs">
                  {extractedDraft.pedagogicalRoleLabel}
                </span>
              )}
              <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
                {extractedDraft.estimatedReadingMinutes} phút đọc
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold">
                Độ khó {extractedDraft.difficultyLevel}/5
              </span>
            </div>
          </div>

          {/* Master Ontology Projection */}
          {extractedDraft.suggestedRoadmapPosition && (
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                  Định Vị Trong Cây Tri Thức Chuẩn (Master Ontology Projection)
                </span>
                <span className="text-[10px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded border border-indigo-200">
                  Supabase Knowledge Graph
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700">
                {extractedDraft.suggestedRoadmapPosition}
              </p>
            </div>
          )}

          {/* Summary */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Tóm Tắt Khái Quát Bài Học (Feynman Ground Truth)
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
              {extractedDraft.summary}
            </p>
          </div>

          {/* 2 Cột Concepts & Jargons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-2.5">
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
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

            <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-2.5">
              <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider">
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

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={handleReset}
              className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              [ Tải Lên Tài Liệu Khác ]
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {isCuratorOrAdmin ? (
                <button
                  onClick={() => navigate("/curator/validation")}
                  className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  [ Đi Đến Bàn Thẩm Định Để Phê Duyệt Ngay → ]
                </button>
              ) : (
                <button
                  onClick={() => {
                    toast.success("Bài học đã được gửi tới Hội đồng Thẩm định viên thành công!");
                    navigate("/topics");
                  }}
                  className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  [ Xác Nhận &amp; Gửi Vào Hàng Đợi Thẩm Định ]
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
