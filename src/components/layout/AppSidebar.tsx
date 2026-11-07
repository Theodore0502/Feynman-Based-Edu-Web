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
import { useSidebarStore } from "@/hooks/useSidebarStore";
import { EliseCatMascot } from "@/components/shared/EliseCatMascot";
import { cn } from "@/lib/utils";
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
  ChevronLeft,
  ChevronRight,
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
  const { user } = useAuthStore();
  const { isCollapsed, toggleCollapse } = useSidebarStore();

  const isAdmin = user?.role === "admin";

  return (
    <aside
      className={cn(
        "bg-white/90 backdrop-blur-md border-r border-[#E8EEF8] flex flex-col justify-between shrink-0 h-screen sticky top-0 overflow-y-auto scrollbar-none z-30 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20 p-3" : "w-64 p-6"
      )}
    >
      {/* Brand Logo & Name */}
      <div>
        <Link
          to="/about"
          className={cn(
            "flex items-center mb-6 group transition-all",
            isCollapsed ? "justify-center px-0" : "gap-3 px-2"
          )}
          title="Khám phá triết lý học tập"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#7286D3] via-[#8EA7E9] to-[#FFB4B4] p-0.5 flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 shrink-0">
            <EliseCatMascot className="w-full h-full" />
          </div>
          {!isCollapsed && (
            <span
              className="text-3xl text-slate-800 transition-colors group-hover:text-[#5066A1] select-none pt-1.5 leading-none"
              style={{ fontFamily: "'Nahla Script', cursive, sans-serif" }}
            >
              Elise
            </span>
          )}
        </Link>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {!isCollapsed ? (
            <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
              KHÔNG GIAN FEYNMAN
            </div>
          ) : (
            <div className="h-2" />
          )}

          {LEARNER_NAVIGATION.map((item) => {
            const Icon = ICON_MAP[item.icon] || LayoutDashboard;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                to={item.href}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center rounded-2xl text-xs font-bold transition-all relative group",
                  isCollapsed
                    ? "justify-center p-3"
                    : "justify-between px-3.5 py-2.5",
                  isActive
                    ? "bg-[#EEF2FC] text-[#5066A1] shadow-2xs font-extrabold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <div className={cn("flex items-center", !isCollapsed && "gap-3")}>
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0",
                      isActive ? "text-[#7286D3]" : "text-slate-400"
                    )}
                  />
                  {!isCollapsed && <span>{item.label}</span>}
                </div>
                {!isCollapsed && item.badge && (
                  <span
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-bold",
                      isActive
                        ? "bg-[#7286D3] text-white"
                        : "bg-slate-100 text-slate-500"
                    )}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Floating Tooltip in collapsed mode */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50">
                    {item.label}
                    {item.badge && (
                      <span className="ml-1.5 px-1.5 py-0.2 bg-[#7286D3] text-white rounded text-[10px]">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}

          {/* Admin Moderator Section (Only visible or emphasized for Admin) */}
          {isAdmin && (
            <div className="pt-4 space-y-1.5">
              {!isCollapsed ? (
                <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-purple-600 flex items-center justify-between">
                  <span>Quản Trị Kiểm Chuẩn</span>
                  <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded-md font-bold">
                    Admin
                  </span>
                </div>
              ) : (
                <div className="w-full border-t border-purple-100 my-2" />
              )}
              {ADMIN_NAVIGATION.filter((i) => i.href !== "/dashboard").map((item) => {
                const Icon = ICON_MAP[item.icon] || Sliders;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    title={isCollapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center rounded-2xl text-xs font-bold transition-all relative group",
                      isCollapsed
                        ? "justify-center p-3"
                        : "justify-between px-3.5 py-2.5",
                      isActive
                        ? "bg-purple-100/70 text-purple-800 shadow-2xs font-extrabold"
                        : "text-slate-600 hover:bg-purple-50/50 hover:text-purple-900"
                    )}
                  >
                    <div className={cn("flex items-center", !isCollapsed && "gap-3")}>
                      <Icon
                        className={cn(
                          "w-4 h-4 shrink-0",
                          isActive ? "text-purple-600" : "text-purple-400"
                        )}
                      />
                      {!isCollapsed && <span>{item.label}</span>}
                    </div>

                    {/* Floating Tooltip in collapsed mode */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50">
                        {item.label}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>
      </div>

      {/* Footer System Status & Calibration Button with Toggle on the Divider Line */}
      <div className="pt-2">
        {/* Đường line phân chia với Nút Thu gọn / Phóng to */}
        <div className="relative my-3 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E8EEF8]" />
          </div>
          <button
            onClick={toggleCollapse}
            className={cn(
              "relative z-10 bg-white hover:bg-[#EEF2FC] border border-[#E8EEF8] hover:border-[#8299E0] text-slate-500 hover:text-[#5066A1] shadow-2xs transition-all cursor-pointer group flex items-center justify-center",
              isCollapsed
                ? "w-7 h-7 rounded-full"
                : "px-3 py-1 rounded-full gap-1.5"
            )}
            title={isCollapsed ? "Phóng to thanh điều hướng" : "Thu gọn thanh điều hướng"}
            aria-label={isCollapsed ? "Phóng to thanh điều hướng" : "Thu gọn thanh điều hướng"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#7286D3] transition-transform group-hover:translate-x-0.5" />
            ) : (
              <>
                <ChevronLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#7286D3] transition-transform group-hover:-translate-x-0.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-[#5066A1]">
                  Thu gọn
                </span>
              </>
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="space-y-1.5 pt-1">
          <button
            onClick={() => openModal("VOICE_CALIBRATION")}
            title={isCollapsed ? "Kiểm Tra Giọng Nói" : undefined}
            className={cn(
              "w-full flex items-center rounded-2xl text-xs font-bold text-slate-600 hover:bg-[#EEF2FC] hover:text-[#5066A1] transition-all cursor-pointer relative group",
              isCollapsed ? "justify-center p-3" : "gap-3 px-3.5 py-2.5"
            )}
          >
            <Volume2 className="w-4 h-4 text-[#7286D3] shrink-0" />
            {!isCollapsed && <span>Kiểm Tra Giọng Nói</span>}
            {isCollapsed && (
              <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50">
                Kiểm Tra Giọng Nói
              </div>
            )}
          </button>

          <button
            onClick={() => openModal("HELP_FEEDBACK")}
            title={isCollapsed ? "Trợ Giúp & Phím Tắt" : undefined}
            className={cn(
              "w-full flex items-center rounded-2xl text-xs font-bold text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all cursor-pointer relative group",
              isCollapsed ? "justify-center p-3" : "gap-3 px-3.5 py-2.5"
            )}
          >
            <HelpCircle className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Trợ Giúp & Phím Tắt</span>}
            {isCollapsed && (
              <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50">
                Trợ Giúp & Phím Tắt
              </div>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
