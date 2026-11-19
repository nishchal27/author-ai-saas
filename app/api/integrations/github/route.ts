import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { assertCanStoreTokens, encryptToken } from "@/lib/crypto"
import { ensureUserForClerkId } from "@/lib/users"
import { parseBody, integrationGithubSchema } from "@/lib/validation"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await ensureUserForClerkId(userId)

    const raw = await req.json().catch(() => null)
    const parsed = parseBody(raw, integrationGithubSchema)
    if ("error" in parsed) return parsed.error
    const { accessToken, config } = parsed.data

    // Check if integration exists
    const existing = await db.integration.findFirst({
      where: {
        userId: user.id,
        type: "github",
      },
    })

    assertCanStoreTokens()
    const storedToken = encryptToken(accessToken)
    const configStr =
      config == null ? null : typeof config === "string" ? config : JSON.stringify(config)
    if (existing) {
      await db.integration.update({
        where: { id: existing.id },
        data: {
          accessToken: storedToken,
          config: configStr,
          isActive: true,
        },
      })
    } else {
      await db.integration.create({
        data: {
          userId: user.id,
          type: "github",
          provider: "github",
          accessToken: storedToken,
          config: configStr,
          isActive: true,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error connecting GitHub:", error)
    return NextResponse.json(
      { error: "Failed to connect GitHub" },
      { status: 500 }
    )
  }
}
