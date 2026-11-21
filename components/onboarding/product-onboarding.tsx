"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import {
  Package,
  Users,
  Target,
  Rocket,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Code,
  GraduationCap,
  MessageSquare,
  ShoppingBag,
  Calendar,
  Server,
  Briefcase,
  Heart,
  MoreHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { clearBrandScopedQueries, queryKeys } from "@/lib/query-keys"
import {
  PRODUCT_TYPES,
  INDUSTRIES,
  BUSINESS_MODELS,
  SALES_APPROACHES,
  PRODUCT_STAGES,
  AUDIENCE_TYPES,
  labelFor,
} from "@/lib/product-options"
import {
  canSubmitOnboardingCreate,
  createEmptyOnboardingForm,
  ONBOARDING_TOTAL_STEPS,
  shouldResetWizardOnOpenChange,
  type OnboardingFormData,
} from "@/lib/onboarding/wizard-state"

type ProductFormData = OnboardingFormData

interface ProductOnboardingProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete?: () => void
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  saas: Code,
  course: GraduationCap,
  coaching: MessageSquare,
  physical: ShoppingBag,
  event: Calendar,
  api: Server,
  service: Briefcase,
  ngo: Heart,
  other: MoreHorizontal,
}

function StepIndicator({
  currentStep,
  totalSteps,
}: {
  currentStep: number
  totalSteps: number
}) {
  return (
    <div className="mb-8 flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-2 rounded-full transition-all duration-300",
            i === currentStep
              ? "w-8 bg-primary"
              : i < currentStep
                ? "w-2 bg-primary/50"
                : "w-2 bg-muted"
          )}
        />
      ))}
    </div>
  )
}

function OptionCard({
  selected,
  onClick,
  icon: Icon,
  label,
  description,
}: {
  selected: boolean
  onClick: () => void
  icon?: React.ComponentType<{ className?: string }>
  label: string
  description: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-start rounded-xl border-2 p-4 text-left transition-all duration-200",
        "hover:border-primary/50 hover:bg-primary/5",
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-muted bg-background"
      )}
    >
      {selected && (
        <div className="absolute right-3 top-3">
          <Check className="h-4 w-4 text-primary" />
        </div>
      )}
      {Icon && (
        <Icon
          className={cn(
            "mb-2 h-5 w-5",
            selected ? "text-primary" : "text-muted-foreground"
          )}
        />
      )}
      <span className={cn("font-medium", selected && "text-primary")}>{label}</span>
      <span className="text-sm text-muted-foreground">{description}</span>
    </button>
  )
}

