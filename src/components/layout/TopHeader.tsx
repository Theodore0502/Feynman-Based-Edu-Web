/**
 * File: src/components/layout/TopHeader.tsx
 * Mục đích: Thanh tiêu đề trên cùng (Floating Breadcrumb Topbar) thiết kế theo phong cách hiện đại 1 dòng:
 *   - Logo linh vật Mèo Elise (EliseCatMascot) + Tên thương hiệu "Elise".
 *   - Chuỗi Breadcrumb phân cấp theo ngữ cảnh trang hiện tại kèm Badge phiên bản/chuỗi ngày.
 *   - Bộ tiện ích nhanh: Thử thách 60 giây, Chuông thông báo, Avatar người dùng thu gọn & Đổi vai.
 */

import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useModalStore } from "@/hooks/useModalStore";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useGamificationStore } from "@/hooks/useGamificationStore";
import { EliseCatMascot } from "@/components/shared/EliseCatMascot";
import { NotificationBell } from "@/components/layout/NotificationBell";
import {
  getDomainBySlug,
  getSubjectBySlug,
} from "@/data/three-tier-curriculum.data";
import {
  Zap,
  Flame,
  GraduationCap,
  ShieldCheck,
  LogOut,
  ChevronRight,
  User,
  Sliders,
  Check,
} from "lucide-react";

interface TopHeaderProps {
  title?: string;
  subtitle?: string;
}

