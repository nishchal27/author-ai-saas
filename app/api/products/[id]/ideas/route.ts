import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { ensureUserForClerkId } from "@/lib/users"
import { checkAiRateLimits } from "@/lib/rate-limit"
import { generateBrandIdeas } from "@/lib/brand/ideas"
import { apiError } from "@/lib/api-error"
import { parseBody, ideaCreateSchema } from "@/lib/validation"
import {
  createIdea,
  IdeaDomainError,
  listIdeas,
} from "@/lib/ideas/service"

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

    const url = new URL(request.url)
    const status = url.searchParams.get("status") as
      | "proposed"
      | "saved"
      | "rejected"
      | "converted"
      | null

    const ideas = await listIdeas(user.id, id, status || undefined)

    // brandIdeasJson is cache only; include for backward-compatible readers
    const product = await db.product.findFirst({
      where: { id, userId: user.id },
      select: { brandIdeasJson: true },
    })
    const batch = product?.brandIdeasJson
      ? JSON.parse(product.brandIdeasJson)
      : null

    return NextResponse.json({ productId: id, ideas, batch })
  } catch (error) {
    if (error instanceof IdeaDomainError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return apiError(error, {
      context: "ideas GET",
      publicMessage: "Failed to load ideas",
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

    const contentType = request.headers.get("content-type") || ""
    const hasBody = contentType.includes("application/json")
    const raw = hasBody ? await request.json().catch(() => null) : null

    // Manual idea create when body present with title; otherwise AI generate
    if (raw && typeof raw === "object" && "title" in raw) {
      const parsed = parseBody(raw, ideaCreateSchema)
      if ("error" in parsed) return parsed.error
      const idea = await createIdea({
        userId: user.id,
        productId: id,
        ...parsed.data,
        source: "user",
        status: "saved",
      })
      return NextResponse.json({ idea }, { status: 201 })
    }

    const product = await db.product.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    })
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const rateLimit = await checkAiRateLimits(user.id)
    if (rateLimit) return rateLimit

    const result = await generateBrandIdeas({ userId: user.id, productId: id })
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof IdeaDomainError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return apiError(error, {
      context: "ideas POST",
      publicMessage: "Failed to create or generate ideas",
    })
  }
}
