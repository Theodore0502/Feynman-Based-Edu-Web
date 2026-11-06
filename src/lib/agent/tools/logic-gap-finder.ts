/**
 * File: src/lib/agent/tools/logic-gap-finder.ts
 * Mục đích: Định nghĩa schema Zod phát hiện các bước nhảy vọt tư duy hoặc thiếu liên kết nguyên nhân - kết quả.
 * Thành phần chính:
 *   - LogicGapSchema: Zod schema cho lỗ hổng tư duy.
 * Props/Inputs: Zod validation schemas.
 */

import { z } from "zod";

export const LogicGapItemSchema = z.object({
  claim: z.string().describe("Ý kiến hoặc mệnh đề người học vừa nêu"),
  missingLink: z.string().nullable().describe("Khâu logic trung gian bị bỏ qua hoặc chưa giải thích vì sao"),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]).describe("Mức độ nghiêm trọng của bước nhảy cóc"),
});

export const LogicGapListSchema = z.object({
  gaps: z.array(LogicGapItemSchema),
});

export type LogicGapListType = z.infer<typeof LogicGapListSchema>;

