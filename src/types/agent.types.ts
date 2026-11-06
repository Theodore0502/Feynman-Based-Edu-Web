/**
 * File: src/types/agent.types.ts
 * Mục đích: Định nghĩa các kiểu dữ liệu và interface cho Tác nhân AI 2 tầng (Background Analytical Engine & Persona Stream) trong Feynman Technique Stage.
 * Thành phần chính:
 *   - JargonItem: Thông tin thuật ngữ chuyên ngành được phát hiện và trạng thái giải thích.
 *   - LogicGapItem: Bước nhảy vọt tư duy cần bổ sung liên kết nguyên nhân - kết quả.
 *   - AnalyticalResult: Kết quả phân tích ngầm của Tầng 1 (JargonDetector, LogicGapFinder, ClarityEvaluator).
 *   - MasteryEvaluation: Kết quả đánh giá thẻ điểm Feynman hoàn chỉnh.
 * Props/Inputs: Type definitions.
 */

export interface JargonItem {
  term: string;
  isExplainedSimply: boolean;
  reason: string;
}

export interface LogicGapItem {
  claim: string;
  missingLink: string | null;
  severity: "LOW" | "MEDIUM" | "HIGH";
}

export interface AnalyticalResult {
  jargonDetected: JargonItem[];
  logicGaps: LogicGapItem[];
  currentClarityScore: number;
  detectedAnalogy: string | null;
  isReadyToComplete: boolean;
}

export interface MasteryEvaluation {
  clarityScore: number;
  logicCompleteness: number;
  bestAnalogy: string;
  knowledgeGaps: string[];
  summaryFeedback: string;
  extractedVaultTerms: Array<{
    term: string;
    plainExplanation: string;
    analogyUsed?: string;
  }>;
}

export interface AnalogyHint {
  analogy: string;
  explanation: string;
  targetPersonaLens: string;
}

