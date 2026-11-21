"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { PRODUCT_NAME } from "@/lib/constants"

export function CTASection() {
  return (
    <section id="get-started" className="py-20 lg:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-slate-50 px-6 py-12 text-center sm:px-10">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Create your first brand and start organizing
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Sign up, add your brand, and open Brand Studio. You can capture pillars and
            ideas manually — AI features work when a provider is configured.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/sign-up">
                Start free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Open beta · No credit card required · {PRODUCT_NAME} does not auto-publish for you
          </p>
        </div>
      </div>
    </section>
  )
}
