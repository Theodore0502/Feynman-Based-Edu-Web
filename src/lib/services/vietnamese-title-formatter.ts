/**
 * File: src/lib/services/vietnamese-title-formatter.ts
 * Mục đích: Tự động trích xuất và chuẩn hóa Tiêu đề Bài Giảng sang TIẾNG VIỆT CÓ DẤU CHUẨN MỰC
 *           (Full diacritics & Title Case), bảo toàn các thuật ngữ kỹ thuật viết tắt quốc tế.
 * Tính năng:
 *   1. Ưu tiên bóc tách tiêu đề chính thức từ 1-3 dòng đầu của văn bản tài liệu (.docx, .pdf).
 *   2. Phục hồi tiếng Việt có dấu từ tên tệp (filename) qua từ điển cụm từ học thuật chuyên ngành.
 *   3. Chuẩn hóa Title Case tiếng Việt, bảo toàn các từ viết tắt công nghệ (API, SQL, ACID, TCP/IP, Docker, AI, etc.).
 */

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

export const VIETNAMESE_PHRASES: Array<[RegExp, string]> = [
  [/giao[-_\s]+trinh/gi, "Giáo Trình"],
  [/do[-_\s]+an/gi, "Đồ Án"],
  [/lien[-_\s]+nganh/gi, "Liên Ngành"],
  [/tich[-_\s]+hop/gi, "Tích Hợp"],
  [/phat[-_\s]+trien[-_\s]+ung[-_\s]+dung[-_\s]+web/gi, "Phát Triển Ứng Dụng Web"],
  [/phat[-_\s]+trien/gi, "Phát Triển"],
  [/ung[-_\s]+dung/gi, "Ứng Dụng"],
  [/thiet[-_\s]+ke/gi, "Thiết Kế"],
  [/thi[-_\s]+giac[-_\s]+may[-_\s]+tinh/gi, "Thị Giác Máy Tính"],
  [/nhan[-_\s]+dien[-_\s]+vat[-_\s]+the/gi, "Nhận Diện Vật Thể"],
  [/nhan[-_\s]+dien[-_\s]+doi[-_\s]+tuong/gi, "Nhận Diện Đối Tượng"],
  [/nhan[-_\s]+dien/gi, "Nhận Diện"],
  [/he[-_\s]+co[-_\s]+so[-_\s]+du[-_\s]+lieu/gi, "Hệ Cơ Sở Dữ Liệu"],
  [/co[-_\s]+so[-_\s]+du[-_\s]+lieu/gi, "Cơ Sở Dữ Liệu"],
  [/he[-_\s]+quan[-_\s]+tri/gi, "Hệ Quản Trị"],
  [/quan[-_\s]+tri[-_\s]+sql/gi, "Quản Trị SQL"],
  [/quan[-_\s]+tri[-_\s]+he[-_\s]+thong/gi, "Quản Trị Hệ Thống"],
  [/quan[-_\s]+tri[-_\s]+san[-_\s]+tmdt/gi, "Quản Trị Sàn TMĐT"],
  [/mang[-_\s]+may[-_\s]+tinh/gi, "Mạng Máy Tính"],
  [/truyen[-_\s]+thong[-_\s]+du[-_\s]+lieu/gi, "Truyền Thông Dữ Liệu"],
  [/truyen[-_\s]+thong/gi, "Truyền Thông"],
  [/ha[-_\s]+tang[-_\s]+mang/gi, "Hạ Tầng Mạng"],
  [/ha[-_\s]+tang/gi, "Hạ Tầng"],
  [/dien[-_\s]+toan[-_\s]+dam[-_\s]+may/gi, "Điện Toán Đám Mây"],
  [/cong[-_\s]+nghe[-_\s]+container/gi, "Công Nghệ Container"],
  [/cong[-_\s]+nghe/gi, "Công Nghệ"],
  [/an[-_\s]+toan[-_\s]+thong[-_\s]+tin/gi, "An Toàn Thông Tin"],
  [/an[-_\s]+ninh[-_\s]+mang/gi, "An Ninh Mạng"],
  [/ma[-_\s]+hoa[-_\s]+cong[-_\s]+khai/gi, "Mã Hóa Công Khai"],
  [/ma[-_\s]+hoa/gi, "Mã Hóa"],
  [/chuan[-_\s]+hoa/gi, "Chuẩn Hóa"],
  [/tri[-_\s]+tue[-_\s]+nhan[-_\s]+tao/gi, "Trí Tuệ Nhân Tạo"],
  [/hoc[-_\s]+may/gi, "Học Máy"],
  [/kien[-_\s]+truc[-_\s]+may[-_\s]+tinh/gi, "Kiến Trúc Máy Tính"],
  [/kien[-_\s]+truc/gi, "Kiến Trúc"],
  [/he[-_\s]+dieu[-_\s]+hanh/gi, "Hệ Điều Hành"],
  [/cau[-_\s]+truc[-_\s]+du[-_\s]+lieu/gi, "Cấu Trúc Dữ Liệu"],
  [/giai[-_\s]+thuat/gi, "Giải Thuật"],
  [/thuat[-_\s]+toan/gi, "Thuật Toán"],
  [/toan[-_\s]+roi[-_\s]+rac/gi, "Toán Rời Rạc"],
  [/ly[-_\s]+thuyet[-_\s]+do[-_\s]+thi/gi, "Lý Thuyết Đồ Thị"],
  [/ly[-_\s]+thuyet[-_\s]+va[-_\s]+ky[-_\s]+thuat[-_\s]+hoc[-_\s]+tap/gi, "Lý Thuyết Và Kỹ Thuật Học Tập"],
  [/ly[-_\s]+thuyet/gi, "Lý Thuyết"],
  [/ky[-_\s]+thuat/gi, "Kỹ Thuật"],
  [/hoc[-_\s]+tap/gi, "Học Tập"],
  [/chuyen[-_\s]+khoa/gi, "Chuyên Khảo"],
  [/chuyen[-_\s]+de/gi, "Chuyên Đề"],
  [/quan[-_\s]+tri/gi, "Quản Trị"],
  [/kinh[-_\s]+doanh/gi, "Kinh Doanh"],
  [/thuong[-_\s]+mai[-_\s]+dien[-_\s]+tu/gi, "Thương Mại Điện Tử"],
  [/ke[-_\s]+toan/gi, "Kế Toán"],
  [/kiem[-_\s]+toan/gi, "Kiểm Toán"],
  [/tai[-_\s]+chinh/gi, "Tài Chính"],
  [/ngan[-_\s]+hang/gi, "Ngân Hàng"],
  [/du[-_\s]+lich/gi, "Du Lịch"],
  [/khach[-_\s]+san/gi, "Khách Sạn"],
  [/y[-_\s]+khoa/gi, "Y Khoa"],
  [/duoc[-_\s]+hoc/gi, "Dược Học"],
  [/giao[-_\s]+tiep/gi, "Giao Tiếp"],
  [/mo[-_\s]+hinh/gi, "Mô Hình"],
  [/he[-_\s]+thong/gi, "Hệ Thống"],
  [/tong[-_\s]+quan/gi, "Tổng Quan"],
  [/nang[-_\s]+cao/gi, "Nâng Cao"],
  [/can[-_\s]+ban/gi, "Căn Bản"],
  [/co[-_\s]+ban/gi, "Cơ Bản"],
  [/kiem[-_\s]+thu/gi, "Kiểm Thử"],
  [/chat[-_\s]+luong/gi, "Chất Lượng"],
  [/phan[-_\s]+mem/gi, "Phần Mềm"],
  [/khoa[-_\s]+hoc[-_\s]+may[-_\s]+tinh/gi, "Khoa Học Máy Tính"],
];

