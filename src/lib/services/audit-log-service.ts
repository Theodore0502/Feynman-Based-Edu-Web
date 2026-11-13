/**
 * File: src/lib/services/audit-log-service.ts
 * Purpose: Dịch vụ Thu thập & Ghi nhận Toàn bộ Hoạt động (Audit & Activity Logging Engine)
 *          kết nối trực tiếp Supabase và Browser Console.
 * Đặc điểm:
 *   1. Múi giờ chuẩn xác: Tất cả bản ghi đều gắn nhãn thời gian GMT+7 (Asia/Ho_Chi_Minh).
 *   2. Thu thập mọi đối tượng: Learner, Curator, Admin, Guest/Anonymous.
 *   3. Xuất đồng thời lên Console DevTools trình duyệt với huy hiệu định dạng trực quan.
 *   4. Cơ chế Batching & Resilient Buffer: Không làm block hay giật lag giao diện,
 *      tự động lưu vào hàng đợi và đồng bộ nền (background sync).
 *   5. Tuân thủ: Tuyệt đối không dùng Icon trong UI.
 */

import { supabase, supabaseAdmin } from "@/lib/supabase";

export type AuditCategory =
  | "NAVIGATION"      // Chuyển trang, xem màn hình, điều hướng
  | "UI_INTERACTION"  // Click nút bấm, tương tác modal, đóng mở panel, sao chép
  | "LEARNING"        // Phiên giảng Feynman, gửi lời giải thích, phản hồi AI, thấu suốt
  | "CURATION"        // Tải tài liệu, đọc lướt AI, trích xuất Feynman, thẩm định duyệt bài
  | "AUTH"            // Đăng nhập, đăng xuất, chuyển role, đăng ký
  | "SYSTEM"          // Gọi Gemini LLM, đồng bộ dữ liệu CSDL, tác vụ nền
  | "ERROR";          // Lỗi runtime, lỗi mạng, lỗi phân tích

export interface AuditLogData {
  id?: string;
  userId?: string | null;
  userEmail?: string | null;
  userRole?: string;
  userName?: string | null;
  action: string;
  category: AuditCategory;
  path?: string;
  component?: string;
  details?: Record<string, any>;
  status?: "SUCCESS" | "FAILED" | "WARNING" | "PENDING";
  ipAddress?: string;
  userAgent?: string;
  createdAt?: string;
  createdAtGmt7?: string;
  skipConsole?: boolean;
}

export interface FormattedGMT7Time {
  iso: string;        // "2026-11-14T02:30:00.000+07:00"
  formatted: string;  // "14/11/2026 02:30:00 (GMT+7)"
  timeOnly: string;   // "02:30:00 GMT+7"
  timestampMs: number;
}

/**
 * Tính toán thời gian theo múi giờ Việt Nam (GMT+7)
 */
