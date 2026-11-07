/**
 * File: src/lib/algorithms/gamification.ts
 * Purpose: Deterministic mathematical gamification engine for the Feynman Technique Stage.
 * Computes daily streaks based on calendar dates (UTC/Local), XP progression,
 * level tiers (Tập sự -> Hiền triết), and clarity badges without any AI or external latency.
 */

export interface GamificationState {
  streakCount: number;
  lastActiveDate: string | null; // YYYY-MM-DD
  totalXp: number;
  currentLevel: number;
  levelTitle: string;
  nextLevelXp: number;
  sessionsCompleted: number;
  flashcardsReviewed: number;
  badgesUnlocked: string[];
}

export interface LevelThreshold {
  level: number;
  title: string;
  minXp: number;
  maxXp: number;
}

export const LEVEL_TIERS: LevelThreshold[] = [
  { level: 1, title: "Tập Sự Feynman", minXp: 0, maxXp: 250 },
  { level: 2, title: "Biết Dùng Ẩn Dụ", minXp: 250, maxXp: 700 },
  { level: 3, title: "Người Hướng Dẫn", minXp: 700, maxXp: 1500 },
  { level: 4, title: "Bậc Thầy Feynman", minXp: 1500, maxXp: 3000 },
  { level: 5, title: "Hiền Triết Đa Ngành", minXp: 3000, maxXp: 10000 },
];

export const XP_REWARDS = {
  COMPLETE_SESSION: 100,
  HIGH_CLARITY_BONUS: 50, // >= 80%
  REVIEW_FLASHCARD: 25,
  CREATE_CUSTOM_CARD: 35,
  DAILY_STREAK_BONUS: 40,
};

/**
 * Returns today's date formatted as YYYY-MM-DD
 */
export function getTodayDateString(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Calculates calendar day difference between two YYYY-MM-DD dates
 */
export function getDaysDifference(dateStrA: string, dateStrB: string): number {
  const [y1, m1, d1] = dateStrA.split("-").map(Number);
  const [y2, m2, d2] = dateStrB.split("-").map(Number);
  
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((utc2 - utc1) / msPerDay);
}

/**
 * Pure function: Calculates new streak based on last active date and today's date.
 * - Same day: streak maintained
 * - Next day (diff = 1): streak incremented +1
 * - Broken streak (diff > 1): streak reset to 1
 * - First time (lastDate is null): streak = 1
 */
export function calculateStreak(
  currentStreak: number,
  lastActiveDate: string | null,
  todayStr = getTodayDateString()
): { newStreak: number; streakIncremented: boolean; isFirstToday: boolean } {
  if (!lastActiveDate) {
    return { newStreak: 1, streakIncremented: true, isFirstToday: true };
  }

  const diff = getDaysDifference(lastActiveDate, todayStr);

  if (diff === 0) {
    // Already logged activity today
    return { newStreak: Math.max(1, currentStreak), streakIncremented: false, isFirstToday: false };
  } else if (diff === 1) {
    // Consecutive day
    return { newStreak: currentStreak + 1, streakIncremented: true, isFirstToday: true };
  } else {
    // Gap >= 2 days -> streak broken, restart at 1
    return { newStreak: 1, streakIncremented: false, isFirstToday: true };
  }
}

/**
 * Computes level, title, and progress percentage from total XP
 */
export function calculateLevelFromXp(totalXp: number): {
  level: number;
  title: string;
  progressPercent: number;
  nextLevelXp: number;
} {
  const currentTier =
    LEVEL_TIERS.find((t) => totalXp >= t.minXp && totalXp < t.maxXp) ||
    LEVEL_TIERS[LEVEL_TIERS.length - 1];

  const range = currentTier.maxXp - currentTier.minXp;
  const currentInTier = Math.max(0, totalXp - currentTier.minXp);
  const progressPercent = Math.min(100, Math.round((currentInTier / range) * 100));

  return {
    level: currentTier.level,
    title: currentTier.title,
    progressPercent,
    nextLevelXp: currentTier.maxXp,
  };
}

