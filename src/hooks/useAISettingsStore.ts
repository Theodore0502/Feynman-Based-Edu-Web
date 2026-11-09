/**
 * File: src/hooks/useAISettingsStore.ts
 * Mục đích: Zustand Store quản lý toàn bộ System Prompts và tham số suy luận LLM cho ứng dụng.
 * Hỗ trợ đồng bộ LocalStorage ('elise_ai_system_prompts') và khôi phục 1-click từ file backup chuẩn ('src/data/prompts-backup.json').
 */

import { create } from "zustand";
import { AIPromptConfig, AIModelParameters } from "@/types/ai-config.types";
import defaultPromptsBackup from "@/data/prompts-backup.json";

const STORAGE_KEY = "elis_ai_system_prompts";

interface AISettingsState {
  prompts: AIPromptConfig[];
  selectedPromptId: string;
  isSaving: boolean;
  searchQuery: string;
  activeCategory: string; // "ALL" | "PERSONA" | "EVALUATOR" | "SOCRATIC"

  // Actions
  setSelectedPromptId: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setActiveCategory: (category: string) => void;
  updatePrompt: (id: string, updates: Partial<AIPromptConfig>) => void;
  updateParameters: (id: string, params: Partial<AIModelParameters>) => void;
  resetToBackup: () => void;
  resetSinglePrompt: (id: string) => void;
  getPromptByKey: (promptKey: string) => AIPromptConfig | undefined;
  addNewPrompt: (category: AIPromptConfig["category"]) => string;
  deletePrompt: (id: string) => void;
}

const loadInitialPrompts = (): AIPromptConfig[] => {
  if (typeof window === "undefined") {
    return defaultPromptsBackup as AIPromptConfig[];
  }
  try {
    const cached = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("elise_ai_system_prompts");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Lỗi đọc prompts từ LocalStorage, dùng bản backup:", err);
  }
  return defaultPromptsBackup as AIPromptConfig[];
};

const persistPrompts = (prompts: AIPromptConfig[]) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
    } catch (e) {
      console.error("Lỗi lưu prompts vào LocalStorage:", e);
    }
  }
};

export const useAISettingsStore = create<AISettingsState>((set, get) => ({
  prompts: loadInitialPrompts(),
  selectedPromptId: loadInitialPrompts()[0]?.id || "prompt-child-10yo",
  isSaving: false,
  searchQuery: "",
  activeCategory: "ALL",

  setSelectedPromptId: (id: string) => set({ selectedPromptId: id }),

  setSearchQuery: (query: string) => set({ searchQuery: query }),

  setActiveCategory: (category: string) => set({ activeCategory: category }),

  updatePrompt: (id: string, updates: Partial<AIPromptConfig>) => {
    set((state) => {
      const updatedPrompts = state.prompts.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            ...updates,
            version: p.version + 1,
            updated_at: new Date().toISOString(),
          };
        }
        return p;
      });
      persistPrompts(updatedPrompts);
      return { prompts: updatedPrompts };
    });
  },

  updateParameters: (id: string, params: Partial<AIModelParameters>) => {
    set((state) => {
      const updatedPrompts = state.prompts.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            parameters: {
              ...p.parameters,
              ...params,
            },
            version: p.version + 1,
            updated_at: new Date().toISOString(),
          };
        }
        return p;
      });
      persistPrompts(updatedPrompts);
      return { prompts: updatedPrompts };
    });
  },

  resetToBackup: () => {
    const backup = defaultPromptsBackup as AIPromptConfig[];
    persistPrompts(backup);
    set({
      prompts: backup,
      selectedPromptId: backup[0]?.id || "prompt-child-10yo",
    });
  },

  resetSinglePrompt: (id: string) => {
    const backupItem = (defaultPromptsBackup as AIPromptConfig[]).find(
      (b) => b.id === id
    );
    if (!backupItem) return;

    set((state) => {
      const updatedPrompts = state.prompts.map((p) =>
        p.id === id ? { ...backupItem, updated_at: new Date().toISOString() } : p
      );
      persistPrompts(updatedPrompts);
      return { prompts: updatedPrompts };
    });
  },

  getPromptByKey: (promptKey: string) => {
    return get().prompts.find((p) => p.prompt_key === promptKey && p.is_active);
  },

  addNewPrompt: (category: AIPromptConfig["category"]) => {
    const newId = `prompt-custom-${Date.now()}`;
    const newPrompt: AIPromptConfig = {
      id: newId,
      prompt_key: `CUSTOM_${Date.now()}`,
      title: "Chỉ Dẫn Mới (Tùy Chỉnh)",
      category,
      description: "Mô tả mục tiêu của prompt này...",
      system_prompt: "Bạn là một trợ lý AI thông minh hướng dẫn học theo phương pháp Feynman...",
      parameters: {
        model: "gemini-1.5-flash",
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 0.95,
        skepticism_level: 5,
      },
      is_active: true,
      version: 1,
      updated_at: new Date().toISOString(),
    };

    set((state) => {
      const next = [newPrompt, ...state.prompts];
      persistPrompts(next);
      return {
        prompts: next,
        selectedPromptId: newId,
      };
    });

    return newId;
  },

  deletePrompt: (id: string) => {
    set((state) => {
      const next = state.prompts.filter((p) => p.id !== id);
      persistPrompts(next);
      return {
        prompts: next,
        selectedPromptId: next[0]?.id || "",
      };
    });
  },
}));
