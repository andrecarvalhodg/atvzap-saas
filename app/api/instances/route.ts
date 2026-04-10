import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import * as evo from "@/lib/evolution"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const instances = await db.whatsAppInstance.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  // Sync status with Evolution API for each instance
  const configured = await evo.isConfigured()
  if (configured) {
    for (const inst of instances) {
      try {
        const state = await evo.getConnectionState(inst.name)
        const isOpen = state?.instance?.state === "open"
        if (isOpen !== inst.isActive) {
          await db.whatsAppInstance.update({
            where: { id: inst.id },
            data: {
              status: isOpen ? "connected" : "disconnected",
              isActive: isOpen,
              phone: state?.instance?.owner || inst.phone,
            },
          })
          inst.status = isOpen ? "connected" : "disconnected"
          inst.isActive = isOpen
        }
      } catch {
        // Instance might not exist in Evolution yet
      }
    }
  }

  return NextResponse.json(instances)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { name } = await request.json()
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }

  // Sanitize instance name for Evolution API (no spaces/special chars)
  const instanceName = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "") + "_" + Date.now().toString(36)

  // Create in Evolution API
  const configured = await evo.isConfigured()
  if (configured) {
    try {
      await evo.createInstance(instanceName)
    } catch (err: any) {
      console.error("Evolution create error:", err.message)
      return NextResponse.json(
        { error: "Erro ao criar instância no WhatsApp: " + err.message },
        { status: 500 }
      )
    }
  }

  // Save in database
  const instance = await db.whatsAppInstance.create({
    data: {
      name: instanceName,
      userId: session.user.id,
    },
  })

  return NextResponse.json(instance, { status: 201 })
}
