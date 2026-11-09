/**
 * File: src/pages/LandingAndDemo.tsx
 * Mục đích: [Trang 1] Landing & Demo - Giới thiệu Phương pháp Feynman và phòng thử nghiệm nhanh (Interactive Mini-Demo).
 * Thành phần chính:
 *   - LandingAndDemo: Giới thiệu 4 bước Feynman, demo thử nghiệm giảng giải trực tiếp không cần đăng nhập.
 * Props/Inputs: Không có.
 */

import React from "react";
import { Link } from "react-router-dom";
import { EliseCatMascot } from "@/components/shared/EliseCatMascot";
import { FeynmanLiveTrialModule } from "@/components/landing/FeynmanLiveTrialModule";
import { ArrowRight, Sparkles } from "lucide-react";

export const LandingAndDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F3F6FA] text-slate-800">
      {/* Top Navbar */}
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#7286D3] via-[#8EA7E9] to-[#FFB4B4] p-1 flex items-center justify-center shadow-xs">
            <EliseCatMascot className="w-full h-full" />
          </div>
          <span className="font-black text-xl tracking-tight text-slate-800">Elis</span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/about"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Về Elis
          </Link>
          <Link
            to="/auth"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Đăng Nhập
          </Link>
          <Link
            to="/stage/new"
            className="px-5 py-2.5 rounded-2xl bg-[#7286D3] hover:bg-[#5066A1] text-white text-xs font-bold transition-all shadow-xs"
          >
            Vào Phòng Giảng Ngay
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-6 pt-12 pb-14 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EEF2FC] text-[#5066A1] text-xs font-bold border border-[#D5E1FA]">
          <Sparkles className="w-4 h-4 text-[#7286D3]" />
          <span>Kỹ Thuật Học Sâu Feynman Thế Hệ Mới</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Cách tốt nhất để hiểu sâu một điều gì đó <br />
          <span className="bg-gradient-to-r from-[#7286D3] via-[#8EA7E9] to-[#F79D9D] bg-clip-text text-transparent">
            là giảng giải cho một đứa trẻ 10 tuổi
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Theodore đóng vai người nghe tò mò chưa biết gì. AI sẽ liên tục hỏi vặn để bóc trần những thuật ngữ bạn chưa hiểu thấu đáo và phát hiện các lỗ hổng logic.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            to="/dashboard"
            className="px-6 py-3 rounded-2xl bg-[#7286D3] hover:bg-[#5066A1] text-white text-sm font-bold flex items-center gap-2 shadow-card transition-all cursor-pointer"
          >
            <span>Trải Nghiệm Toàn Diện</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#feynman-live-trial"
            className="px-6 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold border border-slate-200/80 shadow-xs transition-all"
          >
            Thử Giảng Live Cho Bé Bắp Dưới Đây
          </a>
        </div>
      </section>

      {/* Live 1:1 Feynman Interactive Playground */}
      <FeynmanLiveTrialModule />
    </div>
  );
};

export default LandingAndDemo;

