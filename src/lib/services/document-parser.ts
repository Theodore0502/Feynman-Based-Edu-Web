/**
 * File: src/lib/services/document-parser.ts
 * Purpose: Bóc tách văn bản thực tế từ các định dạng tệp học thuật (.docx, .pdf, .txt, .md, .json).
 * Hỗ trợ cả môi trường Node.js (Buffer) và Trình duyệt Web (File / ArrayBuffer / Blob).
 */

import mammoth from "mammoth";
import { SystemLogger } from "./system-logger";

export interface ParsedDocumentResult {
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  extractedText: string;
  characterCount: number;
  wordCount: number;
  parsingDurationMs: number;
  warning?: string;
}

export const DocumentParser = {
  /**
   * Bóc tách toàn bộ văn bản từ tệp File / Blob / Buffer
   */
  async parseDocument(file: File | Blob | { name: string; buffer: Buffer; type?: string }): Promise<ParsedDocumentResult> {
    const startTime = Date.now();
    let fileName = "unknown_document";
    let fileSizeBytes = 0;
    let fileType = "application/octet-stream";
    let arrayBuffer: ArrayBuffer;

    if ("size" in file && "name" in file && typeof (file as any).arrayBuffer === "function") {
      // Đối tượng File / Blob tiêu chuẩn Web API
      const webFile = file as File;
      fileName = webFile.name;
      fileSizeBytes = webFile.size;
      fileType = webFile.type || this.detectMimeFromName(webFile.name);
      arrayBuffer = await webFile.arrayBuffer();
    } else if ("buffer" in file) {
      // Đối tượng Node.js Buffer
      const nodeFile = file as { name: string; buffer: Buffer; type?: string };
      fileName = nodeFile.name;
      fileSizeBytes = nodeFile.buffer.length;
      fileType = nodeFile.type || this.detectMimeFromName(nodeFile.name);
      arrayBuffer = nodeFile.buffer.buffer.slice(
        nodeFile.buffer.byteOffset,
        nodeFile.buffer.byteOffset + nodeFile.buffer.byteLength
      ) as ArrayBuffer;
    } else {
      throw new Error("Định dạng đối tượng file không được hỗ trợ");
    }

    let extractedText = "";
    let warning: string | undefined;

    const lowerName = fileName.toLowerCase();

    try {
      if (lowerName.endsWith(".docx")) {
        // Xử lý tài liệu Microsoft Word (.docx) qua mammoth (tương thích cả Node Buffer và Web ArrayBuffer)
        let mammothResult: any;
        if (typeof Buffer !== "undefined") {
          mammothResult = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) });
        } else {
          mammothResult = await (mammoth as any).extractRawText({ arrayBuffer });
        }
        extractedText = (mammothResult.value || "").trim();
        if (mammothResult.messages && mammothResult.messages.length > 0) {
          warning = mammothResult.messages.map((m: any) => m.message).join("; ");
        }
      } else if (
        lowerName.endsWith(".txt") ||
        lowerName.endsWith(".md") ||
        lowerName.endsWith(".json") ||
        lowerName.endsWith(".csv")
      ) {
        // Tệp văn bản thuần
        const decoder = new TextDecoder("utf-8");
        extractedText = decoder.decode(arrayBuffer).trim();
      } else if (lowerName.endsWith(".pdf") || lowerName.endsWith(".pdfa")) {
        // Bóc tách PDF chuẩn xác bằng pdfjs-dist (hỗ trợ cả font có dấu và cấu trúc trang)
        extractedText = await this.extractPdfText(arrayBuffer);
      } else {
        // Định dạng khác, thử đọc UTF-8
        const decoder = new TextDecoder("utf-8");
        extractedText = decoder.decode(arrayBuffer).trim();
      }

      // Làm sạch khoảng trắng thừa
      extractedText = extractedText.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");

      const duration = Date.now() - startTime;
      const wordCount = extractedText.split(/\s+/).filter(Boolean).length;

      SystemLogger.info(
        "FILE_PARSER",
        "PARSE_DOCUMENT",
        `Đã bóc tách thành công văn bản tệp [${fileName}]: ${extractedText.length} ký tự, ${wordCount} từ trong ${duration}ms`,
        { fileName, fileSizeBytes, characterCount: extractedText.length, wordCount }
      );

      return {
        fileName,
        fileType,
        fileSizeBytes,
        extractedText,
        characterCount: extractedText.length,
        wordCount,
        parsingDurationMs: duration,
        warning,
      };
    } catch (err: any) {
      SystemLogger.error(
        "FILE_PARSER",
        "PARSE_DOCUMENT",
        `Lỗi khi bóc tách văn bản tệp [${fileName}]: ${err.message}`,
        err
      );
      throw err;
    }
  },

  async extractPdfText(arrayBuffer: ArrayBuffer): Promise<string> {
    try {
      const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.js");
      if (typeof window !== "undefined" && pdfjsLib.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
      }
      const data = new Uint8Array(arrayBuffer);
      const loadingTask = pdfjsLib.getDocument({
        data,
        useSystemFonts: true,
        disableFontFace: true,
      });
      const pdfDoc = await loadingTask.promise;

      let fullText = "";
      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        for (const item of textContent.items) {
          if ("str" in item) {
            fullText += (item as any).str + ((item as any).hasEOL ? "\n" : " ");
          }
        }
        fullText += "\n";
      }
      return fullText.trim();
    } catch (err: any) {
      SystemLogger.warn("FILE_PARSER", "PDF_PARSER_ERROR", `Lỗi bóc tách PDF: ${err.message}`);
      // Fallback an toàn: Chỉ lấy chuỗi văn bản UTF-8 trong Tj blocks, tuyệt đối không dump binary stream
      try {
        const decoder = new TextDecoder("utf-8", { fatal: false });
        const raw = decoder.decode(arrayBuffer);
        const matches = raw.match(/\(([^()]+)\)[\s]*Tj/g);
        if (matches && matches.length > 0) {
          return matches
            .map((m) => m.replace(/^\(/, "").replace(/\)[\s]*Tj$/, ""))
            .join(" ")
            .trim();
        }
      } catch {
        // bỏ qua
      }
      return "";
    }
  },

  detectMimeFromName(name: string): string {
    const lower = name.toLowerCase();
    if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (lower.endsWith(".pdf")) return "application/pdf";
    if (lower.endsWith(".pptx")) return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    if (lower.endsWith(".txt")) return "text/plain";
    if (lower.endsWith(".md")) return "text/markdown";
    if (lower.endsWith(".json")) return "application/json";
    return "application/octet-stream";
  },
};
