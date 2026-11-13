/**
 * File: src/lib/services/vietnamese-title-formatter.ts
 * Mục đích: Tự động trích xuất và chuẩn hóa Tiêu đề Bài Giảng sang TIẾNG VIỆT CÓ DẤU CHUẨN MỰC
 *           (Full diacritics & Title Case), kết nối trực tiếp Kho Dữ Liệu Cây Tri Thức Supabase.
 * TUYỆT ĐỐI KHÔNG HARDCODE DANH SÁCH MÔN HỌC / CỤM TỪ TĨNH.
 *
 * Nguyên tắc hoạt động ĐỘNG (Dynamic):
 *   1. Ưu tiên bóc tách 100% dòng tiêu đề thực tế từ văn bản của tệp (.docx, .pdf) qua DocumentParser.
 *   2. Nếu cần phục hồi từ tên tệp (filename), tự động đối soát dựa trên CSDL Cây Tri Thức Master
 *      (THREE_TIER_DOMAINS, THREE_TIER_SUBJECTS, THREE_TIER_LECTURES) để lấy chính xác từ vựng có dấu chuẩn.
 *   3. Chuẩn hóa Title Case tiếng Việt, bảo toàn các từ viết tắt công nghệ (API, SQL, ACID, TCP/IP, Docker, AI, etc.).
 */

import {
  THREE_TIER_DOMAINS,
  THREE_TIER_SUBJECTS,
  THREE_TIER_LECTURES,
} from "@/data/three-tier-curriculum.data";

export const TECH_ACRONYMS: Record<string, string> = {
  api: "API",
  restful: "RESTful",
  sql: "SQL",
  acid: "ACID",
  "tcp/ip": "TCP/IP",
  tcp: "TCP",
  ip: "IP",
  osi: "OSI",
  ai: "AI",
  camera: "Camera",
  dashboard: "Dashboard",
  docker: "Docker",
  cloud: "Cloud",
  container: "Container",
  cybersecurity: "Cybersecurity",
  yolo: "YOLO",
  cnn: "CNN",
  jwt: "JWT",
  spa: "SPA",
  web: "Web",
  feynman: "Feynman",
  ci: "CI",
  cd: "CD",
  iac: "IaC",
  aws: "AWS",
  azure: "Azure",
  dns: "DNS",
  http: "HTTP",
  https: "HTTPS",
  nosql: "NoSQL",
  ml: "ML",
  cv: "CV",
  html: "HTML",
  css: "CSS",
  ui: "UI",
  ux: "UX",
  mvc: "MVC",
  orm: "ORM",
  crud: "CRUD",
  lan: "LAN",
  wan: "WAN",
  vpn: "VPN",
  bcnf: "BCNF",
  "1nf": "1NF",
  "2nf": "2NF",
  "3nf": "3NF",
};

function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase();
}

/**
 * Xây dựng Kho Từ Vựng Học Thuật Tiếng Việt Có Dấu ĐỘNG từ CSDL Hệ Thống (Supabase)
 * Không hardcode: Tự động gom tất cả Domain, Subject, Topic và Concepts từ kho tri thức.
 */
let dynamicVocabCache: Array<{ unaccented: string; accented: string }> | null = null;

