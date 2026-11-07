-- ==============================================================================
-- File: supabase/migrations/0001_init_feynman_schema.sql
-- Mục đích: Khởi tạo toàn bộ Hệ thống Cơ sở dữ liệu Chuẩn hóa 12 Bảng cho "Feynman Technique Stage"
-- Các phân hệ:
--   1. Dữ liệu Người dùng: profiles, user_ai_configs
--   2. Dữ liệu Học thuật & Đồ thị Tri thức: academic_domains, academic_topics, topic_edges, academic_materials
--   3. Dữ liệu Phiên học & Tác nhân AI: personas, learning_sessions, session_messages, agent_analysis_logs
--   4. Dữ liệu Đánh giá & Ôn tập (Spaced Repetition): evaluation_reports, jargon_vault_cards
-- Tiện ích: Kích hoạt pgvector, thiết lập đầy đủ Khóa ngoại, Chỉ mục (Indexes), RLS và Trigger Supabase Auth.
-- ==============================================================================

-- 0. KÍCH HOẠT EXTENSIONS CẦN THIẾT
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

-- ==============================================================================
-- PHÂN HỆ 1: DỮ LIỆU NGƯỜI DÙNG (USER DATA)
-- ==============================================================================

-- Bảng 1: profiles (Hồ sơ người dùng liên kết auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    primary_domain_id UUID, -- Sẽ được tham chiếu tới academic_domains(id) sau khi bảng academic_domains được tạo
    streak_count INTEGER NOT NULL DEFAULT 0,
    total_xp INTEGER NOT NULL DEFAULT 0,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bảng 2: user_ai_configs (Cấu hình học tập & AI cá nhân hóa)
CREATE TABLE IF NOT EXISTS public.user_ai_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    preferred_language TEXT NOT NULL DEFAULT 'vi-VN',
    voice_gender TEXT NOT NULL DEFAULT 'female', -- 'female' | 'male'
    speech_rate DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    default_difficulty TEXT NOT NULL DEFAULT 'MEDIUM', -- 'EASY' | 'MEDIUM' | 'HARD'
    custom_model_provider TEXT, -- 'gemini' | 'openai' | 'groq'
    custom_model_name TEXT,     -- 'gemini-1.5-flash', 'gpt-4o-mini'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- PHÂN HỆ 2: DỮ LIỆU HỌC THUẬT & ĐỒ THỊ TRI THỨC (ACADEMIC & KNOWLEDGE GRAPH)
-- ==============================================================================

-- Bảng 3: academic_domains (Lĩnh vực học thuật: IT, Kinh tế, Y khoa...)
CREATE TABLE IF NOT EXISTS public.academic_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bổ sung Khóa ngoại từ profiles sang academic_domains
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_profiles_primary_domain'
    ) THEN
        ALTER TABLE public.profiles
            ADD CONSTRAINT fk_profiles_primary_domain
            FOREIGN KEY (primary_domain_id) REFERENCES public.academic_domains(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Bảng 4: academic_topics (Chủ đề học thuật kèm định nghĩa chuẩn Ground Truth)
CREATE TABLE IF NOT EXISTS public.academic_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID NOT NULL REFERENCES public.academic_domains(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    summary TEXT NOT NULL, -- Định nghĩa chuẩn làm Ground Truth
    required_concepts JSONB NOT NULL DEFAULT '[]'::jsonb, -- Các khái niệm bắt buộc phải nhắc tới
    common_jargons JSONB NOT NULL DEFAULT '[]'::jsonb,    -- Danh sách thuật ngữ khó thường gặp
    difficulty_level INTEGER NOT NULL DEFAULT 3 CHECK (difficulty_level BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bảng 5: topic_edges (Cạnh nối Đồ thị tri thức Knowledge Graph)
CREATE TABLE IF NOT EXISTS public.topic_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_topic_id UUID NOT NULL REFERENCES public.academic_topics(id) ON DELETE CASCADE,
    target_topic_id UUID NOT NULL REFERENCES public.academic_topics(id) ON DELETE CASCADE,
    relation_type TEXT NOT NULL DEFAULT 'RELATED' CHECK (relation_type IN ('PREREQUISITE', 'RELATED', 'SUB_CONCEPT')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_topic_edge UNIQUE (source_topic_id, target_topic_id),
    CONSTRAINT chk_no_self_loop CHECK (source_topic_id <> target_topic_id)
);

-- Bảng 6: academic_materials (Tài liệu học thuật & RAG Embeddings)
CREATE TABLE IF NOT EXISTS public.academic_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES public.academic_topics(id) ON DELETE CASCADE,
    uploaded_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    source_type TEXT NOT NULL DEFAULT 'TEXT_NOTE' CHECK (source_type IN ('PDF', 'SLIDE', 'URL', 'TEXT_NOTE')),
    storage_file_path TEXT,
    extracted_text TEXT,
    embedding vector(1536), -- Vector 1536 chiều cho OpenAI / Gemini Embeddings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- PHÂN HỆ 3: TÁC NHÂN AI & PHIÊN HỌC (PERSONAS & LEARNING SESSIONS)
-- ==============================================================================

-- Bảng 7: personas (Nhân vật AI người nghe phản biện)
CREATE TABLE IF NOT EXISTS public.personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role_badge TEXT NOT NULL,
    avatar_url TEXT,
    system_prompt TEXT NOT NULL,
    curiosity_level INTEGER NOT NULL DEFAULT 80 CHECK (curiosity_level BETWEEN 0 AND 100),
    preferred_metaphors JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_system_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bảng 8: learning_sessions (Phiên học thử thách Feynman)
CREATE TABLE IF NOT EXISTS public.learning_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES public.academic_topics(id) ON DELETE SET NULL,
    persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE RESTRICT,
    custom_topic_title TEXT,
    difficulty TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'ABANDONED')),
    current_clarity INTEGER NOT NULL DEFAULT 0 CHECK (current_clarity BETWEEN 0 AND 100),
    turn_count INTEGER NOT NULL DEFAULT 0,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Bảng 9: session_messages (Lịch sử hội thoại trong phiên)
CREATE TABLE IF NOT EXISTS public.session_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.learning_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    audio_storage_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bảng 10: agent_analysis_logs (Kết quả phân tích ngầm Tầng 1 của Agent)
CREATE TABLE IF NOT EXISTS public.agent_analysis_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID UNIQUE NOT NULL REFERENCES public.session_messages(id) ON DELETE CASCADE,
    jargons_detected JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ "term": "...", "isExplainedSimply": false, "reason": "..." }]
    logic_gap_found TEXT,
    detected_analogy TEXT,
    turn_clarity_score INTEGER NOT NULL DEFAULT 0 CHECK (turn_clarity_score BETWEEN 0 AND 100),
    concepts_covered JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- PHÂN HỆ 4: ĐÁNH GIÁ & KHO ÔN TẬP (EVALUATION & SPACED REPETITION VAULT)
