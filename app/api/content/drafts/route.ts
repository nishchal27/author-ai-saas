import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { ensureUserForClerkId } from "@/lib/users"
import {
  parseDraftListScope,
  resolveDraftProductFilter,
} from "@/lib/content/draft-scope"
import { apiError } from "@/lib/api-error"
import { NextResponse } from "next/server"

/**
 * GET /api/content/drafts
 *
 * scope=active (default): drafts for the user's active brand only.
 *   If no active brand is set, returns an empty list (never all brands).
 * scope=all: all drafts owned by the user (explicit cross-brand view).
 * productId: optional override; must be owned by the user.
 */
export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await ensureUserForClerkId(userId)

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const scope = parseDraftListScope(searchParams.get("scope"))
    if (!scope) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: "scope must be 'active' (current brand) or 'all' (all brands)",
        },
        { status: 400 }
      )
    }
    const productIdParam = searchParams.get("productId")
    const limitRaw = parseInt(searchParams.get("limit") || "50", 10)
    const limit =
      Number.isFinite(limitRaw) && limitRaw > 0
        ? Math.min(limitRaw, 100)
        : 50

    let ownedRequested: string | null = null
    if (productIdParam) {
      const owned = await db.product.findFirst({
        where: { id: productIdParam, userId: user.id },
        select: { id: true },
      })
      if (!owned) {
        return NextResponse.json({ error: "Brand not found" }, { status: 404 })
      }
      ownedRequested = owned.id
    }

    const resolved = resolveDraftProductFilter({
      scope,
      activeProductId: user.activeProductId,
      requestedProductId: productIdParam,
      ownedRequestedProductId: ownedRequested,
    })

    if (resolved.empty && scope === "active" && !productIdParam) {
      return NextResponse.json({
        drafts: [],
        productId: null,
        scope: "active",
        activeProductId: null,
      })
    }

    const productFilter = resolved.productId

    const drafts = await db.contentDraft.findMany({
      where: {
        userId: user.id,
        ...(status ? { status } : {}),
        ...(productFilter ? { productId: productFilter } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      include: {
        insight: true,
        contentIdea: {
          select: {
            id: true,
            title: true,
            platform: true,
            format: true,
            status: true,
            concept: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      drafts,
      productId: productFilter ?? null,
      scope,
    })
  } catch (error) {
    return apiError(error, {
      context: "drafts GET",
      publicMessage: "Failed to fetch drafts",
    })
  }
}
