import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import type { NextAuthConfig } from "next-auth"

// Only use PrismaAdapter if DATABASE_URL is configured
async function getAdapter() {
  if (!process.env.DATABASE_URL) return undefined
  const { PrismaAdapter } = await import("@auth/prisma-adapter")
  const { db } = await import("@/lib/db")
  return PrismaAdapter(db)
}

const config: NextAuthConfig = {
  // adapter is set dynamically below
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user?.id) {
        token.id = user.id
      }
      // If we have a user id AND a database, fetch plan info
      if (token.id && process.env.DATABASE_URL) {
        try {
          const { db } = await import("@/lib/db")
          const dbUser = await db.user.findUnique({
            where: { id: token.id as string },
            select: {
              plan: true,
              trialEndsAt: true,
              stripeSubscriptionId: true,
            },
          })
          if (dbUser) {
            token.plan = dbUser.plan
            token.trialEndsAt = dbUser.trialEndsAt
            token.stripeSubscriptionId = dbUser.stripeSubscriptionId
          }
        } catch {
          // DB not available yet, use defaults
          token.plan = token.plan || "TRIAL"
        }
      } else {
        token.plan = token.plan || "TRIAL"
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || token.sub || ""
        session.user.plan = (token.plan as string) || "TRIAL"
        session.user.trialEndsAt = (token.trialEndsAt as Date | null) || null
        session.user.stripeSubscriptionId =
          (token.stripeSubscriptionId as string | null) || null
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
}

// Initialize with dynamic adapter
const adapterPromise = getAdapter()

export const { handlers, auth, signIn, signOut } = NextAuth(async () => {
  const adapter = await adapterPromise
  return {
    ...config,
    adapter,
    events: adapter
      ? {
          async createUser({ user }) {
            const { db } = await import("@/lib/db")
            await db.user.update({
              where: { id: user.id },
              data: {
                plan: "TRIAL",
                trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
              },
            })
          },
        }
      : {},
  }
})
