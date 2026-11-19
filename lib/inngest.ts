/**
 * Inngest Configuration
 * Code-first workflow automation for scheduling, publishing, and analytics
 */

import { Inngest } from "inngest"
import { db } from "@/lib/db"
import { getDecryptedIntegration } from "@/lib/crypto"
import { publishToLinkedIn } from "@/lib/linkedin"
import { publishToTwitter } from "@/lib/twitter"
import { getLinkedInAnalytics } from "@/lib/linkedin"
import { getTwitterAnalytics } from "@/lib/twitter"

// Initialize Inngest client
export const inngest = new Inngest({
  id: "varabhi",
  name: "Varabhi",
})

/**
 * Function: Check for scheduled content and publish directly
 * Runs every 5 minutes
 */
export const checkScheduledContent = inngest.createFunction(
  {
    id: "check-scheduled-content",
    name: "Check Scheduled Content",
    retries: 3, // Inngest built-in retry
  },
  {
    cron: "*/5 * * * *", // Every 5 minutes
  },
  async ({ step }) => {
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

    // Find schedules ready to publish
    const schedules = await step.run("find-schedules", async () => {
      return await db.schedule.findMany({
        where: {
          status: "pending",
          scheduledAt: {
            lte: now,
            gte: fiveMinutesAgo,
          },
        },
        include: {
          contentDraft: true,
          user: {
            include: {
              integrations: true,
            },
          },
        },
      })
    })

    // Publish each schedule directly
    const results = await step.run("publish-content", async () => {
      const publishPromises = schedules.map(async (schedule) => {
        try {
          // Get platform integration
          const integration = schedule.user.integrations.find(
            (i) => i.type === schedule.platform && i.isActive
          )

          if (!integration || !integration.accessToken) {
            await db.schedule.update({
              where: { id: schedule.id },
              data: {
                status: "failed",
                errorMessage: `No active ${schedule.platform} integration found`,
              },
            })
            return { scheduleId: schedule.id, status: "failed", reason: "No integration" }
          }
          const decrypted = getDecryptedIntegration(integration)
          if (!decrypted.accessToken) {
            await db.schedule.update({
              where: { id: schedule.id },
              data: {
                status: "failed",
                errorMessage: `No active ${schedule.platform} integration found`,
              },
            })
            return { scheduleId: schedule.id, status: "failed", reason: "No integration" }
          }

          // Publish based on platform
          let externalId: string
          if (schedule.platform === "linkedin") {
            // Extract organization ID from integration config
            const config = integration.config
              ? JSON.parse(integration.config)
              : null
            const organizationId = config?.organizationId

            const result = await publishToLinkedIn(
              decrypted.accessToken,
              schedule.contentDraft.content,
              schedule.contentDraft.visualUrl || undefined,
              organizationId
            )
            externalId = result.id
          } else if (schedule.platform === "twitter") {
            const result = await publishToTwitter(
              decrypted.accessToken,
              schedule.contentDraft.content,
              schedule.contentDraft.visualUrl || undefined
            )
            externalId = result.id
          } else {
            await db.schedule.update({
              where: { id: schedule.id },
              data: {
                status: "failed",
                errorMessage: `Platform ${schedule.platform} not supported`,
              },
            })
            return { scheduleId: schedule.id, status: "failed", reason: "Platform not supported" }
          }

          // Update schedule as published
          await db.schedule.update({
            where: { id: schedule.id },
            data: {
              status: "published",
              publishedAt: new Date(),
              externalId,
            },
          })

          // Update draft status
          await db.contentDraft.update({
            where: { id: schedule.contentDraftId },
            data: { status: "published", publishedAt: new Date() },
          })

          // Schedule analytics sync (5 minutes later)
          // Inngest will trigger the event after the delay
          await inngest.send({
            name: "content/published",
            data: {
              scheduleId: schedule.id,
              externalId,
              platform: schedule.platform,
            },
            ts: Date.now() + 5 * 60 * 1000, // 5 minutes from now (Unix ms)
          })

          return { scheduleId: schedule.id, status: "published", externalId }
        } catch (error: any) {
          await db.schedule.update({
            where: { id: schedule.id },
            data: {
              status: "failed",
              errorMessage: error.message,
            },
          })
          return { scheduleId: schedule.id, status: "failed", error: error.message }
        }
      })

      return Promise.all(publishPromises)
    })

    const successful = results.filter((r) => r.status === "published").length
    const failed = results.filter((r) => r.status === "failed").length

    return { total: schedules.length, successful, failed }
  }
)

/**
 * Function: Sync analytics for published content
 * Runs every hour
 */
