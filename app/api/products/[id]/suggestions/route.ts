import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { ensureUserForClerkId } from "@/lib/users"
import { checkAiRateLimits } from "@/lib/rate-limit"
import { parseBody, brandSuggestionStatusSchema } from "@/lib/validation"
import {
  generateBrandSuggestions,
  updateBrandSuggestionStatus,
} from "@/lib/brand/suggestions"
import { apiError } from "@/lib/api-error"

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
    const product = await db.product.findFirst({
      where: { id, userId: user.id },
      select: { id: true, brandSuggestionsJson: true },
    })
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const batch = product.brandSuggestionsJson
      ? JSON.parse(product.brandSuggestionsJson)
      : null

    return NextResponse.json({ productId: id, batch })
  } catch (error) {
    return apiError(error, {
      context: "suggestions GET",
      publicMessage: "Failed to load suggestions",
    })
  }
}

export async function POST(
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
    const product = await db.product.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    })
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const rateLimit = await checkAiRateLimits(user.id)
    if (rateLimit) return rateLimit

    const result = await generateBrandSuggestions({
      userId: user.id,
      productId: id,
    })
    return NextResponse.json(result)
  } catch (error) {
    return apiError(error, {
      context: "suggestions POST",
      publicMessage: "Failed to generate suggestions",
    })
  }
}

/** PATCH — accept / reject / edit a suggestion */
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
    const product = await db.product.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    })
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const raw = await request.json().catch(() => null)
    const parsed = parseBody(raw, brandSuggestionStatusSchema)
    if ("error" in parsed) return parsed.error

    const result = await updateBrandSuggestionStatus({
      userId: user.id,
      productId: id,
      suggestionId: parsed.data.suggestionId,
      status: parsed.data.status,
      editedText: parsed.data.editedText,
    })

    return NextResponse.json(result)
  } catch (error) {
    return apiError(error, {
      context: "suggestions PATCH",
      publicMessage: "Failed to update suggestion",
    })
  }
}
