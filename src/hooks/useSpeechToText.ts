/**
 * File: src/hooks/useSpeechToText.ts
 * Mục đích: Hook tích hợp Browser Native Web Speech API (webkitSpeechRecognition) để chuyển giọng nói sang văn bản với độ trễ bằng 0.
 * Thành phần chính:
 *   - useSpeechToText: Quản lý micro, phiên nhận dạng, chuyển đổi văn bản và trạng thái nghe.
 * Props/Inputs: onTranscriptCallback?: (text: string) => void.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

// Định nghĩa giao diện nhận diện giọng nói chuẩn Webkit
interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
    length: number;
  };
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

export function useSpeechToText(onTranscript?: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const windowWithSpeech = window as unknown as {
        webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
        SpeechRecognition?: new () => SpeechRecognitionInstance;
      };

      const SpeechRecognitionClass =
        windowWithSpeech.SpeechRecognition ||
        windowWithSpeech.webkitSpeechRecognition;

      if (!SpeechRecognitionClass) {
        setIsSupported(false);
        return;
      }

      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "vi-VN";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let currentText = "";
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);
        if (onTranscript) {
          onTranscript(currentText);
        }
      };

      recognition.onerror = (event: Event) => {
        setIsListening(false);
        const errorMsg = (event as { error?: string }).error;
        if (errorMsg === "not-allowed") {
          toast.error("Không có quyền truy cập Micro", {
            description: "Vui lòng cho phép quyền truy cập Micro trên trình duyệt để ghi âm.",
          });
        } else if (errorMsg && errorMsg !== "no-speech") {
          toast.error("Lỗi nhận diện giọng nói", {
            description: `Mã lỗi Web Speech: ${errorMsg}`,
          });
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [onTranscript]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        setTranscript("");
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn("Speech recognition start err:", err);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (!isSupported) {
      toast.error("Trình duyệt không hỗ trợ Web Speech API", {
        description: "Vui lòng sử dụng Google Chrome hoặc Edge trên máy tính để thu âm trực tiếp.",
      });
      return;
    }
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isSupported, isListening, startListening, stopListening]);

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript: () => setTranscript(""),
  };
}

