import OpenAI from "openai"

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set")
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Generate visual/image using DALL·E
 */
export async function generateVisual(prompt: string, style?: string): Promise<string> {
  const fullPrompt = style
    ? `${prompt}. Style: ${style}. Professional, clean, minimalistic design. No text overlays.`
    : `${prompt}. Professional, clean, minimalistic design. No text overlays.`

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
