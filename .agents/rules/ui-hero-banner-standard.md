---
description: Tiêu chuẩn thiết kế Hero Banner tinh giản, gọn gàng, tiết kiệm chiều cao cho toàn bộ các trang trong hệ thống Theodore
globs: ["src/pages/**/*.tsx", "src/components/**/*.tsx"]
---

# Tiêu Chuẩn Hero Banner Tinh Giản Toàn Hệ Thống Theodore (Simplified Hero Banner Standard)

Mọi trang chức năng trong hệ thống Theodore khi có phần đầu trang (Hero Banner) đều **BẮT BUỘC** tuân thủ cấu trúc thiết kế tinh giản, hiện đại và tiết kiệm chiều cao giao diện (Vertical Space).

## 1. Triết Lý Thiết Kế: Phẳng, Tinh Giản & Không Lồng Thẻ (No Nested Cards)
- **Không tạo thẻ lồng trong thẻ (No nested card layers)**: Tránh việc bọc một container lớn rồi lại đặt thẻ con bên trong, gây cảm giác nặng nề, cồng kềnh.
- **Tiết kiệm chiều dọc (Compact Height)**: Chiều cao toàn khối nên ở mức vừa phải (~110px – 140px) để người dùng nhìn thấy ngay nội dung chức năng chính (bảng, form, sơ đồ) mà không cần cuộn trang.
- **Khung chứa thống nhất**:
  - `relative overflow-hidden bg-white rounded-2xl border border-[#E2EAFD] p-5 sm:p-6 shadow-2xs`
  - Lớp phủ gradient mỏng nhẹ làm dịu mắt: `bg-gradient-to-r from-blue-50/40 via-indigo-50/20 to-purple-50/30 pointer-events-none`.

## 2. Bố Cục 2 Phía Hiện Đại (2-Column Responsive Layout)
`flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10`:

1. **Phía Trái (Nội Dung Chính)**:
   - **Tuyệt đối không dùng Eyebrow Pill / Badge trên tiêu đề**: Không gắn các pill tag bo tròn (như `✨ AI Curriculum Digestion Agent`, `Hội Đồng Thẩm Định`, v.v.) bên trên tiêu đề Hero Bar. Bắt đầu ngay bằng Tiêu đề chính.
   - **Tiêu đề (`h1`/`h2`)**: `text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-snug`.
   - **Mô tả (`p`)**: `text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed` (1–2 dòng súc tích).
   - **Nút hành động (Tùy chọn)**: Nút thao tác nhanh bo góc `rounded-xl` với `shadow-2xs`.

2. **Phía Phải (Tiện Ích & Linh Vật Nhỏ Gọn)**:
   - **Widget tóm tắt (`rightWidget`)**: Thẻ thông số tóm tắt gọn gàng (`p-3 rounded-xl bg-slate-50/90 border border-slate-200/70 text-xs`).
   - **Linh vật (`mascotSrc`)**: Kích thước nhỏ gọn tinh tế (`w-16 h-16 sm:w-20 sm:h-20`), không choán diện tích màn hình.

## 3. Thành Phần Tái Sử Dụng Chuẩn Mực
Luôn sử dụng component chuẩn:
```tsx
import { PageHeroBanner } from "@/components/shared/PageHeroBanner";
```

Tuyệt đối không tự ý dùng các container tối màu (dark solid gradient) hoặc chèn mascot quá khổ làm đẩy nội dung xuống sâu.
