/**
 * File: src/lib/agent/tools/jargon-detector.ts
 * Mục đích: Định nghĩa schema Zod và hàm phân tích thuật ngữ chuyên ngành (Jargon Detector).
 * Thành phần chính:
 *   - JargonSchema: Zod schema cho mảng thuật ngữ.
 * Props/Inputs: Zod validation schemas.
 */

import { z } from "zod";

export const JargonItemSchema = z.object({
  term: z.string().describe("Thuật ngữ học thuật hoặc từ chuyên ngành phát hiện được"),
  isExplainedSimply: z.boolean().describe("true nếu người học đã giải thích bằng từ ngữ đời thường, false nếu dùng từ như hiển nhiên"),
  reason: z.string().describe("Lý do tại sao từ này khó hiểu với người nghe mục tiêu"),
});

export const JargonListSchema = z.object({
  jargons: z.array(JargonItemSchema),
});

export type JargonListType = z.infer<typeof JargonListSchema>;

