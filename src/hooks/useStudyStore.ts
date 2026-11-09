/**
 * File: src/hooks/useStudyStore.ts
 * Mục đích: Quản lý Global State cho Phòng Học Trước (Feynman Study & Prep Lab) bằng Zustand với LocalStorage persistence.
 * Thành phần chính:
 *   - activeTopic: Chủ đề đang được người học nghiên cứu.
 *   - scratchpad: Dàn ý bài giảng (Speaker's Scratchpad) được tự động lưu.
 *   - customMaterial: Dữ liệu tài liệu tự do do người dùng dán vào.
 *   - selectTopic, updateScratchpad, setCustomMaterial: Các action điều khiển trạng thái.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StudyTopic, SpeakerScratchpad, CustomStudyMaterial } from "@/types/study.types";
const DEFAULT_STUDY_TOPIC: StudyTopic = {
  id: "top-feynman-technique-01",
  domainId: "dom-edu",
  domainName: "Khoa Học Giáo Dục & Kỹ Năng Học Thuật",
  title: "Phương Pháp Học Tập & Kỹ Thuật Feynman",
  slug: "phuong-phap-hoc-tap-feynman",
  summary:
    "Kỹ thuật Feynman là phương pháp học tập dựa trên việc đơn giản hóa kiến thức đến mức tối đa, diễn giải bằng ngôn ngữ đời thường cho một đứa trẻ 10 tuổi để nhận diện lỗ hổng tư duy.",
  difficultyLevel: 1,
  estimatedReadingMinutes: 10,
  requiredConcepts: [
    "Tư duy phản biện",
    "Lỗ hổng tri thức",
    "Đơn giản hóa ngôn từ",
    "Phép ẩn dụ trực quan",
    "Siêu nhận thức",
  ],
  jargonTraps: [
    {
      term: "Lạm dụng thuật ngữ chuyên môn",
      explanation: "Che giấu sự thiếu hiểu biết đằng sau từ ngữ bác học",
      recommendedAnalogy: "Ví von như xây nhà mà chỉ xếp gạch không trát vữa",
    },
  ],
  starterAnalogies: [
    {
      title: "Ẩn dụ xếp hình Lego",
      metaphor: "Giống như việc lắp ráp một mô hình đồ chơi từ các mảnh ghép cơ bản nhất.",
      applicableAudience: "Bé Bo (10 tuổi)",
    },
  ],
};

export const PRESET_STUDY_TOPICS: StudyTopic[] = [DEFAULT_STUDY_TOPIC];

interface StudyStoreState {
  activeTopic: StudyTopic | null;
  customMaterial: CustomStudyMaterial | null;
  scratchpad: SpeakerScratchpad;
  isScratchpadOpen: boolean;

  // Actions
  selectTopic: (topicId: string) => void;
  selectTopicBySlug: (slug: string) => void;
  setActiveTopicObject: (topic: StudyTopic) => void;
  setCustomMaterial: (material: CustomStudyMaterial) => void;
  updateScratchpad: (partial: Partial<SpeakerScratchpad>) => void;
  toggleScratchpad: (open?: boolean) => void;
  resetScratchpad: () => void;
}

const DEFAULT_SCRATCHPAD: SpeakerScratchpad = {
  topicTitle: "",
  coreHook: "",
  mainPoints: ["", "", ""],
  customAnalogy: "",
  rawNotes: "",
  lastSavedAt: new Date().toISOString(),
};

export const useStudyStore = create<StudyStoreState>()(
  persist(
    (set, get) => ({
      activeTopic: PRESET_STUDY_TOPICS[0], // Mặc định là Docker
      customMaterial: null,
      scratchpad: {
        ...DEFAULT_SCRATCHPAD,
        topicId: PRESET_STUDY_TOPICS[0].id,
        topicTitle: PRESET_STUDY_TOPICS[0].title,
      },
      isScratchpadOpen: false,

      selectTopic: (topicId: string) => {
        const found = PRESET_STUDY_TOPICS.find((t) => t.id === topicId) || PRESET_STUDY_TOPICS[0];
        set({
          activeTopic: found,
          customMaterial: null,
          scratchpad: {
            ...get().scratchpad,
            topicId: found.id,
            topicTitle: found.title,
            lastSavedAt: new Date().toISOString(),
          },
        });
      },

      selectTopicBySlug: (slug: string) => {
        const found = PRESET_STUDY_TOPICS.find((t) => t.slug === slug);
        if (found) {
          get().selectTopic(found.id);
        }
      },

      setActiveTopicObject: (topic: StudyTopic) => {
        set({
          activeTopic: topic,
          customMaterial: null,
          scratchpad: {
            ...get().scratchpad,
            topicId: topic.id,
            topicTitle: topic.title,
            lastSavedAt: new Date().toISOString(),
          },
        });
      },

      setCustomMaterial: (material: CustomStudyMaterial) => {
        const customTopic: StudyTopic = {
          id: `custom-${Date.now()}`,
          domainId: "custom",
          domainName: "Tài liệu cá nhân",
          title: material.title,
          slug: `custom-${Date.now()}`,
          difficultyLevel: 3,
          estimatedReadingMinutes: Math.max(1, Math.ceil(material.rawText.length / 500)),
          summary: material.generatedSummary || material.rawText.slice(0, 300) + "...",
          requiredConcepts: material.extractedConcepts,
          jargonTraps: material.extractedJargons.map((j) => ({
            term: j,
            explanation: `Thuật ngữ chuyên ngành trong tài liệu "${j}".`,
            recommendedAnalogy: "Cần tìm hình ảnh đời thường để so sánh.",
          })),
          starterAnalogies: [],
          fullMaterialMarkdown: material.rawText,
        };

        set({
          activeTopic: customTopic,
          customMaterial: material,
          scratchpad: {
            ...DEFAULT_SCRATCHPAD,
            topicId: customTopic.id,
            topicTitle: customTopic.title,
            lastSavedAt: new Date().toISOString(),
          },
        });
      },

      updateScratchpad: (partial: Partial<SpeakerScratchpad>) => {
        set({
          scratchpad: {
            ...get().scratchpad,
            ...partial,
            lastSavedAt: new Date().toISOString(),
          },
        });
      },

      toggleScratchpad: (open?: boolean) => {
        set({
          isScratchpadOpen: typeof open === "boolean" ? open : !get().isScratchpadOpen,
        });
      },

      resetScratchpad: () => {
        const topic = get().activeTopic;
        set({
          scratchpad: {
            ...DEFAULT_SCRATCHPAD,
            topicId: topic?.id,
            topicTitle: topic?.title || "",
          },
        });
      },
    }),
    {
      name: "feynman_study_lab_storage",
    }
  )
);

