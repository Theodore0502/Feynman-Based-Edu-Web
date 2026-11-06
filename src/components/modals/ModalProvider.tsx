/**
 * File: src/components/modals/ModalProvider.tsx
 * Mục đích: Mount toàn bộ hệ thống 6 Popup / Drawer tập trung vào Root Layout (Tuân thủ nguyên tắc Centralized Modal Controller).
 * Thành phần chính:
 *   - ModalProvider: Component bao bọc tự động render các modal dựa trên trạng thái của useModalStore.
 * Props/Inputs: Không có.
 */

"use client";

import React from "react";
import { AnalogyHintModal } from "./AnalogyHintModal";
import { JargonInspectorDrawer } from "./JargonInspectorDrawer";
import { QuickDrillModal } from "./QuickDrillModal";
import { VoiceCalibrationModal } from "./VoiceCalibrationModal";
import { ShareMasteryModal } from "./ShareMasteryModal";
import { EndStageConfirmModal } from "./EndStageConfirmModal";

export const ModalProvider: React.FC = () => {
  return (
    <>
      <AnalogyHintModal />
      <JargonInspectorDrawer />
      <QuickDrillModal />
      <VoiceCalibrationModal />
      <ShareMasteryModal />
      <EndStageConfirmModal />
    </>
  );
};

