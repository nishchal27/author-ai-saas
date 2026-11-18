/**
 * Populate database with realistic seed data for testing Varabhi.
 *
 * Usage:
 *   Set POPULATE_CLERK_ID to your Clerk user ID (from Clerk Dashboard or after signing in once).
 *   If the user doesn't exist, we create one with that clerkId and a placeholder email.
 *
 *   npm run populate
 *   # or
 *   POPULATE_CLERK_ID=user_xxx npx tsx scripts/populate.ts
 *
 * Optional: set POPULATE_CLEAN=1 to delete existing activities, insights,
 * content drafts, schedules, and analytics for this user before creating (avoids duplicates on re-run).
 *
 * This seeds: User, Products (2), MarketingStrategy, Integrations, Activities,
 * Insights, ContentDrafts, Schedules, and Analytics so you can test dashboard,
 * calendar, and analytics with real-world-like data.
 */

import { PrismaClient } from "@prisma/client"
import {
  subDays,
  subWeeks,
  addDays,
  addWeeks,
  setHours,
  setMinutes,
  startOfDay,
} from "date-fns"

const db = new PrismaClient()

const CLERK_ID =
  process.env.POPULATE_CLERK_ID || process.env.NEXT_PUBLIC_SEED_CLERK_ID

function requireClerkId(): string {
  if (!CLERK_ID) {
    console.error(
      "Set POPULATE_CLERK_ID (or NEXT_PUBLIC_SEED_CLERK_ID) to your Clerk user ID."
    )
    console.error(
      "Find it in Clerk Dashboard → Users, or use the value from your session after signing in."
    )
    process.exit(1)
  }
  return CLERK_ID
}

// ---------- Strategy JSON helpers (real-world shapes) ----------

function strategySaaS() {
  return {
    platforms: JSON.stringify([
      { platform: "linkedin", priority: "primary", reasoning: "B2B founders and devs discover tools here." },
      { platform: "twitter", priority: "secondary", reasoning: "Build in public and dev community." },
      { platform: "facebook", priority: "avoid", reasoning: "Wrong audience for devtools." },
    ]),
    contentTypes: JSON.stringify([
      { type: "post", recommended: true, reasoning: "Regular updates build visibility." },
      { type: "blog", recommended: true, reasoning: "In-depth content builds authority." },
      { type: "thread", recommended: true, reasoning: "Break down complex topics." },
      { type: "carousel", recommended: false, reasoning: "Less fit for dev audience." },
    ]),
    tone: JSON.stringify({
      style: "Direct, technical, build-in-public. No hype.",
      examples: [
        "We shipped X because Y was broken.",
        "Here’s what we learned from 100 commits.",
      ],
      avoid: ["Corporate buzzwords", "Fake urgency", "Vague claims"],
    }),
    visualStyle: JSON.stringify({
      style: "Screenshots, diagrams, code snippets. No stock photos.",
      colors: "Product UI and code; minimal branding.",
      examples: ["Before/after UI", "Architecture diagram", "CLI output"],
    }),
    cadence: JSON.stringify({
      frequency: "2–3 posts per week",
      postsPerWeek: 2,
      reasoning: "Consistent presence without spam; quality over quantity.",
    }),
    proofTypes: JSON.stringify(["Ship logs", "Metrics", "User quotes", "Screenshots"]),
    antiPatterns: JSON.stringify([
      { pattern: "Hype and vague growth claims", reasoning: "Developers trust signal, not hype." },
      { pattern: "Posting only launch announcements", reasoning: "Ongoing proof builds more trust." },
    ]),
    summary:
      "Because you're building a devtools SaaS, we recommend LinkedIn and Twitter with a build-in-public tone: ship logs, metrics, and user proof. Avoid hype and corporate language.",
    reasoning:
      "Devtools buyers (founders, devs) discover and trust products through consistent, honest updates and proof. LinkedIn reaches decision-makers; Twitter reaches builders. Focus on post, blog, and thread; avoid visual-first formats that don’t fit your audience.",
    confidence: 0.85,
    status: "active",
  }
}

