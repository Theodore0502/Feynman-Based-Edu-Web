/**
 * File: src/components/shared/EliseCatMascot.tsx
 * Mục đích: Biểu tượng Logo Đầu Cú Thông Thái (Theodore Owl Logo) chính thức của hệ thống.
 * Thay thế cho logo mèo trước đây, đồng bộ sắc nét trên mọi kích thước.
 */

import React from "react";

interface EliseCatMascotProps {
  className?: string;
  size?: number;
  alt?: string;
}

export const EliseCatMascot: React.FC<EliseCatMascotProps> = ({
  className = "w-6 h-6",
  size,
  alt = "Theodore Owl Logo",
}) => {
  return (
    <img
      src="/images/theodore-logo.png"
      alt={alt}
      className={`object-contain select-none shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
      draggable={false}
    />
  );
};

// Re-export với các tên alias tiện dụng
export const TheodoreOwlLogo = EliseCatMascot;
export const AppBrandLogo = EliseCatMascot;
export default EliseCatMascot;
