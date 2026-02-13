const Stripe = require('stripe');

// Use placeholder during build if key is missing
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");

/**
 * Creates a Stripe Checkout Session for a subscription.
 * @param {string} customerEmail - The email of the user from Supabase.
 * @param {string} userId - The Supabase UUID of the user.
 * @param {string} priceId - The Stripe Price ID for the "Pro" plan.
 * @param {string} successUrl - Where to redirect after payment.
 * @param {string} cancelUrl - Where to redirect if they cancel.
 */
async function createCheckoutSession({ customerEmail, userId, priceId, successUrl, cancelUrl }) {
  const session = await stripe.checkout.sessions.create({
    customer_email: customerEmail,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      supabase_user_id: userId,
    },
  });

  return session.url;
}

module.exports = {
  createCheckoutSession,
  stripe,
};
