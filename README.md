# ScamLens

**Scan. Understand. Verify.**

ScamLens is an investor-safety and financial-content-literacy assistant for Indian retail investors. It helps people understand suspicious messages, screenshots, and public webpages before taking action. It does not provide investment advice or decide with certainty whether content is fraudulent.

## Problem

Retail investors encounter financial claims through WhatsApp, Telegram, Instagram, SMS, email, websites, and forwarded messages. First-time, elderly, regional-language, and Tier-2/Tier-3 users can face pressure tactics, fake authority claims, guaranteed-return promises, and requests for money or sensitive information before they have time to verify the claim.

## Solution

ScamLens turns suspicious content into an explainable safety report:

- extracts individual claims instead of treating a message as one block;
- identifies potential warning signs such as guaranteed returns, urgency, scarcity, authority claims, impersonation, payment requests, and sensitive-information requests;
- explains psychological tactics such as greed, fear, urgency, authority, scarcity, and social proof;
- separates AI interpretation from evidence actually present in the submitted content or retrieved page;
- recommends safer verification steps without telling the user what to buy or sell.

## Features

- Text analysis through a server-side Gemini route when `GEMINI_API_KEY` is configured
- Screenshot upload with preview and multimodal analysis support
- Public URL retrieval with clear inaccessible-page handling
- Individual claim extraction and uncertainty-aware statuses
- Structured potential risk indicators with exact evidence and verification guidance
- Psychological manipulation explanation
- English, Hindi, and Marathi output-language selection
- Five instant Demo Scenario cases that work without an API key
- Privacy-first, no-account core workflow and no intentional persistence of submitted content
- Responsive Bharat-first interface for mobile and desktop

## Architecture

This is one Next.js App Router application:

```text
Browser UI (app/page.tsx)
        |
        v
POST /api/analyze (server-only)
        |
        +-- validate text / image / URL
        +-- retrieve public URL text when requested
        +-- call Gemini with GEMINI_API_KEY when configured
        +-- normalize structured JSON and apply safety guardrails
        +-- return explainable result or understandable error
```

Demo scenarios live in `lib/demos.ts` and never require the API route. `lib/analysis.ts` owns shared result types, limited local fallback checks, and response normalization.

## Technology stack

- Next.js 15
- React 19
- TypeScript
- Node.js runtime API route
- Gemini REST API (optional live analysis)
- Cheerio (small server-side HTML text extraction)
- CSS custom properties and responsive CSS (no large UI framework)

## API setup

Live text, URL, and screenshot analysis uses Gemini only from the server. Create a `.env.local` file from the template and add your key:

```bash
cp .env.example .env.local
# edit .env.local and set GEMINI_API_KEY=...
```

Never put the key in client-side code, commit it, or upload it in a message. If Gemini has a temporary timeout, rate limit, or server error, ScamLens retries once and then returns a clearly labeled limited local safety check for text and URL input instead of failing the whole analysis. If the key is missing, Demo Scenario mode still works and text/URL input shows the same limited local analysis. Screenshot analysis requires a live key.

## Environment variables

- `GEMINI_API_KEY` — optional server-side Gemini API key.
- `GEMINI_MODEL` — optional model name; defaults to `gemini-3.5-flash`.

`.env`, `.env.local`, credentials, tokens, temporary uploads, and build output are ignored by Git.

## Installation

```bash
pnpm install
```

If pnpm is not installed, use Node.js 22+ and enable Corepack:

```bash
corepack enable
corepack prepare pnpm@10.12.4 --activate
pnpm install
```

## Running locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The main judge flow is **Try Demo → Guaranteed Return Investment Message**.

Useful checks:

```bash
pnpm typecheck
pnpm build
```

## Deployment

### Vercel

1. Import this repository into Vercel.
2. Keep the framework preset as Next.js.
3. Add `GEMINI_API_KEY` as a server-side environment variable for the desired environments.
4. Optionally add `GEMINI_MODEL`.
5. Deploy. Demo scenarios work even when the key is absent; live analysis requires the key.

### Managed Webdev

The project is initialized as a managed Webdev project with server capability. Save a checkpoint from the project repository, then use the platform's publish flow. Configure the same environment variables through the platform's protected secret flow rather than committing `.env.local`.

## GitHub

The repository is intentionally compact:

- `app/page.tsx` — landing page, analyzer, demo selector, and results dashboard
- `app/api/analyze/route.ts` — server-only input handling, retrieval, Gemini call, and errors
- `lib/analysis.ts` — types, fallback analysis, normalization, and guardrails
- `lib/demos.ts` — five deterministic Demo Scenario results
- `app/globals.css` — visual system and responsive layout
- `public/manus-routes.json` — page route manifest

No separate frontend/backend repository, ML service, OCR service, database, or account system is required for the core workflow.

## Safety guardrails

ScamLens must not:

- provide BUY, SELL, or HOLD recommendations;
- predict stock prices, investment returns, or investment outcomes;
- recommend financial products, brokers, portfolios, or speculative trading;
- present a fake scam probability or a definitive fraud verdict;
- claim a regulator approved an entity without actual evidence;
- fabricate URLs, sources, or verification results;
- ask users for OTPs, passwords, PINs, bank credentials, card details, or unnecessary sensitive financial information.

The attention level is a communication aid. “Unverified” or “No result found” is not proof of fraud. Important claims should be checked independently using authoritative sources.

## Privacy

Core analysis requires no account. ScamLens does not intentionally store submitted messages or screenshots. Do not upload OTPs, passwords, PINs, bank credentials, card details, or other sensitive financial information. URL retrieval is attempted only for the public URL supplied by the user and is subject to normal accessibility limits.

## Limitations

- AI can produce false positives or false negatives; review the evidence and explanations critically.
- Verification is incomplete unless actual authoritative evidence is available in the supplied/retrieved content.
- Some websites block automated retrieval, require login, or contain too little readable text.
- Screenshot analysis depends on image clarity and the configured multimodal model.
- Limited local analysis is intentionally simple and is not a substitute for live AI or official verification.
- Demo output is pre-generated and is not live verification.
- Mixed-language and translation quality can vary.

## Future improvements

- More Indian languages and voice-first accessibility
- Stronger authoritative source lookup and citation support
- Browser/mobile share integration
- Additional scam categories and official reporting guidance
- Privacy-preserving local OCR and on-device processing

## Disclaimer

ScamLens provides informational risk analysis and does not provide investment advice, predict investment outcomes, or determine with certainty whether content is fraudulent. Always independently verify important financial claims through authoritative sources.
