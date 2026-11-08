/**
 * File: src/types/auth.types.ts
 * Purpose: Strongly typed models for the Two-Role Feynman System:
 *   - UserRole: 'learner' (End User) vs 'admin' (Admin Moderator).
 *   - UserProfile: User metadata, active role, mastery level, clarity score.
 *   - FeynmanRubricCriterion: Configurable evaluation criterion with weight and thresholds.
 *   - AuditReportItem: Student challenge reports on AI evaluation inaccuracies.
 */

export type UserRole = "learner" | "curator" | "admin";

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName: string;
  displayName?: string;
  role: UserRole;
  avatarUrl?: string;
  fieldOfStudy?: string;
  assignedDomains?: string[]; // IDs của các Nhóm Ngành phụ trách (Dành riêng cho Curator)
  masteryPoints?: number;
  clarityAverage?: number;
  createdAt: string;
}

export interface FeynmanRubricCriterion {
  id: string;
  name: string;
  description: string;
  weight: number; // percentage (sum = 100%)
  targetAspect: "SIMPLICITY" | "ACCURACY" | "ANALOGY" | "SOCRATIC_DEFENSE";
  jargonPenaltyFactor: number;
}

export interface FeynmanRubricConfig {
  id: string;
  name: string;
  active: boolean;
  minPassingScore: number;
  criteria: FeynmanRubricCriterion[];
  updatedAt: string;
}

export interface AuditReportItem {
  id: string;
  sessionId: string;
  topicTitle: string;
  studentName: string;
  studentExplanationSnippet: string;
  aiFeedbackSnippet: string;
  studentComplaint: string;
  status: "PENDING" | "RESOLVED" | "REJECTED";
  adminNotes?: string;
  createdAt: string;
}