function strategyCourse() {
  return {
    platforms: JSON.stringify([
      { platform: "twitter", priority: "primary", reasoning: "Teaching threads and mini-lessons build authority." },
      { platform: "linkedin", priority: "primary", reasoning: "Career-focused learners and professionals." },
      { platform: "blog", priority: "secondary", reasoning: "In-depth lessons and SEO." },
    ]),
    contentTypes: JSON.stringify([
      { type: "thread", recommended: true, reasoning: "Teaching threads show expertise." },
      { type: "blog", recommended: true, reasoning: "In-depth lessons establish authority." },
      { type: "carousel", recommended: true, reasoning: "Visual summaries work well." },
      { type: "post", recommended: true, reasoning: "Regular teaching builds following." },
    ]),
    tone: JSON.stringify({
      style: "Educational, generous, 'I learned this the hard way'.",
      examples: [
        "Here’s how X actually works...",
        "The mistake I made with Y (and how to avoid it).",
      ],
      avoid: ["Corporate language", "Aggressive CTAs", "Sales-y tone"],
    }),
    visualStyle: JSON.stringify({
      style: "Clean slides, diagrams, step-by-step visuals.",
      colors: "Readable; one accent color for CTAs.",
      examples: ["Lesson carousel", "Framework diagram", "Checklist"],
    }),
    cadence: JSON.stringify({
      frequency: "3–5 short pieces per week",
      postsPerWeek: 4,
      reasoning: "Authority comes from teaching regularly, not from big launches only.",
    }),
    proofTypes: JSON.stringify(["Student outcomes", "Testimonials", "Before/after", "Syllabus preview"]),
    antiPatterns: JSON.stringify([
      { pattern: "Corporate language", reasoning: "Education requires approachability." },
      { pattern: "Aggressive CTAs", reasoning: "Teaching builds trust, not pressure." },
    ]),
    summary:
      "Because you're running an online course, we recommend Twitter and LinkedIn with teaching-first content: threads, blogs, and carousels. Build authority by sharing lessons and proof from students.",
    reasoning:
      "Course buyers need to trust the teacher. Regular teaching content (threads, blogs, carousels) builds that trust. Avoid selling before teaching; lead with value and proof.",
    confidence: 0.82,
    status: "active",
  }
}

