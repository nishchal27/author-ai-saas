import { executeAi } from "@/lib/ai"
import {
  ideasGenerateSchema,
  IDEAS_GENERATE_SCHEMA_VERSION,
  type IdeasGenerateOutput,
} from "@/lib/ai/schemas/brand"
import { buildIdeasGenerateMessages } from "@/lib/ai/prompts/ideas.generate.v1"
import { assembleBrandContext } from "@/lib/brand-context/assembler"
import { db } from "@/lib/db"
import { persistGeneratedPillars } from "@/lib/pillars/service"
import { persistGeneratedIdeas } from "@/lib/ideas/service"

export async function generateBrandIdeas(opts: {
  userId: string
  productId: string
}) {
  const ctx = await assembleBrandContext({
    userId: opts.userId,
    productId: opts.productId,
    task: "ideas.generate",
  })

  const { messages, promptVersion } = buildIdeasGenerateMessages(ctx)
  const result = await executeAi<IdeasGenerateOutput>({
    task: "ideas.generate",
    userId: opts.userId,
    brandId: opts.productId,
    messages,
    jsonMode: true,
  })

  const data = result.data ?? ideasGenerateSchema.parse(JSON.parse(result.text))

  const generationMetaJson = JSON.stringify({
    schemaVersion: IDEAS_GENERATE_SCHEMA_VERSION,
    promptVersion,
    provider: result.provider,
    model: result.model,
  })

  // Durable source of truth: ContentPillar + ContentIdea rows
  const pillars = await persistGeneratedPillars({
    userId: opts.userId,
    productId: opts.productId,
    pillars: data.pillars.map((p) => ({
      name: p.name,
      description: p.description,
      purpose: `Support consistent content around: ${p.name}`,
    })),
    generationMetaJson,
  })

  const pillarsByName = new Map(
    pillars.map((p) => [p.name.toLowerCase(), p.id])
  )

  const ideas = await persistGeneratedIdeas({
    userId: opts.userId,
    productId: opts.productId,
    pillarsByName,
    ideas: data.ideas.map((i) => ({
      title: i.title,
      concept: i.concept,
      platform: i.platform,
      audience: i.audience,
      objective: i.objective,
      format: i.format,
      explanation: i.explanation,
      pillarName: i.pillar,
    })),
    generationMetaJson,
  })

  // Cache only — last AI batch snapshot for convenience
  const batchCache = {
    schemaVersion: IDEAS_GENERATE_SCHEMA_VERSION,
    promptVersion,
    generatedAt: new Date().toISOString(),
    pillars: pillars.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
    })),
    ideas: ideas.map((i) => ({
      id: i.id,
      title: i.title,
      concept: i.concept,
      platform: i.platform,
      pillar: pillars.find((p) => p.id === i.contentPillarId)?.name ?? "",
      audience: i.audience,
      objective: i.objective,
      format: i.format,
      explanation: i.explanation ?? "",
    })),
  }

  await db.product.updateMany({
    where: { id: opts.productId, userId: opts.userId },
    data: { brandIdeasJson: JSON.stringify(batchCache) },
  })

  return {
    pillars,
    ideas,
    promptVersion,
    schemaVersion: IDEAS_GENERATE_SCHEMA_VERSION,
    hasApprovedContext: ctx.meta.hasApprovedContext,
    missingFields: ctx.meta.missingFields,
    provider: result.provider,
    model: result.model,
  }
}
