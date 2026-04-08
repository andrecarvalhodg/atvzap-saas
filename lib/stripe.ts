import Stripe from "stripe"

function createStripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia" as any,
    typescript: true,
  })
}

// Lazy init proxy - only creates client on first use
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    const client = createStripeClient()
    return (client as any)[prop]
  },
})
