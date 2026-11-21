"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Check,
  Loader2,
  Plus,
  Sparkles,
  X,
  Pencil,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { queryKeys } from "@/lib/query-keys"

export type ContentPillarRow = {
  id: string
  name: string
  description: string
  purpose?: string | null
  approvalStatus: string
  isActive: boolean
  sortOrder: number
  source: string
}

async function fetchPillars(productId: string) {
  const res = await fetch(`/api/products/${productId}/pillars`)
  if (!res.ok) throw new Error("Failed to load pillars")
  return res.json()
}

function statusBadge(status: string, isActive: boolean) {
  if (!isActive) return <Badge variant="outline">Inactive</Badge>
  if (status === "approved")
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Approved</Badge>
  if (status === "rejected") return <Badge variant="destructive">Rejected</Badge>
  return <Badge variant="secondary">Proposed</Badge>
}

export function PillarsPanel({ productId }: { productId: string }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editPillar, setEditPillar] = useState<ContentPillarRow | null>(null)
  const [form, setForm] = useState({ name: "", description: "", purpose: "" })

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.pillars(productId),
    queryFn: () => fetchPillars(productId),
  })

  const pillars: ContentPillarRow[] = data?.pillars || []
  const proposed = pillars.filter((p) => p.approvalStatus === "proposed" && p.isActive)
  const approved = pillars.filter((p) => p.approvalStatus === "approved" && p.isActive)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.pillars(productId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.ideas(productId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.guide(productId) })
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/products/${productId}/pillars`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          purpose: form.purpose.trim() || undefined,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || "Failed to create pillar")
      return body
    },
    onSuccess: () => {
      invalidate()
      setCreateOpen(false)
      setForm({ name: "", description: "", purpose: "" })
      toast({ title: "Pillar created", variant: "success" })
    },
    onError: (e: Error) =>
      toast({ title: "Couldn’t create pillar", description: e.message, variant: "destructive" }),
  })

  const patchMutation = useMutation({
    mutationFn: async (payload: {
      pillarId: string
      body: Record<string, unknown>
    }) => {
      const res = await fetch(
        `/api/products/${productId}/pillars/${payload.pillarId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload.body),
        }
      )
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || "Failed to update pillar")
      return body
    },
    onSuccess: () => {
      invalidate()
      setEditPillar(null)
      toast({ title: "Pillar updated", variant: "success" })
    },
    onError: (e: Error) =>
      toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  })

  /**
   * There is no pillars-only AI task. Existing ideas.generate creates
   * proposed pillars and ideas together — label and toast must stay honest.
   */
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
        title: "Pillars and ideas proposed",
        description: `${body.pillars?.length ?? 0} pillars and ${body.ideas?.length ?? 0} ideas created. Review pillars here; ideas appear in Content Studio.`,
        variant: "success",
      })
    },
    onError: (e: Error) =>
      toast({
        title: "Couldn’t generate pillars & ideas",
        description: e.message,
        variant: "destructive",
      }),
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-lg">Content pillars</CardTitle>
            <CardDescription>
              Themes that keep ideas on-brand. Approve pillars before relying on them for content.
            </CardDescription>
          </div>
            <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => {
                setForm({ name: "", description: "", purpose: "" })
                setCreateOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add pillar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              title="Uses the ideas.generate task — also creates content ideas"
            >
              {generateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Generate pillars & ideas
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : isError ? (
          <p className="text-sm text-destructive">Failed to load pillars. Try refreshing.</p>
        ) : pillars.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No pillars yet. Add 3–5 themes manually (no AI required), or generate
              pillars and ideas together with AI when a provider is configured.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button
                onClick={() => {
                  setForm({ name: "", description: "", purpose: "" })
                  setCreateOpen(true)
                }}
              >
                Add pillar
              </Button>
              <Button
                variant="outline"
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
              >
                Generate pillars & ideas
              </Button>
            </div>
          </div>
        ) : (
          <>
            {proposed.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium">Awaiting approval ({proposed.length})</p>
                <ul className="space-y-3">
                  {proposed.map((p) => (
                    <PillarRow
                      key={p.id}
                      pillar={p}
                      busy={patchMutation.isPending}
                      onApprove={() =>
                        patchMutation.mutate({
                          pillarId: p.id,
                          body: { action: "approve" },
                        })
                      }
                      onReject={() =>
                        patchMutation.mutate({
                          pillarId: p.id,
                          body: { approvalStatus: "rejected", isActive: false },
                        })
                      }
                      onEdit={() => {
                        setEditPillar(p)
                        setForm({
                          name: p.name,
                          description: p.description,
                          purpose: p.purpose || "",
                        })
                      }}
                    />
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-sm font-medium">
                Active pillars ({approved.length || pillars.filter((p) => p.isActive).length})
              </p>
              {approved.length === 0 && proposed.length > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Approve at least one proposed pillar to guide content ideas.
                </p>
              ) : (
                <ul className="space-y-3">
                  {(approved.length > 0
                    ? approved
                    : pillars.filter((p) => p.isActive && p.approvalStatus !== "rejected")
                  ).map((p) => (
                    <PillarRow
                      key={p.id}
                      pillar={p}
                      busy={patchMutation.isPending}
                      onApprove={
                        p.approvalStatus !== "approved"
                          ? () =>
                              patchMutation.mutate({
                                pillarId: p.id,
                                body: { action: "approve" },
                              })
                          : undefined
                      }
                      onReject={() =>
                        patchMutation.mutate({
                          pillarId: p.id,
                          body: { isActive: false, approvalStatus: "rejected" },
                        })
                      }
                      onEdit={() => {
                        setEditPillar(p)
                        setForm({
                          name: p.name,
                          description: p.description,
                          purpose: p.purpose || "",
                        })
                      }}
                    />
                  ))}
                </ul>
              )}
            </div>

            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/content?tab=ideas">
                Continue to content ideas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </>
        )}
      </CardContent>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add content pillar</DialogTitle>
            <DialogDescription>
              Manual pillars are saved as approved for this brand.
            </DialogDescription>
          </DialogHeader>
          <PillarFormFields form={form} setForm={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={
                createMutation.isPending ||
                !form.name.trim() ||
                !form.description.trim()
              }
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save pillar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editPillar)}
        onOpenChange={(open) => !open && setEditPillar(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit pillar</DialogTitle>
          </DialogHeader>
          <PillarFormFields form={form} setForm={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPillar(null)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                editPillar &&
                patchMutation.mutate({
                  pillarId: editPillar.id,
                  body: {
                    name: form.name.trim(),
                    description: form.description.trim(),
                    purpose: form.purpose.trim() || null,
                  },
                })
              }
              disabled={patchMutation.isPending || !form.name.trim()}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function PillarFormFields({
  form,
  setForm,
}: {
  form: { name: string; description: string; purpose: string }
  setForm: (v: { name: string; description: string; purpose: string }) => void
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="pillar-name">Name</Label>
        <Input
          id="pillar-name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pillar-desc">Description</Label>
        <Textarea
          id="pillar-desc"
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pillar-purpose">Strategic purpose (optional)</Label>
        <Textarea
          id="pillar-purpose"
          rows={2}
          value={form.purpose}
          onChange={(e) => setForm({ ...form, purpose: e.target.value })}
        />
      </div>
    </div>
  )
}

function PillarRow({
  pillar,
  busy,
  onApprove,
  onReject,
  onEdit,
}: {
  pillar: ContentPillarRow
  busy: boolean
  onApprove?: () => void
  onReject: () => void
  onEdit: () => void
}) {
  return (
    <li className="rounded-md border p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{pillar.name}</p>
            {statusBadge(pillar.approvalStatus, pillar.isActive)}
            {pillar.source === "ai" && (
              <Badge variant="outline" className="text-xs">
                AI
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{pillar.description}</p>
          {pillar.purpose && (
            <p className="text-xs text-muted-foreground">Purpose: {pillar.purpose}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button size="sm" variant="ghost" onClick={onEdit} disabled={busy}>
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          {onApprove && (
            <Button size="sm" variant="secondary" onClick={onApprove} disabled={busy}>
              <Check className="mr-1 h-4 w-4" />
              Approve
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onReject} disabled={busy}>
            <X className="mr-1 h-4 w-4" />
            Reject
          </Button>
        </div>
      </div>
    </li>
  )
}
