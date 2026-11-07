/**
 * File: src/types/ai-config.types.ts
 * Mục đích: Định nghĩa kiểu dữ liệu cho phân hệ Cài Đặt AI & Quản Lý System Prompts (Table 14: ai_system_prompts).
 */

export type PromptCategory = "PERSONA" | "EVALUATOR" | "SOCRATIC" | "SYSTEM";

export type AIModelType =
  | "gemini-1.5-flash"
  | "gemini-1.5-pro"
  | "gpt-4o"
  | "gpt-4o-mini"
  | "claude-3-5-sonnet";

export interface AIModelParameters {
  model: AIModelType;
  temperature: number; // 0.0 - 1.0 (sáng tạo vs chính xác)
  max_tokens: number; // 256 - 4096
  top_p: number; // 0.1 - 1.0
  skepticism_level?: number; // 1 - 10 (độ hoài nghi / vặn vẹo)
}

export interface AIPromptConfig {
  id: string; // e.g. "prompt-child-10yo"
  prompt_key: string; // e.g. "PERSONA_CHILD_10YO"
  title: string; // "Bé Bắp 10 tuổi (ELI5)"
  category: PromptCategory;
  description: string;
  system_prompt: string;
  parameters: AIModelParameters;
  is_active: boolean;
  version: number;
  updated_at: string;
}

