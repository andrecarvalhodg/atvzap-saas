import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(
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

  const { phone } = await request.json()
  if (!phone) {
    return NextResponse.json({ error: "Número obrigatório" }, { status: 400 })
  }

  const apiUrl = (process.env.EVOLUTION_API_URL || "").trim().replace(/\/+$/, "")
  const apiKey = (process.env.EVOLUTION_API_KEY || "").trim()
  const cleanPhone = phone.replace(/\D/g, "")

  try {
    // Evolution API v1.x pairing code endpoint
    const res = await fetch(`${apiUrl}/instance/pairingCode/${instance.name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify({ number: cleanPhone }),
    })
    const data = await res.json()

    // Return everything for debugging
    return NextResponse.json({
      httpStatus: res.status,
      keys: Object.keys(data),
      pairingCode: data?.pairingCode,
      code: data?.code,
      pairing_code: data?.pairing_code,
      raw: data,
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
