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
    const { accessToken, refreshToken } = body

    if (!accessToken) {
      return NextResponse.json(
        { error: "Access token is required" },
        { status: 400 }
      )
    }

    const existing = await db.integration.findFirst({
      where: {
        userId: user.id,
        type: "twitter",
      },
    })

    if (existing) {
      await db.integration.update({
        where: { id: existing.id },
        data: {
          accessToken,
          refreshToken: refreshToken || null,
          isActive: true,
        },
      })
    } else {
      await db.integration.create({
        data: {
          userId: user.id,
          type: "twitter",
          provider: "twitter",
          accessToken,
          refreshToken: refreshToken || null,
          isActive: true,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error connecting Twitter:", error)
    return NextResponse.json(
      { error: "Failed to connect Twitter" },
      { status: 500 }
    )
  }
}
