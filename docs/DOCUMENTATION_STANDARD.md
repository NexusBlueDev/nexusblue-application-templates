# Documentation Standard v1.0

> **Canonical source:** `nexusblue-application-templates/docs/DOCUMENTATION_STANDARD.md`
> **Established by:** BioGate module (March 2026)
> **Companion standards:** MODULE_STANDARD.md, SECURITY_STANDARD.md, COMPLIANCE_STANDARD.md, HELP_SYSTEM_STANDARD.md

---

## Purpose

Every NexusBlue module ships four documentation layers. Each layer serves a different audience, at a different depth, with a different update cadence. Documentation is a first-class deliverable — written before code, updated alongside code, and maintained as long as the module is active.

Skipping documentation is not a time-saving measure. It is a liability transfer to the next developer, the next auditor, or the next AI session that picks up the project. The four-layer model ensures that every stakeholder — engineer, end user, security reviewer, and compliance auditor — has a single, authoritative source of truth written for them.

---

## The Four Layers

### Layer 1: Developer Documentation

- **Audience:** Engineers integrating, maintaining, or extending the module
- **Location:** `docs/modules/{module}/developer/`
- **Update cadence:** Updated with every code change that affects the public API, data model, or architecture

#### Required Files

| File | Purpose | When Created |
|------|---------|--------------|
| README.md | Module overview, quick start, architecture summary, billing unit, role matrix, standalone viability | Before any code (MODULE_STANDARD Step 1) |
| API_REFERENCE.md | Every endpoint: method, path, auth requirements, feature gate, request/response schema with types, error codes, examples | Before API routes are written |
| DATA_MODEL.md | All tables: columns, types, constraints, relationships, RLS policies, indexes, JSONB field shapes | Before migration is written |
| ARCHITECTURE.md | System design with data flow diagrams, component boundaries, decision log with rationale, integration points | Before code |
| AGENTS.md | AI agent definitions: agent key, model, trigger, input/output schema, system prompt summary, caching strategy, cost implications | Before agent code (AI modules only) |
| INTEGRATION_GUIDE.md | How to integrate the module into a new project, connect external systems, or consume the API | After Phase 1 MVP ships |
| TESTING_GUIDE.md | Test strategy, mock patterns, fixture data, how to run the suite, what to test vs what not to test | When tests are written |
| CHANGELOG.md | Version history: breaking changes, migration notes, new features | At first release |

#### API_REFERENCE.md Per-Endpoint Structure

Every endpoint in the module API must follow this format exactly. Consistency across modules allows engineers to navigate any module's API reference without learning a new layout.

```markdown
### METHOD /api/{module}/{endpoint}

**Auth:** [Bearer token | API key | Public] ([role] with `{capability}` capability)
**Feature Gate:** `{gate_key}` ({min_tier}+)
**Rate Limit:** [X requests/minute per org]

**Request Body:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| field_name | type | yes/no | constraints | description |

**Response (200):**
```json
{ ... }
```

**Error Codes:**
| Code | Meaning | Resolution |
|------|---------|------------|
| 401 | Not authenticated | Include valid Bearer token |
| 403 | Insufficient capability or feature gate disabled | Check role permissions and plan tier |
| 422 | Validation failed | See error.details for field-level errors |
| 429 | Rate limit exceeded | Retry after X seconds |
```

#### DATA_MODEL.md Structure

Each table section must include:

- **Table name and prefix** (e.g., `bg_subjects` with prefix `bg_`)
- **Column definitions** with types, nullability, defaults, and constraints
- **Foreign key relationships** with ON DELETE behavior
- **RLS policies** — list each policy name, operation (SELECT/INSERT/UPDATE/DELETE), and the USING/WITH CHECK expression
- **Indexes** — name, columns, type (btree/gin/gist), and the query pattern it accelerates
- **JSONB field shapes** — for any JSONB column, document the expected structure with TypeScript-style types

#### ARCHITECTURE.md Structure

