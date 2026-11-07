# Kế Hoạch: Thanh Công Cụ 3 Ô Tìm Kiếm Theo Phân Cấp Kiến Thức (`/topics`)

Tài liệu này đề xuất phương án thiết kế và triển khai **3 ô tìm kiếm phân cấp** đặt ngay dưới thanh Topbar cho trang **Bản Đồ Tri Thức**.

---

## 1. Vị trí & Bố cục Giao diện (Placement & Layout)

* **Vị trí:** Đặt ngay dưới thanh Topbar, phía trên khung đồ thị tri thức (thanh công cụ cố định kính mờ).
* **Phong cách thị giác:** Chuẩn hệ thống Light Theme của Theodore:
  * Nền trắng kính mờ: `bg-white/95 backdrop-blur-md`
  * Viền mảnh: `border border-slate-200/90 shadow-sm rounded-2xl`
  * Bố cục hàng ngang (Horizontal Flex), responsive tự co giãn trên màn hình laptop và desktop.

---

## 2. Chi Tiết 3 Ô Tìm Kiếm Theo Phân Cấp (Hierarchical 3-Level Search)

```
[ Topbar: Breadcrumb "Bản đồ kiến thức" | Streak 14d | User Profile ]
-------------------------------------------------------------------------------------
[ 🏢 1. Nhóm Ngành (Cấp 1) ▾ ]  ⟶  [ 🔬 2. Ngành Chuyên Môn (Cấp 2) ▾ ]  ⟶  [ 🔍 3. Môn & Khái Niệm Con... ⌕ ]  [ ↺ Đặt lại ]
-------------------------------------------------------------------------------------
[ Khung Đồ Thị Tri Thức Radial Dendrogram ]
```

### Ô 1: Nhóm Ngành (Cấp 1 - Domain Filter)
* **Hình thức:** Dropdown chọn / gõ tìm kiếm có biểu tượng đặc trưng của 4 khối ngành:
  * `Tất cả Nhóm Ngành` (Mặc định)
  * `∑ Toán Cao Cấp & Đại Số`
  * `⑂ Toán Rời Rạc & Đồ Thị`
  * `👁 Thị Giác Máy Tính & AI`
  * `⚙ Hệ Thống & Khoa Học Máy Tính`
* **Hành vi:** Khi chọn một nhóm ngành, Ô số 2 sẽ tự động lọc danh sách ngành con thuộc nhóm đó.

### Ô 2: Ngành Chuyên Môn (Cấp 2 - Field Filter)
* **Hình thức:** Dropdown chọn theo danh sách 12 ngành chuyên môn (Cascade theo Ô 1):
  * Nếu chọn *Toán Cao Cấp*: Hiển thị `Đại Số Tuyến Tính (ĐSTT)`, `Giải Tích Nhiều Biến (GT)`, `Tối Ưu Hóa Vi Phân (TƯH)`.
  * Nếu chọn *Thị Giác Máy Tính*: Hiển thị `Mạng CNN`, `Xử Lý & Lọc Biên`, `Nhận Diện YOLO`.
  * Nếu chưa chọn Ô 1: Cho phép tìm trong toàn bộ 12 ngành.

### Ô 3: Môn Học & Khái Niệm Vi Mô (Cấp 3 & 5 - Subject & Concept Live Search)
* **Hình thức:** Ô nhập liệu tìm kiếm văn bản thông minh (Autocomplete Search Input):
  * Người dùng có thể gõ bất kỳ từ khóa nào (VD: `Gradient Descent`, `B-Tree`, `YOLO`, `Eigenvalues`, `Pigeonhole`...).
  * Hiển thị bảng kết quả gợi ý nhanh (Dropdown Suggestion) hiển thị kèm breadcrumb phân cấp:
    * *VD:* `Toán Cao Cấp > Đại Số Tuyến Tính > Định lý Ma trận nghịch đảo`
    * Kèm huy hiệu trạng thái: 🟢 Đã thông thạo | 🔴 Lỗ hổng | 🟡 Đang học | ⚪ Chưa học.
* **Nút Reset (Đặt lại):** Icon xoay `RotateCcw` bên cạnh giúp xóa bộ lọc và đưa đồ thị về toàn cảnh chỉ với 1 click.

---

## 3. Hiệu Ứng Trực Quan Trên Đồ Thị (Canvas Highlighting & Interactivity)

Khi người dùng chọn hoặc tìm kiếm ở bất kỳ ô nào:
1. **Làm nổi bật nhánh được chọn (Branch Spotlight):**
   * Các node và bó sợi liên kết (Bézier fibers) thuộc phân cấp đang chọn sẽ giữ nguyên 100% độ sáng và được bao quanh bởi quầng sáng nổi bật (`glow halo`).
   * Các nhánh tri thức không liên quan sẽ tự động giảm độ đậm (`opacity: 0.15`), giúp người học tập trung ngay vào chuyên môn cần tra cứu.
2. **Khóa vị trí tâm đồ thị:**
   * Không làm xê dịch tâm bán nguyệt đã ghim ở mép trái.
   * Nếu người dùng chọn 1 môn học/khái niệm cụ thể ở Ô 3: Node đó sẽ nhấp nháy hào quang nhẹ (Pulse animation) và tự động mở Slide-over Drawer để người học xem chi tiết hoặc bấm "Giảng ngay cho AI".

---

## 4. Các Bước Triển Khai Kỹ Thuật

1. **Tạo Component `TopicHierarchySearch.tsx`:**
   * Tách thành component độc lập đặt tại `src/components/topics/TopicHierarchySearch.tsx`.
   * Quản lý state: `domainId`, `fieldId`, `searchKeyword`.
2. **Nhúng vào `TopicKnowledgeGraph.tsx`:**
   * Đặt ngay đầu trang, bên dưới breadcrumb và trên canvas đồ thị.
3. **Cập nhật Canvas Renderers:**
   * Thêm điều kiện kiểm tra `isMatchFilter(node)` trong `renderNodeCanvasObject` và `renderLinkCanvasObject` để điều chỉnh độ mờ / độ sáng theo bộ lọc.
4. **Kiểm thử & Tối ưu:**
   * Kiểm thử tìm kiếm tiếng Việt không dấu / có dấu.
   * Kiểm thử phản hồi tức thì với 60fps trên Canvas.

