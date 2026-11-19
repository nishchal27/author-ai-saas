import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { ensureUserForClerkId } from "@/lib/users"
import { apiError } from "@/lib/api-error"
import { parseBody, ideaPatchSchema } from "@/lib/validation"
import {
  convertIdeaToDraft,
  IdeaDomainError,
  updateIdea,
} from "@/lib/ideas/service"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; ideaId: string }> }
) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id, ideaId } = await params
    const user = await ensureUserForClerkId(clerkId)
    const raw = await request.json().catch(() => null)

    if (raw && typeof raw === "object" && (raw as { action?: string }).action === "convert") {
      const result = await convertIdeaToDraft({
        userId: user.id,
        productId: id,
        ideaId,
        content:
          typeof (raw as { content?: unknown }).content === "string"
            ? (raw as { content: string }).content
            : undefined,
      })
      return NextResponse.json({
        draft: result.draft,
        created: result.created,
        message: result.created
          ? "Idea converted to draft"
          : "Existing converted draft returned",
      })
    }

    const parsed = parseBody(raw, ideaPatchSchema)
    if ("error" in parsed) return parsed.error
    const idea = await updateIdea({
      userId: user.id,
      productId: id,
      ideaId,
      ...parsed.data,
    })
    return NextResponse.json({ idea })
  } catch (error) {
    if (error instanceof IdeaDomainError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return apiError(error, {
      context: "ideas PATCH",
      publicMessage: "Failed to update idea",
    })
  }
}
