import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
  // 1. Check for API Key
  if (!process.env.GEMINI_API_KEY) {
    return new NextResponse(
      JSON.stringify({
        error:
          "Missing GEMINI_API_KEY. Please add it to your .env.local file.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // 2. Check for authenticated user
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

  // 3. Get the topic and style from the request body
  const { topic, styleId } = await request.json();

  if (!topic) {
    return new NextResponse(JSON.stringify({ error: "Topic is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 4. Check Subscription and Usage
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

  // 5. Fetch Style Samples if provided
  let styleInstructions = "";
  if (styleId) {
    const { data: samples } = await supabase
      .from("voice_samples")
      .select("content")
      .eq("profile_id", styleId)
      .limit(5);
    
    if (samples && samples.length > 0) {
      styleInstructions = `
      CRITICAL: You must mimic the following writing style exactly. 
      Pay attention to the sentence length, vocabulary choice, use of emojis, and overall rhythm.
      
      EXAMPLES OF THE TARGET STYLE:
      ${samples.map((s, i) => `Sample ${i+1}: "${s.content}"`).join("\n\n")}
      
      Now, apply this exact style to the new thread below.`;
    }
  }

  // 6. Call the Gemini AI model
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `You are an expert content creator specializing in viral Twitter threads.
    Your task is to generate a compelling, engaging, and well-structured Twitter thread based on the following topic.

    Topic: "${topic}"
    ${styleInstructions}

    Instructions:
    1.  **Hook:** Start with a strong, attention-grabbing hook in the first tweet.
    2.  **Structure:** The thread must have between 5 and 10 tweets.
    3.  **Numbering:** Each tweet in the thread should be numbered (e.g., 1/, 2/, 3/).
    4.  **Clarity:** Write in a clear, concise, and easy-to-read style. Use simple language.
    5.  **Formatting:** Use line breaks and emojis to improve readability.
    6.  **Hashtags:** Include 2-3 relevant hashtags at the end of the last tweet.
    7.  **CTA:** End the thread with a clear call-to-action.
    8.  **Output Format:** Separate each tweet with two newline characters ('\\n\\n').

    Generate the thread now.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const thread = response.text();

    // 7. Log Usage
    await supabase.from("usage_logs").insert({
      user_id: user.id,
      tool_name: "twitter"
    });

    return new NextResponse(JSON.stringify({ thread }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to generate thread." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
