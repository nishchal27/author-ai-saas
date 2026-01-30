"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Check, X, Image as ImageIcon, Calendar, AlertTriangle, Package, Target, BookOpen, Loader2, Sparkles, Copy, Search, Trash2, RefreshCw, Linkedin, Twitter, Instagram, FileText, Facebook } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { useState, useMemo, useEffect, useRef } from "react"
import { EmptyContent } from "@/components/empty-states/empty-content"
import { useToast } from "@/hooks/use-toast"
import { ContentPreview } from "@/components/content-preview"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ContentSkeleton } from "@/components/loading/content-skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SUPPORTED_PLATFORMS, PLATFORM_LABELS } from "@/lib/constants"
import {
  AUDIENCE_SEGMENTS,
  AUDIENCE_SEGMENT_LABELS,
  CONTENT_INTENTS,
  CONTENT_INTENT_LABELS,
  PERSONAS,
  PERSONA_LABELS,
  CONTENT_FORMATS,
  CONTENT_FORMAT_LABELS,
  getDefaultAudienceSegment,
} from "@/lib/content-intelligence"

async function fetchDrafts(scope: "active" | "all" = "active") {
  const res = await fetch(`/api/content/drafts?scope=${scope}`)
  if (!res.ok) throw new Error("Failed to fetch drafts")
  return res.json()
}

async function fetchProducts() {
  const res = await fetch("/api/products")
  if (!res.ok) throw new Error("Failed to fetch products")
  return res.json()
}

// Check if platform aligns with strategy
function getPlatformAlignment(platform: string | null, strategy: any) {
  if (!platform || !strategy) return null
  
  try {
    const platforms = JSON.parse(strategy.platforms || "[]")
    const platformRec = platforms.find(
      (p: any) => p.platform.toLowerCase() === platform.toLowerCase()
    )
    
    if (!platformRec) return null
    
    return {
      priority: platformRec.priority,
      reasoning: platformRec.reasoning,
    }
  } catch {
    return null
  }
}

async function updateDraft(id: string, data: { content?: string; status?: string }) {
  const res = await fetch(`/api/content/drafts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to update draft")
  return res.json()
}

async function generateVisual(draftId: string, prompt?: string) {
  const res = await fetch("/api/visuals/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ draftId, prompt }),
  })
  if (!res.ok) throw new Error("Failed to generate visual")
  return res.json()
}

async function fetchImageSuggestions(draftId: string) {
  const res = await fetch(`/api/visuals/suggestions?draftId=${draftId}`)
  if (!res.ok) throw new Error("Failed to fetch suggestions")
  return res.json()
}

async function repurposeContent(payload: {
  sourceDraftId: string
  audienceSegment?: string
  intent?: string
  persona?: string
  type?: string
  platform?: string
}) {
  const res = await fetch("/api/content/repurpose", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error("Failed to repurpose content")
  return res.json()
}

async function deleteDraft(id: string) {
  const res = await fetch(`/api/content/drafts/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to delete draft")
  return res.json()
}

async function regenerateDraft(draftId: string, feedback?: string) {
  const res = await fetch("/api/content/regenerate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ draftId, feedback }),
  })
  if (!res.ok) throw new Error("Failed to regenerate content")
  return res.json()
}

const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  linkedin: Linkedin,
  twitter: Twitter,
  instagram: Instagram,
  blog: FileText,
  facebook: Facebook,
}

