# Website Rebuild Playbook

> Version: 1.0 — Derived from mcpc-website rebuild (Wix → Next.js, 31 pages, 3 days)
> Applies to: Any NexusBlue client website rebuild from an existing site

---

## Overview

This playbook codifies the workflow for rebuilding an existing client website into a modern Next.js application. It was battle-tested on the MCPC website rebuild (Wix → Next.js 16 + Tailwind v4) and covers crawling, content extraction, component-driven rendering, automated quality verification, and deployment.

**Expected timeline:** 3-5 days for a 20-50 page content site (no e-commerce, no user accounts beyond admin).

---

## Phase 0: Discovery & Setup (2-3 hours)

### 0.1 Understand the Source Site

Before touching any code:
- Browse every page of the source site manually
- Note: page count, content types (text, images, videos, forms, embedded widgets), external resources
- Identify dynamic content (events, news feeds, calendars) vs static pages
- Document the URL structure

### 0.2 Scaffold the Project

```bash
npx create-next-app@latest PROJECT-NAME --typescript --tailwind --app --src-dir
cd PROJECT-NAME
```

Follow the standard NexusBlue project checklist (global CLAUDE.md):
- [ ] Git remote points to `NexusBlueDev`
- [ ] `CLAUDE.md` (project-specific)
- [ ] `HANDOFF.md`
- [ ] `.env.local` with Supabase + Anthropic keys
- [ ] `.gitignore` with crawler output directories

### 0.3 Create the Page List

Create `scripts/crawl-pages.json` with every page URL from the source site:

```json
[
  "/",
  "/about",
  "/services",
  "/contact"
]
```

**Tip:** Use the smart crawler's `--discover` mode to auto-find pages, then curate the list:
```bash
npx tsx scripts/smart-crawl.ts --base-url https://source-site.com --discover --no-vision
```

---

## Phase 1: Crawl the Source Site (2-4 hours)

### 1.1 Copy the Smart Crawler

Copy `scripts/smart-crawl.ts` from an existing project or the templates repo. It's project-agnostic — no customization needed.

**Dependencies:** `playwright`, `@anthropic-ai/sdk` (for vision), `tsx` (for running TypeScript)

### 1.2 Full Crawl with Vision

```bash
npx tsx scripts/smart-crawl.ts \
  --base-url https://source-site.com \
  --pages ./scripts/crawl-pages.json \
  --output crawl-output
```

This produces:
- `crawl-output/pages/*.json` — structured content per page (title, headings, sections, links, images)
- `crawl-output/screenshots/` — viewport tiles for each page
- `crawl-output/network/` — all images and documents intercepted from browser traffic
- `crawl-output/vision-analysis/` — Claude Vision gap detection per page
- `crawl-output/site-report.json` — summary statistics

**Budget:** ~$2-5 in Anthropic API cost for 30 pages with vision.

### 1.3 Review Crawl Results

Check `site-report.json` for:
- Pages that failed or timed out (retry with `--timeout 120000`)
- Vision gap counts per page (these are content items visible in screenshots but missing from DOM extraction)
- Image and document counts

**Common issues:**
| Problem | Solution |
|---------|----------|
| Pages time out | Increase `--timeout` or use `--wait-until load` instead of `networkidle` |
| Wix CDN 403s | Already handled by crawler's network interception — don't try direct downloads |
| Few images captured | Check if site uses lazy loading — crawler scrolls slowly but may need longer page time |
| Vision finds many "missing" nav/footer items | Expected — these are layout elements, not content gaps |

---

## Phase 2: Build the Content Layer (3-4 hours)

### 2.1 Design the URL Hierarchy

Map flat source URLs to a logical hierarchy:

```typescript
// scripts/transform.ts
const URL_MAP: Record<string, string> = {
  '/about-us': '/about',
  '/our-services': '/services/overview',
  '/alcohol-prevention': '/prevention/alcohol',
  // ...
};
```

**Rules:**
- Group related pages under shared prefixes (`/prevention/`, `/programs/`, `/resources/`)
- Keep URLs short and readable
- Create 301 redirects for all old URLs (SEO preservation)

### 2.2 Build the Transform Pipeline

Create `scripts/transform.ts` to convert raw crawl data into structured content JSON:

