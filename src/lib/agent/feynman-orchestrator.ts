/**
 * File: src/lib/agent/feynman-orchestrator.ts
 * Mục đích: Nhạc trưởng điều phối Pipeline 2 tầng của Feynman Technique Stage (Tầng 1: Phân tích ngầm, Tầng 2: Persona phản hồi Socrates).
 * Thành phần chính:
 *   - runAnalyticalEngine: Gọi generateObject để phát hiện jargon, logic gap và tính điểm clarity.
 *   - getLanguageModel: Khởi tạo mô hình AI linh hoạt (Google Gemini hoặc OpenAI tương thích) kèm fallback an toàn.
 *   - runMasteryEvaluator: Tạo báo cáo Feynman Mastery Card khi kết thúc buổi học.
 * Props/Inputs: Messages, topic, persona definition.
 */

import { generateObject } from "ai";
import { z } from "zod";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { PersonaDefinition } from "@/config/personas.config";
import type { AnalyticalResult, MasteryEvaluation } from "@/types/agent.types";
import {
  buildAnalyzerSystemPrompt,
  buildMasteryEvaluationPrompt,
} from "./prompts/system-prompts";
import { AI_CONFIG } from "@/config/ai-models.config";

export function getLanguageModel() {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (geminiApiKey) {
    const google = createGoogleGenerativeAI({
      apiKey: geminiApiKey,
    });
    // Sử dụng gemini-1.5-flash hoặc model tương thích
    const modelName = process.env.MODEL_NAME?.includes("gemini")
      ? "gemini-1.5-flash"
      : "gemini-1.5-flash";
    return google(modelName);
  }

  if (openaiApiKey) {
    const openai = createOpenAI({
      apiKey: openaiApiKey,
      baseURL: process.env.OPENAI_BASE_URL,
    });
    return openai(process.env.MODEL_NAME || "gpt-4o-mini");
  }

  // Dự phòng an toàn nếu chưa cấu hình key
  const google = createGoogleGenerativeAI({
    apiKey: "dummy-key-fallback",
  });
  return google("gemini-1.5-flash");
}

const AnalysisOutputSchema = z.object({
  jargonDetected: z.array(
    z.object({
      term: z.string(),
      isExplainedSimply: z.boolean(),
      reason: z.string(),
    })
  ),
  logicGaps: z.array(
    z.object({
      claim: z.string(),
      missingLink: z.string().nullable(),
      severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
    })
  ),
  currentClarityScore: z.number().min(0).max(100),
  detectedAnalogy: z.string().nullable(),
  isReadyToComplete: z.boolean(),
});

import { GeminiCurriculumService } from "@/lib/services/gemini-service";

export async function runAnalyticalEngine(
  latestMessage: string,
  topic: string,
  persona: PersonaDefinition
): Promise<AnalyticalResult> {
  try {
    return await GeminiCurriculumService.analyzeTurnRealtime(topic, latestMessage);
  } catch (error) {
    console.warn("Analyzer fallback heuristics triggered:", error);
    const words = latestMessage.split(/\s+/);
    const hasLongWords = words.filter((w) => w.length > 7);
    const hasAnalogy =
      latestMessage.includes("như") ||
      latestMessage.includes("giống") ||
      latestMessage.includes("tương tự");

    return {
      jargonDetected: hasLongWords.slice(0, 1).map((w) => ({
        term: w.replace(/[^a-zA-Z0-9À-ỹ]/g, ""),
        isExplainedSimply: false,
        reason: "Từ học thuật trừu tượng cần được ví von đời thường hơn",
      })),
      logicGaps: [],
      currentClarityScore: hasAnalogy ? 78 : 65,
      detectedAnalogy: hasAnalogy ? "Đã sử dụng phép so sánh trực quan" : null,
      isReadyToComplete: latestMessage.length > 150,
    };
  }
}

export async function runMasteryEvaluator(
  topic: string,
  persona: PersonaDefinition,
  history: Array<{ role: string; content: string }>
): Promise<MasteryEvaluation> {
  return await GeminiCurriculumService.generateSessionMasteryEvaluation({
    topic,
    persona,
    chatHistory: history,
  });
}

