/**
 * File: src/pages/TopicKnowledgeGraph.tsx
 * Mục đích: [Trang 8] Bản Đồ Tri Thức - Bán nguyệt tỏa tròn sát thanh sidebar bên trái
 */

import React from "react";

export const TopicKnowledgeGraph: React.FC = () => {
  return (
    <div className="relative w-full min-h-[calc(100vh-140px)] flex items-center -ml-4 sm:-ml-6 lg:-ml-8">
      {/* Container nửa vòng tròn sát mép sidebar bên trái */}
      <div className="relative w-full max-w-4xl h-[680px] flex items-center">
        <svg
          className="w-full h-full"
          viewBox="0 0 700 680"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradient nền nửa vòng tròn */}
            <radialGradient
              id="semiCircleGrad"
              cx="0"
              cy="340"
              r="480"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#EEF2FC" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#E5ECFB" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.1" />
            </radialGradient>

            {/* Gradient vành ngoài */}
            <linearGradient id="arcStroke" x1="0" y1="0" x2="500" y2="340" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#7286D3" />
              <stop offset="100%" stopColor="#8EA7E9" />
            </linearGradient>

            {/* Bộ lọc bóng đổ mờ */}
            <filter id="semiShadow" x="-20" y="-20" width="600" height="720" filterUnits="userSpaceOnUse">
              <feDropShadow dx="8" dy="4" stdDeviation="16" floodColor="#7286D3" floodOpacity="0.12" />
            </filter>
          </defs>

          {/* Vành đai 3 (Ngoài cùng - R = 480) */}
          <path
            d="M 0 340 M 0 -140 A 480 480 0 0 1 0 820"
            stroke="#D3E0FA"
            strokeWidth="1.5"
            strokeDasharray="6 6"
            opacity="0.7"
          />

          {/* Nửa vòng tròn chính (R = 340) với bóng đổ và gradient */}
          <path
            d="M 0 0 A 340 340 0 0 1 0 680 Z"
            fill="url(#semiCircleGrad)"
            stroke="url(#arcStroke)"
            strokeWidth="2.5"
            filter="url(#semiShadow)"
          />

          {/* Vành đai 2 (Trung gian - R = 230) */}
          <path
            d="M 0 110 A 230 230 0 0 1 0 570"
            fill="none"
            stroke="#7286D3"
            strokeWidth="1.8"
            strokeDasharray="5 5"
            opacity="0.6"
          />

          {/* Vành đai 1 (Trong cùng - R = 120) */}
          <path
            d="M 0 220 A 120 120 0 0 1 0 460"
            fill="#E5ECFB"
            fillOpacity="0.6"
            stroke="#7286D3"
            strokeWidth="2"
          />

          {/* Điểm neo trung tâm sát mép trái (R = 45) */}
          <path
            d="M 0 295 A 45 45 0 0 1 0 385 Z"
            fill="#7286D3"
          />

          {/* Vòng tròn nhỏ trang trí tại tâm mép trái */}
          <circle cx="0" cy="340" r="14" fill="#ffffff" />
          <circle cx="0" cy="340" r="6" fill="#7286D3" />
        </svg>
      </div>
    </div>
  );
};

export default TopicKnowledgeGraph;
