import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return new NextResponse("Unauthorized", { status: 401 });

      const { data: cases, error } = await supabase
      .from("analysis_cases")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
  if (error) {
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return NextResponse.json({ cases });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { name, description } = await request.json();

    const { data, error } = await supabase
      .from("analysis_cases")
      .insert({
        user_id: user.id,
        name,
        description,
        status: "active"
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ case: data });
  } catch (error: any) {
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
