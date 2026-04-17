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
  const instanceName = instance.name
  const instanceToken = `${instanceName}-token`

  try {
    // Step 1: Delete existing instance (it's stuck in QR mode)
    await fetch(`${apiUrl}/instance/logout/${instanceName}`, {
      method: "DELETE",
      headers: { apikey: apiKey },
    })
    await new Promise(r => setTimeout(r, 500))

    await fetch(`${apiUrl}/instance/delete/${instanceName}`, {
      method: "DELETE",
      headers: { apikey: apiKey },
    })
    await new Promise(r => setTimeout(r, 1000))

    // Step 2: Recreate instance with qrcode: false to enable pairing code mode
    const createRes = await fetch(`${apiUrl}/instance/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: apiKey },
      body: JSON.stringify({
        instanceName,
        token: instanceToken,
        qrcode: false, // IMPORTANT: disable QR to allow pairing code
        number: cleanPhone,
      }),
    })
    const createData = await createRes.json()

    await new Promise(r => setTimeout(r, 1500))

    // Step 3: Request pairing code
    const connectRes = await fetch(
      `${apiUrl}/instance/connect/${instanceName}?number=${cleanPhone}`,
      { headers: { apikey: apiKey } }
    )
    const connectData = await connectRes.json()

    const code = connectData?.pairingCode

    if (code && typeof code === "string" && code.length >= 4) {
      return NextResponse.json({ code })
    }

    // Still null? Return debug info
    return NextResponse.json({
      error: "Código não gerado. Tente novamente em alguns segundos.",
      createStatus: createRes.status,
      connectStatus: connectRes.status,
      pairingCode: connectData?.pairingCode,
      keys: Object.keys(connectData),
    }, { status: 500 })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
