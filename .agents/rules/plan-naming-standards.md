---
description: Quy định bắt buộc về quy chuẩn đặt tên file cho tất cả các bản kế hoạch (plans) được tạo ra trong dự án Theodore
globs: ["plan/**/*.md", "plan/**/*.txt"]
---

# Quy Định Chuẩn Đặt Tên File Kế Hoạch (Plan Naming Standards)

Tất cả các AI Agent và thành viên phát triển dự án Theodore **BẮT BUỘC TUÂN THỦ 100%** quy tắc đặt tên cho mọi tài liệu kế hoạch (plan) được tạo ra trong thư mục `plan/` (bao gồm `plan/configured_plan/` và `plan/raw_plan/`):

---

## 1. Cấu Trúc Bắt Buộc Của Tên File Plan

Mỗi file kế hoạch phải tuân theo cấu trúc chuẩn:
```text
[<Số_Thứ_Tự>]_<Tên_Kế_Hoạch>_[<dd-mm-yyyy>].md
```

### Chi Tiết Từng Phần:
1. **Số thứ tự ở đầu tên:**
   - Đặt trong ngoặc vuông: `[1]`, `[2]`, `[3]`, ...
   - Giá trị **tăng dần (+ dồn lên 1 đơn vị)** dựa trên số thứ tự lớn nhất của các plan hiện có trong thư mục.
2. **Tên mô tả kế hoạch:**
   - Tên ngắn gọn, súc tích phản ánh đúng nội dung (ví dụ: `plan_study_mode`, `plan_pages`, `plan_auth_system`).
3. **Ngày tạo ở cuối tên:**
   - Thể hiện ngày tháng năm tạo plan.
   - **Lưu ý kỹ thuật hệ điều hành Windows:** Do Windows/NTFS cấm các ký tự `< > / \ : * ? " |` trong tên file, định dạng ngày `<dd/mm/yyyy>` được biểu diễn an toàn qua cặp ngoặc vuông `[dd-mm-yyyy]` (Ví dụ: `[06-11-2026]`).

---

## 2. Ví Dụ Mẫu Hợp Lệ

- `[1]_plan_study_mode_[06-11-2026].md`
- `[2]_plan_audio_voice_pipeline_[07-11-2026].md`
- `[3]_plan_spaced_repetition_sm2_[08-11-2026].md`

---

## 3. Quy Trình Khởi Tạo File Plan Mới Của Agent

Mỗi khi người dùng yêu cầu tạo bản kế hoạch mới:
1. Quét danh sách file hiện có trong thư mục đích (`plan/configured_plan/` hoặc `plan/raw_plan/`).
2. Xác định số thứ tự kế tiếp: `Số mới = Số thứ tự cao nhất hiện tại + 1` (nếu chưa có file thì bắt đầu từ `[1]`).
3. Lấy ngày tạo hiện tại theo định dạng `[dd-mm-yyyy]`.
4. Tạo file theo chuẩn: `[<index>]_<plan_name>_[<dd-mm-yyyy>].md`.
