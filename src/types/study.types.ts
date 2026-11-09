/**
 * File: src/types/study.types.ts
 * Mục đích: Định nghĩa các kiểu dữ liệu (TypeScript Interfaces) cho phân hệ Phòng Học Trước (Study & Prep Lab).
 * Thành phần chính:
 *   - StudyTopic: Chủ đề học tập chứa Ground Truth, các khái niệm bắt buộc và bẫy thuật ngữ.
 *   - JargonTrap: Thuật ngữ khó cần tránh dùng trực tiếp khi giảng giải.
 *   - StarterAnalogy: Các phép ẩn dụ mồi giúp người học khởi động ý tưởng.
 *   - SpeakerScratchpad: Dàn ý bài giảng của người học soạn thảo trước khi lên bục giảng.
 *   - StudyPrepState: Trạng thái tổng thể của phiên chuẩn bị bài học.
 */

export interface JargonTrap {
  term: string;
  explanation: string;
  recommendedAnalogy: string;
}

export interface StarterAnalogy {
  title: string;
  metaphor: string;
  applicableAudience: string; // 'Bé Bo (10 tuổi)', 'Chị Mai (Trái ngành)', etc.
}

export interface StudyTopic {
  id: string;
  domainId: string;
  domainName: string;
  title: string;
  slug: string;
  summary: string; // Ground Truth chuẩn mực
  difficultyLevel: number; // 1 - 5
  estimatedReadingMinutes: number;
  requiredConcepts: string[];
  jargonTraps: JargonTrap[];
  starterAnalogies: StarterAnalogy[];
  fullMaterialMarkdown?: string;
}

export interface SpeakerScratchpad {
  topicId?: string;
  topicTitle: string;
  coreHook: string; // Câu mở đầu thu hút sự chú ý
  mainPoints: string[]; // Các ý chính sẽ nói
  customAnalogy: string; // Ẩn dụ riêng người học tự nghĩ ra
  rawNotes: string; // Ghi chú tự do
  lastSavedAt: string;
}

export interface CustomStudyMaterial {
  title: string;
  rawText: string;
  extractedConcepts: string[];
  extractedJargons: string[];
  generatedSummary: string;
  suggestedAnalogies?: string[];
}

