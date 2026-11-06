/**
 * File: src/lib/utils.ts
 * Mục đích: Cung cấp các hàm tiện ích dùng chung (Classnames merger, format ngày tháng, tính toán điểm clarity).
 * Thành phần chính:
 *   - cn: Hàm gộp classname an toàn sử dụng clsx và tailwind-merge.
 *   - formatDate: Định dạng thời gian hiển thị thân thiện.
 *   - getClarityBadge: Trả về màu và nhãn tương ứng với điểm số.
 * Props/Inputs: Hàm tiện ích thuần túy.
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getClarityBadge(score: number) {
  if (score >= 80) return { label: "Xuất Sắc", bg: "bg-[#E8F8F0]", text: "text-[#1E7E50]", border: "border-[#BDE8D2]" };
  if (score >= 60) return { label: "Rõ Ràng", bg: "bg-[#EEF5FD]", text: "text-[#2F73C7]", border: "border-[#C6DCFB]" };
  if (score >= 40) return { label: "Cơ Bản", bg: "bg-[#FFF4E5]", text: "text-[#D4710A]", border: "border-[#FDE0BA]" };
  return { label: "Cần Cải Thiện", bg: "bg-[#FFE8E8]", text: "text-[#D9534F]", border: "border-[#FFC2C2]" };
}

