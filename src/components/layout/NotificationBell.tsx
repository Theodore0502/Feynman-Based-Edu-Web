/**
 * File: src/components/layout/NotificationBell.tsx
 * Mục đích: Component Quả Chuông Thông Báo (Tầng 2 - Notification Center) trên thanh Topbar:
 *   - Huy hiệu số đếm màu đỏ cho các thông báo chưa đọc.
 *   - Khung Popover chia 2 tab (Tất cả & Chưa đọc) kèm nút "Đánh dấu đã đọc tất cả".
 *   - Điều hướng trực tiếp tới trang đích hoặc modal tương ứng khi nhấp.
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotificationStore } from "@/hooks/useNotificationStore";
import { useModalStore } from "@/hooks/useModalStore";
import type { AppNotification } from "@/types/notification.types";
import {
  Bell,
  CheckCheck,
  Zap,
  CheckCircle2,
  Clock,
  Flame,
  Info,
  ExternalLink,
  Inbox,
  X,
} from "lucide-react";

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALL" | "UNREAD">("ALL");

  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotificationStore();
  const { openModal } = useModalStore();

  const filteredNotifications =
    activeTab === "ALL"
      ? notifications
      : notifications.filter((n) => !n.isRead);

  // Render Icon theo loại thông báo
  const renderNotificationIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "SRS_REMINDER":
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 fill-amber-500" />
          </div>
        );
      case "REPORT_READY":
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        );
      case "SESSION_RESUME":
        return (
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        );
      case "STREAK_ALERT":
        return (
          <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 fill-rose-500" />
          </div>
        );
      case "SYSTEM":
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shrink-0">
            <Info className="w-4 h-4" />
          </div>
        );
    }
  };

  // Tính thời gian hiển thị tương đối
  const formatTimeAgo = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    if (diffMin < 1) return "Vừa xong";
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày trước`;
  };

  const handleNotificationClick = (notif: AppNotification) => {
    markAsRead(notif.id);
    setIsOpen(false);

    // Xử lý mở modal đặc thù nếu có
    if (notif.metadata?.modal === "QUICK_DRILL") {
      openModal("QUICK_DRILL");
      return;
    }

    // Điều hướng theo actionUrl
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  return (
    <div className="relative">
      {/* Nút Chuông */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        title="Trung tâm thông báo"
      >
        <Bell className="w-4 h-4" />

        {/* Chấm đỏ số lượng chưa đọc */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white font-mono font-bold text-[10px] flex items-center justify-center ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop để bấm ra ngoài là đóng */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-3xl border border-[#E2EAFD] shadow-2xl z-50 animate-in fade-in overflow-hidden flex flex-col max-h-[500px]">
            {/* 1. Header Panel */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-[#F8FAFD]/60">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-800">
                  Thông Báo
                </span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700">
                    {unreadCount} mới
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#5066A1] hover:text-[#7286D3] transition-colors cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Đọc tất cả</span>
                </button>
              )}
            </div>

            {/* 2. Tabs Selector (Tất cả / Chưa đọc) */}
            <div className="flex items-center px-4 pt-2 border-b border-slate-100 gap-4 text-xs font-bold text-slate-500">
              <button
                type="button"
                onClick={() => setActiveTab("ALL")}
                className={`pb-2.5 transition-colors relative cursor-pointer ${
                  activeTab === "ALL"
                    ? "text-[#5066A1] font-extrabold"
                    : "hover:text-slate-700"
                }`}
              >
                Tất cả ({notifications.length})
                {activeTab === "ALL" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7286D3] rounded-full" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("UNREAD")}
                className={`pb-2.5 transition-colors relative cursor-pointer ${
                  activeTab === "UNREAD"
                    ? "text-[#5066A1] font-extrabold"
                    : "hover:text-slate-700"
                }`}
              >
                Chưa đọc ({unreadCount})
                {activeTab === "UNREAD" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7286D3] rounded-full" />
                )}
              </button>
            </div>

            {/* 3. Notification List Items */}
            <div className="overflow-y-auto divide-y divide-slate-100 flex-1 scrollbar-none">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3.5 flex items-start gap-3 hover:bg-[#F8FAFD] transition-colors cursor-pointer relative ${
                      !item.isRead ? "bg-[#EEF2FC]/30" : ""
                    }`}
                  >
                    {renderNotificationIcon(item.type)}

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4
                          className={`text-xs truncate ${
                            !item.isRead
                              ? "font-black text-slate-900"
                              : "font-bold text-slate-700"
                          }`}
                        >
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                          {formatTimeAgo(item.createdAt)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>

                      {item.actionUrl && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#5066A1] pt-0.5">
                          <span>Xem chi tiết</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>

                    {/* Unread indicator blue dot */}
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#7286D3] shrink-0 mt-1.5" />
                    )}
                  </div>
                ))
              ) : (
                <div className="py-12 px-4 text-center space-y-2">
                  <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-400">
                    {activeTab === "UNREAD"
                      ? "Bạn không có thông báo chưa đọc nào!"
                      : "Hộp thông báo đang trống."}
                  </p>
                </div>
              )}
            </div>

            {/* 4. Footer */}
            <div className="p-2.5 border-t border-slate-100 bg-[#F8FAFD] text-center">
              <span className="text-[10px] text-slate-400 font-medium">
                Hệ thống thông báo thời gian thực • Elis
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;

