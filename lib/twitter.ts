/**
 * Twitter/X API integration for publishing posts
 */

export interface TwitterPost {
  text: string
  media?: {
    media_ids?: string[]
  }
}

/**
 * Upload media to Twitter
 */
export async function uploadTwitterMedia(
  accessToken: string,
  imageUrl: string
): Promise<string> {
  // Download image
  const imageResponse = await fetch(imageUrl)
  const imageBuffer = await imageResponse.arrayBuffer()

  // Upload to Twitter
  const formData = new FormData()
  const blob = new Blob([imageBuffer])
  formData.append("media", blob)

  const response = await fetch(
    "https://upload.twitter.com/1.1/media/upload.json",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    }
  )

  if (!response.ok) {
    throw new Error("Failed to upload media to Twitter")
  }

  const data = await response.json()
  return data.media_id_string
}

/**
 * Publish a post to Twitter/X
 */
export async function publishToTwitter(
  accessToken: string,
  content: string,
  imageUrl?: string
): Promise<{ id: string }> {
  let mediaId: string | undefined

  if (imageUrl) {
    mediaId = await uploadTwitterMedia(accessToken, imageUrl)
  }

  const postData: TwitterPost = {
    text: content.substring(0, 280), // Twitter character limit
    ...(mediaId && {
      media: {
        media_ids: [mediaId],
      },
    }),
  }

  const response = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postData),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Twitter API error: ${error}`)
  }

  const result = await response.json()
  return { id: result.data.id }
}

/**
 * Get Twitter post analytics
 */
export async function getTwitterAnalytics(
  accessToken: string,
  tweetId: string
): Promise<{
  views: number
  likes: number
  comments: number
  shares: number
}> {
  const response = await fetch(
    `https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=public_metrics`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    return {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
    }
  }

  const data = await response.json()
  const metrics = data.data?.public_metrics || {}

  return {
    views: metrics.impression_count || 0,
    likes: metrics.like_count || 0,
    comments: metrics.reply_count || 0,
    shares: metrics.retweet_count || 0,
  }
}
