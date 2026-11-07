# Implementation Plan [1]: Feynman Study & Preparation Lab (Prep Mode)

> **Trạng thái:** Đang triển khai (p[1] - Phase 1 Frontend hoàn thành 100%, Phase 2 Backend Service đang chờ kết nối)  
> **Ngày khởi tạo:** 06-11-2026  

## 1. Executive Summary
The Feynman Technique fundamentally begins with **Step 1: Study & Comprehend the Concept** before **Step 2: Teach it to an Imaginary Listener / AI**.
Currently, the system directly jumps to the teaching stage. This plan implements the **"Feynman Study & Prep Lab" (`/study`)** allowing users to review curated ground-truth materials, inspect critical jargon traps, prepare starter analogies, and draft a speaker's scratchpad before stepping onto the live Feynman Stage.

Execution sequence: **Frontend First**, followed by **Backend & Database Integration**.

---

## 2. List of Pages & Files to Modify / Create

### A. New Pages & Components (Frontend)
1. **`src/pages/StudyPrepLab.tsx`** *(New Page)*
   - Main study interface supporting dual mode:
     - Curated academic topic selection (Ground truth summary, required concepts, jargon checklist).
     - Custom paste/upload mode (User pastes article or notes to study).
   - "Speaker's Scratchpad" (Dàn ý bài giảng) with auto-save.
   - AI Prep Deck: Jargon traps warning + Starter analogies.
   - Launch CTA: *"I've Mastered This $\rightarrow$ Step Onto Feynman Stage"*.
2. **`src/types/study.types.ts`** *(New Types)*
   - TypeScript contracts for study topics, materials, scratchpad notes, and AI prep summaries.
3. **`src/hooks/useStudyStore.ts`** *(New State Store)*
   - Zustand store to manage active study topic, scratchpad notes, and pass context to live sessions.

### B. Modified Existing Pages & Layouts (Frontend)
4. **`src/App.tsx`**
   - Register `/study` and `/study/:topicId` routes inside `WorkspaceLayout`.
5. **`src/config/routes.config.ts`**
   - Add `STUDY: "/study"` and include *"Phòng Học Trước (Study Lab)"* in `SIDEBAR_NAVIGATION`.
6. **`src/components/layout/AppSidebar.tsx`**
   - Add `BookOpen` icon to `ICON_MAP` and render the new Study navigation item.
7. **`src/pages/CommandDashboard.tsx`**
   - Add a "Study Before You Teach" quick action card and learning path prompt.
8. **`src/pages/TopicKnowledgeGraph.tsx`**
   - Add "Học bài này (Study)" quick button in topic drawer/card linking to `/study?topicId=...`.
9. **`src/pages/StageSetup.tsx`**
   - Add option to load topic and scratchpad directly from Study Lab.
10. **`src/pages/FeynmanStageLiveRoom.tsx`**
    - Add a toggleable slide-over drawer for "Speaker's Scratchpad" so learners can glance at their outline while teaching AI.

### C. Backend & Service Layer (Backend)
11. **`src/lib/services/study-service.ts`** *(New Service)*
    - Service layer for fetching study materials, ground-truth definitions, and calling AI flash summary.
12. **`src/lib/services/supabase-service.ts`**
    - Add methods: `getTopicStudyDetail()`, `saveStudyNotes()`, `getDomainTopics()`.
13. **`supabase/migrations/0002_study_notes.sql`** *(Optional Backend Migration)*
    - Table `user_study_notes` (if persistent cross-device notes are saved to Supabase).

---

## 3. Step-by-Step Implementation Roadmap

### Phase 1: Frontend Implementation (Priority 1)
- [x] **Step 1.1:** Define `src/types/study.types.ts` (StudyTopic, StudyMaterial, ScratchpadNote, JargonTrap).
- [x] **Step 1.2:** Build Zustand store `src/hooks/useStudyStore.ts` with local storage persistence.
- [x] **Step 1.3:** Build `src/pages/StudyPrepLab.tsx` with pastel UI, dual topic selector, ground truth cards, jargon warnings, and speaker scratchpad.
- [x] **Step 1.4:** Update `src/config/routes.config.ts`, `src/components/layout/AppSidebar.tsx`, and `src/App.tsx`.
- [x] **Step 1.5:** Connect Study Lab to `src/pages/StageSetup.tsx` and integrate the slide-over Scratchpad drawer into `src/pages/FeynmanStageLiveRoom.tsx`.
- [x] **Step 1.6:** Add study action buttons to `CommandDashboard.tsx` and `TopicKnowledgeGraph.tsx`.

### Phase 2: Backend & Integration (Priority 2)
- [ ] **Step 2.1:** Build `src/lib/services/study-service.ts` connecting to Supabase `academic_topics` & `academic_materials`.
- [ ] **Step 2.2:** Add AI Prep helper endpoint/mock for extracting jargon traps and starter analogies from custom text.
- [x] **Step 2.3:** Run typecheck (`tsc`) and production build verification (`npm run build`).

---

## 4. Execution Changelog & Modification Report

- **Status:** Phase 1 (Frontend) Completed & Verified.
- **Modified/Created Files:**
  1. `src/types/study.types.ts`: Created data contracts for study topics, jargon traps, starter analogies, and speaker scratchpad.
  2. `src/hooks/useStudyStore.ts`: Created Zustand store with `feynman_study_lab_storage` persistence, pre-loaded Docker/Inflation/Threads study topics, and scratchpad state.
  3. `src/components/study/SpeakerScratchpadDrawer.tsx`: Created dual-mode scratchpad component (inline for Study Lab and slide-over drawer for Live Stage).
  4. `src/pages/StudyPrepLab.tsx`: Created the Study Lab page (`/study`) with curated topic carousel, custom text upload & extraction, ground truth cards, jargon trap warnings, starter analogies, and Feynman readiness checklist.
  5. `src/config/routes.config.ts` & `src/components/layout/AppSidebar.tsx`: Added `STUDY` route (`/study`) and *"Phòng Học Trước"* menu item with `BookOpen` icon.
  6. `src/App.tsx`: Registered `/study` route under `WorkspaceLayout`.
  7. `src/pages/StageSetup.tsx`: Added auto-sync with active study topic and a prompt to review in Study Lab before teaching.
  8. `src/pages/FeynmanStageLiveRoom.tsx`: Added *"Xem Phao Dàn Ý"* button and integrated `SpeakerScratchpadDrawer` slide-over.
  9. `src/pages/CommandDashboard.tsx` & `src/pages/TopicKnowledgeGraph.tsx`: Added *"1. Học & Chuẩn Bị (Study Lab)"* buttons.
- **Verification:** `npm run build` executed and passed with 0 errors (`built in 8.44s`).

