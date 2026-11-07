/**
 * File: src/layouts/WorkspaceLayout.tsx
 * Mục đích: Layout dùng chung cho các màn hình Workspace (Trang 3 đến Trang 10) trong React Router, kế thừa Sidebar, TopHeader và Outlet.
 * Thành phần chính:
 *   - WorkspaceLayout: Vỏ bọc cố định Sidebar và vùng làm việc chính.
 * Props/Inputs: Không có.
 */

import React from "react";
import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopHeader } from "@/components/layout/TopHeader";
import { PageContainer } from "@/components/layout/PageContainer";

export const WorkspaceLayout: React.FC = () => {
  return (
    <div className="h-screen bg-[#F3F6FA] flex overflow-hidden">
      {/* Tầng 1: Toast Sonner Toaster toàn cục */}
      <Toaster position="top-right" richColors closeButton />

      {/* Sidebar Cố Định */}
      <AppSidebar />

      {/* Vùng Làm Việc Chính Cuộn Độc Lập */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto h-screen">
        <PageContainer>
          <TopHeader />
          <Outlet />
        </PageContainer>
      </main>
    </div>
  );
};

