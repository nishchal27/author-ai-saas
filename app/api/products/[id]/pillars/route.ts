import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { ensureUserForClerkId } from "@/lib/users"
import { apiError } from "@/lib/api-error"
import { parseBody, pillarCreateSchema, pillarReorderSchema } from "@/lib/validation"
import {
  createPillar,
  listPillars,
  PillarDomainError,
  reorderPillars,
} from "@/lib/pillars/service"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params
    const user = await ensureUserForClerkId(clerkId)
    const pillars = await listPillars(user.id, id)
    return NextResponse.json({ productId: id, pillars })
  } catch (error) {
    if (error instanceof PillarDomainError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return apiError(error, {
      context: "pillars GET",
      publicMessage: "Failed to load pillars",
    })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params
    const user = await ensureUserForClerkId(clerkId)
    const raw = await request.json().catch(() => null)

    if (raw && typeof raw === "object" && "orderedIds" in raw) {
      const parsed = parseBody(raw, pillarReorderSchema)
      if ("error" in parsed) return parsed.error
      const pillars = await reorderPillars({
        userId: user.id,
        productId: id,
        orderedIds: parsed.data.orderedIds,
      })
      return NextResponse.json({ productId: id, pillars })
    }

    const parsed = parseBody(raw, pillarCreateSchema)
    if ("error" in parsed) return parsed.error
    const pillar = await createPillar({
      userId: user.id,
      productId: id,
      ...parsed.data,
      source: "user",
      approvalStatus: "approved",
    })
    return NextResponse.json({ pillar }, { status: 201 })
  } catch (error) {
    if (error instanceof PillarDomainError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return apiError(error, {
      context: "pillars POST",
      publicMessage: "Failed to create pillar",
    })
  }
}
