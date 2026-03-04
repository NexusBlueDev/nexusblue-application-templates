# Help System Standard v1.0

> Canonical source: `nexusblue-application-templates/docs/HELP_SYSTEM_STANDARD.md`
> Established by: BioGate module (March 2026)
> Companion standards: DOCUMENTATION_STANDARD.md

## Purpose

NexusBlue applications include a built-in help system that delivers user documentation inside the product. Users should never need to leave the application to understand how a feature works. The help system is:

- **Contextual** -- each page links to the relevant help content
- **Searchable** -- full-text search across all help content
- **Versioned** -- help content is committed to the repo and updated with the code
- **No external CMS** -- help content lives as markdown in the codebase, not in a separate system

## Architecture

```
Markdown source files         Build-time processing        Runtime
(docs/modules/{mod}/user/)    (Next.js build)              (React component)
         |                           |                          |
         v                           v                          v
   .md files             parse -> JSON index file         <HelpPanel />
   in repo               (public/help/{module}.json)     slide-out drawer
                         includes: title, slug,           with search + nav
                         content (HTML), headings
```

### Source Files

User documentation markdown files at `docs/modules/{module}/user/` serve as the source of truth. These are the same files described in DOCUMENTATION_STANDARD.md Layer 2.

**Frontmatter requirements:**
```markdown
---
title: "Enrolling a Subject"
slug: "enrollment"
order: 2
tags: ["enrollment", "webcam", "consent", "getting started"]
role: ["admin", "employee"]
---

# Enrolling a Subject

Content here...
```

| Field | Type | Required | Purpose |
|---|---|---|---|
| title | string | yes | Display title in help panel navigation and search results |
| slug | string | yes | URL-safe identifier, unique within module. Used for contextual linking |
| order | number | yes | Sort order in navigation (1 = first) |
| tags | string[] | yes | Search keywords and topic categorization |
| role | string[] | no | If specified, only show this article to users with these roles. Omit for all-role content |

### Build-Time Processing

A build script (`scripts/build-help-index.ts`) runs during `next build` and:

1. Reads all `.md` files from `docs/modules/*/user/`
2. Parses frontmatter (title, slug, order, tags, role)
3. Converts markdown body to HTML (using remark + rehype)
4. Extracts heading structure for section navigation
5. Builds a search index (title + tags + first 200 words of each section)
6. Outputs JSON files to `public/help/{module}.json`

**Output format:**
```json
{
  "module": "biogate",
  "articles": [
    {
      "slug": "enrollment",
      "title": "Enrolling a Subject",
      "order": 2,
      "tags": ["enrollment", "webcam", "consent"],
      "role": ["admin", "employee"],
      "contentHtml": "<h1>Enrolling a Subject</h1><p>...</p>",
      "headings": [
        { "id": "step-1-consent", "text": "Step 1: Consent", "level": 2 },
        { "id": "step-2-capture", "text": "Step 2: Face Capture", "level": 2 }
      ],
      "searchText": "enrolling a subject step 1 consent before enrolling..."
    }
  ],
  "searchIndex": {
    "enrollment": [0],
    "webcam": [0],
    "consent": [0, 3]
  }
}
```

### Runtime Component: `<HelpPanel />`

A slide-out drawer component rendered at the application layout level.

**Props:**
```typescript
interface HelpPanelProps {
  module: string;           // Which module's help to load (e.g., "biogate")
  contextSlug?: string;     // Pre-select this article (contextual help)
  isOpen: boolean;
  onClose: () => void;
}
```

**Features:**
- **Navigation sidebar** -- articles listed by order, grouped by topic
- **Article view** -- rendered HTML with section anchors
- **Search** -- client-side full-text search across titles, tags, and content
- **Contextual linking** -- pages pass `contextSlug` to pre-open the relevant article
- **Role filtering** -- articles with `role` field only shown to users with matching role
- **Responsive** -- full-width on mobile, slide-out drawer on desktop
- **Keyboard accessible** -- Escape to close, Tab navigation, screen reader compatible

### Contextual Help Linking

Each page in the application can include a help trigger that opens the panel to the relevant article:

```tsx
// In any page component
import { HelpTrigger } from '@/components/help/help-trigger';

export default function EnrollmentPage() {
  return (
    <div>
      <div className="flex items-center gap-2">
        <h1>Enroll Subject</h1>
        <HelpTrigger module="biogate" slug="enrollment" />
      </div>
      {/* page content */}
    </div>
  );
}
```

The `<HelpTrigger />` renders a small help icon (?) that opens the `<HelpPanel />` pre-navigated to the specified article.

## Component Files

```
src/components/help/
├── help-panel.tsx          -- Main slide-out drawer with nav + content
├── help-trigger.tsx        -- Small (?) button that opens panel to specific article
├── help-search.tsx         -- Search input with results dropdown
├── help-article.tsx        -- Article renderer (HTML + heading anchors)
└── help-nav.tsx            -- Sidebar navigation (article list by module)

scripts/
└── build-help-index.ts     -- Build-time markdown -> JSON processor

public/help/
├── biogate.json            -- Generated help index for BioGate module
├── appvault.json           -- Generated help index for AppVault module
└── ...                     -- One JSON file per module
```

## Glossary Requirement

Every module with a help system must include a `GLOSSARY.md` in its user docs. The glossary:
- Defines every module-specific term in plain language
- Is automatically cross-referenced in help articles (terms that match glossary entries get a tooltip)
- Uses this format:

```markdown
---
title: "Glossary"
slug: "glossary"
order: 99
tags: ["glossary", "terms", "definitions"]
---

## Embedding
A mathematical representation of a face, stored as a series of numbers. The system uses embeddings to compare faces -- it never stores actual photos.

## False Acceptance Rate (FAR)
How often the system incorrectly identifies someone as a different person. A lower FAR means fewer incorrect matches.

## Liveness Detection
A security check that confirms a real person is in front of the camera, not a photo or video of someone.
```

## Writing Guidelines for Help Content

1. **Write for the user, not the developer.** No code, no database terms, no API references.
2. **Use second person.** "You can enroll a subject by..." not "The admin enrolls subjects by..."
3. **One task per guide.** Each guide covers one workflow from start to finish.
4. **Include expected outcomes.** "After clicking **Save**, you'll see a confirmation message and the subject will appear in the list."
5. **Use UI element labels exactly.** If the button says "Enroll Subject," write "Click **Enroll Subject**" -- not "Click the enroll button."
6. **Keep sentences short.** Maximum 25 words per sentence. Break complex procedures into numbered steps.
7. **Troubleshooting uses symptom-first format.** Header = what the user sees. Body = cause + fix.
8. **FAQ answers are self-contained.** Don't reference other FAQs. Each answer stands alone.
9. **Tag generously.** Tags power search. Include synonyms, related concepts, and common misspellings.
10. **Screenshots are optional, text is required.** Screenshots age faster than text. If you include them, store in `public/help/images/{module}/` and reference as relative paths.

## Implementation Timeline

| Phase | What's Built |
|---|---|
| **Phase 1** (module MVP) | Write all user docs as markdown. No runtime rendering yet. Docs are readable in the repo. |
| **Phase 2** (help system) | Build `scripts/build-help-index.ts`, `<HelpPanel />`, `<HelpTrigger />`. Integrate into layout. |
| **Phase 3** (polish) | Glossary tooltips, role-based filtering, search analytics (what users search for -> gaps in docs) |

## Version History

- v1.0 (2026-03-04) -- Initial standard established by BioGate module. Architecture definition, component specification, frontmatter format, writing guidelines, glossary requirement.