- **System overview diagram** (ASCII or Mermaid — must render in GitHub markdown)
- **Component boundaries** — what belongs to this module vs what it delegates to shared infrastructure
- **Data flow** — from user action through API to database and back, including any AI agent invocations
- **Decision log** — every significant architecture choice documented with: Decision, Alternatives Considered, Rationale, Date
- **Integration points** — external services, shared tables, cross-module dependencies

#### AGENTS.md Structure (AI Modules Only)

Each agent entry must include:

| Field | Description |
|-------|-------------|
| Agent Key | Unique identifier (e.g., `bg_identification_agent`) |
| Model | Which model and why (e.g., `claude-sonnet-4-6 — generation task requiring reasoning`) |
| Trigger | What invokes this agent (API call, cron, event) |
| Input Schema | TypeScript type definition of the input |
| Output Schema | TypeScript type definition of the output |
| System Prompt Summary | 2-3 sentence description of the prompt's purpose (full prompt in code) |
| Caching Strategy | Whether `cache_control: { type: 'ephemeral' }` is used (mandatory for prompts >1,024 tokens) |
| Cost Implications | Estimated tokens per invocation, cost per call, monthly budget at expected volume |
| Error Handling | What happens when the agent fails — retry strategy, fallback behavior |

---

### Layer 2: User Documentation

- **Audience:** End users (org admins, employees, facilitators, clients) operating the feature
- **Location:** `docs/modules/{module}/user/`
- **Update cadence:** Updated when UI or workflow changes; reviewed every major release

#### Required Files

| File | Purpose |
|------|---------|
| GETTING_STARTED.md | First-time setup guide: how to enable the module, configure initial settings, create first records |
| [FEATURE]_GUIDE.md | One guide per major feature/workflow (e.g., ENROLLMENT_GUIDE.md, IDENTIFICATION_GUIDE.md). Step-by-step with screenshots or UI element references |
| ADMIN_GUIDE.md | Admin-specific: settings, permissions, configuration, user management within the module |
| TROUBLESHOOTING.md | Common issues organized by symptom, cause, and fix |
| FAQ.md | Frequently asked questions organized by role |
| GLOSSARY.md | Module-specific terms with plain-language definitions |
| RELEASE_NOTES.md | User-facing changelog — no technical jargon, focused on what changed for the user |

#### Writing Rules for User Docs

These rules are non-negotiable. User documentation that reads like developer documentation has failed its audience.

1. **Write in second person.** "You can enroll a subject by..." — not "The user enrolls a subject by..."
2. **Use plain language.** No code, no database terms, no API references, no internal system names.
3. **Reference UI elements by their visible label.** "Click the **Enroll** button" — not "Trigger the enrollment endpoint."
4. **Include expected outcomes.** "After enrollment, you'll see the subject appear in the **Subjects** list with a status of **Active**."
5. **Troubleshooting entries follow a fixed structure:** Symptom (what the user sees) followed by Possible Cause (why it happens) followed by Solution (what to do).
6. **FAQ answers are self-contained.** Each answer makes sense on its own without referencing other FAQ entries.
7. **Avoid conditional language when possible.** Instead of "If you have admin permissions, you might be able to..." write "Admins can..." and organize content by role.
8. **Date all release notes.** Format: `YYYY-MM-DD — Version X.Y`. Group changes under Added, Changed, Fixed, Removed.

#### GETTING_STARTED.md Structure

```markdown
# Getting Started with {Module Name}

## Prerequisites
- What plan tier is required
- What permissions the user needs
- Any external accounts or services to set up first

## Step 1: Enable the Module
[How to turn it on in settings]

## Step 2: Initial Configuration
[Required settings to configure before first use]

## Step 3: Create Your First [Primary Record]
[Walk through creating the first meaningful record]

## Step 4: Verify It Works
[How to confirm everything is set up correctly]

## What's Next
- Link to the most common workflow guide
- Link to admin guide for advanced configuration
```

---

### Layer 3: Security Documentation

- **Audience:** Security engineers, auditors, CISO, penetration testers
- **Location:** `docs/modules/{module}/security/`
- **Update cadence:** Updated when security controls change; reviewed quarterly
- **Access control note:** Security docs are committed to the repo. For modules handling highly sensitive data (biometrics, financial records, health data), consider a separate private docs repo if the main repo is public.

