/**
 * File: src/components/layout/AppSidebar.tsx
 * Mục đích: Thanh điều hướng bên trái dùng chung cho các màn hình Workspace.
 * Hỗ trợ phân quyền động theo 2 vai trò:
 *   - Learner: Thấy các công cụ học tập (Study Lab, Stage, Vault, Graph).
 *   - Admin: Hiển thị thêm nhóm công cụ Quản trị kiểm chuẩn (Rubric Studio, Audit Center, Curriculum).
 */

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LEARNER_NAVIGATION, ADMIN_NAVIGATION } from "@/config/routes.config";
import { useModalStore } from "@/hooks/useModalStore";
import { useAuthStore } from "@/hooks/useAuthStore";
import { EliseCatMascot } from "@/components/shared/EliseCatMascot";
import {
  LayoutDashboard,
  BookOpen,
  Mic,
  Users,
  Network,
  Archive,
  Settings,
  Sparkles,
  Volume2,
  HelpCircle,
  Sliders,
  ShieldAlert,
  FileText,
  ArrowLeft,
  GraduationCap,
  ShieldCheck,
  Bot,
  Bookmark,
  Info,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  BookOpen,
  Mic,
  Users,
  Bot,
  Network,
  Archive,
  Bookmark,
  Info,
  Settings,
  Sliders,
  ShieldAlert,
  FileText,
  ArrowLeft,
};

export const AppSidebar: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const { openModal } = useModalStore();
  const { user, switchRole } = useAuthStore();

  const isAdmin = user?.role === "admin";

  return (
    <aside className="w-64 bg-white/90 backdrop-blur-md border-r border-[#E8EEF8] flex flex-col justify-between p-6 shrink-0 h-screen sticky top-0 overflow-y-auto scrollbar-none z-30">
      {/* Brand Logo & Name */}
      <div>
        <Link to="/about" className="flex items-center gap-3 px-2 mb-6 group" title="Khám phá triết lý học tập">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#7286D3] via-[#8EA7E9] to-[#FFB4B4] p-0.5 flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 shrink-0">
            <EliseCatMascot className="w-full h-full" />
          </div>
          <span
            className="text-3xl text-slate-800 transition-colors group-hover:text-[#5066A1] select-none pt-1.5 leading-none"
            style={{ fontFamily: "'Nahla Script', cursive, sans-serif" }}
          >
            Elise
          </span>
        </Link>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
            KHÔNG GIAN FEYNMAN
          </div>
          {LEARNER_NAVIGATION.map((item) => {
            const Icon = ICON_MAP[item.icon] || LayoutDashboard;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-[#EEF2FC] text-[#5066A1] shadow-2xs font-extrabold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-[#7286D3]" : "text-slate-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? "bg-[#7286D3] text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Admin Moderator Section (Only visible or emphasized for Admin) */}
          {isAdmin && (
            <div className="pt-4 space-y-1.5">
              <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-purple-600 flex items-center justify-between">
                <span>Quản Trị Kiểm Chuẩn</span>
                <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded-md font-bold">
                  Admin
                </span>
              </div>
              {ADMIN_NAVIGATION.filter((i) => i.href !== "/dashboard").map((item) => {
                const Icon = ICON_MAP[item.icon] || Sliders;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                      isActive
                        ? "bg-purple-100/70 text-purple-800 shadow-2xs font-extrabold"
                        : "text-slate-600 hover:bg-purple-50/50 hover:text-purple-900"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? "text-purple-600" : "text-purple-400"
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </nav>
      </div>

      {/* Footer System Status & Calibration Button */}
      <div className="space-y-2 pt-6 border-t border-[#E8EEF8]">
        <button
          onClick={() => openModal("VOICE_CALIBRATION")}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-[#EEF2FC] hover:text-[#5066A1] transition-all cursor-pointer"
        >
          <Volume2 className="w-4 h-4 text-[#7286D3]" />
          <span>Kiểm Tra Giọng Nói</span>
        </button>

        <button
          onClick={() => openModal("HELP_FEEDBACK")}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Trợ Giúp & Phím Tắt</span>
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
