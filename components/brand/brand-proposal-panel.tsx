"use client"

import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Sparkles, PenLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { queryKeys } from "@/lib/query-keys"
import type { BrandFact, BrandVoice } from "@/lib/brand/types"

type FullProposal = {
  businessDescription?: string
  productsServices?: string[]
  targetAudience?: string
  positioning?: string
  differentiators?: string[]
  brandPersonality?: string
  brandVoice?: BrandVoice
  missingInformation?: string[]
  suggestedImprovements?: string[]
  proposedFacts?: BrandFact[]
}

type BrandPayload = {
  status: string
  proposed: {
    summary: string | null
    facts: BrandFact[]
    fullProposal: FullProposal | null
    voice: BrandVoice | null
  }
  approved: {
    summary: string | null
    facts: BrandFact[]
    approvedAt: string | null
  }
  context: {
    hasApprovedContext: boolean
    missingFields: string[]
  }
  aiConfigured?: boolean
}

function buildFactsPayload(
  factsText: string,
  existing: BrandFact[] | undefined,
  source: "user" | "ai_approved"
) {
  return factsText
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((text, i) => ({
      id: existing?.[i]?.id || `fact_${i + 1}`,
      text,
      source,
    }))
}

export function BrandProposalPanel({
  productId,
  brand,
  profileDescription,
}: {
  productId: string
  brand: BrandPayload
  /** Product.description — used to seed a manual summary */
  profileDescription?: string | null
}) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const proposal = brand.proposed.fullProposal
  const [summary, setSummary] = useState(
    brand.proposed.summary ||
      proposal?.businessDescription ||
      profileDescription ||
      ""
  )
  const [factsText, setFactsText] = useState(
    (brand.proposed.facts?.length
      ? brand.proposed.facts
      : proposal?.proposedFacts || []
    )
      .map((f) => f.text)
      .join("\n")
  )
  const [tone, setTone] = useState(
    brand.proposed.voice?.tone || proposal?.brandVoice?.tone || ""
  )
  const [personality, setPersonality] = useState(
    brand.proposed.voice?.personality || proposal?.brandPersonality || ""
  )

  useEffect(() => {
    setSummary(
      brand.proposed.summary ||
        proposal?.businessDescription ||
        profileDescription ||
        ""
    )
    setFactsText(
      (brand.proposed.facts?.length
        ? brand.proposed.facts
        : proposal?.proposedFacts || []
      )
        .map((f) => f.text)
        .join("\n")
    )
    setTone(brand.proposed.voice?.tone || proposal?.brandVoice?.tone || "")
    setPersonality(
      brand.proposed.voice?.personality || proposal?.brandPersonality || ""
    )
  }, [brand, proposal, profileDescription])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.brand(productId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.guide(productId) })
  }

  const summarize = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/products/${productId}/brand`, {
        method: "POST",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to generate summary")
      return data
    },
    onSuccess: () => {
      invalidate()
      toast({
        title: "Proposal ready",
        description:
          "Review and edit below. Nothing is approved until you confirm.",
        variant: "success",
      })
    },
    onError: (e: Error) => {
      toast({
        title: "AI summary unavailable",
        description: e.message,
        variant: "destructive",
      })
    },
  })

  const saveManual = useMutation({
    mutationFn: async () => {
      const facts = buildFactsPayload(factsText, brand.proposed.facts, "user")
      if (!summary.trim()) throw new Error("Summary is required")
      if (facts.length === 0) throw new Error("Add at least one fact")

      const res = await fetch(`/api/products/${productId}/brand`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "manual",
          summary: summary.trim(),
          facts,
          voice: tone.trim()
            ? {
                tone: tone.trim(),
                personality: personality.trim() || undefined,
              }
            : undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || data.details || "Save failed")
      return data
    },
    onSuccess: () => {
      invalidate()
      toast({
        title: "Proposal saved",
        description:
          "Saved as proposed context. Approve when you are ready — AI was not used.",
        variant: "success",
      })
    },
    onError: (e: Error) => {
      toast({
        title: "Couldn’t save proposal",
        description: e.message,
        variant: "destructive",
      })
    },
  })

  const approve = useMutation({
    mutationFn: async () => {
      const facts = buildFactsPayload(
        factsText,
        brand.proposed.facts,
        brand.proposed.facts?.some((f) => f.source === "ai_proposed")
          ? "ai_approved"
          : "user"
      )
      if (!summary.trim()) throw new Error("Summary is required to approve")
      if (facts.length === 0)
        throw new Error("Add at least one fact before approving")

      const res = await fetch(`/api/products/${productId}/brand`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: summary.trim(),
          facts,
          voice: tone.trim()
            ? {
                tone: tone.trim(),
                personality: personality.trim() || undefined,
              }
            : undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || data.details || "Approval failed")
      return data
    },
    onSuccess: () => {
      invalidate()
      toast({
        title: "Brand approved",
        description: "Trusted context will now ground ideas and drafts.",
        variant: "success",
      })
    },
    onError: (e: Error) => {
      toast({
        title: "Approval failed",
        description: e.message,
        variant: "destructive",
      })
    },
  })

  const busy =
    summarize.isPending || saveManual.isPending || approve.isPending

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          onClick={() => saveManual.mutate()}
          disabled={busy}
        >
          {saveManual.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <PenLine className="mr-2 h-4 w-4" />
          )}
          Save manual proposal
        </Button>
        <Button
          onClick={() => summarize.mutate()}
          disabled={busy}
          variant={brand.aiConfigured === false ? "secondary" : "default"}
        >
          {summarize.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Generate AI summary
        </Button>
        <p className="text-sm text-muted-foreground">
          You can approve a manual summary without AI. Proposals never overwrite
          approved facts until you approve.
        </p>
      </div>

      {proposal && (
        <div className="grid gap-3 rounded-md border bg-muted/30 p-4 text-sm sm:grid-cols-2">
          {proposal.targetAudience && (
            <div>
              <p className="font-medium">Audience</p>
              <p className="text-muted-foreground">{proposal.targetAudience}</p>
            </div>
          )}
          {proposal.positioning && (
            <div>
              <p className="font-medium">Positioning</p>
              <p className="text-muted-foreground">{proposal.positioning}</p>
            </div>
          )}
          {proposal.productsServices && proposal.productsServices.length > 0 && (
            <div className="sm:col-span-2">
              <p className="font-medium">Products / services</p>
              <ul className="mt-1 list-inside list-disc text-muted-foreground">
                {proposal.productsServices.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="summary">Brand summary</Label>
          <Textarea
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={5}
            placeholder="Describe what the brand is, who it serves, and what makes it distinct."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="facts">Facts (one per line)</Label>
          <Textarea
            id="facts"
            value={factsText}
            onChange={(e) => setFactsText(e.target.value)}
            rows={6}
            placeholder="Handmade in Assam&#10;Ships worldwide&#10;Focus on natural dyes"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tone">
              Brand voice tone{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="tone"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="personality">
              Personality{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="personality"
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
            />
          </div>
        </div>
        <Button
          onClick={() => approve.mutate()}
          disabled={busy}
          className="bg-emerald-700 hover:bg-emerald-800"
        >
          {approve.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Approve for generation
        </Button>
      </div>

      {brand.approved.summary && (
        <div className="space-y-3 rounded-md border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-600 hover:bg-emerald-600">Approved</Badge>
            {brand.approved.approvedAt && (
              <span className="text-xs text-muted-foreground">
                {new Date(brand.approved.approvedAt).toLocaleString()}
              </span>
            )}
          </div>
          <p className="whitespace-pre-wrap text-sm">{brand.approved.summary}</p>
          {brand.approved.facts?.length > 0 && (
            <ul className="list-inside list-disc text-sm text-muted-foreground">
              {brand.approved.facts.map((f) => (
                <li key={f.id}>{f.text}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
