/**
 * File: src/config/rubrics.config.ts
 * Mục đích: Định nghĩa trọng số chấm điểm và các ngưỡng thông hiểu (Mastery thresholds) theo Kỹ thuật Feynman.
 * Thành phần chính:
 *   - SCORING_RUBRICS: Trọng số các tiêu chí (Độ bình dân hóa từ ngữ, Tính mạch lạc liên kết, Sử dụng ẩn dụ trực quan).
 *   - MASTERY_THRESHOLDS: Các mốc điểm (Cần cải thiện <60, Đạt 70, Tinh thông Mastery >=85).
 * Props/Inputs: Cấu hình tĩnh.
 */

export const SCORING_RUBRICS = {
  JARGON_FREE_WEIGHT: 0.35,      // Trọng số không dùng thuật ngữ chưa giải thích
  LOGIC_COHERENCE_WEIGHT: 0.35,  // Trọng số mạch lạc không có bước nhảy cóc
  ANALOGY_QUALITY_WEIGHT: 0.30,  // Trọng số sử dụng ẩn dụ đời thường chính xác
};

export const MASTERY_THRESHOLDS = {
  NEEDS_WORK: 59,
  PASSING: 70,
  PROFICIENT: 80,
  FEYNMAN_MASTER: 90,
};

export const getMasteryLevel = (score: number) => {
  if (score >= MASTERY_THRESHOLDS.FEYNMAN_MASTER) {
    return { level: "Feynman Master", color: "#76D7C4", description: "Hiểu sâu sắc và giải thích cực kỳ bình dân" };
  }
  if (score >= MASTERY_THRESHOLDS.PROFICIENT) {
    return { level: "Thấu Suốt", color: "#8EA7E9", description: "Mạch lạc, ít thuật ngữ thừa" };
  }
  if (score >= MASTERY_THRESHOLDS.PASSING) {
    return { level: "Đạt Yêu Cầu", color: "#F8C471", description: "Hiểu cơ bản nhưng còn vài thuật ngữ chưa rõ" };
  }
  return { level: "Cần Rèn Thêm", color: "#F79D9D", description: "Nhiều lỗ hổng logic hoặc phụ thuộc vào thuật ngữ" };
};

