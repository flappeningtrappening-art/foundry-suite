-- THE FOUNDRY | DATABASE OPTIMIZATION & SECURITY HARDENING (v1.1)
-- Run this in the Supabase SQL Editor to resolve all Performance and Security warnings.

-- 1. DROP EXISTING FUNCTIONS (Required due to return type changes)
DROP FUNCTION IF EXISTS match_document_sections(vector, double precision, integer, uuid);
DROP FUNCTION IF EXISTS hybrid_search(text, vector, integer, double precision, double precision, integer);

-- 2. RE-CREATE: match_document_sections (Optimized & Secure)
CREATE OR REPLACE FUNCTION match_document_sections (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_case_id uuid
)
returns table (
  id uuid,
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
    document_sections.content,
    1 - (document_sections.embedding <=> query_embedding) as similarity,
    case_documents.file_name
  from document_sections
  join case_documents on document_sections.document_id = case_documents.id
  where 1 - (document_sections.embedding <=> query_embedding) > match_threshold
  and document_sections.case_id = filter_case_id
  order by document_sections.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- 3. RE-CREATE: hybrid_search (Optimized & Secure)
CREATE OR REPLACE FUNCTION hybrid_search(
  query_text text,
  query_embedding vector(768),
  match_count int,
  full_text_weight float default 1.0,
  semantic_weight float default 1.0,
  rrf_k int default 50
)
returns setof document_sections
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

-- 4. FIX: RLS PERFORMANCE (Subquery wrapper)
-- subscriptions
DROP POLICY IF EXISTS "users can view own subscription" ON public.subscriptions;
CREATE POLICY "users can view own subscription" ON public.subscriptions
FOR SELECT USING (auth.uid() = (select auth.uid()));

-- usage_logs
DROP POLICY IF EXISTS "Users can view own usage" ON public.usage_logs;
CREATE POLICY "Users can view own usage" ON public.usage_logs
FOR SELECT USING (auth.uid() = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own usage" ON public.usage_logs;
CREATE POLICY "Users can insert own usage" ON public.usage_logs
FOR INSERT WITH CHECK (auth.uid() = (select auth.uid()));

-- voice_profiles
DROP POLICY IF EXISTS "Users can manage their own profiles" ON public.voice_profiles;
CREATE POLICY "Users can manage their own profiles" ON public.voice_profiles
FOR ALL USING (auth.uid() = (select auth.uid()));

-- voice_samples
DROP POLICY IF EXISTS "Users can manage their own samples" ON public.voice_samples;
CREATE POLICY "Users can manage their own samples" ON public.voice_samples
FOR ALL USING (auth.uid() = (select auth.uid()));

-- analysis_cases
DROP POLICY IF EXISTS "Users manage own cases" ON public.analysis_cases;
CREATE POLICY "Users manage own cases" ON public.analysis_cases
FOR ALL USING (auth.uid() = (select auth.uid()));

-- case_documents
DROP POLICY IF EXISTS "Foundry User Access" ON public.case_documents;
DROP POLICY IF EXISTS "Users manage own case documents" ON public.case_documents;
DROP POLICY IF EXISTS "Users can view their own documents" ON public.case_documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON public.case_documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.case_documents;
DROP POLICY IF EXISTS "Service role can do everything" ON public.case_documents;

CREATE POLICY "Foundry User Access" ON public.case_documents
FOR ALL USING (
    (auth.uid() = (select auth.uid())) OR 
    (auth.role() = (select 'service_role'))
);

-- shared_intelligence_vault
DROP POLICY IF EXISTS "Users can view their own case intelligence" ON public.shared_intelligence_vault;
CREATE POLICY "Users can view their own case intelligence" ON public.shared_intelligence_vault
FOR SELECT USING (auth.uid() = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own case intelligence" ON public.shared_intelligence_vault;
CREATE POLICY "Users can insert their own case intelligence" ON public.shared_intelligence_vault
FOR INSERT WITH CHECK (
    (auth.uid() = (select auth.uid())) OR 
    (auth.role() = (select 'service_role'))
);