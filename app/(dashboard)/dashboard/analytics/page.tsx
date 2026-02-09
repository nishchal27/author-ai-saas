"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, Eye, Heart, MessageCircle, Share2, MousePointerClick, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"

async function fetchAnalytics() {
  const res = await fetch("/api/analytics")
  if (!res.ok) throw new Error("Failed to fetch analytics")
  return res.json()
}

export default function AnalyticsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: fetchAnalytics,
  })

  if (isLoading) {
    return <div className="text-center py-12">Loading analytics...</div>
  }

  const analytics = data?.analytics || {}
  const {
    totalViews = 0,
    totalLikes = 0,
    totalComments = 0,
    totalShares = 0,
    totalClicks = 0,
    totalImpressions = 0,
    averageEngagement = 0,
    topPosts = [],
    platformStats = {},
  } = analytics

  const engagementRate =
    totalImpressions > 0
      ? ((totalLikes + totalComments + totalShares) / totalImpressions) * 100
      : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Track your content performance and engagement
          </p>
        </div>
        <Button
          variant="default"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["analytics"] })
            toast({
              title: "Refreshing analytics",
              description: "Analytics data is being updated...",
            })
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 bg-metric-views-muted/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground/90">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-metric-views" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-metric-views">{totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all platforms
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-metric-engagement-muted/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground/90">Total Engagement</CardTitle>
            <Heart className="h-4 w-4 text-metric-engagement" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-metric-engagement">
              {(totalLikes + totalComments + totalShares).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Likes, comments, shares
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-metric-rate-muted/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground/90">Engagement Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-metric-rate" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-metric-rate">{engagementRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              Based on impressions
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-metric-clicks-muted/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground/90">Total Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-metric-clicks" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-metric-clicks">{totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Link clicks
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Platform Performance</CardTitle>
            <CardDescription>Metrics by platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(platformStats).map(([platform, stats]: [string, any]) => {
                const isLinkedIn = platform.toLowerCase() === "linkedin"
                const isTwitter = platform.toLowerCase() === "twitter"
                const badgeClass = isLinkedIn
                  ? "bg-platform-linkedin-muted text-platform-linkedin border-platform-linkedin/20 capitalize"
                  : isTwitter
                    ? "bg-platform-twitter-muted text-platform-twitter border-platform-twitter/20 capitalize"
                    : "capitalize"
                return (
                  <div key={platform} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={badgeClass}>
                          {platform}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1 text-metric-views">
                            <Eye className="h-3 w-3" />
                            {stats.views || 0}
                          </span>
                          <span className="flex items-center gap-1 text-metric-engagement">
                            <Heart className="h-3 w-3" />
                            {stats.likes || 0}
                          </span>
                          <span className="flex items-center gap-1 text-primary">
                            <MessageCircle className="h-3 w-3" />
                            {stats.comments || 0}
                          </span>
                          <span className="flex items-center gap-1 text-metric-rate">
                            <Share2 className="h-3 w-3" />
                            {stats.shares || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              {Object.keys(platformStats).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No platform data yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Posts</CardTitle>
            <CardDescription>Your best performing content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPosts.slice(0, 5).map((post: any) => {
                const isLinkedIn = post.platform?.toLowerCase() === "linkedin"
                const isTwitter = post.platform?.toLowerCase() === "twitter"
                const platformBadgeClass = isLinkedIn
                  ? "text-xs capitalize bg-platform-linkedin-muted text-platform-linkedin border-platform-linkedin/20"
                  : isTwitter
                    ? "text-xs capitalize bg-platform-twitter-muted text-platform-twitter border-platform-twitter/20"
                    : "text-xs capitalize"
                return (
                  <div key={post.id} className="flex items-start justify-between rounded-lg border border-border/60 bg-muted/30 p-3">
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium line-clamp-2 text-foreground">
                        {post.title || post.content?.substring(0, 50) + "..."}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className={platformBadgeClass}>
                          {post.platform}
                        </Badge>
                        <span>
                          {format(new Date(post.publishedAt), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm font-semibold text-metric-engagement">
                        {post.engagement || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        engagement
                      </div>
                    </div>
                  </div>
                )
              })}
              {topPosts.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No published posts yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Metrics</CardTitle>
          <CardDescription>Breakdown of all engagement metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 rounded-lg bg-metric-views-muted/40 p-4">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-metric-views" />
                <span className="text-sm font-medium text-foreground/90">Impressions</span>
              </div>
              <div className="text-2xl font-bold text-metric-views">
                {totalImpressions.toLocaleString()}
              </div>
            </div>
            <div className="space-y-2 rounded-lg bg-metric-engagement-muted/40 p-4">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-metric-engagement" />
                <span className="text-sm font-medium text-foreground/90">Likes</span>
              </div>
              <div className="text-2xl font-bold text-metric-engagement">
                {totalLikes.toLocaleString()}
              </div>
            </div>
            <div className="space-y-2 rounded-lg bg-primary/5 p-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground/90">Comments</span>
              </div>
              <div className="text-2xl font-bold text-primary">
                {totalComments.toLocaleString()}
              </div>
            </div>
            <div className="space-y-2 rounded-lg bg-metric-rate-muted/40 p-4">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-metric-rate" />
                <span className="text-sm font-medium text-foreground/90">Shares</span>
              </div>
              <div className="text-2xl font-bold text-metric-rate">
                {totalShares.toLocaleString()}
              </div>
            </div>
            <div className="space-y-2 rounded-lg bg-metric-clicks-muted/40 p-4">
              <div className="flex items-center gap-2">
                <MousePointerClick className="h-4 w-4 text-metric-clicks" />
                <span className="text-sm font-medium text-foreground/90">Clicks</span>
              </div>
              <div className="text-2xl font-bold text-metric-clicks">
                {totalClicks.toLocaleString()}
              </div>
            </div>
            <div className="space-y-2 rounded-lg bg-success-muted/40 p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-foreground/90">Avg Engagement</span>
              </div>
              <div className="text-2xl font-bold text-success">
                {averageEngagement.toFixed(2)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
