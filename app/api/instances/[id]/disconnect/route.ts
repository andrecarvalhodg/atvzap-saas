import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import * as evo from "@/lib/evolution"

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

  const configured = await evo.isConfigured()
  if (configured) {
    try {
      await evo.logoutInstance(instance.name)
    } catch {
      // Ignore
    }
  }

  await db.whatsAppInstance.update({
    where: { id },
    data: { status: "disconnected", isActive: false },
  })

  return NextResponse.json({ success: true })
}
