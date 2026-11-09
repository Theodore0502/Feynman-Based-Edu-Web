/**
 * File: src/pages/PublicMasteryShareView.tsx
 * Mục đích: [Plan 2.5] Cổng hiển thị thẻ chứng nhận Feynman Mastery Card công khai (Public Share Portal).
 * Không yêu cầu đăng nhập, cho phép người học chia sẻ thành tích và ẩn dụ đắt giá lên mạng xã hội hoặc in ấn.
 */

import React, { useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { ClarityMeter } from "@/components/shared/ClarityMeter";
import {
  Award,
  Sparkles,
  Share2,
  Copy,
  Check,
  Printer,
  ArrowRight,
  ShieldCheck,
  Quote,
  Layers,
  GraduationCap,
} from "lucide-react";

export const PublicMasteryShareView: React.FC = () => {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);

  const shareToken = params.shareToken || "sample-token";
  const topic = searchParams.get("topic") || "Cơ chế Docker Container & Namespace";
  const score = parseInt(searchParams.get("score") || "88");
  const student = searchParams.get("student") || "Học Viên Feynman";
  const analogy =
    searchParams.get("analogy") ||
    "Docker giống như một căn hộ chung cư xây sẵn đầy đủ tiện nghi, chỉ việc xách vali vào ở; còn máy ảo giống như bạn phải mua cả mảnh đất rồi tự đào móng xây nhà.";

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F8FE] via-white to-[#EEF2FC] py-10 px-4 flex flex-col items-center justify-center">
      {/* Container */}
      <div className="w-full max-w-2xl space-y-6">
        {/* Certificate Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-[#D5E1FA] shadow-2xl relative overflow-hidden space-y-6 print:shadow-none print:border print:m-0">
          {/* Top Decorative Header */}
          <div className="text-center space-y-2 border-b border-slate-100 pb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EEF2FC] text-[#5066A1] text-xs font-black tracking-wide border border-[#D5E1FA] uppercase">
              <ShieldCheck className="w-4 h-4 text-[#7286D3]" />
              <span>Chứng Nhận Năng Lực Feynman</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              FEYNMAN MASTERY CERTIFICATE
            </h1>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Chứng thực người học đã vượt qua quá trình phản biện khắt khe từ khán giả AI và gạt bỏ hoàn toàn thuật ngữ chuyên ngành.
            </p>
          </div>

          {/* Student & Topic Badge */}
          <div className="text-center space-y-1">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Chứng nhận cấp cho
            </span>
            <div className="text-lg font-black text-[#5066A1]">{student}</div>
            <div className="pt-2">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Đã làm chủ chủ đề
              </span>
              <h2 className="text-2xl font-black text-slate-800 mt-0.5">{topic}</h2>
            </div>
          </div>

          {/* Score & Gauge Section */}
          <div className="p-6 rounded-2xl bg-[#F8FAFD] border border-[#E2EAFD] flex flex-col sm:flex-row items-center justify-around gap-6">
            <div className="flex flex-col items-center">
              <ClarityMeter score={score} variant="circle" />
              <span className="text-xs font-bold text-slate-600 mt-2">Chỉ Số Thấu Suốt (Clarity)</span>
            </div>

            <div className="space-y-3 text-xs w-full sm:w-auto">
              <div className="flex items-center gap-2 text-slate-700">
                <Check className="w-4 h-4 text-emerald-500" />
                <span><b>Khán giả AI:</b> Thấu hiểu hoàn toàn nội dung</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Check className="w-4 h-4 text-emerald-500" />
                <span><b>Thuật ngữ Jargon:</b> Đã bình dân hóa 100%</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Check className="w-4 h-4 text-emerald-500" />
                <span><b>Lỗ hổng kiến thức:</b> Đã vá và giải thích trọn vẹn</span>
              </div>
            </div>
          </div>

          {/* Best Analogy Quote */}
          <div className="p-5 rounded-2xl bg-gradient-to-tr from-[#FFF9EE] to-[#FFFDF9] border border-[#FDECD2] space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-[#E68A00]">
              <Quote className="w-4 h-4" />
              <span>Ẩn Dụ Trực Quan Đắt Giá Nhất</span>
            </div>
            <p className="text-xs text-slate-700 italic leading-relaxed pl-2 border-l-2 border-[#FFA929]">
              "{analogy}"
            </p>
          </div>

          {/* Verification Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#7286D3]" />
              <span>Mã kiểm tra: <code className="font-mono text-slate-600 font-bold">{shareToken}</code></span>
            </div>
            <div className="flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
              <span>Feynman Technique Stage • Elis Academic Engine</span>
            </div>
          </div>
        </div>

        {/* Action Controls (Hidden in Print) */}
        <div className="flex flex-wrap items-center justify-center gap-3 print:hidden">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#7286D3] hover:bg-[#5066A1] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Đã Sao Chép Liên Kết" : "Sao Chép Thẻ Chia Sẻ"}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200/80 shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In Bản Chứng Nhận (PDF)</span>
          </button>

          <Link
            to="/stage/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <span>Tự Thử Thách Bục Giảng</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PublicMasteryShareView;

