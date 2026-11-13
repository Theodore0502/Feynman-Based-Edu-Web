/**
 * File: src/lib/services/system-logger.ts
 * Purpose: Hệ thống Quản lý và Thu thập Log (System Logger) toàn diện cho Theodore Feynman Stage.
 * Chức năng:
 *   1. Ghi nhận log sự kiện có cấu trúc: Level (DEBUG, INFO, WARN, ERROR), Source, Action, Payload, Duration, Error.
 *   2. Xuất log trực quan, có badge màu sắc và nhóm collapsible trực tiếp lên DevTools Console trình duyệt.
 *   3. Cung cấp tiện ích toàn cục window.__ELIS_LOGS__ trên DevTools để tra cứu, in bảng console.table và xuất JSON.
 *   4. Lưu trữ xoay vòng (Ring buffer) trong bộ nhớ và đồng bộ localStorage (Client).
 *   5. Hỗ trợ ghi tệp nhật ký logs/system_events.log trong môi trường Node.js (nếu có).
 */

import { AuditLogService } from "./audit-log-service";

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

export type LogSource =
  | "AGENT_EXTRACTION"
  | "TAXONOMY_CLASSIFIER"
  | "GEMINI_LLM_SERVICE"
  | "FILE_PARSER"
  | "SEMANTIC_CHUNKER"
  | "ONTOLOGY_PROJECTOR"
  | "SUPABASE_CLIENT"
  | "CURATOR_HUB"
  | "LIVE_TRIAL"
  | "FEYNMAN_STAGE"
  | "TOPIC_GRAPH"
  | "CURRICULUM"
  | "SYSTEM";

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: LogSource;
  action: string;
  status: "SUCCESS" | "FAILURE" | "PENDING";
  message: string;
  durationMs?: number;
  payload?: any;
  error?: {
    name?: string;
    message: string;
    stack?: string;
  };
}

const MAX_MEMORY_LOGS = 300;
const memoryLogs: SystemLogEntry[] = [];
const STORAGE_LOG_KEY = "THEODORE_SYSTEM_LOGS_V1";

