/**
 * File: src/config/ai-models.config.ts
 * Mục đích: Lưu trữ cấu hình tham số AI Models, nhiệt độ (temperature) cho Tầng 1 (Analyzer) và Tầng 2 (Persona).
 * Thành phần chính:
 *   - AI_CONFIG: Cấu hình mặc định.
 * Props/Inputs: Cấu hình tĩnh.
 */

export const AI_CONFIG = {
  // Tầng 1: Phân tích logic & jargon cần chính xác, ít ngẫu hứng
  ANALYZER: {
    model: process.env.MODEL_NAME || "gemini-1.5-flash",
    temperature: 0.1,
    maxTokens: 800,
  },
  // Tầng 2: Persona phản hồi cần tự nhiên, mang tính cách socratic
  PERSONA: {
    model: process.env.MODEL_NAME || "gemini-1.5-flash",
    temperature: 0.6,
    maxTokens: 500,
  },
  // Tầng gợi ý ẩn dụ (Analogy)
  HINT: {
    model: process.env.MODEL_NAME || "gemini-1.5-flash",
    temperature: 0.7,
    maxTokens: 600,
  }
};

