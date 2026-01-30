# AuthorAI - Complete Implementation Documentation

**Product-Aware Marketing Intelligence System**

AuthorAI is a decision-first marketing assistant that adapts to **the PRODUCT being marketed**, not the user. The product's type, domain, audience, and maturity drive all marketing decisions.

## 📋 Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Database Schema](#database-schema)
4. [Core Features Implementation](#core-features-implementation)
5. [Product & Strategy System](#product--strategy-system)
6. [API Endpoints](#api-endpoints)
7. [AI Integration](#ai-integration)
8. [User Interface Components](#user-interface-components)
9. [Workflows & User Journeys](#workflows--user-journeys)
10. [Security & Authentication](#security--authentication)
11. [Deployment & Infrastructure](#deployment--infrastructure)

---

## 🏗️ System Architecture

### High-Level Architecture

AuthorAI follows a **product-first, layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                       │
│  Next.js 14.2 App Router | React | TypeScript         │
│  - Product Onboarding & Strategy Pages                 │
│  - Dashboard (Product-Aware)                           │
│  - Activities, Insights, Content (Product-Linked)     │
│  - State Management (TanStack Query)                  │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                    API Layer                            │
│  Next.js API Routes | Server Actions                   │
│  - Product & Strategy Management                        │
│  - Product-Aware Content Generation                    │
│  - Authentication middleware                          │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│            Strategy Decision Layer (NEW)                │
│  - Product Profile Analysis                            │
│  - Marketing Strategy Generation                       │
│  - Platform Recommendations                           │
│  - Anti-Pattern Detection                              │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                  Business Logic Layer                   │
│  - Product-Aware Insight Agent (Claude)                │
│  - Strategy-Guided Content Agent (Claude)             │
│  - Visual Generation (DALL·E)                          │
│  - GitHub Integration                                   │
│  - Social Media Publishing                              │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                    Data Layer                            │
│  Prisma ORM | PostgreSQL                                │
│  - User & Products                                      │
│  - Marketing Strategies (per product)                  │
│  - Activities, Insights, Content (product-linked)      │
│  - Schedules, Analytics                                 │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                  External Services                      │
│  - Clerk (Authentication)                               │
│  - Anthropic Claude API                                 │
│  - OpenAI DALL·E API                                    │
│  - GitHub API                                           │
│  - LinkedIn API                                         │
│  - Twitter/X API                                        │
│  - Inngest (Workflow Automation)                        │
└─────────────────────────────────────────────────────────┘
```

### Architecture Principles

1. **Product-First**: The PRODUCT determines strategy, not user preferences
2. **Decision-First**: AI helps decide what to do and what NOT to do
3. **Human-in-the-Loop**: All content requires human approval
4. **Signal-Based**: Content derived from real product activity
5. **Explainable**: Every recommendation includes reasoning
6. **Modular Design**: Each layer is independent and testable
7. **Type Safety**: TypeScript throughout
8. **Scalable**: Designed to handle multiple products per founder

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14.2 (App Router)
- **Language**: TypeScript 5.5
- **Styling**: TailwindCSS 3.4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: 
  - TanStack Query (server state)
  - Zustand (client state - available)
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Form Handling**: React Hook Form (available)

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Next.js API Routes
- **ORM**: Prisma 5.19
- **Database**: PostgreSQL
- **Authentication**: Clerk 5.0

### AI & Integrations
- **Reasoning & Content**: Anthropic Claude 3.5 Sonnet
- **Image Generation**: OpenAI DALL·E 3
- **GitHub**: Octokit REST API
- **LinkedIn**: LinkedIn API v2
- **Twitter**: Twitter API v2

### Automation
- **Scheduling & Publishing**: Inngest (code-first workflow automation)
- **Retry Logic**: Built-in Inngest retry with exponential backoff
- **Analytics Sync**: Automatic via Inngest events and cron functions

---

## 🗄️ Database Schema

### Entity Relationship Diagram

```
User
├── Product[] (One-to-many) - NEW: Core entity
│   └── MarketingStrategy (One-to-one) - NEW: AI-generated strategy
├── Integration[] (GitHub, LinkedIn, Twitter)
├── Activity[] (Product-linked)
├── Insight[] (Product-linked)
├── ContentDraft[] (Product-linked)
└── Schedule[] (Publishing schedule)

Product - NEW
├── MarketingStrategy (One-to-one)
├── Activity[] (One-to-many)
├── Insight[] (One-to-many)
└── ContentDraft[] (One-to-many)

MarketingStrategy - NEW
└── Product (One-to-one)

Activity
├── Product (Many-to-one) - NEW
└── Insight[] (One-to-many)

Insight
├── Product (Many-to-one) - NEW
└── ContentDraft[] (One-to-many)

ContentDraft
├── Product (Many-to-one) - NEW
└── Schedule[] (One-to-many)

Schedule
├── Analytics[] (One-to-many)
└── ContentDraft (Many-to-one)
```

### Models

#### User
```prisma
model User {
  id            String   @id @default(cuid())
  clerkId       String   @unique
  email         String   @unique
  name          String?
  tier          String   @default("standard") // "standard" | "premium"
  activeProductId String? // NEW: Active product context
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relations
  products      Product[] // NEW
  integrations  Integration[]
  activities    Activity[]
  insights      Insight[]
  contentDrafts ContentDraft[]
  schedules     Schedule[]
}
```

**Purpose**: Stores user account. Now supports multiple products with active product context.

#### Product (NEW - Core Entity)
```prisma
model Product {
  id          String   @id @default(cuid())
  userId      String
  name        String
  
  // Product Classification (determines strategy)
  type        String   // "saas", "course", "coaching", "physical", "event", "api", "service", "ngo"
  industry    String   // e.g., "devtools", "education", "finance"
  audience    String   // "developers", "smb_owners", "consumers", etc.
  stage       String   // "idea", "building", "launched", "growing", "mature"
  salesMotion String   // "self_serve", "demo", "creator_led", "enterprise", "impulse"
  
  // Optional context
  description String?  @db.Text
  website     String?
  competitors String?  @db.Text
  
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  user        User
  strategy    MarketingStrategy?
  activities  Activity[]
  insights    Insight[]
  contentDrafts ContentDraft[]
}
```

**Purpose**: The core entity that drives all marketing decisions. Each product has its own marketing strategy.

#### MarketingStrategy (NEW - Strategy Decision Layer)
```prisma
model MarketingStrategy {
  id          String   @id @default(cuid())
  productId   String   @unique
  
  // Platform Recommendations
  platforms   String   @db.Text  // JSON: { recommended: [...], avoid: [...], reasoning: {...} }
  
  // Content Style
  contentTypes String  @db.Text  // JSON: { recommended: [...], avoid: [...] }
  tone        String   @db.Text  // JSON: { style: "...", examples: [...], avoid: [...] }
  visualStyle String   @db.Text  // JSON: { style: "...", examples: [...] }
  
  // Execution Guidance
  cadence     String   @db.Text  // JSON: { frequency: "...", reasoning: "..." }
  proofTypes  String   @db.Text  // JSON: { types: [...], examples: [...] }
  
  // What NOT to do (very important)
  antiPatterns String  @db.Text  // JSON: { avoid: [...], reasoning: {...} }
  
  // Strategy explanation
  summary     String   @db.Text  // 2-3 sentence strategy summary
  reasoning   String   @db.Text  // Detailed explanation
  
  confidence  Float    @default(0.8)
  status      String   @default("active")
  generatedAt DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relation
  product     Product
}
```

**Purpose**: AI-generated, opinionated marketing recommendations per product. The heart of AuthorAI's value.

#### Activity
```prisma
model Activity {
  id          String   @id @default(cuid())
  userId      String
  productId   String?  // NEW: Links to product
  type        String   // "github_commit", "github_pr", "feedback", "manual"
  source      String   // "github", "manual", "upload"
  title       String
  description String?  @db.Text
  metadata    String?  @db.Text // JSON
  processed   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  user     User
  product  Product? // NEW
  insights Insight[]
}
```

**Purpose**: Tracks product activity, now linked to specific products.

#### Insight
```prisma
model Insight {
  id          String   @id @default(cuid())
  userId      String
  productId   String?  // NEW: Links to product
  activityId  String?
  coreProblem String   @db.Text
  solution    String   @db.Text
  audience    String   @db.Text
  whyMatters  String   @db.Text
  impact      String?  @db.Text
  themes      String?  @db.Text // JSON array
  status      String   @default("draft")
  approvedAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  user         User
  product      Product? // NEW
  activity     Activity?
  contentDrafts ContentDraft[]
}
```

**Purpose**: Stores AI-extracted insights, now product-aware and framed for product's audience.

#### ContentDraft
```prisma
model ContentDraft {
  id          String   @id @default(cuid())
  userId      String
  productId   String?  // NEW: Links to product (inherits strategy)
  insightId   String
  type        String   // "post", "blog", "carousel", "thread", "caption"
  platform    String?  // "linkedin", "twitter", "blog", "facebook"
  title       String?
  content     String   @db.Text
  visualPrompt String? @db.Text
  visualUrl   String?
  cta         String?
  status      String   @default("draft")
  version     Int      @default(1)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  user    User
  product Product? // NEW
  insight Insight
  schedules Schedule[]
}
```

**Purpose**: Stores generated content drafts, now linked to products and generated using product strategy.

#### Schedule
```prisma
model Schedule {
  id            String   @id @default(cuid())
  userId        String
  contentDraftId String
  platform      String
  scheduledAt   DateTime
  publishedAt   DateTime?
  status        String   @default("pending")
  externalId    String?  // Platform post ID
  // Relations...
}
```

**Purpose**: Manages content publishing schedule

#### Analytics
```prisma
model Analytics {
  id          String   @id @default(cuid())
  scheduleId  String
  platform    String
  views       Int      @default(0)
  likes       Int      @default(0)
  comments    Int      @default(0)
  shares      Int      @default(0)
  clicks      Int      @default(0)
  impressions Int     @default(0)
  engagement  Float    @default(0)
  // Relations...
}
```

**Purpose**: Tracks content performance metrics

---

## 🎯 Core Features Implementation

### 0. Product Onboarding & Strategy Generation (NEW)

#### Product Registration
**Location**: `components/onboarding/product-onboarding.tsx`

**Implementation**:
- Conversational 5-step onboarding flow
- Collects: product name, type, industry, audience, stage, sales motion
- Optional: description, website, competitors
- Feels like a guided conversation, not a form

**Flow**:
```
New User → Product Onboarding Modal →
Step 1: Product Name & Industry →
Step 2: Product Type Selection →
Step 3: Target Audience →
Step 4: Stage & Sales Motion →
Step 5: Optional Context →
AI Generates Strategy → Dashboard
```

#### Strategy Decision Engine
**Location**: `lib/strategy.ts`

**Implementation**:
- **10 encoded product patterns** from research (SaaS for devs, courses, coaching, physical products, events, APIs, services, NGOs)
- **Audience-specific refinements** (developers, SMB owners, enterprise)
- **AI-powered strategy generation** using Claude to refine heuristics
- Every recommendation includes **"what to do"** AND **"what NOT to do"**
- Summary always starts with: *"Because you are building X, we recommend Y..."*

**Strategy Output**:
- Platform recommendations (primary, secondary, avoid) with reasoning
- Content types to use and avoid
- Tone & voice guidance with examples
- Visual style recommendations
- Posting cadence (frequency + reasoning)
- Proof types that build trust
- Anti-patterns to avoid
- Human-readable summary and detailed reasoning
- Confidence score (0.0-1.0)

**API Endpoint**: `POST /api/products` (auto-generates strategy)

**Key Functions**:
- `generateMarketingStrategy()`: Main strategy generation function
- `formatStrategyForDisplay()`: Formats strategy for UI display
- `refineForAudience()`: Applies audience-specific refinements

### 1. Activity Tracking

#### Manual Activity Input
**Location**: `app/(dashboard)/dashboard/activities/new/page.tsx`

**Implementation**:
- Form with guided questions
- Minimal input required (title, optional description)
- Creates activity with `type: "manual"`, `source: "manual"`
- Stores in database via `/api/activities` POST endpoint

**Flow**:
```
User Input → Form Validation → API Call → Database → Success Toast → Redirect
```

#### GitHub Integration
**Location**: `lib/github.ts`, `app/api/github/sync/route.ts`

**Implementation**:
- Uses Octokit REST API
- Fetches commits and PRs from repository
- Parses repository URL (owner/repo format)
- Deduplicates based on commit SHA/PR number
- Creates activities with metadata

**Key Functions**:
- `fetchCommits()`: Gets recent commits
- `fetchPullRequests()`: Gets PRs
- `parseRepo()`: Parses repo string/URL

**Sync Flow**:
```
User Clicks Sync → API Call → Fetch from GitHub → Deduplicate → Create Activities → Success Toast
```

### 2. Insight Extraction (Product-Aware)

#### Core Insight Agent
**Location**: `lib/claude.ts` → `extractInsight()`

**Implementation**:
- Uses Claude 3.5 Sonnet/Opus API (tier-based)
- **NEW**: Accepts `ProductContext` parameter
- **NEW**: Frames insights appropriately for product's audience and industry
- Structured prompt with system instructions
- Extracts: problem, solution, audience, whyMatters, impact, themes
- Returns structured JSON
- Handles brand voice preferences

**Prompt Structure**:
```
System Prompt: Principles (honest, signal-based, problem→solution)
User Prompt: Activity data + human input + brand voice + PRODUCT CONTEXT
Output: Structured JSON insight (framed for product's audience)
```

**Product Context Includes**:
- Product name, type, industry
- Target audience
- Product stage
- Optional description

**API Endpoint**: `POST /api/insights/extract`

**Flow**:
```
Activity Selected → Extract Button → API Call → 
Fetch Product Context → Claude Processing (with product context) → 
Parse JSON → Save Insight (linked to product) → 
Mark Activity Processed → Success Toast → Redirect
```

### 3. Content Generation (Strategy-Guided)

#### Content Translation Agent
**Location**: `lib/claude.ts` → `generateContent()`

**Implementation**:
- Uses Claude 3.5 Sonnet/Opus API (tier-based)
- **NEW**: Accepts `ProductContext` and `StrategyContext` parameters
- **NEW**: Follows product's marketing strategy (tone, platforms, anti-patterns)
- **NEW**: Warns if using platform marked "avoid" in strategy
- Takes insight data as input
- Generates content based on type (post, blog, carousel, thread, caption)
- Platform-specific optimization
- Includes CTA and visual prompt

**Strategy Guidance Applied**:
- Tone & style from strategy
- Proof types to use
- Anti-patterns to avoid
- Platform warnings if using non-recommended platform

**Content Types**:
- **post**: 200-500 words, LinkedIn/Twitter style
- **blog**: 800-1500 words, in-depth
- **carousel**: Slide copy with visual prompt
- **thread**: Multiple short posts
- **caption**: 50-150 words

**API Endpoint**: `POST /api/content/generate`

**Flow**:
```
Insight Selected → Generate Button → API Call → 
Fetch Product & Strategy → Claude Processing (with strategy context) → 
Parse JSON → Save Draft (linked to product) → 
Return platformWarning if applicable → 
Success Toast → Redirect to Content Page
```

**Response Includes**:
- Generated draft
- `platformWarning` (if platform is not recommended)
- `strategyApplied` boolean flag

### 4. Visual Generation

#### DALL·E Integration
**Location**: `lib/openai.ts` → `generateVisual()`

**Implementation**:
- Uses OpenAI DALL·E 3 API
- Takes visual prompt from content draft
- Generates 1024x1024 image
- Returns image URL
- Stores URL in draft record

**Visual Prompt Enhancement**:
- Adds brand style preferences
- Ensures "No text overlays"
- Professional, minimalistic design

**API Endpoint**: `POST /api/visuals/generate`

**Flow**:
```
Draft with Visual Prompt → Generate Visual Button → API Call → 
DALL·E Processing → Store Image URL → Update Draft → Display Image
```

### 5. Content Approval Workflow

#### Review & Edit
**Location**: `app/(dashboard)/dashboard/content/page.tsx`

**Implementation**:
- Tab interface (Preview/Raw)
- Inline editing with textarea
- Version tracking (increments on edit)
- Status management (draft → approved → scheduled → published)

**Actions**:
- **Edit**: Opens textarea, saves new version
- **Approve**: Changes status to "approved"
- **Reject**: Changes status to "rejected"
- **Schedule**: Redirects to calendar

**API Endpoint**: `PATCH /api/content/drafts/[id]`

### 6. Calendar Scheduling

#### Calendar View
**Location**: `app/(dashboard)/dashboard/calendar/page.tsx`

**Implementation**:
- Week-by-week view using date-fns
- Grid layout (7 columns for days)
- Visual schedule cards with:
  - Platform badge
  - Time display
  - Status indicators (green/red)
  - Error messages for failed publishes

**Scheduling Dialog**:
- Select approved draft
- Choose platform
- Set date and time
- Creates schedule record

**API Endpoint**: `POST /api/schedules`

**Visual Features**:
- Today highlighting
- Hover states
- Status colors
- Navigation controls

### 7. Automated Publishing & Scheduling

#### Inngest Integration
**Location**: `lib/inngest.ts`, `app/api/inngest/[...inngest]/route.ts`

**Implementation**:
- Code-first workflow automation via Inngest
- Zero infrastructure (no Redis needed)
- Built-in retry logic with exponential backoff
- Automatic scheduling and publishing

**Inngest Functions**:

1. **`checkScheduledContent`** (Cron: Every 5 minutes)
   - Finds schedules ready to publish (`scheduledAt <= now`)
   - Publishes directly to platform APIs
   - Updates database status
   - Triggers analytics sync event (5 min delay)
   - Built-in retry: 3 attempts

2. **`syncAnalyticsAfterPublish`** (Event: `content/published`)
   - Triggered 5 minutes after publishing
   - Fetches analytics from platform APIs
   - Saves to database
   - Built-in retry: 2 attempts

3. **`syncPublishedAnalytics`** (Cron: Every hour)
   - Syncs analytics for all published content from last 24 hours
   - Updates existing analytics records
   - Handles missing integrations gracefully

4. **`retryFailedPublishes`** (Cron: Every 30 minutes)
   - Finds failed schedules from last 24 hours
   - Retries only transient errors (timeout, network, rate limit)
   - Skips permanent errors (auth failures, etc.)

**Flow**:
```
Inngest Cron (5min) → Find Pending Schedules → Publish Directly → 
Update Status → Trigger Event (5min delay) → Sync Analytics → 
Save to Database
```

**Benefits**:
- No Redis/BullMQ needed
- Automatic retry on failures
- Zero infrastructure to manage
- Free tier sufficient for solo founders
- Easy to scale later if needed

### 8. Analytics Tracking

#### Analytics Dashboard
**Location**: `app/(dashboard)/dashboard/analytics/page.tsx`

**Implementation**:
- Aggregates metrics from all published schedules
- Calculates engagement rates
- Platform-specific breakdowns
- Top performing posts
- Refresh functionality

**Metrics Calculated**:
- Total views, likes, comments, shares, clicks
- Engagement rate: (likes + comments + shares) / impressions * 100
- Platform-specific stats
- Top posts by engagement

**API Endpoint**: `GET /api/analytics`

**Sync Endpoint**: `POST /api/analytics/sync` (for manual sync)

---

## 🎯 Product & Strategy System

### Core Concept

AuthorAI adapts to **the PRODUCT being marketed**, not the user. The product's type, domain, audience, and maturity drive all marketing decisions.

### Product Onboarding Flow

**Location**: `components/onboarding/product-onboarding.tsx`

**Steps**:
1. **Product Name & Industry**: Basic product identification
2. **Product Type**: SaaS, Course, Coaching, Physical, Event, API, Service, NGO
3. **Target Audience**: Developers, SMB Owners, Consumers, Professionals, Learners, Enterprise, Creators
4. **Stage & Sales Motion**: Product maturity and sales approach
5. **Optional Context**: Description, website, competitors

**On Completion**:
- Product saved to database
- Marketing strategy automatically generated via AI
- Strategy saved to `MarketingStrategy` model
- Product set as active (if first product)

### Strategy Display

**Location**: `components/strategy/strategy-display.tsx`, `app/(dashboard)/dashboard/strategy/page.tsx`

**Features**:
- Full strategy visualization page (`/dashboard/strategy`)
- Quick-view cards on dashboard
- Platform recommendations (use/avoid) with reasoning
- Tone & voice guidance
- Posting cadence recommendations
- Anti-patterns to avoid
- Expandable detailed reasoning
- Strategy regeneration capability

### Multi-Product Support

**Location**: `components/navigation/product-switcher.tsx`

**Features**:
- Product switcher in navigation
- Each product has independent strategy
- Activities, insights, and content linked to products
- Active product context maintained across app

### Strategy Decision Engine Details

**Location**: `lib/strategy.ts`

**Architecture**:
1. **Heuristic Patterns**: 10 encoded product profiles with baseline recommendations
2. **Audience Refinements**: Audience-specific adjustments (developers vs SMB owners)
3. **AI Refinement**: Claude validates and refines recommendations with product-specific context
4. **Output**: Complete strategy with platforms, tone, cadence, anti-patterns, and reasoning

**Example Strategy Output**:
```json
{
  "summary": "Because you are building Acme Analytics, we recommend focusing on Twitter/X and GitHub with technical, low-hype content. Skip LinkedIn sales posts — developers trust competence, not persuasion.",
  "platforms": [
    { "platform": "twitter", "priority": "primary", "reasoning": "Dev community lives here" },
    { "platform": "github", "priority": "primary", "reasoning": "Build in public, show the work" },
    { "platform": "linkedin", "priority": "avoid", "reasoning": "Developers trust competence, not sales posts" }
  ],
  "tone": {
    "style": "Honest, technical, low-hype",
    "examples": ["Built this because...", "Here's how the architecture works..."],
    "avoid": ["Motivational content", "Sales posts", "Hype language"]
  },
  "cadence": { "frequency": "2-3 posts per week", "postsPerWeek": 2, "reasoning": "Consistent but sustainable" },
  "antiPatterns": [
    { "pattern": "LinkedIn sales posts", "reasoning": "Developers trust competence, not persuasion" }
  ],
  "confidence": 0.85
}
```

---

## 🔌 API Endpoints

### Authentication
All endpoints require Clerk authentication via `auth()` from `@clerk/nextjs/server`

### Products (NEW)

#### `GET /api/products`
**Purpose**: Get all products for user with their strategies
**Response**:
```json
{
  "products": [
    {
      "id": "string",
      "name": "string",
      "type": "string",
      "industry": "string",
      "audience": "string",
      "stage": "string",
      "salesMotion": "string",
      "strategy": { ... }
    }
  ],
  "activeProductId": "string"
}
```

#### `POST /api/products`
**Purpose**: Create a new product and generate its marketing strategy
**Body**:
```json
{
  "name": "string",
  "type": "saas" | "course" | "coaching" | "physical" | "event" | "api" | "service" | "ngo",
  "industry": "string",
  "audience": "developers" | "smb_owners" | "consumers" | "professionals" | "learners" | "enterprise" | "creators",
  "stage": "idea" | "building" | "launched" | "growing" | "mature",
  "salesMotion": "self_serve" | "demo" | "creator_led" | "enterprise" | "impulse",
  "description": "string (optional)",
  "website": "string (optional)",
  "competitors": "string (optional)"
}
```

**Process**:
1. Creates product in database
2. Generates marketing strategy via Strategy Decision Engine
3. Saves strategy to `MarketingStrategy` model
4. Sets as active product if it's the first one
5. Returns product with strategy

**Response**:
```json
{
  "product": { ... },
  "strategyGenerated": true
}
```

#### `PATCH /api/products`
**Purpose**: Set active product
**Body**:
```json
{
  "activeProductId": "string"
}
```

#### `GET /api/products/[id]`
**Purpose**: Get a specific product with its strategy
**Response**:
```json
{
  "product": {
    "id": "string",
    "name": "string",
    "strategy": { ... },
    "_count": {
      "activities": number,
      "insights": number,
      "contentDrafts": number
    }
  }
}
```

#### `PATCH /api/products/[id]`
**Purpose**: Update a product
**Body**:
```json
{
  "name": "string (optional)",
  "type": "string (optional)",
  "industry": "string (optional)",
  "audience": "string (optional)",
  "stage": "string (optional)",
  "salesMotion": "string (optional)",
  "description": "string (optional)",
  "website": "string (optional)",
  "competitors": "string (optional)",
  "isActive": boolean (optional)
}
```

#### `DELETE /api/products/[id]`
**Purpose**: Delete a product (cascades to strategy, activities, insights, content)

#### `GET /api/products/[id]/strategy`
**Purpose**: Get formatted strategy for display
**Response**:
```json
{
  "strategy": { ... },
  "formatted": {
    "headline": "string",
    "platforms": [...],
    "keyActions": [...],
    "dontDo": [...]
  },
  "generatedAt": "datetime",
  "confidence": 0.8
}
```

#### `POST /api/products/[id]/strategy`
**Purpose**: Regenerate marketing strategy for a product
**Response**: Same as GET, but with newly generated strategy

### Activities

#### `GET /api/activities`
**Purpose**: Fetch user's activities
**Query Params**:
- `processed`: boolean (filter by processed status)
- `productId`: string (filter by product)
- `limit`: number (default: 20)

**Response**:
```json
{
  "activities": [
    {
      "id": "string",
      "type": "string",
      "title": "string",
      "description": "string",
      "processed": boolean,
      "productId": "string (optional)",
      "product": {
        "id": "string",
        "name": "string"
      },
      "createdAt": "datetime"
    }
  ]
}
```

#### `POST /api/activities`
**Purpose**: Create new activity (automatically linked to active product)
**Body**:
```json
{
  "type": "manual",
  "title": "string",
  "description": "string (optional)",
  "metadata": "object (optional)",
  "productId": "string (optional)"
}
```

**Note**: If `productId` not provided, uses user's `activeProductId`

### Insights

#### `GET /api/insights`
**Purpose**: Fetch user's insights
**Query Params**:
- `status`: string (filter by status)
- `limit`: number

#### `POST /api/insights/extract`
**Purpose**: Extract insight from activity (product-aware)
**Body**:
```json
{
  "activityId": "string",
  "productId": "string (optional)",
  "humanInput": {
    "whatChanged": "string (optional)",
    "whoBenefited": "string (optional)",
    "whyMatters": "string (optional)"
  }
}
```

**Process**:
1. Fetches activity
2. Gets product context (from activity, provided productId, or active product)
3. Gets user brand voice
4. Calls Claude API with product context
5. Parses JSON response (insights framed for product's audience)
6. Saves insight (linked to product)
7. Marks activity as processed and links to product

**Response**:
```json
{
  "insight": { ... },
  "productApplied": true
}
```

### Content

#### `GET /api/content/drafts`
**Purpose**: Fetch content drafts (now includes product info)
**Query Params**:
- `status`: string
- `limit`: number

**Response**:
```json
{
  "drafts": [
    {
      "id": "string",
      "productId": "string (optional)",
      "product": {
        "id": "string",
        "name": "string"
      },
      ...
    }
  ]
}
```

#### `POST /api/content/generate`
**Purpose**: Generate content from insight (strategy-guided)
**Body**:
```json
{
  "insightId": "string",
  "productId": "string (optional)",
  "type": "post" | "blog" | "carousel" | "thread" | "caption",
  "platform": "linkedin" | "twitter" | "blog" | "facebook"
}
```

**Process**:
1. Fetches insight
2. Gets product and strategy (from insight, provided productId, or active product)
3. Gets user brand voice and tier
4. Calls Claude API with product context AND strategy context
5. Generates content following strategy (tone, anti-patterns, proof types)
6. Saves draft (linked to product)
7. Checks platform alignment with strategy

**Response**:
```json
{
  "draft": { ... },
  "platformWarning": "string (if platform not recommended)",
  "strategyApplied": true
}
```

#### `PATCH /api/content/drafts/[id]`
**Purpose**: Update draft (edit, approve, reject)
**Body**:
```json
{
  "content": "string (optional)",
  "status": "string (optional)"
}
```

### Visuals

#### `POST /api/visuals/generate`
**Purpose**: Generate image with DALL·E
**Body**:
```json
{
  "draftId": "string (optional)",
  "prompt": "string (optional)",
  "style": "string (optional)"
}
```

**Process**:
1. Gets visual prompt from draft (if draftId provided)
2. Enhances prompt with brand style
3. Calls DALL·E API
4. Stores image URL
5. Returns URL

### Schedules

#### `GET /api/schedules`
**Purpose**: Fetch schedules for date range
**Query Params**:
- `start`: ISO datetime
- `end`: ISO datetime

#### `POST /api/schedules`
**Purpose**: Create schedule
**Body**:
```json
{
  "contentDraftId": "string",
  "platform": "linkedin" | "twitter" | "blog" | "facebook",
  "scheduledAt": "ISO datetime"
}
```

#### `DELETE /api/schedules/[id]`
**Purpose**: Cancel schedule

### Publishing

#### `POST /api/publish`
**Purpose**: Manually publish scheduled content
**Body**:
```json
{
  "scheduleId": "string"
}
```

**Process**:
1. Validates schedule time
2. Gets platform integration
3. Publishes to platform
4. Updates status
5. Stores external ID

### Analytics

#### `GET /api/analytics`
**Purpose**: Get aggregated analytics
**Response**:
```json
{
  "analytics": {
    "totalViews": number,
    "totalLikes": number,
    "totalComments": number,
    "totalShares": number,
    "totalClicks": number,
    "totalImpressions": number,
    "averageEngagement": number,
    "topPosts": [...],
    "platformStats": {...}
  }
}
```

#### `POST /api/analytics/sync`
**Purpose**: Trigger analytics sync for specific schedule or all published content
**Body**:
```json
{
  "scheduleId": "string" // Optional - if omitted, syncs all published content
}
```

**Process**:
1. If `scheduleId` provided: Triggers Inngest event for that schedule
2. If omitted: Triggers Inngest events for all published schedules
3. Inngest function handles the actual sync (fetches from platform APIs)

### Integrations

#### `POST /api/integrations/github`
**Purpose**: Connect GitHub
**Body**:
```json
{
  "accessToken": "string",
  "config": "string (JSON)"
}
```

#### `POST /api/integrations/linkedin`
**Purpose**: Connect LinkedIn
**Body**:
```json
{
  "accessToken": "string",
  "refreshToken": "string (optional)"
}
```

#### `POST /api/integrations/twitter`
**Purpose**: Connect Twitter/X
**Body**:
```json
{
  "accessToken": "string",
  "refreshToken": "string (optional)"
}
```

### Settings

#### `GET /api/settings`
**Purpose**: Get user settings

#### `PATCH /api/settings`
**Purpose**: Update user settings
**Body**:
```json
{
  "brandVoice": "string (JSON)",
  "brandColors": "string (JSON)",
  "visualStyle": "string (JSON)",
  "tier": "standard" | "premium"
}
```

**Tier Management**:
- `standard`: Uses Sonnet 4.5 (Opus for blogs)
- `premium`: Uses Opus 4.5 for all content
- Default: `standard`

### Automation

#### `GET /api/cron/publish`
**Purpose**: Legacy cron endpoint (kept for backward compatibility)
**Headers**:
- `Authorization: Bearer {CRON_SECRET}`

**Note**: Inngest handles all automation automatically. This endpoint can trigger Inngest manually if needed, but Inngest functions run automatically via cron.

#### `POST /api/inngest/[...inngest]`
**Purpose**: Inngest webhook endpoint
**Description**: Handles all Inngest function invocations and webhooks
**Functions Registered**:
- `checkScheduledContent` - Publishes scheduled content
- `syncAnalyticsAfterPublish` - Syncs analytics after publishing
- `syncPublishedAnalytics` - Hourly analytics sync
- `retryFailedPublishes` - Retries failed publishes

---

## 🤖 AI Integration

### Claude API Integration

#### Setup
**Location**: `lib/claude.ts`

```typescript
import Anthropic from "@anthropic-ai/sdk"

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})
```

#### Insight Extraction (Product-Aware)

**Function**: `extractInsight(activityData, brandVoice, userTier, productContext?)`

**Model Selection** (tier-based):
- Premium tier: `claude-3-5-opus-20241022`
- Standard tier: `claude-3-5-sonnet-20241022`

**Max Tokens**: 2000
**Output**: Structured JSON

**System Prompt**:
- Principles: honest, signal-based, problem→solution
- Frame insights appropriately for product's audience and industry
- Output format specification
- No fabrication rules

**User Prompt**:
- Activity title, type, description
- Human input (whatChanged, whoBenefited, whyMatters)
- **Product Context** (NEW): name, type, industry, audience, stage, description
- Brand voice preferences

**Product Context Impact**:
- Insights framed for product's target audience
- Themes aligned with product's industry
- Language appropriate for product stage

**Response Parsing**:
- Extracts JSON from text response
- Validates structure
- Returns typed object

#### Content Generation (Strategy-Guided)

**Function**: `generateContent(insight, type, platform, brandVoice, userTier, productContext?, strategyContext?)`

**Model Selection**:
- Premium tier: `claude-3-5-opus-20241022` (all content types)
- Standard tier + Blog: `claude-3-5-opus-20241022`
- Standard tier + Other: `claude-3-5-sonnet-20241022`

**Max Tokens**: 4000
**Output**: Content draft with title, content, CTA, visualPrompt

**Strategy Context Applied** (NEW):
- **Tone & Style**: Follows strategy's tone recommendations
- **Proof Types**: Uses recommended proof types
- **Anti-Patterns**: Avoids patterns marked in strategy
- **Platform Warnings**: Warns if using platform marked "avoid"

**Platform Guidance**:
- LinkedIn: Professional, thoughtful, longer form
- Twitter: Concise, punchy, 280 char limit
- Blog: In-depth, SEO-friendly
- Facebook: Community-oriented, shareable
- GitHub: Technical, precise, documentation-style
- HackerNews: Technical, substantive, no marketing speak

**Brand Voice Integration**:
- Passes brand voice to Claude (as override if provided)
- Strategy tone takes precedence
- Maintains consistency across content

### OpenAI DALL·E Integration

#### Setup
**Location**: `lib/openai.ts`

```typescript
import OpenAI from "openai"

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})
```

#### Image Generation

**Function**: `generateVisual()`

**Model**: `dall-e-3`
**Size**: 1024x1024
**Quality**: standard

**Prompt Enhancement**:
- Adds brand style preferences
- Ensures "No text overlays"
- Professional, minimalistic design

**Process**:
1. Enhances prompt
2. Calls DALL·E API
3. Returns image URL
4. Stores in database

---

## 🎨 User Interface Components

### Page Components

#### Dashboard (`app/(dashboard)/dashboard/page.tsx`)
- **Product context display** (NEW): Shows active product name, type, audience, stage
- **Strategy quick-view** (NEW): Displays strategy summary, recommended platforms, cadence
- Stat cards (Activities, Insights, Drafts, Strategy Confidence)
- Recent activities feed (product-linked)
- Pending drafts list
- **No product state** (NEW): Welcome screen with product onboarding CTA
- Loading skeleton
- Empty states with CTAs

#### Strategy (`app/(dashboard)/dashboard/strategy/page.tsx`) (NEW)
- Full strategy visualization
- Product profile summary
- Platform recommendations (use/avoid) with reasoning
- Tone & voice guidance
- Posting cadence
- Proof types
- Anti-patterns to avoid
- Expandable detailed reasoning
- Strategy regeneration button

#### Activities (`app/(dashboard)/dashboard/activities/page.tsx`)
- **Product badges** (NEW): Shows which product each activity belongs to
- Search and filter
- Activity cards
- Extract insight button (with product context)
- Status badges
- Loading skeleton
- Empty state

#### Insights (`app/(dashboard)/dashboard/insights/page.tsx`)
- Insight cards with sections
- Generate content buttons (strategy-guided)
- Search and filter
- Loading skeleton
- Empty state

#### Content (`app/(dashboard)/dashboard/content/page.tsx`)
- **Product badges** (NEW): Shows which product each draft belongs to
- **Strategy alignment warnings** (NEW): Amber banner if content uses platform marked "avoid"
- **Platform badges** (NEW): Color-coded (green for primary, red for avoid)
- Tab interface (Preview/Raw)
- Content preview component
- Edit interface
- Action buttons (Edit, Approve, Reject, Schedule)
- Visual generation button
- Search and filter
- Loading skeleton
- Empty state

#### Calendar (`app/(dashboard)/dashboard/calendar/page.tsx`)
- Week view grid
- Schedule cards
- Status indicators
- Scheduling dialog
- Navigation controls
- Toast notifications

#### Analytics (`app/(dashboard)/dashboard/analytics/page.tsx`)
- Metric cards
- Platform breakdowns
- Top posts list
- Detailed metrics
- Refresh button

#### Settings (`app/(dashboard)/dashboard/settings/page.tsx`)
- Brand voice form
- GitHub integration
- LinkedIn integration
- Twitter integration
- Help tooltips
- Sync button

### Reusable Components

#### Empty States
- `EmptyActivity`: Activities page
- `EmptyInsights`: Insights page
- `EmptyContent`: Content page

**Features**:
- Large icons
- Clear headings
- Helpful descriptions
- CTA buttons

#### Loading Skeletons
- `DashboardSkeleton`: Dashboard page
- `ActivitySkeleton`: Activities page
- `InsightSkeleton`: Insights page
- `ContentSkeleton`: Content page

**Features**:
- Matches actual layout
- Smooth animations
- Professional appearance

#### Content Preview (`components/content-preview.tsx`)
**Features**:
- Platform-specific styling
- Character count (Twitter)
- Image preview
- Title display
- Platform icons

#### Search Filter (`components/search-filter.tsx`)
**Features**:
- Search input with icon
- Clear button
- Filter dropdown
- Real-time filtering

#### Navigation (`components/navigation/nav-links.tsx`)
**Features**:
- Active state highlighting
- Icons for all items
- Responsive design
- Hover states

#### Product Onboarding (`components/onboarding/product-onboarding.tsx`) (NEW)
**Features**:
- Conversational 5-step flow
- Product name, type, industry, audience, stage, sales motion
- Optional context (description, website, competitors)
- Progress indicator
- Step icons
- Product summary preview
- Auto-generates strategy on completion

#### Strategy Display (`components/strategy/strategy-display.tsx`) (NEW)
**Features**:
- Full strategy visualization
- Platform recommendations with reasoning
- Tone & voice guidance
- Cadence recommendations
- Anti-patterns display
- Strategy regeneration
- Compact and full display modes

#### Product Switcher (`components/navigation/product-switcher.tsx`) (NEW)
**Features**:
- Dropdown for multiple products
- Shows active product
- Quick add product option
- Compact mode for single product

### UI Components (shadcn/ui)

All components from shadcn/ui library:
- Button
- Card
- Input
- Textarea
- Label
- Dialog
- Badge
- Select
- Tabs
- Toast
- Tooltip
- Progress
- Skeleton

---

## 🔄 Workflows & User Journeys

### Complete User Flow

#### 1. Product Onboarding Flow (NEW - First Step)
```
New User Signs Up → Product Onboarding Modal →
Step 1: Product Name & Industry →
Step 2: Product Type Selection →
Step 3: Target Audience →
Step 4: Stage & Sales Motion →
Step 5: Optional Context →
AI Generates Marketing Strategy →
Strategy Displayed →
Dashboard (Product-Aware)
```

#### 2. Activity → Content Flow (Product-Aware)

**Manual Activity**:
```
Dashboard (with active product) → New Activity → Fill Form → 
Create Activity (linked to product) → Activities Page → 
Extract Insight (with product context) → Insights Page → 
Generate Content (with product strategy) → Content Page → 
Review & Approve (with strategy alignment warnings) → 
Calendar → Schedule → Auto-Publish → Analytics
```

**GitHub Activity**:
```
Settings → Connect GitHub → Sync GitHub → 
Activities Page (product-linked) → Extract Insight (product-aware) → 
[Same as manual flow]
```

#### 3. Content Approval Flow (Strategy-Aware)
```
Content Page → View Draft (with product context) → 
Check Strategy Alignment (platform warnings) →
Preview Tab → Review → 
Edit (if needed) → Approve → 
Calendar → Schedule → 
Auto-Publish → Track Analytics
```

#### 4. Multi-Product Flow (NEW)
```
Dashboard → Product Switcher → Select Product →
All Activities/Insights/Content filtered by product →
Each product has independent strategy →
Switch between products seamlessly
```

#### 5. Publishing Flow
```
Scheduled Time Arrives → Inngest Cron Triggers → 
Find Ready Schedules → Get Integration → 
Publish to Platform → Update Status → 
Store External ID → Sync Analytics (later)
```

---

## 🔐 Security & Authentication

### Authentication

**Provider**: Clerk
**Implementation**: `@clerk/nextjs`

**Features**:
- Email/password sign-up
- Social login (configurable)
- Session management
- User profile management

**Middleware**: `middleware.ts`
- Protects all routes except auth pages
- Redirects unauthenticated users

### Authorization

**Pattern**: User-scoped data access
- All queries filter by `userId`
- API routes verify user ownership
- Database relations enforce isolation

### API Security

**Authentication**: Clerk `auth()` on all routes
**Validation**: Input validation on all endpoints
**Error Handling**: Sanitized error messages
**Rate Limiting**: (Recommended for production)

### Data Security

**API Keys**: Stored in database (consider encryption for production)
**Tokens**: Stored securely in Integration model
**User Data**: Isolated per user via Prisma relations

---

## 🚀 Deployment & Infrastructure

### Recommended Platform: Vercel

**Why Vercel**:
- Native Next.js support
- Automatic deployments
- Built-in environment variables
- PostgreSQL addon available
- Inngest integration (automatic)

### Environment Variables

**Required**:
```env
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..."
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
CRON_SECRET="your-secure-random-string"
```

**Optional** (for OAuth - future):
```env
LINKEDIN_CLIENT_ID="..."
LINKEDIN_CLIENT_SECRET="..."
TWITTER_CLIENT_ID="..."
TWITTER_CLIENT_SECRET="..."
```

**Inngest** (automatic - no config needed):
- Functions auto-register when deployed
- Create account at [inngest.com](https://inngest.com)
- No additional environment variables required

### Database Setup

**Options**:
1. Vercel Postgres (recommended)
2. Supabase
3. Neon
4. Railway
5. Self-hosted PostgreSQL

**Migrations**:
```bash
npx prisma generate
npx prisma db push
```

### Inngest Setup

**Automatic**: Functions register automatically when deployed
**Manual Setup**:
1. Create account at [inngest.com](https://inngest.com)
2. Create new app
3. Deploy your application
4. Functions will auto-register via `/api/inngest/[...inngest]` endpoint

**Note**: Legacy cron endpoint (`/api/cron/publish`) is kept for backward compatibility but Inngest handles all automation automatically.

### Build & Deploy

```bash
npm run build
vercel --prod
```

---

## 📦 Key Libraries & Dependencies

### Core Dependencies

```json
{
  "next": "14.2.0",
  "react": "^18.3.1",
  "typescript": "^5.5.4",
  "@clerk/nextjs": "^5.0.0",
  "@prisma/client": "^5.19.0",
  "@anthropic-ai/sdk": "^0.24.3",
  "openai": "^4.52.0",
  "@octokit/rest": "^20.1.1",
  "@tanstack/react-query": "^5.56.2",
  "tailwindcss": "^3.4.7",
  "date-fns": "^3.6.0",
  "lucide-react": "^0.427.0"
}
```

### UI Dependencies

- `@radix-ui/*`: Accessible component primitives
- `class-variance-authority`: Component variants
- `tailwind-merge`: Tailwind class merging
- `clsx`: Conditional class names

---

## 🔧 Configuration Files

### `next.config.js`
- Image domain configuration for DALL·E images

### `tailwind.config.ts`
- Design system configuration
- Color palette
- Border radius
- Animations

### `tsconfig.json`
- TypeScript configuration
- Path aliases (`@/*`)

### `vercel.json`
- Cron job configuration
- Publishing schedule

### `prisma/schema.prisma`
- Database schema
- Relationships
- Indexes

---

## 🎯 Implementation Patterns

### Error Handling Pattern

```typescript
try {
  // Operation
  return NextResponse.json({ success: true, data })
} catch (error) {
  console.error("Error:", error)
  return NextResponse.json(
    { error: "User-friendly message" },
    { status: 500 }
  )
}
```

### Authentication Pattern

```typescript
const { userId } = await auth()
if (!userId) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
```

### Data Fetching Pattern

```typescript
const { data, isLoading } = useQuery({
  queryKey: ["resource"],
  queryFn: fetchResource,
})
```

### Mutation Pattern

```typescript
const mutation = useMutation({
  mutationFn: updateResource,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["resource"] })
    toast({ title: "Success", variant: "success" })
  },
  onError: (error) => {
    toast({ title: "Error", description: error.message, variant: "destructive" })
  },
})
```

---

## 📈 Performance Optimizations

### Client-Side
- React Query caching
- useMemo for filtered data
- Skeleton loaders (perceived performance)
- Optimistic updates (where applicable)

### Server-Side
- Prisma query optimization
- Indexed database queries
- Efficient data fetching
- Error boundaries

### Image Optimization
- Next.js Image component (recommended for production)
- DALL·E images stored as URLs
- Lazy loading (can be added)

---

## 🧪 Testing Recommendations

### Unit Tests
- Core functions (insight extraction, content generation)
- Utility functions
- Data transformations

### Integration Tests
- API endpoints
- Database operations
- External API calls (mocked)

### E2E Tests
- Complete user flows
- Authentication
- Publishing workflow

### Tools Recommended
- Vitest (unit tests)
- Playwright (E2E tests)
- MSW (API mocking)

---

## 🔄 Future Enhancements

### Planned (Not in MVP)
1. **OAuth Flows**: LinkedIn, Twitter, GitHub OAuth
2. **Team Features**: Multi-user collaboration
3. **Advanced Analytics**: Charts, trends, insights
4. **Content Templates**: Reusable templates
5. **Bulk Operations**: Bulk approve, schedule, delete
6. **Export/Import**: Backup and restore
7. **Webhooks**: Custom webhook integrations
8. **API Rate Limiting**: Per-user limits
9. **Subscription System**: Billing integration
10. **Mobile App**: React Native version

---

## 📚 Code Organization

### Directory Structure

```
author-ai-saas/
├── app/
│   ├── (auth)/              # Auth pages
│   ├── (dashboard)/         # Dashboard pages
│   │   └── dashboard/
│   │       ├── page.tsx      # Main dashboard (product-aware)
│   │       ├── strategy/     # Strategy page (NEW)
│   │       ├── activities/   # Activities pages (product-linked)
│   │       ├── insights/     # Insights pages
│   │       ├── content/      # Content pages (strategy-aligned)
│   │       ├── calendar/     # Calendar page
│   │       ├── analytics/    # Analytics page
│   │       └── settings/     # Settings page
│   ├── api/                  # API routes
│   │   ├── products/         # Product & Strategy APIs (NEW)
│   │   │   ├── route.ts      # GET, POST, PATCH products
│   │   │   ├── [id]/         # Single product operations
│   │   │   └── [id]/strategy/ # Strategy operations
│   │   ├── activities/       # Activities (product-linked)
│   │   ├── insights/         # Insights (product-aware)
│   │   ├── content/          # Content (strategy-guided)
│   │   ├── schedules/
│   │   ├── analytics/
│   │   ├── integrations/
│   │   ├── settings/
│   │   ├── cron/
│   │   └── inngest/          # Inngest webhooks
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Landing page (repositioned)
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── navigation/           # Navigation components
│   │   ├── nav-links.tsx     # Navigation links
│   │   └── product-switcher.tsx # Product switcher (NEW)
│   ├── onboarding/           # Onboarding components
│   │   └── product-onboarding.tsx # Product onboarding (NEW)
│   ├── strategy/             # Strategy components (NEW)
│   │   └── strategy-display.tsx # Strategy visualization
│   ├── empty-states/         # Empty state components
│   ├── loading/              # Loading skeletons
│   ├── landing/              # Landing page components
│   ├── content-preview.tsx   # Content preview
│   ├── search-filter.tsx     # Search component
│   └── error-boundary.tsx    # Error boundary
├── lib/
│   ├── claude.ts             # Claude API (product-aware)
│   ├── strategy.ts           # Strategy Decision Engine (NEW)
│   ├── openai.ts             # OpenAI/DALL·E API
│   ├── github.ts             # GitHub API
│   ├── linkedin.ts           # LinkedIn API
│   ├── twitter.ts            # Twitter API
│   ├── db.ts                 # Prisma client
│   └── utils.ts              # Utilities
├── hooks/
│   └── use-toast.ts          # Toast hook
├── prisma/
│   └── schema.prisma         # Database schema (Product, MarketingStrategy)
└── middleware.ts             # Auth middleware
```

### Naming Conventions

- **Components**: PascalCase (`ContentPreview.tsx`)
- **Functions**: camelCase (`extractInsight()`)
- **API Routes**: kebab-case (`/api/content/generate`)
- **Database Models**: PascalCase (`ContentDraft`)
- **Types/Interfaces**: PascalCase (`InsightExtraction`)

---

## 🎓 Key Design Decisions

### 1. Product-First Architecture (NEW - Core Pivot)
**Decision**: The PRODUCT determines strategy, not user preferences
**Rationale**: Different products need different approaches. One founder can market multiple products correctly.
**Implementation**: Product model → Strategy generation → Product-aware content generation

### 2. Decision-First Approach (NEW)
**Decision**: Tell founders what TO do and what NOT to do
**Rationale**: Reduces decision fatigue. Confidence comes from knowing what to skip.
**Implementation**: Strategy includes anti-patterns, platform recommendations (use/avoid), clear reasoning

### 3. Strategy Decision Layer (NEW)
**Decision**: Heuristics + AI refinement, not pure AI
**Rationale**: Opinionated, explainable, conservative. Rules come first, AI refines.
**Implementation**: 10 encoded product patterns → Audience refinements → Claude validation

### 4. Human-in-the-Loop
**Decision**: All content requires approval
**Rationale**: Maintains founder voice, prevents mistakes
**Implementation**: Status workflow (draft → approved → scheduled → published)

### 5. Signal-Based Content
**Decision**: Content derived from real activity
**Rationale**: Honest, trust-building, no fake metrics
**Implementation**: Activity → Insight → Content flow (all product-linked)

### 6. Strategy-Guided Content Generation (NEW)
**Decision**: Content follows product's marketing strategy
**Rationale**: Ensures content aligns with product's needs, not generic templates
**Implementation**: Content generation uses strategy context (tone, anti-patterns, proof types)

### 7. Platform-Specific Generation
**Decision**: Generate content optimized for each platform
**Rationale**: Better engagement, platform-specific best practices
**Implementation**: Platform parameter in content generation + strategy alignment warnings

### 8. Automated Publishing
**Decision**: Inngest-based automation
**Rationale**: Reliable, scalable, zero infrastructure
**Implementation**: Inngest cron functions + event-driven analytics sync

### 9. Manual Token Input (MVP)
**Decision**: Manual tokens instead of OAuth
**Rationale**: Faster to market, simpler implementation
**Future**: OAuth flows documented for later

---

## 🔍 Troubleshooting Guide

### Common Issues

#### Database Connection
**Error**: "Can't reach database server"
**Solution**: Check DATABASE_URL, verify database is running

#### Claude API Errors
**Error**: "No JSON found in Claude response"
**Solution**: Check API key, verify model availability

#### Publishing Fails
**Error**: "No active integration found"
**Solution**: Verify integration is connected and active

#### Cron Job Not Running
**Error**: Schedules not publishing
**Solution**: Check CRON_SECRET, verify Vercel cron config

---

## 📝 API Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": "Optional details"
}
```

### Pagination (Future)
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "hasMore": true
  }
}
```

---

## 🎯 Performance Metrics

### Current Performance
- **Page Load**: < 2s (target)
- **API Response**: < 500ms (target)
- **AI Generation**: 5-15s (Claude), 10-20s (DALL·E)
- **Database Queries**: < 100ms (target)

### Optimization Opportunities
- Add Redis caching for insights
- Implement pagination
- Add CDN for images
- Optimize database queries

---

## 🔐 Security Best Practices

### Implemented
- ✅ User authentication (Clerk)
- ✅ User-scoped data access
- ✅ Input validation
- ✅ Error message sanitization
- ✅ HTTPS (via Vercel)

### Recommended for Production
- ⚠️ API rate limiting
- ⚠️ Encrypt stored API keys
- ⚠️ Add CSRF protection
- ⚠️ Implement request logging
- ⚠️ Add monitoring (Sentry)

---

## 📊 Data Flow Diagrams

### Product-First Flow (NEW)

```
┌─────────────┐
│   Product   │
│ Registration│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Strategy   │
│  Generation │
│  (Claude +  │
│  Heuristics)│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Marketing  │
│  Strategy   │
│  (Stored)   │
└─────────────┘
```

### Activity → Content Flow (Product-Aware)

```
┌─────────────┐
│  Activity   │
│  (Linked to │
│   Product)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Extract    │────▶│   Insight    │     │   Product    │
│  Insight    │     │  (Claude +   │◀────│   Context    │
│  (Product-  │     │  Product     │     │              │
│   Aware)    │     │  Context)    │     └──────────────┘
└─────────────┘     └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐     ┌──────────────┐
                    │   Generate   │     │  Marketing   │
                    │   Content    │◀────│  Strategy    │
                    │  (Claude +   │     │  (Tone,      │
                    │  Strategy)   │     │  Platforms,  │
                    └──────┬───────┘     │  Anti-       │
                           │            │  Patterns)   │
                           ▼            └──────────────┘
                    ┌──────────────┐
                    │    Draft     │
                    │  (Review +   │
                    │  Alignment   │
                    │  Warnings)   │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Schedule   │
                    │  (Calendar)  │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Inngest    │
                    │  (Auto Pub)  │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Publish    │
                    │  (Platform)  │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Analytics   │
                    │  (Auto Sync) │
                    └──────────────┘
```

---

## 🎨 Design System

### Colors
- **Primary**: Dark blue-gray (professional)
- **Secondary**: Light gray (subtle)
- **Success**: Green (positive actions)
- **Destructive**: Red (errors, deletions)
- **Muted**: Gray (secondary text)

### Typography
- **Font**: Inter (system font stack)
- **Headings**: Bold, clear hierarchy
- **Body**: Regular, readable
- **Code**: Monospace (for technical content)

### Spacing
- **Base Unit**: 4px
- **Common Gaps**: 2, 4, 6, 8 (8px, 16px, 24px, 32px)
- **Container**: Max-width 1400px, centered

### Components
- **Cards**: Rounded, shadow, border
- **Buttons**: Rounded, clear states
- **Inputs**: Rounded, focus rings
- **Badges**: Rounded-full, small

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All environment variables set
- [ ] Database migrations run
- [ ] Inngest account created and configured
- [ ] Error tracking set up (Sentry)
- [ ] Analytics set up (optional)

### Post-Deployment
- [ ] Test authentication flow
- [ ] Test complete user journey
- [ ] Verify cron jobs running
- [ ] Check error logs
- [ ] Monitor API usage

---

## 📖 Developer Guide

### Adding a New Feature

1. **Database**: Update `prisma/schema.prisma`
2. **API**: Create route in `app/api/`
3. **UI**: Create page/component
4. **Integration**: Add to navigation if needed
5. **Test**: Verify end-to-end

### Adding a New Integration

1. **Library**: Add integration library
2. **Service**: Create service file in `lib/`
3. **API**: Create integration endpoint
4. **UI**: Add to settings page
5. **Test**: Verify connection and usage

---

## 🎉 Summary

**AuthorAI** is a complete, production-ready **product-aware marketing intelligence system** with:

### Core Innovation
- ✅ **Product-First Architecture**: The PRODUCT determines strategy, not user preferences
- ✅ **Strategy Decision Engine**: AI generates opinionated marketing recommendations per product
- ✅ **Multi-Product Support**: One founder can market multiple products, each with its own strategy
- ✅ **Decision-First Approach**: Tells founders what TO do and what NOT to do

### Implementation
- ✅ **8 Dashboard Pages**: Dashboard, Strategy, Activities, Insights, Content, Calendar, Analytics, Settings
- ✅ **30+ API Endpoints**: Complete REST API including Product & Strategy management
- ✅ **AI Integration**: Claude (product-aware) + DALL·E
- ✅ **Strategy System**: 10 encoded product patterns + AI refinement
- ✅ **3 Social Platforms**: LinkedIn, Twitter, GitHub
- ✅ **Automated Publishing**: Inngest-based (zero infrastructure)
- ✅ **Analytics**: Complete tracking with automatic sync
- ✅ **Professional UI/UX**: Polished, calm, decision-focused

### Total Implementation
- **~60+ Components** (including Product Onboarding, Strategy Display, Product Switcher)
- **~35+ API Routes** (including Product & Strategy endpoints)
- **~15+ Library Functions** (including Strategy Decision Engine)
- **9 Database Models** (User, Product, MarketingStrategy, Activity, Insight, ContentDraft, Schedule, Analytics, Integration)
- **Complete Product-Aware User Flows**

### Key Features
1. **Product Onboarding**: Conversational 5-step product registration
2. **Strategy Generation**: Automatic AI-generated marketing strategy per product
3. **Product-Aware Content**: Content generated using product strategy (tone, platforms, anti-patterns)
4. **Strategy Alignment**: Warnings when content uses non-recommended platforms
5. **Multi-Product**: Easy switching between products, each with independent strategy

**Status**: ✅ **Production-Ready for Beta Launch**

**Positioning**: "Product-aware marketing intelligence for founders. Know what marketing to do for YOUR product."

---

*This documentation covers the complete implementation of AuthorAI as of the current version. For updates and changes, refer to the codebase and commit history.*
