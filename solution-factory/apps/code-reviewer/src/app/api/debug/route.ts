import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  
  try {
    // 1. Check Document Count
    const { count: docCount, error: docError } = await supabase
      .from("case_documents")
      .select("*", { count: "exact", head: true });

    // 2. Check Section (Chunk) Count
    const { count: sectionCount, error: sectionError } = await supabase
      .from("document_sections")
      .select("*", { count: "exact", head: true });

    // 3. Check a sample section to verify embedding existence and dimensions
    const { data: sampleSection, error: sampleError } = await supabase
      .from("document_sections")
      .select("id, embedding, content")
      .limit(1)
      .maybeSingle();

    let embeddingDim = 0;
    if (sampleSection && sampleSection.embedding) {
        // Parse if it's a string, or check length if it's an array
        try {
            const vec = typeof sampleSection.embedding === 'string' 
                ? JSON.parse(sampleSection.embedding) 
                : sampleSection.embedding;
            embeddingDim = vec.length;
        } catch (e) {
            console.error("Error parsing embedding:", e);
        }
    }

    return NextResponse.json({
      status: "debug_complete",
      counts: {
        documents: docCount,
        sections: sectionCount
      },
      sample: {
        id: sampleSection?.id,
        content_preview: sampleSection?.content?.substring(0, 50),
        embedding_exists: !!sampleSection?.embedding,
        embedding_dimensions: embeddingDim
      },
      errors: {
        docError: docError?.message,
        sectionError: sectionError?.message,
        sampleError: sampleError?.message
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
