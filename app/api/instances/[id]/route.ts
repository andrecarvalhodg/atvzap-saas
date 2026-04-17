import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { testConnection, deleteEvolutionInstance } from "@/lib/whatsapp"

export async function DELETE(
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

  // If Evolution API, delete from server too
  if (instance.provider === "evolution") {
    await deleteEvolutionInstance(instance.name)
  }

  await db.whatsAppInstance.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

// PATCH - test connection / update credentials
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
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))

  // Update credentials if provided
  const updates: Record<string, any> = {}
  if (body.apiToken !== undefined) updates.apiToken = body.apiToken
  if (body.apiUrl !== undefined) updates.apiUrl = body.apiUrl
  if (body.instanceId !== undefined) updates.instanceId = body.instanceId
  if (body.phoneNumberId !== undefined) updates.phoneNumberId = body.phoneNumberId
  if (body.provider !== undefined) updates.provider = body.provider

  // Test connection
  const config = {
    provider: body.provider || instance.provider,
    apiToken: body.apiToken ?? instance.apiToken,
    apiUrl: body.apiUrl ?? instance.apiUrl,
    instanceId: body.instanceId ?? instance.instanceId,
    phoneNumberId: body.phoneNumberId ?? instance.phoneNumberId,
    name: instance.name,
  }

  const test = await testConnection(config)
  updates.status = test.connected ? "connected" : "disconnected"
  updates.isActive = test.connected
  if (test.phone) updates.phone = test.phone

  const updated = await db.whatsAppInstance.update({
    where: { id },
    data: updates,
  })

  return NextResponse.json({ ...updated, connectionTest: test })
}