```typescript
interface ContentSection {
  type: string;      // 'HeroSection' | 'TextSection' | 'CardGrid' | 'Accordion' | ...
  props: Record<string, unknown>;
}

interface PageContent {
  slug: string;
  title: string;
  description: string;
  sections: ContentSection[];
}
```

**Output:** `content/pages/*.json` — one file per page.

### 2.3 Build the Section Renderer

Create a `SectionRenderer` component that maps JSON section types to React components:

```typescript
const COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
  HeroSection: HeroSection,
  TextSection: TextSection,
  CardGrid: CardGrid,
  Accordion: Accordion,
  // ... add more as content requires
};
```

### 2.4 Generate Page Routes

Create `scripts/generate-pages.ts` to generate Next.js route files from content JSON:

```
content/pages/prevention-alcohol.json → src/app/prevention/alcohol/page.tsx
```

Each generated page loads its JSON and passes sections to `SectionRenderer`.

---

## Phase 3: Build Content Components (4-6 hours)

### Starter Component Library

These components cover ~90% of content site needs:

| Component | Purpose | Priority |
|-----------|---------|----------|
| `HeroSection` | Page header with title, subtitle, gradient/image background | Must have |
| `TextSection` | Rich text content block | Must have |
| `ImageTextSection` | Image + text side-by-side (alternating layout) | Must have |
| `CardGrid` | Grid of linked cards (resources, programs, team members) | Must have |
| `Accordion` | Expandable FAQ/details sections | Must have |
| `CtaBanner` | Call-to-action banner with button | Must have |
| `ResourceList` | Downloadable documents/files list | Should have |
| `StatBlock` | Statistics display (number + label) | Should have |
| `Gallery` | Image grid with lightbox | Nice to have |
| `VideoEmbed` | YouTube/Vimeo embed | Nice to have |
| `TeamGrid` | Staff/team member cards with photos | Nice to have |

**Rule:** Add components only when content demands them. Don't build speculatively.

### Component Contract

Every content component:
- Accepts props from JSON (typed interface)
- Is self-contained (no external data fetching)
- Handles missing/optional data gracefully
- Uses Tailwind utilities + CSS custom properties for styling
- Has an entry in `COMPONENT_MAP`

---

## Phase 4: Layout & Navigation (2-3 hours)

### Required Layout Components

- **Header** — logo, navigation (dropdowns for grouped pages), mobile hamburger, search bar
- **Footer** — sitemap links, contact info, partner logos, crisis/emergency banner (if applicable)
- **Breadcrumbs** — auto-generated from URL hierarchy
- **PartnerStrip** — funder/partner logos (common for nonprofit/government sites)

### Navigation Data

Extract navigation structure from the source site into a typed data file:

```typescript
// src/lib/content/navigation.ts
export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Prevention',
    children: [
      { label: 'Alcohol', href: '/prevention/alcohol' },
      { label: 'Opioid', href: '/prevention/opioid' },
      // ...
    ],
  },
  // ...
];
```

### 301 Redirects

Create redirects in `next.config.ts` for every old URL:

```typescript
async redirects() {
  return [
    { source: '/alcohol-prevention', destination: '/prevention/alcohol', permanent: true },
    // ...
  ];
}
```

---

## Phase 5: Quality Verification (2-3 hours)

### 5.1 Visual Review Pass

Manually compare each page against the source site. Fix:
- Missing content sections
- Wrong navigation menus
- Missing partner/funder logos
- Missing documents (PDFs, DOCXs)
- Wrong contact info, emails, phone numbers

### 5.2 Vision Gap Analysis

Review the crawler's vision analysis output (`crawl-output/vision-analysis/`). For each page, check:
- Items marked as "missing from DOM" — are they in our content JSON?
- Filter out nav/footer items (already in layout components)
- Focus on content gaps: statistics, resource links, embedded media, form sections

### 5.3 Automated Site Comparison

Crawl the rebuilt site and run the comparison tool:

```bash
# Crawl rebuilt site (no vision needed — Next.js server-renders reliably)
npx tsx scripts/smart-crawl.ts \
  --base-url https://YOUR-PROJECT.vercel.app \
  --pages ./scripts/crawl-pages-rebuilt.json \
  --output crawl-output-rebuilt \
  --no-vision \
  --wait-until load

# Run comparison
npx tsx scripts/compare-sites.ts \
  --source-dir ./crawl-output \
  --rebuilt-dir ./crawl-output-rebuilt \
  --output ./comparison-output
```

