/**
 * File: src/pages/TopicKnowledgeGraph.tsx
 * Yêu cầu:
 * 1. Khoảng cách giữa tâm vòng tròn và sidebar bằng 0.
 * 2. Các vòng tròn xoay nhẹ theo chiều kim đồng hồ với tốc độ khác nhau
 *    (chậm dần ở trong, càng ra ngoài càng nhanh hơn).
 * 3. Ngoài ra không làm gì thêm.
 */

import React, { useState, useEffect } from "react";

export const TopicKnowledgeGraph: React.FC = () => {
  const [sidebarRight, setSidebarRight] = useState<number>(256);
  const [centerY, setCenterY] = useState<number>(340);

  useEffect(() => {
    const updateDimensions = () => {
      // 1. Đo lường chính xác mép phải của Sidebar
      const sidebar = document.querySelector("aside");
      if (sidebar) {
        setSidebarRight(sidebar.getBoundingClientRect().right);
      }

      // 2. Định vị tâm vòng tròn thẳng hàng với mục "Bản đồ kiến thức" trên Sidebar
      const activeNav = document.querySelector('aside a[href="/topics"]');
      if (activeNav) {
        const navRect = activeNav.getBoundingClientRect();
        // Tâm vòng tròn ngang hàng với tâm của nút "Bản đồ kiến thức"
        setCenterY(navRect.top + navRect.height / 2);
      } else {
        setCenterY(window.innerHeight / 2);
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    const timer = setTimeout(updateDimensions, 100);

    return () => {
      window.removeEventListener("resize", updateDimensions);
      clearTimeout(timer);
    };
  }, []);

  return (
    <>
      {/* CSS Keyframes xoay theo chiều kim đồng hồ */}
      <style>{`
        @keyframes spinClockwise {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .orbit-spin-slow {
          animation: spinClockwise 48s linear infinite;
        }
        .orbit-spin-med {
          animation: spinClockwise 32s linear infinite;
        }
        .orbit-spin-fast {
          animation: spinClockwise 20s linear infinite;
        }
        .orbit-spin-faster {
          animation: spinClockwise 12s linear infinite;
        }
      `}</style>

      {/* Container sát mép sidebar với khoảng cách = 0 */}
      <div
        className="fixed top-0 bottom-0 pointer-events-none overflow-hidden z-10"
        style={{
          left: `${sidebarRight}px`,
          width: `calc(100vw - ${sidebarRight}px)`,
        }}
      >
        <svg
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Clip path giới hạn chỉ hiển thị nửa bên phải (x >= 0) */}
            <clipPath id="semiCircleClip">
              <rect x="0" y="-2000" width="4000" height="4000" />
            </clipPath>

            {/* Gradient nền nhẹ nhàng */}
            <radialGradient
              id="bgGrad"
              cx="0"
              cy={centerY}
              r="480"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#EEF2FC" stopOpacity="0.85" />
              <stop offset="45%" stopColor="#E5ECFB" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.05" />
            </radialGradient>
          </defs>

          {/* Nền nửa vòng tròn chính */}
          <path
            d={`M 0 ${centerY - 340} A 340 340 0 0 1 0 ${centerY + 340} Z`}
            fill="url(#bgGrad)"
          />

          {/* Nhóm các vòng tròn xoay, được clip lại ở x >= 0 để luôn là nửa vòng tròn */}
          <g clipPath="url(#semiCircleClip)">
            {/* Vòng 4: Ngoài cùng (R = 480) - Xoay nhanh nhất (12s) */}
            <g
              className="orbit-spin-faster"
              style={{
                transformOrigin: `0px ${centerY}px`,
              }}
            >
              <circle
                cx="0"
                cy={centerY}
                r="480"
                fill="none"
                stroke="#D3E0FA"
                strokeWidth="1.6"
                strokeDasharray="8 8"
                opacity="0.8"
              />
            </g>

            {/* Vòng 3: Vành chính (R = 340) - Xoay nhanh (20s) */}
            <g
              className="orbit-spin-fast"
              style={{
                transformOrigin: `0px ${centerY}px`,
              }}
            >
              <circle
                cx="0"
                cy={centerY}
                r="340"
                fill="none"
                stroke="#7286D3"
                strokeWidth="2.5"
                strokeDasharray="24 16"
                opacity="0.85"
              />
            </g>

            {/* Vòng 2: Trung gian (R = 230) - Xoay vừa (32s) */}
            <g
              className="orbit-spin-med"
              style={{
                transformOrigin: `0px ${centerY}px`,
              }}
            >
              <circle
                cx="0"
                cy={centerY}
                r="230"
                fill="none"
                stroke="#7286D3"
                strokeWidth="1.8"
                strokeDasharray="14 12"
                opacity="0.7"
              />
            </g>

            {/* Vòng 1: Trong cùng (R = 120) - Xoay chậm nhất (48s) */}
            <g
              className="orbit-spin-slow"
              style={{
                transformOrigin: `0px ${centerY}px`,
              }}
            >
              <circle
                cx="0"
                cy={centerY}
                r="120"
                fill="#E5ECFB"
                fillOpacity="0.4"
                stroke="#7286D3"
                strokeWidth="2"
                strokeDasharray="16 10"
                opacity="0.9"
              />
            </g>
          </g>

          {/* Đường thẳng đường kính nằm sát mép sidebar (x = 0) */}
          <line
            x1="0"
            y1={centerY - 340}
            x2="0"
            y2={centerY + 340}
            stroke="#7286D3"
            strokeWidth="2.5"
          />

          {/* Bán nguyệt nhỏ tại tâm (R = 45) sát mép sidebar */}
          <path
            d={`M 0 ${centerY - 45} A 45 45 0 0 1 0 ${centerY + 45} Z`}
            fill="#7286D3"
          />

          {/* Nút tròn trang trí tại tâm mép x = 0 */}
          <circle cx="0" cy={centerY} r="14" fill="#ffffff" />
          <circle cx="0" cy={centerY} r="6" fill="#7286D3" />
        </svg>
      </div>
    </>
  );
};

export default TopicKnowledgeGraph;
