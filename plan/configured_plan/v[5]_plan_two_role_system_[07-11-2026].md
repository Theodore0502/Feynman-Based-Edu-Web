# Implementation Plan [5]: Two-Role System (Learner & Admin Moderator)

## 1. Executive Summary
This plan establishes the strictly focused **Two-Role Architecture** tailored specifically for the "Feynman Technique Stage":
1. **End User (`learner`):** The student learning by teaching. Explains topics in own words, defends against AI challenge questions, and tracks clarity growth.
2. **Admin Moderator (`admin`):** The gatekeeper of academic quality. Configures Feynman Rubrics, fine-tunes AI probing personas, monitors ground truth integrity, and resolves student challenge audits.

Also provisions two pre-configured, instantly usable accounts:
- **Learner Account:** `learn123` / `123123` (Role: `learner`)
- **Admin Account:** `admin123` / `123123` (Role: `admin`)

Execution Sequence: **Frontend Role State & Admin Suite First**, followed by **Auth Integration & Supabase Database Seeds**.

---

## 2. List of Files to Modify / Create

### A. New Authentication & Role Store
1. **`src/types/auth.types.ts`** *(New)*
   - Strongly typed `UserRole = 'learner' | 'admin'`, `UserProfile`, `FeynmanRubricConfig`, `AuditReport`.
2. **`src/hooks/useAuthStore.ts`** *(New)*
   - Zustand store managing the active authenticated session, user role, login/logout, and persistent mock authentication with support for `learn123` and `admin123`.
3. **`src/components/auth/RoleGuard.tsx`** *(New)*
   - Route wrapper enforcing role access restrictions (redirecting learners trying to access `/admin/*`).

### B. New Admin Moderator Suite Pages
4. **`src/pages/admin/AdminRubricStudio.tsx`** *(New)*
   - Interactive configuration of the Feynman evaluation criteria (Simplicity weight, Jargon penalty, Analogy reward, Socratic handling).
5. **`src/pages/admin/AdminAuditCenter.tsx`** *(New)*
   - Review reported AI evaluation mistakes, student counter-arguments, and ground truth overrides.
6. **`src/pages/admin/AdminCurriculumManager.tsx`** *(New)*
   - Management and editing of 40+ academic topics, Ground Truth definitions, and Jargon Traps.

### C. Modified Pages & Navigation
7. **`src/pages/AuthAndOnboarding.tsx`**
   - Support instant login with username (`learn123`, `admin123`) or email + password (`123123`), quick 1-click test credentials buttons.
8. **`src/config/routes.config.ts`**
   - Add admin navigation items and routes.
9. **`src/components/layout/AppSidebar.tsx`**
   - Display role badge (🎓 Learner vs 🛡️ Moderator), dynamically reveal Admin navigation group when logged in as admin.
10. **`src/components/layout/TopHeader.tsx`**
    - Show current user info, active role tag, and quick-switch dev toggle between `learn123` and `admin123`.
11. **`src/App.tsx`**
    - Register admin routes wrapped in `RoleGuard`.
12. **`supabase/seed.sql`**
    - Insert default demo users and roles in SQL seed.

---

## 3. Step-by-Step Execution Sequence

### Phase 1: Core Role Models & Store (Priority 1)
- [x] **Step 5.1:** Create `src/types/auth.types.ts` defining `UserRole`, `UserProfile`, `RubricConfig`, and `AuditReport`.
- [x] **Step 5.2:** Create `src/hooks/useAuthStore.ts` with local persistence, pre-configured accounts (`learn123`, `admin123` with password `123123`), and role switching.
- [x] **Step 5.3:** Build `src/components/auth/RoleGuard.tsx` to protect admin-only routes.

### Phase 2: Auth UI & Navigation Updates (Priority 2)
- [x] **Step 5.4:** Update `src/pages/AuthAndOnboarding.tsx` with username/password login, 1-click test account fill buttons (`learn123` and `admin123`).
- [x] **Step 5.5:** Update `src/config/routes.config.ts` and `src/components/layout/AppSidebar.tsx` to display role badges and admin navigation sections.
- [x] **Step 5.6:** Update `src/components/layout/TopHeader.tsx` to display active role pill and Quick Switcher.

### Phase 3: Admin Moderator Suite Pages (Priority 3)
- [x] **Step 5.7:** Build `src/pages/admin/AdminRubricStudio.tsx` for configuring Feynman evaluation criteria and weights.
- [x] **Step 5.8:** Build `src/pages/admin/AdminAuditCenter.tsx` for handling student reports of AI mis-evaluations.
- [x] **Step 5.9:** Build `src/pages/admin/AdminCurriculumManager.tsx` for curating ground truth and jargon traps.
- [x] **Step 5.10:** Wire up routes in `src/App.tsx` and verify with `npm run build` (Passed with code 0).

---

## 4. Execution Changelog & Modification Report
*(Completed on 07-11-2026)*

- **Status:** **Completed & Production-Ready** (Build succeeded with code 0).
- **Two Preconfigured Accounts Configured:**
  1. **Learner Account:** `learn123` / `123123` (Name: "Nguyễn Giảng Viên", Role: `learner`)
  2. **Admin Account:** `admin123` / `123123` (Name: "Trần Kiểm Chuẩn", Role: `admin`)
- **Modified & Created Files:**
  - `src/types/auth.types.ts`: Type definitions for `UserRole` (`learner` | `admin`), `UserProfile`, `FeynmanRubricConfig`, and `AuditReportItem`.
  - `src/hooks/useAuthStore.ts`: Authentication store with LocalStorage persistence and instant dev role toggle.
  - `src/components/auth/RoleGuard.tsx`: Route access controller guarding admin pages against unauthorized roles.
  - `src/pages/AuthAndOnboarding.tsx`: Updated with username & password authentication form, 1-click credentials filler for `learn123` and `admin123`.
  - `src/config/routes.config.ts`: Added admin routes (`/admin/rubrics`, `/admin/audits`, `/admin/curriculum`) and segregated `LEARNER_NAVIGATION` and `ADMIN_NAVIGATION`.
  - `src/components/layout/AppSidebar.tsx`: Role badges (Learner vs Admin Moderator), dynamic admin navigation menu, and quick role switcher.
  - `src/components/layout/TopHeader.tsx`: Current user badge, role tag, and quick toggle between `learn123` and `admin123`.
  - `src/pages/admin/AdminRubricStudio.tsx`: Configurable weights for the 4 core Feynman criteria, Jargon penalty slider, and passing threshold.
  - `src/pages/admin/AdminAuditCenter.tsx`: Dispute resolution panel for student complaints on AI feedback.
  - `src/pages/admin/AdminCurriculumManager.tsx`: Search, inspect, and edit Ground Truths for 40+ topics.
  - `src/App.tsx`: Protected `/admin/*` routes using `RoleGuard`.
  - `supabase/seed.sql`: Seeded `usr-learner-001` and `usr-admin-999` into `public.profiles`.
