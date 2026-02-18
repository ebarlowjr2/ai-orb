# AI Consortanist

This is a Next.js AI Orb that supports typed chat, browser voice input (Chrome/Edge), and speech synthesis for spoken replies. The UI centers a glowing animated orb with clear states (idle, listening, thinking, speaking, error).

## Default Topic Guardrails

The current configuration is built to answer questions around a specific topic using the `WEBINAR_TOPIC` environment variable and strict topic guardrails.

To broaden the assistant beyond a single topic, you can:
- Set `STRICT_TOPIC_MODE=false` to disable topic gating.
- Update the system prompt in `lib/guardrails.ts` to allow multiple topics or a broader scope.
- Replace the topic classifier in `lib/guardrails.ts` with a custom policy (for example category allowlists).
- Expand the UI guidance text in `components/Chat.tsx` to reflect your new scope.
- Rename `WEBINAR_TOPIC` to something more general (and update references) if desired.

## Common Uses for AI Orbs

1. Webinar or event Q&A assistant
2. Product demo concierge for prospects
3. Internal enablement or onboarding guide
4. Customer support triage or FAQ helper
5. Interactive brand experience or marketing microsite

## Quick Start

1. Clone this repo
2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

```bash
cp .env.example .env.local
```

Fill in:
- `LLM_API_KEY` (server-side only)
- `WEBINAR_TOPIC` (the topic to lock the assistant to)
- `LLM_MODEL` (defaults to `gpt-4o-mini`)

4. Run locally:

```bash
npm run dev
```

Open http://localhost:3000

## Environment Variables (Required and Optional)

Required:
- `LLM_API_KEY` - Your OpenAI API key (server-side only, never in the browser)
- `WEBINAR_TOPIC` - The topic you want the assistant to enforce

Recommended:
- `LLM_MODEL` - `gpt-4o-mini`

Optional:
- `STRICT_TOPIC_MODE` - `true` or `false` (default `true`)
- `MAX_TURNS_PER_SESSION` - Default `20`
- `MAX_INPUT_CHARS` - Default `1200`
- `MAX_OUTPUT_CHARS` - Default `1200`
- `RATE_LIMIT_PER_MIN` - Default `10`
- `DEMO_ACCESS_CODE` - Reserved (not used yet)

## Voice Requirements
- Speech-to-text uses the Web Speech API and works best in Chrome/Edge.
- Text-to-speech uses `speechSynthesis` and works in major modern browsers.

If speech recognition is not available, the UI falls back to typing only.

## Deploy on Vercel

1. Push the repo to GitHub
2. Import into Vercel
3. Set the same environment variables in Vercel project settings
4. Deploy

## Change the Name

Update these files:
- `components/Chat.tsx` (headline in the hero area)
- `app/layout.tsx` (browser tab title)
- `README.md` (project name and description)

Search for `AI Consortanist` and replace it with your preferred name.

## Guardrails and Safety
- The assistant only answers questions related to `WEBINAR_TOPIC`.
- Off-topic questions receive a refusal plus suggested on-topic prompts.
- Basic in-memory rate limiting is enabled via `RATE_LIMIT_PER_MIN`.
- Message caps are enforced with `MAX_TURNS_PER_SESSION`, `MAX_INPUT_CHARS`, and `MAX_OUTPUT_CHARS`.

For production traffic, replace the in-memory rate limiter with a durable store (for example Upstash Redis).

## Project Structure

- `app/page.tsx` - page layout
- `app/api/chat/route.ts` - LLM API route with guardrails and rate limiting
- `lib/guardrails.ts` - topic classifier and prompt rules
- `lib/rateLimit.ts` - lightweight limiter
- `components/` - orb, chat, mic, transcript UI

## Security Notes
- Never expose API keys in client code.
- Always use `.env.local` for local secrets and Vercel env vars for deploys.
