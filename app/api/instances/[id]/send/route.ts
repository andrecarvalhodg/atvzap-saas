import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sendMessage } from "@/lib/whatsapp"

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
    return NextResponse.json({ error: "Instância não encontrada" }, { status: 404 })
  }

  if (instance.status !== "connected") {
    return NextResponse.json({ error: "Instância não está conectada" }, { status: 400 })
  }

  const { phone, message } = await request.json()
  if (!phone || !message) {
    return NextResponse.json({ error: "Telefone e mensagem são obrigatórios" }, { status: 400 })
  }

  const result = await sendMessage(instance, phone, message)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  await db.whatsAppInstance.update({
    where: { id },
    data: { messagesSent: { increment: 1 } },
  })

  return NextResponse.json({ success: true, messageId: result.messageId })
}
