import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { ensureUserForClerkId } from "@/lib/users"
import { apiError } from "@/lib/api-error"
import { parseBody, pillarPatchSchema } from "@/lib/validation"
import {
  approvePillar,
  PillarDomainError,
  updatePillar,
} from "@/lib/pillars/service"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; pillarId: string }> }
) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id, pillarId } = await params
    const user = await ensureUserForClerkId(clerkId)
    const raw = await request.json().catch(() => null)

    if (raw && typeof raw === "object" && (raw as { action?: string }).action === "approve") {
      const pillar = await approvePillar({
        userId: user.id,
        productId: id,
        pillarId,
      })
      return NextResponse.json({ pillar })
    }

    const parsed = parseBody(raw, pillarPatchSchema)
    if ("error" in parsed) return parsed.error
    const pillar = await updatePillar({
      userId: user.id,
      productId: id,
      pillarId,
      ...parsed.data,
    })
    return NextResponse.json({ pillar })
  } catch (error) {
    if (error instanceof PillarDomainError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return apiError(error, {
      context: "pillars PATCH",
      publicMessage: "Failed to update pillar",
    })
  }
}
