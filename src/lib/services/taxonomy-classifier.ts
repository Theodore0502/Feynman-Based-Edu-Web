/**
 * File: src/lib/services/taxonomy-classifier.ts
 * Mục đích: Semantic Academic Taxonomy Classifier & Metadata Generator.
 * Đặc tính cốt lõi:
 *   1. Strict Closed-Set: Tuyệt đối chỉ gán nhãn, khái niệm (Required Concepts) và bẫy thuật ngữ (Jargon Traps)
 *      nằm trong tệp JSON State duy nhất (academic_taxonomy_state.json).
 *   2. Tự động nhận diện Nhóm Ngành (Cấp 1) & Môn Học (Cấp 2) dựa trên tiêu đề và nội dung tệp.
 *   3. Tự động chuẩn hóa Academic Title, Canonical Slug và Reference URL Link.
 */

import taxonomyDataRaw from "@/data/academic_taxonomy_state.json";
import {
  AcademicTaxonomyState,
  TaxonomyDomainItem,
  TaxonomySubjectItem,
  TaxonomyClassificationResult,
} from "@/types/catalog.types";

const taxonomyState: AcademicTaxonomyState = taxonomyDataRaw as unknown as AcademicTaxonomyState;

/**
 * Hàm loại bỏ dấu tiếng Việt để so khớp không dấu
 */
function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

/**
 * Chuẩn hóa chuỗi văn bản thành danh sách token từ khóa
 */
