/**
 * File: src/hooks/useTextToSpeech.ts
 * Purpose: Hook quản lý giọng nói AI (Text-to-Speech) sử dụng Web Speech API native của trình duyệt.
 * Hỗ trợ phát giọng nói tiếng Việt theo thông số pitch/rate riêng của từng Persona AI,
 * tích hợp trạng thái bật/tắt tiếng (Mute/Unmute), tự động đọc câu hỏi và hủy âm thanh khi thu âm.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  PersonaVoiceProfile,
  getPersonaVoiceProfile,
  findBestVietnameseVoice,
  cleanTextForSpeech,
} from "@/config/persona-voice.config";
import { SystemLogger } from "@/lib/services/system-logger";

const STORAGE_TTS_KEY = "theodore_tts_settings_v1";

interface TTSSettingsState {
  isMuted: boolean;
  autoSpeak: boolean;
  selectedVoiceURI?: string;
}

export interface SpeakOptions {
  personaId?: string;
  customAge?: string;
  skepticismLevel?: number;
  pitch?: number;
  rate?: number;
  lang?: string;
  messageId?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

export function useTextToSpeech() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  // Cấu hình lưu trữ LocalStorage
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const stored = localStorage.getItem(STORAGE_TTS_KEY);
      if (stored) {
        const parsed: TTSSettingsState = JSON.parse(stored);
        return Boolean(parsed.isMuted);
      }
    } catch {}
    return false;
  });

  const [autoSpeak, setAutoSpeak] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      const stored = localStorage.getItem(STORAGE_TTS_KEY);
      if (stored) {
        const parsed: TTSSettingsState = JSON.parse(stored);
        return parsed.autoSpeak !== undefined ? Boolean(parsed.autoSpeak) : true;
      }
    } catch {}
    return true;
  });

  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    try {
      const stored = localStorage.getItem(STORAGE_TTS_KEY);
      if (stored) {
        const parsed: TTSSettingsState = JSON.parse(stored);
        return parsed.selectedVoiceURI;
      }
    } catch {}
    return undefined;
  });

  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Đồng bộ cấu hình vào LocalStorage
  const persistSettings = useCallback(
    (newMuted: boolean, newAutoSpeak: boolean, newVoiceURI?: string) => {
      if (typeof window === "undefined") return;
      try {
        const settings: TTSSettingsState = {
          isMuted: newMuted,
          autoSpeak: newAutoSpeak,
          selectedVoiceURI: newVoiceURI,
        };
        localStorage.setItem(STORAGE_TTS_KEY, JSON.stringify(settings));
      } catch {}
    },
    []
  );

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next && typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setSpeakingMessageId(null);
      }
      persistSettings(next, autoSpeak, selectedVoiceURI);
      return next;
    });
  }, [autoSpeak, selectedVoiceURI, persistSettings]);

  const toggleAutoSpeak = useCallback(() => {
    setAutoSpeak((prev) => {
      const next = !prev;
      persistSettings(isMuted, next, selectedVoiceURI);
      return next;
    });
  }, [isMuted, selectedVoiceURI, persistSettings]);

  const handleSelectVoice = useCallback(
    (uri: string) => {
      setSelectedVoiceURI(uri);
      persistSettings(isMuted, autoSpeak, uri);
    },
    [isMuted, autoSpeak, persistSettings]
  );

  // Tải danh sách voice của hệ thống
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    const updateVoices = () => {
      const list = window.speechSynthesis.getVoices();
      if (list && list.length > 0) {
        setVoices(list);
      }
    };

    updateVoices();

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Dừng phát âm thanh ngay lập tức
  const stop = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSpeakingMessageId(null);
    currentUtteranceRef.current = null;
  }, []);

  /**
   * Phát âm thanh cho một đoạn văn bản
   */
  const speak = useCallback(
    (
      text: string,
      optionsOrProfile: SpeakOptions | PersonaVoiceProfile = {},
      messageId?: string
    ) => {
      if (!isSupported || typeof window === "undefined" || !window.speechSynthesis) {
        return;
      }

      // Nếu đang tắt tiếng, bỏ qua
      if (isMuted) {
        return;
      }

      // Hủy lời nói cũ trước khi phát mới
      window.speechSynthesis.cancel();

      const cleaned = cleanTextForSpeech(text);
      if (!cleaned) {
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleaned);

      // Xác định thông số âm thanh từ Persona Profile hoặc options
      let profile: PersonaVoiceProfile | null = null;
      const opts = optionsOrProfile as SpeakOptions;
      if (opts.personaId) {
        profile = getPersonaVoiceProfile(
          opts.personaId,
          opts.customAge,
          opts.skepticismLevel
        );
      }

      const pitch = optionsOrProfile.pitch ?? profile?.pitch ?? 1.0;
      const rate = optionsOrProfile.rate ?? profile?.rate ?? 1.0;
      const lang = (optionsOrProfile as any).lang ?? profile?.lang ?? "vi-VN";
      const targetMessageId = messageId || opts.messageId;

      utterance.pitch = Math.max(0.5, Math.min(2.0, pitch));
      utterance.rate = Math.max(0.5, Math.min(1.8, rate));
      utterance.lang = lang;

      // Chọn voice tiếng Việt
      let targetVoice: SpeechSynthesisVoice | null = null;
      if (selectedVoiceURI) {
        targetVoice = voices.find((v) => v.voiceURI === selectedVoiceURI) || null;
      }
      if (!targetVoice) {
        targetVoice = findBestVietnameseVoice(voices);
      }
      if (targetVoice) {
        utterance.voice = targetVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        if (targetMessageId) {
          setSpeakingMessageId(targetMessageId);
        }
        opts.onStart?.();
        SystemLogger.info(
          "SYSTEM",
          "TTS_SPEAK_START",
          `Bắt đầu phát giọng nói (${profile?.label || "Mặc định"})`,
          {
            text: cleaned.slice(0, 80),
            voiceName: targetVoice?.name,
            pitch,
            rate,
          }
        );
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
        currentUtteranceRef.current = null;
        opts.onEnd?.();
      };

      utterance.onerror = (e) => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
        currentUtteranceRef.current = null;
        opts.onError?.(e);
      };

      currentUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, isMuted, voices, selectedVoiceURI]
  );

  return {
    isSupported,
    isSpeaking,
    speakingMessageId,
    isMuted,
    autoSpeak,
    voices,
    selectedVoiceURI,
    speak,
    stop,
    toggleMute,
    toggleAutoSpeak,
    setSelectedVoiceURI: handleSelectVoice,
  };
}

export default useTextToSpeech;
