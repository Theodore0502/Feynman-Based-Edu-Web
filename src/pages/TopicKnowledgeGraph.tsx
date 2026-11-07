/**
 * File: src/pages/TopicKnowledgeGraph.tsx
 * Mục đích: [Trang 8] Bản Đồ Tri Thức (Topic & Knowledge Graph) trực quan hóa mạng lưới liên kết giữa Toán Cao Cấp, Toán Rời Rạc, Thị Giác Máy Tính và Khoa Học Máy Tính.
 * Thành phần chính:
 *   - TopicKnowledgeGraph: Canvas đồ thị tương tác dạng mạng nhện (SVG Nodes & Edges).
 *   - Bộ lọc theo ngành: Toán cao cấp, Toán rời rạc, Thị giác máy tính, KHMT.
 *   - Slide-over Topic Detail Drawer: Xem nhanh Ground Truth, yêu cầu tiên quyết, nút sang Study Lab và Stage.
 * Props/Inputs: Không có.
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GRAPH_NODES, GRAPH_EDGES } from "@/data/knowledge-graph.data";
import { DOMAINS_CATALOG, TOPICS_CATALOG } from "@/data/academic-catalog.data";
import { useStudyStore } from "@/hooks/useStudyStore";
import type { GraphNode } from "@/types/catalog.types";
import {
  ArrowRight,
  BookOpen,
  Sparkles,
  Layers,
  X,
  CheckCircle2,
  ExternalLink,
  Info,
} from "lucide-react";

export const TopicKnowledgeGraph: React.FC = () => {
  const navigate = useNavigate();
  const { selectTopic } = useStudyStore();
  const [selectedDomain, setSelectedDomain] = useState<string>("ALL");
  const [activeNode, setActiveNode] = useState<GraphNode | null>(null);

  const filteredNodes =
    selectedDomain === "ALL"
      ? GRAPH_NODES
      : GRAPH_NODES.filter((n) => n.domainId === selectedDomain);

  // Lấy chi tiết bài học tương ứng của node đang chọn
  const activeTopicDetail = activeNode
    ? TOPICS_CATALOG.find((t) => t.id === activeNode.topicId)
    : null;

  const handleStudyTopic = (topicId: string) => {
    selectTopic(topicId);
    navigate(`/study?topicId=${topicId}`);
  };

  const handleTeachTopic = (topicTitle: string) => {
    navigate(`/stage/new?topic=${encodeURIComponent(topicTitle)}`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header & Domain Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5ECFB] text-[#5066A1] text-xs font-bold border border-[#D3E0FA] mb-1">
            <Layers className="w-3.5 h-3.5 text-[#7286D3]" />
            <span>Mạng Lưới Tri Thức Đa Chiều</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800">
            Bản Đồ Tri Thức Toán Học & Khoa Học Máy Tính
          </h2>
          <p className="text-xs text-slate-500">
            Trực quan hóa lộ trình tiên quyết từ Toán cao cấp, Toán rời rạc đến Thị giác máy tính và Hệ thống.
          </p>
        </div>

        {/* Domain Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200/80 text-xs">
          <button
            onClick={() => setSelectedDomain("ALL")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              selectedDomain === "ALL"
                ? "bg-[#7286D3] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Tất Cả Ngành
          </button>
          {DOMAINS_CATALOG.map((domain) => (
            <button
              key={domain.id}
              onClick={() => setSelectedDomain(domain.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedDomain === domain.id
                  ? "bg-[#7286D3] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {domain.name}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Interactive SVG Graph Canvas */}
      <div className="relative w-full h-[520px] bg-gradient-to-br from-white via-[#F8FAFD] to-[#F1F4FA] rounded-3xl border border-[#E8EEF8] shadow-sm overflow-hidden p-6 select-none">
        {/* Graph Legend */}
        <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200/80 text-[11px] space-y-1 shadow-2xs">
          <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider">
            Quan hệ đường nối:
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-600">
              <span className="w-3 h-0.5 bg-[#7286D3] inline-block" /> Tiên quyết
            </span>
            <span className="flex items-center gap-1 text-slate-600">
              <span className="w-3 h-0.5 border-b border-dashed border-[#E07A5F] inline-block" /> Bao hàm
            </span>
            <span className="flex items-center gap-1 text-slate-600">
              <span className="w-3 h-0.5 border-b border-dotted border-slate-400 inline-block" /> Liên quan
            </span>
          </div>
        </div>

        {/* SVG Connective Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="16"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#8EA7E9" />
            </marker>
          </defs>

          {GRAPH_EDGES.map((edge) => {
            const sourceNode = GRAPH_NODES.find((n) => n.id === edge.source);
            const targetNode = GRAPH_NODES.find((n) => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            return (
              <g key={edge.id}>
                <line
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke={edge.relationType === "PREREQUISITE" ? "#7286D3" : "#E07A5F"}
                  strokeWidth={edge.relationType === "PREREQUISITE" ? 2 : 1.5}
                  strokeDasharray={
                    edge.relationType === "SUB_CONCEPT"
                      ? "4"
                      : edge.relationType === "RELATED"
                      ? "2"
                      : undefined
                  }
                  opacity={0.4}
                />
              </g>
            );
          })}
        </svg>

        {/* Topic Nodes */}
        {filteredNodes.map((node) => {
          const isSelected = activeNode?.id === node.id;
          return (
            <div
              key={node.id}
              onClick={() => setActiveNode(node)}
              style={{ left: node.x, top: node.y }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 p-3.5 rounded-2xl border transition-all cursor-pointer group text-center space-y-1 ${
                isSelected
                  ? "bg-white shadow-xl scale-110 border-[#7286D3] ring-4 ring-[#7286D3]/20 z-20"
                  : "bg-white/95 backdrop-blur-md shadow-md hover:scale-105 hover:shadow-lg border-slate-200 z-10"
              }`}
            >
              <div
                className="w-3.5 h-3.5 rounded-full mx-auto shadow-2xs group-hover:scale-125 transition-transform"
                style={{ backgroundColor: node.color }}
              />
              <h5 className="text-xs font-black text-slate-800 whitespace-nowrap">
                {node.label}
              </h5>
              <div className="flex items-center justify-center gap-1">
                <span className="text-[10px] font-black text-[#7286D3]">
                  {node.score}% Thấu suốt
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Node Inspector Drawer (Shows when a node is clicked) */}
      {activeNode && activeTopicDetail && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#7286D3]/30 shadow-md animate-in slide-in-from-bottom duration-200 space-y-4">
          <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-[#EEF2FC] text-[#5066A1]">
                  {activeTopicDetail.domainName}
                </span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-lg">
                  {activeNode.score}% Độ thấu suốt
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-800 mt-1">
                {activeTopicDetail.title}
              </h3>
            </div>

            <button
              onClick={() => setActiveNode(null)}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Ground Truth Summary */}
            <div className="md:col-span-2 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Định nghĩa chuẩn (Ground Truth)
              </span>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                "{activeTopicDetail.summary}"
              </p>

              {/* Required Concepts */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Các luận điểm cốt lõi cần nắm:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeTopicDetail.requiredConcepts.map((concept, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col justify-center gap-2.5 bg-[#F8FAFD] p-4 rounded-2xl border border-[#E8EEF8]">
              <span className="text-xs font-bold text-slate-700">Thao tác tiếp theo:</span>
              <button
                onClick={() => handleStudyTopic(activeTopicDetail.id)}
                className="w-full py-2.5 px-4 rounded-xl bg-white border border-[#D5E1FA] text-[#7286D3] hover:bg-[#EEF2FC] text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>1. Soạn Bài Giảng</span>
              </button>

              <button
                onClick={() => handleTeachTopic(activeTopicDetail.title)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#7286D3] text-white hover:bg-[#5E72C4] text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>2. Lên Bục Giảng Cho AI</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Subject Catalog Quick Grid */}
      <div className="bg-white rounded-3xl p-6 border border-[#E8EEF8] shadow-xs space-y-4">
        <h4 className="text-sm font-extrabold text-slate-800">
          Danh Mục Các Môn Trọng Tâm ({TOPICS_CATALOG.length} Bài Học Chuẩn)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TOPICS_CATALOG.map((topic) => (
            <div
              key={topic.id}
              className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#E2EAFD] flex flex-col justify-between gap-3 hover:border-[#8EA7E9] transition-all group"
            >
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#EEF2FC] text-[#5066A1]">
                  {topic.domainName}
                </span>
                <h5 className="text-xs font-extrabold text-slate-800 mt-1 line-clamp-1">
                  {topic.title}
                </h5>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                  {topic.summary}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                <button
                  onClick={() => handleStudyTopic(topic.id)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#D5E1FA] text-[#7286D3] hover:bg-[#EEF2FC] text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>Soạn bài</span>
                </button>
                <button
                  onClick={() => handleTeachTopic(topic.title)}
                  className="px-3 py-1.5 rounded-xl bg-[#7286D3] text-white hover:bg-[#5E72C4] text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Giảng</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopicKnowledgeGraph;
