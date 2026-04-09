import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const campaigns = await db.campaign.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(campaigns)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()

  const campaign = await db.campaign.create({
    data: {
      ...body,
      userId: session.user.id,
    },
  })

  // Simulate sending in the background
  const totalCount = campaign.totalContacts || 0
  let sent = 0

  const simulateSending = () => {
    if (sent >= totalCount) {
      db.campaign.update({
        where: { id: campaign.id },
        data: { status: "completed", sentCount: totalCount },
      }).catch(console.error)
      return
    }

    sent++
    db.campaign.update({
      where: { id: campaign.id },
      data: { sentCount: sent, status: "sending" },
    })
      .then(() => setTimeout(simulateSending, 1000))
      .catch(console.error)
  }

  if (totalCount > 0) {
    setTimeout(simulateSending, 1000)
  }

  return NextResponse.json(campaign, { status: 201 })
}
