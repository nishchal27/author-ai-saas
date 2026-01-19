/**
 * Script to set a user to premium tier
 * Usage: npx tsx scripts/set-premium-tier.ts <clerkId>
 * 
 * Or update via API:
 * PATCH /api/settings
 * Body: { "tier": "premium" }
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function setPremiumTier(clerkId: string) {
  try {
    const user = await prisma.user.update({
      where: { clerkId },
      data: { tier: "premium" },
    })
    
    console.log(`✅ User ${user.email} has been set to premium tier`)
    return user
  } catch (error) {
    console.error("❌ Error setting premium tier:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// If run directly
if (require.main === module) {
  const clerkId = process.argv[2]
  if (!clerkId) {
    console.error("Usage: npx tsx scripts/set-premium-tier.ts <clerkId>")
    process.exit(1)
  }
  setPremiumTier(clerkId)
}

export { setPremiumTier }
