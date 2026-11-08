---
description: Quy định bắt buộc: Nghiêm cấm hardcode dữ liệu danh mục học thuật, đồ thị tri thức, bài giảng, và phiên học. Mọi dữ liệu phải được lưu trữ và truy vấn trực tiếp từ Supabase Database.
globs: ["**/*.ts", "**/*.tsx", "**/*.py"]
---

# Quy Định Bắt Buộc: Cấm Hardcode Dữ Liệu - Supabase Là Nguồn Chân Lý (Source of Truth)

Tất cả các AI Agent và thành viên phát triển dự án Theodore **BẮT BUỘC TUÂN THỦ 100%**:

---

## 1. Nguyên Tắc Cốt Lõi: Supabase First
1. **Tuyệt đối không hardcode dữ liệu tĩnh (static mock/catalog lists)** trong các components giao diện (`/topics`, `/lectures`, `/stage`, v.v.).
2. Toàn bộ dữ liệu về:
   - **8 Nhóm Ngành học (`academic_domains`)**
   - **Danh mục Môn học (`academic_subjects`)**
   - **Liên kết đa chiều Môn - Ngành (`domain_subjects`)**
   - **Bài học chi tiết (`academic_topics`)**
   - **Phiên học thật, tin nhắn & báo cáo (`sessions`, `learning_sessions`, `messages`, `evaluation_reports`)**
   **BẮT BUỘC PHẢI ĐƯỢC LƯU TRỮ VÀ TRUY VẤN TRỰC TIẾP TỪ SUPABASE CLOUD**.

---

## 2. Quy Định Triển Khai Trong Mã Nguồn

### 2.1 Tầng Truy Vấn (Services / Hooks)
- Mọi trang UI phải gọi thông qua Service Layer (ví dụ: `CurriculumService`, `SupabaseService`) để query Supabase bằng `@supabase/supabase-js`.
- Tuyệt đối không import từ các file dữ liệu tĩnh cũ (như `academic-catalog.data.ts` hay danh sách 4 ngành cũ).

### 2.2 Cơ Chế Resilience (Fallback Offline)
- Để đảm bảo giao diện không bao giờ bị crash hoặc trắng màn hình khi chưa có mạng, dịch vụ được phép sử dụng cấu trúc fallback đồng bộ từ `src/data/three-tier-curriculum.data.ts` trong frame đầu tiên, nhưng **ngay lập tức phải kích hoạt `useEffect` để fetch dữ liệu sống từ Supabase**.

### 2.3 Khi Thay Đổi Cấu Trúc Dữ Liệu
- Mọi bổ sung ngành học, môn học, bài học mới phải đi qua migration SQL hoặc API upsert lên Supabase.
- Không được thêm trực tiếp vào file `.ts` mà không cập nhật Supabase.
