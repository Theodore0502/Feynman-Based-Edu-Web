/**
 * File: src/pages/SettingsAndAIConfig.tsx
 * Mục đích: [Trang 10] Settings & AI Config - Cấu hình mô hình AI, khóa API, tham số nhiệt độ phân tích và giọng nói Web Speech.
 * Thành phần chính:
 *   - SettingsAndAIConfig: Quản lý thiết lập hệ thống, kiểm tra kết nối API và hồ sơ học viên.
 * Props/Inputs: Không có.
 */

import React, { useState } from "react";
import { Cpu, Mic, ShieldCheck, CheckCircle2, Save } from "lucide-react";
import { useModalStore } from "@/hooks/useModalStore";

export const SettingsAndAIConfig: React.FC = () => {
  const { openModal } = useModalStore();
  const [model, setModel] = useState("gemini-1.5-flash");
  const [provider, setProvider] = useState("gemini");
  const [temp, setTemp] = useState(0.2);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h3 className="text-xl font-black text-slate-800">Thiết Lập Hệ Thống & Cấu Hình AI</h3>
        <p className="text-xs text-slate-500">Tùy chỉnh thông số mô hình AI phản biện và thiết bị thu âm giọng nói</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. AI Model Config */}
        <div className="bg-white rounded-3xl p-6 border border-[#E8EEF8] shadow-subtle space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Cpu className="w-5 h-5 text-[#7286D3]" />
            <h4 className="text-sm font-extrabold text-slate-800">Cấu Hình Mô Hình Ngôn Ngữ (LLM)</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Nhà cung cấp (Provider)</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F8FAFD] border border-[#E2EAFD] text-xs font-semibold focus:outline-none"
              >
                <option value="gemini">Google Gemini (Khuyên dùng)</option>
                <option value="openai">OpenAI Compatible</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Tên Mô Hình (Model)</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F8FAFD] border border-[#E2EAFD] text-xs font-semibold focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
              <span>Nhiệt độ sáng tạo (Temperature): {temp}</span>
              <span className="text-[10px] text-slate-400">Thấp: Chính xác cao, bám sát Ground Truth</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={temp}
              onChange={(e) => setTemp(parseFloat(e.target.value))}
              className="w-full accent-[#7286D3]"
            />
          </div>

          <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#E8F8F0] border border-[#BDE8D2] text-xs text-[#1E7E50]">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>GEMINI_API_KEY đã được nạp sẵn từ tệp cấu hình môi trường .env.</span>
          </div>
        </div>

        {/* 2. Micro & Voice Config */}
        <div className="bg-white rounded-3xl p-6 border border-[#E8EEF8] shadow-subtle space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Mic className="w-5 h-5 text-[#8EA7E9]" />
            <h4 className="text-sm font-extrabold text-slate-800">Thiết Lập Nhận Diện Giọng Nói</h4>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800">Trình nhận dạng Web Speech API</p>
              <p className="text-[11px] text-slate-500">Chạy cục bộ trên trình duyệt, không tốn chi phí API</p>
            </div>
            <button
              type="button"
              onClick={() => openModal("VOICE_CALIBRATION")}
              className="px-4 py-2 rounded-2xl bg-[#EEF2FC] hover:bg-[#D8E3FB] text-[#5066A1] font-bold text-xs border border-[#D5E1FA] transition-colors cursor-pointer"
            >
              Kiểm Tra Micro
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#7286D3] hover:bg-[#5066A1] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
        >
          {saved ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          <span>{saved ? "Đã Lưu Cài Đặt!" : "Lưu Thay Đổi"}</span>
        </button>
      </form>
    </div>
  );
};

export default SettingsAndAIConfig;

