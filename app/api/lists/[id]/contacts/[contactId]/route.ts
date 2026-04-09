import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id, contactId } = await params

  const list = await db.contactList.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 })
  }

  const contact = await db.contact.findFirst({
    where: { id: contactId, listId: id },
  })

  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 })
  }

  await db.contact.delete({ where: { id: contactId } })

  return NextResponse.json({ success: true })
}
