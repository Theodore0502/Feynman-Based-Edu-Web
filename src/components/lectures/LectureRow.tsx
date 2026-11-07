/**
 * File: src/components/lectures/LectureRow.tsx
 * Mục đích: Hiển thị một dòng bài giảng trong Bảng Danh Sách Dọc (Cấp 3).
 * Bao gồm: STT, Tiêu đề & Từ khóa, Status Badge, Điểm Clarity, và các Action Buttons.
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { Play, RotateCw, FileText, ArrowRight, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import type { CatalogTopic, LectureStatus } from "@/types/catalog.types";

interface LectureRowProps {
  lecture: CatalogTopic;
  orderNumber: number;
  domainSlug?: string;
  subjectSlug?: string;
}

export const LectureRow: React.FC<LectureRowProps> = ({
  lecture,
  orderNumber,
  domainSlug,
  subjectSlug,
}) => {
  const navigate = useNavigate();
  const formattedIndex = String(orderNumber).padStart(2, "0");

  const status: LectureStatus = lecture.status || "NOT_STARTED";
  const clarityScore = lecture.highestClarityScore;

  // Render Status Badge
  const renderStatusBadge = () => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Đã học</span>
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin" />
            <span>Đang học</span>
          </span>
        );
      case "NEEDS_REVIEW":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>Học lại</span>
          </span>
        );
      case "NOT_STARTED":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>Chưa học</span>
          </span>
        );
    }
  };

  // Helper để tạo URL query giữ đúng nguồn gốc môn học
  const buildStageParams = (extraParams?: Record<string, string>) => {
    const params = new URLSearchParams({
      topic: lecture.title,
      ...extraParams,
    });
    if (domainSlug) params.set("domain", domainSlug);
    if (subjectSlug) params.set("subject", subjectSlug);
    return params.toString();
  };

  // Handlers for action buttons
  const handleStartLecture = () => {
    // Chuyển sang trang Luyện tập với bài giảng được chọn sẵn kèm nguồn gốc môn học
    navigate(`/stage/new?${buildStageParams()}`);
  };

  const handleResumeLecture = () => {
    const sessionId = lecture.activeSessionId || `ses-active-${orderNumber}`;
    navigate(`/stage/${sessionId}?${buildStageParams()}`);
  };

  const handleViewReport = () => {
    const sessionId = lecture.activeSessionId || "sample";
    navigate(
      `/stage/${sessionId}/report?${buildStageParams({
        score: String(clarityScore || 85),
      })}`
    );
  };

  return (
    <tr className="hover:bg-[#F8FAFD] transition-colors border-b border-slate-100 last:border-b-0">
      {/* 1. STT */}
      <td className="py-4 px-4 font-mono font-bold text-slate-400 text-xs sm:text-sm">
        {formattedIndex}
      </td>

      {/* 2. Tiêu đề bài giảng & Badges từ khóa cốt lõi */}
      <td className="py-4 px-4 min-w-[280px]">
        <div className="space-y-1.5">
          <button
            onClick={handleStartLecture}
            className="text-left font-extrabold text-sm text-slate-800 hover:text-[#5066A1] transition-colors cursor-pointer"
          >
            {lecture.title}
          </button>

          {/* Badges khái niệm cốt lõi */}
          <div className="flex flex-wrap items-center gap-1.5">
            {lecture.requiredConcepts.map((concept, idx) => (
              <span
                key={idx}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/80"
              >
                {concept}
              </span>
            ))}
          </div>
        </div>
      </td>

      {/* 3. Trạng thái học */}
      <td className="py-4 px-4 whitespace-nowrap">
        {renderStatusBadge()}
      </td>

      {/* 4. Điểm Clarity cao nhất */}
      <td className="py-4 px-4 text-center whitespace-nowrap">
        {clarityScore ? (
          <div className="inline-flex items-center gap-1 font-mono font-black text-sm">
            <span
              className={
                clarityScore >= 80 ? "text-emerald-600" : "text-amber-600"
              }
            >
              {clarityScore}
            </span>
            <span className="text-slate-400 text-xs font-normal">/100</span>
          </div>
        ) : (
          <span className="text-slate-300 font-mono text-xs font-bold">--</span>
        )}
      </td>

      {/* 5. Nút Hành động */}
      <td className="py-4 px-4 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-2">
          {status === "NOT_STARTED" && (
            <button
              onClick={handleStartLecture}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#7286D3] hover:bg-[#5066A1] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Bắt đầu học</span>
            </button>
          )}

          {status === "IN_PROGRESS" && (
            <button
              onClick={handleResumeLecture}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Học tiếp</span>
            </button>
          )}

          {(status === "COMPLETED" || status === "NEEDS_REVIEW") && (
            <>
              <button
                onClick={handleViewReport}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                title="Xem lại thẻ báo cáo Feynman Mastery"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Xem báo cáo</span>
              </button>

              <button
                onClick={handleStartLecture}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#EEF2FC] hover:bg-[#D8E3FB] text-[#5066A1] text-xs font-bold border border-[#D5E1FA] transition-colors cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Học lại</span>
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

