# Feynman-Based-Edu-Web

**Theodore • Feynman Technique Stage** — Nền tảng học tập tương tác giúp người học hiểu sâu và ghi nhớ lâu bằng cách giảng lại kiến thức cho AI Agent theo phương pháp Feynman.

---

## 🌟 Tính Năng Nổi Bật

1. **Học Qua Giảng Giải (Learning by Teaching):** Người học đóng vai trò người giảng dạy, AI đóng vai trò người nghe tò mò chưa biết gì (Đứa trẻ 10 tuổi, Chuyên viên trái ngành, Bác nông dân, Nhà đầu tư).
2. **Kiến Trúc Tác Nhân 2 Tầng (2-Layer Agent Pipeline):**
   - **Tầng 1 (Background Analytical Engine):** Phân tích ngầm phát hiện thuật ngữ chuyên ngành chưa giải thích (`JargonDetector`), bước nhảy cóc tư duy (`LogicGapFinder`) và tính điểm mạch lạc (`ClarityEvaluator`).
   - **Tầng 2 (Persona Socratic Stream):** Phản hồi bằng câu hỏi Socrates ngắn gọn (1-2 câu) đúng với lăng kính thế giới quan của nhân vật.
3. **Giọng Nói Không Độ Trễ (Web Speech API):** Thu âm trực tiếp trên trình duyệt chuyển thành văn bản thời gian thực.
4. **Báo Cáo Năng Lực (Feynman Mastery Card):** Tổng kết điểm độ bình dân hóa, chuỗi logic, trích xuất ẩn dụ hay nhất và lưu thuật ngữ vào Vault.
5. **Giao Diện Thẩm Mỹ Pastel:** Bảng màu pastel êm mắt, cấu trúc module kế thừa 100%.

---

## 🚀 Công Nghệ Sử Dụng (Tech Stack)

- **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide Icons, Zustand, React Router.
- **Backend & AI:** Vercel AI SDK, Google Gemini / OpenAI compatible.
- **Database:** Prisma ORM, SQLite (`dev.db`).
- **Voice:** Browser Native Web Speech API (`webkitSpeechRecognition`).

---

## 📦 Hướng Dẫn Cài Đặt & Chạy Cục Bộ

1. Cài đặt dependencies:
   ```bash
   npm install
   ```

2. Khởi tạo cơ sở dữ liệu Prisma SQLite:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. Cấu hình biến môi trường trong file `.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   DATABASE_URL="file:./dev.db"
   ```

4. Khởi chạy ứng dụng:
   ```bash
   npm run dev
   ```
   Mở trình duyệt tại: `http://localhost:3000`
