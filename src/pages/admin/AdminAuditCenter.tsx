/**
 * File: src/pages/admin/AdminAuditCenter.tsx
 * Mục đích: Trung Tâm Kiểm Duyệt Báo Cáo Phản Biện (Admin Audit Center) thiết kế dạng Master-Detail công thái học:
 *   - Danh sách khiếu nại bên trái (Master List), Bàn làm việc & So sánh đối chiếu bên phải (Inspection Desk).
 *   - Xử lý chấp thuận / bác bỏ tức thời 1-click không cần cuộn trang lên xuống.
 */

import React, { useState } from "react";
import { toast } from "sonner";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Filter,
  Check,
  ChevronRight,
  Send,
  Zap,
} from "lucide-react";
import { AuditReportItem } from "@/types/auth.types";

const INITIAL_AUDITS: AuditReportItem[] = [
  {
    id: "rep-001",
    sessionId: "sess-8812",
    topicTitle: "Phép Tích Chập 2D & Mạng CNN",
    studentName: "Nguyễn Giảng Viên (learn123)",
    studentExplanationSnippet:
      "Tích chập giống như việc cầm một chiếc kính lúp nhỏ 3x3 có in hoa văn mờ, rê từ từ khắp bức ảnh để tìm xem chỗ nào có chi tiết trùng khớp.",
    aiFeedbackSnippet:
      "Bắt bẻ: Bạn chưa định nghĩa phép nhân từng phần tử tương ứng rồi cộng dồn Hadamard product.",
    studentComplaint:
      "Kỹ thuật Feynman yêu cầu giải thích cho người không chuyên hiểu trực giác trước, AI đòi hỏi dùng công thức toán hàn lâm là đi ngược lại tinh thần đơn giản hóa!",
    status: "PENDING",
    createdAt: "10 phút trước",
  },
  {
    id: "rep-002",
    sessionId: "sess-8740",
    topicTitle: "Quản Lý Bộ Nhớ C/C++ & Con Trỏ",
    studentName: "Trần Minh Đạt (student_dat)",
    studentExplanationSnippet:
      "Con trỏ là mảnh giấy ghi số phòng khách sạn, còn biến thông thường là căn phòng chứa đồ.",
    aiFeedbackSnippet:
      "Bắt bẻ: Lỗi thuật ngữ Jargon - Bạn đã dùng từ 'Memory Leak' mà không giải thích.",
    studentComplaint:
      "Tôi đã giải thích Memory leak là hành vi bỏ quên chìa khóa phòng khách sạn rồi mới trả phòng!",
    status: "PENDING",
    createdAt: "1 giờ trước",
  },
  {
    id: "rep-003",
    sessionId: "sess-8650",
    topicTitle: "Thuật Toán Dijkstra",
    studentName: "Lê Hoàng Phúc (phuc_ai)",
    studentExplanationSnippet:
      "Dijkstra như vết dầu loang trên bản đồ, giọt dầu chảy tới đâu trước thì con đường tới đó ngắn nhất.",
    aiFeedbackSnippet:
      "Đánh giá chuẩn xác: Ẩn dụ xuất sắc đạt 95% độ thấu suốt.",
    studentComplaint:
      "Đề xuất đưa phép ẩn dụ này vào danh mục Ẩn dụ mồi chuẩn (Starter Analogies) cho toàn bộ học viên.",
    status: "RESOLVED",
    adminNotes: "Đã phê duyệt và nạp vào bộ dữ liệu mồi chuẩn của môn Toán rời rạc.",
    createdAt: "Hôm qua",
  },
];

