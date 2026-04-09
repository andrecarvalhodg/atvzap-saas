import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const lists = await db.contactList.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { contacts: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(lists)
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

  const list = await db.contactList.create({
    data: {
      name,
      userId: session.user.id,
    },
  })

  return NextResponse.json(list, { status: 201 })
}
