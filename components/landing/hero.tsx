"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, TrendingUp, Zap } from "lucide-react"
import Link from "next/link"

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-slide-up">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Founder-first Marketing System
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 animate-slide-up">
            <span className="bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
              Turn Your Real Work
            </span>
            <br />
            <span className="text-foreground">Into Trust-Building Content</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed animate-slide-up">
            No marketing expertise needed. No fake hype. Just your real product
            activity transformed into credible, conversion-ready content that
            represents you authentically.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-scale-in">
            <Button size="lg" asChild className="group w-full sm:w-auto">
              <Link href="/sign-up">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="w-full sm:w-auto"
            >
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground animate-fade-in">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-accent" />
              <span>No Marketing Skills Required</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              <span>Real Activity → Real Content</span>
            </div>
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <span>Human-Approved Always</span>
            </div>
          </div>
        </div>

        {/* Hero Visual Placeholder */}
        <div className="mt-16 max-w-5xl mx-auto animate-slide-up">
          <div className="relative rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-8 shadow-2xl">
            <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Sparkles className="h-16 w-16 text-primary/30 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  Dashboard Preview
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
