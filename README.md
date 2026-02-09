# Founder OS - Founder-first + product centric Marketing & Visibility System

AuthorAI is a decision-first marketing assistant that adapts to **the PRODUCT being marketed**, not the user. The product's type, domain, audience, and maturity drive all marketing decisions

A production-grade SaaS that helps solo founders turn their real product + product activity into trust-building, conversion-ready content without the marketing stress.

## 🎯 Core Value Proposition

**Input:** Real product activity (GitHub commits, user feedback, manual notes)  
**Output:** Founder-style posts, visual content, blog drafts - all human-approved and brand-consistent

## 🏗️ Architecture

### System Layers

1. **Human Input Layer** - Minimal, guided input forms
2. **Core Insight Agent** - Claude-powered insight extraction
3. **Content Translation Layer** - Multi-format content generation
4. **Visual & Image Layer** - Diagram-first (workflow/before_after programmatic SVG + DALL·E fallback)
5. **Approval & Control Layer** - Human review and editing
6. **Automation Layer** - Inngest for scheduling and publishing

### Tech Stack

- **Frontend:** Next.js 14.2 (App Router), TypeScript, TailwindCSS, shadcn/ui
- **Backend:** Next.js API routes, Server Actions
- **Auth:** Clerk
- **Database:** PostgreSQL with Prisma ORM
- **AI:** Claude API (Anthropic) for reasoning & content; diagram-first image generation (programmatic workflow/before_after + DALL·E fallback)
- **State:** Zustand, TanStack Query

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Clerk account (for authentication)
- Anthropic API key (for Claude)
- OpenAI API key (for DALL·E)

### Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd author-ai-saas
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Add the following to your `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/founderos"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. **(Optional)** Populate the database with realistic seed data (2 products, activities, insights, content, calendar, analytics) so you can test the app with full data:
```bash
# Set your Clerk user ID (find it in Clerk Dashboard → Users, or after signing in once)
# Windows (PowerShell): $env:POPULATE_CLERK_ID="user_xxx"; npm run populate
# Unix: POPULATE_CLERK_ID=user_xxx npm run populate

# Add to .env: POPULATE_CLERK_ID=user_xxx
npm run populate

# To replace existing seed data for that user (avoids duplicates on re-run):
# POPULATE_CLEAN=1 npm run populate
```

6. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Sign in with the same Clerk user you used for `POPULATE_CLERK_ID` to see the seed data.

## 📁 Project Structure

```
├── app/
│   ├── (auth)/          # Authentication pages
│   ├── (dashboard)/     # Dashboard pages
│   ├── api/             # API routes
│   └── layout.tsx       # Root layout
├── components/
│   ├── ui/              # shadcn/ui components
│   └── providers/       # React providers
├── lib/
│   ├── claude.ts        # Claude API integration
│   ├── openai.ts        # OpenAI/DALL·E integration
│   ├── github.ts        # GitHub API integration
│   ├── db.ts            # Prisma client
│   └── utils.ts         # Utilities
└── prisma/
    └── schema.prisma    # Database schema
```

## 🔑 Key Features

### 1. Activity Tracking
- Manual activity input
- GitHub integration (commits, PRs)
- Guided questions for context

### 2. Insight Extraction
- Claude-powered analysis
- Problem → Solution framing
- Audience identification
- Impact assessment

### 3. Content Generation
- Multiple formats: posts, blogs, carousels, threads
- Platform-specific optimization
- Brand voice consistency
- Visual prompt generation

### 4. Visual Generation
- Diagram-first: workflow and before/after diagrams (programmatic SVG with real text)
- Image suggestions with Image Intent (workflow_diagram, before_after, etc.)
- DALL·E fallback for other types (diagram-only prompt constraints)
- Supported platforms for content: LinkedIn, Twitter, Facebook, Blog

### 5. Approval Workflow
- Review and edit drafts
- Approve/reject content
- Version control
- Publishing management

## 🎨 Design Principles

- **Honest & Signal-based:** No fake metrics or fabricated success
- **Human Control:** All content requires approval
- **Founder-centric:** Designed for solo founders, not marketers
- **Calm & Professional:** No influencer-style gimmicks
- **Trust-building:** Content derived from real work

## 🔐 Security

- Authentication via Clerk
- Secure API key storage
- User data isolation
- Input validation
- Error handling

## 📝 License

MIT

## 🤝 Contributing

This is a production SaaS product. Contributions should maintain the core principles:
- Human control at critical decision points
- No fake automation
- Honest, signal-based content
- Founder-first approach

## 🚧 Roadmap

- [ ] Social media publishing (LinkedIn, Twitter/X)
- [ ] Content calendar
- [ ] Analytics dashboard
- [ ] Team collaboration features
- [ ] Template marketplace
- [ ] Advanced visual customization

---

Built with ❤️ for founders who hate marketing but need visibility.
