/**
 * File: vite.config.ts
 * Mục đích: Cấu hình Vite cho ứng dụng Theodore Feynman Stage với React và path alias @/.
 * Thành phần chính: defineConfig, react plugin, alias @.
 * Props/Inputs: Cấu hình chuẩn.
 */
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const geminiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || "";
  const modelName = env.VITE_MODEL_NAME || env.MODEL_NAME || "gemini-3.1-flash-lite";

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      "process.env.VITE_GEMINI_API_KEY": JSON.stringify(geminiKey),
      "process.env.GEMINI_API_KEY": JSON.stringify(geminiKey),
      "process.env.MODEL_NAME": JSON.stringify(modelName),
      "process.env.VITE_MODEL_NAME": JSON.stringify(modelName),
    },
    server: {
      host: "0.0.0.0",
      port: 3000,
    },
  };
});

