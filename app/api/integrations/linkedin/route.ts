import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { assertCanStoreTokens, encryptToken } from "@/lib/crypto"
import { ensureUserForClerkId } from "@/lib/users"
import { parseBody, integrationLinkedInSchema } from "@/lib/validation"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await ensureUserForClerkId(userId)

    const raw = await req.json().catch(() => null)
    const parsed = parseBody(raw, integrationLinkedInSchema)
    if ("error" in parsed) return parsed.error
    const { accessToken, refreshToken, organizationId } = parsed.data

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

    assertCanStoreTokens()
    const storedAccess = encryptToken(accessToken)
    const storedRefresh = refreshToken ? encryptToken(refreshToken) : null
    if (existing) {
      await db.integration.update({
        where: { id: existing.id },
        data: {
          accessToken: storedAccess,
          refreshToken: storedRefresh,
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
          accessToken: storedAccess,
          refreshToken: storedRefresh,
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
