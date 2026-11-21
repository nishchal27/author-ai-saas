"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import {
  ArrowRight,
  Loader2,
  Pencil,
  Plus,
  Search,
  Sparkles,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { queryKeys } from "@/lib/query-keys"
import {
  PLATFORM_LABELS,
  SUPPORTED_PLATFORMS,
  type SupportedPlatform,
} from "@/lib/constants"
import {
  CONTENT_FORMATS,
  CONTENT_FORMAT_LABELS,
} from "@/lib/content-intelligence"

export type IdeaRow = {
  id: string
  title: string
  concept: string
  platform: string
  audience: string
  objective: string
  format: string
  explanation?: string | null
  status: string
  source: string
  contentPillarId?: string | null
  contentPillar?: { id: string; name: string } | null
  drafts?: { id: string; status: string }[]
}

type IdeaFormState = {
  title: string
  concept: string
  platform: string
  format: string
  audience: string
  objective: string
  explanation: string
  contentPillarId: string
}

const emptyForm = (): IdeaFormState => ({
  title: "",
  concept: "",
  platform: "linkedin",
  format: "post",
  audience: "",
  objective: "",
  explanation: "",
  contentPillarId: "none",
})

async function fetchIdeas(productId: string) {
  const res = await fetch(`/api/products/${productId}/ideas`)
  if (!res.ok) throw new Error("Failed to load ideas")
  return res.json()
}

async function fetchPillars(productId: string) {
  const res = await fetch(`/api/products/${productId}/pillars`)
  if (!res.ok) throw new Error("Failed to load pillars")
  return res.json()
}

function platformLabel(platform: string) {
  return (
    PLATFORM_LABELS[platform as SupportedPlatform] ||
    platform.charAt(0).toUpperCase() + platform.slice(1)
  )
}

function statusBadge(status: string) {
  switch (status) {
    case "saved":
      return <Badge className="bg-emerald-600 hover:bg-emerald-600">Saved</Badge>
    case "converted":
      return <Badge variant="secondary">Converted</Badge>
    case "rejected":
      return <Badge variant="outline">Rejected</Badge>
    default:
      return <Badge variant="secondary">Proposed</Badge>
  }
}

