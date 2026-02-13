import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
const { createCheckoutSession } = require("../../../../../../packages/payments/src/index.js");

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    const origin = request.headers.get("origin") || "http://localhost:3000";
    
    const checkoutUrl = await createCheckoutSession({
      customerEmail: user.email,
      userId: user.id,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
      successUrl: `${origin}/?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/`,
    });

    return new NextResponse(JSON.stringify({ url: checkoutUrl }), {
      status: 200,
    });
  } catch (error: any) {
    console.error("Stripe Error:", error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
