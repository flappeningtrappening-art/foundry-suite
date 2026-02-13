import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runFlow } from "@/lib/genkit";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { recipientInfo, myProduct, valueProp, cta, tone, styleId, caseId } = await request.json();

  if (!recipientInfo) {
    return new NextResponse(JSON.stringify({ error: "Recipient info is required" }), {
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
      .eq("tool_name", "email")
      .gte("created_at", today);

    if (count !== null && count >= 3) {
      return new NextResponse(
        JSON.stringify({
          error: "Free limit reached (3/3). Please upgrade to Pro for unlimited emails.",
          isQuotaExceeded: true
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  // Fetch Style Samples if provided
  let styleSamples: string[] = [];
  if (styleId) {
    const { data: samples } = await supabase
      .from("voice_samples")
      .select("content")
      .eq("profile_id", styleId)
      .limit(5);      
    if (samples && samples.length > 0) {
      styleSamples = samples.map(s => s.content);
    }
  }

  try {
    // DELEGATE TO GENKIT MICROSERVICE
    const result = await runFlow<any, any>('coldEmailFlow', {
      recipientInfo,
      myProduct,
      valueProp,
      cta,
      tone,
      styleSamples: styleSamples.length > 0 ? styleSamples : undefined,
      caseId: caseId || "00000000-0000-0000-0000-000000000000",
      userId: user.id
    });

    // Log Usage
    await supabase.from("usage_logs").insert({
      user_id: user.id,
      tool_name: "email"
    });

    return new NextResponse(JSON.stringify({ 
      email: result.email,
      sources: result.sources 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Genkit/Email Error:", error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}