/**
 * File: src/pages/AuthAndOnboarding.tsx
 * Mục đích: [Trang 2] Auth & Onboarding - Cổng Đăng nhập & Khảo sát chuyên ngành khởi đầu.
 * Thành phần chính:
 *   - AuthAndOnboarding: Form đăng nhập / đăng ký và chọn lĩnh vực học tập.
 * Props/Inputs: Không có.
 */

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Sparkles, ArrowRight, Laptop, LineChart, Stethoscope, GraduationCap } from "lucide-react";

export const AuthAndOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("Stella Walton");
  const [email, setEmail] = useState("stella.walton@theodore.edu");
  const [fieldOfStudy, setFieldOfStudy] = useState("IT");

  const fields = [
    { id: "IT", label: "Công Nghệ Thông Tin", icon: Laptop },
    { id: "ECONOMICS", label: "Kinh Tế & Tài Chính", icon: LineChart },
    { id: "MEDICINE", label: "Y Khoa & Sinh Học", icon: Stethoscope },
    { id: "K12", label: "Học Sinh & Tổng Quát", icon: GraduationCap },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#F3F6FA] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 border border-[#E2EAFD] shadow-card space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#8EA7E9] to-[#FFB4B4] flex items-center justify-center text-white mx-auto shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Chào Mừng Đến Theodore</h2>
          <p className="text-xs text-slate-500">Khởi đầu hành trình học sâu theo Kỹ thuật Feynman</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Họ và tên của bạn</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-[#F8FAFD] border border-[#E2EAFD] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#8EA7E9]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Email học tập</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-[#F8FAFD] border border-[#E2EAFD] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#8EA7E9]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Lĩnh vực học tập trọng tâm</label>
            <div className="grid grid-cols-2 gap-2">
              {fields.map((f) => {
                const Icon = f.icon;
                const isSelected = fieldOfStudy === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFieldOfStudy(f.id)}
                    className={`p-3 rounded-2xl border text-left text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#EEF2FC] border-[#7286D3] text-[#5066A1]"
                        : "bg-white hover:bg-slate-50 border-slate-200/80 text-slate-600"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-[#7286D3]" />
                    <span className="truncate">{f.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-[#7286D3] hover:bg-[#5066A1] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <span>Vào Bảng Điều Khiển</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center">
          <Link to="/" className="text-xs font-semibold text-slate-400 hover:text-slate-600">
            ← Quay lại trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthAndOnboarding;

