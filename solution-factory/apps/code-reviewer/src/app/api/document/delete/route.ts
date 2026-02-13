import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { documentId } = await request.json();

  if (!documentId) return new NextResponse("Missing ID", { status: 400 });

  // 1. Delete DB Record (Cascade should handle sections, but explicit is fine)
  const { error } = await supabase
    .from("case_documents")
    .delete()
    .eq("id", documentId);

  if (error) {
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return NextResponse.json({ success: true });
}
