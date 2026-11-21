/**
 * Inngest serve endpoint.
 *
 * Middleware: `/api/inngest(.*)` is a Clerk public route so Inngest Cloud can
 * reach this handler without a user session. Authentication of invocations is
 * Inngest signature verification (INNGEST_SIGNING_KEY), not Clerk.
 *
 * Do not disable signing. Configure INNGEST_SIGNING_KEY (and typically
 * INNGEST_EVENT_KEY for sending events) in every deployed environment.
 */

import { serve } from "inngest/next"
import { inngest } from "@/lib/inngest"
import {
  checkScheduledContent,
  syncPublishedAnalytics,
  syncAnalyticsAfterPublish,
  retryFailedPublishes,
} from "@/lib/inngest"

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    checkScheduledContent,
    syncPublishedAnalytics,
    syncAnalyticsAfterPublish,
    retryFailedPublishes,
  ],
})
