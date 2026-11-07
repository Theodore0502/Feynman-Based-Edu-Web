/**
 * File: src/pages/PersonaStudio.tsx
 * Mục đích: [Trang 7] Thư Viện Khán Giả AI (Persona Studio) - Quản lý, xem chi tiết và tạo mới các nhân vật AI đóng vai người nghe theo phương pháp Feynman.
 * Hỗ trợ lưu trữ bền vững (localStorage), thanh trượt mức độ hoài nghi / vặn vẹo (1-10) và thư viện Avatar mẫu.
 */

import React, { useState, useEffect } from "react";
import {
  DEFAULT_PERSONAS,
  PRESET_AVATARS,
  getAllPersonas,
  saveCustomPersona,
  deleteCustomPersona,
  type PersonaDefinition,
} from "@/config/personas.config";
import { PersonaAvatarCard } from "@/components/shared/PersonaAvatarCard";
import { Plus, Trash2, Sparkles, Sliders, ShieldAlert, CheckCircle2 } from "lucide-react";

export const PersonaStudio: React.FC = () => {
  const [personas, setPersonas] = useState<PersonaDefinition[]>(DEFAULT_PERSONAS);
  const [selectedPersona, setSelectedPersona] = useState<PersonaDefinition>(DEFAULT_PERSONAS[0]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form State
  const [newName, setNewName] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newAge, setNewAge] = useState("25 tuổi");
  const [newAvatar, setNewAvatar] = useState(PRESET_AVATARS[0]);
  const [newWorldview, setNewWorldview] = useState("");
  const [newSocraticStyle, setNewSocraticStyle] = useState("");
  const [skepticismLevel, setSkepticismLevel] = useState<number>(6);

  // Đồng bộ danh sách personas từ localStorage
  useEffect(() => {
    const list = getAllPersonas();
    setPersonas(list);
    if (list.length > 0 && !selectedPersona) {
      setSelectedPersona(list[0]);
    }
  }, []);

  const handleCreatePersona = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const custom: PersonaDefinition = {
      id: `custom_${Date.now()}`,
      name: newName.trim(),
      title: newTitle.trim() || "Người nghe tự định nghĩa",
      age: newAge.trim() || "25 tuổi",
      avatar: newAvatar,
      accentColor: "#8EA7E9",
      bgGradient: "from-[#F5F2FB] to-[#FAF8FD]",
      badgeText: `Hoài nghi cấp ${skepticismLevel}/10`,
      description: `Lăng kính đặc thù: ${newWorldview || "Đời sống thường nhật"}`,
      worldview: newWorldview || "Chỉ hiểu thông qua các hoạt động thường ngày",
      socraticStyle:
        newSocraticStyle ||
        (skepticismLevel >= 8
          ? "Truy vết triệt để lỗ hổng logic, vặn vẹo mọi thuật ngữ"
          : "Hỏi lại ngắn gọn khi nghe thấy từ lạ"),
      systemPrompt: `Bạn là ${newName}, ${newTitle} (${newAge}).
Mức độ hoài nghi của bạn: ${skepticismLevel}/10.
Lăng kính thế giới quan: ${newWorldview}.
QUY TẮC:
1. Bạn chỉ hiểu những khái niệm liên quan đến thế giới quan của mình.
2. Nếu người nói dùng thuật ngữ kỹ thuật khó hiểu mà không ví von, hãy hỏi lại dứt khoát 1-2 câu.`,
      skepticismLevel,
      isCustom: true,
    };

    const updatedList = saveCustomPersona(custom);
    setPersonas([...DEFAULT_PERSONAS, ...updatedList]);
    setSelectedPersona(custom);
    setShowCreateForm(false);

    // Reset Form
    setNewName("");
    setNewTitle("");
    setNewAge("25 tuổi");
    setNewWorldview("");
    setNewSocraticStyle("");
    setSkepticismLevel(6);
  };

  const handleDeletePersona = (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa nhân vật khán giả tùy chỉnh này không?")) {
      const remainingCustom = deleteCustomPersona(id);
      const updated = [...DEFAULT_PERSONAS, ...remainingCustom];
      setPersonas(updated);
      setSelectedPersona(DEFAULT_PERSONAS[0]);
    }
  };

  const getSkepticismDescription = (level: number) => {
    if (level <= 3) {
      return "Hiền hòa & Dễ tính: Tiếp thu nhanh, chấp nhận ẩn dụ tương đối và hiếm khi ngắt lời.";
    }
    if (level <= 7) {
      return "Tiêu chuẩn Feynman: Bắt bẻ ngay khi nghe thuật ngữ lạ, yêu cầu ví dụ đời sống thực tế.";
    }
    return "Phản biện gắt gao (Socrates Hardcore): Truy vết triệt để từng lỗ hổng logic và giả định ngầm.";
  };

  return (
    <div className="space-y-6">
      {/* Header Studio */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-800">Thư Viện Khán Giả AI</h3>
          <p className="text-xs text-slate-500">
            Tập hợp các khán giả AI đại diện cho các lăng kính đời sống, độ tuổi và mức độ hoài nghi khác nhau
          </p>
        </div>

        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#7286D3] hover:bg-[#5066A1] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{showCreateForm ? "Đóng Form" : "Tạo Khán Giả Mới"}</span>
        </button>
      </div>

      {/* Form Tạo Mới (Collapsible) */}
      {showCreateForm && (
        <form
          onSubmit={handleCreatePersona}
          className="p-6 bg-white rounded-3xl border border-[#E2EAFD] shadow-subtle space-y-5 animate-in fade-in"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#7286D3]" />
              Thiết Kế Khán Giả Tùy Chỉnh
            </h4>
            <span className="text-[11px] text-slate-400">Lưu trữ trên trình duyệt của bạn</span>
          </div>

          {/* Avatar Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Chọn Ảnh Đại Diện</label>
            <div className="flex flex-wrap items-center gap-3">
              {PRESET_AVATARS.map((avatarUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNewAvatar(avatarUrl)}
                  className={`w-12 h-12 rounded-2xl overflow-hidden p-0.5 border-2 transition-all cursor-pointer ${
                    newAvatar === avatarUrl
                      ? "border-[#7286D3] ring-2 ring-[#7286D3]/30 scale-105"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tên nhân vật *</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ví dụ: Bác tài xe ôm, Đầu bếp..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFD] border border-[#E2EAFD] text-xs focus:outline-none focus:ring-2 focus:ring-[#8EA7E9]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Chức danh / Nghề nghiệp</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ví dụ: Tài xế công nghệ, Sinh viên..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFD] border border-[#E2EAFD] text-xs focus:outline-none focus:ring-2 focus:ring-[#8EA7E9]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Độ tuổi</label>
              <input
                type="text"
                value={newAge}
                onChange={(e) => setNewAge(e.target.value)}
                placeholder="Ví dụ: 45 tuổi"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFD] border border-[#E2EAFD] text-xs focus:outline-none focus:ring-2 focus:ring-[#8EA7E9]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Lăng kính thế giới quan (Khán giả này hiểu thế giới thông qua những gì?)
            </label>
            <input
              type="text"
              value={newWorldview}
              onChange={(e) => setNewWorldview(e.target.value)}
              placeholder="Ví dụ: Chỉ hiểu qua động cơ xe máy, cờ lê, xăng nhớt và đường sá giao thông..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFD] border border-[#E2EAFD] text-xs focus:outline-none focus:ring-2 focus:ring-[#8EA7E9]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Phong cách hỏi / Phản biện Socrates
            </label>
            <input
              type="text"
              value={newSocraticStyle}
              onChange={(e) => setNewSocraticStyle(e.target.value)}
              placeholder="Ví dụ: Thường xuyên ngắt lời nếu gặp thuật ngữ trừu tượng, đòi hỏi ví dụ thực tiễn..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFD] border border-[#E2EAFD] text-xs focus:outline-none focus:ring-2 focus:ring-[#8EA7E9]"
            />
          </div>

          {/* Skepticism Slider (1 - 10) */}
          <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#E2EAFD] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#7286D3]" />
                Mức Độ Hoài Nghi & Bắt Bẻ: <span className="text-[#5066A1] font-black">{skepticismLevel} / 10</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {skepticismLevel <= 3 ? "Dễ tính" : skepticismLevel <= 7 ? "Tiêu chuẩn" : "Gắt gao"}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={skepticismLevel}
              onChange={(e) => setSkepticismLevel(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#7286D3]"
            />
            <p className="text-[11px] text-slate-500 italic">
              {getSkepticismDescription(skepticismLevel)}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 cursor-pointer transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#7286D3] hover:bg-[#5066A1] text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
            >
              Lưu Khán Giả Mới
            </button>
          </div>
        </form>
      )}

      {/* Grid Danh Sách Khán Giả */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {personas.map((p) => (
          <PersonaAvatarCard
            key={p.id}
            persona={p}
            variant="full"
            isSelected={selectedPersona?.id === p.id}
            onSelect={() => setSelectedPersona(p)}
          />
        ))}
      </div>

      {/* Chi Tiết Khán Giả Đang Chọn */}
      {selectedPersona && (
        <div className="bg-white rounded-3xl p-6 border border-[#E8EEF8] shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <img
                src={selectedPersona.avatar}
                alt={selectedPersona.name}
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-[#B5B2E8]"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-extrabold text-slate-800">
                    {selectedPersona.name} ({selectedPersona.age})
                  </h4>
                  {selectedPersona.isCustom && (
                    <span className="px-2 py-0.5 rounded-md bg-[#EEF2FC] text-[#5066A1] text-[10px] font-bold">
                      Tùy chỉnh
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#5066A1] font-semibold">{selectedPersona.title}</p>
              </div>
            </div>

            {selectedPersona.isCustom && (
              <button
                onClick={() => handleDeletePersona(selectedPersona.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 text-xs font-bold cursor-pointer transition-colors self-start sm:self-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa Khán Giả Này</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#E2EAFD] space-y-1">
              <span className="font-bold text-[#5066A1]">Lăng kính thế giới quan:</span>
              <p className="text-slate-600 leading-relaxed">{selectedPersona.worldview}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FEF9E7] border border-[#FDECD2] space-y-1">
              <span className="font-bold text-[#E68A00]">Phong cách hỏi Socrates:</span>
              <p className="text-slate-600 leading-relaxed">{selectedPersona.socraticStyle}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonaStudio;
