/**
 * File: src/components/vault/QuickDrillFlashcard.tsx
 * Mục đích: Component Flashcard lật 3D tương tác ôn tập ngắt quãng (SM-2 Spaced Repetition Drill).
 * Thành phần chính:
 *   - QuickDrillFlashcard: Hiển thị thuật ngữ chuyên ngành ở mặt trước, giải thích bình dân & ẩn dụ ở mặt sau.
 *   - Các nút chấm điểm SM-2 (Quên, Khó, Nhớ tốt, Dễ) tự động tính khoảng cách ngày ôn tiếp theo.
 * Props/Inputs:
 *   - cards: Danh sách các thẻ cần ôn tập.
 *   - isOpen: Trạng thái hiển thị modal.
 *   - onClose: Hàm đóng modal.
 *   - onCardGraded: Callback khi hoàn thành đánh giá một thẻ.
 */

import React, { useState, useEffect } from "react";
import type { VaultRecord } from "@/types/session.types";
import { calculateSM2, type SM2EvaluationResult } from "@/lib/algorithms/sm2";
import { useGamificationStore } from "@/hooks/useGamificationStore";
import {
  X,
  RotateCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Smile,
  Zap,
  Quote,
  Layers,
  Flame,
} from "lucide-react";

interface QuickDrillFlashcardProps {
  cards: VaultRecord[];
  isOpen: boolean;
  onClose: () => void;
  onCardGraded: (cardId: string, result: SM2EvaluationResult) => void;
}

