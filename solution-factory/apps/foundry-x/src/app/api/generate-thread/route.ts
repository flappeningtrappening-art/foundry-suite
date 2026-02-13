import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { topic, styleId, documentIds, caseId } = await request.json();

  if (!topic) {
    return new NextResponse(JSON.stringify({ error: "Topic is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Check Subscription and Usage
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  if (!subscription) {
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from("usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("tool_name", "twitter-thread")
      .gte("created_at", today);

    if (count !== null && count >= 3) {
      return new NextResponse(
        JSON.stringify({
          error: "Free limit reached (3/3). Please upgrade to Pro for unlimited threads.",
          isQuotaExceeded: true
        }),
        { 
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  // Fetch Style Samples
  let styleInstructions = "";
  if (styleId) {
    const { data: samples } = await supabase
      .from("voice_samples")
      .select("content")
      .eq("profile_id", styleId)
      .limit(5);      
    if (samples && samples.length > 0) {
      styleInstructions = `STYLE REQUIREMENTS: Mimic this voice exactly: ${samples.map(s => s.content).join("\n")}`;
    }
  }

  try {
    // DELEGATE TO INTEL BRAIN (Python Analytic Service)
    const analyticServiceUrl = process.env.ANALYTIC_SERVICE_URL || "http://localhost:8000/api/v1/analyze";
    
    // Construct a forensic content prompt
    const forensicQuery = `
      TASK: Generate a high-impact, viral Twitter (X) thread (7-10 tweets) about: "${topic}".
      
      ${styleInstructions}
      
      FORENSIC GOAL: 
      1. Cross-reference the topic with the uploaded source documents.
      2. Extract specific "Data Nuggets", "Timeline Events", or "Critical Stats" from the documents.
      3. Weave these forensic facts into the thread to establish authority.
      4. Use a strong hook for the first tweet.
      
      OUTPUT FORMAT:
      - A cohesive thread of 7-10 tweets.
      - Use LaTeX for any technical formulas.
      - Cite source page numbers for any specific facts extracted.
    `;

    const response = await fetch(analyticServiceUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: forensicQuery,
        case_id: caseId || "thread-context", 
        user_id: user.id,
        include_general_knowledge: true
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Analytic Service failed");
    }

    const data = await response.json();

    // Log Usage
    await supabase.from("usage_logs").insert({
      user_id: user.id,
      tool_name: "twitter-thread"
    });

    return new NextResponse(JSON.stringify({ 
      thread: data.report,
      sources: data.citations 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error(error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}