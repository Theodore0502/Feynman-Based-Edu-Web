/**
 * File: src/lib/supabase.ts
 * Mục đích: Khởi tạo kết nối Supabase Client Singleton cho ứng dụng Theodore Feynman Stage.
 * Thành phần chính:
 *   - supabase: Đối tượng SupabaseClient toàn cục kết nối tới dự án gvhxqjoggnoyijtguvxb.
 * Props/Inputs: Không có.
 */

import { createClient } from "@supabase/supabase-js";

const metaEnv = typeof import.meta !== "undefined" ? (import.meta as any).env : undefined;

const supabaseUrl =
  metaEnv?.VITE_SUPABASE_URL ||
  (typeof process !== "undefined" && process.env?.VITE_SUPABASE_URL) ||
  "https://gvhxqjoggnoyijtguvxb.supabase.co";

// Khóa fallback hợp lệ định dạng JWT để createClient không bao giờ crash React khi chưa kịp cấu hình key thật
const FALLBACK_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2aHhxam9nZ25veWlqdGd1dnhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwMDU3OTcsImV4cCI6MjEwNzU4MTc5N30.placeholder_anon_key_for_development";

const rawKey =
  metaEnv?.VITE_SUPABASE_ANON_KEY ||
  (typeof process !== "undefined" && process.env?.VITE_SUPABASE_ANON_KEY);

const supabaseAnonKey = rawKey && rawKey.trim().length > 0 ? rawKey.trim() : FALLBACK_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