The comparison report shows per-page:
- Title match
- Word count delta
- Missing external links (filtered for tracking noise)
- Missing headings
- Image count delta
- Vision gaps not yet addressed
- Overall status: `good` / `minor-gaps` / `significant-gaps` / `needs-review`

**Fix all `significant-gaps` pages before launch.**

### 5.4 Accessibility & Performance

```bash
# Lighthouse CI (run against deployed preview)
npx lighthouse https://YOUR-PROJECT.nexusblue.ai --output=json --output-path=./lighthouse.json
```

Targets: 95+ accessibility, 90+ performance, 90+ SEO.

---

## Phase 6: Deploy & Handoff (1-2 hours)

### Deploy to Vercel

```bash
git push origin main  # Auto-deploys to production
```

### Preview Domain

Set up `PROJECT.nexusblue.ai` for client review (see global CLAUDE.md for wildcard CNAME setup).

### Client Review Checklist

Provide the client with:
- [ ] Preview URL for review
- [ ] List of pages to verify content accuracy
- [ ] List of items that need client input (documented in `TODO.md`)
- [ ] Contact form / chat widget testing instructions

### TODO.md for Client

Ensure `TODO.md` captures all client-required actions:
- Font files or font approval
- Social media URLs for footer
- Contact email for chat fallback
- Production domain decision
- Content accuracy sign-off
- Historical event migration scope

---

## Reusable Tools

These tools are project-agnostic and should be copied to each new website project:

| Tool | Source | Purpose |
|------|--------|---------|
| `scripts/smart-crawl.ts` | Copy from previous project | Crawl any site with Playwright + Claude Vision |
| `scripts/compare-sites.ts` | Copy and customize URL_MAP | Compare source vs rebuilt site |

**Project-specific tools** (create new for each project):
- `scripts/transform.ts` — content transformation rules specific to the source site
- `scripts/generate-pages.ts` — page route generation based on URL hierarchy
- `scripts/crawl-pages.json` — page list for the specific source site

---

## Timing Estimates

| Phase | Hours | Dependencies |
|-------|-------|-------------|
| 0. Discovery & Setup | 2-3 | None |
| 1. Crawl Source Site | 2-4 | Smart crawler copied |
| 2. Content Layer | 3-4 | Crawl output |
| 3. Content Components | 4-6 | Content JSON structure |
| 4. Layout & Navigation | 2-3 | Source site navigation mapped |
| 5. Quality Verification | 2-3 | Site deployed to preview |
| 6. Deploy & Handoff | 1-2 | All gaps fixed |
| **Total** | **16-25** | **~3-5 working days** |

**Factors that add time:**
- E-commerce features (product catalog, cart, checkout)
- User authentication beyond admin
- Event/calendar systems with historical data migration
- Multiple languages
- Complex forms with backend processing

---

## Anti-Patterns to Avoid

1. **Don't manually copy content from the source site.** Crawl it. Manual copying is slow, error-prone, and doesn't capture structure.

2. **Don't skip the vision analysis.** DOM extraction misses content that's rendered as images, inside iframes, or behind JavaScript widgets. Vision catches these.

3. **Don't treat the first build as final.** Plan for at least 3 quality passes (visual review → vision gaps → link comparison). Each pass catches different categories of issues.

4. **Don't build components speculatively.** Start with the core 6-7, add more as content demands them. Unused components are maintenance burden.

5. **Don't embed content in JSX.** Keep it in JSON. You will need to bulk-edit content multiple times during the build — JSON makes this fast; embedded JSX makes it painful.

6. **Don't use `networkidle` for crawling Next.js sites.** Persistent connections (chat widgets, analytics, WebSockets) prevent `networkidle` from ever resolving. Use `load` or `domcontentloaded`.

7. **Don't forget 301 redirects.** The source site has SEO equity on its existing URLs. Every old URL needs a permanent redirect to its new location.

8. **Don't push code without running the docs enforcement agent.** Documentation drift compounds across sessions. Run the agent before every push.
