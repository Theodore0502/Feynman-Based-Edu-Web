/**
 * File: src/components/lectures/SubjectCard.tsx
 * Mục đích: Thẻ Môn Học (Cấp 2) hiển thị trong lưới Grid 4 cột theo thứ tự 1 2 3 4 / 5 6 7 8.
 */

import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, ArrowRight, CheckCircle2, Award } from "lucide-react";
import type { AcademicSubject } from "@/types/catalog.types";

interface SubjectCardProps {
  subject: AcademicSubject;
  domainSlug: string;
  orderNumber: number;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  domainSlug,
  orderNumber,
}) => {
  const formattedIndex = String(orderNumber).padStart(2, "0");
  const completed = subject.completedCount || 0;
  const total = subject.topicCount || 6;
  const progressPercent = Math.round((completed / total) * 100);

  const getDifficultyLabel = (level: number) => {
    if (level <= 2) return { text: "Cơ Bản", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    if (level <= 3) return { text: "Trung Bình", color: "bg-blue-50 text-blue-700 border-blue-200" };
    if (level <= 4) return { text: "Nâng Cao", color: "bg-amber-50 text-amber-700 border-amber-200" };
    return { text: "Chuyên Sâu", color: "bg-rose-50 text-rose-700 border-rose-200" };
  };

  const diff = getDifficultyLabel(subject.difficultyLevel);

  return (
    <Link
      to={`/lectures/${domainSlug}/${subject.slug}`}
      className="group bg-white rounded-3xl p-6 border border-[#E8EEF8] shadow-subtle hover:border-[#7286D3] hover:shadow-card transition-all duration-300 flex flex-col justify-between cursor-pointer hover:-translate-y-1 relative"
    >
      <div>
        {/* Top Header: Order Number & Difficulty Badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-2xl bg-[#EEF2FC] text-[#5066A1] font-mono font-black text-sm flex items-center justify-center group-hover:bg-[#7286D3] group-hover:text-white transition-colors">
            {formattedIndex}
          </div>

          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${diff.color}`}>
            {diff.text}
          </span>
        </div>

        {/* Subject Title */}
        <h4 className="text-base font-extrabold text-slate-800 group-hover:text-[#5066A1] transition-colors line-clamp-2 mb-2">
          {subject.name}
        </h4>

        {/* Subject Description */}
        <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4">
          {subject.description}
        </p>
      </div>

      {/* Progress & Bottom Actions */}
      <div className="space-y-3 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600">
          <span className="flex items-center gap-1.5 text-slate-500">
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            Đã học {completed}/{total} bài
          </span>
          <span className="text-[#5066A1] font-extrabold">{progressPercent}%</span>
        </div>

        {/* Mini Progress Bar */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#7286D3] rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Action Link */}
        <div className="flex items-center justify-between pt-1 text-xs font-bold text-[#5066A1] group-hover:translate-x-1 transition-transform">
          <span>Xem bài giảng</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
};

