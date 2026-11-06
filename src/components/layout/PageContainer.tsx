/**
 * File: src/components/layout/PageContainer.tsx
 * Mục đích: Khung bọc nội dung chuẩn hóa padding, độ rộng tối đa và hiệu ứng chuyển động mượt mà cho các màn hình.
 * Thành phần chính:
 *   - PageContainer: Wrapper căn giữa nội dung.
 * Props/Inputs: children: React.ReactNode, className?: string.
 */

import React from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className,
}) => {
  return (
    <div className={cn("w-full max-w-6xl mx-auto space-y-6 pb-12", className)}>
      {children}
    </div>
  );
};

