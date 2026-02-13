import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { query, caseId, includeGeneralKnowledge } = await request.json();

  try {
    // Force trailing slash to prevent 307 redirects
    const analyticServiceUrl = "http://localhost:8000/api/v1/analyze/";

    const response = await fetch(analyticServiceUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        case_id: caseId,
        user_id: user.id,
        include_general_knowledge: includeGeneralKnowledge || false
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Analytic Service failed");
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Hub Analyze Error:", error);
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
