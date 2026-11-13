/**
 * File: src/lib/services/fast-document-scanner.ts
 * Purpose: Đọc lướt cấu trúc siêu tốc tệp tài liệu (.docx, .pdf, .txt) và phân tích Ma trận Nhãn đa chiều.
 * Hỗ trợ:
 *   1. Phương án A: Phân bổ tỷ lệ % ngữ nghĩa như GitHub Language Bar (Primary & Secondary Subjects).
 *   2. Phương án B: Tự động phát hiện ranh giới chương/học phần (Semantic Chapter Splitter)
 *      để người dùng có thể tách thành các module bài học độc lập nếu tệp chứa nhiều môn khác nhau.
 * Tuân thủ: Tuyệt đối không dùng Icon trong logic hoặc render.
 */

import { DocumentParser } from "./document-parser";
import { CurriculumService } from "./curriculum-service";
import { extractBestVietnameseTitle } from "./vietnamese-title-formatter";
import {
  THREE_TIER_DOMAINS,
  THREE_TIER_SUBJECTS,
  THREE_TIER_DOMAIN_SUBJECTS,
} from "@/data/three-tier-curriculum.data";
import type { AcademicSubject, DomainCategory } from "@/types/catalog.types";

export interface SubjectDistribution {
  subjectId: string;
  subjectName: string;
  domainId: string;
  domainName: string;
  domainSlug: string;
  percentage: number;
  color: string;
  matchedKeywords: string[];
}

export interface DetectedChapterModule {
  id: string;
  index: number;
  heading: string;
  dominantSubjectId: string;
  dominantSubjectName: string;
  dominantDomainName: string;
  percentageInDoc: number;
  wordCount: number;
  previewSnippet: string;
}

export interface FastScanResult {
  fileName: string;
  fileSizeBytes: number;
  totalCharacters: number;
  totalWords: number;
  suggestedTitle: string;
  canonicalSlug: string;
  refLink: string;
  distributions: SubjectDistribution[];
  isMultiSubject: boolean;
  primarySubject: SubjectDistribution;
  secondarySubject?: SubjectDistribution;
  detectedModules: DetectedChapterModule[];
  splitMode: "integrated" | "split";
}

const PALETTE = [
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#06B6D4", // Cyan
  "#F43F5E", // Rose
  "#6366F1", // Indigo
  "#0EA5E9", // Sky
];

const SUBJECT_ALIASES: Record<string, string[]> = {
  "sub-it-web": [
    "web",
    "dashboard",
    "restful",
    "api",
    "spa",
    "frontend",
    "backend",
    "react",
    "http",
    "jwt",
    "phát triển web",
    "websocket",
    "state management",
  ],
  "sub-cs-ai-ml": [
    "thị giác máy tính",
    "thi giac may tinh",
    "computer vision",
    "yolo",
    "nhận diện",
    "camera",
    "học máy",
    "máy học",
    "ai",
    "trí tuệ nhân tạo",
    "neural",
    "deep learning",
    "cnn",
    "deepsort",
    "bounding box",
    "gradient descent",
    "convolution",
  ],
  "sub-db": [
    "cơ sở dữ liệu",
    "co so du lieu",
    "sql",
    "database",
    "acid",
    "quan hệ",
    "b-tree",
    "chuẩn hóa",
    "1nf",
    "bcnf",
    "bảng dữ liệu",
    "truy vấn",
  ],
  "sub-networks": [
    "mạng máy tính",
    "mang may tinh",
    "tcp/ip",
    "tcp",
    "ip",
    "osi",
    "giao thức",
    "định tuyến",
    "routing",
    "subnet",
    "dns",
    "giao vận",
    "packet",
  ],
  "sub-it-cloud": [
    "điện toán đám mây",
    "đám mây",
    "cloud",
    "docker",
    "container",
    "aws",
    "azure",
    "linux",
    "iac",
    "hạ tầng",
  ],
  "sub-it-security": [
    "an toàn thông tin",
    "an ninh mạng",
    "cybersecurity",
    "bảo mật",
    "mã hóa",
    "owasp",
    "khóa công khai",
    "mã độc",
    "tấn công mạng",
  ],
  "sub-dsa": [
    "cấu trúc dữ liệu",
    "giải thuật",
    "thuật toán",
    "danh sách liên kết",
    "ngăn xếp",
    "hàng đợi",
    "cây nhị phân",
    "bảng băm",
    "sắp xếp",
  ],
  "sub-discrete-math": [
    "toán rời rạc",
    "lý thuyết đồ thị",
    "euler",
    "hamilton",
    "mệnh đề",
    "cây bao trùm",
    "dijkstra",
  ],
};

function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase();
}

function extractTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2);
}

function toUrlSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatAcademicTitle(rawFileName: string): string {
  let clean = rawFileName.replace(/\.[^/.]+$/, "");
  clean = clean.replace(/[-_]?(v\d+|final|draft|copy|preview)$/i, "");
  clean = clean.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return clean
    .split(" ")
    .map((w) => (w.length ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
    .join(" ");
}

export const FastDocumentScanner = {
  /**
   * Đọc lướt văn bản và phân tích ma trận nhãn đa chiều
   */
  async scanDocument(
    file: File | { name: string; buffer: Buffer; size: number }
  ): Promise<FastScanResult> {
    const parsed = await DocumentParser.parseDocument(file);
    const fullText = parsed.extractedText || "";
    const rawTokens = extractTokens(fullText);
    const textUnaccented = removeVietnameseTones(fullText);
    const suggestedTitle = extractBestVietnameseTitle(fullText, file.name);

    // 1. Phân tách các chương / đề mục lớn (Heading / Section Segmentation)
    const lines = fullText.split("\n").map((l) => l.trim()).filter(Boolean);
    const rawHeadings: { index: number; text: string; lineIndex: number }[] = [];

    const headingRegex = /^(phần|chương|bài|mục|chương\s+\d+|phần\s+[ivx\d]+|\d+\.|\#+)/i;
    lines.forEach((line, idx) => {
      if (
        (headingRegex.test(line) || (line.length <= 90 && line === line.toUpperCase() && line.length > 5)) &&
        !line.endsWith(".")
      ) {
        rawHeadings.push({ index: rawHeadings.length + 1, text: line, lineIndex: idx });
      }
    });

    // 2. Chấm điểm từng Môn học trong toàn bộ kho tri thức
    const subjects = THREE_TIER_SUBJECTS;
    const domains = THREE_TIER_DOMAINS;

    const scoredSubjects = subjects.map((sub) => {
      const sNameLower = sub.name.toLowerCase();
      const sNameUnaccented = removeVietnameseTones(sub.name);
      let score = 0;
      const matchedKeywords: string[] = [];

      // Kiểm tra tên tệp
      if (file.name.toLowerCase().includes(sNameLower) || removeVietnameseTones(file.name).includes(sNameUnaccented)) {
        score += 45;
        matchedKeywords.push(sub.name);
      }

      // Kiểm tra tần suất xuất hiện tên môn trong bài
      const subTokens = extractTokens(sub.name);
      for (const token of subTokens) {
        if (token.length >= 3) {
          const tokenUn = removeVietnameseTones(token);
          const occurrences = (textUnaccented.match(new RegExp(`\\b${tokenUn}\\b`, "g")) || []).length;
          if (occurrences > 0) {
            score += Math.min(occurrences * 4, 30);
            if (!matchedKeywords.includes(token) && matchedKeywords.length < 5) {
              matchedKeywords.push(token);
            }
          }
        }
      }

      // Kiểm tra mô tả môn
      if (sub.description) {
        const descTokens = extractTokens(sub.description);
        for (const token of descTokens) {
          if (token.length >= 4) {
            const tokenUn = removeVietnameseTones(token);
            const occurrences = (textUnaccented.match(new RegExp(`\\b${tokenUn}\\b`, "g")) || []).length;
            if (occurrences > 0) {
              score += Math.min(occurrences * 2, 20);
              if (!matchedKeywords.includes(token) && matchedKeywords.length < 5) {
                matchedKeywords.push(token);
              }
            }
          }
        }
      }

      // Kiểm tra từ khóa mở rộng (SUBJECT_ALIASES)
      const aliases = SUBJECT_ALIASES[sub.id] || [];
      for (const alias of aliases) {
        const aliasUn = removeVietnameseTones(alias);
        // Kiểm tra trong tên file
        if (removeVietnameseTones(file.name).includes(aliasUn)) {
          score += 20;
          if (!matchedKeywords.includes(alias) && matchedKeywords.length < 5) {
            matchedKeywords.push(alias);
          }
        }
        // Kiểm tra trong nội dung văn bản
        const count = (textUnaccented.match(new RegExp(`\\b${aliasUn}\\b`, "g")) || []).length;
        if (count > 0) {
          score += Math.min(count * 6, 40);
          if (!matchedKeywords.includes(alias) && matchedKeywords.length < 5) {
            matchedKeywords.push(alias);
          }
        }
      }

      // Xác định nhóm ngành từ liên kết N-N THREE_TIER_DOMAIN_SUBJECTS
      const rel = THREE_TIER_DOMAIN_SUBJECTS.find((ds) => ds.subject_id === sub.id);
      const domain = rel ? domains.find((d) => d.id === rel.domain_id) || domains[0] : domains[0];

      return {
        subjectId: sub.id,
        subjectName: sub.name,
        domainId: domain.id,
        domainName: domain.name,
        domainSlug: domain.slug,
        score,
        matchedKeywords,
      };
    });

    // Sắp xếp các môn theo điểm khớp giảm dần
    const sorted = scoredSubjects.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);

    // Fallback nếu tài liệu quá ngắn hoặc không khớp từ khóa chuyên môn
    if (sorted.length === 0) {
      sorted.push({
        subjectId: subjects[0].id,
        subjectName: subjects[0].name,
        domainId: domains[0].id,
        domainName: domains[0].name,
        domainSlug: domains[0].slug,
        score: 10,
        matchedKeywords: [subjects[0].name],
      });
    }

    // 3. Tính toán Ma Trận % Phân Bổ Ngữ Nghĩa (GitHub Language Bar Distribution)
    const topCandidates = sorted.slice(0, 4);
    const topScore = topCandidates[0].score;

    // Chỉ giữ lại các môn có tỷ lệ điểm đáng kể so với môn đứng đầu (tối thiểu 18%)
    const significantCandidates = topCandidates.filter(
      (c, idx) => idx === 0 || c.score >= topScore * 0.2
    );

    const totalSignificantScore = significantCandidates.reduce((acc, c) => acc + c.score, 0);

    const distributions: SubjectDistribution[] = significantCandidates.map((c, idx) => {
      const percentage = Math.max(1, Math.round((c.score / totalSignificantScore) * 100));
      return {
        subjectId: c.subjectId,
        subjectName: c.subjectName,
        domainId: c.domainId,
        domainName: c.domainName,
        domainSlug: c.domainSlug,
        percentage,
        color: PALETTE[idx % PALETTE.length],
        matchedKeywords: c.matchedKeywords,
      };
    });

    // Chuẩn hóa tổng phần trăm chính xác 100%
    const sumPct = distributions.reduce((acc, d) => acc + d.percentage, 0);
    if (sumPct !== 100 && distributions.length > 0) {
      distributions[0].percentage += 100 - sumPct;
    }

    const isMultiSubject = distributions.length > 1 && distributions[1].percentage >= 18;

    // 4. Bóc tách phân đoạn chương (Phương án B: Semantic Splitter)
    const detectedModules: DetectedChapterModule[] = [];
    if (rawHeadings.length >= 2) {
      for (let i = 0; i < rawHeadings.length; i++) {
        const h = rawHeadings[i];
        const nextH = rawHeadings[i + 1];
        const sliceLines = nextH
          ? lines.slice(h.lineIndex, nextH.lineIndex)
          : lines.slice(h.lineIndex, h.lineIndex + 50);

        const sectionText = sliceLines.join(" ");
        const sectionWords = sectionText.split(/\s+/).filter(Boolean).length;
        const sectionTextUn = removeVietnameseTones(sectionText);

        // Chấm điểm riêng cho phân đoạn này
        let bestSecScore = -1;
        let bestSecSub = distributions[0];

        distributions.forEach((d) => {
          const subTokens = extractTokens(d.subjectName);
          let secScore = 0;
          for (const tok of subTokens) {
            if (tok.length >= 3) {
              const occurrences = (sectionTextUn.match(new RegExp(`\\b${removeVietnameseTones(tok)}\\b`, "g")) || []).length;
              secScore += occurrences * 5;
            }
          }
          const aliases = SUBJECT_ALIASES[d.subjectId] || [];
          for (const alias of aliases) {
            const aliasUn = removeVietnameseTones(alias);
            const occurrences = (sectionTextUn.match(new RegExp(`\\b${aliasUn}\\b`, "g")) || []).length;
            secScore += occurrences * 7;
          }
          if (secScore > bestSecScore) {
            bestSecScore = secScore;
            bestSecSub = d;
          }
        });

        detectedModules.push({
          id: `mod-${i + 1}`,
          index: i + 1,
          heading: h.text,
          dominantSubjectId: bestSecSub.subjectId,
          dominantSubjectName: bestSecSub.subjectName,
          dominantDomainName: bestSecSub.domainName,
          percentageInDoc: Math.round((sliceLines.length / lines.length) * 100),
          wordCount: sectionWords,
          previewSnippet: sectionText.slice(0, 140) + "...",
        });
      }
    }

    const canonicalSlug = toUrlSlug(suggestedTitle);
    const primarySubject = distributions[0];
    const secondarySubject = distributions.length > 1 ? distributions[1] : undefined;

    return {
      fileName: file.name,
      fileSizeBytes: file.size,
      totalCharacters: fullText.length,
      totalWords: rawTokens.length,
      suggestedTitle,
      canonicalSlug,
      refLink: `https://elis.edu.vn/materials/${primarySubject.domainSlug}/${toUrlSlug(primarySubject.subjectName)}/${canonicalSlug}`,
      distributions,
      isMultiSubject,
      primarySubject,
      secondarySubject,
      detectedModules,
      splitMode: "integrated",
    };
  },
};