export default function ContentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const platformParam = searchParams.get("platform") || null
  const draftIdParam = searchParams.get("draftId") || null

  useEffect(() => {
    if (draftIdParam && !platformParam) {
      router.replace(`/dashboard/content?platform=all&draftId=${draftIdParam}`)
    }
  }, [draftIdParam, platformParam, router])
  const [searchQuery, setSearchQuery] = useState("")
  const [contentFocusAudience, setContentFocusAudience] = useState<string>("all")
  const [contentFocusIntent, setContentFocusIntent] = useState<string>("all")
  const [contentFocusPersona, setContentFocusPersona] = useState<string>("all")
  const [productFilter, setProductFilter] = useState("all")
  const [contentScope, setContentScope] = useState<"active" | "all">("active")
  
  const { data, isLoading } = useQuery({
    queryKey: ["drafts", contentScope],
    queryFn: () => fetchDrafts(contentScope),
  })

  const { data: productsData } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  })

  // Build a map of productId -> strategy for quick lookups
  const productStrategyMap = useMemo(() => {
    const map: Record<string, any> = {}
    productsData?.products?.forEach((p: any) => {
      if (p.strategy) {
        map[p.id] = p.strategy
      }
    })
    return map
  }, [productsData])

  const hasSetDefaultFocus = useRef(false)
  useEffect(() => {
    if (hasSetDefaultFocus.current || !productsData?.products?.length || contentScope !== "active") return
    hasSetDefaultFocus.current = true
    const activeId = productsData.activeProductId
    const product = productsData.products.find((p: any) => p.id === activeId) || productsData.products[0]
    if (product) {
      const defaultAudience = getDefaultAudienceSegment(product.audience ?? "", product.type ?? "")
      setContentFocusAudience(defaultAudience)
    }
  }, [contentScope, productsData?.activeProductId, productsData?.products])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [imageSuggestionsDraftId, setImageSuggestionsDraftId] = useState<string | null>(null)
  const [imageSuggestions, setImageSuggestions] = useState<{ id: string; label: string; prompt: string }[]>([])
  const [imageSuggestionsLoading, setImageSuggestionsLoading] = useState(false)
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null)
  const [customPromptOverride, setCustomPromptOverride] = useState("")
  const [repurposeDraftId, setRepurposeDraftId] = useState<string | null>(null)
  const [repurposeOpen, setRepurposeOpen] = useState(false)
  const [repurposeAudienceSegment, setRepurposeAudienceSegment] = useState<string>("non_technical")
  const [repurposeIntent, setRepurposeIntent] = useState<string>("product_trust")
  const [repurposePersona, setRepurposePersona] = useState<string>("founder_engineer")
  const [repurposeOverrideFormat, setRepurposeOverrideFormat] = useState(false)
  const [repurposeTypeOverride, setRepurposeTypeOverride] = useState<string>("post")
  const [repurposePlatformOverride, setRepurposePlatformOverride] = useState<string>("linkedin")
  const [regenerateDraftId, setRegenerateDraftId] = useState<string | null>(null)
  const [regenerateOpen, setRegenerateOpen] = useState(false)
  const [regenerateFeedback, setRegenerateFeedback] = useState("")

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateDraft(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] })
      setEditingId(null)
      toast({
        title: "Draft updated",
        description: "Your changes have been saved.",
        variant: "success",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update draft",
        variant: "destructive",
      })
    },
  })

  const visualMutation = useMutation({
    mutationFn: ({ draftId, prompt }: { draftId: string; prompt?: string }) =>
      generateVisual(draftId, prompt),
    onSuccess: (_, { draftId }) => {
      queryClient.invalidateQueries({ queryKey: ["drafts", contentScope] })
      setImageSuggestionsDraftId((id) => (id === draftId ? null : id))
      toast({
        title: "Visual generated",
        description: "Your visual has been created.",
        variant: "success",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate visual",
        variant: "destructive",
      })
    },
  })

  const repurposeMutation = useMutation({
    mutationFn: (payload: {
      sourceDraftId: string
      audienceSegment?: string
      intent?: string
      persona?: string
      type?: string
      platform?: string
    }) => repurposeContent(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] })
      setRepurposeOpen(false)
      setRepurposeDraftId(null)
      toast({
        title: "Content repurposed",
        description: "A new draft was created for the target audience.",
        variant: "success",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to repurpose content",
        variant: "destructive",
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDraft(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] })
      toast({
        title: "Draft deleted",
        description: "The content has been removed.",
        variant: "success",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete draft",
        variant: "destructive",
      })
    },
  })

  const regenerateMutation = useMutation({
    mutationFn: ({ draftId, feedback }: { draftId: string; feedback?: string }) =>
      regenerateDraft(draftId, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] })
      setRegenerateOpen(false)
      setRegenerateDraftId(null)
      setRegenerateFeedback("")
      toast({
        title: "Content regenerated",
        description: "Draft updated with your feedback.",
        variant: "success",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to regenerate content",
        variant: "destructive",
      })
    },
  })

  const handleGetImageSuggestions = (draftId: string) => {
    setImageSuggestionsDraftId(draftId)
    setImageSuggestions([])
    setSelectedSuggestionId(null)
    setCustomPromptOverride("")
    setImageSuggestionsLoading(true)
    fetchImageSuggestions(draftId)
      .then((data) => {
        setImageSuggestions(data.suggestions || [])
        if (data.suggestions?.length) {
          setSelectedSuggestionId(data.suggestions[0].id)
        }
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to load image suggestions",
          variant: "destructive",
        })
      })
      .finally(() => setImageSuggestionsLoading(false))
  }

  const selectedPrompt =
    imageSuggestionsDraftId && selectedSuggestionId
      ? customPromptOverride.trim() ||
        imageSuggestions.find((s) => s.id === selectedSuggestionId)?.prompt
      : null

  const allDrafts = data?.drafts || []

  const countsByPlatform = useMemo(() => {
    const counts: Record<string, number> = { all: allDrafts.length }
    SUPPORTED_PLATFORMS.forEach((p) => {
      counts[p] = allDrafts.filter((d: any) => d.platform?.toLowerCase() === p).length
    })
    return counts
  }, [allDrafts])

  const filteredDrafts = useMemo(() => {
    let list = allDrafts.filter((draft: any) => {
      const matchesSearch =
        !searchQuery ||
        draft.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        draft.content.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesFocusAudience =
        contentFocusAudience === "all" ||
        (draft.audienceSegment && draft.audienceSegment === contentFocusAudience)

      const matchesFocusIntent =
        contentFocusIntent === "all" ||
        (draft.intent && draft.intent === contentFocusIntent)

      const matchesFocusPersona =
        contentFocusPersona === "all" ||
        (draft.persona && draft.persona === contentFocusPersona)

      const matchesProduct =
        productFilter === "all" || draft.productId === productFilter

      return matchesSearch && matchesFocusAudience && matchesFocusIntent && matchesFocusPersona && matchesProduct
    })
    if (platformParam && platformParam !== "all") {
      list = list.filter((d: any) => d.platform?.toLowerCase() === platformParam.toLowerCase())
    }
    return list
  }, [allDrafts, searchQuery, contentFocusAudience, contentFocusIntent, contentFocusPersona, productFilter, platformParam])

  // Group drafts by product when showing all products (for section headers)
  const draftsByProduct = useMemo(() => {
    if (contentScope !== "all") return null
    const map: Record<string, any[]> = {}
    filteredDrafts.forEach((draft: any) => {
      const key = draft.productId || "no-product"
      if (!map[key]) map[key] = []
      map[key].push(draft)
    })
    return map
  }, [contentScope, filteredDrafts])

  const activeProduct = productsData?.products?.find(
    (p: any) => p.id === productsData?.activeProductId
  ) || productsData?.products?.[0]
  const activeStrategy = activeProduct?.strategy

  const handleEdit = (draft: any) => {
    setEditingId(draft.id)
    setEditContent(draft.content)
  }

  const handleSave = (id: string) => {
    updateMutation.mutate({
      id,
      data: { content: editContent },
    })
  }

  const handleApprove = (id: string) => {
    updateMutation.mutate({
      id,
      data: { status: "approved" },
    })
    toast({
      title: "Draft approved",
      description: "You can now schedule this content.",
      variant: "success",
    })
  }

  const handleDelete = (id: string) => {
    if (typeof window !== "undefined" && !window.confirm("Delete this draft? This cannot be undone.")) return
    deleteMutation.mutate(id)
  }

  const handleOpenRegenerate = (draft: any) => {
    setRegenerateDraftId(draft.id)
    setRegenerateFeedback("")
    setRegenerateOpen(true)
  }

  const handleRegenerateSubmit = () => {
    if (!regenerateDraftId) return
    regenerateMutation.mutate({
      draftId: regenerateDraftId,
      feedback: regenerateFeedback.trim() || undefined,
    })
  }

  const handleOpenRepurpose = (draft: any) => {
    setRepurposeDraftId(draft.id)
    setRepurposeAudienceSegment(draft.audienceSegment || "non_technical")
    setRepurposeIntent(draft.intent || "product_trust")
    setRepurposePersona(draft.persona || "founder_engineer")
    setRepurposeOverrideFormat(false)
    setRepurposeTypeOverride(draft.type || "post")
    setRepurposePlatformOverride(draft.platform || "linkedin")
    setRepurposeOpen(true)
  }

  const handleRepurposeSubmit = () => {
    if (!repurposeDraftId) return
    repurposeMutation.mutate({
      sourceDraftId: repurposeDraftId,
      audienceSegment: repurposeAudienceSegment,
      intent: repurposeIntent,
      persona: repurposePersona,
      ...(repurposeOverrideFormat && { type: repurposeTypeOverride, platform: repurposePlatformOverride }),
    })
  }

  // Dashboard view: platform cards when no platform selected (unless opening a specific draft from Home)
  if (!platformParam && !draftIdParam) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Content</h1>
          <p className="text-muted-foreground mt-2">
            Choose a platform to view and manage posts, or see all content.
          </p>
        </div>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <ContentSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="transition-colors hover:border-primary/50">
              <CardHeader
                className="cursor-pointer flex flex-row items-center gap-3"
                onClick={() => router.push("/dashboard/content?platform=all")}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base">All content</CardTitle>
                  <CardDescription>{countsByPlatform.all} drafts</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => router.push("/dashboard/content/create")}
                >
                  Create post
                </Button>
              </CardContent>
            </Card>
            {SUPPORTED_PLATFORMS.map((p) => {
              const Icon = PLATFORM_ICONS[p] || FileText
              const count = countsByPlatform[p] ?? 0
              return (
                <Card
                  key={p}
                  className="transition-colors hover:border-primary/50"
                >
                  <CardHeader
                    className="cursor-pointer flex flex-row items-center gap-3"
                    onClick={() => router.push(`/dashboard/content?platform=${p}`)}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{PLATFORM_LABELS[p]}</CardTitle>
                      <CardDescription>{count} {count === 1 ? "post" : "posts"}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push(`/dashboard/content/create?platform=${p}`)}
                    >
                      Create {PLATFORM_LABELS[p]} post
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          Click a platform to view its posts, or use &quot;Create … post&quot; to start a new draft. All creation happens here in Content.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2" onClick={() => router.push("/dashboard/content")}>
            ← Back to Content
          </Button>
          <h1 className="text-3xl font-bold">
            {platformParam === "all" ? "All content" : PLATFORM_LABELS[platformParam as keyof typeof PLATFORM_LABELS] || platformParam}
          </h1>
          <p className="text-muted-foreground mt-2">
            {platformParam === "all"
              ? "Review your drafts before posting."
              : `Posts for ${PLATFORM_LABELS[platformParam as keyof typeof PLATFORM_LABELS] || platformParam}.`}
          </p>
        </div>
        {productsData?.products && productsData.products.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <div className="flex rounded-md border border-input bg-background p-0.5">
              <button
                type="button"
                onClick={() => setContentScope("active")}
                className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  contentScope === "active"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                This product
              </button>
              <button
                type="button"
                onClick={() => setContentScope("all")}
                className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  contentScope === "all"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                All products
              </button>
            </div>
          </div>
        )}
      </div>

      {contentScope === "active" && activeProduct && activeStrategy && (
        <Card className="border-primary/20 bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Content guide for {activeProduct.name}
            </CardTitle>
            <CardDescription className="text-sm">
              {activeStrategy.summary}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-2 pt-0">
            {(() => {
              try {
                const platforms = JSON.parse(activeStrategy.platforms || "[]")
                const primary = platforms.filter((p: any) => p.priority === "primary").map((p: any) => p.platform)
                const secondary = platforms.filter((p: any) => p.priority === "secondary").map((p: any) => p.platform)
                if (primary.length || secondary.length) {
                  return (
                    <p>
                      <span className="font-medium">Best platforms: </span>
                      {[...primary, ...secondary].join(", ") || "—"}
                    </p>
                  )
                }
              } catch { /* ignore */ }
              return null
            })()}
            {(() => {
              try {
                const tone = JSON.parse(activeStrategy.tone || "{}")
                if (tone.style) {
                  return (
                    <p>
                      <span className="font-medium">Tone: </span>
                      {tone.style}
                    </p>
                  )
                }
              } catch { /* ignore */ }
              return null
            })()}
            {(() => {
              try {
                const antiPatterns = JSON.parse(activeStrategy.antiPatterns || "[]")
                const list = Array.isArray(antiPatterns)
                  ? antiPatterns.map((a: any) => a.pattern || a).filter(Boolean)
                  : []
                if (list.length) {
                  return (
                    <p>
                      <span className="font-medium">Avoid: </span>
                      {list.slice(0, 3).join("; ")}
                    </p>
                  )
                }
              } catch { /* ignore */ }
              return null
            })()}
          </CardContent>
        </Card>
      )}

      {/* Content focus: these choices drive what you see and what gets created/repurposed */}
      <Card className="border-primary/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Content focus
          </CardTitle>
          <CardDescription className="text-sm">
            Show content for this audience, intent, and persona. When you create or repurpose content, we use this focus for tone, format, and image suggestions.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap items-end gap-4">
            <div className="grid gap-2">
              <Label className="text-xs">Audience</Label>
              <Select value={contentFocusAudience} onValueChange={setContentFocusAudience}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any audience</SelectItem>
                  {AUDIENCE_SEGMENTS.map((seg) => (
                    <SelectItem key={seg} value={seg}>
                      {AUDIENCE_SEGMENT_LABELS[seg]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">Intent</Label>
              <Select value={contentFocusIntent} onValueChange={setContentFocusIntent}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any intent</SelectItem>
                  {CONTENT_INTENTS.map((intent) => (
                    <SelectItem key={intent} value={intent}>
                      {CONTENT_INTENT_LABELS[intent]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">Persona</Label>
              <Select value={contentFocusPersona} onValueChange={setContentFocusPersona}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any persona</SelectItem>
                  {PERSONAS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PERSONA_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {contentScope === "all" && productsData?.products && productsData.products.length > 1 && (
              <div className="grid gap-2">
                <Label className="text-xs">Product</Label>
                <Select value={productFilter} onValueChange={setProductFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All products</SelectItem>
                    {productsData.products.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="ml-auto flex-1 min-w-[200px] max-w-sm">
              <Label className="text-xs sr-only">Search content</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Button
              variant="default"
              onClick={() => {
                const params = new URLSearchParams()
                if (contentFocusAudience !== "all") params.set("audience", contentFocusAudience)
                if (contentFocusIntent !== "all") params.set("intent", contentFocusIntent)
                if (contentFocusPersona !== "all") params.set("persona", contentFocusPersona)
                router.push(`/dashboard/insights${params.toString() ? `?${params.toString()}` : ""}`)
              }}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Create content
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            New content from Insights or Dashboard will use this focus for tone, format, and image suggestions.
          </p>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <ContentSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {contentScope === "all" && draftsByProduct && Object.keys(draftsByProduct).length > 0 ? (
            Object.entries(draftsByProduct).map(([productId, drafts]) => {
              const productName =
                productId === "no-product"
                  ? "No product"
                  : productsData?.products?.find((p: any) => p.id === productId)?.name || "Unknown product"
              return (
                <section key={productId}>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    {productName}
                  </h2>
                  <div className="grid gap-6">
                    {drafts.map((draft: any) => renderDraftCard(draft))}
                  </div>
                </section>
              )
            })
          ) : (
            <div className="grid gap-6">
              {filteredDrafts.map((draft: any) => renderDraftCard(draft))}
            </div>
          )}
          {filteredDrafts.length === 0 && allDrafts.length === 0 && (
            <EmptyContent />
          )}
          {filteredDrafts.length === 0 && allDrafts.length > 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {platformParam && platformParam !== "all"
                    ? `No ${PLATFORM_LABELS[platformParam as keyof typeof PLATFORM_LABELS] || platformParam} posts yet. Create content from Angles and choose this platform.`
                    : "No content matches this focus"}
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery("")
                    setContentFocusAudience("all")
                    setContentFocusIntent("all")
                    setContentFocusPersona("all")
                    setProductFilter("all")
                  }}
                >
                  Clear focus & search
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Dialog open={repurposeOpen} onOpenChange={setRepurposeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Repurpose content</DialogTitle>
            <DialogDescription>
              Create a variant for a different audience, intent, or persona. The core message is preserved; tone, depth, and format are adapted.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Target audience</Label>
              <Select value={repurposeAudienceSegment} onValueChange={setRepurposeAudienceSegment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCE_SEGMENTS.map((seg) => (
                    <SelectItem key={seg} value={seg}>
                      {AUDIENCE_SEGMENT_LABELS[seg]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Intent</Label>
              <Select value={repurposeIntent} onValueChange={setRepurposeIntent}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_INTENTS.map((intent) => (
                    <SelectItem key={intent} value={intent}>
                      {CONTENT_INTENT_LABELS[intent]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Persona</Label>
              <Select value={repurposePersona} onValueChange={setRepurposePersona}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERSONAS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PERSONA_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="repurpose-override-format"
                checked={repurposeOverrideFormat}
                onChange={(e) => setRepurposeOverrideFormat(e.target.checked)}
                className="rounded border-input"
              />
              <Label htmlFor="repurpose-override-format" className="font-normal cursor-pointer">
                Override format and platform
              </Label>
            </div>
            {repurposeOverrideFormat && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Format</Label>
                  <Select value={repurposeTypeOverride} onValueChange={setRepurposeTypeOverride}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTENT_FORMATS.map((fmt) => (
                        <SelectItem key={fmt} value={fmt}>
                          {CONTENT_FORMAT_LABELS[fmt]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Platform</Label>
                  <Select value={repurposePlatformOverride} onValueChange={setRepurposePlatformOverride}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_PLATFORMS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {PLATFORM_LABELS[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRepurposeOpen(false)} disabled={repurposeMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleRepurposeSubmit} disabled={repurposeMutation.isPending || !repurposeDraftId}>
              {repurposeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Create variant
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={regenerateOpen} onOpenChange={setRegenerateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Regenerate content</DialogTitle>
            <DialogDescription>
              We'll regenerate this draft from the same angle. Add feedback or context below for a better result (e.g. "less corporate", "more concrete", "shorter").
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Feedback or context (optional)</Label>
              <Textarea
                placeholder="e.g. Sound more human, less buzzwords. Focus on one concrete example."
                value={regenerateFeedback}
                onChange={(e) => setRegenerateFeedback(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegenerateOpen(false)} disabled={regenerateMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleRegenerateSubmit} disabled={regenerateMutation.isPending || !regenerateDraftId}>
              {regenerateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Regenerating…
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )

  function draftMatchesFocus(draft: any) {
    const matchAudience = contentFocusAudience === "all" || draft.audienceSegment === contentFocusAudience
    const matchIntent = contentFocusIntent === "all" || draft.intent === contentFocusIntent
    const matchPersona = contentFocusPersona === "all" || draft.persona === contentFocusPersona
    return matchAudience && matchIntent && matchPersona
  }

  function renderDraftCard(draft: any) {
    const strategy = draft.productId ? productStrategyMap[draft.productId] : null
    const alignment = getPlatformAlignment(draft.platform, strategy)
    const isAvoidPlatform = alignment?.priority === "avoid"
    const matchesFocus = draftMatchesFocus(draft)
    const product = productsData?.products?.find((p: any) => p.id === draft.productId)
    const insight = draft.insight
    const fromAngle = insight?.solution || insight?.coreProblem
    const whyMatters = insight?.whyMatters

    return (
            <Card
              key={draft.id}
              className={
                isAvoidPlatform
                  ? "border-amber-200 dark:border-amber-800"
                  : matchesFocus
                    ? "border-primary/30 bg-primary/5"
                    : ""
              }
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle>
                      {draft.title || `${draft.type} for ${draft.platform || "general"}`}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      {format(new Date(draft.createdAt), "MMM d, yyyy")}
                      {product && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {product.name}
                          </span>
                        </>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {draft.platform && (
                      <Badge 
                        variant={isAvoidPlatform ? "destructive" : alignment?.priority === "primary" ? "default" : "outline"}
                      >
                        {draft.platform}
                      </Badge>
                    )}
                    {draft.intent && (
                      <Badge variant="outline">
                        {CONTENT_INTENT_LABELS[draft.intent as keyof typeof CONTENT_INTENT_LABELS] ?? draft.intent}
                      </Badge>
                    )}
                    {draft.audienceSegment && (
                      <Badge variant="outline">
                        {AUDIENCE_SEGMENT_LABELS[draft.audienceSegment as keyof typeof AUDIENCE_SEGMENT_LABELS] ?? draft.audienceSegment}
                      </Badge>
                    )}
                    {draft.persona && (
                      <Badge variant="outline">
                        {PERSONA_LABELS[draft.persona as keyof typeof PERSONA_LABELS] ?? draft.persona}
                      </Badge>
                    )}
                    <Badge variant="outline">{draft.type}</Badge>
                    <Badge variant={draft.status === "approved" ? "default" : "secondary"}>
                      {draft.status}
                    </Badge>
                    {matchesFocus && (
                      <Badge variant="default" className="bg-primary/80">
                        Matches focus
                      </Badge>
                    )}
                  </div>
                </div>
                {(draft.intent || draft.audienceSegment || draft.persona || draft.suggestedFormat || draft.suggestedPlatform || draft.generationReason || draft.audienceContext || draft.whyThisContent || fromAngle || whyMatters) && (
                  <div className="mt-3 p-3 rounded-md bg-muted/50 border text-sm space-y-1">
                    {fromAngle && (
                      <p><span className="font-medium">From angle: </span>{fromAngle}</p>
                    )}
                    {whyMatters && (
                      <p><span className="font-medium">Why it matters: </span>{whyMatters}</p>
                    )}
                    {draft.whyThisContent && (
                      <p><span className="font-medium">Why we suggest this: </span>{draft.whyThisContent}</p>
                    )}
                    {draft.audienceSegment && (
                      <p><span className="font-medium">Audience: </span>{AUDIENCE_SEGMENT_LABELS[draft.audienceSegment as keyof typeof AUDIENCE_SEGMENT_LABELS] ?? draft.audienceSegment}</p>
                    )}
                    {draft.persona && (
                      <p><span className="font-medium">Persona: </span>{PERSONA_LABELS[draft.persona as keyof typeof PERSONA_LABELS] ?? draft.persona}</p>
                    )}
                    {draft.intent && (
                      <p><span className="font-medium">Intent: </span>{CONTENT_INTENT_LABELS[draft.intent as keyof typeof CONTENT_INTENT_LABELS] ?? draft.intent}</p>
                    )}
                    {(draft.suggestedFormat || draft.suggestedPlatform) && (
                      <p><span className="font-medium">Suggested: </span>
                        {[draft.suggestedFormat ? CONTENT_FORMAT_LABELS[draft.suggestedFormat as keyof typeof CONTENT_FORMAT_LABELS] ?? draft.suggestedFormat : null, draft.suggestedPlatform].filter(Boolean).join(" on ")}
                      </p>
                    )}
                    {draft.generationReason && (
                      <p><span className="font-medium">Reason: </span>{draft.generationReason}</p>
                    )}
                    {draft.audienceContext && (
                      <p><span className="font-medium">Context: </span>{draft.audienceContext}</p>
                    )}
                  </div>
                )}
                {/* Strategy Alignment Warning */}
                {isAvoidPlatform && (
                  <div className="mt-3 p-3 rounded-md bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <span className="font-medium text-amber-800 dark:text-amber-200">
                          Platform not recommended for {product?.name}
                        </span>
                        <p className="text-amber-700 dark:text-amber-300 mt-1">
                          {alignment?.reasoning}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {editingId === draft.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={8}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSave(draft.id)}
                        disabled={updateMutation.isPending}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Tabs defaultValue="preview" className="w-full">
                      <TabsList>
                        <TabsTrigger value="preview">Preview</TabsTrigger>
                        <TabsTrigger value="raw">Raw Content</TabsTrigger>
                      </TabsList>
                      <TabsContent value="preview" className="mt-4">
                        <ContentPreview
                          content={draft.content}
                          platform={draft.platform as any}
                          title={draft.title || undefined}
                          imageUrl={draft.visualUrl || undefined}
                        />
                      </TabsContent>
                      <TabsContent value="raw" className="mt-4">
                        <div className="prose prose-sm max-w-none">
                          <p className="whitespace-pre-wrap">{draft.content}</p>
                        </div>
                      </TabsContent>
                    </Tabs>
                    {draft.cta && (
                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm font-medium">CTA: {draft.cta}</p>
                      </div>
                    )}
                    {draft.visualUrl && (
                      <div className="space-y-2">
                        <img
                          src={draft.visualUrl}
                          alt="Generated visual"
                          className="rounded-md border"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGetImageSuggestions(draft.id)}
                          disabled={imageSuggestionsLoading}
                        >
                          <ImageIcon className="mr-2 h-4 w-4" />
                          Replace image
                        </Button>
                      </div>
                    )}
                    {!draft.visualUrl && (
                      <div className="space-y-3">
                        {imageSuggestionsDraftId === draft.id ? (
                          <>
                            {imageSuggestionsLoading ? (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading image suggestions…
                              </div>
                            ) : imageSuggestions.length > 0 ? (
                              <>
                                <p className="text-sm font-medium">Image suggestions</p>
                                <div className="space-y-2">
                                  {imageSuggestions.map((s) => (
                                    <label
                                      key={s.id}
                                      className="flex items-start gap-2 p-2 rounded-md border cursor-pointer hover:bg-muted/50 has-[:checked]:bg-muted"
                                    >
                                      <input
                                        type="radio"
                                        name={`suggestion-${draft.id}`}
                                        checked={selectedSuggestionId === s.id}
                                        onChange={() => {
                                          setSelectedSuggestionId(s.id)
                                          setCustomPromptOverride("")
                                        }}
                                        className="mt-1"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <span className="text-sm font-medium">{s.label}</span>
                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                          {s.prompt}
                                        </p>
                                      </div>
                                    </label>
                                  ))}
                                </div>
                                <div className="grid gap-2">
                                  <Label className="text-xs text-muted-foreground">
                                    Edit prompt (optional)
                                  </Label>
                                  <Textarea
                                    placeholder="Override with your own image description"
                                    value={customPromptOverride}
                                    onChange={(e) => setCustomPromptOverride(e.target.value)}
                                    rows={2}
                                    className="text-sm"
                                  />
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    visualMutation.mutate({
                                      draftId: draft.id,
                                      prompt: selectedPrompt || undefined,
                                    })
                                  }
                                  disabled={visualMutation.isPending || !selectedPrompt}
                                >
                                  {visualMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <ImageIcon className="mr-2 h-4 w-4" />
                                  )}
                                  Generate image
                                </Button>
                              </>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                  No suggestions. Enter your own image description:
                                </p>
                                <Textarea
                                  placeholder="Describe the image you want..."
                                  value={customPromptOverride}
                                  onChange={(e) => setCustomPromptOverride(e.target.value)}
                                  rows={2}
                                  className="text-sm"
                                />
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    visualMutation.mutate({
                                      draftId: draft.id,
                                      prompt: customPromptOverride.trim() || undefined,
                                    })
                                  }
                                  disabled={visualMutation.isPending || !customPromptOverride.trim()}
                                >
                                  {visualMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <ImageIcon className="mr-2 h-4 w-4" />
                                  )}
                                  Generate image
                                </Button>
                              </div>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setImageSuggestionsDraftId(null)
                                setImageSuggestions([])
                              }}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGetImageSuggestions(draft.id)}
                              disabled={imageSuggestionsLoading}
                            >
                              {imageSuggestionsLoading && imageSuggestionsDraftId === draft.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Sparkles className="mr-2 h-4 w-4" />
                              )}
                              Get image suggestions
                            </Button>
                            {draft.visualPrompt && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  visualMutation.mutate({
                                    draftId: draft.id,
                                    prompt: draft.visualPrompt ?? undefined,
                                  })
                                }
                                disabled={visualMutation.isPending}
                                className="ml-2"
                              >
                                <ImageIcon className="mr-2 h-4 w-4" />
                                Generate from AI prompt
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(draft)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenRepurpose(draft)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Repurpose
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenRegenerate(draft)}
                        disabled={regenerateMutation.isPending}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Regenerate
                      </Button>
                      {draft.status === "draft" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(draft.id)}
                            disabled={updateMutation.isPending}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(draft.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </>
                      )}
                      {draft.status === "approved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push("/dashboard/calendar")}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          Schedule
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
    )
  }
}
