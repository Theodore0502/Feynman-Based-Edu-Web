/**
 * File: src/components/lectures/DomainCard.tsx
 * Mục đích: Thẻ Nhóm Ngành Học Thuật (Cấp 1) hiển thị trong lưới Grid 4 cột.
 */

import React from "react";
import { Link } from "react-router-dom";
import {
  Cpu,
  Terminal,
  Code2,
  ShoppingCart,
  Calculator,
  Briefcase,
  Compass,
  Stethoscope,
  Sigma,
  Eye,
  Network,
  Globe,
  TrendingUp,
  HeartPulse,
  BarChart3,
  ArrowRight,
  BookOpen,
  Layers,
} from "lucide-react";
import type { DomainCategory } from "@/types/catalog.types";

const DOMAIN_ICONS: Record<string, React.ElementType> = {
  Cpu,
  Terminal,
  Code2,
  ShoppingCart,
  Calculator,
  Briefcase,
  Compass,
  Stethoscope,
  Sigma,
  Eye,
  Network,
  Globe,
  TrendingUp,
  HeartPulse,
  BarChart3,
};

interface DomainCardProps {
  domain: DomainCategory;
  index: number;
}

export const DomainCard: React.FC<DomainCardProps> = ({ domain, index }) => {
  const IconComponent = DOMAIN_ICONS[domain.iconName || "Cpu"] || BookOpen;
  const completionRate = domain.completionRate || 0;

  return (
    <Link
      to={`/lectures/${domain.slug}`}
      className="group bg-white rounded-3xl p-6 border border-[#E8EEF8] shadow-subtle hover:border-[#8EA7E9] hover:shadow-card transition-all duration-300 flex flex-col justify-between cursor-pointer hover:-translate-y-1 relative overflow-hidden"
    >
      {/* Top Accent Gradient Bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5 opacity-80 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: domain.colorHex || "#3B82F6" }}
      />

      <div>
        {/* Top Header: Logo - Tên Ngành (Nằm ngang hàng, dài quá thì tự xuống dòng) */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 shrink-0 mt-0.5"
            style={{
              backgroundColor: `${domain.colorHex || "#3B82F6"}15`,
              color: domain.colorHex || "#3B82F6",
            }}
          >
            <IconComponent className="w-5 h-5" />
          </div>

          <h3 className="text-sm sm:text-base font-extrabold text-slate-800 group-hover:text-[#5066A1] transition-colors leading-snug">
            {domain.name}
          </h3>
        </div>

        {/* Tóm tắt nội dung ngắn (2 dòng, dài quá thì ...) */}
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-4">
          {domain.description}
        </p>
      </div>

      {/* Progress & Metrics */}
      <div className="space-y-3 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            {domain.subjectCount || 4} Môn Học
          </span>
          <span className="text-[#5066A1]">
            {domain.completedLectures || 0}/{domain.totalLectures || 0} bài
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${completionRate}%`,
                backgroundColor: domain.colorHex || "#3B82F6",
              }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
            <span>Tiến độ hoàn thành</span>
            <span className="text-slate-700">{completionRate}%</span>
          </div>
        </div>

        {/* Bottom CTA Arrow */}
        <div className="flex items-center justify-between pt-1 text-xs font-bold text-[#5066A1] group-hover:translate-x-1 transition-transform">
          <span>Xem các môn học</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
};

