/**
 * File: src/lib/prisma.ts
 * Mục đích: Khởi tạo kết nối PrismaClient dạng Singleton tránh tạo quá nhiều pool kết nối trong môi trường Next.js hot-reload.
 * Thành phần chính:
 *   - prisma: Đối tượng PrismaClient toàn cục.
 * Props/Inputs: Không có.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