export const syncPublishedAnalytics = inngest.createFunction(
  {
    id: "sync-published-analytics",
    name: "Sync Published Content Analytics",
  },
  {
    cron: "0 * * * *", // Every hour
  },
  async ({ step }) => {
    // Find published schedules from last 24 hours that need analytics sync
    const schedules = await step.run("find-published-schedules", async () => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return await db.schedule.findMany({
        where: {
          status: "published",
          publishedAt: {
            gte: oneDayAgo,
          },
          externalId: { not: null },
        },
        include: {
          user: {
            include: {
              integrations: true,
            },
          },
          analytics: true,
        },
      })
    })

    // Sync analytics for each schedule
    const results = await step.run("sync-analytics", async () => {
      const syncPromises = schedules.map(async (schedule) => {
        const integration = schedule.user.integrations.find(
          (i) => i.type === schedule.platform && i.isActive
        )

        if (!integration || !integration.accessToken || !schedule.externalId) {
          return { scheduleId: schedule.id, status: "skipped", reason: "No integration" }
        }
        const decrypted = getDecryptedIntegration(integration)
        if (!decrypted.accessToken) {
          return { scheduleId: schedule.id, status: "skipped", reason: "No integration" }
        }

        try {
          let analytics: {
            views: number
            likes: number
            comments: number
            shares: number
          }

          if (schedule.platform === "linkedin") {
            analytics = await getLinkedInAnalytics(
              decrypted.accessToken,
              schedule.externalId
            )
          } else if (schedule.platform === "twitter") {
            analytics = await getTwitterAnalytics(
              decrypted.accessToken,
              schedule.externalId
            )
          } else {
            return { scheduleId: schedule.id, status: "skipped", reason: "Platform not supported" }
          }

          // Calculate engagement rate
          const engagement = analytics.likes + analytics.comments + analytics.shares
          const engagementRate = analytics.views > 0 ? (engagement / analytics.views) * 100 : 0

          // Update or create analytics (schedule has many; update most recent if any)
          const latestAnalytics = schedule.analytics.length > 0
            ? schedule.analytics.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0]
            : null
          if (latestAnalytics) {
            await db.analytics.update({
              where: { id: latestAnalytics.id },
              data: {
                views: analytics.views,
                likes: analytics.likes,
                comments: analytics.comments,
                shares: analytics.shares,
                impressions: analytics.views,
                engagement: engagementRate,
                updatedAt: new Date(),
              },
            })
          } else {
            await db.analytics.create({
              data: {
                scheduleId: schedule.id,
                platform: schedule.platform,
                views: analytics.views,
                likes: analytics.likes,
                comments: analytics.comments,
                shares: analytics.shares,
                clicks: 0,
                impressions: analytics.views,
                engagement: engagementRate,
              },
            })
          }

          return { scheduleId: schedule.id, status: "success", analytics }
        } catch (error: any) {
          console.error(`Failed to sync analytics for schedule ${schedule.id}:`, error)
          return { scheduleId: schedule.id, status: "error", error: error.message }
        }
      })

      return Promise.all(syncPromises)
    })

    const successful = results.filter((r) => r.status === "success").length
    const failed = results.filter((r) => r.status === "error").length
    const skipped = results.filter((r) => r.status === "skipped").length

    return {
      total: schedules.length,
      successful,
      failed,
      skipped,
    }
  }
)

/**
 * Function: Handle published content - sync analytics after delay
 * Triggered by "content/published" event (sent 5 minutes after publishing)
 */
