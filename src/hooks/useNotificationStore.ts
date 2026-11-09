/**
 * File: src/hooks/useNotificationStore.ts
 * Mục đích: Quản lý Global State cho Hệ thống Thông báo 2 Tầng (Toast Sonner & Quả chuông TopHeader).
 * Lưu trữ bền vững (localStorage) với key: "elise_notifications".
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";
import type { AppNotification, NotificationType, NotificationMetadata } from "@/types/notification.types";

interface NotificationStore {
  notifications: AppNotification[];
  unreadCount: number;

  // Actions
  addNotification: (
    data: {
      type: NotificationType;
      title: string;
      message: string;
      actionUrl?: string;
      metadata?: NotificationMetadata;
    },
    triggerToast?: boolean
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  checkSRSDueNotifications: (dueCount: number) => void;
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-001",
    type: "SRS_REMINDER",
    title: "Đến hạn ôn tập 3 thuật ngữ",
    message: "Bạn có 3 thẻ trong Sổ tay cần củng cố theo thuật toán ngắt quãng SM-2.",
    actionUrl: "/vault",
    metadata: { dueCount: 3, modal: "QUICK_DRILL" },
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 phút trước
  },
  {
    id: "notif-002",
    type: "REPORT_READY",
    title: "Báo cáo Feynman đã sẵn sàng",
    message: "Bé Bắp đã hoàn tất nghe bài giảng 'Cơ chế Docker Container'. Điểm Clarity: 88/100.",
    actionUrl: "/stage/sample/report?topic=C%C6%A1%20ch%E1%BA%BF%20Docker%20Container&score=88",
    metadata: { score: 88 },
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 1.5 giờ trước
  },
  {
    id: "notif-003",
    type: "SESSION_RESUME",
    title: "Tiếp tục bài giảng đang dở",
    message: "Bạn có bài giảng 'Process vs Thread' đang chờ giảng tiếp cho Bé Bắp.",
    actionUrl: "/stage/ses-active-01?topic=C%C6%A1%20Ch%E1%BA%BF%20Ph%C3%A2n%20Chia%20Ti%E1%BA%BFn%20Tr%C3%ACnh",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 giờ trước
  },
  {
    id: "notif-004",
    type: "STREAK_ALERT",
    title: "Chuỗi 14 ngày rực rỡ!",
    message: "Chúc mừng bạn! Hãy hoàn thành 1 bài giảng hôm nay để giữ vững chuỗi ngọn lửa.",
    actionUrl: "/lectures",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // Hôm qua
  },
];

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: INITIAL_NOTIFICATIONS,
      unreadCount: INITIAL_NOTIFICATIONS.filter((n) => !n.isRead).length,

      addNotification: (data, triggerToast = true) => {
        const newNotif: AppNotification = {
          id: `notif-${Date.now()}`,
          ...data,
          isRead: false,
          createdAt: new Date().toISOString(),
        };

        const updated = [newNotif, ...get().notifications];
        const unread = updated.filter((n) => !n.isRead).length;

        set({
          notifications: updated,
          unreadCount: unread,
        });

        // Tầng 1: Kích hoạt Toast tức thời qua Sonner
        if (triggerToast) {
          switch (data.type) {
            case "SRS_REMINDER":
              toast.info(data.title, {
                description: data.message,
                action: data.actionUrl
                  ? {
                      label: "Xem ngay",
                      onClick: () => {
                        if (typeof window !== "undefined") {
                          window.location.href = data.actionUrl!;
                        }
                      },
                    }
                  : undefined,
              });
              break;
            case "REPORT_READY":
              toast.success(data.title, {
                description: data.message,
              });
              break;
            case "STREAK_ALERT":
              toast.warning(data.title, {
                description: data.message,
              });
              break;
            default:
              toast(data.title, {
                description: data.message,
              });
              break;
          }
        }
      },

      markAsRead: (id) => {
        const updated = get().notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        );
        set({
          notifications: updated,
          unreadCount: updated.filter((n) => !n.isRead).length,
        });
      },

      markAllAsRead: () => {
        const updated = get().notifications.map((n) => ({ ...n, isRead: true }));
        set({
          notifications: updated,
          unreadCount: 0,
        });
        toast.success("Đã đánh dấu tất cả thông báo là đã đọc!");
      },

      removeNotification: (id) => {
        const updated = get().notifications.filter((n) => n.id !== id);
        set({
          notifications: updated,
          unreadCount: updated.filter((n) => !n.isRead).length,
        });
      },

      checkSRSDueNotifications: (dueCount) => {
        if (dueCount <= 0) return;
        const todayStr = new Date().toISOString().slice(0, 10);
        const hasNotifiedToday = get().notifications.some(
          (n) =>
            n.type === "SRS_REMINDER" &&
            n.createdAt.slice(0, 10) === todayStr
        );

        if (!hasNotifiedToday) {
          get().addNotification({
            type: "SRS_REMINDER",
            title: `Hôm nay có ${dueCount} thuật ngữ cần ôn tập`,
            message: `Hệ thống SM-2 đã tính toán đường cong quên lãng cho ${dueCount} thẻ đến hạn.`,
            actionUrl: "/vault",
            metadata: { dueCount, modal: "QUICK_DRILL" },
          });
        }
      },
    }),
    {
      name: "elis_notifications",
    }
  )
);