export const SystemLogger = {
  /**
   * Định dạng và in log trực tiếp lên Browser DevTools Console với style CSS trực quan
   */
  _printToBrowserConsole(entry: SystemLogEntry) {
    if (typeof console === "undefined") return;

    const brandStyle = "background: #4f46e5; color: #ffffff; font-weight: 800; font-size: 10px; padding: 2px 6px; border-radius: 3px;";
    
    let levelStyle = "background: #0284c7; color: #ffffff; font-weight: 700; font-size: 10px; padding: 2px 5px; border-radius: 3px;";
    let icon = "ℹ️";

    if (entry.level === "ERROR") {
      levelStyle = "background: #ef4444; color: #ffffff; font-weight: 800; font-size: 10px; padding: 2px 5px; border-radius: 3px;";
      icon = "❌";
    } else if (entry.level === "WARN") {
      levelStyle = "background: #f59e0b; color: #000000; font-weight: 800; font-size: 10px; padding: 2px 5px; border-radius: 3px;";
      icon = "⚠️";
    } else if (entry.level === "DEBUG") {
      levelStyle = "background: #64748b; color: #ffffff; font-weight: 600; font-size: 10px; padding: 2px 5px; border-radius: 3px;";
      icon = "🔍";
    } else {
      icon = "✅";
    }

    const sourceStyle = "color: #818cf8; font-weight: 700; font-size: 11px;";
    const timeStyle = "color: #94a3b8; font-size: 10px;";
    const msgStyle = "color: #1e293b; font-weight: 600; font-size: 11px;";

    const timeStr = entry.timestamp ? entry.timestamp.split("T")[1]?.slice(0, 8) || entry.timestamp : "";
    const durationTag = entry.durationMs != null ? ` (${entry.durationMs}ms)` : "";

    const header = `%cELIS%c %c${entry.level}%c %c[${entry.source}] ${entry.action}%c ${icon} ${entry.message}${durationTag} %c${timeStr}`;

    const hasDetails = Boolean(entry.payload !== undefined || entry.error);

    if (hasDetails) {
      if (entry.level === "ERROR") {
        console.group(header, brandStyle, "", levelStyle, "", sourceStyle, "", msgStyle, timeStyle);
      } else {
        console.groupCollapsed(header, brandStyle, "", levelStyle, "", sourceStyle, "", msgStyle, timeStyle);
      }
      if (entry.payload !== undefined) {
        console.log("%c📦 Chi tiết Payload:", "color: #6366f1; font-weight: bold;", entry.payload);
      }
      if (entry.error) {
        console.error("%c💥 Lỗi:", "color: #ef4444; font-weight: bold;", entry.error);
      }
      console.groupEnd();
    } else {
      if (entry.level === "ERROR") {
        console.error(header, brandStyle, "", levelStyle, "", sourceStyle, "", msgStyle, timeStyle);
      } else if (entry.level === "WARN") {
        console.warn(header, brandStyle, "", levelStyle, "", sourceStyle, "", msgStyle, timeStyle);
      } else {
        console.log(header, brandStyle, "", levelStyle, "", sourceStyle, "", msgStyle, timeStyle);
      }
    }
  },

  /**
   * Ghi log sự kiện
   */
  log(entry: Omit<SystemLogEntry, "id" | "timestamp">): SystemLogEntry {
    const fullEntry: SystemLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };

    // 1. Lưu vào Memory Ring Buffer
    memoryLogs.unshift(fullEntry);
    if (memoryLogs.length > MAX_MEMORY_LOGS) {
      memoryLogs.pop();
    }

    // 2. Xuất console DevTools với giao diện giàu định dạng
    this._printToBrowserConsole(fullEntry);

    // 3. Lưu vào LocalStorage nếu ở môi trường trình duyệt
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const stored = localStorage.getItem(STORAGE_LOG_KEY);
        const list: SystemLogEntry[] = stored ? JSON.parse(stored) : [];
        list.unshift(fullEntry);
        if (list.length > 200) list.pop();
        localStorage.setItem(STORAGE_LOG_KEY, JSON.stringify(list));
      } catch {
        // Bỏ qua lỗi quota storage
      }
    }

    // 4. Tự động đồng bộ lên Supabase qua AuditLogService kèm múi giờ GMT+7
    try {
      AuditLogService.logAction({
        action: fullEntry.action,
        category:
          fullEntry.source === "AGENT_EXTRACTION" || fullEntry.source === "CURATOR_HUB"
            ? "CURATION"
            : fullEntry.source === "FEYNMAN_STAGE" || fullEntry.source === "LIVE_TRIAL"
            ? "LEARNING"
            : fullEntry.level === "ERROR"
            ? "ERROR"
            : "SYSTEM",
        component: fullEntry.source,
        status: fullEntry.status === "FAILURE" ? "FAILED" : "SUCCESS",
        details: {
          message: fullEntry.message,
          payload: fullEntry.payload,
          error: fullEntry.error,
          durationMs: fullEntry.durationMs,
        },
      });
    } catch {
      // Đảm bảo không gián đoạn luồng
    }

    return fullEntry;
  },

  info(source: LogSource, action: string, message: string, payload?: any, durationMs?: number): SystemLogEntry {
    return this.log({
      level: "INFO",
      source,
      action,
      status: "SUCCESS",
      message,
      payload,
      durationMs,
    });
  },

  warn(source: LogSource, action: string, message: string, payload?: any): SystemLogEntry {
    return this.log({
      level: "WARN",
      source,
      action,
      status: "SUCCESS",
      message,
      payload,
    });
  },

  error(source: LogSource, action: string, message: string, err?: any, payload?: any, durationMs?: number): SystemLogEntry {
    const errorObj = err
      ? {
          name: err.name || "Error",
          message: err.message || String(err),
          stack: err.stack,
        }
      : undefined;

    return this.log({
      level: "ERROR",
      source,
      action,
      status: "FAILURE",
      message,
      error: errorObj,
      payload,
      durationMs,
    });
  },

  debug(source: LogSource, action: string, message: string, payload?: any): SystemLogEntry {
    return this.log({
      level: "DEBUG",
      source,
      action,
      status: "SUCCESS",
      message,
      payload,
    });
  },

  /**
   * Log chuyên biệt cho các lượt đối thoại trên Feynman Live Stage / Trial
   */
  liveTrialTurn(data: {
    turnIndex: number;
    userExplanation: string;
    assistantResponse: string;
    clarityScore: number;
    detectedAnalogy?: string | null;
    jargonDetected?: any[];
    logicGaps?: any[];
    telemetry?: any;
    isMastered?: boolean;
    masterySummary?: string;
  }): SystemLogEntry {
    const durationSeconds = data.telemetry?.durationSeconds ?? 0;
    const tokens = data.telemetry?.totalTokens ?? 0;
    const masteredTag = data.isMastered ? " 🏆 [THẤU SUỐT]" : "";

    const entry = this.info(
      "LIVE_TRIAL",
      `TURN_${data.turnIndex}`,
      `Lượt #${data.turnIndex} | Độ sáng: ${data.clarityScore}/100 | ${durationSeconds}s | ${tokens} tokens${masteredTag}`,
      data,
      data.telemetry?.durationMs
    );

    if (typeof console !== "undefined") {
      const isGood = data.clarityScore >= 80;
      const scoreBadge = isGood ? "background: #10b981; color: white;" : "background: #f59e0b; color: black;";
      console.groupCollapsed(
        `%c[FEYNMAN LIVE TRIAL]%c Lượt #${data.turnIndex} %c ${data.clarityScore}/100 %c ${durationSeconds}s (${tokens} tok)${masteredTag}`,
        "background: #8b5cf6; color: white; font-weight: bold; padding: 2px 5px; border-radius: 3px;",
        "font-weight: bold;",
        `${scoreBadge} font-weight: bold; padding: 1px 4px; border-radius: 3px;`,
        "color: #64748b;"
      );
      console.log("%c👤 Lời giải thích của người học:", "color: #3b82f6; font-weight: bold;", data.userExplanation);
      console.log("%c🤖 Phản hồi của khán giả AI:", "color: #10b981; font-weight: bold;", data.assistantResponse);
      if (data.detectedAnalogy) {
        console.log("%c💡 Ẩn dụ phát hiện:", "color: #059669; font-weight: bold;", data.detectedAnalogy);
      }
      if (data.jargonDetected && data.jargonDetected.length > 0) {
        console.warn("%c⚠️ Thuật ngữ chưa giải thích:", "color: #d97706; font-weight: bold;", data.jargonDetected);
      }
      if (data.logicGaps && data.logicGaps.length > 0) {
        console.warn("%c🧩 Lỗ hổng logic:", "color: #dc2626; font-weight: bold;", data.logicGaps);
      }
      if (data.isMastered) {
        console.log("%c🎉 THẤU SUỐT (MASTERED):", "color: #8b5cf6; font-weight: bold;", data.masterySummary || "Người học đã nắm vững kiến thức");
      }
      if (data.telemetry) {
        console.log("%c📊 Telemetry Metrics:", "color: #6366f1; font-weight: bold;", data.telemetry);
      }
      console.groupEnd();
    }

    return entry;
  },

  /**
   * Log chuyên biệt cho các cuộc gọi Gemini LLM API
   */
  geminiCall(data: {
    action: string;
    model: string;
    durationMs: number;
    tokens: { prompt: number; candidates: number; total: number };
    promptPreview?: string;
    responsePreview?: string;
    isFallback?: boolean;
    error?: any;
  }): SystemLogEntry {
    const isError = Boolean(data.error);
    const durationSeconds = (data.durationMs / 1000).toFixed(2);
    const msg = `${data.action} | Model: ${data.model} | ${data.tokens.total} tokens (${durationSeconds}s)`;

    if (isError) {
      return this.error("GEMINI_LLM_SERVICE", data.action, msg, data.error, data, data.durationMs);
    }
    return this.info("GEMINI_LLM_SERVICE", data.action, msg, data, data.durationMs);
  },

  /**
   * Log chuyên biệt cho các tương tác trên Cây Tri Thức (Topic Knowledge Graph)
   */
  graphEvent(action: string, message: string, payload?: any): SystemLogEntry {
    return this.info("TOPIC_GRAPH", action, message, payload);
  },

  /**
   * Lấy danh sách log gần nhất
   */
  getRecentLogs(limit: number = 50): SystemLogEntry[] {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const stored = localStorage.getItem(STORAGE_LOG_KEY);
        if (stored) return JSON.parse(stored).slice(0, limit);
      } catch {}
    }
    return memoryLogs.slice(0, limit);
  },

  /**
   * Lấy các log có lỗi để phân tích chẩn đoán hệ thống
   */
  getErrorLogs(): SystemLogEntry[] {
    return this.getRecentLogs(200).filter((l) => l.level === "ERROR" || l.status === "FAILURE");
  },

  /**
   * Xóa bộ nhớ log
   */
  clear() {
    memoryLogs.length = 0;
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem(STORAGE_LOG_KEY);
    }
    if (typeof console !== "undefined") {
      console.log("%c[ELIS LOGGER] Đã xóa sạch bộ nhớ log.", "color: #10b981; font-weight: bold;");
    }
  },
};

