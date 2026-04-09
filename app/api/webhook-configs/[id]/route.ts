import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const config = await db.webhookConfig.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!config) {
    return NextResponse.json({ error: "Webhook config not found" }, { status: 404 })
  }

  await db.webhookConfig.delete({ where: { id } })

  return NextResponse.json({ success: true })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const config = await db.webhookConfig.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!config) {
    return NextResponse.json({ error: "Webhook config not found" }, { status: 404 })
  }

  const newStatus = config.status === "active" ? "paused" : "active"

  const updated = await db.webhookConfig.update({
    where: { id },
    data: { status: newStatus },
  })

  return NextResponse.json(updated)
}
