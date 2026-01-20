"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Check, X, Image as ImageIcon, Calendar, AlertTriangle, Package, Target } from "lucide-react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { useState, useMemo } from "react"
import { EmptyContent } from "@/components/empty-states/empty-content"
import { useToast } from "@/hooks/use-toast"
import { ContentPreview } from "@/components/content-preview"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchFilter } from "@/components/search-filter"
import { ContentSkeleton } from "@/components/loading/content-skeleton"

async function fetchDrafts() {
  const res = await fetch("/api/content/drafts")
  if (!res.ok) throw new Error("Failed to fetch drafts")
  return res.json()
}

async function fetchProducts() {
  const res = await fetch("/api/products")
  if (!res.ok) throw new Error("Failed to fetch products")
  return res.json()
}

// Check if platform aligns with strategy
function getPlatformAlignment(platform: string | null, strategy: any) {
  if (!platform || !strategy) return null
  
  try {
    const platforms = JSON.parse(strategy.platforms || "[]")
    const platformRec = platforms.find(
      (p: any) => p.platform.toLowerCase() === platform.toLowerCase()
    )
    
    if (!platformRec) return null
    
    return {
      priority: platformRec.priority,
      reasoning: platformRec.reasoning,
    }
  } catch {
    return null
  }
}

async function updateDraft(id: string, data: { content?: string; status?: string }) {
  const res = await fetch(`/api/content/drafts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to update draft")
  return res.json()
}

async function generateVisual(draftId: string) {
  const res = await fetch("/api/visuals/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ draftId }),
  })
  if (!res.ok) throw new Error("Failed to generate visual")
  return res.json()
}

export default function ContentPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  
  const { data, isLoading } = useQuery({
    queryKey: ["drafts"],
    queryFn: fetchDrafts,
  })

  const { data: productsData } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  })

  // Build a map of productId -> strategy for quick lookups
  const productStrategyMap = useMemo(() => {
    const map: Record<string, any> = {}
    productsData?.products?.forEach((p: any) => {
      if (p.strategy) {
        map[p.id] = p.strategy
      }
    })
    return map
  }, [productsData])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateDraft(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] })
      setEditingId(null)
      toast({
        title: "Draft updated",
        description: "Your changes have been saved.",
        variant: "success",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update draft",
        variant: "destructive",
      })
    },
  })

  const visualMutation = useMutation({
    mutationFn: generateVisual,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] })
      toast({
        title: "Visual generated",
        description: "Your visual has been created.",
        variant: "success",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate visual",
        variant: "destructive",
      })
    },
  })

  const allDrafts = data?.drafts || []

  const filteredDrafts = useMemo(() => {
    return allDrafts.filter((draft: any) => {
      const matchesSearch =
        !searchQuery ||
        draft.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        draft.content.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesFilter =
        statusFilter === "all" ||
        draft.status === statusFilter

      return matchesSearch && matchesFilter
    })
  }, [allDrafts, searchQuery, statusFilter])

  const handleEdit = (draft: any) => {
    setEditingId(draft.id)
    setEditContent(draft.content)
  }

  const handleSave = (id: string) => {
    updateMutation.mutate({
      id,
      data: { content: editContent },
    })
  }

  const handleApprove = (id: string) => {
    updateMutation.mutate({
      id,
      data: { status: "approved" },
    })
    toast({
      title: "Draft approved",
      description: "You can now schedule this content.",
      variant: "success",
    })
  }

  const handleReject = (id: string) => {
    updateMutation.mutate({
      id,
      data: { status: "rejected" },
    })
    toast({
      title: "Draft rejected",
      description: "The draft has been marked as rejected.",
    })
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Content Drafts</h1>
        <p className="text-muted-foreground mt-2">
          Review and approve your generated content
        </p>
      </div>

      <div className="mb-6">
        <SearchFilter
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          filterValue={statusFilter}
          onFilterChange={setStatusFilter}
          filterOptions={[
            { value: "draft", label: "Draft" },
            { value: "approved", label: "Approved" },
            { value: "scheduled", label: "Scheduled" },
            { value: "published", label: "Published" },
            { value: "rejected", label: "Rejected" },
          ]}
          placeholder="Search content..."
        />
      </div>

      {isLoading ? (
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <ContentSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredDrafts.map((draft: any) => {
            // Get strategy alignment for this draft
            const strategy = draft.productId ? productStrategyMap[draft.productId] : null
            const alignment = getPlatformAlignment(draft.platform, strategy)
            const isAvoidPlatform = alignment?.priority === "avoid"
            const product = productsData?.products?.find((p: any) => p.id === draft.productId)

            return (
            <Card key={draft.id} className={isAvoidPlatform ? "border-amber-200 dark:border-amber-800" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle>
                      {draft.title || `${draft.type} for ${draft.platform || "general"}`}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      {format(new Date(draft.createdAt), "MMM d, yyyy")}
                      {product && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {product.name}
                          </span>
                        </>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {draft.platform && (
                      <Badge 
                        variant={isAvoidPlatform ? "destructive" : alignment?.priority === "primary" ? "default" : "outline"}
                      >
                        {draft.platform}
                      </Badge>
                    )}
                    <Badge variant="outline">{draft.type}</Badge>
                    <Badge variant={draft.status === "approved" ? "default" : "secondary"}>
                      {draft.status}
                    </Badge>
                  </div>
                </div>
                {/* Strategy Alignment Warning */}
                {isAvoidPlatform && (
                  <div className="mt-3 p-3 rounded-md bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <span className="font-medium text-amber-800 dark:text-amber-200">
                          Platform not recommended for {product?.name}
                        </span>
                        <p className="text-amber-700 dark:text-amber-300 mt-1">
                          {alignment?.reasoning}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {editingId === draft.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={8}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSave(draft.id)}
                        disabled={updateMutation.isPending}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Tabs defaultValue="preview" className="w-full">
                      <TabsList>
                        <TabsTrigger value="preview">Preview</TabsTrigger>
                        <TabsTrigger value="raw">Raw Content</TabsTrigger>
                      </TabsList>
                      <TabsContent value="preview" className="mt-4">
                        <ContentPreview
                          content={draft.content}
                          platform={draft.platform as any}
                          title={draft.title || undefined}
                          imageUrl={draft.visualUrl || undefined}
                        />
                      </TabsContent>
                      <TabsContent value="raw" className="mt-4">
                        <div className="prose prose-sm max-w-none">
                          <p className="whitespace-pre-wrap">{draft.content}</p>
                        </div>
                      </TabsContent>
                    </Tabs>
                    {draft.cta && (
                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm font-medium">CTA: {draft.cta}</p>
                      </div>
                    )}
                    {draft.visualUrl && (
                      <div>
                        <img
                          src={draft.visualUrl}
                          alt="Generated visual"
                          className="rounded-md border"
                        />
                      </div>
                    )}
                    {draft.visualPrompt && !draft.visualUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => visualMutation.mutate(draft.id)}
                        disabled={visualMutation.isPending}
                      >
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Generate Visual
                      </Button>
                    )}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(draft)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      {draft.status === "draft" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(draft.id)}
                            disabled={updateMutation.isPending}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(draft.id)}
                            disabled={updateMutation.isPending}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                        </>
                      )}
                      {draft.status === "approved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push("/dashboard/calendar")}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          Schedule
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            )
          })}
          {filteredDrafts.length === 0 && allDrafts.length === 0 && <EmptyContent />}
          {filteredDrafts.length === 0 && allDrafts.length > 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No drafts match your filters</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery("")
                    setStatusFilter("all")
                  }}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
