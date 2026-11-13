/**
 * File: src/hooks/useGamificationStore.ts
 * Purpose: Persistent Zustand store for User Streaks, XP progression, and badges.
 * Stored in localStorage key: "theodore_gamification".
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  calculateStreak,
  calculateLevelFromXp,
  getTodayDateString,
  GamificationState,
  XP_REWARDS,
} from "../lib/algorithms/gamification";

interface GamificationStore extends GamificationState {
  recordSessionComplete: (clarityScore?: number) => { xpGained: number; newStreak: number };
  recordFlashcardReview: () => { xpGained: number };
  recordCustomCardCreate: () => { xpGained: number };
  syncStreak: () => void;
  getLevelDetails: () => ReturnType<typeof calculateLevelFromXp>;
  resetForUser: (streakCount?: number, totalXp?: number) => void;
}

export const useGamificationStore = create<GamificationStore>()(
  persist(
    (set, get) => ({
      streakCount: 0,
      lastActiveDate: null,
      totalXp: 0,
      currentLevel: 1,
      levelTitle: "Tập Sự Feynman",
      nextLevelXp: 250,
      sessionsCompleted: 0,
      flashcardsReviewed: 0,
      badgesUnlocked: [],

      resetForUser: (streakCount = 0, totalXp = 0) => {
        const levelInfo = calculateLevelFromXp(totalXp);
        set({
          streakCount,
          lastActiveDate: null,
          totalXp,
          currentLevel: levelInfo.level,
          levelTitle: levelInfo.title,
          nextLevelXp: levelInfo.nextLevelXp,
          sessionsCompleted: 0,
          flashcardsReviewed: 0,
          badgesUnlocked: [],
        });
      },

      syncStreak: () => {
        const { streakCount, lastActiveDate } = get();
        const { newStreak } = calculateStreak(streakCount, lastActiveDate);
        set({ streakCount: newStreak });
      },

      recordSessionComplete: (clarityScore = 85) => {
        const state = get();
        const { newStreak } = calculateStreak(state.streakCount, state.lastActiveDate);
        let xpGained = XP_REWARDS.COMPLETE_SESSION;
        if (clarityScore >= 80) {
          xpGained += XP_REWARDS.HIGH_CLARITY_BONUS;
        }

        const newTotalXp = state.totalXp + xpGained;
        const levelInfo = calculateLevelFromXp(newTotalXp);

        set({
          streakCount: newStreak,
          lastActiveDate: getTodayDateString(),
          totalXp: newTotalXp,
          currentLevel: levelInfo.level,
          levelTitle: levelInfo.title,
          nextLevelXp: levelInfo.nextLevelXp,
          sessionsCompleted: state.sessionsCompleted + 1,
        });

        return { xpGained, newStreak };
      },

      recordFlashcardReview: () => {
        const state = get();
        const xpGained = XP_REWARDS.REVIEW_FLASHCARD;
        const newTotalXp = state.totalXp + xpGained;
        const levelInfo = calculateLevelFromXp(newTotalXp);

        set({
          totalXp: newTotalXp,
          currentLevel: levelInfo.level,
          levelTitle: levelInfo.title,
          nextLevelXp: levelInfo.nextLevelXp,
          flashcardsReviewed: state.flashcardsReviewed + 1,
        });

        return { xpGained };
      },

      recordCustomCardCreate: () => {
        const state = get();
        const xpGained = XP_REWARDS.CREATE_CUSTOM_CARD;
        const newTotalXp = state.totalXp + xpGained;
        const levelInfo = calculateLevelFromXp(newTotalXp);

        set({
          totalXp: newTotalXp,
          currentLevel: levelInfo.level,
          levelTitle: levelInfo.title,
          nextLevelXp: levelInfo.nextLevelXp,
        });

        return { xpGained };
      },

      getLevelDetails: () => {
        return calculateLevelFromXp(get().totalXp);
      },
    }),
    {
      name: "theodore_gamification",
    }
  )
);

