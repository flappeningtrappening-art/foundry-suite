import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { query, caseId, includeGeneralKnowledge } = await request.json();

  if (!query || !caseId) {
    return new NextResponse("Missing query or caseId", { status: 400 });
  }

  try {
    // Delegate to the Python Analytic Service
    const analyticServiceUrl = process.env.ANALYTIC_SERVICE_URL || "http://localhost:8000/api/v1/analyze";
    
    const response = await fetch(analyticServiceUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        case_id: caseId,
        user_id: user.id, // Pass authenticated user ID
        include_general_knowledge: includeGeneralKnowledge,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Analytic Service failed");
    }

    const data = await response.json();

    // The Python service returns { report, citations, contradictions_found, metadata }
    // We map 'report' to 'analysis' to maintain frontend compatibility
    return NextResponse.json({ 
      analysis: data.report, 
      sources: data.citations,
      contradictions_found: data.contradictions_found 
    });

  } catch (error: any) {
    console.error("Delegated Analysis Error:", error);
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
