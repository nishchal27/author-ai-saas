import { describe, expect, it } from "vitest"
import { extractJsonObject, parseAndValidate } from "@/lib/ai/parse"
import { runDeterministicChecks } from "@/lib/ai/quality"
import { contentReviewSchema } from "@/lib/ai/schemas/review"
import { AiOrchestrationError } from "@/lib/ai/types"

describe("structured output parsing", () => {
  it("parses fenced json", () => {
    const raw = 'Here you go:\n```json\n{"score":0.9,"note":"Good"}\n```'
    expect(extractJsonObject(raw)).toEqual({ score: 0.9, note: "Good" })
  })

  it("parses json embedded in prose via balanced braces", () => {
    const raw = 'Result: {"score":0.7,"note":"Ok"} thanks'
    expect(extractJsonObject(raw)).toEqual({ score: 0.7, note: "Ok" })
  })

  it("fails on malformed json", () => {
    expect(() => extractJsonObject("not json at all")).toThrow(AiOrchestrationError)
  })

  it("validates with zod and reports failures", () => {
    expect(() =>
      parseAndValidate('{"score":2,"note":""}', contentReviewSchema, {
        task: "content.review",
      })
    ).toThrow(AiOrchestrationError)
  })

  it("accepts valid review schema", () => {
    const data = parseAndValidate(
      '{"score":0.8,"note":"Fits LinkedIn"}',
      contentReviewSchema
    )
    expect(data.score).toBe(0.8)
  })
})

describe("deterministic quality checks", () => {
  it("fails empty output", () => {
    const result = runDeterministicChecks({ text: "" })
    expect(result.passed).toBe(false)
  })

  it("flags prohibited claim language but can still pass soft notes", () => {
    const result = runDeterministicChecks({
      text: "Our product is guaranteed to deliver 100% results for every customer every time with clear value.",
    })
    expect(result.notes.some((n) => n.toLowerCase().includes("prohibited"))).toBe(true)
  })

  it("passes a normal draft", () => {
    const result = runDeterministicChecks({
      text: "We shipped a simpler onboarding flow this week. Here is what changed and why it matters for founders.",
      platform: "linkedin",
    })
    expect(result.passed).toBe(true)
  })
})
