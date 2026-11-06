---
description: Quy định bắt buộc sử dụng và cài đặt môi trường ảo Python .venv cho backend
globs: ["backend/**", "**/*.py", "backend/requirements.txt"]
---

# Quy Định Sử Dụng Môi Trường Ảo Python (.venv)

Tất cả các tác vụ phát triển, cài đặt package và thực thi mã nguồn Python trong dự án Theodore **BẮT BUỘC** tuân thủ các quy tắc sau:

## 1. Vị trí môi trường ảo
- Môi trường ảo Python được đặt tại đường dẫn tương đối trong dự án: `.venv` (hoặc `backend/.venv` nếu dự án chia submodule).
- Trình thực thi Python:
  - Windows: `.venv/Scripts/python.exe` (hoặc `backend/.venv/Scripts/python.exe`)
  - Linux/macOS: `.venv/bin/python` (hoặc `backend/.venv/bin/python`)
- Trình quản lý gói pip:
  - Windows: `.venv/Scripts/pip.exe` (hoặc `backend/.venv/Scripts/pip.exe`)
  - Linux/macOS: `.venv/bin/pip` (hoặc `backend/.venv/bin/pip`)

## 2. Nguyên tắc cài đặt Dependencies
1. **Tuyệt đối KHÔNG cài đặt thư viện vào Python toàn cục (Global Python):**
   - Mọi lệnh `pip install` phải luôn thực hiện thông qua môi trường `.venv` (ví dụ: `.\.venv\Scripts\pip.exe install ...` hoặc sau khi đã kích hoạt môi trường ảo).
2. **Đồng bộ hóa requirements.txt:**
   - Khi bổ sung bất kỳ thư viện mới nào vào `.venv`, phải cập nhật ngay vào file `requirements.txt` (hoặc `backend/requirements.txt`).
3. **Lệnh cài đặt chuẩn:**
   ```powershell
   # Kích hoạt .venv
   .\.venv\Scripts\Activate.ps1
   # Cài đặt từ requirements.txt
   pip install -r requirements.txt
   ```
   Hoặc gọi trực tiếp:
   ```powershell
   & ".\.venv\Scripts\pip.exe" install -r requirements.txt
   ```

## 3. Khởi chạy và kiểm thử
- Lệnh chạy server/ứng dụng phải luôn sử dụng Python trong `.venv`:
  ```powershell
  & ".\.venv\Scripts\python.exe" -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
  ```
- Lệnh kiểm thử lint / compile:
  ```powershell
  & ".\.venv\Scripts\python.exe" -m py_compile ...
  ```
