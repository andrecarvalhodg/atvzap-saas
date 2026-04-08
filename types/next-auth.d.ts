import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      plan: string
      trialEndsAt: Date | null
      stripeSubscriptionId: string | null
    } & DefaultSession["user"]
  }
}
