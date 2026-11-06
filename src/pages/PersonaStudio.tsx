/**
 * File: src/pages/PersonaStudio.tsx
 * Mục đích: [Trang 7] Persona Studio - Quản lý, xem chi tiết và tạo mới các nhân vật AI đóng vai người nghe theo phương pháp Feynman.
 * Thành phần chính:
 *   - PersonaStudio: Lưới hiển thị danh sách Persona kế thừa PersonaAvatarCard, xem lăng kính thế giới quan và form tạo mới.
 * Props/Inputs: Không có.
 */

import React, { useState } from "react";
import { DEFAULT_PERSONAS, type PersonaDefinition } from "@/config/personas.config";
import { PersonaAvatarCard } from "@/components/shared/PersonaAvatarCard";
import { Plus } from "lucide-react";

export const PersonaStudio: React.FC = () => {
  const [personas, setPersonas] = useState<PersonaDefinition[]>(DEFAULT_PERSONAS);
  const [selectedPersona, setSelectedPersona] = useState<PersonaDefinition>(DEFAULT_PERSONAS[0]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newWorldview, setNewWorldview] = useState("");

  const handleCreatePersona = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const custom: PersonaDefinition = {
      id: `custom_${Date.now()}`,
      name: newName.trim(),
      title: newTitle.trim() || "Người nghe tự định nghĩa",
      age: "Đa dạng",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
      accentColor: "#B5B2E8",
      bgGradient: "from-[#F5F2FB] to-[#FAF8FD]",
      badgeText: "Persona Tùy Chỉnh",
      description: `Lăng kính đặc thù: ${newWorldview}`,
      worldview: newWorldview || "Hiểu theo đời sống hàng ngày",
      socraticStyle: "Hỏi vặn vẹo theo góc nhìn cá nhân",
      systemPrompt: `Bạn là ${newName}, ${newTitle}. Lăng kính hiểu biết của bạn là: ${newWorldview}. Hãy hỏi lại ngắn gọn khi nghe từ khó.`,
    };

    setPersonas([...personas, custom]);
    setSelectedPersona(custom);
    setShowCreateForm(false);
    setNewName("");
    setNewTitle("");
    setNewWorldview("");
  };

  return (
    <div className="space-y-6">
      {/* Header Studio */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-800">Persona Studio</h3>
          <p className="text-xs text-slate-500">
            Tập hợp các người nghe AI đại diện cho các lăng kính đời sống khác nhau
          </p>
        </div>

        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#7286D3] hover:bg-[#5066A1] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Persona Tùy Biến</span>
        </button>
      </div>

      {/* Form Tạo Mới (Collapsible) */}
      {showCreateForm && (
        <form onSubmit={handleCreatePersona} className="p-6 bg-white rounded-3xl border border-[#E2EAFD] shadow-subtle space-y-4 animate-in fade-in">
          <h4 className="text-sm font-extrabold text-slate-800">Thiết Kế Persona Người Nghe Mới</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tên nhân vật</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ví dụ: Bác tài xe ôm, Đầu bếp trưởng..."
                className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAFD] border border-[#E2EAFD] text-xs focus:outline-none focus:ring-2 focus:ring-[#8EA7E9]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Chức danh / Nghề nghiệp</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ví dụ: Tài xế 50 tuổi, Bác sĩ thú y..."
                className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAFD] border border-[#E2EAFD] text-xs focus:outline-none focus:ring-2 focus:ring-[#8EA7E9]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Lăng kính thế giới quan (Chỉ hiểu qua những thứ gì?)</label>
            <input
              type="text"
              value={newWorldview}
              onChange={(e) => setNewWorldview(e.target.value)}
              placeholder="Ví dụ: Chỉ hiểu qua động cơ xe máy, cờ lê, xăng nhớt và đường sá giao thông..."
              className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAFD] border border-[#E2EAFD] text-xs focus:outline-none focus:ring-2 focus:ring-[#8EA7E9]"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#7286D3] text-white text-xs font-bold"
            >
              Lưu Persona Mới
            </button>
          </div>
        </form>
      )}

      {/* Grid Danh Sách Personas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {personas.map((p) => (
          <PersonaAvatarCard
            key={p.id}
            persona={p}
            variant="full"
            isSelected={selectedPersona.id === p.id}
            onSelect={() => setSelectedPersona(p)}
          />
        ))}
      </div>

      {/* Chi Tiết Persona Đang Chọn */}
      <div className="bg-white rounded-3xl p-6 border border-[#E8EEF8] shadow-subtle space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <img src={selectedPersona.avatar} alt="P" className="w-12 h-12 rounded-2xl object-cover ring-2 ring-[#B5B2E8]" />
          <div>
            <h4 className="text-base font-extrabold text-slate-800">{selectedPersona.name} ({selectedPersona.age})</h4>
            <p className="text-xs text-[#5066A1] font-semibold">{selectedPersona.title}</p>
          </div>
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
    </div>
  );
};

export default PersonaStudio;

