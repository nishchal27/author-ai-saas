import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { ensureUserForClerkId } from "@/lib/users"
import { NextResponse } from "next/server"

/**
 * GET /api/insights/[id] - Get a single insight by id (for Home flow: create_post angle card)
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await ensureUserForClerkId(userId)

    const { id } = await params

    const insight = await db.insight.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        product: { select: { id: true, name: true } },
        activity: { select: { id: true, title: true } },
      },
    })

    if (!insight) {
      return NextResponse.json({ error: "Insight not found" }, { status: 404 })
    }

    return NextResponse.json({ insight })
  } catch (error) {
    console.error("Error fetching insight:", error)
    return NextResponse.json(
      { error: "Failed to fetch insight" },
      { status: 500 }
    )
  }
}
