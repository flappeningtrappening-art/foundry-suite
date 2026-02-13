-- FIX: DATA TYPE MISMATCH (v1.2)
-- Run this in the Supabase SQL Editor to fix the match_document_sections function.

-- 1. Drop the function with the incorrect signature
DROP FUNCTION IF EXISTS match_document_sections(vector, double precision, integer, uuid);

-- 2. Re-create with 'uuid' instead of 'bigint' for the ID column
CREATE OR REPLACE FUNCTION match_document_sections (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_case_id uuid
)
returns table (
  id uuid, -- Verified: Your database uses UUIDs for document sections
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
  and (document_sections.case_id = filter_case_id OR filter_case_id = '00000000-0000-0000-0000-000000000000')
  order by document_sections.embedding <=> query_embedding
  limit match_count;
end;
$$;
