import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { apiError } from "@/lib/api-error"
import { ensureUserForClerkId } from "@/lib/users"
import { parseBody, settingsPatchSchema } from "@/lib/validation"
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

    const raw = await req.json().catch(() => null)
    const parsed = parseBody(raw, settingsPatchSchema)
    if ("error" in parsed) return parsed.error

    // Subscription tier is server-controlled only (scripts/billing). Never accept from client.
    const { brandVoice, founderBio } = parsed.data

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        ...(brandVoice !== undefined ? { brandVoice } : {}),
        ...(founderBio !== undefined ? { founderBio } : {}),
      },
    })

    return NextResponse.json({ user: updated })
  } catch (error) {
    return apiError(error, { context: "settings PATCH", publicMessage: "Failed to update settings" })
  }
}