export const QuickDrillFlashcard: React.FC<QuickDrillFlashcardProps> = ({
  cards,
  isOpen,
  onClose,
  onCardGraded,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const activeCard = cards[currentIndex];
  const isFinished = cards.length === 0 || currentIndex >= cards.length;

  // Lắng nghe phím tắt (Space để lật, 1-4 để chấm điểm)
  useEffect(() => {
    if (!isOpen || isFinished) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped) {
        if (e.key === "1") handleGrade(1);
        else if (e.key === "2") handleGrade(3);
        else if (e.key === "3") handleGrade(4);
        else if (e.key === "4") handleGrade(5);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isFlipped, isFinished, activeCard]);

  // Reset khi mở modal
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsFlipped(false);
      setCompletedCount(0);
    }
  }, [isOpen]);

  const handleGrade = (grade: number) => {
    if (!activeCard) return;

    const result = calculateSM2(grade, {
      repetitions: activeCard.repetitions || 0,
      intervalDays: activeCard.intervalDays || 1,
      easeFactor: activeCard.easeFactor || 2.5,
      nextReviewAt: activeCard.nextReviewAt,
      masteryLevel: activeCard.masteryLevel || 1,
    });

    onCardGraded(activeCard.id, result);
    useGamificationStore.getState().recordFlashcardReview();

    setCompletedCount((prev) => prev + 1);
    setIsFlipped(false);
    setCurrentIndex((prev) => prev + 1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl border border-[#E8EEF8] shadow-2xl p-6 sm:p-7 space-y-6 relative overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E8EEF8]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#E8EEF8] flex items-center justify-center text-[#7286D3]">
              <Zap className="w-4 h-4 fill-[#7286D3]" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">
                Ôn Tập Ngắt Quãng SM-2 (Quick Drill)
              </h3>
              <p className="text-[11px] text-slate-500">
                {isFinished
                  ? "Đã hoàn thành vòng ôn tập"
                  : `Thẻ ${currentIndex + 1} trên ${cards.length} thẻ cần ôn`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Finished Screen */}
        {isFinished ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-800">Hoàn Thành Đợt Ôn Tập!</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                Bạn đã ôn xong <strong>{completedCount} thẻ</strong> theo thuật toán SM-2. Ngày ôn tiếp theo đã được tự động tính toán.
              </p>
            </div>

            <div className="pt-4">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-2xl bg-[#7286D3] text-white text-xs font-bold hover:bg-[#5E72C4] shadow-xs transition-colors"
              >
                Đóng & Quay Lại Sổ Tay
              </button>
            </div>
          </div>
        ) : (
          /* Active Flashcard */
          <div className="space-y-6">
            {/* 3D Flashcard Container */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="relative min-h-[260px] p-6 rounded-3xl border-2 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between select-none bg-gradient-to-br from-white to-[#F8FAFD] border-[#DCE6F8]"
            >
              {/* Badge & Topic */}
              <div className="flex items-center justify-between text-xs">
                <span className="px-3 py-1 rounded-full bg-[#E8EEF8] text-[#7286D3] font-bold text-[11px]">
                  {activeCard.topic}
                </span>
                <span className="text-slate-400 text-[11px] flex items-center gap-1 font-medium">
                  <RotateCw className="w-3.5 h-3.5" />
                  {isFlipped ? "Mặt sau (Giải thích)" : "Nhấn để lật (Space)"}
                </span>
              </div>

              {/* Main Content Area */}
              <div className="py-4 text-center my-auto">
                {!isFlipped ? (
                  /* FRONT: Jargon Term */
                  <div className="space-y-3">
                    <span className="text-[11px] uppercase tracking-widest font-bold text-slate-400">
                      Thuật ngữ chuyên ngành
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                      "{activeCard.term}"
                    </h2>
                    <p className="text-xs text-slate-500 italic max-w-sm mx-auto">
                      Hãy nhẩm lại trong đầu cách bạn sẽ giải thích từ này cho một đứa trẻ 10 tuổi trước khi lật thẻ.
                    </p>
                  </div>
                ) : (
                  /* BACK: Plain Explanation & Analogy */
                  <div className="space-y-4 text-left animate-in fade-in zoom-in-95 duration-150">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block mb-1">
                        ✓ Lời giải thích bình dân của bạn:
                      </span>
                      <p className="text-sm font-semibold text-slate-800 leading-relaxed bg-white p-3 rounded-2xl border border-[#E8EEF8]">
                        {activeCard.plainExplanation}
                      </p>
                    </div>

                    {activeCard.analogyUsed && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#7286D3] flex items-center gap-1 mb-1">
                          <Quote className="w-3 h-3" />
                          Ẩn dụ đã sử dụng:
                        </span>
                        <p className="text-xs text-slate-600 italic bg-[#F3F6FA] p-3 rounded-2xl border border-[#E8EEF8]">
                          "{activeCard.analogyUsed}"
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Hint */}
              <div className="text-center text-[11px] text-slate-400">
                {!isFlipped ? (
                  <span>Bấm vào thẻ hoặc ấn phím <strong>Space</strong> để xem đáp án</span>
                ) : (
                  <span>Đánh giá mức độ nhớ của bạn bên dưới (phím 1 - 4)</span>
                )}
              </div>
            </div>

            {/* Grading Buttons (Appears only after flipped) */}
            {isFlipped ? (
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block text-center">
                  Bạn nhớ từ này như thế nào? (Thuật toán SM-2)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Button 1: Quên (Grade 1) */}
                  <button
                    onClick={() => handleGrade(1)}
                    className="p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-center transition-all cursor-pointer group"
                  >
                    <span className="text-xs font-black block group-hover:scale-105 transition-transform">
                      1. Ôn Lại
                    </span>
                    <span className="text-[10px] text-rose-500 font-semibold block mt-0.5">
                      Ôn lại: Ngày mai
                    </span>
                  </button>

                  {/* Button 2: Khó (Grade 3) */}
                  <button
                    onClick={() => handleGrade(3)}
                    className="p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-center transition-all cursor-pointer group"
                  >
                    <span className="text-xs font-black block group-hover:scale-105 transition-transform">
                      2. Khó
                    </span>
                    <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">
                      Ôn lại: 1-2 ngày
                    </span>
                  </button>

                  {/* Button 3: Nhớ tốt (Grade 4) */}
                  <button
                    onClick={() => handleGrade(4)}
                    className="p-3 rounded-2xl bg-[#EEF2FC] hover:bg-[#D5E1FA] text-[#5066A1] border border-[#D5E1FA] text-center transition-all cursor-pointer group"
                  >
                    <span className="text-xs font-black block group-hover:scale-105 transition-transform">
                      3. Tốt
                    </span>
                    <span className="text-[10px] text-[#7286D3] font-semibold block mt-0.5">
                      Ôn lại: 6 ngày
                    </span>
                  </button>

                  {/* Button 4: Rất dễ (Grade 5) */}
                  <button
                    onClick={() => handleGrade(5)}
                    className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-center transition-all cursor-pointer group"
                  >
                    <span className="text-xs font-black block group-hover:scale-105 transition-transform">
                      4. Rất Dễ
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                      Ôn lại: 14+ ngày
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsFlipped(true)}
                className="w-full py-3.5 rounded-2xl bg-[#7286D3] hover:bg-[#5E72C4] text-white font-extrabold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCw className="w-4 h-4" />
                <span>Lật Xem Lời Giải Thích & Ẩn Dụ</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

