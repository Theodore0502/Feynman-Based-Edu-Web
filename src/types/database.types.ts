/**
 * File: src/types/database.types.ts
 * Mục đích: Định nghĩa Type Definitions toàn bộ 12 Bảng Cơ sở dữ liệu Supabase / PostgreSQL cho "Feynman Technique Stage".
 * Phân hệ:
 *   1. User Data: Profile, UserAiConfig
 *   2. Academic & Knowledge Graph: AcademicDomain, AcademicTopic, TopicEdge, AcademicMaterial
 *   3. Personas & Learning Sessions: PersonaRecord, LearningSessionRecord, SessionMessageRecord, AgentAnalysisLogRecord
 *   4. Evaluation & Spaced Repetition: EvaluationReportRecord, JargonVaultCardRecord
 */

export interface Profile {
  id: string; // UUID liên kết auth.users
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  primary_domain_id: string | null;
  streak_count: number;
  total_xp: number;
  last_active_at: string | null;
  created_at: string;
}

export interface UserAiConfig {
  id: string;
  user_id: string;
  preferred_language: string;
  voice_gender: "female" | "male";
  speech_rate: number;
  default_difficulty: "EASY" | "MEDIUM" | "HARD";
  custom_model_provider: string | null;
  custom_model_name: string | null;
  updated_at: string;
}

export interface AcademicDomain {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon_name: string | null;
  created_at: string;
}

export interface AcademicTopic {
  id: string;
  domain_id: string;
  title: string;
  slug: string;
  summary: string; // Ground Truth chuẩn hóa
  required_concepts: string[];
  common_jargons: string[];
  difficulty_level: number; // 1 - 5
  created_at: string;
}

export interface TopicEdge {
  id: string;
  source_topic_id: string;
  target_topic_id: string;
  relation_type: "PREREQUISITE" | "RELATED" | "SUB_CONCEPT";
  created_at: string;
}

export interface AcademicMaterial {
  id: string;
  topic_id: string;
  uploaded_by_id: string | null;
  title: string;
  source_type: "PDF" | "SLIDE" | "URL" | "TEXT_NOTE";
  storage_file_path: string | null;
  extracted_text: string | null;
  embedding?: number[] | null;
  created_at: string;
}

export interface PersonaRecord {
  id: string;
  creator_id: string | null;
  slug: string;
  name: string;
  role_badge: string;
  avatar_url: string | null;
  system_prompt: string;
  curiosity_level: number; // 0 - 100
  preferred_metaphors: string[];
  is_system_default: boolean;
  created_at: string;
}

export interface LearningSessionRecord {
  id: string;
  user_id: string;
  topic_id: string | null;
  persona_id: string;
  custom_topic_title: string | null;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  status: "ACTIVE" | "COMPLETED" | "ABANDONED";
  current_clarity: number; // 0 - 100
  turn_count: number;
  duration_seconds: number;
  started_at: string;
  completed_at: string | null;
}

export interface SessionMessageRecord {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  audio_storage_url: string | null;
  created_at: string;
}

export interface AgentAnalysisLogRecord {
  id: string;
  message_id: string;
  jargons_detected: Array<{
    term: string;
    isExplainedSimply: boolean;
    reason: string;
  }>;
  logic_gap_found: string | null;
  detected_analogy: string | null;
  turn_clarity_score: number;
  concepts_covered: string[];
  created_at: string;
}

export interface EvaluationReportRecord {
  id: string;
  session_id: string;
  clarity_score: number;
  logic_completeness: number;
  accuracy_score: number;
  best_analogy: string | null;
  knowledge_gaps: string[];
  summary_feedback: string;
  share_token: string;
  created_at: string;
}

export interface JargonVaultCardRecord {
  id: string;
  user_id: string;
  topic_id: string | null;
  jargon_term: string;
  plain_explanation: string;
  analogy_used: string | null;
  mastery_level: number; // 1 - 5 (SM-2)
  next_review_at: string;
  created_at: string;
}

