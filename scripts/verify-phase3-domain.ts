import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

async function main() {
  const tables = await db.$queryRaw<{ table_name: string }[]>`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
        'ContentPillar','ContentIdea','WeeklyContentPlan',
        'WeeklyPlanItem','AiUsageEvent','ContentDraft'
      )
    ORDER BY table_name`

  const cols = await db.$queryRaw<{ column_name: string; is_nullable: string }[]>`
    SELECT column_name, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'ContentDraft'
      AND column_name IN ('insightId','contentIdeaId','generationMetaJson')
    ORDER BY column_name`

  const [draftCount, insightCount, pillarCount, ideaCount, usageCount] =
    await Promise.all([
      db.contentDraft.count(),
      db.insight.count(),
      db.contentPillar.count(),
      db.contentIdea.count(),
      db.aiUsageEvent.count(),
    ])

  console.log(JSON.stringify({ tables, cols, draftCount, insightCount, pillarCount, ideaCount, usageCount }, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
