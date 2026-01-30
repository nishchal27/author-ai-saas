"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
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

async function fetchInsights() {
  const res = await fetch("/api/insights?scope=active")
  if (!res.ok) throw new Error("Failed to fetch insights")
  return res.json()
}

async function createInsight(payload: {
  coreProblem: string
  solution: string
  audience: string
  whyMatters: string
  impact?: string
  productId?: string
}) {
  const res = await fetch("/api/insights", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || "Failed to create angle")
  }
  return res.json()
}

async function generateContent(payload: {
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
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || "Failed to generate content")
  }
  return res.json()
}

async function fetchProducts() {
  const res = await fetch("/api/products")
  if (!res.ok) throw new Error("Failed to fetch products")
  return res.json()
}

export default function ContentCreatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const platformParam = searchParams.get("platform") || ""
  const insightIdParam = searchParams.get("insightId") || ""

  const [step, setStep] = useState(1)
  const [insightId, setInsightId] = useState(insightIdParam)
  const [fromScratch, setFromScratch] = useState(false)
  const [scratchProblem, setScratchProblem] = useState("")
  const [scratchSolution, setScratchSolution] = useState("")
  const [scratchAudience, setScratchAudience] = useState("")
  const [scratchWhyMatters, setScratchWhyMatters] = useState("")

  const [platform, setPlatform] = useState(platformParam && SUPPORTED_PLATFORMS.includes(platformParam as SupportedPlatform) ? platformParam : "linkedin")
  const [postType, setPostType] = useState("post")
  const [valueIntent, setValueIntent] = useState("product_trust")
  const [valueReason, setValueReason] = useState("")

  const [audienceSegment, setAudienceSegment] = useState<string>("")
  const [persona, setPersona] = useState("founder_engineer")
  const [context, setContext] = useState("")

  const { data: insightsData } = useQuery({
    queryKey: ["insights"],
    queryFn: fetchInsights,
  })

  const { data: productsData } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  })

  const insights = insightsData?.insights ?? []
  const products = productsData?.products ?? []
  const activeProduct = products.find((p: any) => p.id === productsData?.activeProductId) || products[0]

  useEffect(() => {
    if (!activeProduct || audienceSegment) return
    const defaultSeg = getDefaultAudienceSegment(activeProduct.audience ?? "", activeProduct.type ?? "")
    setAudienceSegment(defaultSeg)
  }, [activeProduct, audienceSegment])

  useEffect(() => {
    if (insightIdParam) {
      setInsightId(insightIdParam)
      setStep(2)
    }
  }, [insightIdParam])

  const createInsightMutation = useMutation({
    mutationFn: createInsight,
    onSuccess: (data) => {
      setInsightId(data.insight.id)
      setStep(2)
      queryClient.invalidateQueries({ queryKey: ["insights"] })
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    },
  })

  const generateMutation = useMutation({
    mutationFn: generateContent,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] })
      toast({
        title: "Draft created",
        description: "Review your draft in Content.",
        variant: "success",
      })
      router.push(`/dashboard/content?platform=all&draftId=${data.draft.id}`)
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    },
  })

  const handleStep1SelectInsight = (id: string) => {
    setInsightId(id)
    setStep(2)
  }

  const handleStep1FromScratch = () => {
    if (!scratchProblem.trim() || !scratchSolution.trim() || !scratchAudience.trim() || !scratchWhyMatters.trim()) {
      toast({ title: "Fill all fields", description: "Problem, solution, audience, and why it matters are required.", variant: "destructive" })
      return
    }
    createInsightMutation.mutate({
      coreProblem: scratchProblem.trim(),
      solution: scratchSolution.trim(),
      audience: scratchAudience.trim(),
      whyMatters: scratchWhyMatters.trim(),
      productId: activeProduct?.id,
    })
  }

  const handleGenerate = () => {
    if (!insightId) return
    generateMutation.mutate({
      insightId,
      platform,
      type: postType,
      intent: valueIntent,
      audienceSegment: audienceSegment || undefined,
      persona,
      reason: valueReason.trim() || undefined,
      context: context.trim() || undefined,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/content">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Content
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Create post</h1>
        <p className="text-muted-foreground mt-1">
          {step === 1 && "Choose an angle or write from scratch."}
          {step === 2 && "Choose platform, type, and what value you want from this post."}
          {step === 3 && "Optional refinements, then generate."}
        </p>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Angle</CardTitle>
            <CardDescription>Pick an existing angle or write from scratch.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!fromScratch ? (
              <>
                <div className="space-y-2">
                  <Label>Existing angles</Label>
                  <div className="grid gap-2 max-h-60 overflow-y-auto">
                    {insights.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No angles yet. Write from scratch or add one from Activities.</p>
                    ) : (
                      insights.map((i: any) => (
                        <Button
                          key={i.id}
                          variant="outline"
                          className="justify-start text-left h-auto py-3"
                          onClick={() => handleStep1SelectInsight(i.id)}
                        >
                          <span className="line-clamp-2">{i.solution || i.coreProblem}</span>
                        </Button>
                      ))
                    )}
                  </div>
                </div>
                <Button variant="secondary" onClick={() => setFromScratch(true)}>
                  Write from scratch
                </Button>
              </>
            ) : (
              <>
                <div className="grid gap-3">
                  <div>
                    <Label>Problem / situation</Label>
                    <Textarea
                      value={scratchProblem}
                      onChange={(e) => setScratchProblem(e.target.value)}
                      placeholder="What was the situation or problem?"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Solution / angle</Label>
                    <Textarea
                      value={scratchSolution}
                      onChange={(e) => setScratchSolution(e.target.value)}
                      placeholder="What’s the solution or main message?"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Audience</Label>
                    <Textarea
                      value={scratchAudience}
                      onChange={(e) => setScratchAudience(e.target.value)}
                      placeholder="Who is this for?"
                      rows={1}
                    />
                  </div>
                  <div>
                    <Label>Why it matters</Label>
                    <Textarea
                      value={scratchWhyMatters}
                      onChange={(e) => setScratchWhyMatters(e.target.value)}
                      placeholder="Why should they care?"
                      rows={2}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setFromScratch(false)}>
                    Back
                  </Button>
                  <Button
                    onClick={handleStep1FromScratch}
                    disabled={createInsightMutation.isPending}
                  >
                    {createInsightMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Continue
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Platform & value</CardTitle>
            <CardDescription>What type of post and what do you want to achieve?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="w-full max-w-xs">
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
            <div>
              <Label>Type of post</Label>
              <Select value={postType} onValueChange={setPostType}>
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_FORMATS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {CONTENT_FORMAT_LABELS[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>What value do you want from this post?</Label>
              <Select value={valueIntent} onValueChange={setValueIntent}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_INTENTS.map((i) => (
                    <SelectItem key={i} value={i}>
                      {CONTENT_INTENT_LABELS[i]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-muted-foreground">Extra context (optional)</Label>
              <Textarea
                value={valueReason}
                onChange={(e) => setValueReason(e.target.value)}
                placeholder="e.g. I want to show we ship fast, or get feedback on the approach"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)}>Next</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Refinements & generate</CardTitle>
            <CardDescription>Optional audience and persona; then generate.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Audience segment</Label>
              <Select value={audienceSegment} onValueChange={setAudienceSegment}>
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCE_SEGMENTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {AUDIENCE_SEGMENT_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-muted-foreground">Persona</Label>
              <Select value={persona} onValueChange={setPersona}>
                <SelectTrigger className="w-full max-w-xs">
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
            <div>
              <Label className="text-muted-foreground">Context (optional)</Label>
              <Textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Audience or situation context"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Generate draft
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
