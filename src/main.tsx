/**
 * File: src/main.tsx
 * Mục đích: Điểm khởi nhập (Entry Point) của ứng dụng React Theodore Feynman Technique Stage.
 * Thành phần chính: ReactDOM.createRoot, App mount, BrowserRouter.
 * Props/Inputs: Không có.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import "./lib/services/system-logger";
import "./lib/services/audit-log-service";
import { ModalProvider } from "./components/modals/ModalProvider";
import { GlobalActivityTracker } from "./components/shared/GlobalActivityTracker";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <GlobalActivityTracker />
      <App />
      <ModalProvider />
    </BrowserRouter>
  </React.StrictMode>
);

