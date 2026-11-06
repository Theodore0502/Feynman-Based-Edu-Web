# Module Agent: 2-Layer Feynman Pipeline Engine

## 1. Tiêu Đề & Mục Đích Của Module
Module `src/lib/agent/` chứa logic điều phối tác nhân AI 2 tầng (Two-Layer Agent Architecture) phục vụ phương pháp giảng giải Socrates của Feynman Technique:
- **Tầng 1 (Background Analytical Engine):** Sử dụng `generateObject` chạy ngầm để bóc tách các thuật ngữ chuyên ngành chưa bình dân hóa (`JargonDetector`), chỉ ra các bước nhảy cóc tư duy (`LogicGapFinder`) và chấm điểm độ mạch lạc (`ClarityEvaluator`).
- **Tầng 2 (Persona Response Generator):** Nạp kết quả JSON từ Tầng 1 vào System Prompt để stream câu hỏi phản biện ngắn gọn (1-2 câu) đúng với tính cách nhân vật (`streamText`).

---

## 2. Bảng Danh Mục File (File Index Table)

| Tên File | Chức Năng Chính | Đầu Vào (Inputs) | Đầu Ra (Outputs) |
| :--- | :--- | :--- | :--- |
| `feynman-orchestrator.ts` | Nhạc trưởng điều phối pipeline 2 tầng và tạo thẻ điểm Mastery | `message: string`, `topic: string`, `persona: PersonaDefinition` | `AnalyticalResult`, `MasteryEvaluation` |
| `tools/jargon-detector.ts` | Schema Zod định nghĩa cấu trúc phân tích thuật ngữ học thuật | Dữ liệu văn bản người học | `JargonListType` |
| `tools/logic-gap-finder.ts` | Schema Zod định nghĩa phát hiện bước nhảy cóc tư duy | Chuỗi suy luận của người học | `LogicGapListType` |
| `tools/analogy-suggester.ts` | Schema Zod tạo 2 phép ẩn dụ đời thường theo lăng kính Persona | `topic: string`, `personaId: string` | `AnalogySuggestionType` |
| `prompts/system-prompts.ts` | Xây dựng System Prompt động ghép nối từ `config/personas.config.ts` | Persona, Topic, Analysis metadata | System Prompt chuỗi chuỗi hoàn chỉnh |

---

## 3. Luồng Hoạt Động (Workflow/Dataflow)

```
[ User Input (Voice / Text) ]
             │
             ▼
[ POST /api/chat ]
   │
   ├── TẦNG 1: runAnalyticalEngine() ───> generateObject(AnalysisOutputSchema)
   │     │                                ├── JargonDetector
   │     │                                ├── LogicGapFinder
   │     │                                └── ClarityEvaluator
   │     ▼
   │  Lưu Message + analysisMetadata vào SQLite
   │
   └── TẦNG 2: streamText() ─────────────> SystemPrompt (ghép JSON Tầng 1 + Persona Prompt)
         │                                ├── Hỏi xoáy vào từ chưa giải thích
         │                                ├── Vặn vẹo bước nhảy logic
         │                                └── Giới hạn 1-2 câu ngắn
         ▼
   [ Stream về Client + Header x-feynman-analysis ]
```

