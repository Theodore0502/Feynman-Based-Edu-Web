/**
 * File: tailwind.config.js
 * Muc dich: Cau hinh Tailwind CSS cho du an Theodore Feynman Technique Stage theo phong cach pastel tham my.
 * Thanh phan chinh:
 *   - content paths: Quet tat ca cac file trong src
 *   - theme colors: Tich hop bang mau pastel diu mat.
 * Props/Inputs: Cau hinh chuan.
 */

module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          blue: "#8EA7E9",
          periwinkle: "#7286D3",
          navy: "#5066A1",
          lavender: "#B5B2E8",
          purple: "#D3C5E5",
          pink: "#F1C6E7",
          coral: "#F79D9D",
          peach: "#FFB4B4",
          mint: "#BDE8D2",
          emerald: "#76D7C4",
          amber: "#FDECD2",
          canvas: "#F3F6FA",
          card: "#FFFFFF",
        },
      },
      borderRadius: {
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        subtle: "0 2px 10px rgba(0, 0, 0, 0.02), 0 8px 24px rgba(114, 134, 211, 0.06)",
        card: "0 4px 20px -2px rgba(112, 144, 176, 0.12)",
      },
    },
  },
  plugins: [],
};
