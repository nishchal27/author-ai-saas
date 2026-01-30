"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Check, 
  X, 
  AlertCircle, 
  RefreshCw, 
  Loader2,
  Linkedin,
  Twitter,
  Instagram,
  Github,
  Mail,
  FileText,
  MessageSquare,
  Image,
  Sparkles,
  Clock
} from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================
// TYPES
// ============================================

interface PlatformRecommendation {
  platform: string
  priority: "primary" | "secondary" | "avoid"
  reasoning: string
}

interface ContentTypeRecommendation {
  type: string
  recommended: boolean
  reasoning: string
}

interface ToneRecommendation {
  style: string
  examples: string[]
  avoid: string[]
}

interface CadenceRecommendation {
  frequency: string
  postsPerWeek: number
  reasoning: string
}

interface AntiPattern {
  pattern: string
  reasoning: string
}

interface MarketingStrategy {
  platforms: PlatformRecommendation[]
  contentTypes: ContentTypeRecommendation[]
  tone: ToneRecommendation
  visualStyle: { style: string; examples: string[] }
  cadence: CadenceRecommendation
  proofTypes: string[]
  antiPatterns: AntiPattern[]
  summary: string
  reasoning: string
  confidence: number
}

interface StrategyDisplayProps {
  productId: string
  productName: string
  strategy: MarketingStrategy
  generatedAt?: string
  compact?: boolean
}

// ============================================
// HELPER COMPONENTS
// ============================================

const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  linkedin: Linkedin,
  twitter: Twitter,
  instagram: Instagram,
  github: Github,
  email: Mail,
  hackernews: FileText,
  facebook: MessageSquare,
  blog: FileText,
  internal_docs: FileText,
}

function PlatformBadge({ platform, priority }: { platform: string; priority: string }) {
  const Icon = PLATFORM_ICONS[platform.toLowerCase()] || FileText
  
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border",
        priority === "primary" && "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
        priority === "secondary" && "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
        priority === "avoid" && "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
      )}
    >
      <Icon className={cn(
        "h-4 w-4",
        priority === "primary" && "text-green-600",
        priority === "secondary" && "text-blue-600",
        priority === "avoid" && "text-red-500"
      )} />
      <span className="font-medium capitalize">{platform.replace("_", " ")}</span>
      {priority === "primary" && <Check className="h-3 w-3 text-green-600" />}
      {priority === "avoid" && <X className="h-3 w-3 text-red-500" />}
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function StrategyDisplay({ 
  productId, 
  productName, 
  strategy, 
  generatedAt,
  compact = false 
}: StrategyDisplayProps) {
  const [showReasoning, setShowReasoning] = useState(false)
  const queryClient = useQueryClient()

  const regenerate = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/products/${productId}/strategy`, {
        method: "POST",
      })
      if (!res.ok) throw new Error("Failed to regenerate strategy")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", productId] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
  })

  const primaryPlatforms = strategy.platforms.filter(p => p.priority === "primary")
  const secondaryPlatforms = strategy.platforms.filter(p => p.priority === "secondary")
  const avoidPlatforms = strategy.platforms.filter(p => p.priority === "avoid")

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">Marketing Strategy</CardTitle>
              <CardDescription className="mt-1">{productName}</CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {Math.round(strategy.confidence * 100)}% confidence
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary */}
          <p className="text-sm leading-relaxed">{strategy.summary}</p>

          {/* Key Platforms */}
          <div className="flex flex-wrap gap-2">
            {primaryPlatforms.slice(0, 3).map(p => (
              <PlatformBadge key={p.platform} platform={p.platform} priority={p.priority} />
            ))}
          </div>

          {/* Cadence */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{strategy.cadence.frequency}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Strategy Summary */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-medium leading-relaxed">{strategy.summary}</p>
              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <Badge variant="outline">
                  {Math.round(strategy.confidence * 100)}% confidence
                </Badge>
                {generatedAt && (
                  <span>Generated {new Date(generatedAt).toLocaleDateString()}</span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => regenerate.mutate()}
                  disabled={regenerate.isPending}
                  className="ml-auto"
                >
                  {regenerate.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="ml-2">Regenerate</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Platforms to Use */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              Use These Platforms
            </CardTitle>
            <CardDescription>Focus your efforts here</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {primaryPlatforms.map(p => (
              <div key={p.platform} className="space-y-1">
                <PlatformBadge platform={p.platform} priority={p.priority} />
                <p className="text-sm text-muted-foreground pl-1">{p.reasoning}</p>
              </div>
            ))}
            {secondaryPlatforms.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-2">SECONDARY</p>
                {secondaryPlatforms.map(p => (
                  <div key={p.platform} className="space-y-1 mb-3">
                    <PlatformBadge platform={p.platform} priority={p.priority} />
                    <p className="text-sm text-muted-foreground pl-1">{p.reasoning}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* What NOT to Do */}
        <Card className="border-red-100 dark:border-red-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <X className="h-5 w-5" />
              Skip These
            </CardTitle>
            <CardDescription>Save your energy - these won't work for your product</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {avoidPlatforms.map(p => (
              <div key={p.platform} className="space-y-1">
                <PlatformBadge platform={p.platform} priority={p.priority} />
                <p className="text-sm text-muted-foreground pl-1">{p.reasoning}</p>
              </div>
            ))}
            {strategy.antiPatterns.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-2">ANTI-PATTERNS</p>
                {strategy.antiPatterns.map((ap, i) => (
                  <div key={i} className="flex items-start gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{ap.pattern}</p>
                      <p className="text-sm text-muted-foreground">{ap.reasoning}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Content & Tone */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Tone */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tone & Voice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Badge variant="secondary" className="text-sm">{strategy.tone.style}</Badge>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">EXAMPLES</p>
              <ul className="text-sm space-y-1">
                {strategy.tone.examples.slice(0, 3).map((ex, i) => (
                  <li key={i} className="text-muted-foreground italic">"{ex}"</li>
                ))}
              </ul>
            </div>
            {strategy.tone.avoid.length > 0 && (
              <div>
                <p className="text-xs font-medium text-red-600 mb-1">AVOID</p>
                <div className="flex flex-wrap gap-1">
                  {strategy.tone.avoid.map((a, i) => (
                    <Badge key={i} variant="outline" className="text-xs text-red-600 border-red-200">
                      {a}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cadence */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Posting Cadence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{strategy.cadence.postsPerWeek}</div>
            <div className="text-sm text-muted-foreground">posts per week</div>
            <p className="text-sm mt-3">{strategy.cadence.frequency}</p>
            <p className="text-xs text-muted-foreground mt-2">{strategy.cadence.reasoning}</p>
          </CardContent>
        </Card>

        {/* Proof Types */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What Builds Trust</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {strategy.proofTypes.map((proof, i) => (
                <Badge key={i} variant="outline">{proof}</Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Use these types of proof in your content to build credibility with your audience.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Full Reasoning (Expandable) */}
      <Card>
        <CardHeader 
          className="cursor-pointer" 
          onClick={() => setShowReasoning(!showReasoning)}
        >
          <CardTitle className="text-base flex items-center justify-between">
            Why These Recommendations?
            <Button variant="ghost" size="sm">
              {showReasoning ? "Hide" : "Show"}
            </Button>
          </CardTitle>
        </CardHeader>
        {showReasoning && (
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {strategy.reasoning}
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