/**
 * Định dạng chuỗi văn bản tiếng Việt sang Title Case và bảo toàn từ viết tắt kỹ thuật
 */
export function toVietnameseTitleCase(str: string): string {
  // Chuẩn hóa dấu mở ngoặc sát chữ
  let cleaned = str.replace(/([^\s])\(/g, "$1 (");
  cleaned = cleaned.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  const words = cleaned.split(" ");

  return words
    .map((w) => {
      const lower = w.toLowerCase().replace(/[^a-z0-9\/]/g, "");
      if (TECH_ACRONYMS[lower]) {
        // Giữ lại dấu câu đi kèm nếu có (ví dụ: "API," hay "SQL:")
        const punctuation = w.replace(/[a-zA-Z0-9\/]/g, "");
        return TECH_ACRONYMS[lower] + punctuation;
      }
      if (w.length === 0) return "";
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

/**
 * Phục hồi tiêu đề tiếng Việt có dấu từ tên tệp (filename)
 */
export function restoreVietnameseFromFilename(rawFileName: string): string {
  let clean = rawFileName.replace(/\.[^/.]+$/, "");
  clean = clean.replace(/[-_]?(v\d+|final|draft|copy|preview)$/i, "");

  // Áp dụng từ điển cụm từ học thuật có dấu
  for (const [pattern, replacement] of VIETNAMESE_PHRASES) {
    clean = clean.replace(pattern, replacement);
  }

  // Tách từ và chuẩn hóa casing
  clean = clean.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return clean
    .split(" ")
    .map((w) => {
      const lower = w.toLowerCase().replace(/[^a-z0-9\/]/g, "");
      if (TECH_ACRONYMS[lower]) {
        const punctuation = w.replace(/[a-zA-Z0-9\/]/g, "");
        return TECH_ACRONYMS[lower] + punctuation;
      }
      if (w.length === 0) return "";
      // Nếu từ đã có dấu tiếng Việt (chứa ký tự ngoài ASCII), giữ nguyên ký tự có dấu
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

  // Tìm trong 4 dòng đầu tiên của tài liệu
  for (let i = 0; i < Math.min(4, lines.length); i++) {
    let candidate = lines[i];

    // Bỏ qua nếu dòng quá ngắn hoặc chỉ là tiền đề tài liệu chuyên khảo
    if (
      candidate.length <= 25 &&
      /^(tài liệu chuyên khảo|chuyên khảo|chuyên đề|bản thảo|draft|mục lục|lời nói đầu)$/i.test(
        candidate
      )
    ) {
      continue;
    }

    // Nếu dòng có độ dài hợp lý cho tiêu đề bài giảng (12 - 130 ký tự)
    if (candidate.length >= 12 && candidate.length <= 130) {
      // Kiểm tra xem có chứa ký tự tiếng Việt hoặc từ khóa học thuật
      const hasVietnameseAccents =
        /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(
          candidate
        );
      const hasAcademicKeywords =
        /giáo trình|đồ án|bài giảng|hệ thống|kiến trúc|mô hình|phát triển|cơ sở dữ liệu|mạng|an toàn|an ninh|điện toán|lý thuyết|kỹ thuật/i.test(
          candidate
        );

      if (hasVietnameseAccents || hasAcademicKeywords) {
        return toVietnameseTitleCase(candidate);
      }
    }
  }

  // Fallback: Phục hồi tiếng Việt có dấu từ tên tệp
  return restoreVietnameseFromFilename(rawFileName);
}
