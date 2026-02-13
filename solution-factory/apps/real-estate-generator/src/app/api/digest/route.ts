import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { documentId } = await request.json();

    if (!documentId) {
      return new NextResponse(JSON.stringify({ error: "Document ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Forward to Python Analytic Service
    const ingestServiceUrl = process.env.ANALYTIC_SERVICE_URL 
      ? `${process.env.ANALYTIC_SERVICE_URL.replace('/analyze', '')}/ingest/process-document`
      : "http://localhost:8000/api/v1/ingest/process-document";

    console.log(`📡 Triggering Ingestion for ${documentId} at ${ingestServiceUrl}`);

    const response = await fetch(ingestServiceUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_id: documentId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Ingest Service Error:", errorText);
      return new NextResponse(JSON.stringify({ error: "Ingestion failed downstream" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Digest Proxy Error:", error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
