# Nonprofit Chat Widget — Reusable Template

> **Origin:** Built for mcpc-website (Montgomery County Prevention Coalition), extracted as a reusable pattern for any nonprofit website running Next.js + Anthropic SDK + structured content JSON.

## What You Get

- Floating chat button + slide-out panel
- Streaming AI responses via Anthropic SDK (claude-haiku-4-5)
- RAG content search over structured JSON content files
- Smart message rendering (headings, numbered lists, bullets, paragraphs)
- Inline formatting: **bold**, [markdown links](url), bare URL auto-linking
- Copy button on assistant messages (hover-reveal, 1.5s checkmark)
- Retry button on failed messages
- New conversation button (refresh icon)
- Rate limiting (in-memory, per IP)
- Mid-stream error handling with retry (never leaks raw API errors)
- Accessibility: aria-labels on all interactive elements
- CSS variable theming — swap brand colors, no code changes

## Files to Copy

| Source (mcpc-website) | Destination | Customization |
|----------------------|-------------|---------------|
| `src/components/chat/chat-widget.tsx` | Same path | Update `SUGGESTIONS`, header text, placeholder text, site domain in `formatInline` |
| `src/lib/chat/use-chat.ts` | Same path | None needed — fully generic |
| `src/lib/chat/content-search.ts` | Same path | None needed — reads from `content/pages/*.json` |
| `src/app/api/chat/route.ts` | Same path | Update `SYSTEM_PROMPT` (org name, contact info, crisis resources, base URL) |

## Setup Steps

### 1. Install Anthropic SDK

```bash
npm install @anthropic-ai/sdk
```

### 2. Set Environment Variable

Add to `.env.local`:
```bash
# Anthropic — Get key at https://console.anthropic.com/settings/keys
ANTHROPIC_API_KEY=
```

Set the same key in Vercel dashboard for production.

### 3. Copy the Four Files

Copy verbatim from mcpc-website, then customize per the table above.

### 4. Add Widget to Root Layout

```tsx
// src/app/layout.tsx
import { ChatWidget } from '@/components/chat/chat-widget';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
```

### 5. Ensure Content JSON Exists

The search requires `content/pages/*.json` files with this structure:

```json
{
  "slug": "/about",
  "title": "About Us",
  "description": "Learn about our organization.",
  "sections": [
    {
      "id": "hero",
      "component": "HeroSection",
      "props": {
        "title": "About Us",
        "subtitle": "Our mission and values",
        "ctaText": "Get Involved",
        "ctaHref": "/connect"
      }
    },
    {
      "id": "content",
      "component": "TextSection",
      "props": {
        "heading": "Our Mission",
        "content": "<p>We are a community-focused organization...</p>",
        "buttons": [
          { "text": "Learn More", "href": "https://example.com/report.pdf" }
        ]
      }
    },
    {
      "id": "resources",
      "component": "CardGrid",
      "props": {
        "heading": "Resources",
        "cards": [
          {
            "title": "Resource Name",
            "description": "Description of the resource",
            "href": "https://example.com/resource"
          }
        ]
      }
    }
  ]
}
```

The content search extracts text + URLs from: string props, `buttons[].href`, `cards[].href`, `resources[].href`, `programs[].href`, `documents[].href`, `buttonHref`, `ctaHref`, and `<a href>` tags inside HTML content strings.

### 6. Set CSS Variables

The widget uses these CSS variables (set in `globals.css`):

```css
:root {
  --brand-blue: #0088CB;       /* Primary brand color — buttons, header, links */
  --brand-blue-dark: #006699;  /* Hover state for primary */
  --brand-red: #ED1C24;        /* Error text */
  --surface-secondary: #f7f8fa; /* Assistant bubble background */
  --surface-blue: #e6f4fa;     /* Empty state icon background */
  --surface-red: #fef2f2;      /* Error banner background */
  --text-primary: #333333;     /* Main text color */
  --text-secondary: #555555;   /* Secondary text */
  --text-muted: #888888;       /* Muted text, loading dots */
  --border-default: #e5e7eb;   /* Panel border, input border */
}
```

## Customization Checklist

### chat-widget.tsx

