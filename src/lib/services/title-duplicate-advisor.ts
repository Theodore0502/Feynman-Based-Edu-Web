/**
 * File: src/lib/services/title-duplicate-advisor.ts
 * Mục đích: Kiểm tra xung đột / trùng lặp Tiêu đề bài giảng trong Cơ sở dữ liệu của người dùng
 *           và đề xuất giải pháp thông minh:
 *           1. Thêm số phiên bản tiếp theo: (Phiên Bản 2, 3, 4...)
 *           2. Thêm số phần tiếp theo: (Phần 2, 3, 4...)
 *           3. Gộp nội dung vào bài giảng hiện có (Merge Mode)
 * Tuân thủ: Tuyệt đối không dùng Icon.
 */

import { ExtractedLessonDraft } from "./document-extraction-agent";
import { CatalogTopic } from "@/types/catalog.types";

export interface MatchedRecordInfo {
  id: string;
  title: string;
  source: "Bàn Thẩm Định" | "Kho Bài Giảng" | "Tài Liệu Đang Nạp";
  updatedAt?: string;
}

export interface TitleConflictAdvice {
  hasConflict: boolean;
  rootTitle: string;
  matchedRecord: MatchedRecordInfo | null;
  conflictCount: number;
  nextVersionNumber: number; // 2, 3, 4...
  versionedTitle: string;
  partTitle: string;
  mergeTargetTitle: string;
}

function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase();
}

function normalizeForComparison(str: string): string {
  return removeVietnameseTones(str).replace(/[^a-z0-9]/g, "");
}

/**
 * Tách bỏ hậu tố số phiên bản / phần để tìm ra Tiêu đề gốc
 * Ví dụ: "Giáo Trình SQL (Phiên Bản 2)" -> "Giáo Trình SQL"
 */
export function extractRootTitle(title: string): string {
  return title
    .replace(/\s*[\(\[]\s*(phiên\s*bản|phần|tập|ver|version|v)\s*\d+\s*[\)\]]/gi, "")
    .replace(/\s*[\(\[]\s*(bản\s*mới|bản\s*gộp|tích\s*hợp)\s*[\)\]]/gi, "")
    .replace(/\s*[-–—]\s*(phiên\s*bản|phần|tập)\s*\d+/gi, "")
    .replace(/^(gộp|bản gộp)\s*[-:]?\s*/gi, "")
    .trim();
}

/**
 * Trích xuất số phiên bản hiện có từ tiêu đề nếu có
 */
function extractExistingVersionNumber(title: string): number {
  const match = title.match(/[\(\[-–—]\s*(?:phiên\s*bản|phần|tập|ver|version|v)\s*(\d+)\s*[\)\]]?/i);
  if (match && match[1]) {
    const num = parseInt(match[1], 10);
    if (!isNaN(num) && num > 0) return num;
  }
  return 1;
}

export const TitleDuplicateAdvisor = {
  /**
   * Kiểm tra xem tiêu đề hiện tại có trùng với cơ sở dữ liệu bài học của user không
   */
  checkTitleConflict(params: {
    currentTitle: string;
    currentDocId?: string;
    userDrafts: ExtractedLessonDraft[];
    catalogTopics: CatalogTopic[];
    otherUploadedDocs?: Array<{ id: string; suggestedTitle: string }>;
  }): TitleConflictAdvice {
    const { currentTitle, currentDocId, userDrafts, catalogTopics, otherUploadedDocs = [] } = params;

    const trimmedTitle = (currentTitle || "").trim();
    if (!trimmedTitle || trimmedTitle.length < 5) {
      return {
        hasConflict: false,
        rootTitle: trimmedTitle,
        matchedRecord: null,
        conflictCount: 0,
        nextVersionNumber: 2,
        versionedTitle: "",
        partTitle: "",
        mergeTargetTitle: "",
      };
    }

    const currentRoot = extractRootTitle(trimmedTitle);
    const currentRootNorm = normalizeForComparison(currentRoot);
    const currentFullNorm = normalizeForComparison(trimmedTitle);

    const matches: MatchedRecordInfo[] = [];
    const foundVersions: number[] = [1];

    // 1. Kiểm tra trong danh sách Drafts đã tạo của user (LocalStorage / Supabase)
    userDrafts.forEach((draft) => {
      const draftTitle = draft.title || "";
      const draftRoot = extractRootTitle(draftTitle);
      const draftRootNorm = normalizeForComparison(draftRoot);
      const draftFullNorm = normalizeForComparison(draftTitle);

      if (draftRootNorm === currentRootNorm || draftFullNorm === currentFullNorm) {
        matches.push({
          id: draft.id,
          title: draftTitle,
          source: "Bàn Thẩm Định",
          updatedAt: draft.updatedAt || draft.uploadedAt,
        });
        foundVersions.push(extractExistingVersionNumber(draftTitle));
      }
    });

    // 2. Kiểm tra trong các tệp khác cùng tải lên trong đợt này
    otherUploadedDocs.forEach((other) => {
      if (other.id === currentDocId) return;
      const otherTitle = other.suggestedTitle || "";
      const otherRoot = extractRootTitle(otherTitle);
      const otherRootNorm = normalizeForComparison(otherRoot);

      if (otherRootNorm === currentRootNorm && otherTitle) {
        matches.push({
          id: other.id,
          title: otherTitle,
          source: "Tài Liệu Đang Nạp",
        });
        foundVersions.push(extractExistingVersionNumber(otherTitle));
      }
    });

    // 3. Kiểm tra trong Kho Bài Giảng chính thức của hệ thống
    catalogTopics.forEach((topic) => {
      const topicTitle = topic.title || "";
      const topicRoot = extractRootTitle(topicTitle);
      const topicRootNorm = normalizeForComparison(topicRoot);

      if (topicRootNorm === currentRootNorm) {
        matches.push({
          id: topic.id,
          title: topicTitle,
          source: "Kho Bài Giảng",
        });
        foundVersions.push(extractExistingVersionNumber(topicTitle));
      }
    });

    if (matches.length === 0) {
      return {
        hasConflict: false,
        rootTitle: currentRoot,
        matchedRecord: null,
        conflictCount: 0,
        nextVersionNumber: 2,
        versionedTitle: `${currentRoot} (Phiên Bản 2)`,
        partTitle: `${currentRoot} (Phần 2)`,
        mergeTargetTitle: currentRoot,
      };
    }

    // Tính toán số phiên bản tiếp theo
    const maxVersion = Math.max(...foundVersions, 1);
    const nextVersionNumber = maxVersion + 1;

    // Chọn bản ghi trùng khớp nhất (ưu tiên Bàn Thẩm Định trước)
    const primaryMatch =
      matches.find((m) => m.source === "Bàn Thẩm Định") ||
      matches.find((m) => m.source === "Tài Liệu Đang Nạp") ||
      matches[0];

    return {
      hasConflict: true,
      rootTitle: currentRoot,
      matchedRecord: primaryMatch,
      conflictCount: matches.length,
      nextVersionNumber,
      versionedTitle: `${currentRoot} (Phiên Bản ${nextVersionNumber})`,
      partTitle: `${currentRoot} (Phần ${nextVersionNumber})`,
      mergeTargetTitle: primaryMatch.title,
    };
  },
};
