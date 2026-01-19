"use client"

import {
  Activity,
  Brain,
  FileText,
  Image,
  Calendar,
  BarChart3,
  Shield,
  Zap,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    icon: Activity,
    title: "Track Real Activity",
    description:
      "Connect GitHub or add activities manually. Every commit, PR, and update becomes a content opportunity.",
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950",
  },
  {
    icon: Brain,
    title: "AI-Powered Insights",
    description:
      "Claude extracts meaningful insights from your work. Problem → Solution framing that resonates with your audience.",
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950",
  },
  {
    icon: FileText,
    title: "Multi-Format Content",
    description:
      "Generate posts, blogs, threads, and carousels. Platform-optimized for LinkedIn, Twitter, Instagram, and blogs.",
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950",
  },
  {
    icon: Image,
    title: "Visual Generation",
    description:
      "DALL·E creates brand-aligned visuals and infographics. No design skills needed.",
    color: "text-pink-600",
    bgColor: "bg-pink-50 dark:bg-pink-950",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description:
      "Schedule content across platforms. Automated publishing when you approve it.",
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950",
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    description:
      "Track views, engagement, and reach. Understand what resonates with your audience.",
    color: "text-teal-600",
    bgColor: "bg-teal-50 dark:bg-teal-950",
  },
  {
    icon: Shield,
    title: "Human Control",
    description:
      "Every piece of content requires your approval. No surprises, no fake automation.",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-950",
  },
  {
    icon: Zap,
    title: "Brand Consistency",
    description:
      "Your brand voice, colors, and style maintained across all generated content.",
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950",
  },
]

export function Features() {
  return (
    <section id="features" className="py-20 lg:py-32 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Build Visibility
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A complete system that turns your real work into marketing content
            without the marketing stress.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card
                key={feature.title}
                className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader>
                  <div
                    className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}
                  >
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
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
