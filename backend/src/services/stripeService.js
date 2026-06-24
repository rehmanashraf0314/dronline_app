const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Create a PaymentIntent — called before showing payment sheet to patient
exports.createPaymentIntent = async ({ amount, currency = 'eur', metadata = {} }) => {
  // Stripe works in cents — multiply by 100
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    metadata,
    automatic_payment_methods: { enabled: true },
  });
  return paymentIntent;
};

// Verify webhook signature — called in POST /api/payments/webhook
exports.constructWebhookEvent = (rawBody, signature) => {
  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
};