export function ProductOnboarding({
  open,
  onOpenChange,
  onComplete,
}: ProductOnboardingProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState<ProductFormData>(
    createEmptyOnboardingForm
  )
  const [formError, setFormError] = useState<string | null>(null)
  const wasOpenRef = useRef(false)

  const totalSteps = ONBOARDING_TOTAL_STEPS

  const resetWizard = () => {
    setStep(0)
    setFormData(createEmptyOnboardingForm())
    setFormError(null)
  }

  const createProduct = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const audience =
        data.audience === "custom" ? data.customAudienceText.trim() : data.audience
      const payload = {
        name: data.name.trim(),
        type: data.type,
        industry: data.industry,
        audience,
        audienceDetail: data.audienceDetail.trim() || undefined,
        stage: data.stage,
        salesMotion: data.salesMotion,
        businessModel: data.businessModel || null,
        description: data.description.trim() || undefined,
        website: data.website.trim() || undefined,
      }
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        const detail =
          typeof body.details === "string" ? body.details : undefined
        throw new Error(
          detail
            ? `${body.error || "Failed to create brand"}: ${detail}`
            : body.error || "Failed to create brand"
        )
      }
      return body as {
        product?: { id: string; name?: string }
        activeProductId?: string
      }
    },
    onSuccess: (body) => {
      const productId = body.activeProductId || body.product?.id
      localStorage.setItem("onboarding_completed", "true")

      // Prevent previous brand data from flashing in Brand Studio
      clearBrandScopedQueries(queryClient)
      if (productId) {
        queryClient.setQueryData(
          queryKeys.products,
          (
            old:
              | {
                  products?: { id: string }[]
                  activeProductId?: string | null
                }
              | undefined
          ) => {
            if (!old) {
              return {
                products: body.product ? [body.product] : [],
                activeProductId: productId,
              }
            }
            const products = old.products || []
            const exists = products.some((p) => p.id === productId)
            return {
              ...old,
              products:
                exists || !body.product
                  ? products
                  : [...products, body.product as { id: string }],
              activeProductId: productId,
            }
          }
        )
      }

      onComplete?.()
      onOpenChange(false)
      resetWizard()
      createProduct.reset()
      router.push("/dashboard/brand")
      router.refresh()
    },
    onError: (e: Error) => setFormError(e.message),
  })

  // Reset when the dialog opens so a previous brand's draft never carries over
  useEffect(() => {
    if (shouldResetWizardOnOpenChange(wasOpenRef.current, open)) {
      resetWizard()
      createProduct.reset()
    }
    wasOpenRef.current = open
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to open transitions
  }, [open])

  const handleNext = () => {
    if (createProduct.isPending) return
    setFormError(null)
    if (step < totalSteps - 1) {
      setStep(step + 1)
      return
    }
    if (
      !canSubmitOnboardingCreate({
        step,
        totalSteps,
        isPending: createProduct.isPending,
      })
    ) {
      return
    }
    createProduct.mutate(formData)
  }

  const handleBack = () => {
    if (createProduct.isPending) return
    setFormError(null)
    if (step > 0) setStep(step - 1)
  }

  const canProceed = () => {
    switch (step) {
      case 0:
        return formData.name.trim().length > 0 && formData.industry !== ""
      case 1:
        return formData.type !== ""
      case 2:
        if (formData.audience === "custom")
          return formData.customAudienceText.trim().length > 0
        return formData.audience !== ""
      case 3:
        return formData.stage !== "" && formData.salesMotion !== ""
      case 4:
        return true
      default:
        return false
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-[640px]">
        <div className="px-6 pt-6">
          <StepIndicator currentStep={step} totalSteps={totalSteps} />
        </div>

        <div className="flex min-h-[420px] flex-col px-6 pb-6">
          {step === 0 && (
            <div className="flex flex-1 flex-col">
              <DialogHeader className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <DialogTitle className="text-2xl">
                  What brand are you marketing?
                </DialogTitle>
                <DialogDescription className="mt-2 text-base">
                  Start with your brand name and industry. Industry is the category you
                  operate in — not how you sell.
                </DialogDescription>
              </DialogHeader>

              <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center space-y-4">
                <div>
                  <Label htmlFor="name" className="text-base">
                    Brand / business name
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Assam Craft Co."
                    className="mt-2 h-12 text-lg"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    autoFocus
                  />
                </div>
                <div>
                  <Label htmlFor="industry" className="text-base">
                    Industry
                  </Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(v) =>
                      setFormData({ ...formData, industry: v })
                    }
                  >
                    <SelectTrigger id="industry" className="mt-2">
                      <SelectValue placeholder="Select an industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((ind) => (
                        <SelectItem key={ind.value} value={ind.value}>
                          {ind.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Example: Fashion & Apparel is an industry. Ecommerce is often a
                    channel — pick Retail & Ecommerce if that fits.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-1 flex-col">
              <DialogHeader className="mb-6 text-center">
                <DialogTitle className="text-2xl">
                  What type of business is {formData.name || "this"}?
                </DialogTitle>
                <DialogDescription className="mt-2 text-base">
                  Product / business type describes what you offer — separate from
                  industry and how customers buy.
                </DialogDescription>
              </DialogHeader>

              <div className="grid flex-1 grid-cols-2 gap-3">
                {PRODUCT_TYPES.map((type) => (
                  <OptionCard
                    key={type.value}
                    selected={formData.type === type.value}
                    onClick={() =>
                      setFormData({ ...formData, type: type.value })
                    }
                    icon={TYPE_ICONS[type.value]}
                    label={type.label}
                    description={type.description}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-1 flex-col">
              <DialogHeader className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <DialogTitle className="text-2xl">
                  Who is {formData.name} for?
                </DialogTitle>
                <DialogDescription className="mt-2 text-base">
                  Target audience shapes tone and platforms.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3">
                {AUDIENCE_TYPES.map((audience) => (
                  <OptionCard
                    key={audience.value}
                    selected={formData.audience === audience.value}
                    onClick={() =>
                      setFormData({ ...formData, audience: audience.value })
                    }
                    label={audience.label}
                    description={audience.description}
                  />
                ))}
              </div>

              {formData.audience === "custom" && (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="customAudience">Describe your audience</Label>
                  <Input
                    id="customAudience"
                    placeholder="e.g. boutique jewellery buyers"
                    value={formData.customAudienceText}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customAudienceText: e.target.value,
                      })
                    }
                  />
                </div>
              )}

              <div className="mt-4 space-y-2">
                <Label htmlFor="audienceDetail">
                  Who exactly?{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="audienceDetail"
                  placeholder="e.g. shoppers who care about Assam craftsmanship"
                  value={formData.audienceDetail}
                  onChange={(e) =>
                    setFormData({ ...formData, audienceDetail: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-1 flex-col">
              <DialogHeader className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <DialogTitle className="text-2xl">
                  Stage, model & sales approach
                </DialogTitle>
                <DialogDescription className="mt-2 text-base">
                  Business model (optional) is how you sell commercially. Sales
                  approach is how customers typically convert.
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 space-y-6">
                <div>
                  <Label className="mb-3 block text-sm font-medium text-muted-foreground">
                    Business stage
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {PRODUCT_STAGES.map((stage) => (
                      <button
                        key={stage.value}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, stage: stage.value })
                        }
                        className={cn(
                          "min-w-[4.5rem] flex-1 rounded-lg border-2 px-2 py-3 text-center transition-all",
                          formData.stage === stage.value
                            ? "border-primary bg-primary/5"
                            : "border-muted hover:border-primary/30"
                        )}
                      >
                        <div
                          className={cn(
                            "text-sm font-medium",
                            formData.stage === stage.value && "text-primary"
                          )}
                        >
                          {stage.label}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {stage.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block text-sm font-medium text-muted-foreground">
                    Business model{" "}
                    <span className="font-normal">(optional)</span>
                  </Label>
                  <Select
                    value={formData.businessModel || "none"}
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        businessModel: v === "none" ? "" : v,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select if known" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Prefer not to say</SelectItem>
                      {BUSINESS_MODELS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-3 block text-sm font-medium text-muted-foreground">
                    Sales approach
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {SALES_APPROACHES.map((motion) => (
                      <OptionCard
                        key={motion.value}
                        selected={formData.salesMotion === motion.value}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            salesMotion: motion.value,
                          })
                        }
                        label={motion.label}
                        description={motion.description}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-1 flex-col">
              <DialogHeader className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <DialogTitle className="text-2xl">Almost there</DialogTitle>
                <DialogDescription className="mt-2 text-base">
                  Optional context helps later. You’ll refine everything in Brand
                  Studio next — no AI required to create your brand.
                </DialogDescription>
              </DialogHeader>

              <div className="mx-auto w-full max-w-md flex-1 space-y-4">
                <div>
                  <Label htmlFor="description">
                    Brief description{" "}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="What do you offer? What problem do you solve?"
                    className="mt-2 min-h-[100px]"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="website">
                    Website{" "}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="website"
                    placeholder="https://yourbrand.com"
                    className="mt-2"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="mt-6 rounded-lg border bg-muted/50 p-4">
                <div className="mb-2 text-sm font-medium">Brand profile preview</div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">
                      {formData.name || "—"}
                    </span>{" "}
                    · {labelFor(PRODUCT_TYPES, formData.type)} ·{" "}
                    {labelFor(INDUSTRIES, formData.industry)}
                  </p>
                  <p>
                    Audience:{" "}
                    {formData.audience === "custom"
                      ? formData.customAudienceText || "—"
                      : labelFor(AUDIENCE_TYPES, formData.audience)}
                  </p>
                  {formData.businessModel && (
                    <p>
                      Model: {labelFor(BUSINESS_MODELS, formData.businessModel)}
                    </p>
                  )}
                  <p>
                    {labelFor(PRODUCT_STAGES, formData.stage)} ·{" "}
                    {labelFor(SALES_APPROACHES, formData.salesMotion)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {formError && (
            <p className="mt-2 text-sm text-destructive">{formError}</p>
          )}

          <div className="mt-6 flex items-center justify-between border-t pt-4">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={step === 0}
              className={cn(step === 0 && "invisible")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceed() || createProduct.isPending}
              className="min-w-[160px]"
            >
              {createProduct.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : step === totalSteps - 1 ? (
                <>
                  <Rocket className="mr-2 h-4 w-4" />
                  Create brand
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
