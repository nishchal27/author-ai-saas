"use client"

import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  PRODUCT_TYPES,
  INDUSTRIES,
  BUSINESS_MODELS,
  SALES_APPROACHES,
  PRODUCT_STAGES,
  normalizeIndustry,
} from "@/lib/product-options"

export type BrandProduct = {
  id: string
  name: string
  type: string
  industry: string
  audience: string
  audienceDetail?: string | null
  stage: string
  salesMotion: string
  businessModel?: string | null
  description?: string | null
  website?: string | null
  competitors?: string | null
}

function industrySelectValue(raw: string) {
  const normalized = normalizeIndustry(raw)
  if (INDUSTRIES.some((i) => i.value === normalized)) return normalized
  // Preserve unknown legacy free-text by falling back to Other
  return INDUSTRIES.some((i) => i.value === raw) ? raw : "other"
}

export function BrandProfileForm({
  product,
}: {
  product: BrandProduct
}) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    name: product.name || "",
    type: product.type || "saas",
    industry: industrySelectValue(product.industry || ""),
    audience: product.audience || "",
    audienceDetail: product.audienceDetail || "",
    stage: product.stage || "building",
    salesMotion: product.salesMotion || "self_serve",
    businessModel: product.businessModel || "",
    description: product.description || "",
    website: product.website || "",
    competitors: product.competitors || "",
  })

  useEffect(() => {
    setForm({
      name: product.name || "",
      type: product.type || "saas",
      industry: industrySelectValue(product.industry || ""),
      audience: product.audience || "",
      audienceDetail: product.audienceDetail || "",
      stage: product.stage || "building",
      salesMotion: product.salesMotion || "self_serve",
      businessModel: product.businessModel || "",
      description: product.description || "",
      website: product.website || "",
      competitors: product.competitors || "",
    })
  }, [product])

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          businessModel: form.businessModel || null,
          website: form.website || "",
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(
          err.details
            ? `${err.error || "Validation failed"}: ${err.details}`
            : err.error || "Failed to save profile"
        )
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products })
      queryClient.invalidateQueries({ queryKey: queryKeys.product(product.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.brand(product.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.guide(product.id) })
      toast({
        title: "Profile saved",
        description: "Brand details updated. Approved summaries were not changed.",
        variant: "success",
      })
    },
    onError: (e: Error) => {
      toast({
        title: "Couldn’t save profile",
        description: e.message,
        variant: "destructive",
      })
    },
  })

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        save.mutate()
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Brand / business name</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Product / business type</Label>
          <Select value={form.type} onValueChange={(v) => set("type", v)}>
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Select
            value={form.industry}
            onValueChange={(v) => set("industry", v)}
          >
            <SelectTrigger id="industry">
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((i) => (
                <SelectItem key={i.value} value={i.value}>
                  {i.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Category you operate in — not the same as sales channel or business model.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="businessModel">
            Business model{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Select
            value={form.businessModel || "none"}
            onValueChange={(v) => set("businessModel", v === "none" ? "" : v)}
          >
            <SelectTrigger id="businessModel">
              <SelectValue placeholder="Optional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not specified</SelectItem>
              {BUSINESS_MODELS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="salesMotion">Sales approach</Label>
          <Select
            value={form.salesMotion}
            onValueChange={(v) => set("salesMotion", v)}
          >
            <SelectTrigger id="salesMotion">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SALES_APPROACHES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="audience">Audience</Label>
          <Input
            id="audience"
            value={form.audience}
            onChange={(e) => set("audience", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stage">Business stage</Label>
          <Select value={form.stage} onValueChange={(v) => set("stage", v)}>
            <SelectTrigger id="stage">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_STAGES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="audienceDetail">
            Who exactly?{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="audienceDetail"
            value={form.audienceDetail}
            onChange={(e) => set("audienceDetail", e.target.value)}
            rows={2}
            placeholder="e.g. boutique jewellery buyers who care about Assam craftsmanship"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">
            Description{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">
            Website{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="website"
            value={form.website}
            onChange={(e) => set("website", e.target.value)}
            placeholder="https://"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="competitors">
            Competitors{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="competitors"
            value={form.competitors}
            onChange={(e) => set("competitors", e.target.value)}
          />
        </div>
      </div>
      <Button type="submit" disabled={save.isPending}>
        {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save profile
      </Button>
    </form>
  )
}
