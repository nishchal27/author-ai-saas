import OpenAI from "openai"

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set")
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface VisualContext {
  productName?: string
  audience?: string
  audienceDetail?: string
}

/**
 * Generate visual/image using DALL·E.
 * When productContext is provided, the prompt is prefixed so the image supports the story.
 */
export async function generateVisual(
  prompt: string,
  style?: string,
  productContext?: VisualContext
): Promise<string> {
  const audiencePart = productContext?.audienceDetail
    ? `${productContext.audience || "professional"} (${productContext.audienceDetail})`
    : (productContext?.audience || "professional")
  const prefix = productContext?.productName
    ? `For ${productContext.productName}, audience: ${audiencePart}. `
    : ""
  const fullPrompt = [
    prefix + prompt,
    style ? `Style: ${style}.` : "",
    "Professional, credible, minimalistic. No text overlays.",
  ]
    .filter(Boolean)
    .join(" ")

  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: fullPrompt,
    n: 1,
    size: "1024x1024",
    quality: "standard",
  })

  const imageUrl = response.data[0]?.url
  if (!imageUrl) {
    throw new Error("Failed to generate image")
  }

  return imageUrl
}
