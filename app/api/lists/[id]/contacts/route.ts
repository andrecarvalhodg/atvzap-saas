import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const list = await db.contactList.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 })
  }

  const contacts = await db.contact.findMany({
    where: { listId: id },
  })

  return NextResponse.json(contacts)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const list = await db.contactList.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 })
  }

  const { name, phone, email } = await request.json()

  if (!name || !phone) {
    return NextResponse.json(
      { error: "Name and phone are required" },
      { status: 400 }
    )
  }

  const contact = await db.contact.create({
    data: {
      name,
      phone,
      email: email || null,
      listId: id,
    },
  })

  return NextResponse.json(contact, { status: 201 })
}
