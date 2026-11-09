/**
 * File: src/pages/admin/AdminAISettings.tsx
 * Mục đích: Giao diện Quản trị Cài Đặt AI & Tinh Chỉnh System Prompts (AI Prompts & Model Settings Studio).
 * Thiết kế công thái học Master-Detail:
 *   - Danh sách prompt & bộ lọc bên trái (Master List).
 *   - Trình tinh chỉnh tham số (Model, Temperature, Max Tokens) và Textarea System Prompt bên phải (Editor Desk).
 *   - Tối giản thao tác, không cần cuộn trang lên xuống dài dặc, lưu trữ tức thì và khôi phục từ bản backup 1-click.
 */

import React, { useState } from "react";
import { useAISettingsStore } from "@/hooks/useAISettingsStore";
import { AIPromptConfig, PromptCategory, AIModelType } from "@/types/ai-config.types";
import { toast } from "sonner";
import {
  Bot,
  Search,
  Sparkles,
  Sliders,
  RotateCcw,
  Save,
  CheckCircle2,
  Cpu,
  Layers,
  HelpCircle,
  Plus,
  Trash2,
  Play,
  Copy,
  ChevronRight,
  ShieldCheck,
  Zap,
  Info,
} from "lucide-react";

const CATEGORY_TABS: { key: string; label: string; icon: string }[] = [
  { key: "ALL", label: "Tất Cả", icon: "Layers" },
  { key: "PERSONA", label: "Khán Giả Persona", icon: "Users" },
  { key: "EVALUATOR", label: "Bộ Chấm Điểm", icon: "ShieldCheck" },
  { key: "SOCRATIC", label: "Phản Biện Socratic", icon: "Zap" },
];

