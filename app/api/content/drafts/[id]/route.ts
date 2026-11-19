import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { ensureUserForClerkId } from "@/lib/users"
import { parseBody, draftPatchSchema } from "@/lib/validation"
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

    const user = await ensureUserForClerkId(userId)

    const result = await db.contentDraft.deleteMany({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (result.count === 0) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 })
    }

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

    const user = await ensureUserForClerkId(userId)

    const raw = await req.json().catch(() => null)
    const parsed = parseBody(raw, draftPatchSchema)
    if ("error" in parsed) return parsed.error
    const { content, status } = parsed.data

    const draft = await db.contentDraft.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 })
    }

    const result = await db.contentDraft.updateMany({
      where: {
        id: params.id,
        userId: user.id,
      },
      data: {
        ...(content !== undefined ? { content } : {}),
        ...(status !== undefined ? { status } : {}),
        version: draft.version + 1,
      },
    })

    if (result.count === 0) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 })
    }

    const updated = await db.contentDraft.findFirst({
      where: { id: params.id, userId: user.id },
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
