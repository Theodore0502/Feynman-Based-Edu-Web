/**
 * File: src/pages/MasteryReportCard.tsx
 * Mục đích: [Trang 6] Mastery Report Card - Thẻ Báo Cáo Năng Lực Feynman tổng kết toàn diện mức độ thấu suốt của người học.
 * Thành phần chính:
 *   - MasteryReportCard: Kế thừa MasteryCardPreview, hiển thị phân tích lỗ hổng kiến thức và gợi ý ôn tập.
 * Props/Inputs: Không có.
 */

import React, { useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { MasteryCardPreview } from "@/components/shared/MasteryCardPreview";
import { useModalStore } from "@/hooks/useModalStore";
import type { ReportData } from "@/types/session.types";
import { ArrowLeft, Share2 } from "lucide-react";

export const MasteryReportCard: React.FC = () => {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const sessionId = params.sessionId as string;
  const { openModal } = useModalStore();

  const topic = searchParams.get("topic") || "Cơ chế Docker Container";
  const score = parseInt(searchParams.get("score") || "84");

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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Dashboard</span>
        </Link>

        <button
          onClick={() => openModal("SHARE_MASTERY", { topic, score: report.clarityScore })}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#EEF2FC] text-[#5066A1] hover:bg-[#D8E3FB] font-bold text-xs border border-[#D5E1FA] transition-colors cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Chia Sẻ Thẻ Điểm</span>
        </button>
      </div>

      {/* Main Feynman Mastery Card */}
      <MasteryCardPreview
        topic={topic}
        report={report}
        onShare={() => openModal("SHARE_MASTERY", { topic, score: report.clarityScore })}
      />

      {/* Next Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <Link
          to="/stage/new"
          className="w-full sm:flex-1 py-3.5 rounded-2xl bg-[#7286D3] hover:bg-[#5066A1] text-white font-bold text-xs text-center shadow-xs transition-colors"
        >
          Giảng Chủ Đề Mới
        </Link>
        <Link
          to="/vault"
          className="w-full sm:flex-1 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs text-center border border-slate-200/80 shadow-xs transition-colors"
        >
          Xem Thuật Ngữ Đã Lưu Vào Vault
        </Link>
      </div>
    </div>
  );
};

export default MasteryReportCard;

