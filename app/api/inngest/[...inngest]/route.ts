/**
 * Inngest API Route (Dynamic)
 * Handles all Inngest webhooks and function invocations
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
