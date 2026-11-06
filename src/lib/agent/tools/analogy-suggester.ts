/**
 * File: src/lib/agent/tools/analogy-suggester.ts
 * Mục đích: Schema Zod và gợi ý các phép ẩn dụ đời thường (Analogy Suggestions) bám sát lăng kính của Persona.
 * Thành phần chính:
 *   - AnalogySuggestionSchema: Zod schema cho 2 phép so sánh đời thường.
 * Props/Inputs: Zod validation schemas.
 */

import { z } from "zod";

export const AnalogyItemSchema = z.object({
  analogy: z.string().describe("Câu so sánh ẩn dụ ngắn gọn và gần gũi với đời sống"),
  explanation: z.string().describe("Cách áp dụng phép ẩn dụ này để giải thích khái niệm"),
  targetPersonaLens: z.string().describe("Lý do phép ẩn dụ này hợp với nhân vật người nghe"),
});

export const AnalogySuggestionSchema = z.object({
  suggestions: z.array(AnalogyItemSchema).min(1).max(3),
});

export type AnalogySuggestionType = z.infer<typeof AnalogySuggestionSchema>;