export function getGMT7Time(date: Date = new Date()): FormattedGMT7Time {
  const tzOffsetMinutes = 7 * 60; // +420 minutes
  const gmt7Date = new Date(date.getTime() + tzOffsetMinutes * 60 * 1000);

  const year = gmt7Date.getUTCFullYear();
  const month = String(gmt7Date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(gmt7Date.getUTCDate()).padStart(2, "0");
  const hours = String(gmt7Date.getUTCHours()).padStart(2, "0");
  const minutes = String(gmt7Date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(gmt7Date.getUTCSeconds()).padStart(2, "0");
  const millis = String(gmt7Date.getUTCMilliseconds()).padStart(3, "0");

  const iso = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${millis}+07:00`;
  const formatted = `${day}/${month}/${year} ${hours}:${minutes}:${seconds} (GMT+7)`;
  const timeOnly = `${hours}:${minutes}:${seconds} GMT+7`;

  return {
    iso,
    formatted,
    timeOnly,
    timestampMs: date.getTime(),
  };
}

const STORAGE_AUDIT_KEY = "THEODORE_AUDIT_LOGS_V1";
const MAX_LOCAL_LOGS = 500;

// Hàng đợi bộ nhớ đệm phục vụ batch sync lên Supabase
const pendingBatchQueue: any[] = [];
let batchFlushTimer: any = null;
let isFlushing = false;

export const AuditLogService = {
  /**
   * Lấy thông tin người dùng hiện tại từ LocalStorage / Auth Store
   */
  getCurrentUserInfo(): {
    userId: string | null;
    userEmail: string | null;
    userRole: string;
    userName: string | null;
  } {
    if (typeof window === "undefined") {
      return {
        userId: "system",
        userEmail: "system@elis.edu.vn",
        userRole: "system",
        userName: "Hệ Thống Máy Chủ",
      };
    }

    try {
      // Đọc từ Zustand persistent store
      const authRaw = localStorage.getItem("elis_auth_user");
      if (authRaw) {
        const parsed = JSON.parse(authRaw);
        const user = parsed?.state?.user || parsed?.user || parsed;
        if (user && user.email) {
          return {
            userId: user.id || null,
            userEmail: user.email || null,
            userRole: user.role || "learner",
            userName: user.fullName || user.displayName || user.username || user.email,
          };
        }
      }
    } catch {
      // Bỏ qua lỗi parse
    }

    return {
      userId: null,
      userEmail: null,
      userRole: "guest",
      userName: "Khách Vãng Lai (Guest)",
    };
  },

  /**
   * Định dạng và in log trực tiếp lên Browser DevTools Console
   */
  printToConsole(entry: AuditLogData, gmt7: FormattedGMT7Time) {
    if (typeof console === "undefined") return;

    const brandStyle =
      "background: #1e1b4b; color: #818cf8; font-weight: 900; font-size: 10px; padding: 2px 6px; border-radius: 3px; border: 1px solid #4338ca;";
    
    // Màu badge theo vai trò người dùng (Learner, Curator, Admin, Guest)
    let roleStyle = "background: #0284c7; color: #ffffff; font-weight: 800; font-size: 10px; padding: 2px 6px; border-radius: 3px;";
    const roleUpper = (entry.userRole || "GUEST").toUpperCase();
    if (roleUpper === "ADMIN") {
      roleStyle = "background: #7c3aed; color: #ffffff; font-weight: 900; font-size: 10px; padding: 2px 6px; border-radius: 3px;";
    } else if (roleUpper === "CURATOR") {
      roleStyle = "background: #d97706; color: #ffffff; font-weight: 800; font-size: 10px; padding: 2px 6px; border-radius: 3px;";
    } else if (roleUpper === "GUEST" || roleUpper === "ANONYMOUS") {
      roleStyle = "background: #475569; color: #e2e8f0; font-weight: 700; font-size: 10px; padding: 2px 6px; border-radius: 3px;";
    }

    const timeStyle =
      "background: #064e3b; color: #34d399; font-weight: 700; font-size: 10px; padding: 2px 6px; border-radius: 3px;";

    const catStyle =
      "color: #6366f1; font-weight: 700; font-size: 11px;";

    const actionStyle =
      "color: #0f172a; font-weight: 800; font-size: 11px;";

    const pathStyle =
      "color: #64748b; font-size: 10px;";

    const header = `%cELIS AUDIT%c %c${roleUpper}%c %c${gmt7.timeOnly}%c %c[${entry.category}]%c %c${entry.action}%c %c${entry.path || ""}`;

    const userLabel = `${entry.userName || "Khách"} (${entry.userEmail || "anonymous"})`;
    const payloadHasData = Boolean(entry.details && Object.keys(entry.details).length > 0);

    console.groupCollapsed(
      header,
      brandStyle,
      "",
      roleStyle,
      "",
      timeStyle,
      "",
      catStyle,
      "",
      actionStyle,
      "",
      pathStyle
    );

    console.log("%c👤 Người thực hiện:", "color: #3b82f6; font-weight: bold;", userLabel);
    console.log("%c🕒 Thời gian GMT+7:", "color: #10b981; font-weight: bold;", gmt7.formatted);
    console.log("%c📍 Vị trí màn hình:", "color: #8b5cf6; font-weight: bold;", entry.path || window?.location?.pathname);
    if (entry.component) {
      console.log("%c🧩 Thành phần UI:", "color: #ec4899; font-weight: bold;", entry.component);
    }
    if (payloadHasData) {
      console.log("%c📦 Chi tiết hành động (Payload):", "color: #d97706; font-weight: bold;", entry.details);
    }
    console.log("%c🌐 Trình duyệt:", "color: #64748b;", navigator?.userAgent || "browser");
    console.groupEnd();
  },

  /**
   * Ghi nhận một hành vi vào Hệ thống Log Kiểm Toán
   */
  async logAction(data: AuditLogData): Promise<AuditLogData> {
    const now = new Date();
    const gmt7 = getGMT7Time(now);
    const currentUser = this.getCurrentUserInfo();

    const record: AuditLogData = {
      id: data.id || `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId: data.userId !== undefined ? data.userId : currentUser.userId,
      userEmail: data.userEmail !== undefined ? data.userEmail : currentUser.userEmail,
      userRole: data.userRole || currentUser.userRole,
      userName: data.userName !== undefined ? data.userName : currentUser.userName,
      action: data.action,
      category: data.category,
      path: data.path || (typeof window !== "undefined" ? window.location.pathname : "/"),
      component: data.component || "UnknownComponent",
      details: data.details || {},
      status: data.status || "SUCCESS",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Node.js",
      createdAt: now.toISOString(),
      createdAtGmt7: gmt7.iso,
    };

    // 1. In lên Console Web DevTools với màu sắc và múi giờ GMT+7
    if (!data.skipConsole) {
      this.printToConsole(record, gmt7);
    }

    // 2. Lưu trữ xoay vòng vào LocalStorage để xem ngoại tuyến hoặc fallback
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const stored = localStorage.getItem(STORAGE_AUDIT_KEY);
        const list: AuditLogData[] = stored ? JSON.parse(stored) : [];
        list.unshift(record);
        if (list.length > MAX_LOCAL_LOGS) list.pop();
        localStorage.setItem(STORAGE_AUDIT_KEY, JSON.stringify(list));
      } catch {
        // Bỏ qua lỗi quota
      }
    }

    // 3. Đưa vào hàng đợi để gửi lên Supabase
    this.enqueueForSupabase(record);

    return record;
  },

  /**
   * Đưa bản ghi vào hàng đợi ghi Supabase (Batching 800ms để tối ưu kết nối)
   */
  enqueueForSupabase(record: AuditLogData) {
    const supabasePayload = {
      user_id: record.userId || null,
      user_email: record.userEmail || null,
      user_role: record.userRole || "guest",
      user_name: record.userName || null,
      action: record.action,
      category: record.category,
      path: record.path || null,
      component: record.component || null,
      details: record.details || {},
      status: record.status || "SUCCESS",
      user_agent: record.userAgent || null,
      created_at: record.createdAt,
      created_at_gmt7: record.createdAtGmt7,
    };

    pendingBatchQueue.push(supabasePayload);

    // Nếu các hành động đặc biệt quan trọng (Đăng nhập, Tải tài liệu, Thẩm định), flush ngay lập tức
    const highPriorityActions = [
      "UPLOAD_MATERIAL",
      "START_EXTRACTION",
      "CURATOR_APPROVE",
      "CURATOR_REJECT",
      "USER_LOGIN",
      "USER_LOGOUT",
      "FEYNMAN_TRIAL_MASTERED",
    ];

    if (highPriorityActions.includes(record.action)) {
      this.flushQueueToSupabase();
      return;
    }

    // Với các hành động thông thường (Click, Navigation), gom lại gửi sau 800ms
    if (batchFlushTimer) clearTimeout(batchFlushTimer);
    batchFlushTimer = setTimeout(() => {
      this.flushQueueToSupabase();
    }, 800);
  },

  /**
   * Đồng bộ hàng đợi lên bảng `audit_logs` trên Supabase
   */
  async flushQueueToSupabase() {
    if (isFlushing || pendingBatchQueue.length === 0) return;
    isFlushing = true;

    const batch = pendingBatchQueue.splice(0, pendingBatchQueue.length);

    try {
      const client = supabaseAdmin || supabase;
      const { error } = await client.from("audit_logs").insert(batch);

      if (error) {
        // Nếu bảng chưa có trong schema cache hoặc chưa chạy migration, ghi nhận cảnh báo thân thiện
        if (error.message.includes("Could not find the table") || error.code === "42P01") {
          // Bảng audit_logs chưa tạo trên Supabase, dữ liệu vẫn được bảo toàn an toàn trong localStorage
        } else {
          console.warn("[ELIS AUDIT] Cảnh báo đồng bộ Supabase:", error.message);
        }
      }
    } catch (err: any) {
      // Không để lỗi mạng của log làm gián đoạn người dùng
    } finally {
      isFlushing = false;
    }
  },

  /**
   * Lấy danh sách log gần đây từ LocalStorage và Supabase
   */
  async getRecentLogs(limit: number = 100): Promise<AuditLogData[]> {
    // 1. Thử lấy từ Supabase
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          userEmail: d.user_email,
          userRole: d.user_role,
          userName: d.user_name,
          action: d.action,
          category: d.category,
          path: d.path,
          component: d.component,
          details: d.details,
          status: d.status,
          userAgent: d.user_agent,
          createdAt: d.created_at,
          createdAtGmt7: d.created_at_gmt7,
        }));
      }
    } catch {}

    // 2. Fallback sang LocalStorage
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const stored = localStorage.getItem(STORAGE_AUDIT_KEY);
        if (stored) {
          const list: AuditLogData[] = JSON.parse(stored);
          return list.slice(0, limit);
        }
      } catch {}
    }

    return [];
  },

  /**
   * Xóa sạch log trong bộ nhớ đệm
   */
  clearLocalLogs() {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem(STORAGE_AUDIT_KEY);
    }
    pendingBatchQueue.length = 0;
    console.log("%c[ELIS AUDIT] Đã dọn dẹp sạch nhật ký cục bộ.", "color: #10b981; font-weight: bold;");
  },
};

