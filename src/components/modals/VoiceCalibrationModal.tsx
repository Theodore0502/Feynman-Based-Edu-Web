/**
 * File: src/components/modals/VoiceCalibrationModal.tsx
 * Mục đích: Popup kiểm tra Micro, độ nhạy âm thanh với đồng hồ đo cường độ thời gian thực (Web Audio API VU Meter)
 * và nhận diện giọng nói tiếng Việt qua Web Speech API trước khi bước lên bục giảng.
 */

import React, { useState, useEffect, useRef } from "react";
import { useModalStore } from "@/hooks/useModalStore";
import { Mic, X, CheckCircle2, Volume2, AlertCircle, Sparkles } from "lucide-react";
import { useSpeechToText } from "@/hooks/useSpeechToText";

export const VoiceCalibrationModal: React.FC = () => {
  const { activeModal, closeModal } = useModalStore();
  const [testText, setTestText] = useState("");
  const { isListening, toggleListening, isSupported } = useSpeechToText((text) => setTestText(text));

  // Trạng thái Web Audio API VU Meter
  const [volumeLevel, setVolumeLevel] = useState<number>(0); // 0 - 100
  const [audioError, setAudioError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const isOpen = activeModal === "VOICE_CALIBRATION";

  useEffect(() => {
    if (!isOpen) {
      stopAudioMonitoring();
      return;
    }

    startAudioMonitoring();

    return () => {
      stopAudioMonitoring();
    };
  }, [isOpen]);

  const startAudioMonitoring = async () => {
    try {
      setAudioError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.6;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        // Chuẩn hóa về thang 0 - 100
        const normalized = Math.min(100, Math.round((average / 128) * 100));
        setVolumeLevel(normalized);

        animFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch (err) {
      console.warn("Không thể truy cập Micro qua Web Audio API:", err);
      setAudioError("Không thể kích hoạt Micro. Vui lòng cấp quyền truy cập thiết bị.");
    }
  };

  const stopAudioMonitoring = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setVolumeLevel(0);
  };

  if (!isOpen) return null;

  // Đánh giá mức độ âm lượng
  const getVolumeStatus = () => {
    if (volumeLevel < 12) {
      return {
        label: "Âm lượng thấp - Hãy nói gần micro hơn hoặc tăng độ nhạy",
        color: "text-amber-600 bg-amber-50 border-amber-200",
      };
    }
    if (volumeLevel <= 75) {
      return {
        label: "Âm lượng hoàn hảo - Giọng nói rõ ràng, đạt chuẩn Feynman",
        color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      };
    }
    return {
      label: "Âm lượng quá lớn - Có thể bị méo hoặc rè âm thanh",
      color: "text-rose-600 bg-rose-50 border-rose-200",
    };
  };

  const status = getVolumeStatus();
  const totalBars = 20;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 border border-[#E2EAFD] shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#EEF2FC] flex items-center justify-center text-[#7286D3]">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Hiệu Chuẩn Micro Giọng Nói</h3>
              <p className="text-xs text-slate-500">Đo lường cường độ âm thanh thời gian thực (Web Audio API)</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-time VU Meter Bar */}
        <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#E2EAFD] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#7286D3]" />
              Cường Độ Âm Lượng Thực Tế
            </span>
            <span className="text-xs font-mono font-bold text-slate-600">{volumeLevel}%</span>
          </div>

          {/* VU Meter Bars */}
          <div className="flex items-center gap-1 h-7 p-1.5 bg-slate-100 rounded-xl">
            {Array.from({ length: totalBars }).map((_, idx) => {
              const barThreshold = ((idx + 1) / totalBars) * 100;
              const isActive = volumeLevel >= barThreshold;
              let barColor = "bg-emerald-400";
              if (idx > 13) barColor = "bg-amber-400";
              if (idx > 17) barColor = "bg-rose-400";

              return (
                <div
                  key={idx}
                  className={`flex-1 h-full rounded-xs transition-all duration-75 ${
                    isActive ? barColor : "bg-slate-200/80"
                  }`}
                />
              );
            })}
          </div>

          {/* Volume Status Alert */}
          {audioError ? (
            <div className="p-2.5 rounded-xl text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{audioError}</span>
            </div>
          ) : (
            <div className={`p-2.5 rounded-xl text-xs font-semibold border flex items-center gap-2 ${status.color}`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{status.label}</span>
            </div>
          )}
        </div>

        {/* Speech Recognition Test Box */}
        <div className="p-5 rounded-2xl bg-[#F8FAFD] border border-[#E2EAFD] text-center space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-1">
            <span>Thử Nghiệm Nhận Diện Giọng Nói</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isListening ? "bg-rose-100 text-rose-600" : "bg-slate-200 text-slate-600"}`}>
              {isListening ? "ĐANG THU ÂM" : "SẴN SÀNG"}
            </span>
          </div>

          <button
            type="button"
            onClick={toggleListening}
            className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center transition-all cursor-pointer shadow-sm ${
              isListening
                ? "bg-[#F79D9D] text-white animate-pulse ring-4 ring-rose-200"
                : "bg-[#7286D3] text-white hover:bg-[#5066A1]"
            }`}
          >
            <Mic className="w-6 h-6" />
          </button>

          <p className="text-xs text-slate-600">
            {isListening
              ? "Đang lắng nghe... Hãy thử giảng giải 1 câu tiếng Việt ngắn!"
              : "Nhấn nút micro ở trên để bắt đầu thử giọng"}
          </p>

          <div className="min-h-16 p-3 rounded-xl bg-white border border-slate-200 text-left text-xs text-slate-700">
            {testText || (
              <span className="text-slate-400 italic">
                Lời nói thử nghiệm của bạn sẽ xuất hiện tại đây...
              </span>
            )}
          </div>
        </div>

        {/* Web Speech API Support Badge */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Web Speech API Tiếng Việt: {isSupported ? "Khả dụng" : "Không hỗ trợ"}</span>
          </div>
          <span className="text-[11px] text-slate-400">Trình duyệt Chrome khuyến nghị</span>
        </div>

        {/* Action Button */}
        <button
          onClick={closeModal}
          className="w-full py-2.5 rounded-2xl bg-[#7286D3] text-white font-bold text-xs shadow-xs hover:bg-[#5066A1] transition-colors cursor-pointer"
        >
          Đã Chuẩn Bị Xong Micro
        </button>
      </div>
    </div>
  );
};
