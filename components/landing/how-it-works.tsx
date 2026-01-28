"use client"

import { ArrowRight, Target, GitBranch, Sparkles, FileText, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const steps = [
  {
    number: "01",
    icon: Target,
    title: "Add Your Product & Get Strategy",
    description:
      "Tell us about your product — type, audience, stage. We generate a custom marketing strategy that tells you which platforms to use and what to skip.",
    color: "from-primary to-primary/80",
  },
  {
    number: "02",
    icon: GitBranch,
    title: "Track Your Activity",
    description:
      "Connect GitHub or add activities manually. Every commit, PR, and update is captured and linked to your product.",
    color: "from-blue-500 to-blue-600",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Extract Insights",
    description:
      "AI analyzes your work with your product context. Insights are framed for your specific audience and industry.",
    color: "from-purple-500 to-purple-600",
  },
  {
    number: "04",
    icon: FileText,
    title: "Generate Strategy-Guided Content",
    description:
      "Create posts, blogs, threads, and visuals that follow your product's strategy. Content matches your tone, platforms, and avoids anti-patterns.",
    color: "from-green-500 to-green-600",
  },
  {
    number: "05",
    icon: Calendar,
    title: "Review & Publish",
    description:
      "Review with strategy alignment warnings, edit, and approve. Schedule or publish immediately. Automated publishing handles the rest.",
    color: "from-orange-500 to-orange-600",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Simple, transparent, and founder-friendly. No marketing jargon,
            just real value.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="space-y-8">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div
                  key={step.number}
                  className="flex flex-col md:flex-row items-start gap-6 animate-slide-up"
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  {/* Step Number & Icon */}
                  <div className="flex-shrink-0">
                    <Card className="border-2 border-primary/20">
                      <CardContent className="p-6">
                        <div
                          className={`w-16 h-16 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-3`}
                        >
                          <Icon className="h-8 w-8 text-white" />
                        </div>
                        <div className="text-3xl font-bold text-primary">
                          {step.number}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-2">
                    <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                    <p className="text-lg text-muted-foreground">
                      {step.description}
                    </p>
                  </div>

                  {/* Arrow (hidden on last item) */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:flex items-center justify-center flex-shrink-0 pt-8">
                      <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90 md:rotate-0" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
