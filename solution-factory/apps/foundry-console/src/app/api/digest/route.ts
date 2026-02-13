import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!); 

const supabaseAdmin = createAdminClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { documentId } = await request.json();

  try {
    const { data: doc } = await supabase
      .from("case_documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (!doc) throw new Error("Document not found");

    // 1. Download the PDF from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("case-files")
      .download(doc.storage_path);

    if (downloadError) throw downloadError;

    // 2. Send to Python Service for Forensic Parsing
    const analyticBaseUrl = process.env.ANALYTIC_SERVICE_URL?.replace("/api/v1/analyze", "") || "http://localhost:8000";
    const formData = new FormData();
    const blob = new Blob([fileData], { type: "application/pdf" });
    formData.append("file", blob, doc.file_name);

    const parseResponse = await fetch(`${analyticBaseUrl}/api/v1/ingest/parse-pdf`, {
      method: "POST",
      body: formData
    });

    if (!parseResponse.ok) {
      const errorText = await parseResponse.text();
      throw new Error(`Python Ingest Node failed: ${errorText}`);
    }

    const parseData = await parseResponse.json();
    const markdown = parseData.markdown || "";
    const page_count = parseData.page_count || 1;

    // 3. Process markdown into chunks and embed
    // We use text-embedding-004 which Gemini likes for forensic accuracy
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    
    // Split by double newlines or logical sections
    const chunks = markdown.split(/\n\n+/).filter((c: string) => c.trim().length > 50);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i].trim();
      
      try {
        const result = await model.embedContent(chunk);
        const embedding = result.embedding.values;

        await supabaseAdmin.from("document_sections").insert({
          document_id: documentId,
          case_id: doc.case_id,
          user_id: user.id,
          content: `[Section: ${i + 1}] ${chunk}`,
          embedding: embedding,
          metadata: { section: i + 1, engine: "robust_v1" }
        });
      } catch (embedError) {
        console.error(`Embedding failed for chunk ${i}:`, embedError);
      }
    }

    // 4. Update the document record
    await supabaseAdmin
      .from("case_documents")
      .update({
        content_text: markdown,
        metadata: { status: "ready", pages: page_count, engine: "robust_v1" }
      })
      .eq("id", documentId);

    return NextResponse.json({ success: true, chunks: chunks.length });

  } catch (error: any) {
    console.error("Hub Digest Error:", error);
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }
}