#### Required Files (for Modules Handling PII or Sensitive Data)

| File | Purpose |
|------|---------|
| THREAT_MODEL.md | STRIDE analysis of all module components |
| SECURITY_CONTROLS.md | Control matrix: ID, category, description, implementation, test method, evidence, status |
| PENETRATION_TEST_PLAN.md | Specific test scenarios with expected outcomes |
| INCIDENT_RESPONSE.md | Breach response playbook specific to this module's data |
| ACCESS_CONTROL_MATRIX.md | Who can access what, at which layer (database, API, UI) |
| DATA_FLOW_SECURITY.md | Data-in-transit and data-at-rest protections, key management |

#### Optional Files (Add When Applicable)

| File | When Needed |
|------|-------------|
| BIAS_TESTING_FRAMEWORK.md | AI modules that process human data (face recognition, profiling, scoring, risk assessment) |
| VULNERABILITY_DISCLOSURE.md | Modules with external-facing APIs or public-facing attack surface |

#### SECURITY_CONTROLS.md Row Structure (Mandatory Format)

Every security control is a row in the control matrix. No prose descriptions — the table is the source of truth.

| Control ID | Category | Control Description | Implementation | Test Method | Evidence | Status |
|------------|----------|---------------------|----------------|-------------|----------|--------|
| {PREFIX}-SEC-{NNN} | [Data Protection / Access Control / Audit Trail / Transport / Input Validation / Encryption / Rate Limiting / ...] | What the control does | How it's implemented (specific file, function, config) | How to verify (specific test to run or check to perform) | What evidence proves it works (log entry, test result, config screenshot) | Active / Planned / Phase N |

**Control ID convention:**
- `{PREFIX}` = module table prefix (e.g., `BG` for BioGate, `CA` for Contacts & Attendance)
- `{NNN}` = three-digit sequential number, grouped by category
- Categories are numbered in blocks: 001-099 Data Protection, 100-199 Access Control, 200-299 Audit Trail, 300-399 Transport, 400-499 Input Validation, 500-599 Encryption, 600-699 Rate Limiting

#### THREAT_MODEL.md Structure (STRIDE)

STRIDE covers six threat categories. Every module component must be analyzed against all six.

