-- THE FOUNDRY | DYNAMIC VECTOR INDEX NUKER (v2.1)
-- Optimized to skip Primary Keys and constraints

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. Loop through all indexes on 'document_sections' 
    -- We EXCLUDE the primary key index to avoid the "cannot drop" error
    FOR r IN (
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'document_sections' 
        AND indexname NOT LIKE '%_pkey'
    ) LOOP
        EXECUTE 'DROP INDEX IF EXISTS public.' || quote_ident(r.indexname);
    END LOOP;
END $$;

-- 2. RE-CREATE the RPC functions strictly for 768 dimensions
DROP FUNCTION IF EXISTS public.match_document_sections(vector, double precision, integer, uuid);
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

-- 3. REBUILD the index strictly for 768 dimensions using HNSW
-- This is the crucial step that aligns the index with Gemini's output
CREATE INDEX document_sections_embedding_hnsw_idx ON document_sections 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
