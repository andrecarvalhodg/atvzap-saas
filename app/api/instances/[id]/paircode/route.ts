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

  // Clean phone number
  const cleanPhone = phone.replace(/\D/g, "")

  try {
    const res = await fetch(
      `${apiUrl}/instance/connect/${instance.name}?number=${cleanPhone}`,
      { headers: { apikey: apiKey } }
    )
    const data = await res.json()

    // Pairing code is in data.code or data.pairingCode
    const code = data.code || data.pairingCode || data.pairing_code

    if (!code) {
      return NextResponse.json({
        error: "Não foi possível gerar o código. Tente novamente.",
        raw: data,
      }, { status: 500 })
    }

    return NextResponse.json({ code })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
