/**
 * File: src/config/persona-voice.config.ts
 * Purpose: Cấu hình thông số âm thanh (Voice Profile: pitch, rate, lang) cho từng Persona AI.
 * Hỗ trợ tạo sự khác biệt rõ rệt về âm sắc giữa các nhân vật (Bé Bắp, Chị Mai, Bác Năm, Shark Tuấn).
 */

export interface PersonaVoiceProfile {
  pitch: number; // 0.5 đến 2.0 (1.0 = bình thường)
  rate: number;  // 0.5 đến 1.5 (1.0 = tốc độ chuẩn)
  lang: string;  // Chuẩn ngôn ngữ BCP 47 (mặc định 'vi-VN')
  label: string; // Mô tả đặc tính âm sắc
  gender: "female" | "male" | "child";
}

/**
 * Bản đồ cấu hình giọng nói chuẩn cho 4 Persona mặc định của Theodore
 */
export const DEFAULT_PERSONA_VOICES: Record<string, PersonaVoiceProfile> = {
  // 1. Bé Bắp (10 tuổi): Giọng trẻ con thanh cao, tò mò, nói lanh lợi, trong trẻo
  child_10yo: {
    pitch: 1.45,
    rate: 1.05,
    lang: "vi-VN",
    label: "Giọng trẻ em 10 tuổi (Thanh cao, trong trẻo, lanh lợi)",
    gender: "child",
  },

  // 2. Chị Mai (29 tuổi): Giọng nữ công sở chuẩn mực, lịch thiệp, dễ gần
  non_tech: {
    pitch: 1.08,
    rate: 1.0,
    lang: "vi-VN",
    label: "Giọng nữ công sở 29 tuổi (Chuẩn mực, lịch thiệp, dễ tiếp thu)",
    gender: "female",
  },

  // 3. Bác Năm (58 tuổi): Giọng nam trầm ấm, mộc mạc, từ tốn, chất phác
  farmer: {
    pitch: 0.78,
    rate: 0.85,
    lang: "vi-VN",
    label: "Giọng nam trung niên 58 tuổi (Trầm ấm, từ tốn, mộc mạc)",
    gender: "male",
  },

  // 4. Shark Tuấn (42 tuổi): Giọng nam dứt khoát, điềm tĩnh, tốc độ hơi nhanh, sắc bén
  investor: {
    pitch: 0.92,
    rate: 1.12,
    lang: "vi-VN",
    label: "Giọng nam thương gia 42 tuổi (Dứt khoát, sắc bén, tốc độ nhanh)",
    gender: "male",
  },
};

/**
 * Tính toán thông số âm thanh tự động cho Persona tùy chỉnh (Custom Persona)
 */
export function getCustomPersonaVoice(ageStr?: string, skepticismLevel: number = 5): PersonaVoiceProfile {
  let pitch = 1.0;
  let rate = 1.0;
  let gender: "female" | "male" | "child" = "female";

  const parsedAge = parseInt(ageStr || "25", 10);
  if (!isNaN(parsedAge)) {
    if (parsedAge <= 14) {
      pitch = 1.42;
      rate = 1.04;
      gender = "child";
    } else if (parsedAge >= 55) {
      pitch = 0.8;
      rate = 0.85;
      gender = "male";
    } else {
      pitch = 1.02;
      rate = 1.0;
    }
  }

  // Mức độ hoài nghi cao -> nói nhanh và sắc nét hơn
  if (skepticismLevel >= 8) {
    rate = Math.min(1.25, rate + 0.1);
  } else if (skepticismLevel <= 3) {
    rate = Math.max(0.8, rate - 0.05);
  }

  return {
    pitch,
    rate,
    lang: "vi-VN",
    label: `Giọng tùy chỉnh (~${parsedAge || 25} tuổi, hoài nghi cấp ${skepticismLevel})`,
    gender,
  };
}

/**
 * Lấy cấu hình âm thanh cho Persona bất kỳ theo ID
 */
export function getPersonaVoiceProfile(personaId: string, customAge?: string, skepticismLevel?: number): PersonaVoiceProfile {
  if (DEFAULT_PERSONA_VOICES[personaId]) {
    return DEFAULT_PERSONA_VOICES[personaId];
  }
  return getCustomPersonaVoice(customAge, skepticismLevel);
}

/**
 * Danh sách ưu tiên các voice tiếng Việt tự nhiên trên các hệ điều hành phổ biến
 */
export const PREFERRED_VIETNAMESE_VOICES = [
  "Google Tiếng Việt",
  "Microsoft Hoài My Online (Natural) - Vietnamese (Vietnam)",
  "Microsoft Nam Online (Natural) - Vietnamese (Vietnam)",
  "Microsoft An Online (Natural) - Vietnamese (Vietnam)",
  "Linh",
  "vi-VN",
  "vietnamese",
];

/**
 * Tìm voice tiếng Việt tối ưu nhất từ danh sách Web Speech Voices của trình duyệt
 */
export function findBestVietnameseVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  // 1. Tìm theo tên ưu tiên
  for (const preferred of PREFERRED_VIETNAMESE_VOICES) {
    const match = voices.find(
      (v) =>
        v.name.toLowerCase().includes(preferred.toLowerCase()) ||
        v.lang.toLowerCase().replace("_", "-") === preferred.toLowerCase()
    );
    if (match) return match;
  }

  // 2. Tìm bất kỳ voice nào có lang bắt đầu bằng vi
  const viVoice = voices.find((v) => v.lang.toLowerCase().startsWith("vi"));
  if (viVoice) return viVoice;

  // 3. Fallback về voice mặc định của hệ thống
  return voices.find((v) => v.default) || voices[0] || null;
}

/**
 * Làm sạch văn bản trước khi đưa vào bộ đọc Text-to-Speech (bỏ emoji, mã markdown, url)
 */
export function cleanTextForSpeech(rawText: string): string {
  if (!rawText) return "";

  return rawText
    // Bỏ các khối mã code
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    // Bỏ các ký tự emoji phổ biến
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
    // Bỏ định dạng markdown bold, italic
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    // Bỏ các tag vuông chú thích như [THẤU SUỐT]
    .replace(/\[[^\]]+\]/g, "")
    // Thu gọn khoảng trắng thừa
    .replace(/\s+/g, " ")
    .trim();
}