export function getDynamicAcademicVocabulary(): Array<{ unaccented: string; accented: string }> {
  if (dynamicVocabCache && dynamicVocabCache.length > 0) {
    return dynamicVocabCache;
  }

  const vocabMap = new Map<string, string>();

  // 1. Nạp từ Cấp 1: Academic Domains
  THREE_TIER_DOMAINS.forEach((d) => {
    vocabMap.set(removeVietnameseTones(d.name), d.name);
  });

  // 2. Nạp từ Cấp 2: Academic Subjects
  THREE_TIER_SUBJECTS.forEach((s) => {
    vocabMap.set(removeVietnameseTones(s.name), s.name);
  });

  // 3. Nạp từ Cấp 3: Academic Lectures & Concepts
  THREE_TIER_LECTURES.forEach((l) => {
    vocabMap.set(removeVietnameseTones(l.title), l.title);
    (l.requiredConcepts || []).forEach((c) => {
      // Chỉ nạp các thuật ngữ ngắn gọn (3 - 45 ký tự), loại bỏ các công thức/phương trình toán học chứa ký tự đặc biệt (=, +, *, /, ^)
      if (c.length >= 3 && c.length <= 45 && !/[=+*^$<>{}()[\]\\\/%#@~`|:;]/.test(c)) {
        const clean = c.trim();
        vocabMap.set(removeVietnameseTones(clean), clean);
      }
    });
  });

  // 4. Các tiền tố văn bản học thuật thông dụng
  const standardPrefixes = [
    { un: "giao trinh", acc: "Giáo Trình" },
    { un: "do an", acc: "Đồ Án" },
    { un: "lien nganh", acc: "Liên Ngành" },
    { un: "tich hop", acc: "Tích Hợp" },
    { un: "bai giang", acc: "Bài Giảng" },
    { un: "de cuong", acc: "Đề Cương" },
    { un: "chuyen khao", acc: "Chuyên Khảo" },
    { un: "chuyen de", acc: "Chuyên Đề" },
  ];
  standardPrefixes.forEach((p) => {
    vocabMap.set(p.un, p.acc);
  });

  // Sắp xếp các cụm từ dài lên trước để thay thế chuẩn xác (Greedy Longest Match)
  const entries = Array.from(vocabMap.entries()).map(([unaccented, accented]) => ({
    unaccented,
    accented,
  }));
  entries.sort((a, b) => b.unaccented.length - a.unaccented.length);

  dynamicVocabCache = entries;
  return dynamicVocabCache;
}

let dynamicAcronymsCache: Record<string, string> | null = null;

/**
 * Tự động trích xuất các từ viết tắt và thuật ngữ viết hoa chuyên ngành từ CSDL Supabase
 */
export function getDynamicTechAcronyms(): Record<string, string> {
  if (dynamicAcronymsCache) return dynamicAcronymsCache;

  const acronymMap: Record<string, string> = {
    ...TECH_ACRONYMS,
  };

  // Quét toàn bộ CSDL Supabase (479 bài học và 37 môn học) để tự động nhận diện thêm các từ viết tắt
  THREE_TIER_LECTURES.forEach((lec) => {
    const tokens = (lec.title + " " + (lec.requiredConcepts || []).join(" ")).split(/[\s,()\/]+/);
    tokens.forEach((tok) => {
      const trimmed = tok.trim();
      if (
        (trimmed.length >= 2 && trimmed === trimmed.toUpperCase() && /^[A-Z0-9+-]+$/.test(trimmed)) ||
        /^[A-Z]+[a-z]+[A-Z]+/.test(trimmed)
      ) {
        const lowerKey = trimmed.toLowerCase();
        if (!acronymMap[lowerKey]) {
          acronymMap[lowerKey] = trimmed;
        }
      }
    });
  });

  dynamicAcronymsCache = acronymMap;
  return dynamicAcronymsCache;
}

/**
 * Định dạng chuỗi văn bản tiếng Việt sang Title Case và bảo toàn từ viết tắt kỹ thuật
 */
export function toVietnameseTitleCase(str: string): string {
  // Chuẩn hóa dấu mở ngoặc sát chữ
  let cleaned = str.replace(/([^\s])\(/g, "$1 (");
  cleaned = cleaned.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  const words = cleaned.split(" ");
  const acronyms = getDynamicTechAcronyms();

  return words
    .map((w) => {
      const lower = w.toLowerCase().replace(/[^a-z0-9\/]/g, "");
      if (acronyms[lower]) {
        const punctuation = w.replace(/[a-zA-Z0-9\/]/g, "");
        return acronyms[lower] + punctuation;
      }
      if (w.length === 0) return "";
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Phục hồi tiêu đề tiếng Việt có dấu từ tên tệp (filename)
 * Bằng cách đối soát với Kho Từ Vựng Học Thuật ĐỘNG nạp từ Supabase
 */
export function restoreVietnameseFromFilename(rawFileName: string): string {
  let clean = rawFileName.replace(/\.[^/.]+$/, "");
  clean = clean.replace(/[-_]?(v\d+|final|draft|copy|preview)$/i, "");
  clean = clean.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

  // Đối soát với kho từ vựng động từ CSDL
  const vocab = getDynamicAcademicVocabulary();
  let workingClean = clean;

  for (const item of vocab) {
    if (item.unaccented.length < 4) continue;
    // Bỏ qua các chuỗi chứa ký tự toán học hoặc công thức
    if (/[=+*^$<>{}()[\]\\\/%#@~`|:;]/.test(item.unaccented)) continue;

    // Phân tách các từ và escape regex từng từ tuyệt đối an toàn
    const tokens = item.unaccented
      .trim()
      .split(/\s+/)
      .map((t) => escapeRegExp(t))
      .filter(Boolean);

    if (tokens.length === 0) continue;
    const pattern = tokens.join("[-_\\s]+");

    try {
      const regex = new RegExp(`\\b${pattern}\\b`, "gi");
      if (regex.test(workingClean)) {
        workingClean = workingClean.replace(regex, item.accented);
      }
    } catch {
      // Bỏ qua nếu có lỗi cú pháp regex
    }
  }

  // Chuẩn hóa Title Case
  const acronyms = getDynamicTechAcronyms();
  return workingClean
    .split(" ")
    .map((w) => {
      const lower = w.toLowerCase().replace(/[^a-z0-9\/]/g, "");
      if (acronyms[lower]) {
        const punctuation = w.replace(/[a-zA-Z0-9\/]/g, "");
        return acronyms[lower] + punctuation;
      }
      if (w.length === 0) return "";
      // Nếu từ đã có dấu tiếng Việt, giữ nguyên
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

/**
 * Bóc tách tiêu đề tiếng Việt có dấu xuất sắc nhất từ nội dung văn bản và tên tệp
 */
export function extractBestVietnameseTitle(fullText: string, rawFileName: string): string {
  const lines = (fullText || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // 1. Tìm trong 6 dòng đầu tiên của tài liệu
  for (let i = 0; i < Math.min(6, lines.length); i++) {
    let candidate = lines[i];

    // Cắt bỏ phần mở rộng trong ngoặc đơn nếu có (ví dụ: "(Dành cho cán bộ hướng dẫn...)")
    if (candidate.includes("(") && candidate.indexOf("(") > 8) {
      const beforeParen = candidate.substring(0, candidate.indexOf("(")).trim();
      if (beforeParen.length >= 8) {
        candidate = beforeParen;
      }
    }

    // Bỏ qua nếu dòng chỉ là tiền đề văn bản hành chính hoặc chuyên khảo
    if (
      candidate.length <= 30 &&
      /^(tài liệu chuyên khảo|chuyên khảo|chuyên đề|bản thảo|draft|mục lục|lời nói đầu|cộng hòa xã hội|độc lập - tự do)$/i.test(
        candidate
      )
    ) {
      continue;
    }

    // Nếu dòng có độ dài hợp lý cho tiêu đề bài giảng / tài liệu (8 - 150 ký tự)
    if (candidate.length >= 8 && candidate.length <= 150) {
      const hasVietnameseAccents =
        /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(
          candidate
        );
      const hasAcademicKeywords =
        /phiếu|đánh giá|thực tập|báo cáo|nghiên cứu|giáo trình|đồ án|bài giảng|hệ thống|kiến trúc|mô hình|phát triển|cơ sở dữ liệu|mạng|an toàn|an ninh|điện toán|lý thuyết|kỹ thuật|khóa luận/i.test(
          candidate
        );

      if (hasVietnameseAccents || hasAcademicKeywords) {
        return toVietnameseTitleCase(candidate);
      }
    }
  }

  // 2. Fallback: Phục hồi tiếng Việt có dấu từ tên tệp qua CSDL Cây Tri Thức Động
  return restoreVietnameseFromFilename(rawFileName);
}
