import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { caseId, findingId } = await request.json();

  if (!caseId || !findingId) {
    return new NextResponse("Missing caseId or findingId", { status: 400 });
  }

  try {
    const analyticServiceUrl = process.env.ANALYTIC_SERVICE_URL?.replace("/analyze", "/root-cause") || "http://localhost:8000/api/v1/root-cause";
    
    const response = await fetch(analyticServiceUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        case_id: caseId,
        user_id: user.id,
        finding_id: findingId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "5-Why Agent failed");
    }

    const data = await response.json();

    return NextResponse.json({ 
      report: data.report,
      metadata: data.metadata 
    });

  } catch (error: any) {
    console.error("5-Why Agent Error:", error);
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
