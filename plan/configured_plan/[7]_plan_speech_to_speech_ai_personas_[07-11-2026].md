# Kế Hoạch [7]: Hệ Thống Hội Thoại Giọng Nói Hai Chiều (Speech-to-Speech AI Personas)

> **Trạng thái:** [Đang chờ / Backlog - Để làm sau theo yêu cầu người dùng]  
> **Ngày khởi tạo:** 07-11-2026  
> **Mục tiêu cốt lõi:** Thiết lập chu trình hội thoại bằng âm thanh hai chiều (Speech-to-Speech) trên bục giảng Feynman: Người học dùng giọng nói để giảng giải, Khán giả AI (Bé Bo, Bác Năm, Shark Tuấn...) tự động cất giọng nói tiếng Việt phản biện và đặt câu hỏi lại.

---

## 1. Tổng Quan Kiến Trúc Vòng Lặp Hội Thoại (Speech-to-Speech Loop)

```mermaid
sequenceDiagram
    autonumber
    actor Learner as Người Giảng (Learner)
    participant STT as Web Speech STT (useSpeechToText)
    participant Brain as AI Persona Core (LLM / Agent)
    participant TTS as Web Speech Synthesis (useTextToSpeech)
    participant Room as Bục Giảng Feynman (Live Room UI)

    Learner->>STT: Giảng giải bằng giọng nói ("Docker giống như...")
    STT->>Room: Stream text thời gian thực hiển thị vào Transcript
    Room->>Brain: Gửi bài giảng kèm Persona System Prompt & Lăng kính
    Brain->>Brain: Phát hiện Jargon, phân tích lỗ hổng logic & tạo câu hỏi Socrates
    Brain->>Room: Trả về câu hỏi dạng văn bản
    Room->>TTS: Kích hoạt giọng nói tương ứng của Persona
    TTS->>Learner: Phát âm thanh tiếng Việt với cao độ (pitch) & tốc độ (rate) đặc trưng
```

---

## 2. Lộ Trình Triển Khai Chi Tiết (Frontend First, Backend Khi Cần)

### Giai Đoạn 1: Giải Pháp Browser-Native (Ưu Tiên Triển Khai Trước - 0đ Chi Phí, Không Độ Trễ)
Sử dụng chuẩn W3C **Web Speech API - SpeechSynthesis** tích hợp sẵn trong trình duyệt.

1. **Tạo Hook chuyên dụng `src/hooks/useTextToSpeech.ts`:**
   - Quản lý danh sách voice tiếng Việt của hệ thống (`vi-VN`, ví dụ: *Google Tiếng Việt*, *Microsoft Hoài My*, *Microsoft Nam*).
   - Hàm `speak(text: string, options: PersonaVoiceOptions)`.
   - Trạng thái `isSpeaking`, `pause()`, `resume()`, `cancel()`.
   - Cơ chế tự động giải phóng bộ nhớ và hủy lời nói cũ khi có câu nói mới.

2. **Bản đồ cấu hình giọng nói theo từng Khán giả AI (`persona-voice.config.ts`):**
   - **Bé Bo (10 tuổi):** `pitch = 1.45`, `rate = 1.05` $\rightarrow$ Giọng trẻ con thanh cao, tò mò, nói lanh lợi.
   - **Chị Mai (29 tuổi - Nhân sự):** `pitch = 1.05`, `rate = 1.0` $\rightarrow$ Giọng nữ công sở chuẩn mực, lịch thiệp.
   - **Bác Năm (58 tuổi - Nông dân):** `pitch = 0.78`, `rate = 0.82` $\rightarrow$ Giọng nam trầm, ấm áp, nhịp điệu từ tốn.
   - **Shark Tuấn (42 tuổi - Nhà đầu tư):** `pitch = 0.92`, `rate = 1.12` $\rightarrow$ Giọng dứt khoát, sắc bén, tốc độ hơi nhanh.
   - **Khán giả tùy chỉnh (Custom Persona):** Tự động suy ra `pitch` dựa vào độ tuổi và `rate` dựa vào mức độ hoài nghi (Skepticism Slider).

3. **Tích hợp vào Bục Giảng ([`FeynmanStageLiveRoom.tsx`](file:///d:/Theodore/src/pages/FeynmanStageLiveRoom.tsx)):**
   - Nút bật/tắt âm thanh AI: `Bật tiếng / Tắt tiếng (Mute/Unmute)`.
   - Tùy chọn `Tự động đọc phản hồi (Auto-speak)` khi AI gửi câu hỏi.
   - Nút icon loa nhỏ trên từng bong bóng chat của AI để người học có thể bấm nghe lại bất cứ lúc nào.

---

### Giai Đoạn 2: Giải Pháp Nâng Cao (Full Duplex Realtime Stream)
*Tùy chọn nâng cấp cho tương lai khi cần biểu cảm giọng nói chân thực tối đa:*

1. **Gemini Multimodal Live API (hoặc OpenAI Realtime API):**
   - Truyền nhận trực tiếp luồng Audio qua WebSocket (`pcm16` 24kHz).
   - Tự động ngắt lời (Barge-in / Interruption handling): Khi người học cất giọng, AI ngay lập tức ngừng nói để lắng nghe.
2. **Backend TTS Proxy (`FastAPI`):**
   - Kết nối Edge-TTS hoặc Faster-Whisper nếu cần hỗ trợ các trình duyệt cũ không hỗ trợ Web Speech API.

---

## 3. Danh Sách Các File Cần Tạo / Chỉnh Sửa Khi Bắt Đầu Thực Hiện

### Files Mới Dự Kiến:
1. `src/hooks/useTextToSpeech.ts` *(Mới)*: Hook xử lý Text-to-Speech native.
2. `src/config/persona-voice.config.ts` *(Mới)*: Mapping thông số âm thanh (pitch, rate, voiceName) cho từng Persona.

### Files Chỉnh Sửa Dự Kiến:
3. `src/pages/FeynmanStageLiveRoom.tsx`: Gắn trigger đọc âm thanh khi nhận tin nhắn phản hồi của AI.
4. `src/components/stage/ChatTranscript.tsx`: Bổ sung nút nghe lại (Speaker icon) trên từng tin nhắn.
5. `src/pages/SettingsAndAIConfig.tsx`: Thêm mục cấu hình giọng đọc ưa thích và tốc độ nói mặc định.

---

## 4. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [ ] Người dùng nói qua Micro $\rightarrow$ Văn bản được nhận diện chính xác qua `useSpeechToText`.
- [ ] AI Persona trả lời $\rightarrow$ Tự động cất giọng nói tiếng Việt chuẩn.
- [ ] Giọng của Bé Bo khác biệt rõ rệt với giọng của Bác Năm và Shark Tuấn thông qua các tham số pitch/rate.
- [ ] Có nút tắt tiếng (Mute) ngay trên giao diện phòng giảng, không bắt buộc người học phải luôn nghe âm thanh.
- [ ] Hoạt động trơn tru không gây xung đột micro/loa (hủy TTS trước khi kích hoạt STT nếu người học bắt đầu nói).

