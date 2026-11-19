-- DropForeignKey
ALTER TABLE "ContentDraft" DROP CONSTRAINT "ContentDraft_insightId_fkey";

-- AlterTable
ALTER TABLE "ContentDraft" ADD COLUMN     "contentIdeaId" TEXT,
ADD COLUMN     "generationMetaJson" TEXT,
ALTER COLUMN "insightId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ContentPillar" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "purpose" TEXT,
    "approvalStatus" TEXT NOT NULL DEFAULT 'proposed',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'ai',
    "generationMetaJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentPillar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentIdea" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "contentPillarId" TEXT,
    "title" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "explanation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "source" TEXT NOT NULL DEFAULT 'ai',
    "generationMetaJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentIdea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyContentPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyContentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyPlanItem" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "contentIdeaId" TEXT,
    "contentDraftId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyPlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiUsageEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT,
    "requestId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "attemptKind" TEXT NOT NULL,
    "attemptIndex" INTEGER NOT NULL DEFAULT 0,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "estimatedCostUsd" DOUBLE PRECISION,
    "status" TEXT NOT NULL,
    "latencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiUsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentPillar_userId_productId_idx" ON "ContentPillar"("userId", "productId");

-- CreateIndex
CREATE INDEX "ContentPillar_productId_isActive_sortOrder_idx" ON "ContentPillar"("productId", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "ContentIdea_userId_productId_idx" ON "ContentIdea"("userId", "productId");

-- CreateIndex
CREATE INDEX "ContentIdea_productId_status_idx" ON "ContentIdea"("productId", "status");

-- CreateIndex
CREATE INDEX "ContentIdea_contentPillarId_idx" ON "ContentIdea"("contentPillarId");

-- CreateIndex
CREATE INDEX "WeeklyContentPlan_userId_productId_idx" ON "WeeklyContentPlan"("userId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyContentPlan_productId_weekStart_key" ON "WeeklyContentPlan"("productId", "weekStart");

-- CreateIndex
CREATE INDEX "WeeklyPlanItem_userId_productId_idx" ON "WeeklyPlanItem"("userId", "productId");

-- CreateIndex
CREATE INDEX "WeeklyPlanItem_planId_sortOrder_idx" ON "WeeklyPlanItem"("planId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyPlanItem_planId_contentIdeaId_key" ON "WeeklyPlanItem"("planId", "contentIdeaId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyPlanItem_planId_contentDraftId_key" ON "WeeklyPlanItem"("planId", "contentDraftId");

-- CreateIndex
CREATE UNIQUE INDEX "AiUsageEvent_idempotencyKey_key" ON "AiUsageEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "AiUsageEvent_userId_createdAt_idx" ON "AiUsageEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AiUsageEvent_userId_productId_createdAt_idx" ON "AiUsageEvent"("userId", "productId", "createdAt");

-- CreateIndex
CREATE INDEX "AiUsageEvent_requestId_idx" ON "AiUsageEvent"("requestId");

-- CreateIndex
CREATE INDEX "AiUsageEvent_taskId_createdAt_idx" ON "AiUsageEvent"("taskId", "createdAt");

-- CreateIndex
CREATE INDEX "ContentDraft_contentIdeaId_idx" ON "ContentDraft"("contentIdeaId");

-- CreateIndex
CREATE INDEX "ContentDraft_userId_productId_idx" ON "ContentDraft"("userId", "productId");

-- AddForeignKey
ALTER TABLE "ContentDraft" ADD CONSTRAINT "ContentDraft_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "Insight"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentDraft" ADD CONSTRAINT "ContentDraft_contentIdeaId_fkey" FOREIGN KEY ("contentIdeaId") REFERENCES "ContentIdea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentPillar" ADD CONSTRAINT "ContentPillar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentPillar" ADD CONSTRAINT "ContentPillar_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentIdea" ADD CONSTRAINT "ContentIdea_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentIdea" ADD CONSTRAINT "ContentIdea_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentIdea" ADD CONSTRAINT "ContentIdea_contentPillarId_fkey" FOREIGN KEY ("contentPillarId") REFERENCES "ContentPillar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyContentPlan" ADD CONSTRAINT "WeeklyContentPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyContentPlan" ADD CONSTRAINT "WeeklyContentPlan_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyPlanItem" ADD CONSTRAINT "WeeklyPlanItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "WeeklyContentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyPlanItem" ADD CONSTRAINT "WeeklyPlanItem_contentIdeaId_fkey" FOREIGN KEY ("contentIdeaId") REFERENCES "ContentIdea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyPlanItem" ADD CONSTRAINT "WeeklyPlanItem_contentDraftId_fkey" FOREIGN KEY ("contentDraftId") REFERENCES "ContentDraft"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiUsageEvent" ADD CONSTRAINT "AiUsageEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiUsageEvent" ADD CONSTRAINT "AiUsageEvent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