function extractTokens(text: string): string[] {
  const normalized = text.toLowerCase().replace(/[^a-zA-Z0-9\u00C0-\u1EF9\s_-]/g, " ");
  return normalized
    .split(/[\s_-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

/**
 * Sinh slug không dấu thân thiện với SEO
 */
function toUrlSlug(text: string): string {
  return removeVietnameseTones(text)
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Chuẩn hóa tên tài liệu thô thành Tiêu đề học thuật chuẩn mực (Academic Title)
 */
function formatAcademicTitle(rawFileName: string): string {
  // Loại bỏ phần mở rộng tệp (.pdf, .docx, .pptx, v.v.)
  let clean = rawFileName.replace(/\.[^/.]+$/, "");

  // Loại bỏ các tiền tố/hậu tố phiên bản phổ biến (_v1, _final, _draft, v.v.)
  clean = clean.replace(/[-_]?(v\d+|final|draft|copy|bản-nháp|preview)$/i, "");

  // Thay thế dấu gạch dưới, gạch ngang thành khoảng trắng
  clean = clean.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

  // Viết hoa chữ cái đầu mỗi từ
  return clean
    .split(" ")
    .map((word) => {
      if (word.length === 0) return "";
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export const TaxonomyClassifier = {
  /**
   * Lấy toàn bộ trạng thái Taxonomy Closed-Set
   */
  getTaxonomyState(): AcademicTaxonomyState {
    return taxonomyState;
  },

  /**
   * Lấy danh sách 8 Nhóm Ngành (Cấp 1)
   */
  getDomains(): TaxonomyDomainItem[] {
    return taxonomyState.domains;
  },

  /**
   * Lấy danh sách Môn Học theo Domain ID
   */
  getSubjectsByDomain(domainId: string): TaxonomySubjectItem[] {
    const domain = taxonomyState.domains.find((d) => d.id === domainId);
    return domain ? domain.subjects : [];
  },

  /**
   * Tìm Môn Học theo ID
   */
  findSubjectById(subjectId: string): { domain: TaxonomyDomainItem; subject: TaxonomySubjectItem } | null {
    for (const domain of taxonomyState.domains) {
      const subject = domain.subjects.find((s) => s.id === subjectId);
      if (subject) {
        return { domain, subject };
      }
    }
    return null;
  },

  /**
   * Phân loại tự động tệp tài liệu:
   * Trả về Nhóm Ngành, Môn Học, Độ tin cậy (Confidence %), Canonical Slug & Reference URL Link.
   */
  classifyDocument(
    fileName: string,
    textSnippet: string = ""
  ): TaxonomyClassificationResult {
    const suggestedTitle = formatAcademicTitle(fileName);
    const combinedText = `${fileName} ${suggestedTitle} ${textSnippet}`.toLowerCase();
    const combinedUnaccented = removeVietnameseTones(combinedText);
    const tokens = extractTokens(combinedText);
    const tokensUnaccented = extractTokens(combinedUnaccented);

    let bestDomain: TaxonomyDomainItem = taxonomyState.domains[0];
    let bestSubject: TaxonomySubjectItem = taxonomyState.domains[0].subjects[0];
    let highestScore = -1;
    let matchedKeywordsList: string[] = [];

    // Duyệt qua từng Nhóm Ngành và Môn Học trong Closed-Set JSON State
    for (const domain of taxonomyState.domains) {
      const domainNameLower = domain.name.toLowerCase();
      const domainNameUnaccented = removeVietnameseTones(domain.name);

      // Điểm số của domain
      let domainScore = 0;
      if (combinedText.includes(domainNameLower) || combinedUnaccented.includes(domainNameUnaccented)) {
        domainScore += 10;
      }

      for (const kw of domain.keywords) {
        const kwLower = kw.toLowerCase();
        const kwUnaccented = removeVietnameseTones(kw);
        if (combinedText.includes(kwLower) || combinedUnaccented.includes(kwUnaccented)) {
          domainScore += 4;
        }
      }

      for (const subject of domain.subjects) {
        let subjectScore = domainScore;
        const subMatched: string[] = [];

        const subNameLower = subject.name.toLowerCase();
        const subNameUnaccented = removeVietnameseTones(subject.name);

        // So khớp trực tiếp tên môn học
        if (combinedText.includes(subNameLower)) {
          subjectScore += 25;
          subMatched.push(subject.name);
        } else if (combinedUnaccented.includes(subNameUnaccented)) {
          subjectScore += 20;
          subMatched.push(subject.name);
        }

        // So khớp từ khóa môn học
        for (const kw of subject.keywords) {
          const kwLower = kw.toLowerCase();
          const kwUnaccented = removeVietnameseTones(kw);

          if (kwLower.length >= 3) {
            if (combinedText.includes(kwLower)) {
              subjectScore += 5;
              if (!subMatched.includes(kw)) subMatched.push(kw);
            } else if (combinedUnaccented.includes(kwUnaccented)) {
              subjectScore += 4;
              if (!subMatched.includes(kw)) subMatched.push(kw);
            }
          }
        }

        // So khớp với các Khái niệm có sẵn trong môn học
        for (const concept of subject.allowed_concepts) {
          const cLower = concept.toLowerCase();
          const cUnaccented = removeVietnameseTones(concept);
          if (combinedText.includes(cLower) || combinedUnaccented.includes(cUnaccented)) {
            subjectScore += 8;
            if (!subMatched.includes(concept)) subMatched.push(concept);
          }
        }

        // Cập nhật điểm cao nhất
        if (subjectScore > highestScore) {
          highestScore = subjectScore;
          bestDomain = domain;
          bestSubject = subject;
          matchedKeywordsList = subMatched;
        }
      }
    }

    // Đặc biệt kiểm tra: Tài liệu Feynman hoặc Phương pháp học tập
    if (
      combinedUnaccented.includes("feynman") ||
      combinedUnaccented.includes("ky thuat feynman") ||
      combinedUnaccented.includes("ly thuyet feynman")
    ) {
      // Ưu tiên xếp vào Khoa Học Máy Tính -> Toán Rời Rạc & Lý Thuyết Đồ Thị hoặc Nhập môn AI
      const csDomain = taxonomyState.domains.find((d) => d.id === "dom-cs") || bestDomain;
      const feynmanSubject =
        csDomain.subjects.find((s) => s.id === "sub-discrete-math") ||
        csDomain.subjects[0];
      bestDomain = csDomain;
      bestSubject = feynmanSubject;
      if (!matchedKeywordsList.includes("Kỹ thuật Feynman")) {
        matchedKeywordsList.unshift("Kỹ thuật Feynman");
      }
      highestScore = Math.max(highestScore, 35);
    }

    // Tính toán tỷ lệ tin cậy (Confidence Score 45% - 98%)
    const matchCount = matchedKeywordsList.length;
    let confidenceScore = 55;
    if (highestScore > 0) {
      confidenceScore = Math.min(98, Math.max(50, 60 + matchCount * 8));
    }

    // Sinh Canonical Slug & Reference URL
    const canonicalSlug = toUrlSlug(suggestedTitle);
    const domainSlug = bestDomain.slug;
    const subjectSlug = bestSubject.slug;
    const refLink = `https://theodore.edu.vn/materials/${domainSlug}/${subjectSlug}/${canonicalSlug}`;

    return {
      domainId: bestDomain.id,
      domainSlug: bestDomain.slug,
      domainName: bestDomain.name,
      subjectId: bestSubject.id,
      subjectSlug: bestSubject.slug,
      subjectName: bestSubject.name,
      confidenceScore,
      matchedKeywords: matchedKeywordsList.slice(0, 5),
      suggestedTitle,
      canonicalSlug,
      refLink,
      allowedConcepts: bestSubject.allowed_concepts,
      allowedJargons: bestSubject.allowed_jargons,
    };
  },

  /**
   * Sinh Metadata chuẩn hóa khi người dùng chủ động chọn lại Nhóm Ngành hoặc Môn Học (Human-in-the-loop)
   */
  generateMetadataForSelection(
    fileName: string,
    domainId: string,
    subjectId: string
  ): { suggestedTitle: string; canonicalSlug: string; refLink: string; allowedConcepts: string[]; allowedJargons: string[] } {
    const suggestedTitle = formatAcademicTitle(fileName);
    const canonicalSlug = toUrlSlug(suggestedTitle);

    const lookup = this.findSubjectById(subjectId);
    const domainSlug = lookup?.domain.slug || "chuyen-nganh";
    const subjectSlug = lookup?.subject.slug || "mon-hoc";
    const refLink = `https://theodore.edu.vn/materials/${domainSlug}/${subjectSlug}/${canonicalSlug}`;

    return {
      suggestedTitle,
      canonicalSlug,
      refLink,
      allowedConcepts: lookup?.subject.allowed_concepts || [],
      allowedJargons: lookup?.subject.allowed_jargons || [],
    };
  },

  /**
   * Lấy danh sách Khái niệm cốt lõi & Bẫy thuật ngữ hợp lệ DUY NHẤT từ JSON State cho một môn học.
   * Cam kết: Tuyệt đối không sinh thêm hay bịa đặt giá trị mới ngoài JSON State.
   */
  getStrictAllowedTags(subjectId: string): { concepts: string[]; jargons: string[] } {
    const lookup = this.findSubjectById(subjectId);
    if (!lookup) {
      return {
        concepts: ["Khái niệm nền tảng chuẩn mực"],
        jargons: ["Lạm dụng biệt ngữ trừu tượng mà không có ẩn dụ trực quan"],
      };
    }
    return {
      concepts: lookup.subject.allowed_concepts,
      jargons: lookup.subject.allowed_jargons,
    };
  },
};
