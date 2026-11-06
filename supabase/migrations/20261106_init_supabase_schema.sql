-- ==============================================================================
-- File: supabase/migrations/20261106_init_supabase_schema.sql
-- Mục đích: Khởi tạo toàn bộ cấu trúc Cơ sở dữ liệu cho Feynman Technique Stage trên Supabase PostgreSQL.
-- Bảng tạo mới: users, sessions, messages, evaluation_reports, vault_items
-- ==============================================================================

-- 1. Bảng Người dùng (users)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    field_of_study TEXT DEFAULT 'IT',
    streak_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Bảng Phiên học Feynman (sessions)
CREATE TABLE IF NOT EXISTS public.sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    topic TEXT NOT NULL,
    persona_id TEXT NOT NULL DEFAULT 'child_10yo',
    difficulty TEXT NOT NULL DEFAULT 'MEDIUM', -- EASY | MEDIUM | HARD
    status TEXT NOT NULL DEFAULT 'ACTIVE',     -- ACTIVE | COMPLETED
    clarity_score INTEGER DEFAULT 0,          -- 0 - 100
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Bảng Tin nhắn đối thoại (messages)
CREATE TABLE IF NOT EXISTS public.messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    session_id TEXT NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- 'user' | 'assistant'
    content TEXT NOT NULL,
    analysis_metadata JSONB, -- Lưu trữ Jargon, Logic gaps và Turn clarity
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Bảng Báo cáo Feynman Mastery Card (evaluation_reports)
CREATE TABLE IF NOT EXISTS public.evaluation_reports (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    session_id TEXT UNIQUE NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    clarity_score INTEGER NOT NULL,
    logic_completeness INTEGER NOT NULL,
    best_analogy TEXT,
    knowledge_gaps JSONB DEFAULT '[]'::jsonb,
    summary_feedback TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Bảng Kho Từ vựng & Ẩn dụ (vault_items)
CREATE TABLE IF NOT EXISTS public.vault_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    term TEXT NOT NULL,
    plain_explanation TEXT NOT NULL,
    analogy_used TEXT,
    topic TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- Bật Row Level Security (RLS) & Thiết lập Policies cho phép truy cập
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_items ENABLE ROW LEVEL SECURITY;

-- Cho phép đọc và ghi đối với anon key phục vụ Web Client
CREATE POLICY "Cho phép đọc sessions" ON public.sessions FOR SELECT USING (true);
CREATE POLICY "Cho phép tạo sessions" ON public.sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Cho phép cập nhật sessions" ON public.sessions FOR UPDATE USING (true);

CREATE POLICY "Cho phép đọc messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Cho phép gửi messages" ON public.messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Cho phép đọc evaluation_reports" ON public.evaluation_reports FOR SELECT USING (true);
CREATE POLICY "Cho phép tạo evaluation_reports" ON public.evaluation_reports FOR INSERT WITH CHECK (true);

CREATE POLICY "Cho phép đọc vault_items" ON public.vault_items FOR SELECT USING (true);
CREATE POLICY "Cho phép thêm vault_items" ON public.vault_items FOR INSERT WITH CHECK (true);

