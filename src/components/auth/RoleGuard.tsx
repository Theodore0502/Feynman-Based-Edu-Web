/**
 * File: src/components/auth/RoleGuard.tsx
 * Purpose: Route guard component enforcing role-based permissions (Learner vs Admin).
 * Redirects or shows an informative access-denied state with 1-click role switcher.
 */

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/hooks/useAuthStore";
import { UserRole } from "@/types/auth.types";
import { ShieldAlert, ArrowRight, ShieldCheck } from "lucide-react";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, switchRole } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="bg-white max-w-md w-full rounded-3xl p-8 border border-red-100 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-500 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-3 py-1 rounded-full">
              Khu Vực Hạn Chế
            </span>
            <h3 className="text-xl font-black text-slate-800">Yêu Cầu Quyền Quản Trị Viên (Admin)</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Bạn hiện đang đăng nhập với vai trò <strong className="text-slate-700">Learner (Người học)</strong>.
              Trang này dành riêng cho Admin Moderator kiểm chuẩn tiêu chí đánh giá và kịch bản hỏi xoáy.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => switchRole("admin")}
              className="w-full py-3 px-4 rounded-2xl bg-[#7286D3] hover:bg-[#5066A1] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Chuyển Sang Tài Khoản Admin (admin123)</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleGuard;

