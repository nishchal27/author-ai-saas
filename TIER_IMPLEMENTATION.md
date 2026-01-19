# Tier-Based Model Selection Implementation

## Overview

Implemented a hybrid approach for Claude model selection based on user tier and content type. This allows for cost optimization while maintaining maximum quality where needed.

## Implementation Details

### 1. Database Schema Update

Added `tier` field to User model:
- Default: `"standard"`
- Options: `"standard"` | `"premium"`

### 2. Model Selection Logic

#### Insight Extraction
- **Premium Tier**: Uses Claude Opus 4.5
- **Standard Tier**: Uses Claude Sonnet 4.5

#### Content Generation
- **Blog Content**: Always uses Claude Opus 4.5 (regardless of tier)
- **Premium Tier + Other Content**: Uses Claude Opus 4.5
- **Standard Tier + Other Content**: Uses Claude Sonnet 4.5

### 3. Files Modified

1. **`prisma/schema.prisma`**
   - Added `tier` field to User model

2. **`lib/claude.ts`**
   - Added `getModelForTier()` function
   - Added `getModelForContent()` function
   - Updated `extractInsight()` to accept `userTier` parameter
   - Updated `generateContent()` to accept `userTier` parameter

3. **`app/api/insights/extract/route.ts`**
   - Fetches user tier from database
   - Passes tier to `extractInsight()` function

4. **`app/api/content/generate/route.ts`**
   - Fetches user tier from database
   - Passes tier to `generateContent()` function

5. **`app/api/settings/route.ts`**
   - Added support for updating `tier` field

6. **`app/(dashboard)/dashboard/settings/page.tsx`**
   - Added Subscription Tier section
   - Visual tier selector (Standard/Premium)
   - Real-time tier updates

## How to Set Yourself as Premium

### Option 1: Via Settings Page (Recommended)
1. Go to `/dashboard/settings`
2. Find the "Subscription Tier" section at the top
3. Click on the "Premium" card
4. Your tier will be updated immediately

### Option 2: Via API
```bash
PATCH /api/settings
Body: { "tier": "premium" }
```

### Option 3: Via Script
```bash
npx tsx scripts/set-premium-tier.ts <your-clerk-id>
```

## Model Selection Matrix

| User Tier | Content Type | Model Used |
|-----------|--------------|------------|
| Premium | Any | Opus 4.5 |
| Standard | Blog | Opus 4.5 |
| Standard | Post/Carousel/Thread/Caption | Sonnet 4.5 |

## Cost Implications

### Premium Tier (Opus 4.5)
- Insight Extraction: ~$0.01 per call (2000 tokens input)
- Content Generation: ~$0.125 per call (4000 tokens output)
- **Total per content piece: ~$0.135**

### Standard Tier (Sonnet 4.5)
- Insight Extraction: ~$0.006 per call (2000 tokens input)
- Content Generation: ~$0.06 per call (4000 tokens output)
- **Total per content piece: ~$0.066**

### Standard Tier (Blog - Opus 4.5)
- Insight Extraction: ~$0.006 per call (Sonnet)
- Content Generation: ~$0.125 per call (Opus)
- **Total per blog: ~$0.131**

## Benefits

1. **Quality Assurance**: Premium tier gets maximum quality for validation
2. **Cost Optimization**: Standard tier balances quality and cost
3. **Smart Defaults**: Blog content always uses Opus for quality
4. **Future-Ready**: Easy to add billing/subscription integration later
5. **Flexible**: Can adjust tier per user or content type

## Next Steps

1. ✅ Set yourself as premium tier in settings
2. ✅ Test content generation with Opus 4.5
3. ✅ Validate quality improvements
4. 🔄 (Future) Add billing integration
5. 🔄 (Future) Add tier limits/quotas
6. 🔄 (Future) Add tier upgrade prompts

---

**Status**: ✅ Complete and Ready to Use
