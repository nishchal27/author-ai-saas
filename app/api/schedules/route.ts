import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { ensureUserForClerkId } from "@/lib/users"
import { parseBody, scheduleCreateSchema } from "@/lib/validation"
import { inngest } from "@/lib/inngest"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await ensureUserForClerkId(userId)

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

    const user = await ensureUserForClerkId(userId)

    const raw = await req.json().catch(() => null)
    const parsed = parseBody(raw, scheduleCreateSchema)
    if ("error" in parsed) return parsed.error
    const { contentDraftId, platform, scheduledAt } = parsed.data

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

    // Inngest will automatically pick up scheduled content via cron
    // No need to queue manually - the checkScheduledContent function runs every 5 minutes

    return NextResponse.json({ schedule })
  } catch (error) {
    console.error("Error creating schedule:", error)
    return NextResponse.json(
      { error: "Failed to create schedule" },
      { status: 500 }
    )
  }
}
