-- THE FOUNDRY | MASTER VECTOR REBUILD (TPS v1.0)
-- This script clears the '3072 dimension' ghost by dropping all indexes and functions
-- and rebuilding them strictly for 768 dimensions (Gemini standard).

-- 1. DROP ALL POTENTIAL VECTOR INDEXES
-- We drop these to clear the dimension mismatch error
DROP INDEX IF EXISTS document_sections_embedding_idx;
DROP INDEX IF EXISTS document_sections_embedding_hnsw_idx;

-- 2. DROP AND RE-CREATE RPC FUNCTIONS
DROP FUNCTION IF EXISTS public.match_document_sections(vector, double precision, integer, uuid);
DROP FUNCTION IF EXISTS public.hybrid_search(text, vector, integer, double precision, double precision, integer);

-- 3. REBUILD: match_document_sections (Strict 768)
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

-- 4. REBUILD: hybrid_search (Strict 768)
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

-- 5. RE-CREATE INDEX (Strict 768 dimension)
-- Using HNSW for performance
CREATE INDEX ON document_sections USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
