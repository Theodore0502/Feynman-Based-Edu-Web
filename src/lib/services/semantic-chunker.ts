/**
 * File: src/lib/services/semantic-chunker.ts
 * Mục đích: Semantic & Agentic Chunking cho tài liệu học thuật đa hình thái (.docx, .pdf, .pptx).
 * Tính năng chính:
 *   1. Nhận diện loại hình sư phạm (Pedagogical Role): Slide / Giáo trình / Đề cương / Ghi chú bài giảng.
 *   2. Băm theo ranh giới ý niệm (Topic Shifts & Atomic Knowledge Units), không cắt ngang câu.
 *   3. Gắn thẻ ngữ cảnh tiền đề (Anthropic Contextual Retrieval Prefix) để bảo toàn nghĩa cho các gạch đầu dòng ngắn.
 */

export type PedagogicalRole =
  | "SLIDE_DECK" // Slide thuyết trình (gạch đầu dòng, sơ đồ, khái quát)
  | "TEXTBOOK_CHAPTER" // Sách giáo trình chuyên sâu (lý thuyết dài, chứng minh, định nghĩa chuẩn)
  | "EXAM_PREP_CASE_STUDY" // Đề cương ôn tập / Tình huống thực hành (nhiều bẫy, câu hỏi)
  | "LECTURE_NOTE"; // Ghi chép bài giảng / Tài liệu ngắn gọn

export interface SemanticChunk {
  chunkIndex: number;
  chunkId: string;
  heading: string;
  rawContent: string;
  contextualContent: string; // Nội dung đã được bọc tiền đề Anthropic Context
  estimatedReadingSeconds: number;
  keyPhrases: string[];
}

export interface DocumentAnalysisResult {
  pedagogicalRole: PedagogicalRole;
  pedagogicalRoleLabel: string;
  pedagogicalRoleDescription: string;
  totalChunks: number;
  chunks: SemanticChunk[];
  detectedHeadings: string[];
}