export const TopHeader: React.FC<TopHeaderProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  const { openModal } = useModalStore();
  const { user, switchRole, logout } = useAuthStore();
  const { streakCount, currentLevel } = useGamificationStore();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  // Tạo chuỗi Breadcrumbs động theo URL
  const getBreadcrumbs = () => {
    const parts: { label: string; href?: string; active?: boolean }[] = [];

    if (pathname === "/dashboard" || pathname === "/") {
      parts.push({ label: "Không Gian", href: "/dashboard" });
      parts.push({ label: "Tổng Quan", active: true });
    } else if (pathname.startsWith("/lectures")) {
      const segments = pathname.split("/").filter(Boolean);
      // Cấp 1 (Nhóm ngành): Kho Bài Giảng
      if (segments.length === 1) {
        parts.push({ label: "Kho Bài Giảng", active: true });
      } else if (segments.length === 2) {
        // Cấp 2 (Môn học): Kho Bài Giảng > [Tên Nhóm Ngành]
        const domain = getDomainBySlug(segments[1]);
        parts.push({ label: "Kho Bài Giảng", href: "/lectures" });
        parts.push({
          label: domain ? domain.name : "Nhóm Ngành",
          active: true,
        });
      } else if (segments.length >= 3) {
        // Cấp 3 (Bài giảng trong môn): Kho Bài Giảng > [Tên Nhóm Ngành] > [Tên Môn Học]
        const domain = getDomainBySlug(segments[1]);
        const subject = getSubjectBySlug(segments[2]);
        parts.push({ label: "Kho Bài Giảng", href: "/lectures" });
        parts.push({
          label: domain ? domain.name : "Nhóm Ngành",
          href: `/lectures/${segments[1]}`,
        });
        parts.push({
          label: subject ? subject.name : "Môn Học",
          active: true,
        });
      }
    } else if (pathname.startsWith("/stage")) {
      const searchParams = new URLSearchParams(location.search);
      const domainSlug = searchParams.get("domain");
      const subjectSlug = searchParams.get("subject");

      if (domainSlug && subjectSlug) {
        const domain = getDomainBySlug(domainSlug);
        const subject = getSubjectBySlug(subjectSlug);
        parts.push({ label: "Kho Bài Giảng", href: "/lectures" });
        parts.push({
          label: domain ? domain.name : "Nhóm Ngành",
          href: `/lectures/${domainSlug}`,
        });
        parts.push({
          label: subject ? subject.name : "Môn Học",
          href: `/lectures/${domainSlug}/${subjectSlug}`,
        });
        if (pathname.includes("/report")) {
          parts.push({ label: "Báo Cáo Feynman", active: true });
        } else {
          parts.push({ label: "Bục Giảng", active: true });
        }
      } else {
        parts.push({ label: "Luyện Tập", href: "/stage/new" });
        if (pathname.includes("/report")) {
          parts.push({ label: "Báo Cáo Feynman", active: true });
        } else {
          parts.push({ label: "Bục Giảng Live", active: true });
        }
      }
    } else if (pathname === "/personas") {
      parts.push({ label: "Khán Giả", href: "/personas" });
      parts.push({ label: "Thư Viện AI", active: true });
    } else if (pathname === "/topics") {
      parts.push({ label: "Tri Thức", href: "/topics" });
      parts.push({ label: "Bản Đồ Kiến Thức", active: true });
    } else if (pathname === "/vault") {
      parts.push({ label: "Ghi Nhớ", href: "/vault" });
      parts.push({ label: "Sổ Tay Thuật Ngữ", active: true });
    } else if (pathname === "/about") {
      parts.push({ label: "Giới Thiệu", href: "/about" });
      parts.push({ label: "Triết Lý Elise", active: true });
    } else if (pathname === "/settings") {
      parts.push({ label: "Hệ Thống", href: "/settings" });
      parts.push({ label: "Cài Đặt", active: true });
    } else if (pathname.startsWith("/admin")) {
      parts.push({ label: "Quản Trị", href: "/admin/rubrics" });
      if (pathname.includes("rubrics")) parts.push({ label: "Tiêu Chí Rubric", active: true });
      else if (pathname.includes("audits")) parts.push({ label: "Kiểm Duyệt", active: true });
      else if (pathname.includes("curriculum")) parts.push({ label: "Kho Tri Thức", active: true });
      else if (pathname.includes("ai-config")) parts.push({ label: "Cài Đặt AI", active: true });
    } else {
      parts.push({ label: "Không Gian", href: "/dashboard" });
      parts.push({ label: "Chi Tiết", active: true });
    }

    return parts;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="relative z-40 bg-white/95 backdrop-blur-md rounded-2xl border border-[#E8EEF8] shadow-xs px-3.5 sm:px-4 py-2 flex items-center justify-between gap-3 mb-6 transition-all">
      {/* 1. Left: Mascot Brand + Single-line Breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Linh vật Mèo Elise */}
        <Link
          to="/about"
          className="flex items-center gap-2 group shrink-0"
          title="Linh vật Mèo Elise - Khám phá triết lý học tập"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#7286D3] via-[#8EA7E9] to-[#FFB4B4] p-0.5 flex items-center justify-center shadow-2xs transition-transform group-hover:scale-105">
            <EliseCatMascot className="w-full h-full" />
          </div>
          <span className="font-black text-sm text-slate-800 tracking-tight hidden xs:inline">
            Elise
          </span>
        </Link>

        {/* Separator Slash */}
        <span className="text-slate-300 font-light select-none">|</span>

        {/* Breadcrumb Path (Single-line Dynamic Breadcrumbs) */}
        <nav className="flex items-center gap-1.5 text-xs font-semibold overflow-x-auto scrollbar-none whitespace-nowrap">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              )}
              {crumb.active ? (
                <span
                  title={crumb.label}
                  className="font-extrabold text-[#5066A1] bg-[#EEF2FC] px-2.5 py-0.5 rounded-lg max-w-[160px] sm:max-w-xs md:max-w-md truncate inline-block align-middle"
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.href || "#"}
                  title={crumb.label}
                  className="text-slate-400 hover:text-[#5066A1] transition-colors max-w-[120px] sm:max-w-[180px] truncate inline-block align-middle"
                >
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* 2. Right: Quick Actions + Avatar Menu */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Nút Thử thách 60 giây (Quick Drill) */}
        <button
          onClick={() => openModal("QUICK_DRILL")}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#FFF9EE] border border-[#FDECD2] text-xs font-bold text-[#E68A00] hover:bg-[#FDF3D5] transition-all cursor-pointer shadow-2xs"
          title="Thử thách ôn tập nhanh 60 giây (SM-2)"
        >
          <Zap className="w-3.5 h-3.5 fill-[#E68A00]" />
          <span className="hidden md:inline">Thử Thách</span>
        </button>

        {/* Huy hiệu ngọn lửa Streak */}
        <div
          className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-700 shadow-2xs"
          title={`Chuỗi rèn luyện liên tục: ${streakCount} ngày`}
        >
          <Flame className="w-3.5 h-3.5 text-[#FFA929] fill-[#FFA929]" />
          <span>{streakCount}d</span>
        </div>

        {/* Chuông Thông Báo (Tầng 2 - Notification Center) */}
        <NotificationBell />

        {/* Avatar Người Dùng & Dropdown Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-1.5 p-0.5 rounded-full ring-2 ring-[#7286D3]/20 hover:ring-[#7286D3]/50 transition-all cursor-pointer"
            title={`${user?.fullName} (${isAdmin ? "Quản Trị Viên" : "Người Giảng"})`}
          >
            <img
              src={
                user?.avatarUrl ||
                (isAdmin
                  ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                  : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80")
              }
              alt="Avatar"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover"
            />
          </button>

          {/* User Popup Dropdown */}
          {showUserMenu && (
            <>
              {/* Invisible Backdrop để click ra ngoài là tự động đóng popup */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl p-3 border border-[#E2EAFD] shadow-2xl z-50 animate-in fade-in space-y-2">
                <div className="p-2 border-b border-slate-100">
                  <span className="block text-xs font-extrabold text-slate-800 truncate">
                    {user?.fullName}
                  </span>
                  <span className="block text-[11px] text-slate-400 truncate">
                    @{user?.username} • Cấp {currentLevel}
                  </span>
                  <span
                    className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      isAdmin
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {isAdmin ? "🛡️ Quản Trị Viên (Admin)" : "🎓 Người Giảng (Learner)"}
                  </span>
                </div>

                {/* Quick Role Switcher */}
                <button
                  onClick={() => {
                    switchRole(isAdmin ? "learner" : "admin");
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-[#EEF2FC] hover:text-[#5066A1] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-[#7286D3]" />
                    <span>Đổi sang {isAdmin ? "Người Giảng" : "Quản Trị"}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">1-click</span>
                </button>

                {/* Logout */}
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đăng xuất tài khoản</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
