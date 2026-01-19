"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"

export function CTASection() {
  return (
    <section className="py-20 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-8 animate-fade-in">
            <Sparkles className="h-4 w-4 text-white" />
            <span className="text-sm font-medium text-white">
              Ready to Get Started?
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 animate-slide-up">
            Turn Your Real Work Into
            <br />
            <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              Marketing Content
            </span>
          </h2>

          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto animate-slide-up">
            Join founders who are building visibility without the marketing
            stress. No expertise needed, just your real work.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-scale-in">
            <Button
              size="lg"
              variant="secondary"
              asChild
              className="group bg-white text-primary hover:bg-white/90"
            >
              <Link href="/sign-up">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-white/30 text-white hover:bg-white/10 hover:border-white/50"
            >
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </div>

          <p className="mt-8 text-sm text-white/80 animate-fade-in">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  )
}
