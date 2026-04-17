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
    // Evolution API v1.x: pairing code via connect endpoint with number param
    const res = await fetch(
      `${apiUrl}/instance/connect/${instance.name}?number=${cleanPhone}`,
      {
        method: "GET",
        headers: { apikey: apiKey },
      }
    )
    const data = await res.json()

    // v1.x returns pairingCode field when number is provided
    const code = data?.pairingCode || data?.pairing_code || data?.code

    // Valid pairing code: 8 chars like "ABCD-EFGH" or "ABCDEFGH"
    if (code && typeof code === "string" && code.length >= 4 && code.length <= 12 && !code.startsWith("data:") && !code.includes("@")) {
      return NextResponse.json({ code })
    }

    // Return raw for debugging
    return NextResponse.json({
      error: "Código não encontrado na resposta",
      httpStatus: res.status,
      keys: Object.keys(data),
      raw: data,
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
