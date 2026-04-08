import { db } from "@/lib/db"

export type PlanType = "FREE" | "TRIAL" | "PRO"

export async function getUserPlan(userId: string): Promise<PlanType> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true, trialEndsAt: true, stripeCurrentPeriodEnd: true },
  })
  if (!user) return "FREE"

  if (user.plan === "PRO" && user.stripeCurrentPeriodEnd) {
    if (user.stripeCurrentPeriodEnd > new Date()) return "PRO"
    return "FREE"
  }

  if (user.plan === "TRIAL" && user.trialEndsAt) {
    if (user.trialEndsAt > new Date()) return "TRIAL"
    return "FREE"
  }

  return user.plan as PlanType
}

export function canAccessFeature(plan: PlanType, feature: string): boolean {
  const access: Record<string, PlanType[]> = {
    dashboard: ["TRIAL", "PRO"],
    instances: ["TRIAL", "PRO"],
    campaigns: ["PRO"],
    webhooks: ["TRIAL", "PRO"],
    lists: ["TRIAL", "PRO"],
    unlimited_messages: ["PRO"],
  }
  return access[feature]?.includes(plan) ?? false
}
