"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

async function fetchSettings() {
  const res = await fetch("/api/settings")
  if (!res.ok) throw new Error("Failed to fetch settings")
  return res.json()
}

async function fetchProducts() {
  const res = await fetch("/api/products")
  if (!res.ok) throw new Error("Failed to fetch products")
  return res.json()
}

async function updateSettings(data: { founderBio?: string }) {
  const res = await fetch("/api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to update settings")
  return res.json()
}

async function updateProductTechStack(productId: string, techStack: { name: string; version?: string; note?: string }[]) {
  const res = await fetch(`/api/products/${productId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ techStack }),
  })
  if (!res.ok) throw new Error("Failed to update product")
  return res.json()
}

interface BuildInPublicModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BuildInPublicModal({ open, onOpenChange }: BuildInPublicModalProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [founderBio, setFounderBio] = useState("")
  const [productStacks, setProductStacks] = useState<Record<string, string>>({})

  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
    enabled: open,
  })

  const { data: productsData } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    enabled: open,
  })

  useEffect(() => {
    if (!open) return
    if (settingsData?.user?.founderBio) {
      setFounderBio(settingsData.user.founderBio)
    } else {
      setFounderBio("")
    }
  }, [open, settingsData?.user?.founderBio])

  useEffect(() => {
    if (!open || !productsData?.products) return
    const next: Record<string, string> = {}
    productsData.products.forEach((p: { id: string; techStackJson?: string | null }) => {
      if (p.techStackJson) {
        try {
          const arr = JSON.parse(p.techStackJson) as { name: string; version?: string; note?: string }[]
          next[p.id] = arr.map((t) => [t.name, t.version, t.note].filter(Boolean).join(" — ")).join("\n")
        } catch {
          next[p.id] = ""
        }
      } else {
        next[p.id] = ""
      }
    })
    setProductStacks(next)
  }, [open, productsData?.products])

  const settingsMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] })
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    },
  })

  const productMutation = useMutation({
    mutationFn: async ({
      productId,
      text,
    }: {
      productId: string
      text: string
    }) => {
      const items = text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
      const techStack = items.map((line) => {
        const parts = line.split("—").map((s) => s.trim())
        return {
          name: parts[0] || "",
          version: parts[1],
          note: parts[2],
        }
      })
      return updateProductTechStack(productId, techStack)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    },
  })

  const handleSave = async () => {
    try {
      await settingsMutation.mutateAsync({ founderBio: founderBio || undefined })
      for (const [productId, text] of Object.entries(productStacks)) {
        await productMutation.mutateAsync({ productId, text })
      }
      queryClient.invalidateQueries({ queryKey: ["settings"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast({
        title: "Build in public profile updated",
        description: "Your founder bio and tech stacks have been saved.",
        variant: "success",
      })
      onOpenChange(false)
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to save",
        variant: "destructive",
      })
    }
  }

  const products = productsData?.products ?? []
  const isPending = settingsMutation.isPending || productMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Build in public profile</DialogTitle>
          <DialogDescription>
            Add your founder bio and product tech stacks so we can use this context when generating content.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="founderBio">Founder bio</Label>
            <Textarea
              id="founderBio"
              placeholder="Who you are, what you share publicly (build in public, lessons, ship updates)..."
              value={founderBio}
              onChange={(e) => setFounderBio(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
          {products.length > 0 && (
            <div className="space-y-3">
              <Label>Tech stacks (per product)</Label>
              <p className="text-xs text-muted-foreground">
                One line per item: name, optional version, optional note. Example: Next.js 14 — App router
              </p>
              {products.map((p: { id: string; name: string }) => (
                <div key={p.id} className="space-y-1">
                  <Label className="text-sm font-normal text-muted-foreground">{p.name}</Label>
                  <Textarea
                    placeholder={"Next.js 14 — App router\nPostgres — Supabase"}
                    value={productStacks[p.id] ?? ""}
                    onChange={(e) =>
                      setProductStacks((prev) => ({ ...prev, [p.id]: e.target.value }))
                    }
                    rows={2}
                    className="resize-none text-sm"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