| Line | What to Change | Example |
|------|---------------|---------|
| `SUGGESTIONS` array | 3 org-specific starter questions | `'What programs do you offer?'` |
| Header `<h3>` | Organization name | `"ACME Assistant"` |
| Header `<p>` | Subtitle | `"AI Assistant"` |
| Input `placeholder` | Org-specific | `"Ask about our programs..."` |
| Empty state `<p>` | Greeting message | `"Hi! I can help you learn about..."` |
| `formatInline` regex | Replace `preventionmc\.org` with your domain | `acme\.org` |

### route.ts — SYSTEM_PROMPT

Replace the entire `SYSTEM_PROMPT` constant. Template:

```typescript
const SYSTEM_PROMPT = `You are the [ORG_NAME] Assistant — a helpful AI for the [ORG_FULL_NAME] website. You answer questions about [ORG_NAME]'s programs, services, resources, and initiatives.

RULES:
1. ONLY answer from the provided context. If the context doesn't contain the answer, say "I don't have that information on our website, but I'd suggest contacting us directly" and provide the contact info.
2. Be friendly, professional, and concise.
3. EVERY time you mention a program, page, resource, or service, include a clickable link using markdown format: [Link Text](url). The site base URL is https://[DOMAIN]. Use page slugs from the context to build links, e.g. [About Us](https://[DOMAIN]/about). For external links, use the full URL from the context. NEVER write a bare URL or domain without markdown link syntax.
4. For crisis situations (suicide, overdose, immediate danger), ALWAYS provide the 988 Suicide & Crisis Lifeline and/or 911 first, before any other information.
5. Never fabricate programs, events, statistics, or resources that aren't in the provided context.
6. If asked about something outside [ORG_NAME]'s scope, acknowledge it and redirect to relevant [ORG_NAME] resources.
7. Do not use markdown headings (# or ##). Use **bold** for emphasis instead.

CONTACT INFO:
- Phone: [PHONE]
- Address: [ADDRESS]
- Website: [[DOMAIN]](https://[DOMAIN])

CRISIS RESOURCES:
- 988 Suicide & Crisis Lifeline: Call or text 988
- Emergency: Call 911`;
```

## Architecture Notes

### Content Search (`content-search.ts`)

- Reads all `content/pages/*.json` at query time (filesystem, no DB)
- Keyword tokenization with exact + partial matching
- Returns up to 8 results, max 2 sections per page
- Full section text (up to 1500 chars) sent to model — not snippets
- Extracts URLs from all component patterns (buttons, cards, CTAs, HTML anchors)

### Streaming (`route.ts`)

- Custom `ReadableStream` wrapping Anthropic SDK stream (per NexusBlue global standard)
- Never uses `toTextStreamResponse()` — prevents raw API error leakage
- 1 retry with 1.5s delay for retryable errors (500, 529, rate limit)
- Friendly fallback messages for partial and total failures
- Dynamic import of Anthropic SDK for Turbopack compatibility

### Chat Hook (`use-chat.ts`)

- Framework-agnostic — works with any `/api/chat` POST endpoint
- `streamResponse()` handles streaming + state updates
- `lastFailedRef` stores failed message batch for retry
- AbortController for request cancellation
- No external dependencies beyond React

### Message Rendering (`chat-widget.tsx`)

- `parseBlocks()`: splits text into heading, numbered list, bullet list, and paragraph blocks
- `formatInline()`: converts `**bold**`, `[text](url)`, bare `https://` URLs, and site domain references into React elements
- No markdown library dependency — regex-based, ~60 lines total
- Copy button uses `navigator.clipboard.writeText()` with `group-hover` pattern

## What This Does NOT Include

- Vector/embedding search (pgvector) — keyword search is good enough for < 50 pages
- Chat persistence / database logging — stateless by design
- User authentication — chat is public
- Live chat / employee takeover — no dashboard
- Lead capture form — nonprofits should use their existing contact page
- PII detection — low risk for informational queries

## Upgrade Path

| When | Upgrade |
|------|---------|
| > 50 content pages | Switch to pgvector embeddings in Supabase |
| Need chat history | Add `chat_sessions` table in Supabase |
| Need persistent rate limiting | Move rate limit store to Supabase or Redis |
| Need analytics | Log queries to `chat_queries` table |
| Multiple languages | Add language detection + i18n system prompt variants |
