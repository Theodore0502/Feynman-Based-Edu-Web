/**
 * File: src/pages/AnalogyJargonVault.tsx
 * Mục đích: [Trang 9] Analogy & Jargon Vault - Kho lưu trữ các thuật ngữ chuyên ngành đã được người học bình dân hóa thành công cùng các phép ẩn dụ sinh động, đồng bộ trực tiếp với Supabase.
 * Thành phần chính:
 *   - AnalogyJargonVault: Bảng tra cứu, tìm kiếm và xuất kho ẩn dụ cá nhân từ Supabase.
 * Props/Inputs: Không có.
 */

import React, { useState, useEffect } from "react";
import { SupabaseService } from "@/lib/services/supabase-service";
import type { VaultRecord } from "@/types/session.types";
import { Search, Copy, Check, Quote, Database } from "lucide-react";

export const AnalogyJargonVault: React.FC = () => {
  const [items, setItems] = useState<VaultRecord[]>([]);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVault() {
      const data = await SupabaseService.getVaultItems();
      setItems(data);
    }
    fetchVault();
  }, []);

  const filteredItems = items.filter(
    (item) =>
      item.term.toLowerCase().includes(search.toLowerCase()) ||
      item.plainExplanation.toLowerCase().includes(search.toLowerCase()) ||
      item.topic.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5ECFB] text-[#5066A1] text-xs font-bold border border-[#D3E0FA] mb-1">
            <Database className="w-3.5 h-3.5 text-[#7286D3]" />
            <span>Supabase Cloud Vault</span>
          </div>
          <h3 className="text-xl font-black text-slate-800">Kho Ẩn Dụ & Thuật Ngữ (Vault)</h3>
          <p className="text-xs text-slate-500">Tài sản trí tuệ bạn đã đúc kết và vượt qua thẩm định của AI</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm từ vựng, phép ẩn dụ..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#E2EAFD] rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-[#8EA7E9]"
          />
        </div>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-3xl p-5 border border-[#E8EEF8] shadow-subtle space-y-3 hover:border-[#8EA7E9] transition-all group"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#EEF2FC] text-[#5066A1]">
                  {item.topic}
                </span>
                <h4 className="text-base font-extrabold text-slate-800 mt-1">{item.term}</h4>
              </div>
              <button
                onClick={() => handleCopy(item.plainExplanation, item.id)}
                className="p-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-[#7286D3] transition-colors"
                title="Sao chép lời giải thích"
              >
                {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              <b>Giải thích bình dân:</b> {item.plainExplanation}
            </p>

            {item.analogyUsed && (
              <div className="p-3 rounded-2xl bg-[#FEF9E7] border border-[#FDECD2] text-xs space-y-1">
                <div className="flex items-center gap-1 font-bold text-[#E68A00] text-[11px]">
                  <Quote className="w-3 h-3" />
                  <span>Ẩn dụ trực quan:</span>
                </div>
                <p className="text-slate-700 italic">"{item.analogyUsed}"</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalogyJargonVault;
