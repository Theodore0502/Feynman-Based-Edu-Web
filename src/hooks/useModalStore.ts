/**
 * File: src/hooks/useModalStore.ts
 * Mục đích: Quản lý trạng thái mở/đóng tập trung cho toàn bộ 6 Popups/Drawers của hệ thống bằng Zustand (Tuân thủ nguyên tắc Centralized Modal Controller).
 * Thành phần chính:
 *   - ModalType: Định danh các loại modal (ANALOGY_HINT, JARGON_INSPECTOR, QUICK_DRILL, VOICE_CALIBRATION, SHARE_MASTERY, END_STAGE_CONFIRM).
 *   - useModalStore: Hook Zustand điều khiển modal từ bất kỳ component con nào.
 * Props/Inputs: Global store.
 */

import { create } from "zustand";

export type ModalType =
  | "ANALOGY_HINT"
  | "JARGON_INSPECTOR"
  | "QUICK_DRILL"
  | "VOICE_CALIBRATION"
  | "SHARE_MASTERY"
  | "END_STAGE_CONFIRM";

interface ModalState {
  activeModal: ModalType | null;
  modalData: Record<string, unknown> | null;
  openModal: (type: ModalType, data?: Record<string, unknown>) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  activeModal: null,
  modalData: null,
  openModal: (type, data = {}) => set({ activeModal: type, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),
}));

