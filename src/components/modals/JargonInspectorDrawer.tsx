/**
 * File: src/components/modals/JargonInspectorDrawer.tsx
 * Mục đích: Drawer trượt từ bên phải hiển thị chi tiết các thuật ngữ chuyên ngành bị cảnh báo và gợi ý cách giải thích.
 * Thành phần chính:
 *   - JargonInspectorDrawer: Drawer kiểm tra thuật ngữ.
 * Props/Inputs: Nhận dữ liệu { jargons: JargonItem[] } từ useModalStore.
 */

import React from "react";
import { useModalStore } from "@/hooks/useModalStore";
import { AlertCircle, X, BookOpen, ArrowRight } from "lucide-react";
import type { JargonItem } from "@/types/agent.types";

export const JargonInspectorDrawer: React.FC = () => {
  const { activeModal, modalData, closeModal, openModal } = useModalStore();

  const isOpen = activeModal === "JARGON_INSPECTOR";
  const jargons = (modalData?.jargons as JargonItem[]) || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-md h-full p-6 shadow-2xl flex flex-col justify-between border-l border-[#E2EAFD] animate-in slide-in-from-right duration-300">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#FFEAEA] flex items-center justify-center text-[#D9534F]">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Cảnh Báo Thuật Ngữ (Jargon)</h3>
                <p className="text-xs text-slate-500">Các từ chưa được bình dân hóa</p>
              </div>
            </div>
            <button onClick={closeModal} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-180px)] pr-1">
            {jargons.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Không phát hiện thuật ngữ phức tạp nào! Bài giảng của bạn rất trong sáng.
              </div>
            ) : (
              jargons.map((jargon, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-[#FFF9F9] border border-[#FFDADA] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#D9534F]">{jargon.term}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFEAEA] text-[#D9534F]">
                      Chưa giải thích
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{jargon.reason}</p>
                  <button
                    onClick={() => {
                      closeModal();
                      openModal("ANALOGY_HINT", { term: jargon.term });
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#7286D3] hover:text-[#5066A1] pt-1"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Tìm ẩn dụ thay thế cho từ này</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <button
          onClick={closeModal}
          className="w-full py-2.5 rounded-2xl bg-[#EEF2FC] text-[#5066A1] font-semibold text-xs hover:bg-[#E0E7FA] transition-colors"
        >
          Đóng Bảng Kiểm Tra
        </button>
      </div>
    </div>
  );
};

