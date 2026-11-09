/**
 * File: src/pages/admin/AdminRubricStudio.tsx
 * Mục đích: Giao diện Quản trị Cấu hình Tiêu chí Đánh giá Feynman (Feynman Rubric Studio) thiết kế tối giản, công thái học (Ergonomic Single-Screen UI):
 *   - Không cần cuộn trang lên xuống: Bố cục 2 cột gọn gàng, điều khiển nhanh bằng nút bấm +/- và preset 1-click.
 *   - Tự động cân đối tổng trọng số 100% bằng 1 click.
 *   - Phản hồi tức thời qua Toast Sonner.
 */

import React, { useState } from "react";
import { toast } from "sonner";
import {
  Sliders,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Save,
  RotateCcw,
  Sparkles,
  Zap,
  Plus,
  Minus,
  Check,
} from "lucide-react";

interface CriterionState {
  id: string;
  name: string;
  shortLabel: string;
  aspect: string;
  description: string;
  weight: number;
  colorHex: string;
}

export const AdminRubricStudio: React.FC = () => {
  const [minPassScore, setMinPassScore] = useState(70);
  const [jargonPenalty, setJargonPenalty] = useState(1.5);

  const [criteria, setCriteria] = useState<CriterionState[]>([
    {
      id: "simplicity",
      name: "Độ Đơn Giản & Ngôn Ngữ Tự Thân",
      shortLabel: "Đơn Giản Hóa",
      aspect: "SIMPLICITY",
      description: "Diễn đạt bằng từ ngữ bình dân, gãy gọn, đứa trẻ 10 tuổi cũng hiểu được.",
      weight: 35,
      colorHex: "#7286D3",
    },
    {
      id: "accuracy",
      name: "Tính Chính Xác Của Nguyên Lý",
      shortLabel: "Chính Xác Bản Chất",
      aspect: "ACCURACY",
      description: "Khái niệm cốt lõi không bị sai lệch so với Ground Truth chuẩn mực.",
      weight: 25,
      colorHex: "#10B981",
    },
    {
      id: "analogy",
      name: "Chất Lượng Phép Ẩn Dụ Thực Tế",
      shortLabel: "Ẩn Dụ Trực Quan",
      aspect: "ANALOGY",
      description: "Hình ảnh so sánh sinh động từ đời sống thay vì đọc vẹt định nghĩa.",
      weight: 20,
      colorHex: "#F59E0B",
    },
    {
      id: "socratic",
      name: "Khả Năng Vượt Qua Câu Hỏi Xoáy",
      shortLabel: "Phản Biện Socratic",
      aspect: "SOCRATIC_DEFENSE",
      description: "Ứng biến thuyết phục khi AI truy vấn sâu vào các lỗ hổng lập luận.",
      weight: 20,
      colorHex: "#8B5CF6",
    },
  ]);

  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);

  const updateWeight = (id: string, delta: number) => {
    setCriteria((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const next = Math.max(5, Math.min(70, c.weight + delta));
          return { ...c, weight: next };
        }
        return c;
      })
    );
  };

  // 1-Click Auto Balance to 100%
  const handleAutoBalance = () => {
    const diff = 100 - totalWeight;
    if (diff === 0) return;
    setCriteria((prev) =>
      prev.map((c) =>
        c.id === "simplicity" ? { ...c, weight: Math.max(5, c.weight + diff) } : c
      )
    );
    toast.info("Đã tự động cân đối tổng trọng số về đúng 100%!");
  };

  // 1-Click Presets
  const applyPreset = (preset: "DEFAULT" | "STRICT" | "INTUITIVE") => {
    switch (preset) {
      case "DEFAULT":
        setMinPassScore(70);
        setJargonPenalty(1.5);
        setCriteria([
          { ...criteria[0], weight: 35 },
          { ...criteria[1], weight: 25 },
          { ...criteria[2], weight: 20 },
          { ...criteria[3], weight: 20 },
        ]);
        toast.success("Đã nạp bộ tiêu chí Mặc Định Feynman!");
        break;
      case "STRICT":
        setMinPassScore(80);
        setJargonPenalty(2.2);
        setCriteria([
          { ...criteria[0], weight: 20 },
          { ...criteria[1], weight: 40 },
          { ...criteria[2], weight: 20 },
          { ...criteria[3], weight: 20 },
        ]);
        toast.success("Đã nạp bộ tiêu chí Hàn Lâm Khắt Khe!");
        break;
      case "INTUITIVE":
        setMinPassScore(65);
        setJargonPenalty(1.2);
        setCriteria([
          { ...criteria[0], weight: 45 },
          { ...criteria[1], weight: 15 },
          { ...criteria[2], weight: 25 },
          { ...criteria[3], weight: 15 },
        ]);
        toast.success("Đã nạp bộ tiêu chí Trực Giác Đời Thường!");
        break;
    }
  };

  const handleSave = () => {
    if (totalWeight !== 100) {
      toast.error("Không thể lưu!", {
        description: `Tổng trọng số hiện là ${totalWeight}%. Vui lòng điều chỉnh hoặc bấm "Tự động cân đối" về đúng 100%.`,
      });
      return;
    }
    toast.success("Lưu cấu hình Rubric thành công!", {
      description: `Điểm sàn: ${minPassScore} | Phạt Jargon: x${jargonPenalty.toFixed(1)} | Trọng số: 100%.`,
    });
  };

  return (
    <div className="space-y-4 w-full">
      {/* 1. Compact Control Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
                Cấu Hình Tiêu Chí Đánh Giá Feynman (Rubric Studio)
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-100 text-purple-700">
                v2.4
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Tinh chỉnh trọng số chấm điểm và hệ số phạt ngôn ngữ của AI Evaluation Engine.
            </p>
          </div>
        </div>

        {/* Quick Presets & Save Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <div className="hidden xl:flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <span className="px-2 text-[11px] text-slate-400">Bộ mẫu:</span>
            <button
              onClick={() => applyPreset("DEFAULT")}
              className="px-2.5 py-1 rounded-lg hover:bg-white hover:text-[#5066A1] transition-all cursor-pointer"
            >
              Mặc định
            </button>
            <button
              onClick={() => applyPreset("STRICT")}
              className="px-2.5 py-1 rounded-lg hover:bg-white hover:text-[#5066A1] transition-all cursor-pointer"
            >
              Khắt khe
            </button>
            <button
              onClick={() => applyPreset("INTUITIVE")}
              className="px-2.5 py-1 rounded-lg hover:bg-white hover:text-[#5066A1] transition-all cursor-pointer"
            >
              Trực giác
            </button>
          </div>

          <button
            onClick={() => applyPreset("DEFAULT")}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Khôi phục thông số mặc định"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Khôi Phục</span>
          </button>

          <button
            onClick={handleSave}
            disabled={totalWeight !== 100}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer ${
              totalWeight === 100
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            <Save className="w-4 h-4" />
            <span>Lưu Cấu Hình</span>
          </button>
        </div>
      </div>

      {/* 3. Ergonomic Two-Column Workspace (No scrolling needed!) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Global Knobs & Total Weight (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: Tổng trọng số đánh giá */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Tổng Trọng Số
              </span>
              {totalWeight === 100 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <Check className="w-3 h-3" /> Chuẩn 100%
                </span>
              ) : (
                <button
                  onClick={handleAutoBalance}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-2.5 py-0.5 rounded-full transition-colors cursor-pointer"
                >
                  <Zap className="w-3 h-3 fill-purple-500" /> Cân đối 100%
                </button>
              )}
            </div>

            <div className="flex items-baseline justify-between">
              <span
                className={`text-4xl font-black ${
                  totalWeight === 100 ? "text-emerald-600" : "text-amber-500"
                }`}
              >
                {totalWeight}%
              </span>
              <span className="text-xs text-slate-400 font-semibold">/ 100% bắt buộc</span>
            </div>

            {/* Visual Multi-Segment Progress Bar */}
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex p-0.5 gap-0.5">
              {criteria.map((c) => (
                <div
                  key={c.id}
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${c.weight}%`,
                    backgroundColor: c.colorHex,
                  }}
                  title={`${c.shortLabel}: ${c.weight}%`}
                />
              ))}
            </div>
          </div>

          {/* Card 2: Điểm Sàn Thấu Suốt */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                  Điểm Sàn Đạt Chuẩn
                </span>
                <span className="text-xs text-slate-500">Mức tối thiểu để vượt qua bài giảng</span>
              </div>
              <span className="text-2xl font-black text-[#5066A1] bg-[#EEF2FC] px-3 py-1 rounded-xl">
                {minPassScore}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMinPassScore((prev) => Math.max(50, prev - 5))}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="range"
                min={50}
                max={90}
                step={5}
                value={minPassScore}
                onChange={(e) => setMinPassScore(Number(e.target.value))}
                className="flex-1 accent-[#7286D3] cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setMinPassScore((prev) => Math.min(95, prev + 5))}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 3: Hệ Số Phạt Jargon */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                  Hệ Số Phạt Bẫy Jargon
                </span>
                <span className="text-xs text-slate-500">Trừ điểm khi dùng thuật ngữ chưa giải thích</span>
              </div>
              <span className="text-2xl font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-xl">
                x{jargonPenalty.toFixed(1)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setJargonPenalty((prev) => Math.max(1.0, +(prev - 0.1).toFixed(1)))
                }
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="range"
                min={1.0}
                max={3.0}
                step={0.1}
                value={jargonPenalty}
                onChange={(e) => setJargonPenalty(Number(e.target.value))}
                className="flex-1 accent-rose-500 cursor-pointer"
              />
              <button
                type="button"
                onClick={() =>
                  setJargonPenalty((prev) => Math.min(3.0, +(prev + 0.1).toFixed(1)))
                }
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: 4 Criteria Matrix (8 cols, Compact 2x2 Grid) */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {criteria.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-[#7286D3] transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: c.colorHex }}
                    />
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 line-clamp-1">
                      {c.name}
                    </h3>
                  </div>

                  <span
                    className="text-base font-black px-2.5 py-0.5 rounded-xl shrink-0"
                    style={{
                      color: c.colorHex,
                      backgroundColor: `${c.colorHex}15`,
                    }}
                  >
                    {c.weight}%
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {c.description}
                </p>
              </div>

              {/* Adjuster Stepper Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => updateWeight(c.id, -5)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                    <span>5%</span>
                  </button>

                  {/* Progress Indicator */}
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden mx-1">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${(c.weight / 60) * 100}%`,
                        backgroundColor: c.colorHex,
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => updateWeight(c.id, 5)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>5%</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminRubricStudio;
