import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  // Delete all documents that are stuck in "indexing"
  const { error } = await supabase
    .from("case_documents")
    .delete()
    .eq("metadata->>status", "indexing");

  if (error) {
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Cleared stuck uploads." });
}
