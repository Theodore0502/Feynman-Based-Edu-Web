/**
 * File: src/components/landing/FallingLeavesDecor.tsx
 * Mục đích: Hiệu ứng lá và cánh hoa rơi lơ lửng (Falling Leaves & Petals) nhẹ nhàng, thơ mộng cho Landing Page.
 * Thiết kế:
 *   - Các cánh lá và hoa vẽ bằng vector SVG sắc nét với bảng màu pastel tự nhiên (xanh lục non, vàng mật ong, hồng phấn).
 *   - Chuyển động vật lý lượn sóng 3D (sway, drift & tumble) mượt mà bằng CSS keyframes.
 *   - Tuyệt đối không chặn tương tác người dùng (pointer-events-none, z-index tối ưu).
 */

import React, { useMemo } from "react";

interface LeafConfig {
  id: number;
  leftPercent: number;
  durationSec: number;
  delaySec: number;
  sizePx: number;
  shapeIndex: number;
  color: string;
  swayDistancePx: number;
  opacity: number;
  blurPx: number;
}

// 4 mẫu hình SVG chiếc lá và cánh hoa phong cách pastel organic
const LeafShapes: React.FC<{ shapeIndex: number; color: string; size: number }> = ({
  shapeIndex,
  color,
  size,
}) => {
  switch (shapeIndex) {
    case 0:
      // Chiếc lá non hình giọt nước có gân lá mềm mại
      return (
        <svg
          width={size}
          height={size * 1.3}
          viewBox="0 0 24 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2C12 2 3 10 3 19C3 24 7 28 12 30C17 28 21 24 21 19C21 10 12 2 12 2Z"
            fill={color}
          />
          <path
            d="M12 4V28M12 12L8 9M12 16L16 13M12 21L9 18"
            stroke="white"
            strokeWidth="1"
            strokeLinecap="round"
            strokeOpacity="0.45"
          />
        </svg>
      );
    case 1:
      // Cánh hoa mềm mỏng lượn sóng
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 3C8 3 4 8 5 14C6 19 10 21 13 21C18 21 20 16 19 11C18 6 15 3 12 3Z"
            fill={color}
          />
          <path
            d="M10 8C11 12 12 15 13 18"
            stroke="white"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeOpacity="0.5"
          />
        </svg>
      );
    case 2:
      // Chiếc lá phong cách lá liễu thuôn dài nhẹ nhàng
      return (
        <svg
          width={size * 0.8}
          height={size * 1.5}
          viewBox="0 0 16 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 2C4 7 2 15 3 23C4 28 7 30 8 30C9 30 12 28 13 23C14 15 12 7 8 2Z"
            fill={color}
          />
          <path
            d="M8 4V28"
            stroke="white"
            strokeWidth="0.75"
            strokeLinecap="round"
            strokeOpacity="0.4"
          />
        </svg>
      );
    default:
      // Cánh hoa anh đào bầu bĩnh
      return (
        <svg
          width={size * 1.1}
          height={size}
          viewBox="0 0 26 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M13 2C8 2 2 7 3 14C4 19 9 22 13 22C17 22 22 19 23 14C24 7 18 2 13 2Z"
            fill={color}
          />
          <path
            d="M13 5C13 10 13 15 13 19"
            stroke="white"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeOpacity="0.4"
          />
        </svg>
      );
  }
};

// Bảng màu phấn (pastel) hài hòa với vườn hoa Landing Page
const PASTEL_PALETTE = [
  "#86EFAC", // Xanh lộc non dịu
  "#A7F3D0", // Xanh ngọc bích nhạt
  "#FCD34D", // Vàng nắng hoa mai
  "#FDBA74", // Cam đào ngọt ngào
  "#FBCFE8", // Hồng cánh sen phớt
  "#FDA4AF", // Cánh hoa anh đào phớt đỏ
  "#C7D2FE", // Tím oải hương nhạt
  "#B5B2E8", // Tím pastel thương hiệu Elis
  "#6EE7B7", // Xanh bạc hà dịu
];

export const FallingLeavesDecor: React.FC = () => {
  // Sinh danh sách 22 chiếc lá phân bố ngẫu nhiên tự nhiên
  const leaves = useMemo<LeafConfig[]>(() => {
    const list: LeafConfig[] = [];
    const count = 22;

    for (let i = 0; i < count; i++) {
      // Phân bố trải đều từ 2% đến 96% bề ngang
      const leftPercent = 2 + (i * 92) / count + (Math.sin(i * 3.7) * 4);
      // Thời gian rơi từ 10s đến 22s cho cảm giác lơ lửng thư thái
      const durationSec = 10 + (i % 7) * 1.8 + Math.random() * 2;
      // Stagger delay để không bị rơi thành từng đợt dồn cục
      const delaySec = (i * 0.85) % 15;
      // Kích thước từ 14px đến 26px
      const sizePx = 14 + (i % 5) * 2.8;
      const shapeIndex = i % 4;
      const color = PASTEL_PALETTE[i % PASTEL_PALETTE.length];
      const swayDistancePx = 30 + (i % 6) * 12;
      const opacity = 0.55 + (i % 4) * 0.12;
      const blurPx = i % 7 === 0 ? 0.8 : 0; // Một số lá ở xa mờ nhẹ tạo chiều sâu DOF

      list.push({
        id: i,
        leftPercent,
        durationSec,
        delaySec,
        sizePx,
        shapeIndex,
        color,
        swayDistancePx,
        opacity,
        blurPx,
      });
    }

    return list;
  }, []);

  return (
    <>
      <style>{`
        @keyframes fallAndSway {
          0% {
            transform: translateY(-80px) translateX(0px) rotate(0deg) rotateY(0deg);
            opacity: 0;
          }
          10% {
            opacity: var(--leaf-opacity, 0.7);
          }
          50% {
            transform: translateY(50vh) translateX(var(--sway-x, 40px)) rotate(180deg) rotateY(180deg);
          }
          90% {
            opacity: var(--leaf-opacity, 0.7);
          }
          100% {
            transform: translateY(105vh) translateX(calc(var(--sway-x, 40px) * -0.6)) rotate(360deg) rotateY(360deg);
            opacity: 0;
          }
        }

        .leaf-particle {
          will-change: transform, opacity;
          animation: fallAndSway var(--fall-duration, 14s) ease-in-out infinite;
          animation-delay: var(--fall-delay, 0s);
        }

        @media (prefers-reduced-motion: reduce) {
          .leaf-particle {
            animation: none !important;
            display: none !important;
          }
        }
      `}</style>

      {/* Container phủ toàn màn hình cố định, không cản trở thao tác chuột */}
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden select-none z-10"
        aria-hidden="true"
      >
        {leaves.map((leaf) => (
          <div
            key={leaf.id}
            className="absolute -top-12 leaf-particle"
            style={
              {
                left: `${leaf.leftPercent}%`,
                filter: leaf.blurPx > 0 ? `blur(${leaf.blurPx}px)` : undefined,
                "--leaf-opacity": leaf.opacity,
                "--fall-duration": `${leaf.durationSec}s`,
                "--fall-delay": `${leaf.delaySec}s`,
                "--sway-x": `${leaf.swayDistancePx}px`,
              } as React.CSSProperties
            }
          >
            <LeafShapes
              shapeIndex={leaf.shapeIndex}
              color={leaf.color}
              size={leaf.sizePx}
            />
          </div>
        ))}
      </div>
    </>
  );
};

export default FallingLeavesDecor;

