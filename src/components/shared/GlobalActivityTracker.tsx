/**
 * File: src/components/shared/GlobalActivityTracker.tsx
 * Purpose: Bộ thu thập hành vi người dùng tự động toàn cục (Global Activity Tracker).
 * Chức năng:
 *   1. Tự động ghi nhận mọi sự kiện chuyển trang (Navigation / Page Views).
 *   2. Tự động lắng nghe và ghi nhận các cú click chuột vào Nút bấm, Liên kết, Thẻ điều khiển (Clicks / Interactions).
 *   3. Tự động bắt lỗi không mong muốn trên trình duyệt (Unhandled Exceptions & Rejections).
 *   4. Gửi toàn bộ dữ liệu kèm giờ chuẩn GMT+7 vào Supabase và xuất lên Console DevTools.
 *   5. Tuân thủ: Tuyệt đối không dùng Icon trong UI.
 */

import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuthStore } from "@/hooks/useAuthStore";
import { AuditLogService } from "@/lib/services/audit-log-service";

export const GlobalActivityTracker: React.FC = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const lastPathRef = useRef<string>("");
  const lastClickRef = useRef<{ text: string; time: number }>({ text: "", time: 0 });

  // 1. Tự động ghi nhận khi Người dùng chuyển trang (Page View / Navigation)
  useEffect(() => {
    const currentPath = location.pathname;
    if (lastPathRef.current !== currentPath) {
      lastPathRef.current = currentPath;

      AuditLogService.logAction({
        action: "PAGE_VIEW",
        category: "NAVIGATION",
        path: currentPath,
        component: "RouterNavigation",
        details: {
          search: location.search || undefined,
          hash: location.hash || undefined,
          pageTitle: document.title || currentPath,
        },
      });
    }
  }, [location.pathname, location.search]);

  // 2. Tự động lắng nghe mọi cú click chuột vào Button, Link, Interactive Elements
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      // Tìm phần tử tương tác gần nhất (button, link, hoặc phần tử có role button)
      const interactiveEl = target.closest<HTMLElement>(
        'button, a, [role="button"], input[type="submit"], input[type="button"], select'
      );

      if (!interactiveEl) return;

      // Lấy nội dung chữ hoặc nhãn của phần tử
      let label = (
        interactiveEl.innerText ||
        interactiveEl.getAttribute("aria-label") ||
        interactiveEl.getAttribute("title") ||
        interactiveEl.getAttribute("name") ||
        interactiveEl.getAttribute("value") ||
        interactiveEl.id ||
        interactiveEl.tagName
      ).trim();

      // Rút gọn nếu chuỗi quá dài
      if (label.length > 60) {
        label = label.slice(0, 57) + "...";
      }

      // Khử nhiễu trùng lặp click liên tục trong vòng 350ms
      const now = Date.now();
      if (lastClickRef.current.text === label && now - lastClickRef.current.time < 350) {
        return;
      }
      lastClickRef.current = { text: label, time: now };

      const tagName = interactiveEl.tagName.toLowerCase();
      const href = interactiveEl.getAttribute("href");

      AuditLogService.logAction({
        action: tagName === "a" ? "CLICK_LINK" : "CLICK_BUTTON",
        category: "UI_INTERACTION",
        path: window.location.pathname,
        component: interactiveEl.id || interactiveEl.className?.toString().slice(0, 40) || tagName,
        details: {
          element: tagName,
          label: label || "Không có nhãn",
          targetHref: href || undefined,
          id: interactiveEl.id || undefined,
        },
      });
    };

    document.addEventListener("click", handleGlobalClick, { capture: true, passive: true });
    return () => {
      document.removeEventListener("click", handleGlobalClick, { capture: true });
    };
  }, []);

  // 3. Tự động bắt lỗi Runtime trên Window
  useEffect(() => {
    const handleWindowError = (event: ErrorEvent) => {
      AuditLogService.logAction({
        action: "RUNTIME_ERROR",
        category: "ERROR",
        status: "FAILED",
        path: window.location.pathname,
        component: "GlobalWindowErrorHandler",
        details: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      AuditLogService.logAction({
        action: "UNHANDLED_PROMISE_REJECTION",
        category: "ERROR",
        status: "FAILED",
        path: window.location.pathname,
        component: "GlobalPromiseErrorHandler",
        details: {
          reason: typeof event.reason === "object" ? event.reason?.message || String(event.reason) : String(event.reason),
        },
      });
    };

    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  // Component chạy ngầm hoàn toàn, không render UI
  return null;
};

export default GlobalActivityTracker;

