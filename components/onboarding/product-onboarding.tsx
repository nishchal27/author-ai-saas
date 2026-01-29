"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
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
  Heart
} from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================
// TYPES
// ============================================

interface ProductFormData {
  name: string
  type: string
  industry: string
  audience: string
  customAudienceText: string
  audienceDetail: string
  stage: string
  salesMotion: string
  description: string
  website: string
}

interface ProductOnboardingProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete?: () => void
}

// ============================================
// OPTION DATA
// ============================================

const PRODUCT_TYPES = [
  { value: "saas", label: "SaaS / Software", icon: Code, description: "Web or mobile application" },
  { value: "course", label: "Course / Education", icon: GraduationCap, description: "Online learning product" },
  { value: "coaching", label: "Coaching / Consulting", icon: MessageSquare, description: "1:1 or group services" },
  { value: "physical", label: "Physical Product", icon: ShoppingBag, description: "Tangible goods" },
  { value: "event", label: "Event / Workshop", icon: Calendar, description: "Live or virtual events" },
  { value: "api", label: "API / Infrastructure", icon: Server, description: "Developer tools" },
  { value: "service", label: "Service Business", icon: Briefcase, description: "Professional services" },
  { value: "ngo", label: "NGO / Non-profit", icon: Heart, description: "Social impact" },
]

const AUDIENCE_TYPES = [
  { value: "developers", label: "Developers", description: "Technical builders" },
  { value: "smb_owners", label: "Small Business Owners", description: "SMB decision makers" },
  { value: "consumers", label: "Consumers", description: "General public" },
  { value: "professionals", label: "Professionals", description: "Career-focused individuals" },
  { value: "learners", label: "Learners", description: "Students or career switchers" },
  { value: "enterprise", label: "Enterprise Teams", description: "Corporate buyers" },
  { value: "creators", label: "Creators", description: "Content creators" },
  { value: "custom", label: "Other", description: "My audience isn't listed" },
]

const PRODUCT_STAGES = [
  { value: "idea", label: "Idea", description: "Still planning" },
  { value: "building", label: "Building", description: "In development" },
  { value: "launched", label: "Launched", description: "Just shipped" },
  { value: "growing", label: "Growing", description: "Active users" },
  { value: "mature", label: "Mature", description: "Established" },
]

const SALES_MOTIONS = [
  { value: "self_serve", label: "Self-Serve", description: "Users sign up themselves" },
  { value: "demo", label: "Demo → Subscribe", description: "Sales calls or demos" },
  { value: "creator_led", label: "Creator-Led", description: "Personal brand drives sales" },
  { value: "enterprise", label: "Enterprise", description: "Long sales cycles" },
  { value: "impulse", label: "Impulse", description: "Quick purchase decisions" },
]

