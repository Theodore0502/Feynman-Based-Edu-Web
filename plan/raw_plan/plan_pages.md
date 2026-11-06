src/
├── app/                                  # 10 TRANG CHÍNH (Next.js App Router)
│   ├── (public)/
│   │   ├── page.tsx                      # [Trang 1] Landing & Demo
│   │   └── auth/
│   │       └── page.tsx                  # [Trang 2] Auth & Onboarding
│   │
│   ├── (workspace)/                      # Layout có Sidebar & Header dùng chung
│   │   ├── layout.tsx                    # Kế thừa Sidebar, Topbar, ModalProvider
│   │   ├── dashboard/
│   │   │   └── page.tsx                  # [Trang 3] Command Dashboard
│   │   ├── stage/
│   │   │   ├── new/
│   │   │   │   └── page.tsx              # [Trang 4] Stage Setup
│   │   │   └── [sessionId]/
│   │   │       ├── page.tsx              # [Trang 5] The Feynman Stage (Live Room)
│   │   │       └── report/
│   │   │           └── page.tsx          # [Trang 6] Mastery Report Card
│   │   ├── personas/
│   │   │   └── page.tsx                  # [Trang 7] Persona Studio
│   │   ├── topics/
│   │   │   └── page.tsx                  # [Trang 8] Topic & Knowledge Graph
│   │   ├── vault/
│   │   │   └── page.tsx                  # [Trang 9] Analogy & Jargon Vault
│   │   └── settings/
│   │       └── page.tsx                  # [Trang 10] Settings & AI Config
│   │
│   └── api/                              # Backend Agent Endpoints
│       ├── chat/route.ts                 # Pipeline 2 tầng (Analyzer + Persona)
│       ├── hint/route.ts                 # AnalogySuggester API
│       ├── evaluate/route.ts             # MasteryCardGenerator API
│       └── sessions/route.ts             # CRUD Session
│
├── components/                           # CÁC COMPONENT KẾ THỪA & TÁI SỬ DỤNG
│   ├── ui/                               # Base UI (Shadcn: Button, Card, Badge, Progress...)
│   ├── layout/                           # Khung giao diện chung
│   │   ├── AppSidebar.tsx
│   │   ├── TopHeader.tsx
│   │   └── PageContainer.tsx
│   ├── shared/                           # Component nghiệp vụ dùng ở nhiều trang
│   │   ├── PersonaAvatarCard.tsx         # Dùng ở Trang 1, 4, 5, 7
│   │   ├── JargonBadge.tsx               # Dùng ở Trang 5, 6, 9 (Xanh: Đã hiểu / Đỏ: Thuật ngữ)
│   │   ├── ClarityMeter.tsx              # Thanh đo độ mạch lạc (Dùng ở Trang 3, 5, 6)
│   │   ├── MasteryCardPreview.tsx        # Thẻ điểm Feynman (Dùng ở Trang 3, 6, Popup Share)
│   │   └── VoiceRecorderButton.tsx       # Nút thu âm Web Speech API (Dùng ở Trang 1, 5)
│   ├── stage/                            # Component con phục vụ riêng Trang 5
│   │   ├── ChatTranscript.tsx
│   │   ├── RealtimeAnalyzerPanel.tsx
│   │   └── LogicFlowMiniMap.tsx
│   └── modals/                           # HỆ THỐNG POPUP / MODAL TẬP TRUNG
│       ├── ModalProvider.tsx             # Mount tất cả popup vào Root Layout
│       ├── AnalogyHintModal.tsx
│       ├── JargonInspectorDrawer.tsx
│       ├── QuickDrillModal.tsx
│       ├── VoiceCalibrationModal.tsx
│       ├── ShareMasteryModal.tsx
│       └── EndStageConfirmModal.tsx
│
├── config/                               # BIẾN CỐ ĐỊNH & CẤU HÌNH HỆ THỐNG (CONSTANTS)
│   ├── personas.config.ts                # Danh sách Persona mặc định, Avatar, System Prompt gốc
│   ├── rubrics.config.ts                 # Trọng số chấm điểm Clarity, Logic, ngưỡng qua bài
│   ├── routes.config.ts                  # Định nghĩa đường dẫn URL & Menu Sidebar cố định
│   ├── topics-presets.config.ts          # Các chủ đề mẫu gợi ý theo từng ngành
│   └── ai-models.config.ts               # Cấu hình nhiệt độ (temperature), maxTokens, tên Model
│
├── lib/                                  # CORE LOGIC & AGENT ENGINE
│   ├── agent/
│   │   ├── feynman-orchestrator.ts       # Điều phối luồng chạy ngầm + sinh phản hồi
│   │   ├── tools/
│   │   │   ├── jargon-detector.ts
│   │   │   ├── logic-gap-finder.ts
│   │   │   └── analogy-suggester.ts
│   │   └── prompts/                      # Template prompt ghép nối với config/personas.config.ts
│   ├── prisma.ts                         # Singleton kết nối Database
│   └── utils.ts                          # Các hàm helper định dạng điểm số, ngày tháng
│
├── hooks/                                # CUSTOM REACT HOOKS (DÙNG CHUNG)
│   ├── useSpeechToText.ts                # Hook thu âm giọng nói
│   ├── useModalStore.ts                  # Zustand store bật/tắt bất kỳ Popup nào
│   └── useFeynmanSession.ts              # Quản lý state phòng học real-time
│
└── types/                                # ĐỊNH NGHĨA KIỂU DỮ LIỆU CHUNG (TYPESCRIPT)
    ├── agent.types.ts                    # Interface cho Jargon, LogicGap, EvaluationReport
    └── session.types.ts

## Architectural Rules for Code Reusability & Inheritance:
1. **Zero Hardcoded Configs in Pages:** All static variables, persona definitions, system prompts, scoring thresholds, and navigation links MUST be stored in `src/config/*.config.ts` and imported into pages/APIs.
2. **Shared Component Inheritance:** 
   - Any UI element appearing in 2+ screens (such as `PersonaAvatarCard`, `JargonBadge`, `ClarityMeter`, `VoiceRecorderButton`, and `MasteryCardPreview`) MUST be built once inside `src/components/shared/` with flexible props (`variant="compact" | "full"`).
3. **Centralized Modal Controller:** 
   - Do not scatter modal state across individual pages. Use a unified Zustand store (`useModalStore.ts`) and `ModalProvider.tsx` so any page or sub-component can trigger `openModal('ANALOGY_HINT', { term, topic })` cleanly.
4. **Layout Inheritance:** 
   - Screens 3 through 10 must inherit the `(workspace)/layout.tsx` shell (Sidebar + Header + Notification Toast + Modal Provider) without re-implementing navigation wrappers.