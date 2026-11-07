/**
 * File: src/pages/MasteryReportCard.tsx
 * Mục đích: [Trang 6] Mastery Report Card - Thẻ Báo Cáo Năng Lực Feynman tổng kết toàn diện mức độ thấu suốt của người học.
 * Thành phần chính:
 *   - MasteryReportCard: Kế thừa MasteryCardPreview, hiển thị phân tích lỗ hổng kiến thức và gợi ý ôn tập.
 * Props/Inputs: Không có.
 */

import React, { useState } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { MasteryCardPreview } from "@/components/shared/MasteryCardPreview";
import { useModalStore } from "@/hooks/useModalStore";
import { getSubjectBySlug } from "@/data/three-tier-curriculum.data";
import type { ReportData } from "@/types/session.types";
import { ArrowLeft, Share2, BookOpen, Bookmark, LayoutDashboard } from "lucide-react";

export const MasteryReportCard: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = params.sessionId as string;
  const { openModal } = useModalStore();

  const topic = searchParams.get("topic") || "Cơ chế Docker Container";
  const score = parseInt(searchParams.get("score") || "84");
  const domain = searchParams.get("domain");
  const subject = searchParams.get("subject");
  const currentSubject = subject ? getSubjectBySlug(subject) : undefined;

  const report: ReportData = {
    id: `rep-${sessionId}`,
    sessionId: sessionId || "def",
    clarityScore: score,
    logicCompleteness: 88,
    bestAnalogy: "Docker giống như căn hộ chung cư xây sẵn đầy đủ tiện nghi, còn máy ảo giống mua cả khu đất tự xây móng.",
    knowledgeGaps: [
      "Chưa làm rõ cơ chế cách ly Namespace giữa các Container",
      "Có thể đào sâu hơn về Cgroup kiểm soát tài nguyên CPU/RAM"
    ],
    summaryFeedback: "Xuất sắc! Bạn đã giải thích rất lưu loát và gạt bỏ được 85% các thuật ngữ trừu tượng. Bé Bo đã hoàn toàn hiểu được cốt lõi!",
    createdAt: new Date().toISOString(),
  };

  // Điều hướng quay lại theo đúng trình tự cấp bậc
  const handleGoBack = () => {
    if (domain && subject) {
      navigate(`/lectures/${domain}/${subject}`);
    } else if (domain) {
      navigate(`/lectures/${domain}`);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/lectures");
    }
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Top Navigation: Nút quay lại đúng trình tự cấp bậc */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleGoBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-[#E2EAFD] text-xs font-bold text-slate-600 hover:text-[#5066A1] shadow-2xs transition-all cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>
            {currentSubject
              ? `Quay lại ${currentSubject.name}`
              : "Quay lại danh sách bài giảng"}
          </span>
        </button>

        <div className="flex items-center gap-2">
          <Link
            to="/dashboard"
            className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1 transition-colors"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Tổng Quan</span>
          </Link>

          <button
            onClick={() => openModal("SHARE_MASTERY", { topic, score: report.clarityScore })}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#EEF2FC] text-[#5066A1] hover:bg-[#D8E3FB] font-bold text-xs border border-[#D5E1FA] transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Chia Sẻ Thẻ Điểm</span>
          </button>
        </div>
      </div>

      {/* Main Feynman Mastery Card */}
      <MasteryCardPreview
        topic={topic}
        report={report}
        onShare={() => openModal("SHARE_MASTERY", { topic, score: report.clarityScore })}
      />

      {/* Next Actions: Các hướng đi tiếp hoặc quay lại */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        {domain && subject ? (
          <Link
            to={`/lectures/${domain}/${subject}`}
            className="w-full sm:flex-1 py-3.5 rounded-2xl bg-[#7286D3] hover:bg-[#5066A1] text-white font-bold text-xs text-center shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>Học Tiếp Bài Khác Trong Môn</span>
          </Link>
        ) : (
          <Link
            to="/lectures"
            className="w-full sm:flex-1 py-3.5 rounded-2xl bg-[#7286D3] hover:bg-[#5066A1] text-white font-bold text-xs text-center shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>Khám Phá Bài Giảng Mới</span>
          </Link>
        )}

        <Link
          to="/vault"
          className="w-full sm:flex-1 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs text-center border border-slate-200/80 shadow-xs transition-colors flex items-center justify-center gap-2"
        >
          <Bookmark className="w-4 h-4 text-amber-500" />
          <span>Mở Sổ Tay Thuật Ngữ</span>
        </Link>
      </div>
    </div>
  );
};

export default MasteryReportCard;

