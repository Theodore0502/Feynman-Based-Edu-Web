/**
 * File: src/layouts/WorkspaceLayout.tsx
 * Mục đích: Layout dùng chung cho các màn hình Workspace (Trang 3 đến Trang 10) trong React Router, kế thừa Sidebar, TopHeader và Outlet.
 * Thành phần chính:
 *   - WorkspaceLayout: Vỏ bọc cố định Sidebar và vùng làm việc chính.
 * Props/Inputs: Không có.
 */

import React from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopHeader } from "@/components/layout/TopHeader";
import { PageContainer } from "@/components/layout/PageContainer";

export const WorkspaceLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F3F6FA] flex">
      {/* Sidebar Cố Định */}
      <AppSidebar />

      {/* Vùng Làm Việc Chính */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <PageContainer>
          <TopHeader />
          <Outlet />
        </PageContainer>
      </main>
    </div>
  );
};

