import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { ensureUserForClerkId } from "@/lib/users"
import { parseBody, insightCreateSchema } from "@/lib/validation"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await ensureUserForClerkId(userId)

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const scope = searchParams.get("scope") || "active" // "active" | "all"
    const limit = parseInt(searchParams.get("limit") || "20")

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

    return NextResponse.json({ insights })
  } catch (error) {
    console.error("Error fetching insights:", error)
    return NextResponse.json(
      { error: "Failed to fetch insights" },
      { status: 500 }
    )
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
    const { coreProblem, solution, audience, whyMatters, impact, productId } = parsed.data

    const targetProductId = productId ?? user.activeProductId
    if (targetProductId) {
      const product = await db.product.findFirst({
        where: { id: targetProductId, userId: user.id },
      })
      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 })
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
    console.error("Error creating insight:", error)
    return NextResponse.json(
      { error: "Failed to create insight" },
      { status: 500 }
    )
  }
}
