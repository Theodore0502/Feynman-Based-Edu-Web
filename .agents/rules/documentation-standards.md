---
description: Quy định bắt buộc về khối Comment/Docstring ở đầu mỗi file code và sự hiện diện của file README.md trong từng thư mục module để hiểu chức năng mà không cần đọc toàn bộ code
globs: ["**/*.py", "**/*.ts", "**/*.tsx", "**/*.sql", "**/*.css", "**/README.md"]
---

# Quy Định Chuẩn Comment Đầu File & Tài Liệu README Module

Tất cả các AI Agent và thành viên phát triển dự án Theodore **BẮT BUỘC TUÂN THỦ 100%**:

---

## 1. Khối Comment Bắt Buộc Ở Đầu Mỗi File Code (File Header Comment)

Mọi file mã nguồn (Python, TypeScript, TSX, SQL) khi được tạo ra hoặc chỉnh sửa **BẮT BUỘC** phải có khối comment/docstring chuẩn ngay tại các dòng đầu tiên của file:

### 1.1 Chuẩn Cho Python (`.py`)
```python
"""
File: backend/app/<module>/<filename>.py
Mục đích: [Mô tả 1-2 câu súc tích về nghiệp vụ/vai trò của file này trong hệ sinh thái Theodore]
Chức năng chính:
    - [Tên hàm/class 1]: [Nhiệm vụ cụ thể]
    - [Tên hàm/class 2]: [Nhiệm vụ cụ thể]
Ghi chú/Phụ thuộc: [Liên kết đến các module khác, API bên ngoài, v.v.]
"""
```

### 1.2 Chuẩn Cho TypeScript / React (`.ts` / `.tsx`)
```typescript
/**
 * File: frontend/src/<path>/<filename>.tsx
 * Mục đích: [Mô tả mục đích và vai trò của Component / Hook / Utility]
 * Thành phần chính:
 *   - [Tên Component/Hook]: [Chức năng hiển thị hoặc xử lý state]
 * Props/Inputs: [Tóm tắt props quan trọng nếu có]
 */
```

### 1.3 Chuẩn Cho SQL Migrations (`.sql`)
```sql
-- ==============================================================================
-- File: supabase/migrations/<timestamp>_<filename>.sql
-- Mục đích: [Mô tả mục đích của migration, các bảng được tạo/sửa đổi]
-- Bảng tạo mới: [Liệt kê các bảng]
-- ==============================================================================
```

---

## 2. Quy Định Bắt Buộc Về README.md Cho Từng Thư Mục Module

Mỗi thư mục module cốt lõi của Backend và Frontend (hoặc các module chính của hệ thống) **BẮT BUỘC** phải có file `README.md` riêng biệt:
- `backend/app/agent/README.md`
- `backend/app/api/README.md`
- `backend/app/db/README.md`
- `backend/app/schemas/README.md`
- `backend/app/tools/README.md`
- `frontend/src/components/README.md`

### Nội Dung Bắt Buộc Trong Mỗi `README.md`:
1. **Tiêu đề & Mục đích của Module:** Giải thích module này giải quyết bài toán gì.
2. **Bảng Danh Mục File (File Index Table):**
   | Tên File | Chức Năng Chính | Đầu Vào (Inputs) | Đầu Ra (Outputs) |
   | :--- | :--- | :--- | :--- |
3. **Luồng Hoạt Động (Workflow/Dataflow):** Mô tả cách các file bên trong phối hợp với nhau.

Mục tiêu là: **Người đọc, thành viên phát triển hoặc reviewer chỉ cần mở file `README.md` là nắm trọn vẹn toàn bộ kiến trúc và chức năng mà KHÔNG CẦN phải đọc từng dòng code.**
