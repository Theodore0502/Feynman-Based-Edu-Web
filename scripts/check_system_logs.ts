/**
 * Script: scripts/check_system_logs.ts
 * Purpose: Công cụ kiểm tra Nhật ký Hệ thống (System Log Inspector)
 * Cho phép xem chi tiết tất cả các log bắn lên hệ thống, kiểm tra lỗi, cảnh báo và đo lường thời gian xử lý.
 */

import fs from "fs";
import path from "path";

interface LogItem {
  id: string;
  timestamp: string;
  level: string;
  source: string;
  action: string;
  status: string;
  message: string;
  durationMs?: number;
  payload?: any;
  error?: any;
}

function checkLogs() {
  console.log("================================================================================");
  console.log("📋 THEODORE SYSTEM LOG INSPECTOR - KIỂM TRA NHẬT KÝ HỆ THỐNG");
  console.log("================================================================================\n");

  const logFilePath = path.resolve(process.cwd(), "logs/system_events.log");

  if (!fs.existsSync(logFilePath)) {
    console.log("ℹ️ Chưa có tệp logs/system_events.log. Hệ thống chưa kích hoạt hoặc log đang ở bộ nhớ.");
    return;
  }

  const content = fs.readFileSync(logFilePath, "utf-8").trim();
  if (!content) {
    console.log("ℹ️ Tệp log trống.");
    return;
  }

  const lines = content.split("\n").filter(Boolean);
  const logs: LogItem[] = [];

  for (const line of lines) {
    try {
      logs.push(JSON.parse(line));
    } catch {}
  }

  console.log(`📊 Tổng số bản ghi log: ${logs.length}`);
  const errorLogs = logs.filter((l) => l.level === "ERROR" || l.status === "FAILURE");
  const warnLogs = logs.filter((l) => l.level === "WARN");
  const infoLogs = logs.filter((l) => l.level === "INFO");

  console.log(`   • INFO:    ${infoLogs.length}`);
  console.log(`   • WARNING: ${warnLogs.length}`);
  console.log(`   • ERROR:   ${errorLogs.length}\n`);

  if (errorLogs.length > 0) {
    console.log("🚨 DANH SÁCH LỖI PHÁT HIỆN:");
    errorLogs.forEach((err, i) => {
      console.log(`   ${i + 1}. [${err.timestamp}] [${err.source}:${err.action}] ${err.message}`);
      if (err.error) {
        console.log(`      Chi tiết: ${err.error.message || JSON.stringify(err.error)}`);
      }
    });
    console.log();
  } else {
    console.log("✅ Không phát hiện bất kỳ lỗi nghiêm trọng (ERROR) nào trong hệ thống!\n");
  }

  console.log("⏱️ CÁC SỰ KIỆN GẦN NHẤT (Top 15):");
  logs.slice(-15).reverse().forEach((l, i) => {
    const icon = l.level === "ERROR" ? "❌" : l.level === "WARN" ? "⚠️" : "✅";
    const duration = l.durationMs ? ` (${l.durationMs}ms)` : "";
    console.log(`   ${icon} [${l.timestamp.slice(11, 19)}] [${l.source}] ${l.action}: ${l.message}${duration}`);
  });

  console.log("\n================================================================================");
}

checkLogs();
