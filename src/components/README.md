# Module Components: Theodore Feynman Stage UI

## 1. Tiêu Đề & Mục Đích Của Module
Module `src/components/` chứa toàn bộ các thành phần giao diện người dùng (React Components) được thiết kế theo nguyên tắc kế thừa 100%, không trùng lặp mã nguồn (Code Reusability), phục vụ toàn bộ 10 trang của nền tảng **Feynman Technique Stage**.

Hệ thống được chia thành 4 phân lớp rõ ràng:
- `components/shared/`: Các thành phần nghiệp vụ dùng chung ở 2 trang trở lên (`PersonaAvatarCard`, `JargonBadge`, `ClarityMeter`, `MasteryCardPreview`, `VoiceRecorderButton`).
- `components/modals/`: Hệ thống 6 popup/drawer được điều khiển tập trung qua `useModalStore` và `ModalProvider`.
- `components/layout/`: Vỏ bọc giao diện dùng chung (`AppSidebar`, `TopHeader`, `PageContainer`).
- `components/stage/`: Các khối chức năng đặc thù cho phòng học thời gian thực (`ChatTranscript`, `RealtimeAnalyzerPanel`, `LogicFlowMiniMap`).

---

## 2. Bảng Danh Mục File (File Index Table)

| Tên File | Chức Năng Chính | Đầu Vào (Inputs) | Đầu Ra (Outputs) |
| :--- | :--- | :--- | :--- |
| `shared/PersonaAvatarCard.tsx` | Hiển thị thẻ thông tin Persona AI với 2 biến thể `compact` và `full` | `persona: PersonaDefinition`, `isSelected?: boolean`, `variant?: 'compact' \| 'full'` | Thẻ Avatar tương tác kèm badge lăng kính thế giới quan |
| `shared/JargonBadge.tsx` | Huy hiệu đánh dấu thuật ngữ chuyên ngành (Xanh: đã hiểu / Đỏ: cảnh báo) | `term: string`, `isExplained: boolean`, `reason?: string` | Badge thuật ngữ có hiệu ứng pulse cảnh báo |
| `shared/ClarityMeter.tsx` | Đồng hồ/Thanh đo độ mạch lạc và bình dân hóa theo thời gian thực (0-100) | `score: number`, `variant?: 'bar' \| 'circle'` | Gauge đo trực quan trạng thái thấu suốt |
| `shared/MasteryCardPreview.tsx` | Thẻ tổng kết năng lực Feynman (Feynman Mastery Card) | `report: ReportData`, `topic: string` | Báo cáo hoàn chỉnh kèm nút chia sẻ |
| `shared/VoiceRecorderButton.tsx` | Nút thu âm Web Speech API kèm hiệu ứng sóng âm nhấp nháy | `isListening: boolean`, `onToggle: () => void` | Nút micro chuyển đổi giọng nói thành văn bản |
| `modals/ModalProvider.tsx` | Mount tập trung 6 Popup/Drawer vào Root Layout | Không có (Lắng nghe `useModalStore`) | Render modal tương ứng khi được kích hoạt |
| `modals/AnalogyHintModal.tsx` | Popup gợi ý 2 phép ẩn dụ đời thường khi người học bị bí ý tưởng | `topic: string`, `term?: string`, `personaId: string` | Modal hiển thị gợi ý ẩn dụ kèm nút copy |
| `modals/JargonInspectorDrawer.tsx` | Drawer kiểm tra danh sách thuật ngữ và lý do cảnh báo | `jargons: JargonItem[]` | Drawer trượt từ bên phải màn hình |
| `modals/QuickDrillModal.tsx` | Popup thử thách phản xạ bình dân hóa trong 60 giây | Không có | Modal đếm ngược 60s và câu hỏi thử thách |
| `modals/VoiceCalibrationModal.tsx` | Popup kiểm tra micro và âm lượng Web Speech API | Không có | Modal kiểm tra mic và hiển thị text nhận diện |
| `modals/ShareMasteryModal.tsx` | Popup tạo link và ảnh chia sẻ thẻ điểm lên mạng xã hội | `topic: string`, `score: number` | Modal sao chép link chia sẻ |
| `modals/EndStageConfirmModal.tsx` | Popup xác nhận chốt sớm buổi giảng để tạo báo cáo | `onConfirm: () => void` | Modal xác nhận kết thúc phiên |
| `layout/AppSidebar.tsx` | Thanh điều hướng bên trái pastel kế thừa từ `config/routes.config.ts` | Không có | Sidebar điều hướng toàn bộ Workspace |
| `layout/TopHeader.tsx` | Thanh tiêu đề trên cùng gồm breadcrumbs và nút Quick Drill | `title?: string`, `subtitle?: string` | Header đồng nhất |
| `stage/ChatTranscript.tsx` | Dòng thời gian đối thoại giữa người học và AI Persona | `messages: ChatMessage[]`, `persona: PersonaDefinition` | Hộp chat cuộn tự động kèm badge Jargon |
| `stage/RealtimeAnalyzerPanel.tsx` | Panel phân tích ngầm theo thời gian thực tại phòng học Live | `analysis: AnalyticalResult`, `topic: string` | Cột đo lường chỉ số và nút hành động |
| `stage/LogicFlowMiniMap.tsx` | Bản đồ 4 chặng tư duy của bài giảng | `currentStep?: number` | Thanh tiến trình 4 giai đoạn |

---

## 3. Luồng Hoạt Động (Workflow/Dataflow)

```
[ RootLayout ] ──> [ ModalProvider ] (Lắng nghe useModalStore để bật/tắt 6 Modals)
      │
      ├──> [ (public) ] ──> Landing & Auth
      │
      └──> [ (workspace)/layout.tsx ]
                 ├──> [ AppSidebar ] ──── Kế thừa routes.config.ts
                 ├──> [ TopHeader ] ───── Trigger QuickDrillModal
                 └──> [ Page Content ]
                           ├── Dashboard: Thống kê + ClarityMeter + MasteryCardPreview
                           ├── Stage Setup: PersonaAvatarCard (full) + Presets
                           ├── Stage Live: ChatTranscript + RealtimeAnalyzerPanel + VoiceRecorderButton
                           └── Report: MasteryCardPreview + ShareMasteryModal
```

