import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findFirst({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const draft = await db.contentDraft.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 })
    }

    await db.contentDraft.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error deleting draft:", error)
    return NextResponse.json(
      { error: "Failed to delete draft" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findFirst({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await req.json()
    const { content, status, visualUrl } = body

    const draft = await db.contentDraft.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 })
    }

    const updated = await db.contentDraft.update({
      where: { id: params.id },
      data: {
        ...(content !== undefined ? { content } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(visualUrl !== undefined ? { visualUrl: visualUrl || null } : {}),
        version: draft.version + 1,
      },
    })

    return NextResponse.json({ draft: updated })
  } catch (error) {
    console.error("Error updating draft:", error)
    return NextResponse.json(
      { error: "Failed to update draft" },
      { status: 500 }
    )
  }
}