// Đăng ký tiện ích tra cứu trực tiếp trên Browser DevTools Console
if (typeof window !== "undefined") {
  (window as any).__ELIS_AUDIT__ = {
    getLogs: (limit: number = 50) => AuditLogService.getRecentLogs(limit),
    printTable: async (limit: number = 25) => {
      const logs = await AuditLogService.getRecentLogs(limit);
      const tableData = logs.map((l) => ({
        "GMT+7 Time": l.createdAtGmt7 ? l.createdAtGmt7.split("T")[1]?.slice(0, 8) + " +07" : "-",
        Role: (l.userRole || "GUEST").toUpperCase(),
        User: l.userEmail || l.userName || "anonymous",
        Category: l.category,
        Action: l.action,
        Path: l.path || "-",
        Status: l.status,
      }));
      console.table(tableData);
      return `Hiển thị ${logs.length} bản ghi kiểm toán gần nhất (Múi giờ GMT+7)`;
    },
    exportJSON: async () => {
      const logs = await AuditLogService.getRecentLogs(200);
      const str = JSON.stringify(logs, null, 2);
      console.log(str);
      return str;
    },
    flush: () => AuditLogService.flushQueueToSupabase(),
    clear: () => AuditLogService.clearLocalLogs(),
    help: () => {
      console.log(
        "%c[ELIS AUDIT SYSTEM - MÚI GIỜ GMT+7] Hướng dẫn tra cứu trong DevTools Console:",
        "background: #1e1b4b; color: #818cf8; font-weight: bold; padding: 3px 8px; border-radius: 4px;"
      );
      console.log("👉 %c__ELIS_AUDIT__.printTable(limit?)%c : In bảng console.table các thao tác kèm giờ GMT+7", "color: #3b82f6; font-weight: bold;", "");
      console.log("👉 %c__ELIS_AUDIT__.getLogs(limit?)%c : Lấy danh sách Object bản ghi nhật ký", "color: #3b82f6; font-weight: bold;", "");
      console.log("👉 %c__ELIS_AUDIT__.exportJSON()%c : Xuất toàn bộ log ra JSON", "color: #10b981; font-weight: bold;", "");
      console.log("👉 %c__ELIS_AUDIT__.flush()%c : Ép gửi toàn bộ log tồn đọng lên Supabase ngay lập tức", "color: #f59e0b; font-weight: bold;", "");
      console.log("👉 %c__ELIS_AUDIT__.clear()%c : Xóa bộ nhớ log cục bộ", "color: #ef4444; font-weight: bold;", "");
    },
  };
}

export default AuditLogService;