async function main() {
  const clerkId = requireClerkId()

  console.log("Using Clerk ID:", clerkId)
  console.log("Connecting to database...")

  // ---------- 1. User (find or create) ----------
  let user = await db.user.findFirst({ where: { clerkId } })
  if (!user) {
    user = await db.user.create({
      data: {
        clerkId,
        email: `seed+${clerkId.slice(0, 12)}@example.com`,
        name: "Seed Founder",
        tier: "premium",
        founderBio:
          "Indie founder building in public. I ship devtools and teach others to ship. Previously eng at a few startups; now focused on Varabhi.",
        brandVoice: JSON.stringify({
          tone: "Direct, honest, build-in-public. No corporate speak.",
        }),
      },
    })
    console.log("Created user:", user.id)
  } else {
    console.log("Found existing user:", user.id)
  }

  const userId = user.id

  if (process.env.POPULATE_CLEAN === "1") {
    console.log("Cleaning existing activities, insights, drafts, schedules, analytics...")
    const schedules = await db.schedule.findMany({ where: { userId }, select: { id: true } })
    const scheduleIds = schedules.map((s) => s.id)
    await db.analytics.deleteMany({ where: { scheduleId: { in: scheduleIds } } })
    await db.schedule.deleteMany({ where: { userId } })
    await db.contentDraft.deleteMany({ where: { userId } })
    await db.insight.deleteMany({ where: { userId } })
    await db.activity.deleteMany({ where: { userId } })
    console.log("Clean done.")
  }

  // ---------- 2. Products (2 different products; find or create per user) ----------
  let product1 = await db.product.findFirst({
    where: { userId, name: "Varabhi" },
  })
  if (!product1) {
    product1 = await db.product.create({
      data: {
        userId,
        name: "Varabhi",
        type: "saas",
        industry: "devtools",
        audience: "developers",
        audienceDetail: "Indie founders and small teams who want to market without a full-time marketer",
        stage: "growing",
        salesMotion: "self_serve",
        description:
          "Brand-aware AI marketing workspace. Turns your brand profile and real activity into strategy and content so you can stay consistent without a full-time marketer.",
        website: "https://varabhi.example.com",
        competitors: "Buffer, Hypefury, Taplio (generic); we're product-first and strategy-first.",
        techStackJson: JSON.stringify([
          { name: "Next.js", version: "14", note: "App Router" },
          { name: "Prisma", version: "5", note: "PostgreSQL" },
          { name: "Claude", note: "Strategy and content" },
        ]),
        isActive: true,
      },
    })
  }

  let product2 = await db.product.findFirst({
    where: { userId, name: "Ship Cohort" },
  })
  if (!product2) {
    product2 = await db.product.create({
      data: {
        userId,
        name: "Ship Cohort",
        type: "course",
        industry: "education",
        audience: "smb_owners",
        audienceDetail: "First-time founders and side-project builders who want to ship and market without burning out",
        stage: "launched",
        salesMotion: "creator_led",
        description:
          "A practical course: idea → MVP → launch → first 100 users. Covers product, distribution, and content so you ship in public with a system.",
        website: "https://shipcohort.example.com",
        competitors: "Generic business courses; we're focused on indie/solo founders.",
        isActive: true,
      },
    })
  }

  console.log("Products:", product1.name, "|", product2.name)

  // Set active product to first
  await db.user.update({
    where: { id: userId },
    data: { activeProductId: product1.id },
  })

  // ---------- 3. MarketingStrategy (one per product) ----------
  await db.marketingStrategy.upsert({
    where: { productId: product1.id },
    create: {
      productId: product1.id,
      ...strategySaaS(),
    },
    update: strategySaaS(),
  })
  await db.marketingStrategy.upsert({
    where: { productId: product2.id },
    create: {
      productId: product2.id,
      ...strategyCourse(),
    },
    update: strategyCourse(),
  })
  console.log("Marketing strategies created/updated.")

  // ---------- 4. Integrations (find or create per user) ----------
  const integrationTypes = [
    { type: "github", provider: "github", config: { repo: "owner/varabhi" } },
    { type: "linkedin", provider: "linkedin", config: {} },
    { type: "twitter", provider: "twitter", config: {} },
  ]
  for (const { type, provider, config } of integrationTypes) {
    const existing = await db.integration.findFirst({
      where: { userId, type },
    })
    if (!existing) {
      await db.integration.create({
        data: {
          userId,
          type,
          provider,
          config: JSON.stringify(config),
          isActive: true,
        },
      })
    }
  }
  console.log("Integrations: github, linkedin, twitter.")

  // ---------- 5. Activities (mix of types, sources, products; some processed) ----------
  const now = new Date()
  const activitiesData = [
    {
      productId: product1.id,
      type: "github_commit",
      source: "github",
      title: "feat: add product-scoped content generation",
      description:
        "Content generation now uses active product and strategy. Updated API and UI to pass productId and strategy context to Claude.",
      metadata: JSON.stringify({ sha: "a1b2c3d4", repo: "owner/varabhi", branch: "main" }),
      processed: true,
      createdAt: subDays(now, 5),
    },
    {
      productId: product1.id,
      type: "github_pr",
      source: "github",
      title: "PR #42: Calendar view for scheduled posts",
      description:
        "Week view with scheduled/published/failed states. Integrates with /api/schedules.",
      metadata: JSON.stringify({ prNumber: 42, repo: "owner/varabhi" }),
      processed: true,
      createdAt: subDays(now, 4),
    },
    {
      productId: product1.id,
      type: "manual",
      source: "manual",
      title: "Launched public beta and opened waitlist",
      description: "Soft launch; 200 signups in first 48 hours. Feedback: people want more platform templates.",
      processed: true,
      createdAt: subDays(now, 3),
    },
    {
      productId: product1.id,
      type: "feedback",
      source: "manual",
      title: "User feedback: 'Strategy page is the killer feature'",
      description:
        "Several users said they signed up specifically for the product-based strategy. One asked for export to Notion.",
      processed: true,
      createdAt: subDays(now, 2),
    },
    {
      productId: product1.id,
      type: "github_commit",
      source: "github",
      title: "fix: analytics aggregation for multiple platforms",
      description: "Fixed double-counting when same draft was scheduled on two platforms.",
      metadata: JSON.stringify({ sha: "e5f6g7h8", repo: "owner/varabhi" }),
      processed: false,
      createdAt: subDays(now, 1),
    },
    {
      productId: product2.id,
      type: "manual",
      source: "manual",
      title: "Recorded Module 3: Distribution and first 100 users",
      description: "Covers content calendar, repurposing, and simple analytics. 45 min.",
      processed: true,
      createdAt: subDays(now, 6),
    },
    {
      productId: product2.id,
      type: "feedback",
      source: "manual",
      title: "Cohort 1 feedback: add a 'content ideas from my product' exercise",
      description: "Students want a worksheet that maps product features to content angles.",
      processed: true,
      createdAt: subDays(now, 4),
    },
    {
      productId: product2.id,
      type: "manual",
      source: "manual",
      title: "Opened enrollment for Cohort 2 (starts in 2 weeks)",
      description: "Pricing and landing page live. Early-bird discount for first 20.",
      processed: false,
      createdAt: subDays(now, 1),
    },
  ]

  const createdActivities: { id: string; productId: string | null; processed: boolean; createdAt: Date }[] = []
  for (const a of activitiesData) {
    const created = await db.activity.create({
      data: {
        userId,
        productId: a.productId,
        type: a.type,
        source: a.source,
        title: a.title,
        description: a.description ?? undefined,
        metadata: a.metadata,
        processed: a.processed,
        createdAt: a.createdAt,
      },
    })
    createdActivities.push(created)
  }
  console.log("Activities created:", createdActivities.length)

  // ---------- 6. Insights (one per processed activity; link to product + activity) ----------
  const processedActivities = createdActivities.filter((a) => a.processed)
  const insightTemplates = [
    {
      coreProblem: "Founders don't know which platforms or content types fit their product.",
      solution: "Product-aware strategy: we recommend platforms and content types based on product type, audience, and stage.",
      audience: "Indie founders and small teams",
      whyMatters: "Saves time and reduces 'what should I post?' anxiety.",
      impact: "Clear go/no-go list; content that matches the product.",
      themes: '["product-first", "strategy", "build-in-public"]',
    },
    {
      coreProblem: "Scheduled content is scattered across tools; no single calendar view.",
      solution: "Week-based calendar with scheduled, published, and failed states; schedule from approved drafts.",
      audience: "Solo founders and small marketing teams",
      whyMatters: "One place to see what's going out and when.",
      impact: "Fewer missed posts; easier to balance platforms.",
      themes: '["calendar", "scheduling", "workflow"]',
    },
    {
      coreProblem: "Launch announcements get lost; people want ongoing proof and updates.",
      solution: "Build in public: ship logs, metrics, and user proof instead of one-off launches.",
      audience: "Developers and technical founders",
      whyMatters: "Trust comes from consistency and honesty, not hype.",
      impact: "Higher engagement and trust; more qualified signups.",
      themes: '["build-in-public", "trust", "shipping"]',
    },
    {
      coreProblem: "Generic marketing advice doesn't fit devtools.",
      solution: "Strategy tailored to product type (e.g. SaaS, course, API) and audience (e.g. developers, SMB).",
      audience: "Product builders who aren't full-time marketers",
      whyMatters: "Relevant recommendations increase follow-through.",
      impact: "Better content-market fit and less wasted effort.",
      themes: '["strategy", "product-type", "audience"]',
    },
    {
      coreProblem: "Students don't know how to turn their product into content ideas.",
      solution: "Map product features and user outcomes to content angles (problems solved, how-it-works, proof).",
      audience: "Course students (first-time founders)",
      whyMatters: "Removes the 'what do I post?' block so they can ship content consistently.",
      impact: "More content shipped; content that ties back to their product.",
      themes: '["education", "content-ideas", "product-to-content"]',
    },
    {
      coreProblem: "One-off course launches don't build long-term authority.",
      solution: "Ongoing teaching content (threads, blogs, carousels) that builds trust before each cohort.",
      audience: "Potential students and past students",
      whyMatters: "Authority drives enrollment and referrals.",
      impact: "Higher conversion and repeat enrollments.",
      themes: '["teaching", "authority", "cadence"]',
    },
  ]

  const createdInsights: { id: string; productId: string | null; activityId: string | null; status: string }[] = []
  for (let i = 0; i < processedActivities.length; i++) {
    const act = processedActivities[i]
    const t = insightTemplates[i % insightTemplates.length]
    const status = i % 3 === 0 ? "approved" : "draft"
    const insight = await db.insight.create({
      data: {
        userId,
        productId: act.productId,
        activityId: act.id,
        coreProblem: t.coreProblem,
        solution: t.solution,
        audience: t.audience,
        whyMatters: t.whyMatters,
        impact: t.impact,
        themes: t.themes,
        status,
        approvedAt: status === "approved" ? subDays(now, 1) : undefined,
      },
    })
    createdInsights.push(insight)
  }
  console.log("Insights created:", createdInsights.length)

  // ---------- 7. ContentDrafts (from insights; mix of draft, approved, scheduled, published) ----------
  const approvedInsights = createdInsights.filter((i) => i.status === "approved")
  const draftsData: Array<{
    insightId: string
    productId: string | null
    type: string
    platform: string | null
    title: string
    content: string
    status: string
    intent?: string
    evaluationScore?: number
    evaluationNote?: string
    scheduledAt?: Date
    publishedAt?: Date
  }> = []

  for (let i = 0; i < approvedInsights.length; i++) {
    const ins = approvedInsights[i]
    const titles = [
      "Why we built product-aware strategy (and what we learned)",
      "Calendar view is live: one place for all scheduled content",
      "Build in public > launch-and-forget",
      "How we recommend what to post (and what not to)",
      "Turning your product into content ideas (worksheet)",
      "Teaching in public: how we run cohort-based courses",
    ]
    const contents = [
      "Most marketing tools treat every user the same. We don't. Here's how we use your product type, audience, and stage to recommend platforms and content—and what to avoid.\n\n[Problem → solution → proof]. No hype.",
      "Scheduled posts were scattered across tools. Now you get a week view: pending, published, failed. Schedule from approved drafts in one click.\n\nSmall change, big clarity.",
      "One launch post gets lost. Consistent ship logs, metrics, and user proof build trust. We're doubling down on build-in-public content that fits your product.",
      "We don't just suggest 'post more.' We look at your product (SaaS, course, API...) and audience (devs, SMB...) and recommend platforms, content types, and cadence—plus what NOT to do.",
      "Students asked for a way to go from 'my product' to 'my content ideas.' We added a worksheet: map features → problems solved → content angles. Try it in Module 3.",
      "We run Ship Cohort as cohorts. Here's how we use threads, blogs, and carousels between cohorts to build authority and keep enrollment healthy.",
    ]
    const statuses: Array<"draft" | "approved" | "scheduled" | "published"> = [
      "published",
      "published",
      "scheduled",
      "approved",
      "published",
      "draft",
    ]
    const status = statuses[i % statuses.length]
    draftsData.push({
      insightId: ins.id,
      productId: ins.productId,
      type: "post",
      platform: i % 2 === 0 ? "linkedin" : "twitter",
      title: titles[i % titles.length],
      content: contents[i % contents.length],
      status,
      intent: "build_in_public",
      evaluationScore: 0.75 + Math.random() * 0.2,
      evaluationNote: "Fits platform and product strategy; clear CTA.",
      scheduledAt: status === "scheduled" ? addDays(startOfDay(now), 2) : undefined,
      publishedAt: status === "published" ? subDays(now, 2) : undefined,
    })
  }

  const createdDrafts: { id: string; status: string; productId: string | null; platform: string | null }[] = []
  for (const d of draftsData) {
    const draft = await db.contentDraft.create({
      data: {
        userId,
        productId: d.productId,
        insightId: d.insightId,
        type: d.type,
        platform: d.platform,
        title: d.title,
        content: d.content,
        status: d.status,
        intent: d.intent,
        evaluationScore: d.evaluationScore,
        evaluationNote: d.evaluationNote,
        suggestedFormat: "post",
        suggestedPlatform: d.platform ?? undefined,
        audienceSegment: "technical",
        persona: "founder_engineer",
        scheduledAt: d.scheduledAt,
        publishedAt: d.publishedAt,
      },
    })
    createdDrafts.push({
      id: draft.id,
      status: draft.status,
      productId: draft.productId,
      platform: draft.platform,
    })
  }
  console.log("Content drafts created:", createdDrafts.length)

  // ---------- 8. Schedules (for approved/scheduled/published drafts; past and future) ----------
  const publishedDrafts = createdDrafts.filter(
    (d) => d.status === "published" || d.status === "scheduled"
  )
  const scheduleData: Array<{
    contentDraftId: string
    platform: string
    scheduledAt: Date
    publishedAt: Date | null
    status: "pending" | "published" | "failed"
    errorMessage: string | null
    externalId: string | null
  }> = []

  for (let i = 0; i < publishedDrafts.length; i++) {
    const draft = publishedDrafts[i]
    const isPublished = draft.status === "published"
    const scheduledAt = isPublished
      ? subDays(setMinutes(setHours(now, 9), 0), 2 + i)
      : addDays(setMinutes(setHours(now, 10), 30), 2)
    scheduleData.push({
      contentDraftId: draft.id,
      platform: draft.platform || "linkedin",
      scheduledAt,
      publishedAt: isPublished ? subDays(now, 2 - i) : null,
      status: isPublished ? "published" : draft.status === "scheduled" ? "pending" : "pending",
      errorMessage: null,
      externalId: isPublished ? `ext_${draft.id.slice(0, 8)}` : null,
    })
  }

  // One failed schedule for realism
  const failedDraft = createdDrafts.find((d) => d.status === "approved")
  if (failedDraft) {
    scheduleData.push({
      contentDraftId: failedDraft.id,
      platform: "twitter",
      scheduledAt: subDays(now, 1),
      publishedAt: null,
      status: "failed",
      errorMessage: "Rate limit exceeded; retry after 15 minutes.",
      externalId: null,
    })
  }

  const createdSchedules: {
    id: string
    status: string
    publishedAt: Date | null
    platform: string
  }[] = []
  for (const s of scheduleData) {
    const schedule = await db.schedule.create({
      data: {
        userId,
        contentDraftId: s.contentDraftId,
        platform: s.platform,
        scheduledAt: s.scheduledAt,
        publishedAt: s.publishedAt,
        status: s.status,
        errorMessage: s.errorMessage,
        externalId: s.externalId,
      },
    })
    createdSchedules.push({
      id: schedule.id,
      status: schedule.status,
      publishedAt: schedule.publishedAt,
      platform: schedule.platform,
    })
  }
  console.log("Schedules created:", createdSchedules.length)

  // ---------- 9. Analytics (for published schedules; multiple snapshots for some) ----------
  const publishedSchedules = createdSchedules.filter((s) => s.status === "published")
  for (const schedule of publishedSchedules) {
    const views = 200 + Math.floor(Math.random() * 800)
    const likes = Math.floor(views * (0.02 + Math.random() * 0.04))
    const comments = Math.floor(likes * 0.3)
    const shares = Math.floor(likes * 0.2)
    const impressions = Math.floor(views * 1.2)
    const engagement = impressions > 0 ? ((likes + comments + shares) / impressions) * 100 : 0
    const publishedAt = schedule.publishedAt || now

    await db.analytics.create({
      data: {
        scheduleId: schedule.id,
        platform: schedule.platform,
        views,
        likes,
        comments,
        shares,
        clicks: Math.floor(views * 0.05),
        impressions,
        engagement,
        metadata: JSON.stringify({ source: "api_sync" }),
        recordedAt: publishedAt,
      },
    })
    // Second snapshot a few days later (growth)
    await db.analytics.create({
      data: {
        scheduleId: schedule.id,
        platform: schedule.platform,
        views: views + 80,
        likes: likes + 4,
        comments: comments + 2,
        shares: shares + 1,
        clicks: Math.floor(views * 0.06),
        impressions: impressions + 100,
        engagement: (engagement * 1.1) / 100,
        metadata: JSON.stringify({ source: "api_sync" }),
        recordedAt: addDays(publishedAt, 2),
      },
    })
  }
  console.log("Analytics records created for published schedules.")

  console.log("\nDone. You can now:")
  console.log("  - Open Dashboard, Activities, Insights, Content, Calendar, and Analytics.")
  console.log("  - Switch products via the product switcher to see product-scoped data.")
  console.log("  - Use the same Clerk user to sign in and see this data.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
