"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { shiftWeekIso, weekStartUtc } from "@/lib/planner/dates"

async function fetchProducts() {
  const res = await fetch("/api/products")
  if (!res.ok) throw new Error("Failed to fetch products")
  return res.json()
}

async function fetchPlan(productId: string, weekStart: string) {
  const res = await fetch(
    `/api/products/${productId}/plan?weekStart=${encodeURIComponent(weekStart)}`
  )
  if (!res.ok) throw new Error("Failed to fetch plan")
  return res.json()
}

async function fetchIdeas(productId: string) {
  const res = await fetch(`/api/products/${productId}/ideas`)
  if (!res.ok) throw new Error("Failed to fetch ideas")
  return res.json()
}

async function fetchDrafts() {
  const res = await fetch("/api/content/drafts?scope=active")
  if (!res.ok) throw new Error("Failed to fetch drafts")
  return res.json()
}

function formatWeekLabel(iso: string) {
  const start = new Date(iso)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 6)
  const fmt = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  })
  return `${fmt.format(start)} – ${fmt.format(end)}`
}

export default function ContentPlannerPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [weekStart, setWeekStart] = useState(() =>
    weekStartUtc(new Date()).toISOString()
  )
  const [addOpen, setAddOpen] = useState(false)
  const [addMode, setAddMode] = useState<"idea" | "draft">("idea")
  const [selectedId, setSelectedId] = useState("")

  const {
    data: productsData,
    isLoading: productsLoading,
    isError: productsError,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: queryKeys.products,
    queryFn: fetchProducts,
  })
  const productId =
    productsData?.activeProductId || productsData?.products?.[0]?.id || null

  const { data: planData, isLoading: planLoading } = useQuery({
    queryKey: queryKeys.plan(productId || "none", weekStart),
    queryFn: () => fetchPlan(productId!, weekStart),
    enabled: Boolean(productId),
  })

  const { data: ideasData } = useQuery({
    queryKey: queryKeys.ideas(productId || "none"),
    queryFn: () => fetchIdeas(productId!),
    enabled: Boolean(productId) && addOpen,
  })

  const { data: draftsData } = useQuery({
    queryKey: queryKeys.drafts("active"),
    queryFn: fetchDrafts,
    enabled: Boolean(productId) && addOpen,
  })

  const items = planData?.plan?.items || []
  const completed = items.filter(
    (i: { status: string }) => i.status === "completed"
  ).length
  const inProgress = items.filter(
    (i: { status: string }) => i.status === "in_progress"
  ).length

  const ideaOptions = useMemo(() => {
    const onPlan = new Set(
      items
        .map((i: { contentIdeaId?: string | null }) => i.contentIdeaId)
        .filter(Boolean)
    )
    return (ideasData?.ideas || []).filter(
      (i: { id: string; status: string }) =>
        ["proposed", "saved", "converted"].includes(i.status) && !onPlan.has(i.id)
    )
  }, [ideasData, items])

  const draftOptions = useMemo(() => {
    const onPlan = new Set(
      items
        .map((i: { contentDraftId?: string | null }) => i.contentDraftId)
        .filter(Boolean)
    )
    return (draftsData?.drafts || []).filter(
      (d: { id: string; productId?: string }) =>
        (!productId || d.productId === productId) && !onPlan.has(d.id)
    )
  }, [draftsData, items, productId])

  const invalidate = () => {
    if (!productId) return
    queryClient.invalidateQueries({
      queryKey: queryKeys.plan(productId, weekStart),
    })
    queryClient.invalidateQueries({ queryKey: queryKeys.guide(productId) })
  }

  const addMutation = useMutation({
    mutationFn: async () => {
      const body =
        addMode === "idea"
          ? { contentIdeaId: selectedId, weekStart }
          : { contentDraftId: selectedId, weekStart }
      const res = await fetch(`/api/products/${productId}/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to add item")
      return data
    },
    onSuccess: () => {
      invalidate()
      setAddOpen(false)
      setSelectedId("")
      toast({ title: "Added to this week", variant: "success" })
    },
    onError: (e: Error) =>
      toast({ title: "Couldn’t add item", description: e.message, variant: "destructive" }),
  })

  const statusMutation = useMutation({
    mutationFn: async (payload: { itemId: string; status: string }) => {
      const res = await fetch(`/api/products/${productId}/plan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to update")
      return data
    },
    onSuccess: () => {
      invalidate()
      toast({ title: "Status updated", variant: "success" })
    },
    onError: (e: Error) =>
      toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  })

  const removeMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await fetch(`/api/products/${productId}/plan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, action: "remove" }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to remove")
      return data
    },
    onSuccess: () => {
      invalidate()
      toast({ title: "Removed from plan", variant: "success" })
    },
    onError: (e: Error) =>
      toast({ title: "Remove failed", description: e.message, variant: "destructive" }),
  })

  if (productsLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (productsError) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Couldn’t load your brands</CardTitle>
          <CardDescription>
            This is a load failure, not an empty planner. Try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => refetchProducts()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!productId) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <CalendarCheck className="mx-auto mb-4 h-10 w-10 text-primary" />
        <h1 className="text-2xl font-semibold">Content Planner</h1>
        <p className="mt-2 text-muted-foreground">Add a brand first, then plan the week.</p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">Go to Overview</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Content Planner
          </h1>
          <p className="mt-1 text-muted-foreground">
            A simple weekly checklist — not a publishing calendar.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add item
        </Button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous week"
          onClick={() => setWeekStart((w) => shiftWeekIso(w, -1))}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <p className="text-sm font-medium">{formatWeekLabel(weekStart)}</p>
        <Button
          variant="outline"
          size="icon"
          aria-label="Next week"
          onClick={() => setWeekStart((w) => shiftWeekIso(w, 1))}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarCheck className="h-5 w-5 text-primary" />
            This week
          </CardTitle>
          <CardDescription>
            {items.length === 0
              ? "Nothing planned yet."
              : `${completed} completed · ${inProgress} in progress · ${items.length} total`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {planLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : items.length === 0 ? (
            <div className="space-y-3 rounded-md border border-dashed p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Add a saved idea or draft to build this week’s checklist.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={() => setAddOpen(true)}>Add item</Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/content?tab=ideas">Browse ideas</Link>
                </Button>
              </div>
            </div>
          ) : (
            <ul className="divide-y rounded-md border">
              {items.map(
                (item: {
                  id: string
                  status: string
                  contentIdeaId?: string | null
                  contentDraftId?: string | null
                  contentIdea?: { id: string; title?: string; platform?: string } | null
                  contentDraft?: { id: string; title?: string; platform?: string } | null
                }) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {item.contentIdea?.title ||
                          item.contentDraft?.title ||
                          "Plan item"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.contentIdea
                          ? `Idea · ${item.contentIdea.platform || "—"}`
                          : `Draft · ${item.contentDraft?.platform || "—"}`}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Select
                        value={item.status}
                        onValueChange={(status) =>
                          statusMutation.mutate({ itemId: item.id, status })
                        }
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planned">Planned</SelectItem>
                          <SelectItem value="in_progress">In progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      {item.contentDraftId && (
                        <Button size="sm" variant="outline" asChild>
                          <Link
                            href={`/dashboard/content?platform=all&draftId=${item.contentDraftId}`}
                          >
                            Open
                          </Link>
                        </Button>
                      )}
                      {item.contentIdeaId && !item.contentDraftId && (
                        <Button size="sm" variant="outline" asChild>
                          <Link
                            href={`/dashboard/content/create?ideaId=${item.contentIdeaId}`}
                          >
                            Draft
                          </Link>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label="Remove"
                        onClick={() => {
                          if (confirm("Remove this item from the week plan?")) {
                            removeMutation.mutate(item.id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                )
              )}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to this week</DialogTitle>
            <DialogDescription>
              Choose a saved idea or an existing draft from this brand.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Select
              value={addMode}
              onValueChange={(v) => {
                setAddMode(v as "idea" | "draft")
                setSelectedId("")
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="idea">Idea</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    addMode === "idea" ? "Select an idea" : "Select a draft"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {addMode === "idea"
                  ? ideaOptions.map((i: { id: string; title: string }) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.title}
                      </SelectItem>
                    ))
                  : draftOptions.map(
                      (d: { id: string; title?: string | null; type?: string }) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.title || d.type || d.id}
                        </SelectItem>
                      )
                    )}
              </SelectContent>
            </Select>
            {addMode === "idea" && ideaOptions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No unused ideas.{" "}
                <Link href="/dashboard/content?tab=ideas" className="underline">
                  Generate ideas
                </Link>
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!selectedId || addMutation.isPending}
              onClick={() => addMutation.mutate()}
            >
              {addMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
