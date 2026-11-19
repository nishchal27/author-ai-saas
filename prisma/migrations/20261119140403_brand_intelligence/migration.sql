-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "brandApprovedAt" TIMESTAMP(3),
ADD COLUMN     "brandFactsApproved" TEXT,
ADD COLUMN     "brandFactsProposed" TEXT,
ADD COLUMN     "brandIdeasJson" TEXT,
ADD COLUMN     "brandProfileStatus" TEXT NOT NULL DEFAULT 'incomplete',
ADD COLUMN     "brandSuggestionsJson" TEXT,
ADD COLUMN     "brandSummaryApproved" TEXT,
ADD COLUMN     "brandSummaryProposed" TEXT,
ADD COLUMN     "brandVoiceJson" TEXT;

-- CreateIndex
CREATE INDEX "Product_userId_brandProfileStatus_idx" ON "Product"("userId", "brandProfileStatus");
