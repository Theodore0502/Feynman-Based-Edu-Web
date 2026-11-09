/**
 * File: src/lib/services/system-logger.ts
 * Purpose: Hệ thống Quản lý và Thu thập Log (System Logger) toàn diện cho Theodore Feynman Stage.
 * Chức năng:
 *   1. Ghi nhận log sự kiện có cấu trúc: Level (INFO, WARN, ERROR), Source, Action, Payload, Duration, Error.
 *   2. Lưu trữ xoay vòng (Ring buffer) trong bộ nhớ và đồng bộ localStorage (Client).
 *   3. Ghi tệp nhật ký logs/system_events.log (Server/Node.js).
 *   4. Cung cấp API truy vấn log theo nguồn, lọc theo lỗi và xuất báo cáo chẩn đoán hệ thống.
 */

// Khởi tạo dynamic import cho môi trường Node.js (tránh Vite warning trên browser)
let nodeFs: any = null;
let nodePath: any = null;
if (typeof window === "undefined" && typeof process !== "undefined") {
  import("fs").then((m) => { nodeFs = m.default || m; }).catch(() => {});
  import("path").then((m) => { nodePath = m.default || m; }).catch(() => {});
}

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

    // 2. Xuất console chuẩn
    const prefix = `[${fullEntry.timestamp}] [${fullEntry.level}] [${fullEntry.source}:${fullEntry.action}]`;
    if (fullEntry.level === "ERROR") {
      console.error(`${prefix} ❌ ${fullEntry.message}`, fullEntry.error || fullEntry.payload || "");
    } else if (fullEntry.level === "WARN") {
      console.warn(`${prefix} ⚠️ ${fullEntry.message}`, fullEntry.payload || "");
    } else {
      console.log(`${prefix} ✅ ${fullEntry.message}`);
    }

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

    // 4. Ghi file logs/system_events.log nếu ở môi trường Node.js
    if (typeof process !== "undefined" && process.cwd && (nodeFs || typeof require !== "undefined")) {
      try {
        const fsMod = nodeFs || require("fs");
        const pathMod = nodePath || require("path");
        const logsDir = pathMod.resolve(process.cwd(), "logs");
        if (!fsMod.existsSync(logsDir)) {
          fsMod.mkdirSync(logsDir, { recursive: true });
        }
        const logFilePath = pathMod.join(logsDir, "system_events.log");
        const logLine = JSON.stringify(fullEntry) + "\n";
        fsMod.appendFileSync(logFilePath, logLine, "utf-8");
      } catch {
        // Tránh làm gián đoạn luồng chính nếu không ghi được file
      }
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
  },
};
