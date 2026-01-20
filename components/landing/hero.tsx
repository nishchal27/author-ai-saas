"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Target, Compass, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      {/* Background - More subtle, professional */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.05),transparent_40%)]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          {/* Badge - Calm, not hype */}
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-8 animate-slide-up">
            <Target className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Product-aware marketing intelligence
            </span>
          </div>

          {/* Headline - Decision-focused */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 animate-slide-up text-foreground">
            Know exactly what marketing
            <br />
            <span className="text-primary">your product needs</span>
          </h1>

          {/* Subheadline - Value proposition */}
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed animate-slide-up">
            Tell us about your product. We'll tell you which platforms to use, 
            what content to create, and what to skip entirely.
            <span className="block mt-2 font-medium text-foreground">
              Less guessing. More clarity.
            </span>
          </p>

          {/* CTA Buttons - Simple, direct */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-scale-in">
            <Button size="lg" asChild className="group w-full sm:w-auto">
              <Link href="/sign-up">
                Add Your Product
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

          {/* Trust Indicators - Focus on outcomes */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground animate-fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Know what TO do</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Know what NOT to do</span>
            </div>
            <div className="flex items-center space-x-2">
              <Compass className="h-4 w-4 text-primary" />
              <span>Strategy explained, not magic</span>
            </div>
          </div>
        </div>

        {/* Hero Visual - Strategy Preview */}
        <div className="mt-16 max-w-4xl mx-auto animate-slide-up">
          <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl">
            {/* Simulated Strategy Output */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Strategy generated for "Acme Analytics"
              </div>
              
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-lg font-medium">
                  "Because you are building a B2B SaaS for developers, we recommend focusing on 
                  <span className="text-primary"> Twitter/X</span> and 
                  <span className="text-primary"> GitHub</span> with technical, low-hype content. 
                  <span className="text-red-600"> Skip LinkedIn sales posts</span> — developers trust competence, not persuasion."
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Twitter/X
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  GitHub
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm line-through">
                  LinkedIn sales
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm line-through">
                  Instagram
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
