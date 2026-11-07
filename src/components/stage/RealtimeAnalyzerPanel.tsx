/**
 * File: src/components/stage/RealtimeAnalyzerPanel.tsx
 * Mục đích: Panel bên phải của phòng học Live (Trang 5) hiển thị kết quả phân tích ngầm theo thời gian thực (Clarity Meter, Jargons, Logic Gaps, Ẩn dụ).
 * Thành phần chính:
 *   - RealtimeAnalyzerPanel: Đồng hồ đo độ rõ ràng, danh sách cảnh báo và nút gọi gợi ý ẩn dụ / chốt buổi học.
 * Props/Inputs:
 *   - analysis: AnalyticalResult | null - Kết quả phân tích của lượt nói gần nhất.
 *   - topic: string - Tên chủ đề bài giảng.
 *   - personaId: string - ID của Persona.
 *   - onFinishSession: () => void - Callback khi chốt kết thúc buổi học.
 */

import React from "react";
import type { AnalyticalResult } from "@/types/agent.types";
import { ClarityMeter } from "@/components/shared/ClarityMeter";
import { JargonBadge } from "@/components/shared/JargonBadge";
import { useModalStore } from "@/hooks/useModalStore";
import { Lightbulb, Award, AlertCircle, CheckCircle2 } from "lucide-react";

interface RealtimeAnalyzerPanelProps {
  analysis: AnalyticalResult | null;
  topic: string;
  personaId: string;
  onFinishSession: () => void;
}

export const RealtimeAnalyzerPanel: React.FC<RealtimeAnalyzerPanelProps> = ({
  analysis,
  topic,
  personaId,
  onFinishSession,
}) => {
  const { openModal } = useModalStore();
  const clarity = analysis?.currentClarityScore ?? 65;
  const jargons = analysis?.jargonDetected ?? [];
  const logicGaps = analysis?.logicGaps ?? [];

  return (
    <div className="w-full lg:w-80 bg-white rounded-3xl p-5 border border-[#E8EEF8] shadow-subtle space-y-5 flex flex-col justify-between shrink-0">
      <div className="space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <h4 className="font-extrabold text-sm text-slate-800">Bộ Phân Tích Feynman</h4>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF0FC] text-[#5066A1]">
            Phân Tích Trực Tiếp
          </span>
        </div>

        {/* Clarity Meter Vòng Tròn / Thanh */}
        <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#E2EAFD]">
          <ClarityMeter score={clarity} variant="bar" />
        </div>

        {/* Danh sách thuật ngữ Jargon */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">Thuật Ngữ (Jargons):</span>
            <span className="text-[10px] text-slate-400">{jargons.length} từ</span>
          </div>
          {jargons.length === 0 ? (
            <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
              Chưa phát hiện thuật ngữ nặng nề. Rất tốt!
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {jargons.map((j, idx) => (
                <JargonBadge
                  key={idx}
                  term={j.term}
                  isExplained={j.isExplainedSimply}
                  reason={j.reason}
                  onClick={() => openModal("JARGON_INSPECTOR", { jargons })}
                />
              ))}
            </div>
          )}
        </div>

        {/* Lỗ hổng logic */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">Bước Nhảy Logic:</span>
            <span className="text-[10px] text-slate-400">{logicGaps.length} điểm</span>
          </div>
          {logicGaps.length === 0 ? (
            <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
              Chuỗi suy luận mạch lạc, chưa có bước nhảy cóc.
            </p>
          ) : (
            <div className="space-y-1.5">
              {logicGaps.slice(0, 2).map((gap, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-[#FFF9F9] border border-[#FFDADA] text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-[#D9534F]">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{gap.missingLink || "Thiếu cơ chế giải thích"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trạng thái sẵn sàng kết thúc */}
        {analysis?.isReadyToComplete && (
          <div className="p-3 rounded-2xl bg-[#E8F8F0] border border-[#BDE8D2] flex items-center gap-2 text-xs text-[#1E7E50] font-bold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Bạn đã giải thích đủ ý cốt lõi! Có thể chốt phiên bất kỳ lúc nào.</span>
          </div>
        )}
      </div>

      {/* Action Buttons: Gợi ý ẩn dụ & Chốt bài giảng */}
      <div className="space-y-2 pt-4 border-t border-slate-100">
        <button
          onClick={() => openModal("ANALOGY_HINT", { topic, personaId })}
          className="w-full py-2.5 rounded-2xl bg-[#FEF9E7] hover:bg-[#FDF3D5] text-[#E68A00] font-bold text-xs flex items-center justify-center gap-2 border border-[#FDECD2] transition-colors cursor-pointer shadow-xs"
        >
          <Lightbulb className="w-4 h-4" />
          <span>Gợi Ý Ẩn Dụ Đời Thường</span>
        </button>

        <button
          onClick={() => openModal("END_STAGE_CONFIRM", { onConfirm: onFinishSession })}
          className="w-full py-2.5 rounded-2xl bg-[#7286D3] hover:bg-[#5066A1] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
        >
          <Award className="w-4 h-4" />
          <span>Kết Thúc & Nhận Thẻ Điểm</span>
        </button>
      </div>
    </div>
  );
};

