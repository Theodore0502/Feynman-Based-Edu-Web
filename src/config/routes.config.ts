/**
 * File: src/config/routes.config.ts
 * Mục đích: Định nghĩa các đường dẫn URL và danh mục menu chuẩn hóa Tiếng Việt theo quy tắc:
 *   - Thanh điều hướng Sidebar người học: Tổng Quan, Soạn Bài Giảng (Bước 1), Lên Bục Giảng (Bước 2),
 *     Khán Giả AI, Bản Đồ Tri Thức, Sổ Tay Thuật Ngữ, Thiết Lập Hệ Thống.
 *   - Thanh điều hướng Admin Moderator: Cấu Hình Rubric, Kiểm Duyệt Phản Biện, Quản Lý Kho Tri Thức, Khán Giả AI.
 */

export const APP_ROUTES = {
  LANDING: "/",
  AUTH: "/auth",
  DASHBOARD: "/dashboard",
  LECTURES: "/lectures",
  STUDY: "/study",
  STUDY_TOPIC: (topicId: string) => `/study?topicId=${topicId}`,
  STAGE: "/stage",
  STAGE_NEW: "/stage/new",
  STAGE_LIVE: (sessionId: string) => `/stage/${sessionId}`,
  STAGE_REPORT: (sessionId: string) => `/stage/${sessionId}/report`,
  PERSONAS: "/personas",
  TOPICS: "/topics",
  VAULT: "/vault",
  ABOUT: "/about",
  SETTINGS: "/settings",

  // Tuyến đường Tải tài liệu & AI Agent bóc tách
  MATERIALS_UPLOAD: "/materials/upload",

  // Tuyến đường Thẩm Định Viên (Knowledge Curator) & Quản trị viên
  CURATOR_VALIDATION: "/curator/validation",

  // Tuyến đường Quản trị viên (Admin Moderator)
  ADMIN_RUBRICS: "/admin/rubrics",
  ADMIN_AUDITS: "/admin/audits",
  ADMIN_CURRICULUM: "/admin/curriculum",
  ADMIN_AI_CONFIG: "/admin/ai-config",
};

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: string;
}

export const LEARNER_NAVIGATION: NavItem[] = [
  { label: "Tổng quan", href: APP_ROUTES.DASHBOARD, icon: "LayoutDashboard" },
  { label: "Bài giảng", href: APP_ROUTES.LECTURES, icon: "BookOpen" },
  { label: "Tải tài liệu", href: APP_ROUTES.MATERIALS_UPLOAD, icon: "UploadCloud" },
  { label: "Luyện tập", href: APP_ROUTES.STAGE, icon: "Mic" },
  { label: "Thư viện AI", href: APP_ROUTES.PERSONAS, icon: "Bot" },
  { label: "Bản đồ kiến thức", href: APP_ROUTES.TOPICS, icon: "Network" },
  { label: "Sổ tay", href: APP_ROUTES.VAULT, icon: "Bookmark" },
  { label: "Giới thiệu", href: APP_ROUTES.ABOUT, icon: "Info" },
  { label: "Cài đặt", href: APP_ROUTES.SETTINGS, icon: "Settings" },
];

export const CURATOR_NAVIGATION: NavItem[] = [
  { label: "Thẩm Định Tri Thức", href: APP_ROUTES.CURATOR_VALIDATION, icon: "FileCheck" },
  { label: "Kho Tri Thức", href: APP_ROUTES.ADMIN_CURRICULUM, icon: "FileText" },
  { label: "Kiểm Duyệt Phản Biện", href: APP_ROUTES.ADMIN_AUDITS, icon: "ShieldAlert" },
  { label: "Về Trang Học Tập", href: APP_ROUTES.DASHBOARD, icon: "ArrowLeft" },
];

export const ADMIN_NAVIGATION: NavItem[] = [
  { label: "Thẩm Định Tri Thức", href: APP_ROUTES.CURATOR_VALIDATION, icon: "FileCheck" },
  { label: "Cấu Hình Rubric", href: APP_ROUTES.ADMIN_RUBRICS, icon: "Sliders" },
  { label: "Kiểm Duyệt Phản Biện", href: APP_ROUTES.ADMIN_AUDITS, icon: "ShieldAlert" },
  { label: "Quản Lý Kho Tri Thức", href: APP_ROUTES.ADMIN_CURRICULUM, icon: "FileText" },
  { label: "Cài Đặt AI", href: APP_ROUTES.ADMIN_AI_CONFIG, icon: "Bot" },
  { label: "Về Trang Học Tập", href: APP_ROUTES.DASHBOARD, icon: "ArrowLeft" },
];

export const SIDEBAR_NAVIGATION = LEARNER_NAVIGATION;
