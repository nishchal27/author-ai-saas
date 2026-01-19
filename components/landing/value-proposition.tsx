"use client"

import { Check, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const comparisons = [
  {
    feature: "Content Source",
    traditional: "Generic templates, AI-generated fluff",
    founderOS: "Your real product activity",
  },
  {
    feature: "Approval Process",
    traditional: "Auto-publish, no control",
    founderOS: "Human approval required",
  },
  {
    feature: "Brand Voice",
    traditional: "Generic, influencer-style",
    founderOS: "Your authentic voice",
  },
  {
    feature: "Metrics",
    traditional: "Fake numbers, vanity metrics",
    founderOS: "Real, honest tracking",
  },
  {
    feature: "Time Investment",
    traditional: "Hours of content creation",
    founderOS: "Minutes of review",
  },
  {
    feature: "Marketing Skills",
    traditional: "Requires expertise",
    founderOS: "Zero marketing knowledge needed",
  },
]

export function ValueProposition() {
  return (
    <section className="py-20 lg:py-32 bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Why{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Founder OS
            </span>
            ?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Built for founders who want visibility without the marketing
            complexity.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <Card className="border-2 shadow-xl animate-scale-in">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
              <CardTitle className="text-2xl text-center">
                Founder OS vs Traditional Marketing Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50 dark:bg-gray-900">
                      <th className="px-6 py-4 text-left font-semibold">
                        Feature
                      </th>
                      <th className="px-6 py-4 text-center font-semibold text-red-600">
                        Traditional Tools
                      </th>
                      <th className="px-6 py-4 text-center font-semibold text-primary">
                        Founder OS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisons.map((comparison, index) => (
                      <tr
                        key={comparison.feature}
                        className="border-b hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors animate-slide-up"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <td className="px-6 py-4 font-medium">
                          {comparison.feature}
                        </td>
                        <td className="px-6 py-4 text-center text-muted-foreground">
                          <div className="flex items-center justify-center space-x-2">
                            <X className="h-4 w-4 text-red-500" />
                            <span>{comparison.traditional}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span className="font-medium">
                              {comparison.founderOS}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Benefits */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              title: "Honest & Credible",
              description:
                "Content derived from real work, not fabricated success stories.",
            },
            {
              title: "Time Efficient",
              description:
                "Turn hours of content creation into minutes of review.",
            },
            {
              title: "Brand Consistent",
              description:
                "Your voice, your style, your brand - maintained across all content.",
            },
          ].map((benefit, index) => (
            <Card
              key={benefit.title}
              className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <CardTitle className="text-xl">{benefit.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
