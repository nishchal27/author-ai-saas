import { beforeEach, describe, expect, it } from "vitest"
import {
  getTaskDefinition,
  getTaskRegistry,
  resetTaskRegistryCache,
  resolveTaskModel,
} from "@/lib/ai/registry"

describe("task registry", () => {
  beforeEach(() => {
    resetTaskRegistryCache()
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.OPENAI_API_KEY
    delete process.env.OPENROUTER_API_KEY
  })

  it("resolves known task ids", () => {
    const def = getTaskDefinition("content.generate")
    expect(def.id).toBe("content.generate")
    expect(def.provider).toBeTruthy()
    expect(def.model).toBeTruthy()
    expect(def.maxOutputTokens).toBeGreaterThan(0)
    expect(def.timeoutMs).toBeGreaterThan(0)
  })

  it("includes all required Phase 1 tasks", () => {
    const registry = getTaskRegistry()
    const required = [
      "brand.summarize",
      "strategy.generate",
      "ideas.generate",
      "content.generate",
      "content.regenerate",
      "content.repurpose",
      "content.review",
      "suggestions.generate",
    ] as const
    for (const id of required) {
      expect(registry[id]).toBeDefined()
    }
  })

  it("selects anthropic when ANTHROPIC_API_KEY is set", () => {
    process.env.ANTHROPIC_API_KEY = "test-key"
    resetTaskRegistryCache()
    expect(getTaskDefinition("strategy.generate").provider).toBe("anthropic")
  })

  it("selects openai when only OPENAI_API_KEY is set", () => {
    process.env.OPENAI_API_KEY = "test-key"
    resetTaskRegistryCache()
    expect(getTaskDefinition("strategy.generate").provider).toBe("openai")
  })

  it("uses premium model for blog content", () => {
    process.env.ANTHROPIC_API_KEY = "test-key"
    resetTaskRegistryCache()
    const standard = resolveTaskModel("content.generate")
    const blog = resolveTaskModel("content.generate", { contentType: "blog" })
    expect(blog).not.toBe(standard)
  })
})
