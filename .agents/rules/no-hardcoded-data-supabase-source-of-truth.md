---
description: Quy định bất biến toàn dự án Theodore: Cấm tuyệt đối hardcode dữ liệu và cấm chỉ lưu dữ liệu ở local. Toàn bộ dữ liệu phát sinh (tài liệu, bản nháp, bài giảng, phiên học, nhãn tri thức) bắt buộc phải lưu và đọc trực tiếp từ Supabase Database & Storage.
globs: ["**/*.ts", "**/*.tsx", "**/*.py", "**/*.sql"]
---

# Quy Định Bắt Buộc: Cấm Tuyệt Đối Hardcode - Toàn Bộ Dữ Liệu Phải Lưu Trữ & Truy Vấn Trực Tiếp Từ Supabase

Tất cả các AI Agent và thành viên tham gia phát triển dự án Theodore **BẮT BUỘC TUÂN THỦ 100% CÁC QUY TẮC DƯỚI ĐÂY TRONG MỌI LẦN VIẾT CODE**:

---

## 1. NGUYÊN TẮC CỐT LÕI: SUPABASE LÀ NGUỒN CHÂN LÝ DUY NHẤT (SINGLE SOURCE OF TRUTH)

1. **CẤM TUYỆT ĐỐI HARDCODE DỮ LIỆU TĨNH**:
   - Nghiêm cấm tạo các file JSON, hằng số mảng tĩnh (mock/static arrays) chứa danh mục ngành, môn học, bài giảng, nhãn khái niệm cốt lõi hay bẫy thuật ngữ để ép buộc hệ thống.
   - Không được hardcode ID, tên bài giảng, nhãn tri thức hoặc danh sách tài liệu trong các components giao diện (`src/pages/*`, `src/components/*`).

2. **CẤM LƯU DỮ LIỆU CÔ LẬP TRÊN LOCAL**:
   - Nghiêm cấm việc chỉ lưu dữ liệu vào `localStorage`, `sessionStorage`, `IndexedDB`, hay file cục bộ mà bỏ qua Supabase.
   - `localStorage` chỉ được phép đóng vai trò làm bộ nhớ đệm tạm thời (temporary client-side cache) để tối ưu thời gian phản hồi giao diện.
   - **Mọi thao tác Thêm (Insert), Sửa (Update), Xóa (Delete), Thẩm định (Validate/Approve), Từ chối (Reject)** BẮT BUỘC PHẢI thực thi lệnh trực tiếp lên bảng Supabase tương ứng ngay tại thời điểm thao tác.

---

## 2. QUY CHUẨN LƯU TRỮ CHI TIẾT THEO PHÂN HỆ

### 2.1. Tải Lên Tài Liệu & Bản Nháp Thẩm Định (Upload & Curator Drafts)
- **Tài liệu tải lên (`.pdf`, `.docx`, `.pptx`)**: Phải lưu metadata, đường dẫn tệp (`storage_file_path`), văn bản trích xuất và liên kết bài học vào bảng `public.academic_materials` trên Supabase.
- **Bản nháp bài học do Agent bóc tách (Lesson Drafts)**: Khi Agent trích xuất từ tài liệu, bản nháp và các trường tri thức (`title`, `slug`, `ref_link`, `summary`, `required_concepts`, `jargon_traps`, `suggested_analogies`) phải được lưu trữ trên Supabase.
- **Thẩm định viên phê duyệt (Curator Validation)**: Khi Curator phê duyệt bài học, bản ghi phải được chuyển/upsert vào bảng `public.academic_topics` trên Supabase để hiển thị ngay trên toàn hệ thống.

### 2.2. Danh Mục Học Thuật 3 Tầng (Three-Tier Curriculum)
- Toàn bộ 8 Nhóm Ngành (`academic_domains`), 37 Môn Học (`academic_subjects`), liên kết N-N (`domain_subjects`), và 479 Bài Học (`academic_topics`) phải được đọc trực tiếp từ Supabase qua `CurriculumService.getAllCurriculumGraphData()` hoặc API Supabase tương ứng.
- Khi một ngành học hay môn học mới được thêm vào Supabase, toàn bộ giao diện và Agent phải tự động nhận diện được ngay mà không cần sửa code giao diện.

### 2.3. Phiên Học Thử Thách Feynman & Báo Cáo Đánh Giá
- Mọi phiên học (`learning_sessions` / `sessions`), tin nhắn trao đổi (`session_messages` / `messages`), và báo cáo chấm điểm Rubric (`evaluation_reports`) BẮT BUỘC ghi nhận trực tiếp vào Supabase.

---

## 3. QUY TRÌNH KHI AGENT PHÁT TRIỂN TÍNH NĂNG MỚI (CHECKLIST BẮT BUỘC)

Trước khi hoàn thành bất kỳ task nào liên quan đến dữ liệu, Agent phải tự kiểm tra 4 bước sau:

- [ ] **Bước 1 - Kiểm tra Schema Supabase:** Đã có bảng và trường phù hợp trong Supabase chưa? (Nếu chưa, phải tạo file migration SQL trong `supabase/migrations/`).
- [ ] **Bước 2 - Viết hàm Insert/Update trực tiếp:** Đã gọi `supabase.from('ten_bang').insert(...)` hoặc `.update(...)` chưa?
- [ ] **Bước 3 - Xử lý bắt lỗi & phản hồi:** Có khối `try...catch`, log thông báo lỗi Supabase rõ ràng nếu có sự cố mạng/RLS không?
- [ ] **Bước 4 - Tuyệt đối không hardcode:** Đã xóa bỏ toàn bộ mock data, mảng tĩnh và các tệp JSON giả lập không cần thiết chưa?

---

## 4. CHẾ TÀI KIỂM DUYỆT CODE

Bất kỳ đoạn code nào vi phạm:
1. Hardcode danh sách dữ liệu cố định trong source code.
2. Lưu bản nháp/tài liệu chỉ vào `localStorage` mà không đồng bộ lên Supabase.
3. Không truy vấn Supabase khi hiển thị dữ liệu cho người dùng.

**Sẽ bị xem là lỗi nghiêm trọng (Critical Violation)**, bắt buộc phải refactor lại ngay lập tức để đồng bộ hóa với Supabase trước khi bàn giao cho người dùng.