export const AdminAuditCenter: React.FC = () => {
  const [reports, setReports] = useState<AuditReportItem[]>(INITIAL_AUDITS);
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "RESOLVED">("PENDING");
  const [selectedReportId, setSelectedReportId] = useState<string>(
    INITIAL_AUDITS[0].id
  );

  const pendingCount = reports.filter((r) => r.status === "PENDING").length;

  const filteredReports = reports.filter((r) => {
    if (activeTab === "ALL") return true;
    return r.status === activeTab;
  });

  const selectedReport =
    reports.find((r) => r.id === selectedReportId) || filteredReports[0] || reports[0];

  const handleResolve = (id: string, decision: "RESOLVED" | "REJECTED") => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: decision,
              adminNotes:
                decision === "RESOLVED"
                  ? "Chấp thuận khiếu nại: Đã khôi phục +15 điểm Clarity cho học viên."
                  : "Bác bỏ: Lập luận chưa đủ cơ sở phản biện AI.",
            }
          : r
      )
    );

    if (decision === "RESOLVED") {
      toast.success(`Đã chấp thuận khiếu nại #${id}!`, {
        description: "Học viên được cộng bù +15 điểm Clarity và lưu vào hồ sơ.",
      });
    } else {
      toast.info(`Đã bác bỏ khiếu nại #${id}`, {
        description: "Giữ nguyên kết quả chấm điểm của AI.",
      });
    }

    // Tự động chuyển sang khiếu nại chờ xử lý tiếp theo nếu còn
    const remainingPending = reports.filter(
      (r) => r.id !== id && r.status === "PENDING"
    );
    if (remainingPending.length > 0) {
      setSelectedReportId(remainingPending[0].id);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* 1. Compact Header Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
                Kiểm Duyệt Phản Biện & Khiếu Nại (Audit Desk)
              </h1>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 animate-pulse">
                  {pendingCount} chờ xử lý
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Đối chiếu giải thích của học viên với phản hồi của AI để can thiệp bù điểm công bằng.
            </p>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("PENDING")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "PENDING"
                ? "bg-white text-purple-700 shadow-xs"
                : "hover:text-slate-900"
            }`}
          >
            <span>Chờ Xử Lý</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-700 font-black">
              {reports.filter((r) => r.status === "PENDING").length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("RESOLVED")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "RESOLVED"
                ? "bg-white text-purple-700 shadow-xs"
                : "hover:text-slate-900"
            }`}
          >
            Đã Xong ({reports.filter((r) => r.status === "RESOLVED").length})
          </button>
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "ALL"
                ? "bg-white text-purple-700 shadow-xs"
                : "hover:text-slate-900"
            }`}
          >
            Tất Cả ({reports.length})
          </button>
        </div>
      </div>

      {/* 3. Master-Detail 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Ticket Inbox List (4 cols) */}
        <div className="lg:col-span-4 space-y-2 max-h-[620px] overflow-y-auto pr-1 scrollbar-thin">
          {filteredReports.length > 0 ? (
            filteredReports.map((report) => {
              const isSelected = selectedReport?.id === report.id;
              const isPending = report.status === "PENDING";

              return (
                <div
                  key={report.id}
                  onClick={() => setSelectedReportId(report.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? "bg-purple-50/90 border-[#7286D3] ring-2 ring-[#7286D3]/20 shadow-xs"
                      : "bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 truncate max-w-[170px]">
                      {report.topicTitle}
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isPending
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {isPending ? "Chờ duyệt" : "Đã xong"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
                    <span className="truncate">{report.studentName}</span>
                    <span className="text-[10px] font-normal text-slate-400">
                      {report.createdAt}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {report.studentComplaint}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 text-xs text-slate-400 font-bold">
              Không có khiếu nại nào trong mục này.
            </div>
          )}
        </div>

        {/* Right Column: Inspection & Fast Decision Desk (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4 min-h-[500px]">
          {selectedReport ? (
            <>
              <div className="space-y-4">
                {/* Header Ticket Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">
                      Phiếu Khiếu Nại #{selectedReport.id}
                    </span>
                    <h2 className="text-base sm:text-lg font-black text-slate-800">
                      {selectedReport.topicTitle}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <User className="w-3.5 h-3.5 text-purple-600" />
                      {selectedReport.studentName}
                    </span>
                    <span>•</span>
                    <span>{selectedReport.createdAt}</span>
                  </div>
                </div>

                {/* 3 Comparative Panels (Side-by-side on tablet/desktop) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {/* Panel 1: Học viên giải thích */}
                  <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 block">
                      1. Học viên giải thích
                    </span>
                    <p className="text-slate-800 italic leading-relaxed text-[11px]">
                      "{selectedReport.studentExplanationSnippet}"
                    </p>
                  </div>

                  {/* Panel 2: AI bắt bẻ */}
                  <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 block">
                      2. Khán giả AI bắt bẻ
                    </span>
                    <p className="text-slate-800 leading-relaxed text-[11px]">
                      {selectedReport.aiFeedbackSnippet}
                    </p>
                  </div>

                  {/* Panel 3: Khiếu nại từ học viên */}
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">
                      3. Ý kiến học viên
                    </span>
                    <p className="text-slate-800 leading-relaxed text-[11px]">
                      {selectedReport.studentComplaint}
                    </p>
                  </div>
                </div>

                {/* Admin Notes if resolved */}
                {selectedReport.adminNotes && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>Quyết định của Admin:</strong> {selectedReport.adminNotes}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Bar (1-Click Decision) */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs text-slate-400">
                  {selectedReport.status === "PENDING"
                    ? "Nhấp vào 1 trong 2 quyết định bên phải để hoàn tất hồ sơ."
                    : "Hồ sơ khiếu nại này đã được đóng."}
                </span>

                {selectedReport.status === "PENDING" ? (
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleResolve(selectedReport.id, "REJECTED")}
                      className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Bác Bỏ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleResolve(selectedReport.id, "RESOLVED")}
                      className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Chấp Thuận (+15 Điểm)</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl">
                    ✓ Đã giải quyết xong
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400 font-bold">
              Chọn một khiếu nại ở danh sách bên trái để kiểm duyệt.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAuditCenter;
