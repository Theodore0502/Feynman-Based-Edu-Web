/**
 * File: src/types/notification.types.ts
 * Mục đích: Định nghĩa các kiểu dữ liệu cho Hệ Thống Thông Báo 2 Tầng (Toast & Notification Center).
 */

export type NotificationType =
  | "SRS_REMINDER"   // Nhắc lịch ôn tập từ vựng đến hạn (next_review_at)
  | "SESSION_RESUME"  // Nhắc phiên học đang bỏ dở (status === 'ACTIVE')
  | "REPORT_READY"   // AI đã chấm xong báo cáo Feynman Mastery Card
  | "STREAK_ALERT"   // Cảnh báo duy trì hoặc sắp mất chuỗi ngày học
  | "SYSTEM";        // Thông báo hệ thống

export interface NotificationMetadata {
  topicId?: string;
  topicTitle?: string;
  sessionId?: string;
  score?: number;
  dueCount?: number;
  modal?: string;
  [key: string]: unknown;
}

export interface AppNotification {
  id: string;
  userId?: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string; // Ví dụ: '/vault', '/stage/ses-123/report', '/stage/new'
  metadata?: NotificationMetadata;
  isRead: boolean;
  createdAt: string; // ISO 8601 string
}

