/**
 * File: src/App.tsx
 * Mục đích: Bộ định tuyến trung tâm (React Router) liên kết 10 trang chức năng riêng biệt của Feynman Technique Stage.
 * Thành phần chính:
 *   - App: Thiết lập Routes cho Landing, Auth và các trang thuộc WorkspaceLayout.
 * Props/Inputs: Không có.
 */

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { WorkspaceLayout } from "./layouts/WorkspaceLayout";

// 10 Functional Pages (Đặt tên tường minh theo đúng chức năng)
import LandingAndDemo from "./pages/LandingAndDemo";
import AuthAndOnboarding from "./pages/AuthAndOnboarding";
import CommandDashboard from "./pages/CommandDashboard";
import StageSetup from "./pages/StageSetup";
import FeynmanStageLiveRoom from "./pages/FeynmanStageLiveRoom";
import MasteryReportCard from "./pages/MasteryReportCard";
import PersonaStudio from "./pages/PersonaStudio";
import TopicKnowledgeGraph from "./pages/TopicKnowledgeGraph";
import AnalogyJargonVault from "./pages/AnalogyJargonVault";
import SettingsAndAIConfig from "./pages/SettingsAndAIConfig";

export function App() {
  return (
    <Routes>
      {/* 1. Public Routes */}
      <Route path="/" element={<LandingAndDemo />} />
      <Route path="/auth" element={<AuthAndOnboarding />} />

      {/* 2. Workspace Routes (Kế thừa Sidebar & Header qua WorkspaceLayout) */}
      <Route element={<WorkspaceLayout />}>
        <Route path="/dashboard" element={<CommandDashboard />} />
        <Route path="/stage/new" element={<StageSetup />} />
        <Route path="/stage/:sessionId" element={<FeynmanStageLiveRoom />} />
        <Route path="/stage/:sessionId/report" element={<MasteryReportCard />} />
        <Route path="/personas" element={<PersonaStudio />} />
        <Route path="/topics" element={<TopicKnowledgeGraph />} />
        <Route path="/vault" element={<AnalogyJargonVault />} />
        <Route path="/settings" element={<SettingsAndAIConfig />} />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

