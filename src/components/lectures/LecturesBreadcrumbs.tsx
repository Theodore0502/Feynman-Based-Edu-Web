/**
 * File: src/components/lectures/LecturesBreadcrumbs.tsx
 * Mục đích: Thanh Breadcrumb điều hướng 3 tầng trong hệ thống Bài giảng Feynman.
 */

import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, BookOpen, Layers, GraduationCap } from "lucide-react";
import type { DomainCategory, AcademicSubject } from "@/types/catalog.types";

interface LecturesBreadcrumbsProps {
  currentDomain?: DomainCategory;
  currentSubject?: AcademicSubject;
}

export const LecturesBreadcrumbs: React.FC<LecturesBreadcrumbsProps> = ({
  currentDomain,
  currentSubject,
}) => {
  return (
    <nav className="flex items-center gap-2 text-xs font-bold text-slate-500 py-1">
      <Link
        to="/lectures"
        className="flex items-center gap-1.5 hover:text-[#5066A1] transition-colors"
      >
        <BookOpen className="w-3.5 h-3.5 text-[#7286D3]" />
        <span>Kho Bài Giảng</span>
      </Link>

      {currentDomain && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          {currentSubject ? (
            <Link
              to={`/lectures/${currentDomain.slug}`}
              className="flex items-center gap-1 hover:text-[#5066A1] transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentDomain.name}</span>
            </Link>
          ) : (
            <span className="text-slate-800 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#7286D3]" />
              <span>{currentDomain.name}</span>
            </span>
          )}
        </>
      )}

      {currentSubject && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-800 flex items-center gap-1 truncate max-w-xs">
            <GraduationCap className="w-3.5 h-3.5 text-[#7286D3]" />
            <span className="truncate">{currentSubject.name}</span>
          </span>
        </>
      )}
    </nav>
  );
};

