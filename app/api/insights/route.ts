import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { ensureUserForClerkId } from "@/lib/users"
import { parseBody, insightCreateSchema } from "@/lib/validation"
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
    const status = searchParams.get("status")
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

    if (scope === "active" && !user.activeProductId) {
      return NextResponse.json({ insights: [], scope: "active" })
    }

    const insights = await db.insight.findMany({
      where: {
        userId: user.id,
        ...(status ? { status } : {}),
        ...(scope === "active" && user.activeProductId
          ? { productId: user.activeProductId }
          : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      include: {
        activity: true,
      },
    })

    return NextResponse.json({ insights, scope })
  } catch (error) {
    return apiError(error, {
      context: "insights GET",
      publicMessage: "Failed to fetch insights",
    })
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await ensureUserForClerkId(userId)

    const raw = await req.json().catch(() => null)
    const parsed = parseBody(raw, insightCreateSchema)
    if ("error" in parsed) return parsed.error
    const { coreProblem, solution, audience, whyMatters, impact, productId } =
      parsed.data

    const targetProductId = productId ?? user.activeProductId
    if (targetProductId) {
      const product = await db.product.findFirst({
        where: { id: targetProductId, userId: user.id },
      })
      if (!product) {
        return NextResponse.json({ error: "Brand not found" }, { status: 404 })
      }
    }

    const insight = await db.insight.create({
      data: {
        userId: user.id,
        productId: targetProductId || null,
        coreProblem,
        solution,
        audience,
        whyMatters,
        impact: impact ?? null,
        status: "draft",
      },
    })

    return NextResponse.json({ insight })
  } catch (error) {
    return apiError(error, {
      context: "insights POST",
      publicMessage: "Failed to create insight",
    })
  }
}
