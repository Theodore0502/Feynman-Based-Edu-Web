/**
 * File: src/config/topics-presets.config.ts
 * Mục đích: Lưu trữ các chủ đề mẫu phân loại theo ngành (IT, Kinh tế, Y khoa, Khoa học) để gợi ý cho người học.
 * Thành phần chính:
 *   - TOPIC_CATEGORIES: Danh sách chuyên ngành.
 *   - PRESET_TOPICS: Mảng các chủ đề gợi ý sẵn.
 * Props/Inputs: Cấu hình tĩnh.
 */

export interface PresetTopic {
  id: string;
  category: "IT" | "ECONOMICS" | "MEDICINE" | "SCIENCE";
  title: string;
  description: string;
  coreJargons: string[];
  suggestedAnalogyBase: string;
}

export const PRESET_TOPICS: PresetTopic[] = [
  {
    id: "docker-container",
    category: "IT",
    title: "Cơ chế Docker & Container",
    description: "Giải thích container ảo hóa cấp hệ điều hành khác gì máy ảo nặng nề.",
    coreJargons: ["Container", "Image", "Kernel", "Virtual Machine"],
    suggestedAnalogyBase: "Căn hộ chung cư xây sẵn nội thất vs Mua cả miếng đất xây nhà riêng."
  },
  {
    id: "inflation-concept",
    category: "ECONOMICS",
    title: "Lạm phát & Sức mua",
    description: "Tại sao in thêm nhiều tiền lại làm cho mọi người nghèo đi?",
    coreJargons: ["Lạm phát", "Cung tiền", "Sức mua", "Lãi suất"],
    suggestedAnalogyBase: "Trò chơi đấu giá chỉ có 5 cái bánh mì nhưng người chơi đột ngột có gấp đôi tiền xu."
  },
  {
    id: "mrna-vaccine",
    category: "MEDICINE",
    title: "Vaccine công nghệ mRNA",
    description: "Cách cơ thể huấn luyện hệ miễn dịch mà không cần tiêm virus sống.",
    coreJargons: ["mRNA", "Kháng nguyên", "Kháng thể", "Bạch cầu"],
    suggestedAnalogyBase: "Gửi bản vẽ phác thảo lệnh truy nã tên trộm cho đội bảo vệ tập dượt."
  },
  {
    id: "black-hole-event-horizon",
    category: "SCIENCE",
    title: "Chân trời sự kiện Lỗ Đen",
    description: "Vùng ranh giới mà ngay cả ánh sáng cũng không thể thoát ra.",
    coreJargons: ["Chân trời sự kiện", "Vận tốc vũ trụ cấp 2", "Trọng lực vô hạn"],
    suggestedAnalogyBase: "Vòng xoáy nước giữa thác xiết, chèo xuồng qua vạch là không thể bơi ngược."
  }
];