// Đăng ký tiện ích tra cứu trực tiếp trên Browser DevTools Console
if (typeof window !== "undefined") {
  (window as any).__ELIS_LOGS__ = {
    getAll: (limit: number = 100) => SystemLogger.getRecentLogs(limit),
    getErrors: () => SystemLogger.getErrorLogs(),
    clear: () => SystemLogger.clear(),
    printTable: (limit: number = 30) => {
      const logs = SystemLogger.getRecentLogs(limit).map((l) => ({
        Time: l.timestamp.split("T")[1]?.slice(0, 8),
        Level: l.level,
        Source: l.source,
        Action: l.action,
        Status: l.status,
        Message: l.message,
        Duration: l.durationMs != null ? `${l.durationMs}ms` : "-",
      }));
      console.table(logs);
      return `Hiển thị ${logs.length} bản ghi log gần nhất`;
    },
    exportJSON: () => {
      const json = JSON.stringify(SystemLogger.getRecentLogs(200), null, 2);
      console.log(json);
      return json;
    },
    help: () => {
      console.log(
        "%c[ELIS DEVTOOLS LOGGING SYSTEM] Các lệnh hỗ trợ tra cứu trong Console:",
        "background: #4f46e5; color: white; font-weight: bold; padding: 2px 6px; border-radius: 4px;"
      );
      console.log("👉 %c__ELIS_LOGS__.getAll(limit?)%c : Lấy mảng bản ghi log dạng object", "color: #3b82f6; font-weight: bold;", "");
      console.log("👉 %c__ELIS_LOGS__.printTable(limit?)%c : In bảng console.table trực quan", "color: #3b82f6; font-weight: bold;", "");
      console.log("👉 %c__ELIS_LOGS__.getErrors()%c : Lọc danh sách các log lỗi", "color: #ef4444; font-weight: bold;", "");
      console.log("👉 %c__ELIS_LOGS__.exportJSON()%c : Xuất toàn bộ log ra chuỗi JSON", "color: #10b981; font-weight: bold;", "");
      console.log("👉 %c__ELIS_LOGS__.clear()%c : Xóa sạch bộ nhớ log", "color: #f59e0b; font-weight: bold;", "");
    },
  };

  (window as any).__THEODORE_LOGGER__ = (window as any).__ELIS_LOGS__;

  // Tự động thông báo trên Browser DevTools Console khi khởi chạy
  console.log(
    "%c ELIS FEYNMAN STAGE %c Hệ thống DevTools Console Logger đã kích hoạt. Gõ %c__ELIS_LOGS__.help()%c để xem các lệnh tra cứu. ",
    "background: #4f46e5; color: white; font-weight: 800; font-size: 11px; padding: 3px 6px; border-radius: 4px 0 0 4px;",
    "background: #1e293b; color: #93c5fd; font-size: 11px; padding: 3px 6px; border-radius: 0 4px 4px 0;",
    "color: #fbbf24; font-weight: bold;",
    "color: inherit;"
  );
}

export default SystemLogger;
