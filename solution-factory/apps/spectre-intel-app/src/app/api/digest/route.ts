import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { documentId } = await request.json();

  if (!documentId) {
    return new NextResponse("Missing documentId", { status: 400 });
  }

  // FORCE REBUILD: Fix for previous syntax error
  try {
    // Call the NEW robust Python Ingestion Endpoint
    const ingestUrl = process.env.ANALYTIC_SERVICE_URL?.replace("/analyze", "/ingest/process-document") 
                      || "http://localhost:8000/api/v1/ingest/process-document";
    
    console.log(`📡 Triggering Ingestion for ${documentId} at ${ingestUrl}`);

    const response = await fetch(ingestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        document_id: documentId,
        user_id: user.id
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Ingestion Service failed");
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Ingestion Proxy Error:", error);
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
