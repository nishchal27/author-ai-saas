/**
 * Inngest serve endpoint.
 *
 * Middleware: `/api/inngest(.*)` is a Clerk public route so Inngest Cloud can
 * reach this handler without a user session. Authentication of invocations is
 * Inngest signature verification (INNGEST_SIGNING_KEY), not Clerk.
 *
 * Do not disable signing. When Inngest is enabled, configure
 * INNGEST_SIGNING_KEY (and typically INNGEST_EVENT_KEY for sending events).
 * Core staging of the manual brand → ideas → drafts → planner loop does not
 * require Inngest keys.
 */

import { serve } from "inngest/next"
import { inngest } from "@/lib/inngest"
import {
  checkScheduledContent,
  syncPublishedAnalytics,
  syncAnalyticsAfterPublish,
  retryFailedPublishes,
} from "@/lib/inngest"

/** Vercel serverless: allow Inngest sync/handshake enough wall time. */
export const runtime = "nodejs"
export const maxDuration = 60

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    checkScheduledContent,
    syncPublishedAnalytics,
    syncAnalyticsAfterPublish,
    retryFailedPublishes,
  ],
})
