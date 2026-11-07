/**
 * File: src/components/shared/FallingLeavesEffect.tsx
 * Mục đích: Hiệu ứng cánh hoa & chiếc lá rơi nhẹ nhàng (Falling Leaves & Petals) bằng CSS thuần mượt mà, lãng mạn.
 * Đặc tính:
 *   - Siêu nhẹ, phần cứng tăng tốc GPU (translate3d, rotate), 60 FPS không gây lag.
 *   - pointer-events-none: Tuyệt đối không cản trở thao tác click hay nhập liệu của người dùng.
 *   - Đa dạng hình dáng (cánh hoa hồng pastel, lá non xanh nhạt, lá vàng mùa thu) với quỹ đạo bay lượn ngẫu nhiên.
 */

import React, { useMemo } from "react";

interface LeafItem {
  id: number;
  left: number; // 0 - 100%
  size: number; // px
  duration: number; // s
  delay: number; // s
  drift: number; // px horizontal sway
  rotationStart: number;
  rotationEnd: number;
  opacity: number;
  type: "PETAL_PINK" | "PETAL_ROSE" | "LEAF_GREEN" | "LEAF_GOLD";
}

interface FallingLeavesEffectProps {
  count?: number;
  className?: string;
}

export const FallingLeavesEffect: React.FC<FallingLeavesEffectProps> = ({
  count = 22,
  className = "z-0",
}) => {
  const leaves: LeafItem[] = useMemo(() => {
    const types: LeafItem["type"][] = [
      "PETAL_PINK",
      "PETAL_PINK",
      "PETAL_ROSE",
      "LEAF_GREEN",
      "LEAF_GOLD",
    ];

    return Array.from({ length: count }, (_, i) => {
      // Deterministic pseudorandom based on index for hydration consistency
      const seed1 = ((i * 37 + 13) % 100) / 100;
      const seed2 = ((i * 59 + 29) % 100) / 100;
      const seed3 = ((i * 83 + 47) % 100) / 100;
      const seed4 = ((i * 97 + 71) % 100) / 100;

      return {
        id: i,
        left: seed1 * 96 + 2, // 2% to 98%
        size: 14 + seed2 * 14, // 14px to 28px
        duration: 8 + seed3 * 7, // 8s to 15s (rơi chậm rãi, êm dịu)
        delay: seed4 * 10, // 0s to 10s
        drift: (seed2 - 0.5) * 120, // -60px to +60px
        rotationStart: seed1 * 360,
        rotationEnd: seed1 * 360 + (seed3 > 0.5 ? 360 : -360),
        opacity: 0.55 + seed4 * 0.35, // 0.55 - 0.90
        type: types[i % types.length],
      };
    });
  }, [count]);

  const renderShape = (type: LeafItem["type"]) => {
    switch (type) {
      case "PETAL_PINK":
        // Cánh hoa anh đào / hoa hồng phớt
        return (
          <path
            d="M12 2C6 7 4 13 6 17C8 21 14 21 17 18C20 15 19 8 12 2Z"
            fill="#FBCFE8"
            stroke="#F472B6"
            strokeWidth="0.6"
          />
        );
      case "PETAL_ROSE":
        // Cánh hoa hồng pastel đậm hơn một chút
        return (
          <path
            d="M12 3C8 1 3 4 5 9C7 14 12 19 12 19C12 19 17 14 19 9C21 4 16 1 12 3Z"
            fill="#FDA4AF"
            stroke="#FB7185"
            strokeWidth="0.6"
          />
        );
      case "LEAF_GREEN":
        // Chiếc lá non xanh mướt
        return (
          <path
            d="M19 3C10 6 4 14 4 20C4 20 10 19 15 15C20 11 21 5 19 3Z"
            fill="#BBF7D0"
            stroke="#86EFAC"
            strokeWidth="0.6"
          />
        );
      case "LEAF_GOLD":
        // Chiếc lá thu vàng mơ
        return (
          <path
            d="M18 2C10 5 4 13 4 19C7 19 13 18 17 13C20 9 20 4 18 2Z"
            fill="#FEF08A"
            stroke="#FDE047"
            strokeWidth="0.6"
          />
        );
    }
  };

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      <style>{`
        @keyframes floatAndFall {
          0% {
            transform: translate3d(0, -40px, 0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: var(--leaf-opacity);
          }
          50% {
            transform: translate3d(var(--leaf-drift), 50vh, 0) rotate(180deg);
          }
          85% {
            opacity: var(--leaf-opacity);
          }
          100% {
            transform: translate3d(calc(var(--leaf-drift) * -0.5), 105vh, 0) rotate(var(--leaf-rot-end));
            opacity: 0;
          }
        }
      `}</style>

      {leaves.map((leaf) => (
        <div
          key={leaf.id}
          className="absolute will-change-transform"
          style={
            {
              left: `${leaf.left}%`,
              top: 0,
              width: leaf.size,
              height: leaf.size,
              "--leaf-opacity": leaf.opacity,
              "--leaf-drift": `${leaf.drift}px`,
              "--leaf-rot-end": `${leaf.rotationEnd}deg`,
              animation: `floatAndFall ${leaf.duration}s cubic-bezier(0.4, 0, 0.2, 1) infinite`,
              animationDelay: `${leaf.delay}s`,
            } as React.CSSProperties
          }
        >
          <svg
            viewBox="0 0 24 24"
            className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.08)] filter"
          >
            {renderShape(leaf.type)}
          </svg>
        </div>
      ))}
    </div>
  );
};

export default FallingLeavesEffect;

