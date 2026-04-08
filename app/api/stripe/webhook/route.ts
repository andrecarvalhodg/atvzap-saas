export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import Stripe from "stripe"

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error(`Webhook signature verification failed: ${message}`)
    return NextResponse.json({ error: message }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        const customerEmail = session.customer_details?.email
        if (!customerEmail) break

        const subscriptionId = session.subscription as string
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)

        // Stripe SDK v20+: current_period_end removed from Subscription
        // Use latest_invoice.period_end instead
        let periodEnd: Date | null = null
        if (subscription.latest_invoice) {
          const invoiceId = typeof subscription.latest_invoice === "string"
            ? subscription.latest_invoice
            : subscription.latest_invoice.id
          const invoice = await stripe.invoices.retrieve(invoiceId)
          if (invoice.period_end) {
            periodEnd = new Date(invoice.period_end * 1000)
          }
        }

        await db.user.update({
          where: { email: customerEmail },
          data: {
            plan: "PRO",
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0]?.price.id,
            stripeCurrentPeriodEnd: periodEnd,
          },
        })
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice

        // Stripe SDK v20+: invoice.subscription changed to invoice.parent.subscription_details
        const parent = (invoice as any).parent
        const subscriptionId = (parent?.subscription_details?.subscription as string | undefined)
          ?? (parent?.subscription as string | undefined)

        if (!subscriptionId) break

        const inv = invoice as any
        await db.user.update({
          where: { stripeSubscriptionId: subscriptionId },
          data: {
            stripePriceId: inv.lines?.data?.[0]?.price?.id ?? undefined,
            stripeCurrentPeriodEnd: inv.period_end
              ? new Date(inv.period_end * 1000)
              : undefined,
          },
        })
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription

        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id

        await db.user.update({
          where: { stripeCustomerId: customerId },
          data: {
            plan: "FREE",
            stripePriceId: null,
            stripeSubscriptionId: null,
            stripeCurrentPeriodEnd: null,
          },
        })
        break
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error(`Webhook handler error: ${message}`)
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
