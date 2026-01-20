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
    const processed = searchParams.get("processed")
    const productId = searchParams.get("productId")
    const limit = parseInt(searchParams.get("limit") || "20")

    const activities = await db.activity.findMany({
      where: {
        userId: user.id,
        ...(processed !== null ? { processed: processed === "true" } : {}),
        ...(productId ? { productId } : {}),
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

    return NextResponse.json({ activities })
  } catch (error) {
    console.error("Error fetching activities:", error)
    return NextResponse.json(
      { error: "Failed to fetch activities" },
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

    const body = await req.json()
    const { type, title, description, metadata, productId } = body

    if (!type || !title) {
      return NextResponse.json(
        { error: "Type and title are required" },
        { status: 400 }
      )
    }

    const user = await db.user.findFirst({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Use provided productId or user's active product
    const targetProductId = productId || user.activeProductId

    const activity = await db.activity.create({
      data: {
        userId: user.id,
        productId: targetProductId || null,
        type,
        source: "manual",
        title,
        description: description || null,
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
    console.error("Error creating activity:", error)
    return NextResponse.json(
      { error: "Failed to create activity" },
      { status: 500 }
    )
  }
}
