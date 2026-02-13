-- THE FOUNDRY | MASTER DATABASE CONSOLIDATED FIX (v1.6)
-- PERFORMANCE & SECURITY HARDENING - FINAL STABLE VERSION

-- 1. DROP FUNCTIONS (Prevent signature mismatch)
DROP FUNCTION IF EXISTS public.match_document_sections(vector, double precision, integer, uuid);
DROP FUNCTION IF EXISTS public.hybrid_search(text, vector, integer, double precision, double precision, integer);

-- 2. CREATE MISSING TABLES
CREATE TABLE IF NOT EXISTS forensic_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    case_id UUID REFERENCES analysis_cases(id) ON DELETE CASCADE,
    query TEXT,
    prosecutor_findings TEXT,
    skeptic_critique TEXT,
    final_report TEXT,
    citations JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shared_intelligence_vault (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES analysis_cases(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    finding_type TEXT NOT NULL,
    source_agent TEXT NOT NULL,
    content TEXT NOT NULL,
    confidence_score FLOAT DEFAULT 1.0,
    citations JSONB DEFAULT '[]',
    tags TEXT[] DEFAULT '{}',
    muda_flag BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PERFORMANCE: INDEXING (Clears "Unindexed foreign keys" warnings)
CREATE INDEX IF NOT EXISTS idx_analysis_cases_user_id ON public.analysis_cases(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_findings_case_id ON public.analysis_findings(case_id);
CREATE INDEX IF NOT EXISTS idx_case_documents_case_id ON public.case_documents(case_id);
CREATE INDEX IF NOT EXISTS idx_case_documents_user_id ON public.case_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_document_sections_case_id ON public.document_sections(case_id);
CREATE INDEX IF NOT EXISTS idx_document_sections_document_id ON public.document_sections(document_id);
CREATE INDEX IF NOT EXISTS idx_document_sections_user_id ON public.document_sections(user_id);
CREATE INDEX IF NOT EXISTS idx_forensic_audit_logs_case_id ON public.forensic_audit_logs(case_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_profiles_user_id ON public.voice_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_samples_profile_id ON public.voice_samples(profile_id);
CREATE INDEX IF NOT EXISTS idx_voice_samples_user_id ON public.voice_samples(user_id);

-- 4. RLS POLICIES (Performance Optimized Syntax)
-- We use (SELECT auth.uid()) to force a single evaluation per query
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users can view own subscription" ON public.subscriptions;
CREATE POLICY "users can view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = (SELECT auth.uid()));

ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own usage" ON public.usage_logs;
CREATE POLICY "Users can view own usage" ON public.usage_logs FOR SELECT USING (auth.uid() = (SELECT auth.uid()));
DROP POLICY IF EXISTS "Users can insert own usage" ON public.usage_logs;
CREATE POLICY "Users can insert own usage" ON public.usage_logs FOR INSERT WITH CHECK (auth.uid() = (SELECT auth.uid()));

ALTER TABLE public.case_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Foundry User Access" ON public.case_documents;
DROP POLICY IF EXISTS "Users manage own case documents" ON public.case_documents;
DROP POLICY IF EXISTS "Users can view their own documents" ON public.case_documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON public.case_documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.case_documents;
DROP POLICY IF EXISTS "Service role can do everything" ON public.case_documents;
CREATE POLICY "Foundry User Access" ON public.case_documents FOR ALL USING ((auth.uid() = (SELECT auth.uid())) OR (auth.role() = (SELECT 'service_role')));

ALTER TABLE public.forensic_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.forensic_audit_logs;
CREATE POLICY "Users can view their own audit logs" ON public.forensic_audit_logs FOR SELECT USING (auth.uid() = (SELECT auth.uid()));
DROP POLICY IF EXISTS "Users can insert their own audit logs" ON public.forensic_audit_logs;
CREATE POLICY "Users can insert their own audit logs" ON public.forensic_audit_logs FOR INSERT WITH CHECK ((auth.uid() = (SELECT auth.uid())) OR (auth.role() = (SELECT 'service_role')));

ALTER TABLE public.shared_intelligence_vault ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own case intelligence" ON public.shared_intelligence_vault;
CREATE POLICY "Users can view their own case intelligence" ON public.shared_intelligence_vault FOR SELECT USING (auth.uid() = (SELECT auth.uid()));
DROP POLICY IF EXISTS "Users can insert their own case intelligence" ON public.shared_intelligence_vault;
CREATE POLICY "Users can insert their own case intelligence" ON public.shared_intelligence_vault FOR INSERT WITH CHECK ((auth.uid() = (SELECT auth.uid())) OR (auth.role() = (SELECT 'service_role')));

-- 5. RE-CREATE: match_document_sections (UUID & Forensic Fix)
CREATE OR REPLACE FUNCTION public.match_document_sections (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_case_id uuid
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  similarity float,
  file_name text
)
language plpgsql
SET search_path = public
as $$
begin
  return query
  select
    document_sections.id,
    document_sections.document_id,
    document_sections.content,
    1 - (document_sections.embedding <=> query_embedding) as similarity,
    case_documents.file_name
  from document_sections
  join case_documents on document_sections.document_id = case_documents.id
  where 1 - (document_sections.embedding <=> query_embedding) > match_threshold
  and (document_sections.case_id = filter_case_id OR filter_case_id = '00000000-0000-0000-0000-000000000000')
  order by document_sections.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- 6. RE-CREATE: hybrid_search
CREATE OR REPLACE FUNCTION public.hybrid_search(
  query_text text,
  query_embedding vector(768),
  match_count int,
  full_text_weight float default 1.0,
  semantic_weight float default 1.0,
  rrf_k int default 50
)
returns setof public.document_sections
language sql
SET search_path = public
as $$
with full_text as (
  select
    id,
    row_number() over(order by ts_rank_cd(fts, websearch_to_tsquery(query_text)) desc) as rank_ix
  from
    document_sections
  where
    fts @@ websearch_to_tsquery(query_text)
  order by rank_ix
  limit least(match_count, 30) * 2
),
semantic as (
  select
    id,
    row_number() over (order by embedding <#> query_embedding) as rank_ix
  from
    document_sections
  order by rank_ix
  limit least(match_count, 30) * 2
)
select
  document_sections.*
from
  full_text
  full outer join semantic
    on full_text.id = semantic.id
  join document_sections
    on coalesce(full_text.id, semantic.id) = document_sections.id
order by
  coalesce(1.0 / (rrf_k + full_text.rank_ix), 0.0) * full_text_weight +
  coalesce(1.0 / (rrf_k + semantic.rank_ix), 0.0) * semantic_weight
  desc
limit
  least(match_count, 30)
$$;