const AVAILABLE_MODELS: { value: AIModelType; label: string; tag: string }[] = [
  { value: "gemini-1.5-flash", label: "Google Gemini 1.5 Flash", tag: "Nhanh & Tối ưu chi phí" },
  { value: "gemini-1.5-pro", label: "Google Gemini 1.5 Pro", tag: "Tư duy sâu & Logic phức tạp" },
  { value: "gpt-4o-mini", label: "OpenAI GPT-4o Mini", tag: "Phản hồi tốc độ cao" },
  { value: "gpt-4o", label: "OpenAI GPT-4o", tag: "Đa năng & Chuẩn xác" },
  { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet", tag: "Văn phong tự nhiên" },
];

const HELPER_VARIABLES = [
  { tag: "{{topic}}", desc: "Tên chủ đề học thuật" },
  { tag: "{{persona_name}}", desc: "Tên nhân vật người nghe" },
  { tag: "{{persona_title}}", desc: "Danh xưng / Nghề nghiệp" },
  { tag: "{{persona_age}}", desc: "Độ tuổi nhân vật" },
  { tag: "{{unexplained_jargons}}", desc: "Danh sách thuật ngữ chưa giải thích" },
  { tag: "{{logic_gaps}}", desc: "Lỗ hổng logic đã phát hiện" },
];

export const AdminAISettings: React.FC = () => {
  const {
    prompts,
    selectedPromptId,
    searchQuery,
    activeCategory,
    setSelectedPromptId,
    setSearchQuery,
    setActiveCategory,
    updatePrompt,
    updateParameters,
    resetToBackup,
    resetSinglePrompt,
    addNewPrompt,
    deletePrompt,
  } = useAISettingsStore();

  const [activeTab, setActiveTab] = useState<string>("PROMPT");
  const [testInput, setTestInput] = useState<string>("");
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Active prompt
  const activePrompt =
    prompts.find((p) => p.id === selectedPromptId) || prompts[0];

  // Local draft state for active prompt to allow instant editing without lag
  const [draftSystemPrompt, setDraftSystemPrompt] = useState(
    activePrompt?.system_prompt || ""
  );
  const [draftTitle, setDraftTitle] = useState(activePrompt?.title || "");
  const [draftDesc, setDraftDesc] = useState(activePrompt?.description || "");

  // Sync draft when switching prompt
  const handleSelectPrompt = (prompt: AIPromptConfig) => {
    setSelectedPromptId(prompt.id);
    setDraftSystemPrompt(prompt.system_prompt);
    setDraftTitle(prompt.title);
    setDraftDesc(prompt.description);
    setTestOutput(null);
  };

  // Filtered prompt list
  const filteredPrompts = prompts.filter((p) => {
    const matchCategory =
      activeCategory === "ALL" || p.category === activeCategory;
    const matchQuery =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.prompt_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchQuery;
  });

  // Save current active prompt
  const handleSaveActivePrompt = () => {
    if (!activePrompt) return;
    updatePrompt(activePrompt.id, {
      title: draftTitle,
      description: draftDesc,
      system_prompt: draftSystemPrompt,
    });
    toast.success(`Đã lưu cấu hình AI: "${draftTitle}"`, {
      description: `Phiên bản v${activePrompt.version + 1} đã được cập nhật vào Database & LocalStorage.`,
    });
  };

  // Reset single prompt to local backup
  const handleResetSingle = () => {
    if (!activePrompt) return;
    resetSinglePrompt(activePrompt.id);
    const backupItem = prompts.find((p) => p.id === activePrompt.id);
    if (backupItem) {
      setDraftSystemPrompt(backupItem.system_prompt);
      setDraftTitle(backupItem.title);
      setDraftDesc(backupItem.description);
    }
    toast.info(`Đã khôi phục prompt "${activePrompt.title}" về bản gốc.`, {
      description: "Dữ liệu được lấy từ file backup chuẩn cục bộ.",
    });
  };

  // Reset all prompts to backup
  const handleResetAllToBackup = () => {
    if (
      window.confirm(
        "Bạn có chắc muốn khôi phục toàn bộ System Prompts và Model Settings về bản mặc định gốc từ src/data/prompts-backup.json?"
      )
    ) {
      resetToBackup();
      toast.success("Đã khôi phục toàn bộ cài đặt AI về mặc định!", {
        description: "Toàn bộ 8 System Prompts đã được đưa về trạng thái chuẩn mực ban đầu.",
      });
    }
  };

  // Insert variable tag into prompt textarea
  const handleInsertTag = (tag: string) => {
    setDraftSystemPrompt((prev) => prev + " " + tag + " ");
    toast.info(`Đã chèn biến ${tag} vào prompt.`);
  };

  // Simulate prompt run
  const handleRunTest = () => {
    if (!testInput.trim()) {
      toast.warning("Vui lòng nhập câu nói thử nghiệm để kiểm tra phản ứng của AI.");
      return;
    }
    setIsSimulating(true);
    setTestOutput(null);
    setTimeout(() => {
      setIsSimulating(false);
      if (activePrompt.category === "PERSONA") {
        setTestOutput(
          `[Mô phỏng ${activePrompt.title} - Nhiệt độ ${activePrompt.parameters.temperature}]:\n"Ủa chú ơi, 'cái chùm dây mạng' này nghe lạ tai quá, nó có giống như đường ống dẫn nước vào các căn hộ chung cư không ạ?"`
        );
      } else if (activePrompt.category === "EVALUATOR") {
        setTestOutput(
          JSON.stringify(
            {
              currentClarityScore: 82,
              jargonDetected: [
                { term: "Docker Container", isExplainedSimply: true, reason: "Đã ví như phòng trọ đóng gói sẵn" },
                { term: "Linux Namespace", isExplainedSimply: false, reason: "Chưa giải thích cơ chế cô lập" },
              ],
              logicGaps: [
                { claim: "Chạy độc lập", missingLink: "Chưa nêu rõ nhân Linux cô lập process như thế nào" }
              ],
              isReadyToComplete: false,
            },
            null,
            2
          )
        );
      } else {
        setTestOutput(
          `[Mô phỏng Socratic Probe]:\n"Nếu máy chủ mất điện đột ngột trong khi container đang ghi dữ liệu, cơ chế nào ngăn chặn việc hỏng tệp tin hệ thống?"`
        );
      }
      toast.success("Mô phỏng thành công!");
    }, 600);
  };

  return (
    <div className="space-y-4 w-full">
      {/* 1. Header Bar: Cài Đặt AI & Quick Actions */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
                Cài Đặt AI & Tinh Chỉnh System Prompts
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-100 text-purple-700">
                {prompts.length} Cấu hình
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Điều chỉnh mô hình LLM, nhiệt độ sáng tạo và chỉ dẫn tâm lý cho từng nhân vật Persona & Bộ máy chấm điểm.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <button
            onClick={() => {
              const newId = addNewPrompt("PERSONA");
              const created = prompts.find((p) => p.id === newId);
              if (created) handleSelectPrompt(created);
              toast.success("Đã tạo prompt tùy chỉnh mới.");
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Thêm Prompt
          </button>
          <button
            onClick={handleResetAllToBackup}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-bold transition-all border border-slate-200/80 cursor-pointer"
            title="Khôi phục toàn bộ về bản backup gốc"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Khôi Phục Gốc
          </button>
        </div>
      </div>

      {/* 2. Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 w-full sm:w-auto scrollbar-none">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveCategory(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === tab.key
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên prompt hoặc model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs"
          />
        </div>
      </div>

      {/* 3. Ergonomic Split Panel: Master List Left + Editor Desk Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Master List of Prompts */}
        <div className="lg:col-span-4 space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
          {filteredPrompts.map((prompt) => {
            const isSelected = prompt.id === activePrompt?.id;
            return (
              <div
                key={prompt.id}
                onClick={() => handleSelectPrompt(prompt)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                  isSelected
                    ? "bg-purple-50/70 border-purple-400 shadow-sm ring-1 ring-purple-400/40"
                    : "bg-white border-slate-200 hover:border-purple-200 hover:bg-slate-50/60 shadow-xs"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="font-bold text-xs text-slate-800 line-clamp-1">
                    {prompt.title}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-black shrink-0 ${
                      prompt.category === "PERSONA"
                        ? "bg-blue-100 text-blue-700"
                        : prompt.category === "EVALUATOR"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {prompt.category}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 line-clamp-2 mb-2 leading-relaxed">
                  {prompt.description}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 font-medium text-slate-600">
                    <Cpu className="w-3 h-3 text-purple-600" />
                    <span>{prompt.parameters.model}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                      T={prompt.parameters.temperature}
                    </span>
                    <span className="text-purple-600 font-bold">v{prompt.version}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredPrompts.length === 0 && (
            <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-slate-200">
              <Bot className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">Không tìm thấy prompt phù hợp</p>
            </div>
          )}
        </div>

        {/* Right Column: Editor & Tuning Desk */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-5">
          {activePrompt ? (
            <>
              {/* Header of Active Prompt */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      className="text-base font-black text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-purple-500 focus:outline-none transition-all px-1 -ml-1 rounded"
                    />
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                      {activePrompt.prompt_key}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={draftDesc}
                    onChange={(e) => setDraftDesc(e.target.value)}
                    placeholder="Mô tả mục tiêu của prompt này..."
                    className="w-full text-xs text-slate-500 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-purple-500 focus:outline-none transition-all px-1 -ml-1 rounded"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetSingle}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                    title="Khôi phục prompt này về giá trị gốc trong prompts-backup.json"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Gốc
                  </button>
                  <button
                    onClick={handleSaveActivePrompt}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Lưu Cấu Hình
                  </button>
                </div>
              </div>

              {/* Parameter Controls: Compact 4-Column Grid */}
              <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-purple-600" />
                    Thông Số Suy Luận AI (Inference Hyperparameters)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Cập nhật thời gian thực vào động cơ LLM
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {/* 1. Model Selector */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 block">
                      Mô hình LLM
                    </label>
                    <select
                      value={activePrompt.parameters.model}
                      onChange={(e) =>
                        updateParameters(activePrompt.id, {
                          model: e.target.value as AIModelType,
                        })
                      }
                      className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    >
                      {AVAILABLE_MODELS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Temperature Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-600">
                      <span>Nhiệt độ (Temp)</span>
                      <span className="font-mono text-purple-600">
                        {activePrompt.parameters.temperature}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={activePrompt.parameters.temperature}
                      onChange={(e) =>
                        updateParameters(activePrompt.id, {
                          temperature: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400">
                      <span>Chính xác (0.0)</span>
                      <span>Sáng tạo (1.0)</span>
                    </div>
                  </div>

                  {/* 3. Max Tokens */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-600">
                      <span>Max Tokens</span>
                      <span className="font-mono text-purple-600">
                        {activePrompt.parameters.max_tokens}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="256"
                      max="4096"
                      step="128"
                      value={activePrompt.parameters.max_tokens}
                      onChange={(e) =>
                        updateParameters(activePrompt.id, {
                          max_tokens: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400">
                      <span>256</span>
                      <span>4096</span>
                    </div>
                  </div>

                  {/* 4. Top P or Skepticism Level */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-600">
                      <span>Độ Vặn Vẹo / Hoài Nghi</span>
                      <span className="font-mono text-purple-600">
                        {activePrompt.parameters.skepticism_level || 5}/10
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={activePrompt.parameters.skepticism_level || 5}
                      onChange={(e) =>
                        updateParameters(activePrompt.id, {
                          skepticism_level: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400">
                      <span>Dễ tính (1)</span>
                      <span>Bắt bẻ gắt (10)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-Tabs: Editor vs Simulator */}
              <div className="flex items-center justify-between border-b border-slate-200">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActiveTab("PROMPT")}
                    className={`pb-2 text-xs font-bold cursor-pointer border-b-2 transition-all ${
                      activeTab === "PROMPT"
                        ? "border-purple-600 text-purple-600"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Nội Dung System Prompt
                  </button>
                  <button
                    onClick={() => setActiveTab("TEST")}
                    className={`pb-2 text-xs font-bold cursor-pointer border-b-2 transition-all flex items-center gap-1.5 ${
                      activeTab === "TEST"
                        ? "border-purple-600 text-purple-600"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 text-purple-600" />
                    Thử Nghiệm Phản Hồi (Simulator)
                  </button>
                </div>

                {activeTab === "PROMPT" && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 pb-1">
                    <span className="font-medium">Chèn biến động:</span>
                    {HELPER_VARIABLES.map((v) => (
                      <button
                        key={v.tag}
                        onClick={() => handleInsertTag(v.tag)}
                        title={v.desc}
                        className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-slate-600 font-mono text-[10px] font-bold transition-all cursor-pointer"
                      >
                        {v.tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Tab 1: System Prompt Textarea */}
              {activeTab === "PROMPT" ? (
                <div className="space-y-2">
                  <div className="relative">
                    <textarea
                      rows={14}
                      value={draftSystemPrompt}
                      onChange={(e) => setDraftSystemPrompt(e.target.value)}
                      placeholder="Nhập nội dung System Prompt điều hướng hành vi của AI..."
                      className="w-full p-4 rounded-xl font-mono text-xs text-slate-800 bg-slate-900 text-slate-100 leading-relaxed border border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 selection:bg-purple-500/30"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Prompt này được nạp vào system instruction của LLM khi khởi tạo phiên học.
                      </span>
                    </div>
                    <span className="font-mono">
                      {draftSystemPrompt.length} ký tự
                    </span>
                  </div>
                </div>
              ) : (
                /* Tab 2: Interactive Prompt Simulator */
                <div className="space-y-3 bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Câu nói giảng giải thử nghiệm của học viên:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="VD: Docker giống như một căn phòng trọ đầy đủ tiện nghi đóng gói sẵn mang đi đâu cũng được..."
                        value={testInput}
                        onChange={(e) => setTestInput(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                        onKeyDown={(e) => e.key === "Enter" && handleRunTest()}
                      />
                      <button
                        onClick={handleRunTest}
                        disabled={isSimulating}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        {isSimulating ? (
                          <Sparkles className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                        Chạy Thử
                      </button>
                    </div>
                  </div>

                  {testOutput && (
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-600">
                          Kết quả suy luận thử nghiệm:
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(testOutput);
                            toast.info("Đã sao chép kết quả!");
                          }}
                          className="text-[11px] text-purple-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" /> Sao chép
                        </button>
                      </div>
                      <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                        {testOutput}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center text-slate-400">
              <Bot className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-medium">Chọn một prompt từ danh sách bên trái để chỉnh sửa</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

