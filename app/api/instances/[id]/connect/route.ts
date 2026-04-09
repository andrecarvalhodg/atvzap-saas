import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const instance = await db.whatsAppInstance.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!instance) {
    return NextResponse.json({ error: "Instance not found" }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const phone = body.phone || "5511999999999"

  const updated = await db.whatsAppInstance.update({
    where: { id },
    data: {
      status: "connected",
      isActive: true,
      phone,
    },
  })

  return NextResponse.json(updated)
}
