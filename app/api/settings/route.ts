import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { apiError } from "@/lib/api-error"
import { ensureUserForClerkId } from "@/lib/users"
import { parseBody, settingsPatchSchema } from "@/lib/validation"
import {
  toPublicIntegration,
  toPublicSettingsUser,
} from "@/lib/settings/public"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await ensureUserForClerkId(userId)

    const integrations = await db.integration.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        type: true,
        provider: true,
        isActive: true,
        config: true,
        updatedAt: true,
        // Explicitly omit accessToken / refreshToken
      },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json({
      user: toPublicSettingsUser(user),
      integrations: integrations.map(toPublicIntegration),
    })
  } catch (error) {
    return apiError(error, {
      context: "settings GET",
      publicMessage: "Failed to fetch settings",
    })
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

    // Subscription tier is server-controlled only. Never accept from client.
    const { brandVoice, founderBio } = parsed.data

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        ...(brandVoice !== undefined ? { brandVoice } : {}),
        ...(founderBio !== undefined ? { founderBio } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        tier: true,
        brandVoice: true,
        founderBio: true,
        activeProductId: true,
      },
    })

    return NextResponse.json({ user: toPublicSettingsUser(updated) })
  } catch (error) {
    return apiError(error, {
      context: "settings PATCH",
      publicMessage: "Failed to update settings",
    })
  }
}
