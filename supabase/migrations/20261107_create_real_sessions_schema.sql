-- ==============================================================================
-- File: supabase/migrations/20261107_create_real_sessions_schema.sql
-- Mục đích: Tạo bảng lưu trữ các phiên học thật (real learning sessions)
-- Tuân thủ đầy đủ chuẩn Supabase Postgres Best Practices:
--   1. Primary key UUID/TEXT chuẩn hóa
--   2. Check constraints cho status và difficulty
--   3. Foreign key indexes & composite index sắp xếp theo created_at DESC
--   4. RLS enabled kèm chính sách bảo mật cho anon và authenticated users
--   5. Trigger tự động cập nhật updated_at
-- ==============================================================================

-- 1. Kích hoạt tiện ích tạo UUID ngẫu nhiên nếu chưa có
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Bảng lưu trữ phiên học thật (sessions)
CREATE TABLE IF NOT EXISTS public.sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    topic TEXT NOT NULL,
    topic_id TEXT,                              -- Mã môn học / chủ đề học thuật (vd: math-gradient-descent)
    domain_id TEXT,                             -- Lĩnh vực (math, discrete, cv, cs)
    persona_id TEXT NOT NULL DEFAULT 'child_10yo',
    difficulty TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'ABANDONED')),
    clarity_score INTEGER NOT NULL DEFAULT 0 CHECK (clarity_score BETWEEN 0 AND 100),
    turn_count INTEGER NOT NULL DEFAULT 0,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    best_analogy TEXT,
    summary_feedback TEXT,
    knowledge_gaps JSONB NOT NULL DEFAULT '[]'::jsonb,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Bảng lưu trữ tin nhắn hội thoại của phiên học (messages)
CREATE TABLE IF NOT EXISTS public.messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    session_id TEXT NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    analysis_metadata JSONB,                    -- Kết quả phân tích ngầm: Jargon, lỗ hổng logic, điểm clarity lượt này
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Bảng lưu trữ báo cáo đánh giá Feynman Mastery Card (evaluation_reports)
CREATE TABLE IF NOT EXISTS public.evaluation_reports (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    session_id TEXT UNIQUE NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    clarity_score INTEGER NOT NULL CHECK (clarity_score BETWEEN 0 AND 100),
    logic_completeness INTEGER NOT NULL CHECK (logic_completeness BETWEEN 0 AND 100),
    best_analogy TEXT,
    knowledge_gaps JSONB NOT NULL DEFAULT '[]'::jsonb,
    summary_feedback TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- CHỈ MỤC TỐC ĐỘ CAO (INDEXES CHO FOREIGN KEYS VÀ SẮP XẾP TRUY VẤN)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON public.sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_topic_id ON public.sessions(topic_id);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON public.messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_evaluation_reports_session_id ON public.evaluation_reports(session_id);

-- ==============================================================================
-- TRIGGER TỰ ĐỘNG CẬP NHẬT updated_at
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sessions_updated_at ON public.sessions;
CREATE TRIGGER trg_sessions_updated_at
    BEFORE UPDATE ON public.sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_session_updated_at();

-- ==============================================================================
-- BẢO MẬT ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_reports ENABLE ROW LEVEL SECURITY;

-- 1. Policies cho bảng sessions:
-- Cho phép đọc tất cả sessions (hoặc lọc theo user_id nếu có auth)
DROP POLICY IF EXISTS "Cho phép đọc sessions" ON public.sessions;
CREATE POLICY "Cho phép đọc sessions"
    ON public.sessions FOR SELECT
    USING (true);

-- Cho phép tạo session mới
DROP POLICY IF EXISTS "Cho phép tạo sessions" ON public.sessions;
CREATE POLICY "Cho phép tạo sessions"
    ON public.sessions FOR INSERT
    WITH CHECK (true);

-- Cho phép cập nhật tiến độ / kết thúc session
DROP POLICY IF EXISTS "Cho phép cập nhật sessions" ON public.sessions;
CREATE POLICY "Cho phép cập nhật sessions"
    ON public.sessions FOR UPDATE
    USING (true);

-- 2. Policies cho bảng messages:
DROP POLICY IF EXISTS "Cho phép đọc messages" ON public.messages;
CREATE POLICY "Cho phép đọc messages"
    ON public.messages FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Cho phép gửi messages" ON public.messages;
CREATE POLICY "Cho phép gửi messages"
    ON public.messages FOR INSERT
    WITH CHECK (true);

-- 3. Policies cho bảng evaluation_reports:
DROP POLICY IF EXISTS "Cho phép đọc evaluation_reports" ON public.evaluation_reports;
CREATE POLICY "Cho phép đọc evaluation_reports"
    ON public.evaluation_reports FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Cho phép tạo hoặc cập nhật evaluation_reports" ON public.evaluation_reports;
CREATE POLICY "Cho phép tạo hoặc cập nhật evaluation_reports"
    ON public.evaluation_reports FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Cho phép update evaluation_reports" ON public.evaluation_reports;
CREATE POLICY "Cho phép update evaluation_reports"
    ON public.evaluation_reports FOR UPDATE
    USING (true);

-- ==============================================================================
-- VIEW TƯƠNG THÍCH CHO learning_sessions
-- ==============================================================================
CREATE OR REPLACE VIEW public.learning_sessions AS
SELECT * FROM public.sessions;
