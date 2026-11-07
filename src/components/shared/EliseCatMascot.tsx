/**
 * File: src/components/shared/EliseCatMascot.tsx
 * Mục đích: Biểu tượng Linh Vật Mèo Thông Thái (Elise Mascot Cat) chuẩn vector SVG sắc nét, đáng yêu.
 * Đại diện cho tính tò mò, lanh lợi và triết lý học sâu của Elise.
 */

import React from "react";

interface EliseCatMascotProps {
  className?: string;
  size?: number;
}

export const EliseCatMascot: React.FC<EliseCatMascotProps> = ({
  className = "w-6 h-6",
  size,
}) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      {/* Background Glow / Shadow */}
      <circle cx="50" cy="50" r="46" fill="url(#catGradient)" />

      {/* Cat Ears */}
      {/* Left Outer Ear */}
      <path
        d="M22 38L30 14C32 9 40 15 44 24"
        fill="#FFFFFF"
        stroke="#475569"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Left Inner Ear (Pink) */}
      <path d="M26 34L32 18C33 16 38 19 40 25" fill="#FFA5BA" opacity="0.9" />

      {/* Right Outer Ear */}
      <path
        d="M78 38L70 14C68 9 60 15 56 24"
        fill="#FFFFFF"
        stroke="#475569"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right Inner Ear (Pink) */}
      <path d="M74 34L68 18C67 16 62 19 60 25" fill="#FFA5BA" opacity="0.9" />

      {/* Cat Head Base */}
      <ellipse
        cx="50"
        cy="55"
        rx="36"
        ry="30"
        fill="#FFFFFF"
        stroke="#475569"
        strokeWidth="3.5"
      />

      {/* Cat Cheeks Blush */}
      <ellipse cx="28" cy="62" rx="6" ry="3.5" fill="#FFB7C5" opacity="0.75" />
      <ellipse cx="72" cy="62" rx="6" ry="3.5" fill="#FFB7C5" opacity="0.75" />

      {/* Big Sparkling Eyes */}
      {/* Left Eye */}
      <ellipse cx="36" cy="51" rx="5.5" ry="7" fill="#1E293B" />
      <circle cx="34" cy="48" r="2.2" fill="#FFFFFF" />
      <circle cx="38" cy="54" r="1.1" fill="#FFFFFF" />

      {/* Right Eye */}
      <ellipse cx="64" cy="51" rx="5.5" ry="7" fill="#1E293B" />
      <circle cx="62" cy="48" r="2.2" fill="#FFFFFF" />
      <circle cx="66" cy="54" r="1.1" fill="#FFFFFF" />

      {/* Cute Nose */}
      <polygon points="47,60 53,60 50,63" fill="#F43F5E" />

      {/* Cat Smile Mouth (w-shape) */}
      <path
        d="M44 65C46 68 49 68 50 65C51 68 54 68 56 65"
        stroke="#475569"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Whiskers */}
      {/* Left Whiskers */}
      <path d="M14 55L24 57" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M12 63L23 62" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />

      {/* Right Whiskers */}
      <path d="M86 55L76 57" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M88 63L77 62" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />

      {/* Little Academic Sparkle on Forehead */}
      <path
        d="M50 32L51.5 37L56 38.5L51.5 40L50 45L48.5 40L44 38.5L48.5 37Z"
        fill="#FBBF24"
      />

      <defs>
        <linearGradient id="catGradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8EA7E9" />
          <stop offset="0.5" stopColor="#7286D3" />
          <stop offset="1" stopColor="#FFC4D6" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default EliseCatMascot;

