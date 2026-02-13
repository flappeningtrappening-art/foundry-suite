import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Admin Client to create functions
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // Drop the old function first (optional, but good for cleanliness if signature changes)
    await supabaseAdmin.rpc("drop_function_if_exists", { function_name: "match_document_sections" });

    const createRpcQuery = `
      create or replace function match_document_sections (
        query_embedding vector(768),
        match_threshold float,
        match_count int,
        filter_case_id uuid
      )
      returns table (
        id bigint,
        content text,
        similarity float,
        file_name text
      )
      language plpgsql
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
    `;

    // Note: Supabase JS client doesn't support raw SQL easily without a specific "rpc" wrapper or using the pg library.
    // However, if we don't have direct SQL access, we might need to rely on the user manually adding this, OR we can try to "fetch" filenames in the application layer if we can't run DDL here.
    
    // WAIT: The user cannot easily run SQL from here if I don't have a "run_sql" tool.
    // STRATEGY CHANGE: 
    // Instead of forcing a migration (which might fail if I can't execute raw SQL), 
    // I will implement the "Application Layer Join" in api/analyze/route.ts.
    // It is slightly less efficient but 100% reliable without DDL access.
    
    return NextResponse.json({ message: "Migration skipped - using App Layer Join" });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
