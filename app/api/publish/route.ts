import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { publishToLinkedIn } from "@/lib/linkedin"
import { publishToTwitter } from "@/lib/twitter"
import { NextResponse } from "next/server"

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
    const { scheduleId } = body

    if (!scheduleId) {
      return NextResponse.json(
        { error: "Schedule ID is required" },
        { status: 400 }
      )
    }

    // Get schedule
    const schedule = await db.schedule.findFirst({
      where: {
        id: scheduleId,
        userId: user.id,
        status: "pending",
      },
      include: {
        contentDraft: true,
      },
    })

    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found or already published" },
        { status: 404 }
      )
    }

    // Check if scheduled time has passed
    if (new Date(schedule.scheduledAt) > new Date()) {
      return NextResponse.json(
        { error: "Schedule time has not been reached yet" },
        { status: 400 }
      )
    }

    // Get platform integration
    const integration = await db.integration.findFirst({
      where: {
        userId: user.id,
        type: schedule.platform,
        isActive: true,
      },
    })

    if (!integration || !integration.accessToken) {
      return NextResponse.json(
        { error: `No active ${schedule.platform} integration found` },
        { status: 404 }
      )
    }

    // Publish based on platform
    let externalId: string
    try {
      if (schedule.platform === "linkedin") {
        const result = await publishToLinkedIn(
          integration.accessToken,
          schedule.contentDraft.content,
          schedule.contentDraft.visualUrl || undefined
        )
        externalId = result.id
      } else if (schedule.platform === "twitter") {
        const result = await publishToTwitter(
          integration.accessToken,
          schedule.contentDraft.content,
          schedule.contentDraft.visualUrl || undefined
        )
        externalId = result.id
      } else {
        return NextResponse.json(
          { error: `Platform ${schedule.platform} not supported yet` },
          { status: 400 }
        )
      }
    } catch (error: any) {
      // Update schedule with error
      await db.schedule.update({
        where: { id: scheduleId },
        data: {
          status: "failed",
          errorMessage: error.message,
        },
      })
      throw error
    }

    // Update schedule as published
    await db.schedule.update({
      where: { id: scheduleId },
      data: {
        status: "published",
        publishedAt: new Date(),
        externalId,
      },
    })

    // Update draft status
    await db.contentDraft.update({
      where: { id: schedule.contentDraftId },
      data: { status: "published", publishedAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      externalId,
      message: `Successfully published to ${schedule.platform}`,
    })
  } catch (error) {
    console.error("Error publishing:", error)
    return NextResponse.json(
      { error: "Failed to publish content" },
      { status: 500 }
    )
  }
}