// ============================================
// STEP COMPONENTS
// ============================================

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
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
  description 
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
        "relative flex flex-col items-start p-4 rounded-xl border-2 transition-all duration-200 text-left",
        "hover:border-primary/50 hover:bg-primary/5",
        selected 
          ? "border-primary bg-primary/5 shadow-sm" 
          : "border-muted bg-background"
      )}
    >
      {selected && (
        <div className="absolute top-3 right-3">
          <Check className="h-4 w-4 text-primary" />
        </div>
      )}
      {Icon && <Icon className={cn("h-5 w-5 mb-2", selected ? "text-primary" : "text-muted-foreground")} />}
      <span className={cn("font-medium", selected && "text-primary")}>{label}</span>
      <span className="text-sm text-muted-foreground">{description}</span>
    </button>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ProductOnboarding({ open, onOpenChange, onComplete }: ProductOnboardingProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    type: "",
    industry: "",
    audience: "",
    customAudienceText: "",
    audienceDetail: "",
    stage: "",
    salesMotion: "",
    description: "",
    website: "",
  })

  const totalSteps = 5

  // Create product mutation
  const createProduct = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const audience = data.audience === "custom" ? data.customAudienceText.trim() : data.audience
      const payload = {
        name: data.name,
        type: data.type,
        industry: data.industry,
        audience,
        audienceDetail: data.audienceDetail.trim() || undefined,
        stage: data.stage,
        salesMotion: data.salesMotion,
        description: data.description || undefined,
        website: data.website || undefined,
      }
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to create product")
      return res.json()
    },
    onSuccess: (data) => {
      localStorage.setItem("onboarding_completed", "true")
      onComplete?.()
      onOpenChange(false)
      router.push("/dashboard")
      router.refresh()
    },
  })

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1)
    } else {
      // Final step - create product
      createProduct.mutate(formData)
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 0: return formData.name.trim().length > 0
      case 1: return formData.type !== ""
      case 2:
        if (formData.audience === "custom") return formData.customAudienceText.trim().length > 0
        return formData.audience !== ""
      case 3: return formData.stage !== "" && formData.salesMotion !== ""
      case 4: return true // Description is optional
      default: return false
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6">
          <StepIndicator currentStep={step} totalSteps={totalSteps} />
        </div>

        {/* Content */}
        <div className="px-6 pb-6 min-h-[400px] flex flex-col">
          {/* Step 0: Product Name */}
          {step === 0 && (
            <div className="flex-1 flex flex-col">
              <DialogHeader className="text-center mb-8">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <DialogTitle className="text-2xl">What product are you marketing?</DialogTitle>
                <DialogDescription className="text-base mt-2">
                  AuthorAI adapts to YOUR product. Let's start with the basics.
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-base">Product Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Acme Analytics"
                      className="mt-2 h-12 text-lg"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      autoFocus
                    />
                  </div>
                  <div>
                    <Label htmlFor="industry" className="text-base">Industry / Domain</Label>
                    <Input
                      id="industry"
                      placeholder="e.g., Developer Tools, Education, E-commerce"
                      className="mt-2"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Product Type */}
          {step === 1 && (
            <div className="flex-1 flex flex-col">
              <DialogHeader className="text-center mb-6">
                <DialogTitle className="text-2xl">What type of product is {formData.name || "this"}?</DialogTitle>
                <DialogDescription className="text-base mt-2">
                  This determines which marketing strategies work best.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3 flex-1">
                {PRODUCT_TYPES.map((type) => (
                  <OptionCard
                    key={type.value}
                    selected={formData.type === type.value}
                    onClick={() => setFormData({ ...formData, type: type.value })}
                    icon={type.icon}
                    label={type.label}
                    description={type.description}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Audience */}
          {step === 2 && (
            <div className="flex-1 flex flex-col">
              <DialogHeader className="text-center mb-6">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <DialogTitle className="text-2xl">Who is {formData.name} for?</DialogTitle>
                <DialogDescription className="text-base mt-2">
                  Different audiences need different platforms and tones.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3">
                {AUDIENCE_TYPES.map((audience) => (
                  <OptionCard
                    key={audience.value}
                    selected={formData.audience === audience.value}
                    onClick={() => setFormData({ ...formData, audience: audience.value })}
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
                    placeholder="e.g. Trainers, coaches, NGOs, communities"
                    value={formData.customAudienceText}
                    onChange={(e) => setFormData({ ...formData, customAudienceText: e.target.value })}
                  />
                </div>
              )}

              <div className="mt-4 space-y-2">
                <Label htmlFor="audienceDetail">Who exactly? (optional)</Label>
                <Input
                  id="audienceDetail"
                  placeholder="e.g. College students trying to lose weight or quit sugar"
                  value={formData.audienceDetail}
                  onChange={(e) => setFormData({ ...formData, audienceDetail: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Narrow down your target if you have a specific segment in mind.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Stage & Sales Motion */}
          {step === 3 && (
            <div className="flex-1 flex flex-col">
              <DialogHeader className="text-center mb-6">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <DialogTitle className="text-2xl">Where is {formData.name} today?</DialogTitle>
                <DialogDescription className="text-base mt-2">
                  Your stage and sales approach affect content strategy.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 flex-1">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-3 block">Product Stage</Label>
                  <div className="flex gap-2">
                    {PRODUCT_STAGES.map((stage) => (
                      <button
                        key={stage.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, stage: stage.value })}
                        className={cn(
                          "flex-1 py-3 px-2 rounded-lg border-2 transition-all text-center",
                          formData.stage === stage.value
                            ? "border-primary bg-primary/5"
                            : "border-muted hover:border-primary/30"
                        )}
                      >
                        <div className={cn("font-medium text-sm", formData.stage === stage.value && "text-primary")}>
                          {stage.label}
                        </div>
                        <div className="text-xs text-muted-foreground">{stage.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-3 block">How do you sell?</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {SALES_MOTIONS.map((motion) => (
                      <OptionCard
                        key={motion.value}
                        selected={formData.salesMotion === motion.value}
                        onClick={() => setFormData({ ...formData, salesMotion: motion.value })}
                        label={motion.label}
                        description={motion.description}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Description (Optional) */}
          {step === 4 && (
            <div className="flex-1 flex flex-col">
              <DialogHeader className="text-center mb-6">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <DialogTitle className="text-2xl">Almost there!</DialogTitle>
                <DialogDescription className="text-base mt-2">
                  Any additional context helps us give better recommendations.
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 space-y-4 max-w-md mx-auto w-full">
                <div>
                  <Label htmlFor="description">Brief Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="What does your product do? What problem does it solve?"
                    className="mt-2 min-h-[100px]"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website (optional)</Label>
                  <Input
                    id="website"
                    placeholder="https://yourproduct.com"
                    className="mt-2"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>
              </div>

              {/* Summary Preview */}
              <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
                <div className="text-sm font-medium mb-2">Your Product Profile</div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><span className="font-medium text-foreground">{formData.name}</span> - {PRODUCT_TYPES.find(t => t.value === formData.type)?.label}</p>
                  <p>For: {formData.audience === "custom" ? formData.customAudienceText || "—" : (AUDIENCE_TYPES.find(a => a.value === formData.audience)?.label ?? formData.audience)}</p>
                  {formData.audienceDetail && <p>Who exactly: {formData.audienceDetail}</p>}
                  <p>Stage: {PRODUCT_STAGES.find(s => s.value === formData.stage)?.label} • {SALES_MOTIONS.find(m => m.value === formData.salesMotion)?.label}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={step === 0}
              className={cn(step === 0 && "invisible")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceed() || createProduct.isPending}
              className="min-w-[140px]"
            >
              {createProduct.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : step === totalSteps - 1 ? (
                <>
                  <Rocket className="h-4 w-4 mr-2" />
                  Generate Strategy
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
