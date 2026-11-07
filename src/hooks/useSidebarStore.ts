/**
 * File: src/hooks/useSidebarStore.ts
 * Mục đích: Quản lý trạng thái thu gọn / phóng to của thanh bên (Sidebar) toàn cục bằng Zustand và lưu trữ bền vững qua localStorage.
 * Thành phần chính:
 *   - isCollapsed: Trạng thái thu gọn (boolean)
 *   - toggleCollapse: Hàm đảo trạng thái
 *   - setCollapsed: Hàm gán trạng thái trực tiếp
 */

import { create } from "zustand";

interface SidebarState {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

const STORAGE_KEY = "elise_sidebar_collapsed";

export const useSidebarStore = create<SidebarState>((set) => ({
  isCollapsed: (() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  })(),
  toggleCollapse: () =>
    set((state) => {
      const next = !state.isCollapsed;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {}
      return { isCollapsed: next };
    }),
  setCollapsed: (collapsed: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {}
    set({ isCollapsed: collapsed });
  },
}));

