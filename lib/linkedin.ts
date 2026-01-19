/**
 * LinkedIn API integration for publishing posts
 */

export interface LinkedInPost {
  author: string // Person URN
  lifecycleState: "PUBLISHED"
  specificContent: {
    "com.linkedin.ugc.ShareContent": {
      shareCommentary: {
        text: string
      }
      shareMediaCategory: "NONE" | "ARTICLE" | "IMAGE"
      media?: Array<{
        status: "READY"
        description?: {
          text: string
        }
        media: string // Image URN
        title?: {
          text: string
        }
      }>
    }
  }
  visibility: {
    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" | "CONNECTIONS"
  }
}

/**
 * Upload image to LinkedIn and get URN
 */
async function uploadLinkedInImage(
  accessToken: string,
  imageUrl: string
): Promise<string> {
  // Download image
  const imageResponse = await fetch(imageUrl)
  if (!imageResponse.ok) {
    throw new Error("Failed to download image")
  }
  const imageBuffer = await imageResponse.arrayBuffer()

  // Step 1: Register upload
  const registerResponse = await fetch(
    "https://api.linkedin.com/v2/assets?action=registerUpload",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
          owner: "urn:li:organization:YOUR_ORG_ID", // This needs to be set per user
          serviceRelationships: [
            {
              relationshipType: "OWNER",
              identifier: "urn:li:userGeneratedContent",
            },
          ],
        },
      }),
    }
  )

  if (!registerResponse.ok) {
    // If organization upload fails, try without image
    throw new Error("LinkedIn image upload not configured. Publishing without image.")
  }

  const registerData = await registerResponse.json()
  const uploadUrl = registerData.value.uploadMechanism[
    "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
  ].uploadUrl
  const asset = registerData.value.asset

  // Step 2: Upload image
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "image/jpeg",
    },
    body: imageBuffer,
  })

  if (!uploadResponse.ok) {
    throw new Error("Failed to upload image to LinkedIn")
  }

  return asset
}

/**
 * Publish a post to LinkedIn
 */
export async function publishToLinkedIn(
  accessToken: string,
  content: string,
  imageUrl?: string
): Promise<{ id: string }> {
  let imageUrn: string | undefined

  if (imageUrl) {
    try {
      imageUrn = await uploadLinkedInImage(accessToken, imageUrl)
    } catch (error: any) {
      // Log error but continue without image
      console.warn("LinkedIn image upload failed:", error.message)
      // Continue without image
    }
  }

  // Get user's LinkedIn person URN
  const profileResponse = await fetch(
    "https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName)",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!profileResponse.ok) {
    throw new Error("Failed to fetch LinkedIn profile")
  }

  const profile = await profileResponse.json()
  const personUrn = `urn:li:person:${profile.id}`

  // Create the post
  const postData: LinkedInPost = {
    author: personUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: {
          text: content,
        },
        shareMediaCategory: imageUrn ? "IMAGE" : "NONE",
        ...(imageUrn && {
          media: [
            {
              status: "READY",
              media: imageUrn,
            },
          ],
        }),
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  }

  const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(postData),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`LinkedIn API error: ${error}`)
  }

  const result = await response.json()
  return { id: result.id }
}

/**
 * Get LinkedIn post analytics
 */
export async function getLinkedInAnalytics(
  accessToken: string,
  postUrn: string
): Promise<{
  views: number
  likes: number
  comments: number
  shares: number
}> {
  // LinkedIn analytics require specific permissions
  // This is a simplified version
  const response = await fetch(
    `https://api.linkedin.com/v2/socialActions/${postUrn}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    // Return defaults if analytics not available
    return {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
    }
  }

  const data = await response.json()
  return {
    views: data.views || 0,
    likes: data.likes || 0,
    comments: data.comments || 0,
    shares: data.shares || 0,
  }
}
