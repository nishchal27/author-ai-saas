import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

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
    const { content, status } = body

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
