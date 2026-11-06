---
description: Quy định nghiêm ngặt cấm tự động push code lên Git remote khi chưa có yêu cầu từ người dùng
globs: ["**/*"]
---

# Quy Định Về Git Workflow & Push Code

Tất cả các AI Agent hoạt động trong workspace Theodore **BẮT BUỘC TUÂN THỦ 100%**:

## 1. Cấm Tự Động Push (`git push`)
- **TUYỆT ĐỐI KHÔNG TỰ ĐỘNG CHẠY `git push`** hoặc đẩy bất kỳ commit/nhánh nào lên remote repository (GitHub, GitLab,...).
- Chỉ được phép thực thi lệnh `git push` khi và chỉ khi có **chỉ định hoặc yêu cầu trực tiếp, rõ ràng từ người dùng** (ví dụ: *"hãy push lên git"*, *"push code lên github đi"*, *"git push origin main"*).

## 2. Các Thao Tác Git Cục Bộ (Local Only)
- Các thao tác Git cục bộ như: `git status`, `git diff`, `git log`, `git add`, hoặc `git commit` có thể được thực hiện khi cần lưu lại tiến độ cục bộ.
- Tuy nhiên, sau khi commit, phải dừng lại và thông báo cho người dùng, **KHÔNG ĐƯỢC KÈM THEO `git push`**.
