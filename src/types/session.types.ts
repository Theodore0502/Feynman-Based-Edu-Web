/**
 * File: src/types/session.types.ts
 * Mục đích: Định nghĩa interface quản lý Phiên học Feynman, Lịch sử tin nhắn, Báo cáo và Kho thuật ngữ.
 * Thành phần chính:
 *   - FeynmanSession: Dữ liệu phiên giảng dạy hiện tại.
 *   - ChatMessage: Tin nhắn tương tác giữa người học và AI Persona.
 *   - ReportData: Cấu trúc báo cáo năng lực Feynman Mastery Card.
 *   - VaultRecord: Bản ghi từ vựng bình dân hóa trong kho lưu trữ.
 * Props/Inputs: Type definitions.
 */

import type { AnalyticalResult } from "./agent.types";

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  analysisMetadata?: AnalyticalResult | null;
  createdAt: string;
}

export interface FeynmanSession {
  id: string;
  topic: string;
  personaId: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  status: "ACTIVE" | "COMPLETED";
  clarityScore: number;
  createdAt: string;
  messages?: ChatMessage[];
  report?: ReportData | null;
}

export interface ReportData {
  id: string;
  sessionId: string;
  clarityScore: number;
  logicCompleteness: number;
  bestAnalogy?: string | null;
  knowledgeGaps: string[];
  summaryFeedback: string;
  createdAt: string;
}

export interface VaultRecord {
  id: string;
  term: string;
  plainExplanation: string;
  analogyUsed?: string | null;
  topic: string;
  createdAt: string;
  // SM-2 Spaced Repetition Fields
  masteryLevel?: number; // 1 - 5
  intervalDays?: number;
  repetitions?: number;
  easeFactor?: number;
  nextReviewAt?: string;
  lastReviewedAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  fieldOfStudy: string;
  streakCount: number;
}

