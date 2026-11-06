/**
 * File: src/config/routes.config.ts
 * Mục đích: Định nghĩa các đường dẫn URL và danh mục menu cố định của hệ thống Feynman Stage.
 * Thành phần chính:
 *   - APP_ROUTES: Hằng số đường dẫn.
 *   - SIDEBAR_NAVIGATION: Danh sách các tab trên Sidebar.
 * Props/Inputs: Cấu hình tĩnh.
 */

export const APP_ROUTES = {
  LANDING: "/",
  AUTH: "/auth",
  DASHBOARD: "/dashboard",
  STAGE_NEW: "/stage/new",
  STAGE_LIVE: (sessionId: string) => `/stage/${sessionId}`,
  STAGE_REPORT: (sessionId: string) => `/stage/${sessionId}/report`,
  PERSONAS: "/personas",
  TOPICS: "/topics",
  VAULT: "/vault",
  SETTINGS: "/settings",
};

export const SIDEBAR_NAVIGATION = [
  { label: "Dashboard", href: APP_ROUTES.DASHBOARD, icon: "LayoutDashboard" },
  { label: "Giảng Giải (Stage)", href: APP_ROUTES.STAGE_NEW, icon: "Mic", badge: "Live" },
  { label: "Persona Studio", href: APP_ROUTES.PERSONAS, icon: "Users" },
  { label: "Bản Đồ Tri Thức", href: APP_ROUTES.TOPICS, icon: "Network" },
  { label: "Kho Ẩn Dụ & Từ", href: APP_ROUTES.VAULT, icon: "Archive" },
  { label: "Cài Đặt & AI", href: APP_ROUTES.SETTINGS, icon: "Settings" },
];

