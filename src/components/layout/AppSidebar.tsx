/**
 * File: src/components/layout/AppSidebar.tsx
 * Mục đích: Thanh điều hướng bên trái dùng chung cho các màn hình Workspace kế thừa từ config/routes.config.ts với React Router.
 * Thành phần chính:
 *   - AppSidebar: Menu điều hướng pastel, logo Feynman Stage, và nút kiểm tra mic / trợ giúp.
 * Props/Inputs: Không có.
 */

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { SIDEBAR_NAVIGATION } from "@/config/routes.config";
import { useModalStore } from "@/hooks/useModalStore";
import {
  LayoutDashboard,
  Mic,
  Users,
  Network,
  Archive,
  Settings,
  Sparkles,
  Volume2,
  HelpCircle,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Mic,
  Users,
  Network,
  Archive,
  Settings,
};

export const AppSidebar: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const { openModal } = useModalStore();

  return (
    <aside className="w-64 bg-white/90 backdrop-blur-md border-r border-[#E8EEF8] flex flex-col justify-between p-6 shrink-0 min-h-screen">
      {/* Brand Logo & Tagline */}
      <div>
        <Link to="/dashboard" className="flex items-center gap-3 px-2 mb-8 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#8EA7E9] via-[#B5B2E8] to-[#FFB4B4] flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-slate-800">Theodore</span>
            <span className="block text-[10px] uppercase tracking-widest text-[#7286D3] font-bold">Feynman Stage</span>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {SIDEBAR_NAVIGATION.map((item) => {
            const Icon = ICON_MAP[item.icon] || LayoutDashboard;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-[#EBF0FC] text-[#5066A1] font-bold border border-[#D5E1FA] shadow-xs"
                    : "text-slate-500 hover:text-slate-800 hover:bg-[#F6F8FD]"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon
                    className={`w-5 h-5 transition-transform group-hover:scale-105 ${
                      isActive ? "text-[#7286D3]" : "text-slate-400 group-hover:text-[#7286D3]"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    isActive ? "bg-[#D3E0FA] text-[#475C96]" : "bg-rose-50 text-rose-500 border border-rose-100 animate-pulse"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Microphone Calibrate & Help Card */}
      <div className="space-y-3 pt-6 border-t border-slate-100">
        <button
          onClick={() => openModal("VOICE_CALIBRATION")}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#F0F5FD] border border-[#D5E4FC] text-xs font-semibold text-[#5066A1] hover:bg-[#E2EAFD] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[#7286D3]" />
            <span>Kiểm Tra Micro</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        </button>

        <div className="bg-gradient-to-br from-[#F5F8FE] to-[#FCF5F8] border border-[#E2EAFD] rounded-3xl p-4 text-center">
          <HelpCircle className="w-5 h-5 text-[#8EA7E9] mx-auto mb-1.5" />
          <h5 className="text-xs font-bold text-slate-800">Phương pháp Feynman</h5>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            "Nếu bạn không thể giải thích đơn giản, bạn chưa hiểu nó đủ sâu."
          </p>
        </div>
      </div>
    </aside>
  );
};
