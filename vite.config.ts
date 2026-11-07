/**
 * File: vite.config.ts
 * Mục đích: Cấu hình Vite cho ứng dụng Theodore Feynman Stage với React và path alias @/.
 * Thành phần chính: defineConfig, react plugin, alias @.
 * Props/Inputs: Cấu hình chuẩn.
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
});

