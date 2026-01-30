-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================
-- TABLES
-- =====================

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transcription TEXT NOT NULL,
  report_content TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('general', 'soap', 'diagnostic')),
  duration INTEGER NOT NULL, -- seconds
  word_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB,
  UNIQUE (user_id, key)
);

-- =====================
-- INDEXES (recommended)
-- =====================

CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON public.templates(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON public.settings(user_id);

-- =====================
-- ENABLE RLS
-- =====================

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- =====================
-- POLICIES
-- =====================

-- REPORTS
CREATE POLICY "select_own_reports"
ON public.reports
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "insert_own_reports"
ON public.reports
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_reports"
ON public.reports
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_reports"
ON public.reports
FOR DELETE
USING (auth.uid() = user_id);

-- TEMPLATES
CREATE POLICY "select_own_templates"
ON public.templates
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "insert_own_templates"
ON public.templates
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_templates"
ON public.templates
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_templates"
ON public.templates
FOR DELETE
USING (auth.uid() = user_id);

-- SETTINGS
CREATE POLICY "select_own_settings"
ON public.settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "insert_own_settings"
ON public.settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_settings"
ON public.settings
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_settings"
ON public.settings
FOR DELETE
USING (auth.uid() = user_id);
