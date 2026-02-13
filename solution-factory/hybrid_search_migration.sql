-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- 1. Add a Full Text Search (FTS) column to document_sections
-- We use 'english' configuration, but you can adapt this.
-- This column is automatically updated whenever 'content' changes.
alter table document_sections
add column if not exists fts tsvector generated always as (to_tsvector('english', content)) stored;

-- 2. Create a GIN index for fast keyword search
create index if not exists document_sections_fts_idx on document_sections using gin (fts);

-- 3. Create the Hybrid Search Function
-- This combines Vector Similarity (Semantic) with Full Text Search (Keyword)
-- using Reciprocal Rank Fusion (RRF) to sort the best matches to the top.
create or replace function hybrid_search(
  query_text text,
  query_embedding vector(768), -- Adjust dimension if using OpenAI (1536) or Gemini (768)
  match_count int,
  full_text_weight float default 1.0,
  semantic_weight float default 1.0,
  rrf_k int default 50
)
returns setof document_sections
language sql
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
