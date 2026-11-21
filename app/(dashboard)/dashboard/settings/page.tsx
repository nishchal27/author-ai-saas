"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Github, RefreshCw, HelpCircle, Crown, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { queryKeys } from "@/lib/query-keys"

async function readApiError(res: Response, fallback: string) {
  const data = await res.json().catch(() => ({}))
  const details = typeof data.details === "string" ? data.details : ""
  const error = typeof data.error === "string" ? data.error : fallback
  return details ? `${error}: ${details}` : error
}

async function fetchSettings() {
  const res = await fetch("/api/settings")
  if (!res.ok) throw new Error(await readApiError(res, "Failed to fetch settings"))
  return res.json()
}

async function updateSettings(data: { brandVoice?: string; founderBio?: string }) {
  const res = await fetch("/api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(await readApiError(res, "Failed to update settings"))
  return res.json()
}

async function connectGitHub(data: { accessToken: string; config?: string }) {
  const res = await fetch("/api/integrations/github", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(await readApiError(res, "Failed to connect GitHub"))
  return res.json()
}

async function syncGitHub(data: { repoUrl: string }) {
  const res = await fetch("/api/github/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(await readApiError(res, "Failed to sync GitHub"))
  return res.json()
}

async function connectLinkedIn(data: {
  accessToken: string
  refreshToken?: string
  organizationId?: string
}) {
  const res = await fetch("/api/integrations/linkedin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(await readApiError(res, "Failed to connect LinkedIn"))
  return res.json()
}

async function connectTwitter(data: { accessToken: string; refreshToken?: string }) {
  const res = await fetch("/api/integrations/twitter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(await readApiError(res, "Failed to connect Twitter"))
  return res.json()
}

type PublicIntegration = {
  id: string
  type: string
  provider: string
  isActive: boolean
  config: string | null
  status: "connected" | "disconnected"
}

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const { data: settingsData, isError: settingsError, refetch: refetchSettings } = useQuery({
    queryKey: queryKeys.settings,
    queryFn: fetchSettings,
  })

  const { toast } = useToast()
  const [brandVoice, setBrandVoice] = useState("")
  const [githubToken, setGithubToken] = useState("")
  const [githubRepo, setGithubRepo] = useState("")
  const [linkedinToken, setLinkedinToken] = useState("")
  const [linkedinOrgId, setLinkedinOrgId] = useState("")
  const [twitterToken, setTwitterToken] = useState("")
  const [selectedRepo, setSelectedRepo] = useState("")
  const [userTier, setUserTier] = useState<"standard" | "premium">("standard")

  useEffect(() => {
    if (settingsData?.user?.brandVoice) {
      try {
        const parsed = JSON.parse(settingsData.user.brandVoice)
        setBrandVoice(parsed.tone || "")
      } catch {
        setBrandVoice(settingsData.user.brandVoice)
      }
    }
    // Load user tier
    if (settingsData?.user?.tier) {
      setUserTier(settingsData.user.tier as "standard" | "premium")
    }
    const integrations = (settingsData?.integrations || []) as PublicIntegration[]
    const githubIntegration = integrations.find((i) => i.type === "github")
    if (githubIntegration?.config) {
      try {
        const config = JSON.parse(githubIntegration.config)
        setGithubRepo(config.defaultRepo || "")
      } catch {
        /* ignore invalid config */
      }
    }
    const linkedinIntegration = integrations.find((i) => i.type === "linkedin")
    if (linkedinIntegration?.config) {
      try {
        const config = JSON.parse(linkedinIntegration.config)
        setLinkedinOrgId(config.organizationId || "")
      } catch {
        /* ignore invalid config */
      }
    }
  }, [settingsData])

  const settingsMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings })
      toast({
        title: "Settings saved",
        description: "Your brand voice has been updated.",
        variant: "success",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      })
    },
  })

  const githubMutation = useMutation({
    mutationFn: connectGitHub,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings })
      toast({
        title: "GitHub connected",
        description: "Your GitHub integration is now active.",
        variant: "success",
      })
      setGithubToken("")
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to connect GitHub",
        variant: "destructive",
      })
    },
  })

  const syncMutation = useMutation({
    mutationFn: syncGitHub,
    onSuccess: (data) => {
      toast({
        title: "GitHub synced",
        description: `Synced ${data.synced} new activities from GitHub.`,
        variant: "success",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to sync GitHub",
        variant: "destructive",
      })
    },
  })

  const linkedinMutation = useMutation({
    mutationFn: connectLinkedIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings })
      toast({
        title: "LinkedIn connected",
        description: "Access token saved for publishing experiments.",
        variant: "success",
      })
      setLinkedinToken("")
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to connect LinkedIn",
        variant: "destructive",
      })
    },
  })

  const twitterMutation = useMutation({
    mutationFn: connectTwitter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings })
      toast({
        title: "Twitter/X connected",
        description: "Access token saved for publishing experiments.",
        variant: "success",
      })
      setTwitterToken("")
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to connect Twitter",
        variant: "destructive",
      })
    },
  })

  const handleSaveBrand = (e: React.FormEvent) => {
    e.preventDefault()
    settingsMutation.mutate({
      brandVoice: JSON.stringify({ tone: brandVoice }),
    })
  }

  const handleConnectGitHub = (e: React.FormEvent) => {
    e.preventDefault()
    githubMutation.mutate({
      accessToken: githubToken,
      config: JSON.stringify({ defaultRepo: githubRepo }),
    })
  }

  const handleSyncGitHub = () => {
    if (!githubRepo) {
      toast({
        title: "Error",
        description: "Please set a default repository first",
        variant: "destructive",
      })
      return
    }
    syncMutation.mutate({ repoUrl: githubRepo })
  }

  const handleConnectLinkedIn = (e: React.FormEvent) => {
    e.preventDefault()
    linkedinMutation.mutate({
      accessToken: linkedinToken,
      organizationId: linkedinOrgId || undefined,
    })
  }

  const handleConnectTwitter = (e: React.FormEvent) => {
    e.preventDefault()
    twitterMutation.mutate({
      accessToken: twitterToken,
    })
  }

  const integrations = (settingsData?.integrations || []) as PublicIntegration[]
  const githubIntegration = integrations.find((i) => i.type === "github" && i.isActive)
  const linkedinIntegration = integrations.find((i) => i.type === "linkedin" && i.isActive)
  const twitterIntegration = integrations.find((i) => i.type === "twitter" && i.isActive)

  const { data: usageData, isError: usageError } = useQuery({
    queryKey: queryKeys.usage,
    queryFn: async () => {
      const res = await fetch("/api/usage")
      if (!res.ok) throw new Error(await readApiError(res, "Failed to fetch usage"))
      return res.json()
    },
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure your brand voice and integrations
        </p>
      </div>

      {settingsError && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base">Couldn’t load settings</CardTitle>
            <CardDescription>
              Refresh or try again. Integration status may be incomplete until this loads.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => refetchSettings()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {usageError && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base">Couldn’t load AI usage</CardTitle>
            <CardDescription>Try again shortly.</CardDescription>
          </CardHeader>
        </Card>
      )}

      {usageData?.daily && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI usage today</CardTitle>
            <CardDescription>
              Soft daily limit for logical AI requests (one user task). Provider
              retries count as attempts, not extra requests. Estimated cost is a
              rough guide — not an invoice or charge.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-semibold">{usageData.daily.requests}</span>
              <span className="text-muted-foreground">
                {" "}
                of {usageData.daily.limit} logical requests used
                {typeof usageData.daily.remaining === "number"
                  ? ` · ${usageData.daily.remaining} remaining today`
                  : ""}
              </span>
            </p>
            {typeof usageData.daily.providerAttempts === "number" && (
              <p className="text-muted-foreground">
                Provider attempts: {usageData.daily.providerAttempts}
                {typeof usageData.daily.successAttempts === "number"
                  ? ` · ${usageData.daily.successAttempts} succeeded`
                  : ""}
                {typeof usageData.daily.failedAttempts === "number"
                  ? ` · ${usageData.daily.failedAttempts} failed`
                  : ""}
              </p>
            )}
            <p className="text-muted-foreground">
              Tokens observed: {usageData.daily.inputTokens ?? 0} in /{" "}
              {usageData.daily.outputTokens ?? 0} out
            </p>
            <p className="text-muted-foreground">
              Estimated cost (not billed): $
              {Number(usageData.daily.estimatedCostUsd ?? 0).toFixed(4)}
            </p>
            {usageData.monthly && (
              <p className="border-t pt-2 text-muted-foreground">
                This month: {usageData.monthly.requests} requests ·{" "}
                {usageData.monthly.successAttempts} successful attempts
                {typeof usageData.monthly.estimatedCostUsd === "number"
                  ? ` · est. $${Number(usageData.monthly.estimatedCostUsd).toFixed(4)}`
                  : ""}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Subscription Tier
          </CardTitle>
          <CardDescription>
            Your plan is managed by the account administrator. Contact support to change tiers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`p-4 border-2 rounded-lg ${
                userTier === "standard"
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Standard</h3>
                {userTier === "standard" && (
                  <div className="h-2 w-2 rounded-full bg-primary" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Uses Claude Sonnet for most generation
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• High-quality content generation</li>
                <li>• Cost-effective for most use cases</li>
              </ul>
            </div>
            <div
              className={`p-4 border-2 rounded-lg ${
                userTier === "premium"
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Crown className="h-4 w-4 text-primary" />
                  Premium
                </h3>
                {userTier === "premium" && (
                  <div className="h-2 w-2 rounded-full bg-primary" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Uses higher-capacity models for generation
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Maximum quality content</li>
                <li>• Assigned by administrator</li>
              </ul>
            </div>
          </div>
          {userTier === "premium" && (
            <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-md">
              <p className="text-sm text-primary flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                You&apos;re on Premium tier.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Brand Voice</CardTitle>
          <CardDescription>
            Describe how you want your content to sound. Be specific about tone, style, and personality.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveBrand} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brandVoice">Brand Voice & Tone</Label>
              <Textarea
                id="brandVoice"
                placeholder="e.g., Professional but approachable, honest, no hype, technical but accessible..."
                value={brandVoice}
                onChange={(e) => setBrandVoice(e.target.value)}
                rows={4}
              />
            </div>
            <Button type="submit" disabled={settingsMutation.isPending}>
              {settingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Brand Voice
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-primary/15 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <Github className="h-5 w-5 text-primary" />
            GitHub Integration
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                githubIntegration
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {githubIntegration ? "Connected" : "Not connected"}
            </span>
          </CardTitle>
          <CardDescription>
            Optional: sync commits and PRs into Activities. Tokens are stored
            server-side and never returned to this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleConnectGitHub} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="githubToken">GitHub Personal Access Token</Label>
              <Input
                id="githubToken"
                type="password"
                placeholder="ghp_..."
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                required
              />
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  Create a token with repo access at github.com/settings/tokens
                </p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Go to GitHub Settings → Developer settings → Personal access tokens → Generate new token (classic). 
                        Select &quot;repo&quot; scope for full repository access.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="githubRepo">Default Repository (owner/repo)</Label>
              <Input
                id="githubRepo"
                placeholder="username/repository"
                value={githubRepo}
                onChange={(e) => setGithubRepo(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={githubMutation.isPending}>
              {githubMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Github className="mr-2 h-4 w-4" />
              {githubIntegration ? "Update GitHub connection" : "Connect GitHub"}
            </Button>
          </form>

          {githubIntegration && githubRepo && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Sync GitHub Activity</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Sync will fetch recent commits and pull requests from your repository and create activities automatically.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Repository: {githubRepo}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleSyncGitHub}
                  disabled={syncMutation.isPending}
                >
                  {syncMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Sync Now
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-platform-linkedin/20 bg-platform-linkedin-muted/30">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 text-platform-linkedin">
            LinkedIn Integration
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                linkedinIntegration
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {linkedinIntegration ? "Token saved" : "Not connected"}
            </span>
          </CardTitle>
          <CardDescription>
            Optional token storage for experimental publish. Full OAuth login is
            not available yet — do not treat this as a finished social connection.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleConnectLinkedIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="linkedinToken">LinkedIn Access Token</Label>
              <Input
                id="linkedinToken"
                type="password"
                placeholder="Enter access token"
                value={linkedinToken}
                onChange={(e) => setLinkedinToken(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedinOrgId">
                LinkedIn Organization ID (optional)
              </Label>
              <Input
                id="linkedinOrgId"
                type="text"
                placeholder="e.g., 12345678"
                value={linkedinOrgId}
                onChange={(e) => setLinkedinOrgId(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={linkedinMutation.isPending}>
              {linkedinMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {linkedinIntegration ? "Update LinkedIn token" : "Save LinkedIn token"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-platform-twitter/20 bg-platform-twitter-muted/30">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 text-platform-twitter">
            Twitter/X Integration
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                twitterIntegration
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {twitterIntegration ? "Token saved" : "Not connected"}
            </span>
          </CardTitle>
          <CardDescription>
            Optional token storage for experimental publish. Full OAuth login is
            not available yet — connection status only means a token was saved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleConnectTwitter} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="twitterToken">Twitter/X Bearer Token</Label>
              <Input
                id="twitterToken"
                type="password"
                placeholder="Enter bearer token"
                value={twitterToken}
                onChange={(e) => setTwitterToken(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={twitterMutation.isPending}>
              {twitterMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {twitterIntegration ? "Update Twitter token" : "Save Twitter token"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
