import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getEvolutionQRCode } from "@/lib/whatsapp"

export async function GET(
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
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (instance.provider !== "evolution") {
    return NextResponse.json({ error: "Apenas Evolution API suporta QR code" }, { status: 400 })
  }

  const result = await getEvolutionQRCode(instance.name)

  // If connected, update status in DB
  if (result.state === "open") {
    await db.whatsAppInstance.update({
      where: { id },
      data: {
        status: "connected",
        isActive: true,
        phone: result.phone || null,
      },
    })
    return NextResponse.json({ state: "connected", phone: result.phone })
  }

  // Always return fresh QR code
  return NextResponse.json({ ...result, timestamp: Date.now() })
}
