# Varabhi AI model configuration

Model IDs are centralized in `lib/ai/models.ts` and selected per task in `lib/ai/registry.ts`.

## How models are maintained

1. **Do not hardcode model IDs in routes or domain modules.**
2. Change defaults in `MODEL_CATALOG` or override with env vars.
3. Re-check Anthropic / OpenAI / OpenRouter docs before beta.

## Verified defaults (as of 2026-11)

| Provider | Role | Default ID | Source |
|----------|------|------------|--------|
| Anthropic | standard | `claude-sonnet-5-5` | Anthropic models overview (active) |
| Anthropic | premium | `claude-opus-5-5` | Anthropic models overview (active) |
| Anthropic | fast/review | `claude-haiku-4-5-20251001` | Anthropic models overview (active) |
| OpenAI | default | `gpt-4o` | Existing repo usage + OpenAI Chat Completions |
| OpenAI | fast | `gpt-4o-mini` | OpenAI Chat Completions |
| OpenRouter | default | `anthropic/claude-sonnet-4.5` | OpenRouter prefixed slug (override if catalog differs) |
| OpenRouter | fast | `openai/gpt-4o-mini` | OpenRouter prefixed slug |

Retired IDs previously hardcoded in this repo (`claude-3-5-sonnet-20241022`, `claude-3-5-opus-20241022`, `claude-3-5-haiku-20241022`) are remapped in the legacy `callAI` shim.

## Environment overrides

- `AI_MODEL_ANTHROPIC_STANDARD`
- `AI_MODEL_ANTHROPIC_PREMIUM`
- `AI_MODEL_ANTHROPIC_FAST`
- `AI_MODEL_OPENAI_DEFAULT`
- `AI_MODEL_OPENAI_FAST`
- `AI_MODEL_OPENROUTER_DEFAULT`
- `AI_MODEL_OPENROUTER_FAST`

## Provider credentials

- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `OPENROUTER_API_KEY` (optional)
- `OPENROUTER_APP_TITLE` (optional attribution)
- `NEXT_PUBLIC_APP_URL` (optional OpenRouter HTTP-Referer)
