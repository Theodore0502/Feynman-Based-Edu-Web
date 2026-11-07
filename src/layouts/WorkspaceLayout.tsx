/**
 * File: src/layouts/WorkspaceLayout.tsx
 * Mục đích: Layout dùng chung cho các màn hình Workspace (Trang 3 đến Trang 10) trong React Router, kế thừa Sidebar, TopHeader và Outlet.
 * Thành phần chính:
 *   - WorkspaceLayout: Vỏ bọc cố định Sidebar và vùng làm việc chính.
 * Props/Inputs: Không có.
 */

import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopHeader } from "@/components/layout/TopHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { cn } from "@/lib/utils";

export const WorkspaceLayout: React.FC = () => {
  const location = useLocation();
  const isTopicsPage = location.pathname.startsWith("/topics");

  return (
    <div className="h-screen bg-[#F3F6FA] flex overflow-hidden">
      {/* Tầng 1: Toast Sonner Toaster toàn cục */}
      <Toaster position="top-right" richColors closeButton />

      {/* Sidebar Cố Định */}
      <AppSidebar />

      {/* Vùng Làm Việc Chính Cuộn Độc Lập */}
      <main
        className={cn(
          "flex-1 overflow-y-auto h-screen transition-all duration-300 ease-in-out min-w-0",
          isTopicsPage
            ? "p-3 sm:p-4 overflow-hidden flex flex-col h-screen"
            : "p-4 sm:p-6 lg:p-8"
        )}
      >
        <PageContainer
          className={cn(
            isTopicsPage && "max-w-none w-full pb-0 flex-1 flex flex-col space-y-2 min-h-0 h-full"
          )}
        >
          <TopHeader />
          <Outlet />
        </PageContainer>
      </main>
    </div>
  );
};
