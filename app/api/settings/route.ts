import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { apiError } from "@/lib/api-error"
import { ensureUserForClerkId } from "@/lib/users"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await ensureUserForClerkId(userId)

    return NextResponse.json({ user })
  } catch (error) {
    return apiError(error, { context: "settings GET", publicMessage: "Failed to fetch settings" })
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await ensureUserForClerkId(userId)

    const body = await req.json()
    const { brandVoice, brandColors, visualStyle, tier, founderBio } = body

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        ...(brandVoice !== undefined ? { brandVoice } : {}),
        ...(brandColors !== undefined ? { brandColors } : {}),
        ...(visualStyle !== undefined ? { visualStyle } : {}),
        ...(tier !== undefined ? { tier } : {}),
        ...(founderBio !== undefined ? { founderBio } : {}),
      },
    })

    return NextResponse.json({ user: updated })
  } catch (error) {
    return apiError(error, { context: "settings PATCH", publicMessage: "Failed to update settings" })
  }
}
