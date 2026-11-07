/**
 * File: src/App.tsx
 * Mục đích: Bộ định tuyến trung tâm (React Router) liên kết các trang chức năng của Feynman Technique Stage
 * và phân quyền bảo vệ tuyến đường Quản Trị (Admin Moderator) qua RoleGuard.
 */

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { WorkspaceLayout } from "./layouts/WorkspaceLayout";
import { RoleGuard } from "./components/auth/RoleGuard";

// Public & Learner Pages
import LandingAndDemo from "./pages/LandingAndDemo";
import AuthAndOnboarding from "./pages/AuthAndOnboarding";
import CommandDashboard from "./pages/CommandDashboard";
import StudyPrepLab from "./pages/StudyPrepLab";
import StageSetup from "./pages/StageSetup";
import FeynmanStageLiveRoom from "./pages/FeynmanStageLiveRoom";
import MasteryReportCard from "./pages/MasteryReportCard";
import PersonaStudio from "./pages/PersonaStudio";
import TopicKnowledgeGraph from "./pages/TopicKnowledgeGraph";
import AnalogyJargonVault from "./pages/AnalogyJargonVault";
import SettingsAndAIConfig from "./pages/SettingsAndAIConfig";
import PublicMasteryShareView from "./pages/PublicMasteryShareView";
import LecturesExplorer from "./pages/LecturesExplorer";
import AboutPage from "./pages/AboutPage";

// Admin Moderator Suite Pages
import AdminRubricStudio from "./pages/admin/AdminRubricStudio";
import AdminAuditCenter from "./pages/admin/AdminAuditCenter";
import AdminCurriculumManager from "./pages/admin/AdminCurriculumManager";
import { AdminAISettings } from "./pages/admin/AdminAISettings";

export function App() {
  return (
    <Routes>
      {/* 1. Public Routes */}
      <Route path="/" element={<LandingAndDemo />} />
      <Route path="/auth" element={<AuthAndOnboarding />} />
      <Route path="/share/:shareToken" element={<PublicMasteryShareView />} />
      <Route path="/share" element={<PublicMasteryShareView />} />

      {/* 2. Workspace Routes (Kế thừa Sidebar & Header qua WorkspaceLayout) */}
      <Route element={<WorkspaceLayout />}>
        {/* Learner Flow */}
        <Route path="/dashboard" element={<CommandDashboard />} />
        <Route path="/lectures" element={<LecturesExplorer />} />
        <Route path="/lectures/:domainSlug" element={<LecturesExplorer />} />
        <Route path="/lectures/:domainSlug/:subjectSlug" element={<LecturesExplorer />} />
        <Route path="/study" element={<StudyPrepLab />} />
        <Route path="/stage" element={<Navigate to="/stage/new" replace />} />
        <Route path="/stage/new" element={<StageSetup />} />
        <Route path="/stage/:sessionId" element={<FeynmanStageLiveRoom />} />
        <Route path="/stage/:sessionId/report" element={<MasteryReportCard />} />
        <Route path="/personas" element={<PersonaStudio />} />
        <Route path="/topics" element={<TopicKnowledgeGraph />} />
        <Route path="/vault" element={<AnalogyJargonVault />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/settings" element={<SettingsAndAIConfig />} />

        {/* Admin Moderator Protected Routes */}
        <Route
          path="/admin/rubrics"
          element={
            <RoleGuard allowedRoles={["admin"]}>
              <AdminRubricStudio />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/audits"
          element={
            <RoleGuard allowedRoles={["admin"]}>
              <AdminAuditCenter />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/curriculum"
          element={
            <RoleGuard allowedRoles={["admin"]}>
              <AdminCurriculumManager />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/ai-config"
          element={
            <RoleGuard allowedRoles={["admin"]}>
              <AdminAISettings />
            </RoleGuard>
          }
        />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
