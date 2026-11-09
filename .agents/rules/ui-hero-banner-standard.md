---
description: Tiêu chuẩn thiết kế & cấu trúc Hero Banner đồng bộ cho toàn bộ các trang trong hệ thống Theodore
globs: ["src/pages/**/*.tsx", "src/components/**/*.tsx"]
---

# Tiêu Chuẩn Hero Banner Toàn Hệ Thống Theodore (Hero Banner Standard)

Mọi trang chức năng chính (Dashboard, Materials Upload, Curator Validation, Topics, Lectures, v.v.) khi có phần đầu trang (Hero Banner) đều **BẮT BUỘC** tuân thủ cấu trúc thiết kế 3 khối chuẩn mực và thẩm mỹ đồng nhất với trang `Dashboard` (`/dashboard`).

## 1. Thiết Kế Trực Quan & Màu Sắc Nền (Visual Palette)
- **Container**: `relative overflow-hidden bg-gradient-to-r from-[#F0F4FC] via-[#F6F3FC] to-[#FCF4F7] border border-[#E2EAFD] rounded-3xl p-4 sm:p-6 shadow-xs`
- **Ảnh nền mờ nghệ thuật (Dreamy Layer)**:
  - Ảnh nền: `/images/hero-banner-bg.png` đặt ở lớp `z-0 pointer-events-none` với `opacity-35 object-cover object-center`.
  - Lớp phủ gradient làm dịu: `bg-gradient-to-r from-white/50 via-white/30 to-white/50 backdrop-blur-[0.5px]`.

## 2. Bố Cục 3 Khối Chuẩn Mực (3-Block Layout)
Bố cục trên màn hình lớn sử dụng `flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10`:

1. **Khối 1 - Bên Trái (Thẻ Nội Dung & Hành Động)**:
   - Thẻ frosted-glass: `max-w-xl lg:max-w-lg xl:max-w-xl space-y-3 p-5 sm:p-6 rounded-3xl bg-white/75 backdrop-blur-md border border-white/80 shadow-xs shrink-0`.
   - **Eyebrow Badge**: Nhãn danh mục nhỏ gọn, bo tròn `rounded-full`.
   - **Tiêu đề chính (`h1`/`h2`)**: `text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-snug`.
   - **Mô tả (`p`)**: `text-xs sm:text-sm text-slate-600 leading-relaxed`.
   - **Nút hành động**: Các nút chuyển trang, thao tác nhanh bo góc `rounded-2xl` hoặc `rounded-xl`.

2. **Khối 2 - Ở Giữa (Linh Vật Cú Theodore Bay Nổi)**:
   - Đặt ở trung tâm: `flex items-center justify-center flex-1 my-1 lg:my-0 relative`.
   - Ảnh linh vật: `/images/theodore-mascot.png` với kích thước `w-36 h-36 sm:w-48 sm:h-48 lg:w-56 lg:h-56 xl:w-60 xl:h-60`.
   - Hiệu ứng: `filter drop-shadow-[0_16px_32px_rgba(114,134,211,0.32)] animate-float select-none pointer-events-none`.

3. **Khối 3 - Bên Phải (Thẻ Widget / Chỉ Số Tóm Tắt)**:
   - Thẻ frosted-glass: `shrink-0 bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-white/80 shadow-xs flex flex-col items-center justify-center self-center lg:self-auto min-w-[190px]`.
   - Chứa thông số quan trọng của trang (ví dụ: Clarity Meter, thống kê bài chờ duyệt, định dạng tệp hỗ trợ, v.v.).

## 3. Thành Phần Tái Sử Dụng
Sử dụng component chung:
`import { PageHeroBanner } from "@/components/shared/PageHeroBanner";`

Không tự ý tạo các Hero nền tối đậm màu (dark solid gradient) không ăn nhập với phong cách chung của hệ thống.

