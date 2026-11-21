"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Loader2, Sparkles } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { SUPPORTED_PLATFORMS, PLATFORM_LABELS, type SupportedPlatform } from "@/lib/constants"
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
import { queryKeys } from "@/lib/query-keys"
import { Badge } from "@/components/ui/badge"

async function fetchProducts() {
  const res = await fetch("/api/products")
  if (!res.ok) throw new Error("Failed to fetch products")
  return res.json()
}

async function fetchIdea(productId: string, ideaId: string) {
  const res = await fetch(`/api/products/${productId}/ideas`)
  if (!res.ok) throw new Error("Failed to load ideas")
  const data = await res.json()
  const idea = (data.ideas || []).find((i: { id: string }) => i.id === ideaId)
  if (!idea) throw new Error("Idea not found for this brand")
  return idea
}

async function generateFromIdea(payload: {
  ideaId: string
  productId?: string
  platform: string
  type: string
  intent?: string
  audienceSegment?: string
  persona?: string
  reason?: string
  context?: string
}) {
  const res = await fetch("/api/content/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const errBody = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(errBody.error || errBody.details || "AI generation unavailable")
  }
  return errBody
}

async function generateFromInsight(payload: {
  insightId: string
  platform: string
  type: string
  intent: string
  audienceSegment?: string
  persona?: string
  reason?: string
  context?: string
}) {
  const res = await fetch("/api/content/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const errBody = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(errBody.error || errBody.details || "AI generation unavailable")
  }
  return errBody
}

async function fetchInsights() {
  const res = await fetch("/api/insights?scope=active")
  if (!res.ok) throw new Error("Failed to fetch insights")
  return res.json()
}

