import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { ensureUserForClerkId } from "@/lib/users"
import { apiError } from "@/lib/api-error"
import {
  parseBody,
  planItemCreateSchema,
  planItemPatchSchema,
} from "@/lib/validation"
import {
  addPlanItem,
  getOrCreateWeekPlan,
  PlannerDomainError,
  removePlanItem,
  updatePlanItemStatus,
  weekStartUtc,
} from "@/lib/planner/service"

export async function GET(
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
    const weekParam = new URL(request.url).searchParams.get("weekStart")
    const weekStart = weekParam ? new Date(weekParam) : undefined
    if (weekParam && Number.isNaN((weekStart as Date).getTime())) {
      return NextResponse.json({ error: "Invalid weekStart" }, { status: 400 })
    }

    const plan = await getOrCreateWeekPlan({
      userId: user.id,
      productId: id,
      weekStart,
    })
    return NextResponse.json({
      plan,
      weekStart: weekStartUtc(weekStart ?? new Date()).toISOString(),
    })
  } catch (error) {
    if (error instanceof PlannerDomainError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return apiError(error, {
      context: "plan GET",
      publicMessage: "Failed to load weekly plan",
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
    const parsed = parseBody(raw, planItemCreateSchema)
    if ("error" in parsed) return parsed.error

    const weekParam =
      raw && typeof raw === "object" && "weekStart" in raw
        ? String((raw as { weekStart?: string }).weekStart || "")
        : ""
    const weekStart = weekParam ? new Date(weekParam) : undefined
    if (weekParam && Number.isNaN((weekStart as Date).getTime())) {
      return NextResponse.json({ error: "Invalid weekStart" }, { status: 400 })
    }

    const plan = await getOrCreateWeekPlan({
      userId: user.id,
      productId: id,
      weekStart,
    })

    const item = await addPlanItem({
      userId: user.id,
      productId: id,
      planId: plan.id,
      contentIdeaId: parsed.data.contentIdeaId,
      contentDraftId: parsed.data.contentDraftId,
      status: parsed.data.status,
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    if (error instanceof PlannerDomainError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return apiError(error, {
      context: "plan POST",
      publicMessage: "Failed to add plan item",
    })
  }
}

export async function PATCH(
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
    if (!raw || typeof raw !== "object" || !("itemId" in raw)) {
      return NextResponse.json({ error: "itemId required" }, { status: 400 })
    }
    const itemId = String((raw as { itemId: string }).itemId)

    if ((raw as { action?: string }).action === "remove") {
      const result = await removePlanItem({
        userId: user.id,
        productId: id,
        itemId,
      })
      return NextResponse.json(result)
    }

    const parsed = parseBody(raw, planItemPatchSchema)
    if ("error" in parsed) return parsed.error
    const item = await updatePlanItemStatus({
      userId: user.id,
      productId: id,
      itemId,
      status: parsed.data.status,
    })
    return NextResponse.json({ item })
  } catch (error) {
    if (error instanceof PlannerDomainError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return apiError(error, {
      context: "plan PATCH",
      publicMessage: "Failed to update plan item",
    })
  }
}
