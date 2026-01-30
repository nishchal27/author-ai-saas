"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Linkedin, Twitter, FileText, Facebook } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SupportedPlatform } from "@/lib/constants"

interface ContentPreviewProps {
  content: string
  platform?: SupportedPlatform | string
  title?: string
  className?: string
}

const platformIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  linkedin: Linkedin,
  twitter: Twitter,
  blog: FileText,
  facebook: Facebook,
}

const platformColors: Record<string, string> = {
  linkedin: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
  twitter: "bg-sky-50 border-sky-200 dark:bg-sky-950 dark:border-sky-800",
  blog: "bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800",
  facebook: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
}

export function ContentPreview({
  content,
  platform,
  title,
  className,
}: ContentPreviewProps) {
  const platformKey = platform?.toLowerCase?.() ?? ""
  const Icon = platformKey ? (platformIcons[platformKey] ?? FileText) : FileText
  const platformColor = platformKey ? (platformColors[platformKey] ?? "") : ""

  const characterCount = content.length
  const isTwitter = platformKey === "twitter"
  const isOverLimit = isTwitter && characterCount > 280

  return (
    <Card className={cn(platformColor, className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            <CardTitle className="text-lg">
              {platformKey ? platformKey.charAt(0).toUpperCase() + platformKey.slice(1) : "Preview"}
            </CardTitle>
          </div>
          {isTwitter && (
            <Badge variant={isOverLimit ? "destructive" : "secondary"}>
              {characterCount}/280
            </Badge>
          )}
        </div>
        <CardDescription>
          {platformKey === "linkedin" && "Professional, thoughtful content"}
          {platformKey === "twitter" && "Concise, engaging post"}
          {platformKey === "blog" && "In-depth article"}
          {platformKey === "facebook" && "Community-oriented, shareable content"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {title && (
          <h3 className="text-xl font-semibold">{title}</h3>
        )}
        <div className={cn(
          "prose prose-sm max-w-none",
          platformKey === "twitter" && "text-sm leading-relaxed",
          platformKey === "linkedin" && "text-base leading-relaxed",
          platformKey === "blog" && "prose-lg",
          platformKey === "facebook" && "text-base leading-relaxed"
        )}>
          <div className="whitespace-pre-wrap break-words">{content}</div>
        </div>
        {isOverLimit && (
          <p className="text-sm text-destructive">
            Content exceeds Twitter's 280 character limit. Please shorten it.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