export default function ContentCreatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const ideaIdParam = searchParams.get("ideaId") || ""
  const insightIdParam = searchParams.get("insightId") || ""
  const platformParam = searchParams.get("platform") || ""
  const typeParam = searchParams.get("type") || ""

  const [platform, setPlatform] = useState(
    platformParam && SUPPORTED_PLATFORMS.includes(platformParam as SupportedPlatform)
      ? platformParam
      : "linkedin"
  )
  const [postType, setPostType] = useState(typeParam || "post")
  const [valueIntent, setValueIntent] = useState("product_trust")
  const [valueReason, setValueReason] = useState("")
  const [audienceSegment, setAudienceSegment] = useState("")
  const [persona, setPersona] = useState("founder_engineer")
  const [context, setContext] = useState("")
  const [insightId, setInsightId] = useState(insightIdParam)
  const [legacyStep, setLegacyStep] = useState(insightIdParam ? 2 : 1)

  const { data: productsData } = useQuery({
    queryKey: queryKeys.products,
    queryFn: fetchProducts,
  })
  const products = productsData?.products ?? []
  const activeProduct =
    products.find((p: { id: string }) => p.id === productsData?.activeProductId) ||
    products[0]
  const productId = activeProduct?.id as string | undefined

  const { data: idea, isLoading: ideaLoading, isError: ideaError } = useQuery({
    queryKey: ["idea-detail", productId, ideaIdParam],
    queryFn: () => fetchIdea(productId!, ideaIdParam),
    enabled: Boolean(productId && ideaIdParam),
  })

  const { data: insightsData } = useQuery({
    queryKey: ["insights"],
    queryFn: fetchInsights,
    enabled: !ideaIdParam,
  })
  const insights = insightsData?.insights ?? []

  useEffect(() => {
    if (!activeProduct || audienceSegment) return
    setAudienceSegment(
      getDefaultAudienceSegment(activeProduct.audience ?? "", activeProduct.type ?? "")
    )
  }, [activeProduct, audienceSegment])

  useEffect(() => {
    if (idea?.platform) setPlatform(idea.platform)
    if (idea?.format) setPostType(idea.format)
    if (idea?.concept) setContext(idea.concept)
    if (idea?.objective) setValueReason(idea.objective)
  }, [idea])

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (ideaIdParam) {
        return generateFromIdea({
          ideaId: ideaIdParam,
          productId,
          platform,
          type: postType,
          intent: valueIntent,
          audienceSegment: audienceSegment || undefined,
          persona,
          reason: valueReason.trim() || undefined,
          context: context.trim() || undefined,
        })
      }
      if (!insightId) throw new Error("Select an idea or angle first")
      return generateFromInsight({
        insightId,
        platform,
        type: postType,
        intent: valueIntent,
        audienceSegment: audienceSegment || undefined,
        persona,
        reason: valueReason.trim() || undefined,
        context: context.trim() || undefined,
      })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drafts() })
      if (productId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.ideas(productId) })
      }
      toast({
        title: "Draft created",
        description: "Review and edit in Content Studio.",
        variant: "success",
      })
      router.push(`/dashboard/content?platform=all&draftId=${data.draft.id}`)
    },
    onError: (e: Error) => {
      toast({
        title: "Couldn’t generate draft",
        description: e.message,
        variant: "destructive",
      })
    },
  })

  // ——— Primary: idea-based create ———
  if (ideaIdParam) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/content?tab=ideas">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to ideas
          </Link>
        </Button>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Create draft from idea
          </h1>
          <p className="mt-1 text-muted-foreground">
            Uses approved brand context. Insights are not required.
          </p>
        </div>

        {ideaLoading ? (
          <p className="text-sm text-muted-foreground">Loading idea…</p>
        ) : ideaError || !idea ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Idea not found for the selected brand. Switch brands or return to ideas.
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{idea.title}</CardTitle>
                <CardDescription>{idea.concept}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Badge variant="outline">{idea.platform}</Badge>
                <Badge variant="outline">{idea.format}</Badge>
                {idea.contentPillar?.name && (
                  <Badge variant="outline">{idea.contentPillar.name}</Badge>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Generation options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Platform</Label>
                    <Select value={platform} onValueChange={setPlatform}>
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
                  <div className="space-y-2">
                    <Label>Format</Label>
                    <Select value={postType} onValueChange={setPostType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTENT_FORMATS.map((f) => (
                          <SelectItem key={f} value={f}>
                            {CONTENT_FORMAT_LABELS[f] || f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Intent</Label>
                    <Select value={valueIntent} onValueChange={setValueIntent}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTENT_INTENTS.map((i) => (
                          <SelectItem key={i} value={i}>
                            {CONTENT_INTENT_LABELS[i] || i}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Audience segment</Label>
                    <Select value={audienceSegment} onValueChange={setAudienceSegment}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AUDIENCE_SEGMENTS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {AUDIENCE_SEGMENT_LABELS[s] || s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Extra brief (optional)</Label>
                  <Textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button
                  size="lg"
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                >
                  {generateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Generate draft
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    )
  }

  // ——— Legacy insight path (kept accessible, not primary) ———
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/content?tab=ideas">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Prefer ideas? Open Ideas
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create from angle</h1>
        <p className="mt-1 text-muted-foreground">
          Legacy insight path. For most work, start from a Content Idea instead.
        </p>
      </div>

      {legacyStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Choose an angle</CardTitle>
            <CardDescription>Or go back and generate ideas for this brand.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.map((i: { id: string; solution?: string; coreProblem?: string }) => (
              <Button
                key={i.id}
                variant="outline"
                className="h-auto w-full justify-start py-3 text-left"
                onClick={() => {
                  setInsightId(i.id)
                  setLegacyStep(2)
                }}
              >
                <span className="line-clamp-2">{i.solution || i.coreProblem}</span>
              </Button>
            ))}
            {insights.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No angles. Use Content Ideas instead.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {legacyStep >= 2 && insightId && (
        <Card>
          <CardHeader>
            <CardTitle>Platform & generate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select value={platform} onValueChange={setPlatform}>
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
              <div className="space-y-2">
                <Label>Format</Label>
                <Select value={postType} onValueChange={setPostType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_FORMATS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {CONTENT_FORMAT_LABELS[f] || f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Persona</Label>
              <Select value={persona} onValueChange={setPersona}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERSONAS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PERSONA_LABELS[p] || p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Generate draft
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
