/**
 * File: src/pages/CommandDashboard.tsx
 * Mục đích: [Trang 3] Command Dashboard - Trung tâm điều hành học tập, thống kê điểm Clarity trung bình, chuỗi ngày học và danh sách các phiên giảng gần nhất kết nối trực tiếp với Supabase.
 * Thành phần chính:
 *   - CommandDashboard: Chỉ số tổng quan, ClarityMeter, danh sách phiên học và thẻ Feynman Mastery Card xem nhanh.
 * Props/Inputs: Không có.
 */

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ClarityMeter } from "@/components/shared/ClarityMeter";
import { MasteryCardPreview } from "@/components/shared/MasteryCardPreview";
import { useModalStore } from "@/hooks/useModalStore";
import { useGamificationStore } from "@/hooks/useGamificationStore";
import { useNotificationStore } from "@/hooks/useNotificationStore";
import { getPersonaById } from "@/config/personas.config";
import { SupabaseService } from "@/lib/services/supabase-service";
import type { FeynmanSession, VaultRecord } from "@/types/session.types";
import { 
  Mic, 
  Sparkles, 
  Flame, 
  BookOpen, 
  ArrowUpRight, 
  ChevronRight,
  Database,
  Trash2
} from "lucide-react";

export const CommandDashboard: React.FC = () => {
  const { openModal } = useModalStore();
  const { streakCount, currentLevel, levelTitle, totalXp } = useGamificationStore();
  const [sessions, setSessions] = useState<FeynmanSession[]>([]);
  const [vaultItems, setVaultItems] = useState<VaultRecord[]>([]);

  useEffect(() => {
    // Tải dữ liệu từ Supabase Cloud
    async function loadData() {
      const [fetchedSessions, fetchedVault] = await Promise.all([
        SupabaseService.getSessions(10),
        SupabaseService.getVaultItems(),
      ]);
      setSessions(fetchedSessions);
      setVaultItems(fetchedVault);

      // Kiểm tra và đẩy thông báo tự động (Scheduled/On-load Notification)
      // 1. Thẻ đến hạn ôn tập SM-2
      const now = new Date();
      const dueCards = (fetchedVault || []).filter(
        (v) => v.nextReviewAt && new Date(v.nextReviewAt) <= now
      );
      if (dueCards.length > 0) {
        useNotificationStore.getState().checkSRSDueNotifications(dueCards.length);
      }
    }
    loadData();
  }, []);

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Bạn có chắc chắn muốn xóa bản ghi phiên học này không?")) {
      await SupabaseService.deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const sampleReport = {
    id: "rep-sample",
    sessionId: "ses-sample",
    clarityScore: 84,
    logicCompleteness: 88,
    bestAnalogy: "Docker giống như căn hộ chung cư xây sẵn, còn máy ảo giống mua cả khu đất tự xây móng.",
    knowledgeGaps: ["Cơ chế cách ly Namespace", "Cgroup kiểm soát tài nguyên"],
    summaryFeedback: "Giải thích rất hóm hỉnh và bình dân hóa chuẩn xác. Đã vượt qua kiểm tra của Bé Bo!",
    createdAt: new Date().toISOString(),
  };

  return (
    <div className="space-y-6">
      {/* Hero Welcome Action Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#F0F4FC] via-[#F6F3FC] to-[#FCF4F7] border border-[#E2EAFD] rounded-3xl p-4 sm:p-6 shadow-xs">
        {/* Dreamy Hero Background Image (mờ nhẹ nhàng) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <img
            src="/images/hero-banner-bg.png"
            alt="Hero background"
            className="w-full h-full object-cover object-center opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/50 via-white/30 to-white/50 backdrop-blur-[0.5px]" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          {/* Lớp blur trắng ở dưới các chữ để nhìn rõ chữ 100% */}
          <div className="max-w-xl space-y-3 p-5 sm:p-6 rounded-3xl bg-white/75 backdrop-blur-md border border-white/80 shadow-xs">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5ECFB]/90 text-[#5066A1] text-xs font-bold border border-[#D3E0FA]">
              <Database className="w-3.5 h-3.5 text-[#7286D3]" />
              <span>Đã Đồng Bộ Supabase Cloud</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
              Hôm nay bạn muốn làm chủ khái niệm nào?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Hãy chọn một chủ đề kỹ thuật hoặc trừu tượng và bắt đầu giảng giải cho AI. Hệ thống sẽ bóc tách các lỗ hổng kiến thức của bạn theo thời gian thực.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                to="/lectures"
                className="px-5 py-2.5 rounded-2xl bg-white/95 hover:bg-white text-[#5066A1] text-xs font-bold border border-[#E8EEF8] flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Khám Phá Bài Giảng</span>
              </Link>
              <Link
                to="/stage"
                className="px-5 py-2.5 rounded-2xl bg-[#7286D3] hover:bg-[#5066A1] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Mic className="w-4 h-4" />
                <span>Bắt Đầu Giảng Bài</span>
              </Link>
              <button
                onClick={() => openModal("QUICK_DRILL")}
                className="px-5 py-2.5 rounded-2xl bg-white/95 hover:bg-white text-slate-700 text-xs font-semibold border border-slate-200/80 shadow-xs transition-all cursor-pointer"
              >
                Thử Thách 60 Giây
              </button>
            </div>
          </div>

          {/* Right Section: Linh vật nổi bay cạnh thanh tiến độ */}
          <div className="flex items-center justify-center md:justify-end gap-3 sm:gap-6 self-center md:self-auto shrink-0 relative">
            {/* Mascot Linh Vật Cú Theodore bay nổi sinh động */}
            <div className="relative group transition-transform duration-300 hover:scale-105 shrink-0">
              <img
                src="/images/theodore-mascot.png"
                alt="Linh vật Theodore"
                className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 lg:w-44 lg:h-44 object-contain filter drop-shadow-[0_12px_24px_rgba(114,134,211,0.28)] animate-float select-none pointer-events-none"
              />
            </div>

            {/* Quick Clarity Gauge (Lớp blur trắng) */}
            <div className="shrink-0 bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-white/80 shadow-xs flex flex-col items-center">
              <ClarityMeter score={82} variant="circle" />
              <span className="text-[11px] text-slate-500 font-semibold mt-2">Độ Thấu Suốt Tuần Này</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 3 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-[#E8EEF8] shadow-subtle flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#EEF2FC] text-[#5066A1] flex items-center justify-center shrink-0">
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-800">{sessions.length}</span>
            <p className="text-xs text-slate-500 font-semibold">Phiên Đã Giảng</p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#E8EEF8] shadow-subtle flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF8EE] text-[#E68A00] flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 fill-[#FFA929] text-[#FFA929]" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-800">{streakCount} Ngày</span>
            <p className="text-xs text-slate-500 font-semibold">Chuỗi Rèn Luyện (Cấp {currentLevel}: {levelTitle})</p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#E8EEF8] shadow-subtle flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#E8F8F5] text-[#1E7E50] flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-800">{vaultItems.length}</span>
            <p className="text-xs text-slate-500 font-semibold">Thuật Ngữ Trong Sổ Tay</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Recent Sessions Table + Sample Feynman Mastery Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Sessions (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-[#E8EEF8] shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">Các Phiên Giảng Gần Đây</h3>
              <p className="text-xs text-slate-500">Lịch sử rèn luyện phản xạ bình dân hóa lưu trữ trên đám mây</p>
            </div>
            <Link
              to="/stage/new"
              className="text-xs font-bold text-[#7286D3] hover:text-[#5066A1] flex items-center gap-1"
            >
              <span>Giảng bài mới</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3">Chủ đề</th>
                  <th className="py-3 px-3">Khán giả AI</th>
                  <th className="py-3 px-3">Độ thấu suốt</th>
                  <th className="py-3 px-3">Trạng thái</th>
                  <th className="py-3 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Chưa có phiên học nào. Bấm <span className="font-bold text-[#7286D3]">Giảng bài mới</span> để bắt đầu phiên học đầu tiên!
                    </td>
                  </tr>
                ) : (
                  sessions.map((ses) => {
                    const persona = getPersonaById(ses.personaId);
                    return (
                      <tr key={ses.id} className="hover:bg-[#F8FAFD] transition-colors group">
                        <td className="py-3 px-3 font-bold text-slate-800">{ses.topic}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <img src={persona.avatar} alt="P" className="w-6 h-6 rounded-full object-cover" />
                            <span className="font-semibold text-slate-700">{persona.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-bold text-[#5066A1]">
                          {ses.clarityScore > 0 ? `${ses.clarityScore}%` : "Chưa chấm"}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            ses.status === "COMPLETED"
                              ? "bg-[#E8F8F0] text-[#1E7E50]"
                              : "bg-[#EEF2FC] text-[#5066A1]"
                          }`}>
                            {ses.status === "COMPLETED" ? "Đã xong" : "Đang học"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center gap-2 justify-end">
                            <Link
                              to={ses.status === "COMPLETED" ? `/stage/${ses.id}/report?topic=${encodeURIComponent(ses.topic)}` : `/stage/${ses.id}?topic=${encodeURIComponent(ses.topic)}&persona=${ses.personaId}`}
                              className="inline-flex items-center gap-1 font-bold text-[#7286D3] hover:underline"
                            >
                              <span>{ses.status === "COMPLETED" ? "Xem báo cáo" : "Vào giảng bài"}</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteSession(e, ses.id)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all cursor-pointer"
                              title="Xóa phiên học này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Featured Feynman Mastery Card Preview */}
        <div className="space-y-4">
          <MasteryCardPreview
            topic="Cơ chế Docker Container"
            report={sampleReport}
            onShare={() => openModal("SHARE_MASTERY", { topic: "Docker Container", score: 84 })}
          />
        </div>
      </div>
    </div>
  );
};

export default CommandDashboard;
