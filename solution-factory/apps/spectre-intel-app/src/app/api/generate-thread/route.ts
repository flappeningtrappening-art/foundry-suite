import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runFlow } from "@/lib/genkit";

export async function POST(request: Request) {
  // 1. Check for authenticated user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Get the topic and style from the request body
  const { topic, styleId } = await request.json();

  if (!topic) {
    return new NextResponse(JSON.stringify({ error: "Topic is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 3. Check Subscription and Usage
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  if (!subscription) {
    // Check free usage count for today
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from("usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("tool_name", "twitter")
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

  // 4. Fetch Style Samples if provided
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

  // 5. Call the Genkit Microservice
  try {
    // We delegate the logic to our centralized Genkit Flow
    const result = await runFlow<{ topic: string; styleSamples?: string[] }, { thread: string }>(
      'threadGeneratorFlow', 
      { 
        topic, 
        styleSamples: styleSamples.length > 0 ? styleSamples : undefined 
      }
    );

    // 6. Log Usage
    await supabase.from("usage_logs").insert({
      user_id: user.id,
      tool_name: "twitter"
    });

    return new NextResponse(JSON.stringify({ thread: result.thread }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Genkit Error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to generate thread via AI Service." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
