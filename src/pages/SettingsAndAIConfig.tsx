/**
 * File: src/pages/SettingsAndAIConfig.tsx
 * Mục đích: [Trang 10] Settings & AI Config - Cấu hình mô hình AI, khóa API, tham số nhiệt độ phân tích và giọng nói Web Speech.
 * Thành phần chính:
 *   - SettingsAndAIConfig: Quản lý thiết lập hệ thống, kiểm tra kết nối API và hồ sơ học viên.
 * Props/Inputs: Không có.
 */

import React, { useState } from "react";
import { Cpu, Mic, Volume2, ShieldCheck, CheckCircle2, Save, Play, Square, Sparkles } from "lucide-react";
import { useModalStore } from "@/hooks/useModalStore";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";

export const SettingsAndAIConfig: React.FC = () => {
  const { openModal } = useModalStore();
  const [model, setModel] = useState("gemini-1.5-flash");
  const [provider, setProvider] = useState("gemini");
  const [temp, setTemp] = useState(0.2);
  const [saved, setSaved] = useState(false);

  // Text-to-Speech Web Speech API
  const {
    isSupported: isTtsSupported,
    isSpeaking,
    autoSpeak,
    isMuted,
    voices,
    selectedVoiceURI,
    speak,
    stop: stopSpeaking,
    toggleAutoSpeak,
    toggleMute,
    setSelectedVoiceURI,
  } = useTextToSpeech();

  const handleTestSpeech = (sampleText: string, pitch = 1.0, rate = 1.0) => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }
    speak(sampleText, { pitch, rate }, "test-sample-voice");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const vietnameseVoices = voices.filter((v) => v.lang.toLowerCase().startsWith("vi"));
  const otherVoices = voices.filter((v) => !v.lang.toLowerCase().startsWith("vi"));

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
            <h4 className="text-sm font-extrabold text-slate-800">Thiết Lập Nhận Diện Giọng Nói (Speech-to-Text)</h4>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800">Trình nhận dạng Web Speech API (W3C Standard)</p>
              <p className="text-[11px] text-slate-500">Thu âm giọng nói người học, tự động phiên âm sang văn bản với độ trễ 0ms</p>
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

        {/* 3. Text-to-Speech (TTS) Voice Synthesis */}
        <div className="bg-white rounded-3xl p-6 border border-[#E8EEF8] shadow-subtle space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-[#7286D3]" />
              <div>
                <h4 className="text-sm font-extrabold text-slate-800">Thiết Lập Giọng Nói AI (Text-to-Speech)</h4>
                <p className="text-[11px] text-slate-400">Tự động phát giọng nói phản biện bằng tiếng Việt cho các Khán giả AI</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                  isTtsSupported
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                {isTtsSupported ? "Trình duyệt hỗ trợ Web Speech TTS" : "Không hỗ trợ SpeechSynthesis"}
              </span>
            </div>
          </div>

          {/* Chọn giọng đọc ưu tiên */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Giọng đọc hệ thống ưu tiên (Ưu tiên tiếng Việt vi-VN)
            </label>
            <select
              value={selectedVoiceURI || ""}
              onChange={(e) => setSelectedVoiceURI(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F8FAFD] border border-[#E2EAFD] text-xs font-medium focus:outline-none"
            >
              <option value="">Tự động chọn giọng tiếng Việt tối ưu nhất</option>
              {vietnameseVoices.length > 0 && (
                <optgroup label="Giọng tiếng Việt phát hiện được">
                  {vietnameseVoices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      🇻🇳 {v.name} ({v.lang}) {v.localService ? "• Cục bộ" : "• Trực tuyến"}
                    </option>
                  ))}
                </optgroup>
              )}
              {otherVoices.length > 0 && (
                <optgroup label="Các giọng đọc ngôn ngữ khác">
                  {otherVoices.slice(0, 15).map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <p className="text-[11px] text-slate-400">
              Hệ thống sẽ tự động ghép nối giọng đọc tiếng Việt chuẩn (Google Tiếng Việt / Microsoft HoaiMy / An) khi có sẵn.
            </p>
          </div>

          {/* Công tắc Auto-Speak & Mute */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="p-3.5 rounded-2xl bg-[#F8FAFD] border border-[#E2EAFD] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">Tự động phát giọng nói (Auto-Speak)</p>
                <p className="text-[11px] text-slate-500">Phát âm ngay khi Khán giả AI phản hồi</p>
              </div>
              <button
                type="button"
                onClick={toggleAutoSpeak}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  autoSpeak ? "bg-[#7286D3]" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoSpeak ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8FAFD] border border-[#E2EAFD] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">Tắt âm thanh toàn hệ thống (Mute)</p>
                <p className="text-[11px] text-slate-500">Chỉ đọc phản hồi bằng văn bản</p>
              </div>
              <button
                type="button"
                onClick={toggleMute}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  isMuted ? "bg-rose-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isMuted ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Thử nghiệm phát âm thanh các Persona mẫu */}
          <div className="space-y-2 pt-2">
            <span className="block text-xs font-bold text-slate-700">Nghe thử giọng mẫu của từng Khán giả AI:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() =>
                  handleTestSpeech(
                    "Dạ chào cô chú! Con là Bé Bắp 10 tuổi nè. Con thích chơi xếp hình Lego lắm ạ!",
                    1.45,
                    1.05
                  )
                }
                className="p-3 rounded-2xl border border-rose-200 bg-rose-50/60 hover:bg-rose-50 text-left transition-colors cursor-pointer flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-extrabold text-rose-800 block">Bé Bắp (10 tuổi)</span>
                  <span className="text-[10px] text-rose-600">Cao độ: 1.45x • Tốc độ: 1.05x (Trẻ thơ, tò mò)</span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-white shadow-2xs flex items-center justify-center text-rose-700">
                  {isSpeaking ? <Square className="w-4 h-4 fill-rose-600" /> : <Play className="w-4 h-4 fill-rose-600" />}
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleTestSpeech(
                    "Chào em, chị là Mai bên phòng nhân sự. Em có thể giải thích vấn đề này theo quy trình làm việc được không?",
                    1.08,
                    1.0
                  )
                }
                className="p-3 rounded-2xl border border-blue-200 bg-blue-50/60 hover:bg-blue-50 text-left transition-colors cursor-pointer flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-extrabold text-blue-800 block">Chị Mai (Nhân sự)</span>
                  <span className="text-[10px] text-blue-600">Cao độ: 1.08x • Tốc độ: 1.0x (Công sở, lịch thiệp)</span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-white shadow-2xs flex items-center justify-center text-blue-700">
                  {isSpeaking ? <Square className="w-4 h-4 fill-blue-600" /> : <Play className="w-4 h-4 fill-blue-600" />}
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleTestSpeech(
                    "Chào cháu, bác Năm nông dân đây. Mấy cái thuật ngữ này nghe lạ quá, cháu ví von như chuyện trồng lúa được không?",
                    0.78,
                    0.85
                  )
                }
                className="p-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50 text-left transition-colors cursor-pointer flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-extrabold text-emerald-800 block">Bác Năm (Nông dân)</span>
                  <span className="text-[10px] text-emerald-600">Cao độ: 0.78x • Tốc độ: 0.85x (Trầm ấm, từ tốn)</span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-white shadow-2xs flex items-center justify-center text-emerald-700">
                  {isSpeaking ? <Square className="w-4 h-4 fill-emerald-600" /> : <Play className="w-4 h-4 fill-emerald-600" />}
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleTestSpeech(
                    "Chào bạn, tôi là Tuấn. Tôi muốn biết mô hình này mang lại giá trị cốt lõi gì và tính khả thi ra sao?",
                    0.92,
                    1.12
                  )
                }
                className="p-3 rounded-2xl border border-amber-200 bg-amber-50/60 hover:bg-amber-50 text-left transition-colors cursor-pointer flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-extrabold text-amber-800 block">Shark Tuấn (Nhà đầu tư)</span>
                  <span className="text-[10px] text-amber-600">Cao độ: 0.92x • Tốc độ: 1.12x (Sắc sảo, dứt khoát)</span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-white shadow-2xs flex items-center justify-center text-amber-700">
                  {isSpeaking ? <Square className="w-4 h-4 fill-amber-600" /> : <Play className="w-4 h-4 fill-amber-600" />}
                </div>
              </button>
            </div>
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