export function IdeasBoard({ productId }: { productId: string }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>("active")
  const [query, setQuery] = useState("")
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingIdea, setEditingIdea] = useState<IdeaRow | null>(null)
  const [form, setForm] = useState<IdeaFormState>(emptyForm)

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.ideas(productId),
    queryFn: () => fetchIdeas(productId),
  })

  const { data: pillarsData } = useQuery({
    queryKey: queryKeys.pillars(productId),
    queryFn: () => fetchPillars(productId),
  })

  const ideas: IdeaRow[] = data?.ideas || []
  const pillars = (pillarsData?.pillars || []).filter(
    (p: { isActive: boolean; approvalStatus: string }) =>
      p.isActive && p.approvalStatus !== "rejected"
  )

  const filtered = useMemo(() => {
    let list = ideas
    if (statusFilter === "active") {
      list = list.filter((i) =>
        ["proposed", "saved", "converted"].includes(i.status)
      )
    } else if (statusFilter !== "all") {
      list = list.filter((i) => i.status === statusFilter)
    }
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.concept.toLowerCase().includes(q) ||
          i.platform.toLowerCase().includes(q) ||
          i.contentPillar?.name?.toLowerCase().includes(q)
      )
    }
    return list
  }, [ideas, statusFilter, query])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.ideas(productId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.pillars(productId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.drafts() })
    queryClient.invalidateQueries({ queryKey: queryKeys.guide(productId) })
  }

  const openCreate = () => {
    setEditingIdea(null)
    setForm(emptyForm())
    setFormOpen(true)
  }

  const openEdit = (idea: IdeaRow) => {
    setEditingIdea(idea)
    setForm({
      title: idea.title,
      concept: idea.concept,
      platform: idea.platform || "linkedin",
      format: idea.format || "post",
      audience: idea.audience || "",
      objective: idea.objective || "",
      explanation: idea.explanation || "",
      contentPillarId: idea.contentPillarId || idea.contentPillar?.id || "none",
    })
    setFormOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.title.trim() || !form.concept.trim()) {
        throw new Error("Title and description are required")
      }
      if (!form.platform.trim() || !form.format.trim()) {
        throw new Error("Platform and format are required")
      }
      if (!form.audience.trim() || !form.objective.trim()) {
        throw new Error("Audience and objective are required")
      }

      const payload = {
        title: form.title.trim(),
        concept: form.concept.trim(),
        platform: form.platform,
        format: form.format,
        audience: form.audience.trim(),
        objective: form.objective.trim(),
        explanation: form.explanation.trim() || undefined,
        contentPillarId:
          form.contentPillarId === "none" ? null : form.contentPillarId,
      }

      if (editingIdea) {
        const res = await fetch(
          `/api/products/${productId}/ideas/${editingIdea.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        )
        const body = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(body.error || "Failed to update idea")
        return body
      }

      const res = await fetch(`/api/products/${productId}/ideas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || "Failed to create idea")
      return body
    },
    onSuccess: () => {
      invalidate()
      setFormOpen(false)
      setEditingIdea(null)
      setForm(emptyForm())
      toast({
        title: editingIdea ? "Idea updated" : "Idea created",
        description: editingIdea
          ? "Your changes were saved."
          : "Saved for this brand — no AI call required.",
        variant: "success",
      })
    },
    onError: (e: Error) =>
      toast({
        title: editingIdea ? "Couldn’t update idea" : "Couldn’t create idea",
        description: e.message,
        variant: "destructive",
      }),
  })

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/products/${productId}/ideas`, {
        method: "POST",
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || "AI generation unavailable")
      return body
    },
    onSuccess: (body) => {
      invalidate()
      toast({
        title: "Ideas generated",
        description: `${body.ideas?.length ?? 0} ideas ready to review.`,
        variant: "success",
      })
    },
    onError: (e: Error) =>
      toast({
        title: "Couldn’t generate ideas",
        description: e.message,
        variant: "destructive",
      }),
  })

  const statusMutation = useMutation({
    mutationFn: async (payload: { ideaId: string; status: string }) => {
      const res = await fetch(
        `/api/products/${productId}/ideas/${payload.ideaId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: payload.status }),
        }
      )
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || "Failed to update idea")
      return body
    },
    onSuccess: () => {
      invalidate()
      toast({ title: "Idea updated", variant: "success" })
    },
    onError: (e: Error) =>
      toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  })

  const [convertingId, setConvertingId] = useState<string | null>(null)

  const convertManualMutation = useMutation({
    mutationFn: async (idea: IdeaRow) => {
      setConvertingId(idea.id)
      const res = await fetch(
        `/api/products/${productId}/ideas/${idea.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "convert" }),
        }
      )
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body.error || "Failed to convert idea to draft")
      }
      return body as { draft: { id: string }; created: boolean }
    },
    onSuccess: (body) => {
      invalidate()
      setConvertingId(null)
      toast({
        title: body.created ? "Draft created" : "Draft already exists",
        description: body.created
          ? "Opened a manual draft from this idea — no AI used."
          : "Returning the existing draft linked to this idea.",
        variant: "success",
      })
      if (body.draft?.id) {
        window.location.href = `/dashboard/content?platform=all&draftId=${body.draft.id}`
      }
    },
    onError: (e: Error) => {
      setConvertingId(null)
      toast({
        title: "Couldn’t create draft",
        description: e.message,
        variant: "destructive",
      })
    },
  })

  const generateDraftMutation = useMutation({
    mutationFn: async (idea: IdeaRow) => {
      setGeneratingId(idea.id)
      const res = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaId: idea.id,
          productId,
          platform: idea.platform,
          type: idea.format || "post",
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body.error || body.details || "AI generation unavailable")
      }
      return body
    },
    onSuccess: (body) => {
      invalidate()
      setGeneratingId(null)
      toast({
        title: "AI draft created",
        description: "Open Content Studio drafts to edit and refine.",
        variant: "success",
      })
      if (body.draft?.id) {
        window.location.href = `/dashboard/content?platform=all&draftId=${body.draft.id}`
      }
    },
    onError: (e: Error) => {
      setGeneratingId(null)
      toast({
        title: "Couldn’t generate AI draft",
        description: e.message,
        variant: "destructive",
      })
    },
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-lg">Content ideas</CardTitle>
              <CardDescription>
                Create ideas manually or generate with AI. Persist to this brand, then turn them into drafts.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Create idea
              </Button>
              <Button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Generate with AI
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search ideas…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="proposed">Proposed</SelectItem>
                <SelectItem value="saved">Saved</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="grid gap-3 md:grid-cols-2">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : isError ? (
            <p className="text-sm text-destructive">Failed to load ideas.</p>
          ) : filtered.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">
                {ideas.length === 0
                  ? "No ideas yet. Create one manually (no AI required) or generate a batch."
                  : "No ideas match this filter."}
              </p>
              {ideas.length === 0 && (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Button onClick={openCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create idea
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => generateMutation.mutate()}
                    disabled={generateMutation.isPending}
                  >
                    Generate with AI
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {filtered.map((idea) => {
                const hasDraft = (idea.drafts?.length || 0) > 0
                const busy =
                  statusMutation.isPending ||
                  saveMutation.isPending ||
                  (generateDraftMutation.isPending && generatingId === idea.id) ||
                  (convertManualMutation.isPending && convertingId === idea.id)
                return (
                  <li
                    key={idea.id}
                    className="flex flex-col rounded-md border p-4"
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="font-medium leading-snug">{idea.title}</h3>
                      {statusBadge(idea.status)}
                      {idea.source === "user" && (
                        <Badge variant="outline" className="text-xs">
                          Manual
                        </Badge>
                      )}
                    </div>
                    <p className="mb-3 line-clamp-3 flex-1 text-sm text-muted-foreground">
                      {idea.concept}
                    </p>
                    <div className="mb-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline">{platformLabel(idea.platform)}</Badge>
                      <Badge variant="outline">{idea.format}</Badge>
                      {idea.contentPillar?.name && (
                        <Badge variant="outline">{idea.contentPillar.name}</Badge>
                      )}
                    </div>
                    <div className="mt-auto flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => openEdit(idea)}
                      >
                        <Pencil className="mr-1 h-4 w-4" />
                        Edit
                      </Button>
                      {idea.status === "proposed" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busy}
                          onClick={() =>
                            statusMutation.mutate({
                              ideaId: idea.id,
                              status: "saved",
                            })
                          }
                        >
                          Save
                        </Button>
                      )}
                      {idea.status !== "rejected" && idea.status !== "converted" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() =>
                            statusMutation.mutate({
                              ideaId: idea.id,
                              status: "rejected",
                            })
                          }
                        >
                          Reject
                        </Button>
                      )}
                      {idea.status !== "rejected" && (
                        <>
                          {hasDraft && idea.drafts?.[0]?.id ? (
                            <Button size="sm" asChild>
                              <Link
                                href={`/dashboard/content?platform=all&draftId=${idea.drafts[0].id}`}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                Open draft
                              </Link>
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              disabled={
                                busy ||
                                convertManualMutation.isPending ||
                                generateDraftMutation.isPending
                              }
                              onClick={() => convertManualMutation.mutate(idea)}
                            >
                              {convertingId === idea.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <FileText className="mr-2 h-4 w-4" />
                              )}
                              Create draft
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={busy || generateDraftMutation.isPending}
                            onClick={() => generateDraftMutation.mutate(idea)}
                          >
                            {generatingId === idea.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="mr-2 h-4 w-4" />
                            )}
                            {hasDraft ? "AI draft again" : "Generate with AI"}
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <Link
                              href={`/dashboard/content/create?ideaId=${idea.id}&platform=${encodeURIComponent(idea.platform)}&type=${encodeURIComponent(idea.format || "post")}`}
                            >
                              Customize AI
                              <ArrowRight className="ml-1 h-3 w-3" />
                            </Link>
                          </Button>
                        </>
                      )}
                      {hasDraft && idea.drafts?.[0]?.id && (
                        <Button size="sm" variant="link" className="px-0" asChild>
                          <Link
                            href={`/dashboard/content?platform=all&draftId=${idea.drafts[0].id}`}
                          >
                            Open draft
                          </Link>
                        </Button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setEditingIdea(null)
            setForm(emptyForm())
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingIdea ? "Edit idea" : "Create idea"}
            </DialogTitle>
            <DialogDescription>
              {editingIdea
                ? "Update this idea for the selected brand."
                : "Manual ideas are saved immediately — no AI provider required."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="idea-title">Title</Label>
              <Input
                id="idea-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Behind the craft story"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="idea-concept">Description</Label>
              <Textarea
                id="idea-concept"
                rows={3}
                value={form.concept}
                onChange={(e) => setForm({ ...form, concept: e.target.value })}
                placeholder="What is the concept?"
                required
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select
                  value={form.platform}
                  onValueChange={(v) => setForm({ ...form, platform: v })}
                >
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
                <Select
                  value={form.format}
                  onValueChange={(v) => setForm({ ...form, format: v })}
                >
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
              <Label>Content pillar (optional)</Label>
              <Select
                value={form.contentPillarId}
                onValueChange={(v) => setForm({ ...form, contentPillarId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {pillars.map((p: { id: string; name: string }) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="idea-audience">Audience</Label>
              <Input
                id="idea-audience"
                value={form.audience}
                onChange={(e) => setForm({ ...form, audience: e.target.value })}
                placeholder="Who is this for?"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="idea-objective">Objective</Label>
              <Input
                id="idea-objective"
                value={form.objective}
                onChange={(e) => setForm({ ...form, objective: e.target.value })}
                placeholder="e.g. Build trust"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="idea-explanation">Notes (optional)</Label>
              <Textarea
                id="idea-explanation"
                rows={2}
                value={form.explanation}
                onChange={(e) =>
                  setForm({ ...form, explanation: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingIdea ? "Save changes" : "Create idea"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
