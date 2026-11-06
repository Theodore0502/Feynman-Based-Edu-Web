/**
 * File: src/components/modals/EndStageConfirmModal.tsx
 * Mục đích: Popup xác nhận kết thúc sớm buổi giảng giải và kích hoạt tạo Feynman Mastery Card.
 * Thành phần chính:
 *   - EndStageConfirmModal: Modal xác nhận kết thúc buổi học.
 * Props/Inputs: useModalStore ({ onConfirm }).
 */

import React from "react";
import { useModalStore } from "@/hooks/useModalStore";
import { AlertTriangle, X } from "lucide-react";

export const EndStageConfirmModal: React.FC = () => {
  const { activeModal, modalData, closeModal } = useModalStore();

  const isOpen = activeModal === "END_STAGE_CONFIRM";
  if (!isOpen) return null;

  const onConfirm = modalData?.onConfirm as (() => void) | undefined;

  const handleConfirm = () => {
    closeModal();
    if (onConfirm) onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 border border-[#E2EAFD] shadow-2xl space-y-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#FFEAEA] text-[#D9534F] flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-slate-800">Kết Thúc Buổi Giảng?</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Hệ thống sẽ tổng hợp toàn bộ lịch sử đối thoại, phân tích các thuật ngữ và cấp <b>Thẻ Báo Cáo Feynman Mastery Card</b> cho bạn.
        </p>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={closeModal}
            className="py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            Giảng Tiếp
          </button>
          <button
            onClick={handleConfirm}
            className="py-2.5 rounded-2xl bg-[#7286D3] hover:bg-[#5066A1] text-white text-xs font-bold transition-colors"
          >
            Chốt & Tạo Báo Cáo
          </button>
        </div>
      </div>
    </div>
  );
};

