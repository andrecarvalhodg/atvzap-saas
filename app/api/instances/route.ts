import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { testConnection } from "@/lib/whatsapp"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const instances = await db.whatsAppInstance.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(instances)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { name, provider, apiToken, apiUrl, instanceId, phoneNumberId, phone } = body

  if (!name || !provider) {
    return NextResponse.json({ error: "Nome e provider são obrigatórios" }, { status: 400 })
  }

  // Test connection before saving
  const config = { provider, apiToken, apiUrl, instanceId, phoneNumberId, name }
  const test = await testConnection(config)

  const instance = await db.whatsAppInstance.create({
    data: {
      name,
      provider,
      apiToken: apiToken || null,
      apiUrl: apiUrl || null,
      instanceId: instanceId || null,
      phoneNumberId: phoneNumberId || null,
      phone: test.phone || phone || null,
      status: test.connected ? "connected" : "disconnected",
      isActive: test.connected,
      userId: session.user.id,
    },
  })

  return NextResponse.json({
    ...instance,
    connectionTest: test,
  }, { status: 201 })
}
