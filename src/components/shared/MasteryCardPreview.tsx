/**
 * File: src/components/shared/MasteryCardPreview.tsx
 * Mục đích: Hiển thị Thẻ Báo Cáo Feynman (Feynman Mastery Card) với tổng kết điểm, trích dẫn ẩn dụ hay nhất và gợi ý lỗ hổng kiến thức (Dùng ở Trang 3, 6, Share Modal).
 * Thành phần chính:
 *   - MasteryCardPreview: Thẻ vinh danh và phân tích học thuật.
 * Props/Inputs:
 *   - report: ReportData | MasteryEvaluation - Dữ liệu báo cáo.
 *   - topic: string - Tên chủ đề bài giảng.
 *   - onShare?: () => void - Callback chia sẻ thẻ điểm.
 */

import React from "react";
import type { ReportData } from "@/types/session.types";
import type { MasteryEvaluation } from "@/types/agent.types";
import { getMasteryLevel } from "@/config/rubrics.config";
import { Award, Quote, AlertTriangle, Share2 } from "lucide-react";

interface MasteryCardPreviewProps {
  report: ReportData | MasteryEvaluation;
  topic: string;
  onShare?: () => void;
}

export const MasteryCardPreview: React.FC<MasteryCardPreviewProps> = ({
  report,
  topic,
  onShare,
}) => {
  const mastery = getMasteryLevel(report.clarityScore);
  const gaps = Array.isArray(report.knowledgeGaps)
    ? report.knowledgeGaps
    : typeof report.knowledgeGaps === "string"
    ? JSON.parse(report.knowledgeGaps)
    : [];

  return (
    <div className="bg-white rounded-3xl p-6 border border-[#E2EAFD] shadow-card relative overflow-hidden space-y-5">
      {/* Top Banner Ribbon */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF2FC] text-[#5066A1] text-xs font-bold mb-2 border border-[#D5E1FA]">
            <Award className="w-3.5 h-3.5 text-[#7286D3]" />
            <span>Feynman Mastery Card</span>
          </div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">{topic}</h3>
        </div>

        {onShare && (
          <button
            onClick={onShare}
            className="p-2.5 rounded-2xl bg-[#F4F7FD] hover:bg-[#EBF0FC] text-[#556DAF] transition-colors border border-[#D5E0FA] cursor-pointer"
            title="Chia sẻ thẻ điểm"
          >
            <Share2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dual Scores Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-[#F0F5FD] border border-[#D5E4FC] text-center">
          <span className="text-3xl font-black text-[#5066A1]">{report.clarityScore}%</span>
          <p className="text-[11px] font-bold text-slate-500 uppercase mt-1">Độ Bình Dân Hóa</p>
        </div>
        <div className="p-4 rounded-2xl bg-[#E8F8F5] border border-[#BDE8D2] text-center">
          <span className="text-3xl font-black text-[#1E7E50]">{report.logicCompleteness}%</span>
          <p className="text-[11px] font-bold text-slate-500 uppercase mt-1">Chuỗi Logic Mạch Lạc</p>
        </div>
      </div>

      {/* Mastery Level Badge */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
        <span className="text-slate-500 font-medium">Đánh giá chung:</span>
        <span className="font-extrabold px-3 py-1 rounded-full text-white" style={{ backgroundColor: mastery.color }}>
          {mastery.level}
        </span>
      </div>

      {/* Best Analogy Quote */}
      {report.bestAnalogy && (
        <div className="p-4 rounded-2xl bg-[#FEF9E7] border border-[#FDECD2] space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#E68A00]">
            <Quote className="w-3.5 h-3.5" />
            <span>Ẩn dụ xuất sắc nhất:</span>
          </div>
          <p className="text-xs text-slate-700 italic leading-relaxed">
            "{report.bestAnalogy}"
          </p>
        </div>
      )}

      {/* Knowledge Gaps */}
      {gaps.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <AlertTriangle className="w-3.5 h-3.5 text-[#F79D9D]" />
            <span>Lỗ hổng kiến thức cần ôn lại:</span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-600 pl-4 list-disc">
            {gaps.map((gap: string, idx: number) => (
              <li key={idx} className="leading-relaxed">{gap}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary Feedback */}
      <p className="text-xs text-slate-500 pt-3 border-t border-slate-100 leading-relaxed italic">
        "{report.summaryFeedback}"
      </p>
    </div>
  );
};

