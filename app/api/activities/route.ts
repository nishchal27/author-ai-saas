import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { ensureUserForClerkId } from "@/lib/users"
import { parseBody, activityCreateSchema } from "@/lib/validation"
import { apiError } from "@/lib/api-error"
import { NextResponse } from "next/server"

function parseListLimit(raw: string | null, fallback = 20, max = 100): number {
  const n = parseInt(raw || String(fallback), 10)
  if (!Number.isFinite(n) || n <= 0) return fallback
  return Math.min(n, max)
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await ensureUserForClerkId(userId)

    const { searchParams } = new URL(req.url)
    const processed = searchParams.get("processed")
    const productIdParam = searchParams.get("productId")
    const scope = (searchParams.get("scope") || "active").toLowerCase()
    if (scope !== "active" && scope !== "all") {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: "scope must be 'active' or 'all'",
        },
        { status: 400 }
      )
    }
    const limit = parseListLimit(searchParams.get("limit"))

    let ownedProductId: string | null = null
    if (productIdParam) {
      const owned = await db.product.findFirst({
        where: { id: productIdParam, userId: user.id },
        select: { id: true },
      })
      if (!owned) {
        return NextResponse.json({ error: "Brand not found" }, { status: 404 })
      }
      ownedProductId = owned.id
    } else if (scope === "active") {
      if (!user.activeProductId) {
        return NextResponse.json({ activities: [], scope: "active" })
      }
      ownedProductId = user.activeProductId
    }

    const activities = await db.activity.findMany({
      where: {
        userId: user.id,
        ...(processed !== null ? { processed: processed === "true" } : {}),
        ...(ownedProductId ? { productId: ownedProductId } : {}),
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    })

    return NextResponse.json({ activities, scope })
  } catch (error) {
    return apiError(error, {
      context: "activities GET",
      publicMessage: "Failed to fetch activities",
    })
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const raw = await req.json().catch(() => null)
    const parsed = parseBody(raw, activityCreateSchema)
    if ("error" in parsed) return parsed.error
    const { type, title, description, metadata, productId } = parsed.data

    const user = await ensureUserForClerkId(userId)

    const requestedProductId = productId ?? user.activeProductId ?? null
    let ownedProductId: string | null = null
    if (requestedProductId) {
      const product = await db.product.findFirst({
        where: { id: requestedProductId, userId: user.id },
        select: { id: true },
      })
      if (!product) {
        return NextResponse.json({ error: "Brand not found" }, { status: 404 })
      }
      ownedProductId = product.id
    }

    const activity = await db.activity.create({
      data: {
        userId: user.id,
        productId: ownedProductId,
        type,
        source: "manual",
        title,
        description: description ?? null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        processed: false,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ activity })
  } catch (error) {
    return apiError(error, {
      context: "activities POST",
      publicMessage: "Failed to create activity",
    })
  }
}
