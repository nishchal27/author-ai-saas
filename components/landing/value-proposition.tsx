"use client"

import { Check, X, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const productExamples = [
  {
    product: "B2B SaaS for Developers",
    recommendations: [
      { text: "Twitter/X + GitHub", good: true },
      { text: "Technical build logs", good: true },
      { text: "LinkedIn sales posts", good: false },
      { text: "Motivational content", good: false },
    ],
    summary: "Developers trust competence, not persuasion.",
  },
  {
    product: "Online Course for Learners",
    recommendations: [
      { text: "Twitter threads + Blog", good: true },
      { text: "Teaching mini-lessons", good: true },
      { text: "Corporate language", good: false },
      { text: "Aggressive sales CTAs", good: false },
    ],
    summary: "Authority is built by teaching, not selling.",
  },
  {
    product: "D2C Physical Product",
    recommendations: [
      { text: "Instagram + Facebook", good: true },
      { text: "Lifestyle videos", good: true },
      { text: "Long text explanations", good: false },
      { text: "LinkedIn presence", good: false },
    ],
    summary: "Visual desire drives conversion.",
  },
]

export function ValueProposition() {
  return (
    <section className="py-20 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            The product determines the strategy
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Different products need completely different approaches. 
            AuthorAI figures out what works for yours.
          </p>
        </div>

        {/* Product Examples */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          {productExamples.map((example, index) => (
            <Card
              key={example.product}
              className="border hover:shadow-lg transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{example.product}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {example.recommendations.map((rec, i) => (
                    <div 
                      key={i} 
                      className={`flex items-center gap-2 text-sm ${rec.good ? "" : "line-through text-muted-foreground"}`}
                    >
                      {rec.good ? (
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-red-500 flex-shrink-0" />
                      )}
                      <span>{rec.text}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground pt-2 border-t italic">
                  {example.summary}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Core Value */}
        <div className="max-w-3xl mx-auto">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">
                Reduce decision fatigue. Get clarity.
              </h3>
              <div className="grid sm:grid-cols-3 gap-6 text-left">
                <div>
                  <div className="font-semibold mb-1">Confidence</div>
                  <p className="text-sm text-muted-foreground">
                    Know your marketing plan is right for your specific product.
                  </p>
                </div>
                <div>
                  <div className="font-semibold mb-1">Focus</div>
                  <p className="text-sm text-muted-foreground">
                    Stop spreading effort across platforms that won't work.
                  </p>
                </div>
                <div>
                  <div className="font-semibold mb-1">Structure</div>
                  <p className="text-sm text-muted-foreground">
                    Marketing feels intentional and manageable, not chaotic.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
