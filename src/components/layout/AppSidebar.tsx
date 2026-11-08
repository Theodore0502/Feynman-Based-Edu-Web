/**
 * File: src/components/layout/AppSidebar.tsx
 * Mục đích: Thanh điều hướng bên trái dùng chung cho các màn hình Workspace.
 * Hỗ trợ phân quyền động theo 2 vai trò:
 *   - Learner: Thấy các công cụ học tập (Study Lab, Stage, Vault, Graph).
 *   - Admin: Hiển thị thêm nhóm công cụ Quản trị kiểm chuẩn (Rubric Studio, Audit Center, Curriculum).
 */

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LEARNER_NAVIGATION, ADMIN_NAVIGATION, CURATOR_NAVIGATION } from "@/config/routes.config";
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
  UploadCloud,
  FileCheck,
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
  UploadCloud,
  FileCheck,
};

export const AppSidebar: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const { openModal } = useModalStore();
  const { user } = useAuthStore();
  const { isCollapsed, toggleCollapse } = useSidebarStore();

  const isAdmin = user?.role === "admin";
  const isCurator = user?.role === "curator";

  return (
    <aside
      className={cn(
        "bg-white/90 backdrop-blur-md border-r border-[#E8EEF8] flex flex-col justify-between shrink-0 h-screen sticky top-0 overflow-y-auto overflow-x-hidden scrollbar-none z-30 transition-all duration-300 ease-out px-3 py-6",
        isCollapsed ? "w-[68px]" : "w-64"
      )}
    >
      {/* Brand Logo & Name */}
      <div>
        <Link
          to="/about"
          className="flex items-center h-12 mb-6 group transition-all overflow-hidden whitespace-nowrap"
          title="Khám phá triết lý học tập"
        >
          <div className="w-11 h-11 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105">
            <EliseCatMascot className="w-9 h-9 drop-shadow-xs" />
          </div>
          <span
            className={cn(
              "text-3xl text-slate-800 transition-all select-none pt-1 pl-2 leading-none whitespace-nowrap overflow-hidden group-hover:text-[#5066A1]",
              isCollapsed
                ? "opacity-0 max-w-0 -translate-x-3 pointer-events-none duration-100 delay-0"
                : "opacity-100 max-w-[140px] translate-x-0 delay-150 duration-200"
            )}
            style={{ fontFamily: "'Nahla Script', cursive, sans-serif" }}
          >
            Elise
          </span>
        </Link>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
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
                  "flex items-center w-full h-11 rounded-2xl text-xs font-bold transition-all relative group overflow-hidden whitespace-nowrap",
                  isActive
                    ? "bg-[#EEF2FC] text-[#5066A1] shadow-2xs font-extrabold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {/* Fixed Icon slot: exact same size and location in both collapsed & expanded */}
                <div className="w-11 h-11 flex items-center justify-center shrink-0">
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      isActive ? "text-[#7286D3]" : "text-slate-400"
                    )}
                  />
                </div>

                <span
                  className={cn(
                    "whitespace-nowrap overflow-hidden transition-all ease-out pl-0.5",
                    isCollapsed
                      ? "opacity-0 max-w-0 -translate-x-3 pointer-events-none duration-100 delay-0"
                      : "opacity-100 max-w-[150px] translate-x-0 delay-150 duration-200"
                  )}
                >
                  {item.label}
                </span>

                {item.badge && (
                  <span
                    className={cn(
                      "ml-auto mr-2.5 text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap transition-all ease-out shrink-0",
                      isActive
                        ? "bg-[#7286D3] text-white"
                        : "bg-slate-100 text-slate-500",
                      isCollapsed
                        ? "opacity-0 max-w-0 scale-75 pointer-events-none duration-100 delay-0 overflow-hidden"
                        : "opacity-100 max-w-[60px] scale-100 delay-150 duration-200"
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

          {/* Curator / Submitter Section (For Curator role) */}
          {isCurator && !isAdmin && (
            <div className="pt-4 space-y-1.5">
              {!isCollapsed ? (
                <div
                  className={cn(
                    "px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-indigo-600 flex items-center justify-between transition-all overflow-hidden whitespace-nowrap",
                    isCollapsed
                      ? "opacity-0 max-h-0 pointer-events-none duration-100 delay-0"
                      : "opacity-100 max-h-8 delay-150 duration-200"
                  )}
                >
                  <span>Thẩm Định Tri Thức</span>
                  <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded-md font-bold">
                    Curator
                  </span>
                </div>
              ) : (
                <div className="w-full border-t border-indigo-100 my-2" />
              )}
              {CURATOR_NAVIGATION.filter((i) => i.href !== "/dashboard").map((item) => {
                const Icon = ICON_MAP[item.icon] || FileCheck;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    title={isCollapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center w-full h-11 rounded-2xl text-xs font-bold transition-all relative group overflow-hidden whitespace-nowrap",
                      isActive
                        ? "bg-indigo-100/70 text-indigo-800 shadow-2xs font-extrabold"
                        : "text-slate-600 hover:bg-indigo-50/50 hover:text-indigo-900"
                    )}
                  >
                    <div className="w-11 h-11 flex items-center justify-center shrink-0">
                      <Icon
                        className={cn(
                          "w-4 h-4 shrink-0 transition-colors",
                          isActive ? "text-indigo-600" : "text-indigo-400"
                        )}
                      />
                    </div>

                    <span
                      className={cn(
                        "whitespace-nowrap overflow-hidden transition-all ease-out pl-0.5",
                        isCollapsed
                          ? "opacity-0 max-w-0 -translate-x-3 pointer-events-none duration-100 delay-0"
                          : "opacity-100 max-w-[150px] translate-x-0 delay-150 duration-200"
                      )}
                    >
                      {item.label}
                    </span>

                    {item.badge && (
                      <span
                        className={cn(
                          "ml-auto mr-2.5 text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap transition-all ease-out shrink-0",
                          isActive
                            ? "bg-indigo-600 text-white"
                            : "bg-indigo-100 text-indigo-700",
                          isCollapsed
                            ? "opacity-0 max-w-0 scale-75 pointer-events-none duration-100 delay-0 overflow-hidden"
                            : "opacity-100 max-w-[60px] scale-100 delay-150 duration-200"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Admin Moderator Section (Only visible for Admin, inherits all Curator features + System Config) */}
          {isAdmin && (
            <div className="pt-4 space-y-1.5">
              {!isCollapsed ? (
                <div
                  className={cn(
                    "px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-purple-600 flex items-center justify-between transition-all overflow-hidden whitespace-nowrap",
                    isCollapsed
                      ? "opacity-0 max-h-0 pointer-events-none duration-100 delay-0"
                      : "opacity-100 max-h-8 delay-150 duration-200"
                  )}
                >
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
                      "flex items-center w-full h-11 rounded-2xl text-xs font-bold transition-all relative group overflow-hidden whitespace-nowrap",
                      isActive
                        ? "bg-purple-100/70 text-purple-800 shadow-2xs font-extrabold"
                        : "text-slate-600 hover:bg-purple-50/50 hover:text-purple-900"
                    )}
                  >
                    <div className="w-11 h-11 flex items-center justify-center shrink-0">
                      <Icon
                        className={cn(
                          "w-4 h-4 shrink-0 transition-colors",
                          isActive ? "text-purple-600" : "text-purple-400"
                        )}
                      />
                    </div>

                    <span
                      className={cn(
                        "whitespace-nowrap overflow-hidden transition-all ease-out pl-0.5",
                        isCollapsed
                          ? "opacity-0 max-w-0 -translate-x-3 pointer-events-none duration-100 delay-0"
                          : "opacity-100 max-w-[150px] translate-x-0 delay-150 duration-200"
                      )}
                    >
                      {item.label}
                    </span>

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
              "relative z-10 bg-white hover:bg-[#EEF2FC] border border-[#E8EEF8] hover:border-[#8299E0] text-slate-500 hover:text-[#5066A1] shadow-2xs transition-all duration-300 cursor-pointer group flex items-center justify-center overflow-hidden",
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
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-[#5066A1] whitespace-nowrap overflow-hidden transition-all ease-out",
                    isCollapsed
                      ? "opacity-0 max-w-0 pointer-events-none duration-100 delay-0"
                      : "opacity-100 max-w-[80px] delay-150 duration-200"
                  )}
                >
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
            className="w-full flex items-center h-11 rounded-2xl text-xs font-bold text-slate-600 hover:bg-[#EEF2FC] hover:text-[#5066A1] transition-all cursor-pointer relative group overflow-hidden whitespace-nowrap"
          >
            <div className="w-11 h-11 flex items-center justify-center shrink-0">
              <Volume2 className="w-4 h-4 text-[#7286D3] shrink-0" />
            </div>
            <span
              className={cn(
                "whitespace-nowrap overflow-hidden transition-all ease-out pl-0.5",
                isCollapsed
                  ? "opacity-0 max-w-0 -translate-x-3 pointer-events-none duration-100 delay-0"
                  : "opacity-100 max-w-[180px] translate-x-0 delay-150 duration-200"
              )}
            >
              Kiểm Tra Giọng Nói
            </span>
            {isCollapsed && (
              <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50">
                Kiểm Tra Giọng Nói
              </div>
            )}
          </button>

          <button
            onClick={() => openModal("HELP_FEEDBACK")}
            title={isCollapsed ? "Trợ Giúp & Phím Tắt" : undefined}
            className="w-full flex items-center h-11 rounded-2xl text-xs font-bold text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all cursor-pointer relative group overflow-hidden whitespace-nowrap"
          >
            <div className="w-11 h-11 flex items-center justify-center shrink-0">
              <HelpCircle className="w-4 h-4 shrink-0" />
            </div>
            <span
              className={cn(
                "whitespace-nowrap overflow-hidden transition-all ease-out pl-0.5",
                isCollapsed
                  ? "opacity-0 max-w-0 -translate-x-3 pointer-events-none duration-100 delay-0"
                  : "opacity-100 max-w-[180px] translate-x-0 delay-150 duration-200"
              )}
            >
              Trợ Giúp & Phím Tắt
            </span>
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
