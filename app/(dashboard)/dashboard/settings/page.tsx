"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Loader2, Github, RefreshCw, HelpCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

async function fetchSettings() {
  const res = await fetch("/api/settings")
  if (!res.ok) throw new Error("Failed to fetch settings")
  return res.json()
}

async function updateSettings(data: any) {
  const res = await fetch("/api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to update settings")
  return res.json()
}

async function connectGitHub(data: { accessToken: string; config?: string }) {
  const res = await fetch("/api/integrations/github", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to connect GitHub")
  return res.json()
}

async function syncGitHub(data: { repoUrl: string }) {
  const res = await fetch("/api/github/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to sync GitHub")
  return res.json()
}

async function connectLinkedIn(data: { accessToken: string; refreshToken?: string }) {
  const res = await fetch("/api/integrations/linkedin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to connect LinkedIn")
  return res.json()
}

async function connectTwitter(data: { accessToken: string; refreshToken?: string }) {
  const res = await fetch("/api/integrations/twitter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to connect Twitter")
  return res.json()
}

export default function SettingsPage() {
  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  })

  const { toast } = useToast()
  const [brandVoice, setBrandVoice] = useState("")
  const [githubToken, setGithubToken] = useState("")
  const [githubRepo, setGithubRepo] = useState("")
  const [linkedinToken, setLinkedinToken] = useState("")
  const [twitterToken, setTwitterToken] = useState("")
  const [selectedRepo, setSelectedRepo] = useState("")

  useEffect(() => {
    if (settingsData?.user?.brandVoice) {
      try {
        const parsed = JSON.parse(settingsData.user.brandVoice)
        setBrandVoice(parsed.tone || "")
      } catch {
        setBrandVoice(settingsData.user.brandVoice)
      }
    }
    // Load GitHub config if exists
    if (settingsData?.user?.integrations) {
      const githubIntegration = settingsData.user.integrations.find((i: any) => i.type === "github")
      if (githubIntegration?.config) {
        try {
          const config = JSON.parse(githubIntegration.config)
          setGithubRepo(config.defaultRepo || "")
        } catch {}
      }
    }
  }, [settingsData])

  const settingsMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Your brand voice has been updated.",
        variant: "success",
      })
    },
    onError: (error: any) => {
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
      toast({
        title: "GitHub connected",
        description: "Your GitHub integration is now active.",
        variant: "success",
      })
      setGithubToken("")
    },
    onError: (error: any) => {
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
      toast({
        title: "LinkedIn connected",
        description: "Your LinkedIn integration is now active.",
        variant: "success",
      })
      setLinkedinToken("")
    },
    onError: (error: any) => {
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
      toast({
        title: "Twitter/X connected",
        description: "Your Twitter/X integration is now active.",
        variant: "success",
      })
      setTwitterToken("")
    },
    onError: (error: any) => {
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
    })
  }

  const handleConnectTwitter = (e: React.FormEvent) => {
    e.preventDefault()
    twitterMutation.mutate({
      accessToken: twitterToken,
    })
  }

  const hasGitHubIntegration = settingsData?.user?.integrations?.some((i: any) => i.type === "github" && i.isActive)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure your brand voice and integrations
        </p>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle>GitHub Integration</CardTitle>
          <CardDescription>
            Connect your GitHub repository to automatically track commits and PRs
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
                        Select "repo" scope for full repository access.
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
              Connect GitHub
            </Button>
          </form>

          {hasGitHubIntegration && githubRepo && (
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

      <Card>
        <CardHeader>
          <CardTitle>LinkedIn Integration</CardTitle>
          <CardDescription>
            Connect LinkedIn to publish content directly. Note: OAuth flow coming soon. For now, use access token.
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
              <p className="text-xs text-muted-foreground">
                Get your access token from LinkedIn Developer Portal. OAuth flow coming soon.
              </p>
            </div>
            <Button type="submit" disabled={linkedinMutation.isPending}>
              {linkedinMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Connect LinkedIn
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Twitter/X Integration</CardTitle>
          <CardDescription>
            Connect Twitter/X to publish content directly. Note: OAuth flow coming soon. For now, use bearer token.
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
              <p className="text-xs text-muted-foreground">
                Get your bearer token from Twitter Developer Portal. OAuth flow coming soon.
              </p>
            </div>
            <Button type="submit" disabled={twitterMutation.isPending}>
              {twitterMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Connect Twitter/X
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
