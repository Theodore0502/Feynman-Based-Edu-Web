/**
 * File: src/pages/MaterialUploadHub.tsx
 * Mục đích: Trung tâm tải lên tài liệu học tập & Kích hoạt AI Agent Hệ thống hóa Tri thức.
 * Trải nghiệm người dùng:
 *   - Layout 2 cột cố định xuyên suốt (Cột trái: Tải lên & Danh sách tệp; Cột phải: Bảng thông tin học thuật).
 *   - Dữ liệu Agent đọc lướt (Fast Scan) và trích xuất sâu (Deep Feynman Extraction) CẬP NHẬT TRỰC TIẾP lên bảng thông tin bên phải.
 *   - Tiêu đề bài giảng đề xuất có FULL CHỮ TIẾNG VIỆT CÓ DẤU (Title Case chuẩn mực).
 *   - Chức năng kiểm tra trùng tiêu đề trong cơ sở dữ liệu của user (Bàn thẩm định, Cây tri thức, tệp đang nạp):
 *       + Gợi ý thêm số phiên bản: (Phiên Bản 2, 3, 4...)
 *       + Gợi ý thêm số phần: (Phần 2, 3, 4...)
 *       + Gợi ý gộp nội dung vào bài giảng hiện có.
 *   - Tuyệt đối không chuyển sang trang mới hoặc layout mới toàn màn hình.
 *   - Hỗ trợ xem từng tệp hoặc gom nhóm theo bộ chuyên ngành.
 *   - Phương án A: Ma trận phân bổ % ngữ nghĩa (GitHub-style language bar).
 *   - Phương án B: Tự động phát hiện ranh giới chương/học phần (Semantic Chapter Splitter).
 *   - Quy chuẩn UI: TUYỆT ĐỐI KHÔNG DÙNG ICON (No Lucide, no SVG, typographic badges, progress bars & status dots only).
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
} from "@/lib/services/fast-document-scanner";
import {
  TitleDuplicateAdvisor,
  TitleConflictAdvice,
} from "@/lib/services/title-duplicate-advisor";
import { DomainCategory, AcademicSubject, CatalogTopic, TaxonomyClassificationResult } from "@/types/catalog.types";
import { PageHeroBanner } from "@/components/shared/PageHeroBanner";

const ALLOWED_EXTENSIONS = [".pdf", ".pdfa", ".doc", ".docx", ".pptx"];

export interface UploadedDocRecord {
  id: string;
  file: File;
  name: string;
  size: number;
  extension: string;
  uploadedAt: string;
  suggestedTitle: string;
  classification: TaxonomyClassificationResult | null;
  scanResult: FastScanResult | null;
  extractedDraft: ExtractedLessonDraft | null;
  isScanning: boolean;
  isExtracting: boolean;
  isMerged?: boolean;
  mergeTargetTitle?: string;
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
  const [catalogTopics, setCatalogTopics] = useState<CatalogTopic[]>([]);
  const [userDrafts, setUserDrafts] = useState<ExtractedLessonDraft[]>([]);

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
  const activeExtractedDraft = activeDoc ? activeDoc.extractedDraft : null;

  const [fileError, setFileError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Agent State (tiến trình trích xuất chi tiết)
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [stageMessage, setStageMessage] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load domains, subjects, catalog topics & user drafts from Supabase & LocalStorage
  useEffect(() => {
    let mounted = true;
    CurriculumService.getAllCurriculumGraphData().then((data) => {
      if (!mounted) return;
      setDomains(data.domains);
      setSubjects(data.subjects);
      setDomainSubjects(data.domainSubjects);
      setCatalogTopics(data.topics || []);

      if (data.domains.length > 0) {
        setSelectedDomainId(data.domains[0].id);
      }
    });

    DocumentExtractionAgent.getAllDrafts().then((drafts) => {
      if (!mounted) return;
      setUserDrafts(drafts || []);
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

  // Kiểm tra xung đột / trùng lặp tiêu đề trong cơ sở dữ liệu của user
  const titleConflictAdvice: TitleConflictAdvice | null = useMemo(() => {
    if (!activeDoc || !activeDoc.suggestedTitle) return null;
    return TitleDuplicateAdvisor.checkTitleConflict({
      currentTitle: activeDoc.suggestedTitle,
      currentDocId: activeDoc.id,
      userDrafts,
      catalogTopics,
      otherUploadedDocs: uploadedDocs.map((d) => ({
        id: d.id,
        suggestedTitle: d.suggestedTitle,
      })),
    });
  }, [activeDoc?.suggestedTitle, activeDoc?.id, userDrafts, catalogTopics, uploadedDocs]);

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
            suggestedTitle: scanRes.suggestedTitle,
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
              allowedConcepts: scanRes.allowedConcepts,
              allowedJargons: scanRes.allowedJargons,
            },
          };
        })
      );

      // Nếu đây là tài liệu đang chọn hoặc tệp đầu tiên, cập nhật ngay lên bảng thông tin bên phải
      if (activeDocId === recordId || (!activeDocId && uploadedDocs[0]?.id === recordId)) {
        setSelectedDomainId(scanRes.primarySubject.domainId);
        setTimeout(() => {
          setSelectedSubjectId(scanRes.primarySubject.subjectId);
        }, 50);

        if (scanRes.isMultiSubject) {
          toast.success(
            `Đã cập nhật bảng thông tin: Tài liệu đa môn [${scanRes.primarySubject.subjectName} ${scanRes.primarySubject.percentage}% & ${scanRes.secondarySubject?.subjectName} ${scanRes.secondarySubject?.percentage}%]`
          );
        } else {
          toast.success(
            `Đã cập nhật bảng thông tin: ${scanRes.primarySubject.subjectName} (${scanRes.primarySubject.percentage}% khớp)`
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
        suggestedTitle: fallbackClassification?.suggestedTitle || file.name.replace(/\.[^/.]+$/, ""),
        classification: fallbackClassification,
        scanResult: null,
        extractedDraft: null,
        isScanning: true,
        isExtracting: false,
        isMerged: false,
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

  const handleUpdateActiveTitle = (newTitle: string) => {
    if (!activeDoc) return;
    setUploadedDocs((prev) =>
      prev.map((d) => {
        if (d.id !== activeDoc.id) return d;
        return {
          ...d,
          suggestedTitle: newTitle,
          classification: d.classification
            ? { ...d.classification, suggestedTitle: newTitle }
            : null,
          scanResult: d.scanResult
            ? { ...d.scanResult, suggestedTitle: newTitle }
            : null,
        };
      })
    );
  };

  // Áp dụng số phiên bản / phần khi bị trùng tiêu đề
  const handleApplyVersionedTitle = (newTitle: string) => {
    if (!activeDoc) return;
    handleUpdateActiveTitle(newTitle);
    setUploadedDocs((prev) =>
      prev.map((d) =>
        d.id === activeDoc.id ? { ...d, isMerged: false, mergeTargetTitle: undefined } : d
      )
    );
    toast.success(`Đã áp dụng tiêu đề phiên bản mới: "${newTitle}"`);
  };

  // Áp dụng chế độ Gộp vào bài giảng hiện có
  const handleApplyMergeWithExisting = (targetTitle: string) => {
    if (!activeDoc) return;
    setUploadedDocs((prev) =>
      prev.map((d) =>
        d.id === activeDoc.id
          ? {
              ...d,
              isMerged: true,
              mergeTargetTitle: targetTitle,
            }
          : d
      )
    );
    toast.success(
      `Đã kích hoạt chế độ gộp! Nội dung sẽ được tích hợp bổ sung vào bài giảng: "${targetTitle}".`
    );
  };

  const handleCancelMerge = () => {
    if (!activeDoc) return;
    setUploadedDocs((prev) =>
      prev.map((d) =>
        d.id === activeDoc.id ? { ...d, isMerged: false, mergeTargetTitle: undefined } : d
      )
    );
    toast.info("Đã hủy chế độ gộp nội dung.");
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

  // Kích hoạt Agent trích xuất sâu chuẩn Feynman cho tệp đang chọn
  const handleStartExtraction = async () => {
    if (!activeDoc || !uploadedFile) {
      toast.error("Vui lòng chọn hoặc kéo thả một tệp tài liệu");
      return;
    }

    if (!selectedDomainId || !selectedSubjectId) {
      toast.error("Vui lòng chọn Nhóm Ngành và Môn Học");
      return;
    }

    const currentDocId = activeDoc.id;

    // Đánh dấu doc đang trích xuất
    setUploadedDocs((prev) =>
      prev.map((d) => (d.id === currentDocId ? { ...d, isExtracting: true, status: "processing" } : d))
    );
    setCurrentStage(1);
    setStageMessage("Quét cấu trúc ngữ nghĩa & nhận diện sư phạm...");

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

      // Nếu tài liệu liên ngành và chọn tích hợp
      if (activeScanResult?.isMultiSubject && activeDoc?.selectedSplitMode === "integrated") {
        draft.suggestedRoadmapPosition = `[Bài Học Liên Ngành] ${draft.suggestedRoadmapPosition} • Chuyên môn kết nối: ${activeScanResult.secondarySubject?.subjectName}`;
      }

      // Nếu người dùng chọn chế độ GỘP vào bài giảng hiện có
      if (activeDoc.isMerged && activeDoc.mergeTargetTitle) {
        draft.title = `${activeDoc.mergeTargetTitle} (Đã Gộp Nội Dung)`;
        draft.summary = `[Nội Dung Gộp Bổ Sung Cho Bài: ${activeDoc.mergeTargetTitle}]\n${draft.summary}`;
      } else {
        draft.title = activeDoc.suggestedTitle;
      }

      // Cập nhật kết quả trích xuất trực tiếp vào bản ghi của tệp đang chọn
      setUploadedDocs((prev) =>
        prev.map((d) =>
          d.id === currentDocId
            ? {
                ...d,
                extractedDraft: draft,
                isExtracting: false,
                status: "extracted",
                suggestedTitle: draft.title,
              }
            : d
        )
      );

      // Cập nhật user drafts cache
      setUserDrafts((prev) => [draft, ...prev.filter((d) => d.id !== draft.id)]);

      toast.success(
        activeDoc.isMerged
          ? `AI Agent đã hệ thống hóa và gộp bài học thành công vào "${activeDoc.mergeTargetTitle}"!`
          : "AI Agent đã trích xuất & cập nhật dữ liệu thành công vào bảng thông tin bên phải!"
      );
    } catch (err: any) {
      console.error("Lỗi trích xuất:", err);
      toast.error("Có lỗi xảy ra trong quá trình xử lý bài học: " + err.message);
      setUploadedDocs((prev) =>
        prev.map((d) => (d.id === currentDocId ? { ...d, isExtracting: false, status: "ready" } : d))
      );
    }
  };

  const isCuratorOrAdmin = user?.role === "curator" || user?.role === "admin";
  const isCurrentlyExtracting = activeDoc?.isExtracting || false;

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

      {/* CẤU TRÚC 2 CỘT CỐ ĐỊNH XUYÊN SUỐT - DỮ LIỆU ĐƯỢC CẬP NHẬT TRỰC TIẾP LÊN BẢNG BÊN PHẢI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ============================================================== */}
        {/* CỘT TRÁI: Khu vực tải tài liệu lên & Danh sách tệp (6 cols)     */}
        {/* ============================================================== */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
            {/* Header Box */}
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
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200/60 shadow-2xs">
                {uploadedDocs.length} tệp
              </span>
            </div>

            {/* Dropzone Tải Lên - Hoàn toàn không dùng icon */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => !isCurrentlyExtracting && fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/70 hover:bg-blue-50/30 rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group"
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

              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-bold text-slate-700">
                  Định dạng: .DOCX, .DOC, .PDF, .PDFA, .PPTX • Tối đa 25MB
                </p>
                <p className="text-[11px] text-slate-400">
                  Khi tải lên, AI tự động đọc lướt và điền thẳng tiêu đề tiếng Việt có dấu sang bảng bên phải
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
                    Tệp Mẫu Ngành CNTT Có Sẵn (Bấm nạp để AI đọc lướt):
                  </span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-white px-2 py-0.5 rounded text-indigo-700 border border-indigo-200/70 shadow-2xs">
                  7 Tệp
                </span>
              </div>

              <div className="space-y-2">
                {/* Hàng 1: Tài liệu Liên ngành (2 môn trong 1 tệp) */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-purple-700 uppercase tracking-wider block">
                    Tài Liệu Đa Môn / Liên Ngành (Test Phương Án A &amp; B):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleLoadSampleDoc("Do-An-Web-Dashboard-Va-Thi-Giac-May-Tinh-AI-Camera.docx")
                      }
                      disabled={isCurrentlyExtracting}
                      className="px-2.5 py-1.5 rounded-xl bg-purple-100/80 hover:bg-purple-600 text-purple-900 hover:text-white text-[11px] font-bold transition-all border border-purple-300 shadow-2xs cursor-pointer"
                    >
                      [DOCX] Đồ Án Web + AI Camera (2 Môn)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleLoadSampleDoc("Giao-Trinh-Tich-Hop-Co-So-Du-Lieu-Va-Mang-May-Tinh.docx")
                      }
                      disabled={isCurrentlyExtracting}
                      className="px-2.5 py-1.5 rounded-xl bg-purple-100/80 hover:bg-purple-600 text-purple-900 hover:text-white text-[11px] font-bold transition-all border border-purple-300 shadow-2xs cursor-pointer"
                    >
                      [DOCX] CSDL SQL + Mạng Máy Tính (2 Môn)
                    </button>
                  </div>
                </div>

                {/* Hàng 2: Tài liệu Đơn môn */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Tài Liệu Đơn Môn:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
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
                        label: "[DOCX] Mạng Máy Tính (TCP/IP)",
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
                        disabled={isCurrentlyExtracting}
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
                    Từng Tệp ({uploadedDocs.length})
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
                    Gom Theo Bộ ({clusteredBundles.length} Bộ)
                  </button>
                </div>
              </div>

              <span className="text-[11px] text-slate-400">
                {viewMode === "list" ? "Bấm tệp để đối soát bên phải" : "Tự động gom theo chuyên ngành"}
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
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
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
                          ? "border-blue-500 bg-blue-50/40 shadow-xs ring-1 ring-blue-500/20"
                          : "border-slate-200 bg-white hover:bg-slate-50/80"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Format Badge */}
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
                              {doc.suggestedTitle || doc.name}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                              <span className="font-semibold text-slate-600">{sizeInMB} MB</span>
                              <span>•</span>
                              <span>{doc.uploadedAt}</span>
                              <span>•</span>
                              {doc.isScanning ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] animate-pulse">
                                  [ AI Đang Đọc Lướt... ]
                                </span>
                              ) : doc.isMerged ? (
                                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px]">
                                  [ Gộp Vào: {doc.mergeTargetTitle} ]
                                </span>
                              ) : doc.extractedDraft ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                  [ Đã Trích Xuất Feynman ]
                                </span>
                              ) : scan?.isMultiSubject ? (
                                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px]">
                                  [ Đa Môn / Liên Ngành ]
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                                  [ {scan?.primarySubject.subjectName || "Đã Phân Loại"} ]
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
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
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
                              <span className="text-slate-800 truncate">{doc.suggestedTitle || doc.name}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {doc.extractedDraft && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  Feynman Đã Trích
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

            {/* Quick Trigger Button at left bottom */}
            {activeDoc && (
              <button
                type="button"
                onClick={handleStartExtraction}
                disabled={isCurrentlyExtracting}
                className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCurrentlyExtracting ? (
                  <span>[ AI AGENT ĐANG TRÍCH XUẤT CHO TỆP NÀY... ]</span>
                ) : (
                  <span>
                    [ KÍCH HOẠT AGENT TRÍCH XUẤT TRI THỨC FEYNMAN CHO TỆP ĐANG CHỌN → ]
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* CỘT PHẢI: Bảng thông tin học thuật cập nhật dữ liệu trực tiếp  */}
        {/* ============================================================== */}
        <div className="lg:col-span-6 space-y-5">
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
                  {activeDoc
                    ? `Đang hiển thị dữ liệu của: ${activeDoc.suggestedTitle || activeDoc.name}`
                    : "Chưa chọn tệp nào từ danh sách bên trái"}
                </p>
              </div>

              {activeDoc && (
                <div className="flex items-center gap-2">
                  {activeDoc.isMerged ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[11px] font-black border border-purple-300">
                      [ CHẾ ĐỘ GỘP ]
                    </span>
                  ) : activeExtractedDraft ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black border border-emerald-300">
                      [ ĐÃ TRÍCH XUẤT FEYNMAN ]
                    </span>
                  ) : activeDoc.isScanning ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-black border border-amber-300 animate-pulse">
                      [ ĐANG QUÉT AI... ]
                    </span>
                  ) : aiClassification ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[11px] font-black border border-blue-200">
                      {aiClassification.confidenceScore}% Khớp Tri Thức
                    </span>
                  ) : null}
                </div>
              )}
            </div>

            {/* THÔNG BÁO TIẾN TRÌNH TRÍCH XUẤT NGAY TẠI BẢNG NẾU ĐANG CHẠY */}
            {isCurrentlyExtracting && (
              <div className="p-4 rounded-2xl bg-blue-50/90 border border-blue-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-blue-900 uppercase tracking-wider animate-pulse">
                    [ AI AGENT ĐANG HỆ THỐNG HÓA BÀI HỌC ]
                  </span>
                  <span className="text-xs font-mono font-black text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                    Bước {currentStage} / 4
                  </span>
                </div>
                <div className="h-2 w-full bg-blue-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${(currentStage / 4) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] font-mono text-blue-800 leading-snug">{stageMessage}</p>
              </div>
            )}

            {activeDoc ? (
              <div className="space-y-4">
                {/* 1. KHỐI PHÂN LOẠI & ĐỊNH DANH HỌC THUẬT */}
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50/70 border border-slate-200/90">
                  <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                    Định Danh &amp; Phân Vùng Cây Tri Thức (Supabase Master Graph)
                  </span>

                  {/* Nhóm Ngành & Môn Học */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                        <span>Nhóm Ngành (Cấp 1)</span>
                      </label>
                      <select
                        value={selectedDomainId}
                        onChange={(e) => {
                          const newDomainId = e.target.value;
                          setSelectedDomainId(newDomainId);
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
                        }}
                        disabled={isCurrentlyExtracting}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer disabled:opacity-50"
                      >
                        {domains.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                        <span>Môn Học Trực Thuộc (Cấp 2)</span>
                      </label>
                      <select
                        value={selectedSubjectId}
                        onChange={(e) => {
                          const newSubId = e.target.value;
                          setSelectedSubjectId(newSubId);
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
                        }}
                        disabled={isCurrentlyExtracting || availableSubjects.length === 0}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer disabled:opacity-50"
                      >
                        {availableSubjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Tiêu đề bài giảng đề xuất (Full chữ tiếng Việt có dấu) */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        Tiêu Đề Bài Giảng Đề Xuất (Tiếng Việt chuẩn có dấu)
                      </label>
                      <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        AI Chuẩn Hóa
                      </span>
                    </div>

                    <input
                      type="text"
                      value={activeDoc.suggestedTitle}
                      onChange={(e) => handleUpdateActiveTitle(e.target.value)}
                      disabled={isCurrentlyExtracting}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 shadow-2xs"
                      placeholder="Nhập hoặc chỉnh sửa tiêu đề bài giảng..."
                    />

                    {/* KHỐI TRẠNG THÁI GỘP NỘI DUNG (NẾU ĐÃ CHỌN GỘP) */}
                    {activeDoc.isMerged && (
                      <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                        <div className="space-y-0.5">
                          <span className="font-mono text-[10px] font-black uppercase text-purple-800 bg-purple-200/80 px-2 py-0.5 rounded inline-block">
                            [CHẾ ĐỘ GỘP BÀI GIẢNG ĐANG BẬT]
                          </span>
                          <p className="text-[11px] text-purple-900 font-medium">
                            Nội dung tài liệu này sẽ được tích hợp bổ sung vào bài:{" "}
                            <strong>"{activeDoc.mergeTargetTitle}"</strong>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleCancelMerge}
                          className="px-2.5 py-1 rounded-xl bg-white hover:bg-purple-100 text-purple-800 text-[11px] font-bold border border-purple-300 transition-colors cursor-pointer shrink-0"
                        >
                          [Hủy Chế Độ Gộp]
                        </button>
                      </div>
                    )}

                    {/* KHỐI CẢNH BÁO TRÙNG TIÊU ĐỀ & RECOMMEND PHIÊN BẢN 2 3 4 HOẶC GỘP */}
                    {!activeDoc.isMerged && titleConflictAdvice?.hasConflict && (
                      <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200/90 space-y-2 text-xs animate-fade-in">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <span className="font-mono text-[10px] font-black uppercase text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded">
                            [PHÁT HIỆN TRÙNG TIÊU ĐỀ TRONG HỆ THỐNG]
                          </span>
                          <span className="text-[10px] text-amber-700 font-bold">
                            Nguồn: {titleConflictAdvice.matchedRecord?.source}
                          </span>
                        </div>

                        <p className="text-[11px] text-amber-900 leading-snug">
                          Hệ thống ghi nhận bạn đã có bài giảng:{" "}
                          <strong>"{titleConflictAdvice.matchedRecord?.title}"</strong>. Bạn có thể chọn cách xử lý nhanh:
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          {/* Gợi ý 1: Thêm số phiên bản 2, 3, 4 */}
                          <button
                            type="button"
                            onClick={() => handleApplyVersionedTitle(titleConflictAdvice.versionedTitle)}
                            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-amber-600 text-amber-900 hover:text-white border border-amber-300 text-[11px] font-bold transition-all shadow-2xs cursor-pointer"
                            title={`Đổi tên thành: ${titleConflictAdvice.versionedTitle}`}
                          >
                            [ Thêm Số: (Phiên Bản {titleConflictAdvice.nextVersionNumber}) ]
                          </button>

                          {/* Gợi ý 2: Thêm số phần 2, 3, 4 */}
                          <button
                            type="button"
                            onClick={() => handleApplyVersionedTitle(titleConflictAdvice.partTitle)}
                            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-amber-600 text-amber-900 hover:text-white border border-amber-300 text-[11px] font-bold transition-all shadow-2xs cursor-pointer"
                            title={`Đổi tên thành: ${titleConflictAdvice.partTitle}`}
                          >
                            [ Thêm Số: (Phần {titleConflictAdvice.nextVersionNumber}) ]
                          </button>

                          {/* Gợi ý 3: Gộp vào bài giảng hiện có */}
                          <button
                            type="button"
                            onClick={() =>
                              handleApplyMergeWithExisting(
                                titleConflictAdvice.matchedRecord?.title || titleConflictAdvice.rootTitle
                              )
                            }
                            className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-black transition-all shadow-2xs cursor-pointer"
                            title="Tích hợp bổ sung khái niệm và bẫy thuật ngữ vào bài giảng đã có"
                          >
                            [ Gộp Vào Bài Giảng Hiện Có ]
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* URL Reference Link chuẩn */}
                  {aiClassification?.refLink && (
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          URL Reference Link Chuẩn
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
                  )}
                </div>

                {/* 2. PHƯƠNG ÁN A: GITHUB-STYLE MULTI-DOMAIN LANGUAGE BAR */}
                {activeScanResult && activeScanResult.distributions.length > 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        Ma Trận Phân Bổ Ngữ Nghĩa (GitHub-Style Multi-Tag)
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {activeScanResult.isMultiSubject ? "Tài Liệu Đa Môn" : "Tài Liệu Đơn Môn"}
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
                    <div className="space-y-1 pt-1">
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

                {/* 3. PHƯƠNG ÁN B: SEMANTIC CHAPTER SPLITTER (Khi phát hiện tài liệu đa học phần / liên ngành) */}
                {activeScanResult?.isMultiSubject && (
                  <div className="p-4 rounded-2xl bg-purple-50/80 border-2 border-purple-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-purple-700 text-white font-mono text-[10px] font-black uppercase">
                          PHƯƠNG ÁN B
                        </span>
                        <span className="text-xs font-black text-purple-950 uppercase tracking-wider">
                          Phân Đoạn Ranh Giới Chương Mục
                        </span>
                      </div>
                      <span className="text-[10px] font-black uppercase bg-purple-200 text-purple-900 px-2 py-0.5 rounded">
                        Semantic Splitter
                      </span>
                    </div>

                    <p className="text-xs text-purple-900 leading-relaxed">
                      Tài liệu này chứa nội dung của <strong>2 môn học khác nhau</strong> (
                      {activeScanResult.primarySubject.subjectName} và{" "}
                      {activeScanResult.secondarySubject?.subjectName}). Chọn phương án xử lý:
                    </p>

                    {/* 2 Tùy chọn xử lý: Tích Hợp vs Tách Module */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleSplitMode("integrated")}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          activeDoc.selectedSplitMode === "integrated"
                            ? "bg-white border-purple-600 shadow-sm ring-2 ring-purple-600/20"
                            : "bg-white/70 border-purple-200 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black text-purple-950">
                            Tích Hợp Liên Ngành
                          </span>
                          {activeDoc.selectedSplitMode === "integrated" && (
                            <span className="text-[10px] font-black text-purple-700">[ĐANG CHỌN]</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-600 leading-tight">
                          Giữ nguyên 1 bài học tổng hợp, liên kết chéo trên Cây Tri Thức.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleSplitMode("split")}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          activeDoc.selectedSplitMode === "split"
                            ? "bg-white border-purple-600 shadow-sm ring-2 ring-purple-600/20"
                            : "bg-white/70 border-purple-200 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black text-purple-950">
                            Tách Thành Các Module
                          </span>
                          {activeDoc.selectedSplitMode === "split" && (
                            <span className="text-[10px] font-black text-purple-700">[ĐANG CHỌN]</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-600 leading-tight">
                          Tự động bóc tách theo chương thành các bài học độc lập cho từng môn.
                        </p>
                      </button>
                    </div>

                    {/* Hiển thị chi tiết các phân đoạn chương mục khi chọn Tách Module */}
                    {activeDoc.selectedSplitMode === "split" &&
                      activeScanResult.detectedModules &&
                      activeScanResult.detectedModules.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-purple-200">
                          <span className="text-[11px] font-black text-purple-950 uppercase tracking-wider block">
                            Các Module Bài Học Độc Lập Dự Kiến Tách:
                          </span>
                          <div className="space-y-1.5">
                            {activeScanResult.detectedModules.map((mod) => (
                              <div
                                key={mod.id}
                                className="p-2 rounded-xl bg-white border border-purple-200 text-xs space-y-1"
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
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {/* 4. KHỐI TRÍCH XUẤT FEYNMAN (KHI ĐÃ TRÍCH XUẤT HOẶC CHƯA) */}
                {activeExtractedDraft ? (
                  <div className="p-4 rounded-2xl bg-indigo-50/80 border-2 border-indigo-200 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-mono text-[10px] font-black uppercase">
                          KẾT QUẢ FEYNMAN
                        </span>
                        <span className="font-black text-indigo-950 uppercase tracking-wider">
                          Đã Trích Xuất &amp; Đóng Gói
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                        {activeExtractedDraft.estimatedReadingMinutes} phút đọc • Độ khó {activeExtractedDraft.difficultyLevel}/5
                      </span>
                    </div>

                    {/* Master Roadmap Positioning */}
                    {activeExtractedDraft.suggestedRoadmapPosition && (
                      <div className="bg-white p-2.5 rounded-xl border border-indigo-100 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">
                          Định Vị Trong Cây Tri Thức
                        </span>
                        <p className="font-semibold text-slate-800 leading-snug">
                          {activeExtractedDraft.suggestedRoadmapPosition}
                        </p>
                      </div>
                    )}

                    {/* Summary */}
                    <div className="bg-white p-2.5 rounded-xl border border-indigo-100 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">
                        Tóm Tắt Khái Quát (Feynman Ground Truth)
                      </span>
                      <p className="text-slate-700 leading-relaxed">
                        {activeExtractedDraft.summary}
                      </p>
                    </div>

                    {/* Concepts & Jargons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="bg-white p-2.5 rounded-xl border border-emerald-200 space-y-1.5">
                        <span className="text-[10px] font-bold text-emerald-800 block uppercase">
                          Khái Niệm Cốt Lõi ({activeExtractedDraft.requiredConcepts.length})
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {activeExtractedDraft.requiredConcepts.map((c, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 font-bold text-[10px] border border-emerald-200"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-rose-200 space-y-1.5">
                        <span className="text-[10px] font-bold text-rose-800 block uppercase">
                          Bẫy Thuật Ngữ ({activeExtractedDraft.jargonTraps.length})
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {activeExtractedDraft.jargonTraps.map((j, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-900 font-bold text-[10px] border border-rose-200"
                            >
                              {j}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Nút hành động chuyển giao sang Bàn Thẩm Định */}
                    <div className="pt-2 border-t border-indigo-100 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-500">
                        Trạng thái: Chờ Kiểm Định Viên phê duyệt
                      </span>
                      <div className="flex items-center gap-2">
                        {isCuratorOrAdmin ? (
                          <button
                            type="button"
                            onClick={() => navigate("/curator/validation")}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition-all shadow-xs cursor-pointer"
                          >
                            [ Sang Bàn Thẩm Định Ngay → ]
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              toast.success("Bài học đã được gửi tới Hàng đợi Bàn Thẩm Định thành công!");
                              navigate("/topics");
                            }}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all shadow-xs cursor-pointer"
                          >
                            [ Xác Nhận &amp; Gửi Vào Hàng Đợi Thẩm Định ]
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Khi chưa trích xuất: Hiển thị chỉ tiêu & Nút kích hoạt trích xuất sâu */
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                        Chỉ Tiêu Trích Xuất Feynman (AI Sẵn Sàng)
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {activeScanResult?.totalWords || 0} từ trong tài liệu
                      </span>
                    </div>

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

                    <button
                      type="button"
                      onClick={handleStartExtraction}
                      disabled={isCurrentlyExtracting}
                      className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      [ KÍCH HOẠT TRÍCH XUẤT FEYNMAN CHO TỆP NÀY → ]
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-10 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                <span className="px-3 py-1 rounded-md bg-slate-200 text-slate-600 font-mono text-[11px] font-black uppercase inline-block">
                  CHƯA CÓ DỮ LIỆU
                </span>
                <p className="text-xs font-bold text-slate-600">Chờ nạp tài liệu học thuật</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Hãy bấm chọn tệp mẫu hoặc kéo thả tệp ở khung bên trái để AI quét cấu trúc và hiển thị ma trận nhãn học thuật tại đây.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialUploadHub;