export const syncAnalyticsAfterPublish = inngest.createFunction(
  {
    id: "sync-analytics-after-publish",
    name: "Sync Analytics After Publish",
    retries: 2,
  },
  {
    event: "content/published",
  },
  async ({ event, step }) => {
    const { scheduleId, externalId, platform } = event.data

    const analytics = await step.run("fetch-analytics", async () => {
      const schedule = await db.schedule.findUnique({
        where: { id: scheduleId },
        include: {
          user: { include: { integrations: true } },
        },
      })
      if (!schedule) {
        throw new Error("Schedule not found")
      }
      const integration = schedule.user.integrations.find(
        (i) => i.type === platform && i.isActive
      )
      if (!integration) {
        throw new Error(`No active ${platform} integration`)
      }
      const decrypted = getDecryptedIntegration(integration)
      if (!decrypted.accessToken) {
        throw new Error(`No access token for ${platform}`)
      }

      let result: {
        views: number
        likes: number
        comments: number
        shares: number
      }

      if (platform === "linkedin") {
        result = await getLinkedInAnalytics(decrypted.accessToken, externalId)
      } else if (platform === "twitter") {
        result = await getTwitterAnalytics(decrypted.accessToken, externalId)
      } else {
        throw new Error(`Platform ${platform} not supported`)
      }

      return result
    })

    await step.run("save-analytics", async () => {
      // Calculate engagement rate
      const engagement = analytics.likes + analytics.comments + analytics.shares
      const engagementRate = analytics.views > 0 ? (engagement / analytics.views) * 100 : 0

      // Update or create analytics
      const existing = await db.analytics.findFirst({
        where: { scheduleId },
      })

      if (existing) {
        await db.analytics.update({
          where: { id: existing.id },
          data: {
            views: analytics.views,
            likes: analytics.likes,
            comments: analytics.comments,
            shares: analytics.shares,
            impressions: analytics.views,
            engagement: engagementRate,
            updatedAt: new Date(),
          },
        })
      } else {
        await db.analytics.create({
          data: {
            scheduleId,
            platform,
            views: analytics.views,
            likes: analytics.likes,
            comments: analytics.comments,
            shares: analytics.shares,
            clicks: 0,
            impressions: analytics.views,
            engagement: engagementRate,
          },
        })
      }
    })

    return { scheduleId, analytics }
  }
)

/**
 * Function: Retry failed publish jobs
 * Runs every 30 minutes
 */
export const retryFailedPublishes = inngest.createFunction(
  {
    id: "retry-failed-publishes",
    name: "Retry Failed Publishes",
    retries: 1,
  },
  {
    cron: "*/30 * * * *", // Every 30 minutes
  },
  async ({ step }) => {
    // Find failed schedules from last 24 hours
    const failedSchedules = await step.run("find-failed-schedules", async () => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return await db.schedule.findMany({
        where: {
          status: "failed",
          updatedAt: {
            gte: oneDayAgo,
          },
        },
        include: {
          contentDraft: true,
          user: {
            include: {
              integrations: true,
            },
          },
        },
      })
    })

    // Retry only transient errors
    const retryResults = await step.run("retry-failed", async () => {
      const retryPromises = failedSchedules
        .filter((s) => {
          // Only retry transient errors (not auth errors, etc.)
          const error = s.errorMessage?.toLowerCase() || ""
          return (
            error.includes("timeout") ||
            error.includes("network") ||
            error.includes("rate limit") ||
            error.includes("temporary")
          )
        })
        .map(async (schedule) => {
          try {
            const integration = schedule.user.integrations.find(
              (i) => i.type === schedule.platform && i.isActive
            )

            if (!integration || !integration.accessToken) {
              return { scheduleId: schedule.id, status: "skipped", reason: "No integration" }
            }
            const decrypted = getDecryptedIntegration(integration)
            if (!decrypted.accessToken) {
              return { scheduleId: schedule.id, status: "skipped", reason: "No integration" }
            }

            // Publish
            let externalId: string
            if (schedule.platform === "linkedin") {
              // Extract organization ID from integration config
              const config = integration.config
                ? JSON.parse(integration.config)
                : null
              const organizationId = config?.organizationId

              const result = await publishToLinkedIn(
                decrypted.accessToken,
                schedule.contentDraft.content,
                schedule.contentDraft.visualUrl || undefined,
                organizationId
              )
              externalId = result.id
            } else if (schedule.platform === "twitter") {
              const result = await publishToTwitter(
                decrypted.accessToken,
                schedule.contentDraft.content,
                schedule.contentDraft.visualUrl || undefined
              )
              externalId = result.id
            } else {
              return { scheduleId: schedule.id, status: "skipped", reason: "Platform not supported" }
            }

            // Update schedule
            await db.schedule.update({
              where: { id: schedule.id },
              data: {
                status: "published",
                publishedAt: new Date(),
                externalId,
                errorMessage: null,
              },
            })

            await db.contentDraft.update({
              where: { id: schedule.contentDraftId },
              data: { status: "published", publishedAt: new Date() },
            })

            // Schedule analytics sync
            await inngest.send({
              name: "content/published",
              data: {
                scheduleId: schedule.id,
                externalId,
                platform: schedule.platform,
              },
              ts: Date.now() + 5 * 60 * 1000, // 5 minutes from now (Unix ms)
            })

            return { scheduleId: schedule.id, status: "retried", externalId }
          } catch (error: any) {
            return { scheduleId: schedule.id, status: "failed", error: error.message }
          }
        })

      return Promise.all(retryPromises)
    })

    const retried = retryResults.filter((r) => r.status === "retried").length
    const failed = retryResults.filter((r) => r.status === "failed").length

    return { total: failedSchedules.length, retried, failed }
  }
)