export const SemanticChunker = {
  /**
   * 1. Phân loại Vai Trò Sư Phạm của tài liệu dựa trên định dạng và đặc tính nội dung
   */
  classifyPedagogicalRole(fileName: string, textSnippet: string = ""): {
    role: PedagogicalRole;
    label: string;
    description: string;
  } {
    const fLower = fileName.toLowerCase();
    const tLower = textSnippet.toLowerCase();

    // Slide thuyết trình (.pptx hoặc tên file chứa slide / bai giang)
    if (
      fLower.endsWith(".pptx") ||
      fLower.includes("slide") ||
      fLower.includes("thuyet-trinh") ||
      tLower.includes("slide 1") ||
      tLower.includes("trang chiếu")
    ) {
      return {
        role: "SLIDE_DECK",
        label: "Slide Thuyết Trình & Tổng Quan",
        description:
          "Cấu trúc cô đọng, nhiều gạch đầu dòng. Thích hợp nhất để trích xuất Khái niệm Cốt lõi và Bản đồ Tri thức tổng quan.",
      };
    }

    // Đề cương ôn tập / Case study
    if (
      fLower.includes("de-cuong") ||
      fLower.includes("on-tap") ||
      fLower.includes("case") ||
      fLower.includes("bai-tap") ||
      fLower.includes("tinh-huong") ||
      tLower.includes("câu hỏi ôn tập") ||
      tLower.includes("tình huống thực hành")
    ) {
      return {
        role: "EXAM_PREP_CASE_STUDY",
        label: "Đề Cương Ôn Tập & Tình Huống",
        description:
          "Tài liệu tập trung vào vận dụng thực tế. Thích hợp nhất để phát hiện Bẫy Thuật Ngữ (Jargon Traps) và xây dựng Ẩn dụ Feynman.",
      };
    }

    // Sách giáo trình chuyên sâu (.pdf, .doc, .docx có dung lượng lớn hoặc tiêu đề giáo trình)
    if (
      fLower.includes("giao-trinh") ||
      fLower.includes("sach") ||
      fLower.includes("textbook") ||
      fLower.includes("ly-thuyet") ||
      tLower.includes("chương") ||
      tLower.includes("mục lục")
    ) {
      return {
        role: "TEXTBOOK_CHAPTER",
        label: "Giáo Trình Học Thuật Chuyên Sâu",
        description:
          "Văn phong chặt chẽ, luận chứng chi tiết. Thích hợp nhất để bóc tách Định nghĩa Chuẩn mực (Ground Truth) và tiên đề chứng minh.",
      };
    }

    // Mặc định: Ghi chép bài giảng
    return {
      role: "LECTURE_NOTE",
      label: "Ghi Chép Bài Giảng Học Thuật",
      description:
        "Tài liệu diễn giải kiến thức trọng tâm theo phương pháp sư phạm trực quan.",
    };
  },

  /**
   * 2. Băm tài liệu theo Ranh giới Ý niệm (Semantic Boundary Chunking)
   *    kết hợp Contextual Retrieval Prefix
   */
  chunkDocument(params: {
    fileName: string;
    rawText: string;
    subjectName: string;
    domainName: string;
  }): DocumentAnalysisResult {
    const { fileName, rawText, subjectName, domainName } = params;
    const roleInfo = this.classifyPedagogicalRole(fileName, rawText);

    // Tách văn bản thành các khối đoạn tự nhiên
    const rawParagraphs = rawText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 30);

    const detectedHeadings: string[] = [];
    const chunks: SemanticChunk[] = [];

    // Nhận diện các tiêu đề mục hoặc đề mục la mã/số
    const headingRegex = /^(chương\s+\d+|phần\s+\d+|bài\s+\d+|mục\s+\d+|i{1,3}\.|iv\.|v\.|vi\.|[0-9]+\.[0-9]+|[0-9]+\.\s+[A-ZÀ-Ỹ])/i;

    let currentHeading = `Tổng quan: ${fileName.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ")}`;
    let accumulatedText = "";
    let chunkIndexCounter = 1;

    const flushChunk = () => {
      if (accumulatedText.trim().length === 0) return;

      const cleanText = accumulatedText.trim();
      const readingSeconds = Math.max(15, Math.round((cleanText.split(/\s+/).length / 200) * 60));

      // Kỹ thuật Anthropic Contextual Retrieval:
      // Sinh tiền đề ngữ cảnh gắn vào đầu chunk để tránh mất ngữ cảnh khi Vector Search
      const contextualPrefix = `[Tài Liệu: ${domainName} > ${subjectName} | Phần: ${currentHeading}]`;
      const contextualContent = `${contextualPrefix}\n${cleanText}`;

      // Bóc tách các cụm từ khóa mấu chốt
      const keyPhrases = this.extractKeyPhrases(cleanText);

      chunks.push({
        chunkIndex: chunkIndexCounter,
        chunkId: `chunk-${chunkIndexCounter}-${Date.now().toString().slice(-4)}`,
        heading: currentHeading,
        rawContent: cleanText,
        contextualContent,
        estimatedReadingSeconds: readingSeconds,
        keyPhrases,
      });

      chunkIndexCounter++;
      accumulatedText = "";
    };

    if (rawParagraphs.length === 0) {
      // Trường hợp tệp không có nhiều đoạn dài, tạo 1-2 chunks tóm lược
      accumulatedText = rawText || `Nội dung tài liệu học thuật ${fileName}`;
      flushChunk();
    } else {
      for (const p of rawParagraphs) {
        // Kiểm tra xem đoạn này có phải là tiêu đề chuyển mục không
        const firstLine = p.split("\n")[0].trim();
        if (headingRegex.test(firstLine) || (firstLine.length < 90 && firstLine.endsWith(":"))) {
          // Bắt đầu một chủ đề mới -> flush chunk hiện tại
          flushChunk();
          currentHeading = firstLine;
          if (!detectedHeadings.includes(currentHeading)) {
            detectedHeadings.push(currentHeading);
          }
          accumulatedText = p;
        } else {
          // Gom nhóm đoạn văn nếu chưa vượt quá dung lượng tối ưu cho 1 Hạt nhân tri thức (~400-800 từ)
          if (accumulatedText.length + p.length > 2500) {
            flushChunk();
            accumulatedText = p;
          } else {
            accumulatedText = accumulatedText ? `${accumulatedText}\n\n${p}` : p;
          }
        }
      }
      flushChunk();
    }

    return {
      pedagogicalRole: roleInfo.role,
      pedagogicalRoleLabel: roleInfo.label,
      pedagogicalRoleDescription: roleInfo.description,
      totalChunks: chunks.length,
      chunks,
      detectedHeadings: detectedHeadings.slice(0, 10),
    };
  },

  /**
   * Bóc tách các cụm từ khóa học thuật quan trọng trong chunk
   */
  extractKeyPhrases(text: string): string[] {
    const words = text.match(/[A-ZÀ-Ỹa-zà-ỹ0-9_-]{3,}/g) || [];
    const stopWords = new Set([
      "trong", "những", "chúng", "được", "người", "khiến", "nguyên", "pháp", "theo",
      "nhiều", "không", "thành", "chuẩn", "chính", "hoạt", "động", "trình", "trên",
    ]);

    const freqMap: Record<string, number> = {};
    for (const w of words) {
      const lower = w.toLowerCase();
      if (!stopWords.has(lower) && lower.length >= 4) {
        freqMap[lower] = (freqMap[lower] || 0) + 1;
      }
    }

    return Object.entries(freqMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1));
  },
};
