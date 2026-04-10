import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import * as evo from "@/lib/evolution"

// GET - get QR code for connecting
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
    return NextResponse.json({ error: "Instance not found" }, { status: 404 })
  }

  const configured = await evo.isConfigured()
  if (!configured) {
    return NextResponse.json(
      { error: "Evolution API não configurada. Configure EVOLUTION_API_URL e EVOLUTION_API_KEY." },
      { status: 503 }
    )
  }

  try {
    const data = await evo.getQrCode(instance.name)

    // Evolution API returns { base64, code, pairingCode } or { instance: { state: "open" } }
    if (data?.instance?.state === "open") {
      // Already connected
      await db.whatsAppInstance.update({
        where: { id },
        data: { status: "connected", isActive: true },
      })
      return NextResponse.json({ status: "connected" })
    }

    return NextResponse.json({
      status: "waiting",
      qrcode: data?.base64 || null,
      code: data?.code || null,
      pairingCode: data?.pairingCode || null,
    })
  } catch (err: any) {
    console.error("QR code error:", err.message)
    return NextResponse.json(
      { error: "Erro ao gerar QR Code: " + err.message },
      { status: 500 }
    )
  }
}

// PATCH - check connection status
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
  if (!configured) {
    return NextResponse.json({ status: "disconnected" })
  }

  try {
    const state = await evo.getConnectionState(instance.name)
    const isOpen = state?.instance?.state === "open"
    const phone = state?.instance?.owner || ""

    await db.whatsAppInstance.update({
      where: { id },
      data: {
        status: isOpen ? "connected" : "disconnected",
        isActive: isOpen,
        phone: phone ? phone.replace("@s.whatsapp.net", "") : instance.phone,
      },
    })

    return NextResponse.json({
      status: isOpen ? "connected" : "disconnected",
      phone,
    })
  } catch {
    return NextResponse.json({ status: "disconnected" })
  }
}
