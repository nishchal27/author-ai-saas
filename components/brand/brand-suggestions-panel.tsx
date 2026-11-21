"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { queryKeys } from "@/lib/query-keys"
import { useState } from "react"

type Suggestion = {
  id: string
  area: string
  title: string
  suggestion: string
  rationale: string
  isGuess: boolean
  status: "pending" | "accepted" | "rejected" | "edited"
}

export function BrandSuggestionsPanel({ productId }: { productId: string }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.suggestions(productId),
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}/suggestions`)
      if (!res.ok) throw new Error("Failed to load suggestions")
      return res.json()
    },
  })

  const generate = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/products/${productId}/suggestions`, {
        method: "POST",
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || "Failed to generate suggestions")
      return body
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.suggestions(productId),
      })
      toast({
        title: "Suggestions ready",
        description: "These are prompts to improve your profile — not approved facts.",
        variant: "success",
      })
    },
    onError: (e: Error) => {
      toast({
        title: "Couldn’t generate suggestions",
        description: e.message,
        variant: "destructive",
      })
    },
  })

  const updateStatus = useMutation({
    mutationFn: async (payload: {
      suggestionId: string
      status: Suggestion["status"]
      editedText?: string
    }) => {
      const res = await fetch(`/api/products/${productId}/suggestions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || "Failed to update suggestion")
      return body
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.suggestions(productId),
      })
      setEditingId(null)
    },
    onError: (e: Error) => {
      toast({
        title: "Update failed",
        description: e.message,
        variant: "destructive",
      })
    },
  })

  const suggestions: Suggestion[] = data?.batch?.suggestions || []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Optional improvements. Accepting a suggestion does not auto-approve brand facts.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
        >
          {generate.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Generate suggestions
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : suggestions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No suggestions yet. Generate after your profile has enough detail.
        </p>
      ) : (
        <ul className="space-y-3">
          {suggestions.map((s) => (
            <li key={s.id} className="rounded-md border p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <p className="font-medium">{s.title}</p>
                <Badge variant="outline">{s.area}</Badge>
                <Badge variant="secondary">{s.status}</Badge>
                {s.isGuess && <Badge variant="outline">Guess</Badge>}
              </div>
              <p className="text-sm">{s.suggestion}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.rationale}</p>
              {editingId === s.id ? (
                <div className="mt-3 space-y-2">
                  <Textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        updateStatus.mutate({
                          suggestionId: s.id,
                          status: "edited",
                          editedText: editText,
                        })
                      }
                    >
                      Save edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                s.status === "pending" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        updateStatus.mutate({
                          suggestionId: s.id,
                          status: "accepted",
                        })
                      }
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(s.id)
                        setEditText(s.suggestion)
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        updateStatus.mutate({
                          suggestionId: s.id,
                          status: "rejected",
                        })
                      }
                    >
                      Reject
                    </Button>
                  </div>
                )
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