-- ==============================================================================

-- Bảng 11: evaluation_reports (Thẻ điểm Feynman Mastery Card)
CREATE TABLE IF NOT EXISTS public.evaluation_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID UNIQUE NOT NULL REFERENCES public.learning_sessions(id) ON DELETE CASCADE,
    clarity_score INTEGER NOT NULL CHECK (clarity_score BETWEEN 0 AND 100),
    logic_completeness INTEGER NOT NULL CHECK (logic_completeness BETWEEN 0 AND 100),
    accuracy_score INTEGER NOT NULL DEFAULT 80 CHECK (accuracy_score BETWEEN 0 AND 100),
    best_analogy TEXT,
    knowledge_gaps JSONB NOT NULL DEFAULT '[]'::jsonb,
    summary_feedback TEXT NOT NULL,
    share_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bảng 12: jargon_vault_cards (Kho thẻ từ vựng chuyên ngành đã bình dân hóa - Thuật toán SM-2)
CREATE TABLE IF NOT EXISTS public.jargon_vault_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES public.academic_topics(id) ON DELETE SET NULL,
    jargon_term TEXT NOT NULL,
    plain_explanation TEXT NOT NULL,
    analogy_used TEXT,
    mastery_level INTEGER NOT NULL DEFAULT 1 CHECK (mastery_level BETWEEN 1 AND 5),
    next_review_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (timezone('utc'::text, now()) + INTERVAL '1 day'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- TỐI ƯU HÓA CHỈ MỤC (INDEXES CHO FOREIGN KEYS & TRUY VẤN TỐC ĐỘ CAO)
-- ==============================================================================

-- Profiles & AI Config
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_primary_domain ON public.profiles(primary_domain_id);
CREATE INDEX IF NOT EXISTS idx_user_ai_configs_user_id ON public.user_ai_configs(user_id);

-- Knowledge Graph
CREATE INDEX IF NOT EXISTS idx_academic_topics_domain_id ON public.academic_topics(domain_id);
CREATE INDEX IF NOT EXISTS idx_academic_topics_slug ON public.academic_topics(slug);
CREATE INDEX IF NOT EXISTS idx_topic_edges_source ON public.topic_edges(source_topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_edges_target ON public.topic_edges(target_topic_id);

-- Academic Materials & Vector Search
CREATE INDEX IF NOT EXISTS idx_academic_materials_topic_id ON public.academic_materials(topic_id);
CREATE INDEX IF NOT EXISTS idx_academic_materials_uploaded_by ON public.academic_materials(uploaded_by_id);
CREATE INDEX IF NOT EXISTS idx_academic_materials_embedding ON public.academic_materials USING hnsw (embedding vector_cosine_ops);

-- Personas & Sessions
CREATE INDEX IF NOT EXISTS idx_personas_slug ON public.personas(slug);
CREATE INDEX IF NOT EXISTS idx_personas_creator ON public.personas(creator_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_id ON public.learning_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_topic_id ON public.learning_sessions(topic_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_persona_id ON public.learning_sessions(persona_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_status ON public.learning_sessions(status);
CREATE INDEX IF NOT EXISTS idx_session_messages_session_id ON public.session_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_session_messages_created_at ON public.session_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_analysis_logs_message_id ON public.agent_analysis_logs(message_id);

-- Evaluation & Vault
CREATE INDEX IF NOT EXISTS idx_evaluation_reports_session_id ON public.evaluation_reports(session_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_reports_share_token ON public.evaluation_reports(share_token);
CREATE INDEX IF NOT EXISTS idx_jargon_vault_cards_user_id ON public.jargon_vault_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_jargon_vault_cards_topic_id ON public.jargon_vault_cards(topic_id);
CREATE INDEX IF NOT EXISTS idx_jargon_vault_cards_next_review ON public.jargon_vault_cards(next_review_at);

-- ==============================================================================
-- TRIGGER SUPABASE AUTH: TỰ ĐỘNG TẠO PROFILES & USER_AI_CONFIGS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;

    INSERT INTO public.user_ai_configs (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gắn Trigger vào bảng auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- CHÍNH SÁCH BẢO MẬT HÀNG (ROW LEVEL SECURITY - RLS)
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ai_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_analysis_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jargon_vault_cards ENABLE ROW LEVEL SECURITY;

-- 1. Profiles: Xem mọi người, chỉ sửa hồ sơ của chính mình
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. User AI Configs: Chỉ chủ sở hữu xem & chỉnh sửa
CREATE POLICY "Users can view own AI config" ON public.user_ai_configs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own AI config" ON public.user_ai_configs FOR ALL USING (auth.uid() = user_id);

-- 3. Academic Domains, Topics, Edges: Cho phép tất cả mọi người đọc
CREATE POLICY "Academic domains are viewable by everyone" ON public.academic_domains FOR SELECT USING (true);
CREATE POLICY "Academic topics are viewable by everyone" ON public.academic_topics FOR SELECT USING (true);
CREATE POLICY "Topic edges are viewable by everyone" ON public.topic_edges FOR SELECT USING (true);

-- 4. Academic Materials: Đọc công khai, người tải lên có quyền quản lý
CREATE POLICY "Materials are viewable by everyone" ON public.academic_materials FOR SELECT USING (true);
CREATE POLICY "Users can insert materials" ON public.academic_materials FOR INSERT WITH CHECK (auth.uid() = uploaded_by_id);

-- 5. Personas: Mặc định hệ thống hoặc do người dùng tạo
CREATE POLICY "Personas are viewable by everyone" ON public.personas FOR SELECT USING (is_system_default = true OR auth.uid() = creator_id);
CREATE POLICY "Users can create personas" ON public.personas FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update own personas" ON public.personas FOR UPDATE USING (auth.uid() = creator_id);

-- 6. Learning Sessions: Chỉ chủ sở hữu xem & quản lý
CREATE POLICY "Users can view own sessions" ON public.learning_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own sessions" ON public.learning_sessions FOR ALL USING (auth.uid() = user_id);

-- 7. Session Messages & Logs: Dựa theo quyền sở hữu phiên
CREATE POLICY "Users can view messages of own sessions" ON public.session_messages
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.learning_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()));
CREATE POLICY "Users can insert messages into own sessions" ON public.session_messages
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.learning_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()));

CREATE POLICY "Users can view analysis logs of own sessions" ON public.agent_analysis_logs
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.session_messages m
        JOIN public.learning_sessions s ON s.id = m.session_id
        WHERE m.id = message_id AND s.user_id = auth.uid()
    ));

-- 8. Evaluation Reports: Xem báo cáo của mình hoặc qua share_token công khai
CREATE POLICY "Users can view own reports or via share token" ON public.evaluation_reports
    FOR SELECT USING (
        share_token IS NOT NULL OR
        EXISTS (SELECT 1 FROM public.learning_sessions s WHERE s.id = session_id AND s.user_id = auth.uid())
    );

-- 9. Jargon Vault Cards: Chỉ chủ thẻ quản lý thẻ ôn tập của mình
CREATE POLICY "Users can view and manage own vault cards" ON public.jargon_vault_cards
    FOR ALL USING (auth.uid() = user_id);

-- ==============================================================================
-- COMPATIBILITY VIEWS (HỖ TRỢ TƯƠNG THÍCH MÃ NGUỒN CŨ NẾU CÓ)
-- ==============================================================================

CREATE OR REPLACE VIEW public.sessions AS
SELECT 
    id, 
    COALESCE(custom_topic_title, 'General') AS topic, 
    persona_id, 
    difficulty, 
    status, 
    current_clarity AS clarity_score, 
    started_at AS created_at
FROM public.learning_sessions;

CREATE OR REPLACE VIEW public.messages AS
SELECT 
    id, 
    session_id, 
    role, 
    content, 
    NULL::jsonb AS analysis_metadata, 
    created_at
FROM public.session_messages;

CREATE OR REPLACE VIEW public.vault_items AS
SELECT 
    id, 
    jargon_term AS term, 
    plain_explanation, 
    analogy_used, 
    'General' AS topic, 
    created_at
FROM public.jargon_vault_cards;

