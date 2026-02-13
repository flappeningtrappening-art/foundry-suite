import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { caseId, documentIds } = await request.json();

  if (!caseId || !documentIds || documentIds.length < 2) {
    return new NextResponse("Missing caseId or at least two documentIds", { status: 400 });
  }

  try {
    const analyticServiceUrl = process.env.ANALYTIC_SERVICE_URL?.replace("/analyze", "/contradictions") || "http://localhost:8000/api/v1/contradictions";
    
    const response = await fetch(analyticServiceUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        case_id: caseId,
        user_id: user.id,
        document_ids: documentIds,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Contradiction Engine failed");
    }

    const data = await response.json();

    return NextResponse.json({ 
      analysis: data.report, 
      sources: data.citations 
    });

  } catch (error: any) {
    console.error("Contradiction Engine Error:", error);
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
