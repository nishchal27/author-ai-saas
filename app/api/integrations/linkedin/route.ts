import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
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
    const { accessToken, refreshToken, organizationId } = body

    if (!accessToken) {
      return NextResponse.json(
        { error: "Access token is required" },
        { status: 400 }
      )
    }

    // Store organization ID in config JSON
    const config = organizationId
      ? JSON.stringify({ organizationId })
      : null

    const existing = await db.integration.findFirst({
      where: {
        userId: user.id,
        type: "linkedin",
      },
    })

    if (existing) {
      await db.integration.update({
        where: { id: existing.id },
        data: {
          accessToken,
          refreshToken: refreshToken || null,
          config,
          isActive: true,
        },
      })
    } else {
      await db.integration.create({
        data: {
          userId: user.id,
          type: "linkedin",
          provider: "linkedin",
          accessToken,
          refreshToken: refreshToken || null,
          config,
          isActive: true,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error connecting LinkedIn:", error)
    return NextResponse.json(
      { error: "Failed to connect LinkedIn" },
      { status: 500 }
    )
  }
}
