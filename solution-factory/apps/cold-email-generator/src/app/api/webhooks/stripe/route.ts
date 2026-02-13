import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
const { stripe } = require("../../../../../../../packages/payments/src/index.js");

// Use Service Role Key to bypass RLS for administrative database updates
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const requestHeaders = await headers();
  const signature = requestHeaders.get("Stripe-Signature");

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const session = event.data.object;

  // Handle successful checkout
  if (event.type === "checkout.session.completed") {
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    const userId = session.metadata.supabase_user_id;

    const { error } = await supabaseAdmin
      .from("subscriptions")
      .insert({
        user_id: userId,
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        status: "active",
        price_id: subscription.items.data[0].price.id,
      });

    if (error) {
      console.error("Supabase error updating subscription:", error);
      return new NextResponse("Error updating database", { status: 500 });
    }
  }

  // Handle subscription cancellations
  if (event.type === "customer.subscription.deleted") {
    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update({ status: "canceled" })
      .eq("stripe_subscription_id", session.id);

    if (error) {
      console.error("Supabase error canceling subscription:", error);
    }
  }

  return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
}
