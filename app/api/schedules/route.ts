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
    const start = searchParams.get("start")
    const end = searchParams.get("end")

    if (!start || !end) {
      return NextResponse.json(
        { error: "Start and end dates are required" },
        { status: 400 }
      )
    }

    const schedules = await db.schedule.findMany({
      where: {
        userId: user.id,
        scheduledAt: {
          gte: new Date(start),
          lte: new Date(end),
        },
      },
      include: {
        contentDraft: true,
      },
      orderBy: {
        scheduledAt: "asc",
      },
    })

    return NextResponse.json({ schedules })
  } catch (error) {
    console.error("Error fetching schedules:", error)
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
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
    const { contentDraftId, platform, scheduledAt } = body

    if (!contentDraftId || !platform || !scheduledAt) {
      return NextResponse.json(
        { error: "Content draft ID, platform, and scheduled time are required" },
        { status: 400 }
      )
    }

    // Verify draft belongs to user
    const draft = await db.contentDraft.findFirst({
      where: {
        id: contentDraftId,
        userId: user.id,
        status: "approved",
      },
    })

    if (!draft) {
      return NextResponse.json(
        { error: "Draft not found or not approved" },
        { status: 404 }
      )
    }

    const schedule = await db.schedule.create({
      data: {
        userId: user.id,
        contentDraftId,
        platform,
        scheduledAt: new Date(scheduledAt),
        status: "pending",
      },
      include: {
        contentDraft: true,
      },
    })

    // Update draft status
    await db.contentDraft.update({
      where: { id: contentDraftId },
      data: { status: "scheduled", scheduledAt: new Date(scheduledAt) },
    })

    return NextResponse.json({ schedule })
  } catch (error) {
    console.error("Error creating schedule:", error)
    return NextResponse.json(
      { error: "Failed to create schedule" },
      { status: 500 }
    )
  }
}
