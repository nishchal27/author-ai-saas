# OAuth Implementation Guide

## Overview

OAuth flows for LinkedIn and Twitter are documented but not fully implemented. Manual token input works for MVP, but OAuth provides better UX.

## Why Not Implemented Yet

OAuth requires:
1. App registration with each platform
2. Redirect URL configuration
3. OAuth callback handling
4. Token refresh logic
5. Platform-specific implementations

**For MVP**: Manual tokens are acceptable and work perfectly.

## Implementation Steps (When Ready)

### LinkedIn OAuth

1. **Register App**:
   - Go to LinkedIn Developer Portal
   - Create new app
   - Add redirect URL: `https://yourdomain.com/api/auth/linkedin/callback`
   - Request permissions: `w_member_social`, `r_liteprofile`

2. **Create OAuth Route** (`app/api/auth/linkedin/route.ts`):
```typescript
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const clientId = process.env.LINKEDIN_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/linkedin/callback`
  const state = crypto.randomUUID()
  
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=w_member_social%20r_liteprofile`
  
  return NextResponse.redirect(authUrl)
}
```

3. **Create Callback Route** (`app/api/auth/linkedin/callback/route.ts`):
```typescript
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@clerk/nextjs/server"

export async function GET(req: Request) {
  const { userId } = await auth()
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  
  // Exchange code for token
  const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: code!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/linkedin/callback`,
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
  })
  
  const tokens = await tokenResponse.json()
  
  // Save to database
  const user = await db.user.findFirst({ where: { clerkId: userId! } })
  await db.integration.upsert({
    where: { userId_type: { userId: user!.id, type: "linkedin" } },
    create: {
      userId: user!.id,
      type: "linkedin",
      provider: "linkedin",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      isActive: true,
    },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      isActive: true,
    },
  })
  
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?linkedin=connected`)
}
```

### Twitter OAuth

Twitter OAuth is more complex (OAuth 1.0a):

1. **Register App**:
   - Go to Twitter Developer Portal
   - Create app
   - Add callback URL: `https://yourdomain.com/api/auth/twitter/callback`

2. **Implementation**:
   - Use `oauth-1.0a` library
   - Three-step OAuth flow
   - Request token → Authorize → Access token

**Recommendation**: Use a library like `twitter-api-v2` or `oauth-1.0a` for Twitter OAuth.

## Current State

- ✅ Manual token input works
- ✅ Publishing works with manual tokens
- ⚠️ OAuth flows documented but not implemented
- ✅ Token refresh logic can be added later

## Recommendation

**For MVP/Beta**: Keep manual tokens. They work perfectly and are simpler.

**For Production**: Implement OAuth when:
- You have 50+ users
- Users request it
- You have time for platform-specific implementations

---

## Environment Variables Needed (When Implementing OAuth)

```env
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret
```
