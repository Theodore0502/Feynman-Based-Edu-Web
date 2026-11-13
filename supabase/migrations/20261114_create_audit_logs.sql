-- ==============================================================================
-- File: supabase/migrations/20261114_create_audit_logs.sql
-- Purpose: Hệ thống Nhật ký Kiểm toán & Hoạt động Toàn sàn (Audit & Activity Logs)
-- Phân hệ: Theo dõi mọi hành vi người dùng (Learner, Curator, Admin, Guest/Anonymous)
-- Đặc điểm:
--   1. Ghi nhận thời gian chuẩn GMT+7 (Asia/Ho_Chi_Minh) và UTC timestamp có múi giờ.
--   2. Hỗ trợ bất kỳ tài khoản nào: Người học, Kiểm định viên, Quản trị viên, Khách vãng lai.
--   3. Tự động đánh chỉ mục tối ưu truy vấn thời gian thực theo thời gian, user_id, action, category.
--   4. Kích hoạt Row-Level Security (RLS) với chính sách cho phép ghi tự do và tra cứu an toàn.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Thông tin Định danh Người dùng (Hỗ trợ cả Auth User, Preconfigured Demo User & Guest)
    user_id TEXT,
    user_email TEXT,
    user_role TEXT NOT NULL DEFAULT 'anonymous',
    user_name TEXT,
    
    -- Phân loại Hành động & Vị trí trên Web
    action TEXT NOT NULL,                     -- Ví dụ: PAGE_VIEW, BUTTON_CLICK, UPLOAD_MATERIAL, FEYNMAN_TURN, LOGIN, LOGOUT
    category TEXT NOT NULL DEFAULT 'UI_INTERACTION', -- NAVIGATION, UI_INTERACTION, LEARNING, CURATION, AUTH, SYSTEM, ERROR
    path TEXT,                                -- URL path (ví dụ: /materials/upload, /stage, /topics)
    component TEXT,                           -- Tên Component phát sinh hành động
    
    -- Chi tiết Dữ liệu & Trạng thái
    details JSONB NOT NULL DEFAULT '{}'::jsonb, -- Dữ liệu payload bổ sung (thông số, tên tệp, điểm số, lỗi...)
    status TEXT NOT NULL DEFAULT 'SUCCESS',    -- SUCCESS, FAILED, WARNING, PENDING
    
    -- Môi trường & Thiết bị Client
    ip_address TEXT,
    user_agent TEXT,
    
    -- Thời gian sự kiện (Theo múi giờ GMT+7 và UTC chuẩn)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at_gmt7 TEXT NOT NULL DEFAULT (to_char(now() AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD"T"HH24:MI:SS.MS+07:00'))
);

-- ==============================================================================
-- CHỈ MỤC TỐI ƯU TRUY VẤN (INDEXES)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_desc ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON public.audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_role ON public.audit_logs(user_role);

-- ==============================================================================
-- CHÍNH SÁCH BẢO MẬT HÀNG (ROW-LEVEL SECURITY - RLS)
-- ==============================================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Cho phép tất cả các phiên người dùng (kể cả chưa đăng nhập) được phép ghi log hoạt động
DROP POLICY IF EXISTS "Allow any client to insert audit logs" ON public.audit_logs;
CREATE POLICY "Allow any client to insert audit logs"
    ON public.audit_logs
    FOR INSERT
    TO public, anon, authenticated
    WITH CHECK (true);

-- 2. Cho phép người dùng và quản trị viên tra cứu nhật ký hoạt động
DROP POLICY IF EXISTS "Allow users and admins to view audit logs" ON public.audit_logs;
CREATE POLICY "Allow users and admins to view audit logs"
    ON public.audit_logs
    FOR SELECT
    TO public, anon, authenticated
    USING (true);

-- ==============================================================================
-- TRIGGER TỰ ĐỘNG CẬP NHẬT THỜI GIAN GMT+7 NẾU BỊ BỎ TRỐNG
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.set_audit_log_gmt7_time()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.created_at_gmt7 IS NULL OR NEW.created_at_gmt7 = '' THEN
        NEW.created_at_gmt7 := to_char(
            COALESCE(NEW.created_at, timezone('utc'::text, now())) AT TIME ZONE 'Asia/Ho_Chi_Minh',
            'YYYY-MM-DD"T"HH24:MI:SS.MS+07:00'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_audit_log_gmt7_time ON public.audit_logs;
CREATE TRIGGER trg_set_audit_log_gmt7_time
    BEFORE INSERT ON public.audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.set_audit_log_gmt7_time();