| Component | Threat Category | Description | Likelihood | Impact | Mitigation | Control Ref |
|-----------|----------------|-------------|------------|--------|------------|-------------|
| [System component] | **S**poofing | [How an attacker could impersonate a legitimate entity] | Low/Med/High | Low/Med/High/Critical | [How it's mitigated] | {PREFIX}-SEC-{NNN} |
| [System component] | **T**ampering | [How data could be modified without authorization] | Low/Med/High | Low/Med/High/Critical | [How it's mitigated] | {PREFIX}-SEC-{NNN} |
| [System component] | **R**epudiation | [How an actor could deny their actions] | Low/Med/High | Low/Med/High/Critical | [How it's mitigated] | {PREFIX}-SEC-{NNN} |
| [System component] | **I**nformation Disclosure | [How sensitive data could be exposed] | Low/Med/High | Low/Med/High/Critical | [How it's mitigated] | {PREFIX}-SEC-{NNN} |
| [System component] | **D**enial of Service | [How the service could be made unavailable] | Low/Med/High | Low/Med/High/Critical | [How it's mitigated] | {PREFIX}-SEC-{NNN} |
| [System component] | **E**levation of Privilege | [How an attacker could gain higher access] | Low/Med/High | Low/Med/High/Critical | [How it's mitigated] | {PREFIX}-SEC-{NNN} |

#### INCIDENT_RESPONSE.md Structure

```markdown
# Incident Response Plan — {Module Name}

## Scope
What data this module handles and what constitutes a breach.

## Severity Classification
| Severity | Definition | Response Time | Notification |
|----------|-----------|---------------|-------------|
| Critical | [e.g., bulk data exfiltration, encryption key compromise] | Immediate | All affected parties within [N] hours |
| High | [e.g., unauthorized access to single record] | 4 hours | Affected org admin |
| Medium | [e.g., failed brute force attempt, anomalous access pattern] | 24 hours | Internal review |
| Low | [e.g., single failed auth attempt] | Next business day | Log only |

## Response Steps
1. Detect — how the incident is identified (monitoring, alerts, user report)
2. Contain — immediate actions to stop the breach
3. Assess — determine scope and severity
4. Notify — who to contact and by when (legal requirements)
5. Remediate — fix the vulnerability
6. Document — incident report with timeline and root cause
7. Review — post-incident process improvement

## Regulatory Notification Requirements
[Per-law notification timelines: GDPR 72 hours, state breach laws, etc.]

## Contact Chain
[Internal: engineering lead, CISO, legal. External: affected orgs, regulators if required.]
```

#### ACCESS_CONTROL_MATRIX.md Structure

Document access at all three layers for every data type in the module:

| Data Type | Database (RLS) | API (Route Auth) | UI (Component) |
|-----------|---------------|-----------------|-----------------|
| [e.g., Subject records] | service_role: full; nexusblue_admin: read all; org member: own org only | POST/GET/PATCH: admin + `{capability}`; DELETE: admin only | Visible in admin panel; read-only in employee view; hidden from client |

---

### Layer 4: Compliance Documentation

- **Audience:** Legal counsel, regulators, enterprise procurement teams, auditors
- **Location:** `docs/modules/{module}/compliance/`
- **Update cadence:** Updated when compliance posture changes; reviewed when regulations are updated; audited annually
- **Export requirement:** All compliance docs must be readable as standalone documents. No inline code, no repo-specific references that break when exported to PDF. Use tables, not nested code blocks.

#### Required Files (for Modules Handling PII or Regulated Data)

| File | Purpose |
|------|---------|
| PRIVACY_IMPACT_ASSESSMENT.md | DPIA (GDPR Art. 35) or PIA, pre-filled for the module |
| {LAW}_COMPLIANCE_CHECKLIST.md | One per applicable law (BIPA, GDPR, CCPA, FERPA, etc.) — point-by-point requirement mapping |
| CONSENT_POLICY_TEMPLATE.md | Ready-to-use consent document template, customizable per org |
| RETENTION_SCHEDULE.md | What data is retained, for how long, destruction procedures |
| DATA_PROCESSING_AGREEMENT.md | DPA template for enterprise clients |
| SUBPROCESSOR_LIST.md | All third parties with access to module data |
| AUDIT_GUIDE.md | How to conduct a compliance audit of this module |

#### Optional Files (Add When Applicable)

| File | When Needed |
|------|-------------|
| EU_AI_ACT_RISK_REGISTER.md | AI modules classified as high-risk under EU AI Act |

#### Compliance Checklist Row Structure (Mandatory Format)

One checklist file per applicable law. Every requirement from the law that is relevant to this module gets a row.

| Law Section | Requirement | Implementation | Evidence | Status |
|-------------|-------------|----------------|----------|--------|
| [Specific section/article number] | [What the law requires, in plain language] | [How the module implements it — specific tables, functions, configs, and where they live] | [What an auditor can check to verify compliance — query to run, config to inspect, log to review] | Compliant / Partial / Planned |

**Status definitions:**
- **Compliant** — fully implemented, tested, and verifiable
- **Partial** — implementation exists but is incomplete or has known gaps (document the gaps)
- **Planned** — not yet implemented; include the target phase or milestone

#### RETENTION_SCHEDULE.md Structure

| Data Category | Retention Period | Legal Basis | Destruction Method | Destruction Verification |
|---------------|-----------------|-------------|--------------------|-----------------------|
| [e.g., Biometric templates] | [e.g., 3 years from last use or until consent withdrawal] | [e.g., BIPA 740 ILCS 14/15(a)] | [e.g., Cascade DELETE from database + Supabase storage object deletion] | [e.g., Audit log entry with before/after record counts] |

#### CONSENT_POLICY_TEMPLATE.md Requirements

Consent templates must be:
- Written in plain language (8th grade reading level)
- Specific about what data is collected, how it is used, and how long it is retained
- Clear about how to withdraw consent and what happens to data after withdrawal
- Customizable per organization (bracketed placeholders for org name, contact info, specific use cases)
- Formatted for web display (HTML-safe markdown) and print (PDF-exportable)

#### SUBPROCESSOR_LIST.md Structure

| Subprocessor | Service | Data Accessed | Location | DPA Status | Last Reviewed |
|-------------|---------|---------------|----------|-----------|--------------|
| [e.g., Supabase (AWS)] | Database hosting, auth | All module data | us-east-2 (AWS) | Active | YYYY-MM-DD |
| [e.g., Anthropic] | AI analysis | Data sent to AI agent | US | Active | YYYY-MM-DD |

---

## Applicability Rules

Not every module needs all four layers at full depth. The following matrix defines the minimum documentation requirement by component type.

| Module Type | Developer (Layer 1) | User (Layer 2) | Security (Layer 3) | Compliance (Layer 4) |
|-------------|--------------------|-----------------|--------------------|---------------------|
| Module (with PII/sensitive data) | Full | Full | Full | Full |
| Module (no sensitive data) | Full | Full | Minimal (SECURITY_CONTROLS.md + ACCESS_CONTROL_MATRIX.md) | Minimal (RETENTION_SCHEDULE.md only) |
| Agent | README + AGENTS.md + trigger docs | N/A (background process) | SECURITY_CONTROLS.md if processing sensitive data | N/A unless processing PII |
| Integration | README + API_REFERENCE.md | N/A (wrapper) | DATA_FLOW_SECURITY.md | SUBPROCESSOR_LIST.md |
| Script | Header comment + README | N/A | N/A | N/A |

### Determining Applicability

When a new module is proposed, answer these questions to determine which layers apply at full depth:

1. **Does the module store or process personally identifiable information (PII)?** Names, emails, phone numbers, addresses, biometrics, government IDs, financial data, health data. If yes: Full Layer 3 + Full Layer 4.
2. **Does the module use AI to process human data?** Face recognition, profiling, scoring, risk assessment, behavioral analysis. If yes: Full Layer 3 + Full Layer 4 + BIAS_TESTING_FRAMEWORK.md + EU_AI_ACT_RISK_REGISTER.md (if applicable).
3. **Is the module client-facing (end users interact with it)?** If yes: Full Layer 2.
4. **Is the module a background process with no UI?** If yes: Layer 2 is N/A.
5. **Does the module integrate with external services that receive data?** If yes: SUBPROCESSOR_LIST.md + DATA_FLOW_SECURITY.md regardless of other factors.

Document the applicability determination in the module's developer README.md under a `## Documentation Layers` section.

---

## Documentation-First Rules

These six rules govern all documentation work across all NexusBlue modules. They are enforced by the docs enforcement agent at session end.

1. **Docs before code.** Developer docs (README, API_REFERENCE, DATA_MODEL, ARCHITECTURE) must exist before implementation code is written. They are the specification. Code that ships without its specification is code that cannot be maintained.

2. **Docs updated with code.** When a code change affects the public API, data model, or architecture, the relevant doc is updated in the SAME commit. A pull request that changes an endpoint signature without updating API_REFERENCE.md is incomplete.

3. **Docs reviewed at session end.** The docs enforcement agent checks all four layers at session close. Gaps block the push. This is automated, not optional.

4. **Compliance docs are exportable.** No repo-specific paths, no code blocks, no markdown features that break in PDF export. Use tables, not nested code. An auditor should be able to read compliance docs in a PDF binder without access to the repository.

5. **User docs are testable.** Every step in a user guide should produce a visible, verifiable outcome. If a guide says "Click **Enroll**," the Enroll button must exist in the current UI. Stale user docs are worse than no docs — they teach users to distrust the documentation.

6. **Security docs are auditable.** Every control has a test method. Every test method produces evidence. Every piece of evidence is linkable to a specific implementation. A security reviewer should be able to trace any control from the matrix to the code that implements it to the test that verifies it.

---

## Cross-Referencing Between Layers

Layers reference each other but never duplicate content. Each layer points to the authoritative source.

| From Layer | To Layer | How to Reference |
|-----------|---------|-----------------|
| Developer | Security | "See SECURITY_CONTROLS.md for the control matrix governing this endpoint" |
| Developer | Compliance | "See RETENTION_SCHEDULE.md for data lifecycle rules" |
| User | Developer | Never — user docs do not reference developer docs |
| User | Compliance | "See our Privacy Policy for details on how your data is handled" (link to published policy, not repo file) |
| Security | Developer | "Implemented in `src/lib/{module}/encryption.ts` — see DATA_MODEL.md for schema details" |
| Security | Compliance | "This control satisfies BIPA 14/15(a) — see BIPA_COMPLIANCE_CHECKLIST.md row 3" |
| Compliance | Security | "Technical implementation: see SECURITY_CONTROLS.md control {PREFIX}-SEC-{NNN}" |
| Compliance | Developer | "Data model: see DATA_MODEL.md table `{prefix}_{entity}`" |

---

## File Naming Conventions

- All documentation files use UPPERCASE names with underscores: `API_REFERENCE.md`, `THREAT_MODEL.md`
- Feature-specific user guides use the feature name: `ENROLLMENT_GUIDE.md`, `IDENTIFICATION_GUIDE.md`
- Law-specific compliance checklists use the law abbreviation: `BIPA_COMPLIANCE_CHECKLIST.md`, `GDPR_COMPLIANCE_CHECKLIST.md`
- All files are Markdown (`.md`) — no Word docs, no Google Docs, no PDFs in the repo (PDFs are export artifacts)

---

## Directory Structure Template

When a module ships with full four-layer documentation, the directory structure looks like this:

```
docs/modules/{module}/
  developer/
    README.md
    API_REFERENCE.md
    DATA_MODEL.md
    ARCHITECTURE.md
    AGENTS.md              (AI modules only)
    INTEGRATION_GUIDE.md
    TESTING_GUIDE.md
    CHANGELOG.md
  user/
    GETTING_STARTED.md
    [FEATURE]_GUIDE.md     (one per major workflow)
    ADMIN_GUIDE.md
    TROUBLESHOOTING.md
    FAQ.md
    GLOSSARY.md
    RELEASE_NOTES.md
  security/
    THREAT_MODEL.md
    SECURITY_CONTROLS.md
    PENETRATION_TEST_PLAN.md
    INCIDENT_RESPONSE.md
    ACCESS_CONTROL_MATRIX.md
    DATA_FLOW_SECURITY.md
    BIAS_TESTING_FRAMEWORK.md   (AI + human data only)
  compliance/
    PRIVACY_IMPACT_ASSESSMENT.md
    {LAW}_COMPLIANCE_CHECKLIST.md
    CONSENT_POLICY_TEMPLATE.md
    RETENTION_SCHEDULE.md
    DATA_PROCESSING_AGREEMENT.md
    SUBPROCESSOR_LIST.md
    AUDIT_GUIDE.md
```

---

## Docs Enforcement Agent Integration

The four-layer documentation model is enforced by the docs enforcement agent defined in the global CLAUDE.md Agent Orchestration Standard. The agent's session-end audit now includes verification of all applicable documentation layers.

**What the docs agent checks for each module touched during a session:**

1. Developer layer: README exists, API_REFERENCE current with implemented routes, DATA_MODEL matches migration
2. User layer: GETTING_STARTED exists (if module has UI), feature guides exist for shipped workflows
3. Security layer: SECURITY_CONTROLS.md exists (if module handles sensitive data), ACCESS_CONTROL_MATRIX.md current
4. Compliance layer: applicable compliance checklists exist (if module handles PII), RETENTION_SCHEDULE.md current

The agent does not verify content quality — it verifies structural completeness and freshness. Content quality is the responsibility of the engineer writing the docs.

---

## Version History

- **v1.0** (2026-03-04) — Initial standard established by BioGate module architecture. Four-layer model (Developer, User, Security, Compliance), applicability rules by component type, mandatory format specifications for security controls (STRIDE threat model, control matrix with test methods and evidence), compliance checklists (per-law requirement mapping with implementation and evidence columns), user documentation writing rules, cross-referencing conventions, directory structure template, and docs enforcement agent integration.
