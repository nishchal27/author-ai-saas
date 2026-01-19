"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Linkedin, Twitter, Instagram, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

interface ContentPreviewProps {
  content: string
  platform?: "linkedin" | "twitter" | "instagram" | "blog"
  title?: string
  imageUrl?: string
  className?: string
}

const platformIcons = {
  linkedin: Linkedin,
  twitter: Twitter,
  instagram: Instagram,
  blog: FileText,
}

const platformColors = {
  linkedin: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
  twitter: "bg-sky-50 border-sky-200 dark:bg-sky-950 dark:border-sky-800",
  instagram: "bg-pink-50 border-pink-200 dark:bg-pink-950 dark:border-pink-800",
  blog: "bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800",
}

export function ContentPreview({
  content,
  platform,
  title,
  imageUrl,
  className,
}: ContentPreviewProps) {
  const Icon = platform ? platformIcons[platform] : FileText
  const platformColor = platform ? platformColors[platform] : ""

  const characterCount = content.length
  const isTwitter = platform === "twitter"
  const isOverLimit = isTwitter && characterCount > 280

  return (
    <Card className={cn(platformColor, className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            <CardTitle className="text-lg">
              {platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : "Preview"}
            </CardTitle>
          </div>
          {isTwitter && (
            <Badge variant={isOverLimit ? "destructive" : "secondary"}>
              {characterCount}/280
            </Badge>
          )}
        </div>
        <CardDescription>
          {platform === "linkedin" && "Professional, thoughtful content"}
          {platform === "twitter" && "Concise, engaging post"}
          {platform === "instagram" && "Visual-first content"}
          {platform === "blog" && "In-depth article"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {title && (
          <h3 className="text-xl font-semibold">{title}</h3>
        )}
        {imageUrl && (
          <div className="rounded-lg overflow-hidden border">
            <img
              src={imageUrl}
              alt="Preview"
              className="w-full h-auto"
            />
          </div>
        )}
        <div className={cn(
          "prose prose-sm max-w-none",
          platform === "twitter" && "text-sm leading-relaxed",
          platform === "linkedin" && "text-base leading-relaxed",
          platform === "instagram" && "text-base leading-relaxed",
          platform === "blog" && "prose-lg"
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
