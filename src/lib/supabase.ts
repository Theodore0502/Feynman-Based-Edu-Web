/**
 * File: src/lib/supabase.ts
 * Mục đích: Khởi tạo kết nối Supabase Client Singleton cho ứng dụng Theodore Feynman Stage.
 * Thành phần chính:
 *   - supabase: Đối tượng SupabaseClient toàn cục kết nối tới dự án gvhxqjoggnoyijtguvxb.
 * Props/Inputs: Không có.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) ||
  process.env.VITE_SUPABASE_URL ||
  "https://gvhxqjoggnoyijtguvxb.supabase.co";

const supabaseAnonKey =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


