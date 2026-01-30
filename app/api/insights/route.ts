import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findFirst({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

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

    const user = await db.user.findFirst({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await req.json()
    const { coreProblem, solution, audience, whyMatters, impact, productId } = body

    if (!coreProblem || !solution || !audience || !whyMatters) {
      return NextResponse.json(
        { error: "coreProblem, solution, audience, and whyMatters are required" },
        { status: 400 }
      )
    }

    const targetProductId = productId || user.activeProductId
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
        coreProblem: String(coreProblem),
        solution: String(solution),
        audience: String(audience),
        whyMatters: String(whyMatters),
        impact: impact ? String(impact) : null,
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
