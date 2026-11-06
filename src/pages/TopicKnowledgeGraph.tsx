/**
 * File: src/pages/TopicKnowledgeGraph.tsx
 * Mục đích: [Trang 8] Topic & Knowledge Graph - Bản đồ trực quan hóa mạng lưới liên kết giữa các khái niệm mà người học đã thấu suốt.
 * Thành phần chính:
 *   - TopicKnowledgeGraph: Biểu đồ tri thức dạng mạng lưới (Nodes & Edges), lọc theo chuyên ngành.
 * Props/Inputs: Không có.
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { PRESET_TOPICS } from "@/config/topics-presets.config";
import { ArrowRight } from "lucide-react";

export const TopicKnowledgeGraph: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const graphNodes = [
    { id: "docker", label: "Docker & Container", score: 85, category: "IT", x: "20%", y: "30%", color: "#8EA7E9" },
    { id: "k8s", label: "Kubernetes Pods", score: 72, category: "IT", x: "40%", y: "25%", color: "#B5B2E8" },
    { id: "os-kernel", label: "Linux Kernel", score: 90, category: "IT", x: "30%", y: "60%", color: "#76D7C4" },
    { id: "inflation", label: "Lạm Phát & Cung Tiền", score: 88, category: "ECONOMICS", x: "70%", y: "35%", color: "#F79D9D" },
    { id: "interest", label: "Lãi Suất Ngân Hàng", score: 65, category: "ECONOMICS", x: "85%", y: "55%", color: "#F8C471" },
    { id: "mrna", label: "Vaccine mRNA", score: 82, category: "MEDICINE", x: "55%", y: "75%", color: "#76D7C4" },
  ];

  const filteredNodes = selectedCategory === "ALL"
    ? graphNodes
    : graphNodes.filter((n) => n.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-800">Bản Đồ Tri Thức (Knowledge Graph)</h3>
          <p className="text-xs text-slate-500">Mạng lưới các khái niệm bạn đã giải thích thành công</p>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200/80 text-xs">
          {["ALL", "IT", "ECONOMICS", "MEDICINE"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedCategory === cat
                  ? "bg-[#EEF2FC] text-[#5066A1]"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {cat === "ALL" ? "Tất Cả" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Graph Canvas Canvas Card */}
      <div className="relative w-full h-96 bg-white rounded-3xl border border-[#E8EEF8] shadow-subtle overflow-hidden flex items-center justify-center p-6">
        {/* SVG Connective Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
          <line x1="20%" y1="30%" x2="40%" y2="25%" stroke="#8EA7E9" strokeWidth="2" strokeDasharray="4" />
          <line x1="20%" y1="30%" x2="30%" y2="60%" stroke="#76D7C4" strokeWidth="2" />
          <line x1="70%" y1="35%" x2="85%" y2="55%" stroke="#F79D9D" strokeWidth="2" />
          <line x1="40%" y1="25%" x2="55%" y2="75%" stroke="#B5B2E8" strokeWidth="1.5" strokeDasharray="3" />
        </svg>

        {/* Nodes */}
        {filteredNodes.map((node) => (
          <div
            key={node.id}
            style={{ left: node.x, top: node.y }}
            className="absolute -translate-x-1/2 -translate-y-1/2 p-3 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-md hover:scale-110 hover:shadow-xl transition-all cursor-pointer group text-center space-y-1"
          >
            <div className="w-3 h-3 rounded-full mx-auto" style={{ backgroundColor: node.color }} />
            <h5 className="text-xs font-bold text-slate-800">{node.label}</h5>
            <span className="text-[10px] font-extrabold text-[#5066A1] block">
              {node.score}% Thấu suốt
            </span>
          </div>
        ))}
      </div>

      {/* Preset Topics Recommendation */}
      <div className="bg-white rounded-3xl p-6 border border-[#E8EEF8] shadow-subtle space-y-4">
        <h4 className="text-sm font-extrabold text-slate-800">Các Chủ Đề Gợi Ý Mở Rộng Tiếp Theo</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PRESET_TOPICS.map((topic) => (
            <div key={topic.id} className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#E2EAFD] flex items-center justify-between gap-3">
              <div>
                <h5 className="text-xs font-bold text-slate-800">{topic.title}</h5>
                <p className="text-[11px] text-slate-500 line-clamp-1">{topic.description}</p>
              </div>
              <Link
                to="/stage/new"
                className="p-2 rounded-xl bg-white border border-[#D5E1FA] text-[#7286D3] hover:bg-[#EEF2FC] transition-colors shrink-0"
              >
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopicKnowledgeGraph;

