import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { ensureUserForClerkId } from "@/lib/users"
import { parseBody, activityCreateSchema } from "@/lib/validation"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await ensureUserForClerkId(userId)

    const { searchParams } = new URL(req.url)
    const processed = searchParams.get("processed")
    const productId = searchParams.get("productId")
    const scope = searchParams.get("scope") || "active" // "active" | "all"
    const limit = parseInt(searchParams.get("limit") || "20")

    const effectiveProductId =
      productId ||
      (scope === "active" && user.activeProductId ? user.activeProductId : undefined)

    const activities = await db.activity.findMany({
      where: {
        userId: user.id,
        ...(processed !== null ? { processed: processed === "true" } : {}),
        ...(effectiveProductId ? { productId: effectiveProductId } : {}),
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

    const raw = await req.json().catch(() => null)
    const parsed = parseBody(raw, activityCreateSchema)
    if ("error" in parsed) return parsed.error
    const { type, title, description, metadata, productId } = parsed.data

    const user = await ensureUserForClerkId(userId)

    const targetProductId = productId ?? user.activeProductId

    const activity = await db.activity.create({
      data: {
        userId: user.id,
        productId: targetProductId || null,
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
    console.error("Error creating activity:", error)
    return NextResponse.json(
      { error: "Failed to create activity" },
      { status: 500 }
    )
  }
}
