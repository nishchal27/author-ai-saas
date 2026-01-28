"use client"

import {
  Target,
  Compass,
  XCircle,
  Layers,
  Lightbulb,
  FileText,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    icon: Target,
    title: "Product-First Strategy",
    description:
      "Tell us about your product. We analyze its type, audience, and stage to determine exactly which platforms and content styles will work.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: XCircle,
    title: "Know What to Skip",
    description:
      "Stop wasting effort on platforms that don't fit. We tell you what NOT to do — often the most valuable advice.",
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-950",
  },
  {
    icon: Compass,
    title: "Opinionated Guidance",
    description:
      "Not generic tips. Real recommendations based on your product type. \"Because you're building X, do Y\" — with clear reasoning.",
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950",
  },
  {
    icon: Layers,
    title: "Multi-Product Ready",
    description:
      "Building multiple products? Each gets its own strategy. Different products need different approaches.",
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950",
  },
  {
    icon: Lightbulb,
    title: "Explainable AI",
    description:
      "Every recommendation comes with reasoning. No black-box magic — understand why we suggest what we suggest.",
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950",
  },
  {
    icon: FileText,
    title: "Strategy-Guided Content",
    description:
      "Content generation follows your product's strategy automatically. Get warnings if you use non-recommended platforms. Posts, blogs, and visuals match your tone and avoid anti-patterns.",
    color: "text-teal-600",
    bgColor: "bg-teal-50 dark:bg-teal-950",
  },
]

export function Features() {
  return (
    <section id="features" className="py-20 lg:py-32 bg-slate-50 dark:bg-slate-900/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Marketing decisions,{" "}
            <span className="text-primary">
              not guesswork
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            AuthorAI adapts to YOUR product. Different products need different strategies — we figure out which one fits yours.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card
                key={feature.title}
                className="border hover:border-primary/30 transition-all duration-300 hover:shadow-md animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader>
                  <div
                    className={`w-10 h-10 rounded-lg ${feature.bgColor} flex items-center justify-center mb-3`}
                  >
                    <Icon className={`h-5 w-5 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
