/**
 * File: src/lib/algorithms/sm2.ts
 * Mục đích: Cài đặt thuật toán lặp lại ngắt quãng SuperMemo SM-2 (Spaced Repetition Algorithm) thuần toán học, tối ưu đường cong quên lãng (Forgetting Curve) của Ebbinghaus.
 * Công thức:
 *   - Quality (q) ∈ [0, 5]: Đánh giá mức độ nhớ của người học.
 *   - Ease Factor (EF'): EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)), tối thiểu EF' = 1.3.
 *   - Khoảng cách ngày ôn tiếp theo (Interval - I):
 *       Nếu q < 3: n = 0, I = 1 ngày (lặp lại từ đầu).
 *       Nếu q ≥ 3:
 *           Lần 1 (n = 0): I = 1 ngày.
 *           Lần 2 (n = 1): I = 6 ngày.
 *           Lần n (n ≥ 2): I = round(I_prev * EF').
 *           n = n + 1.
 * Props/Inputs: Quality grade, trạng thái trước đó của thẻ.
 */

export interface SM2State {
  repetitions: number; // Số lần ôn thành công liên tiếp (n)
  intervalDays: number; // Khoảng cách tới ngày ôn tiếp theo (I)
  easeFactor: number; // Hệ số độ dễ (EF), mặc định 2.5
  nextReviewAt: string; // Chuỗi ISO ngày cần ôn lại tiếp theo
  masteryLevel: number; // Cấp độ tinh thông quy đổi: 1 - 5
}

export interface SM2EvaluationResult extends SM2State {
  grade: number; // Điểm đánh giá (0 - 5)
  isDue: boolean;
  intervalLabel: string; // Nhãn mô tả thân thiện (VD: "Sau 1 ngày", "Sau 6 ngày")
}

export const DEFAULT_SM2_STATE: SM2State = {
  repetitions: 0,
  intervalDays: 1,
  easeFactor: 2.5,
  nextReviewAt: new Date().toISOString(),
  masteryLevel: 1,
};

/**
 * Tính toán trạng thái SM-2 tiếp theo sau khi người dùng đánh giá thẻ.
 * @param grade Điểm tự đánh giá từ 0 đến 5 (0: Quên sạch, 3: Nhớ nhưng khó khăn, 5: Nhớ hoàn hảo)
 * @param prevState Trạng thái hiện tại của thẻ (hoặc khởi tạo mặc định)
 */
export function calculateSM2(grade: number, prevState?: Partial<SM2State>): SM2EvaluationResult {
  const q = Math.max(0, Math.min(5, Math.round(grade)));
  const prevReps = prevState?.repetitions ?? 0;
  const prevInterval = prevState?.intervalDays ?? 1;
  const prevEF = prevState?.easeFactor ?? 2.5;

  let newEF = prevEF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (newEF < 1.3) newEF = 1.3;

  let newReps = 0;
  let newInterval = 1;

  if (q < 3) {
    // Quên hoặc sai: Đặt lại chu kỳ về ban đầu (1 ngày)
    newReps = 0;
    newInterval = 1;
  } else {
    // Nhớ thành công (q >= 3): Tăng tiến độ ôn tập
    if (prevReps === 0) {
      newInterval = 1;
    } else if (prevReps === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(prevInterval * newEF);
    }
    newReps = prevReps + 1;
  }

  // Tính ngày ôn tiếp theo
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + newInterval);

  // Quy đổi masteryLevel (1 đến 5 sao)
  let masteryLevel = 1;
  if (newInterval >= 21) masteryLevel = 5;
  else if (newInterval >= 10) masteryLevel = 4;
  else if (newInterval >= 5) masteryLevel = 3;
  else if (newInterval >= 2) masteryLevel = 2;
  else masteryLevel = 1;

  let intervalLabel = "Ngày mai";
  if (newInterval > 1) {
    intervalLabel = `Sau ${newInterval} ngày`;
  }

  return {
    repetitions: newReps,
    intervalDays: newInterval,
    easeFactor: Number(newEF.toFixed(2)),
    nextReviewAt: nextDate.toISOString(),
    masteryLevel,
    grade: q,
    isDue: false,
    intervalLabel,
  };
}

/**
 * Kiểm tra xem thẻ đã đến hạn cần ôn tập hay chưa (Due check)
 */
export function isCardDue(nextReviewAt?: string): boolean {
  if (!nextReviewAt) return true;
  const dueDate = new Date(nextReviewAt);
  const now = new Date();
  return dueDate <= now;
}

/**
 * Định dạng nhãn hiển thị khoảng cách ngày thân thiện
 */
export function formatNextReviewLabel(nextReviewAt?: string): { text: string; isDue: boolean; colorClass: string } {
  if (!nextReviewAt) {
    return { text: "Cần ôn ngay", isDue: true, colorClass: "text-rose-600 bg-rose-50 border-rose-200" };
  }

  const dueDate = new Date(nextReviewAt);
  const now = new Date();
  const diffTime = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return { text: "Cần ôn hôm nay", isDue: true, colorClass: "text-rose-600 bg-rose-50 border-rose-200" };
  } else if (diffDays === 1) {
    return { text: "Ôn vào ngày mai", isDue: false, colorClass: "text-amber-600 bg-amber-50 border-amber-200" };
  } else {
    return { text: `Ôn sau ${diffDays} ngày`, isDue: false, colorClass: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  }
}

