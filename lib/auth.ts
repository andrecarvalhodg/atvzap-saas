import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import Resend from "next-auth/providers/resend"
import { db } from "@/lib/db"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Resend({
      from: "ATVzap <noreply@resend.dev>",
    }),
  ],
  events: {
    async createUser({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: {
          plan: "TRIAL",
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      })
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id
      }

      if (token.id) {
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
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.plan = token.plan as string
        session.user.trialEndsAt = token.trialEndsAt as Date | null
        session.user.stripeSubscriptionId =
          token.stripeSubscriptionId as string | null
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
})
