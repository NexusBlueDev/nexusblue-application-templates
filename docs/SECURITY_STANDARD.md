# Security Standard v1.0

> Canonical source: `nexusblue-application-templates/docs/SECURITY_STANDARD.md`
> Established by: BioGate module (March 2026)
> Companion standards: MODULE_STANDARD.md, DOCUMENTATION_STANDARD.md, COMPLIANCE_STANDARD.md

## Purpose

Every NexusBlue module that handles PII, sensitive data, or operates in regulated environments must ship with a security documentation layer. This standard defines the required security artifacts, their format, and maintenance cadence.

Security documentation is not optional overhead — it is provable evidence of NexusBlue's commitment to protecting data. Enterprise clients, government agencies, and auditors evaluate vendors on the depth and currency of their security documentation before evaluating their code.

## Applicability

| Data Classification | Security Layer Required? | Minimum Artifacts |
|---|---|---|
| **Biometric data** (face, voice, fingerprint) | Full | All artifacts |
| **PII** (name, email, phone, address) | Full | All artifacts |
| **PHI** (health information) | Full | All artifacts + HIPAA-specific |
| **Financial data** (payment, billing) | Full | All artifacts + PCI-specific |
| **Business data** (non-personal) | Minimal | SECURITY_CONTROLS.md + ACCESS_CONTROL_MATRIX.md |
| **Public data** (no sensitive content) | None | N/A |

## Required Artifacts

### 1. THREAT_MODEL.md — STRIDE Analysis

Every module with sensitive data ships a STRIDE threat model covering all components.

**STRIDE categories:**
- **S**poofing — can an attacker impersonate a user or system?
- **T**ampering — can data be modified in transit or at rest?
- **I**nformation Disclosure — can sensitive data be exposed?
- **R**epudiation — can actions be denied or audit trails tampered with?
- **D**enial of Service — can the system be made unavailable?
- **E**levation of Privilege — can an attacker gain unauthorized access?

**Required format:**

| Component | Threat (STRIDE) | Description | Likelihood | Impact | Mitigation | Control Ref |
|---|---|---|---|---|---|---|
| [System component — API endpoint, DB table, UI component, background job] | S/T/I/R/D/E | [Specific attack scenario in plain language] | Low / Medium / High | Low / Medium / High / Critical | [Specific mitigation — not generic "use encryption"] | {PREFIX}-SEC-{NNN} |

**Rules:**
- Every API endpoint must appear at least once
- Every database table containing sensitive data must appear at least once
- Every external integration point must appear at least once
- Likelihood x Impact determines priority (Critical impact always gets a mitigation regardless of likelihood)
- Every mitigation references a specific control ID from SECURITY_CONTROLS.md

### 2. SECURITY_CONTROLS.md — Control Matrix

The control matrix is the central artifact. It lists every security control, how it's implemented, how to test it, and what evidence proves it works.

**Control ID format:** `{MODULE_PREFIX}-SEC-{NNN}` (e.g., BG-SEC-001 for BioGate)

**Required columns:**

| Control ID | Category | Control Description | Implementation | Test Method | Evidence | Status |
|---|---|---|---|---|---|---|
| Unique ID | Category | What the control does | File/function/config that implements it | Specific test to verify | What an auditor sees | Active / Planned / Phase N |

**Standard categories:**
- Data Protection — encryption at rest, encryption in transit, key management
- Access Control — authentication, authorization, RLS, RBAC
- Data Minimization — what's collected, what's stored, what's discarded
- Audit Trail — logging, immutability, tamper detection
- Transport Security — TLS, certificate management, HSTS
- Anti-Spoofing — liveness detection, CAPTCHA, bot protection
- Rate Limiting — API throttling, abuse prevention
- Retention — data lifecycle, auto-purge, destruction procedures
- Deletion — cascade delete, right to erasure, cryptographic deletion
- Incident Response — breach detection, notification, containment

**Rules:**
- Every control must be testable — if you can't write a test for it, it's not a control
- Every control must have evidence — if an auditor can't verify it, it doesn't exist
- "Active" means implemented and tested. "Planned" means documented but not yet built. "Phase N" means scheduled.
- Controls are never deleted — they move from Active to Deprecated with a note explaining why

### 3. PENETRATION_TEST_PLAN.md

Defines specific attack scenarios to test against the module. Each scenario maps to a threat from the STRIDE model.

**Required format per test:**

```markdown
### Test {NNN}: {Test Name}

**Threat Ref:** {Threat from STRIDE model}
**Control Ref:** {Control being tested}
**Preconditions:** [Setup needed]
**Steps:**
1. [Specific action]
2. [Specific action]
**Expected Result:** [What should happen — the control should prevent the attack]
**Pass Criteria:** [Specific, measurable criteria]
**Tools:** [Tools needed — curl, Burp Suite, custom script, etc.]
```

### 4. INCIDENT_RESPONSE.md

Module-specific breach response playbook. This supplements (does not replace) the org-level incident response plan.

**Required sections:**
- **Data Classification** — what sensitive data this module stores and where
- **Detection** — how a breach of this module's data would be detected (alerts, anomalies, audit log patterns)
- **Containment** — immediate steps to limit damage (disable module, revoke keys, isolate data)
- **Notification** — who must be notified and within what timeframe (BIPA: no specific timeframe but "reasonable"; GDPR: 72 hours; state laws vary)
- **Recovery** — steps to restore normal operation (re-encrypt, rotate keys, re-enroll if biometric)
- **Post-Incident** — lessons learned, control updates, documentation updates

### 5. ACCESS_CONTROL_MATRIX.md

Maps who can access what, at every layer.

**Required format:**

| Resource | Layer | admin | employee | facilitator | partner | client | nexusblue_admin | service_role |
|---|---|---|---|---|---|---|---|---|
| [Table/endpoint/UI page] | [DB/API/UI] | [CRUD] | [CRUD] | [CRUD] | [CRUD] | [CRUD] | [R] | [CRUD] |

**Rules:**
- Every database table with RLS appears here
- Every API endpoint appears here
- Every UI page or component with role-based visibility appears here
- Access is documented at the most restrictive level (if the API says read-only, the matrix says R even if the DB allows more)

### 6. DATA_FLOW_SECURITY.md

Documents data boundaries, encryption points, and key management.

**Required sections:**
- **Data Flow Diagram** — ASCII or textual representation of data flowing through the system, with encryption boundaries marked
- **Encryption at Rest** — what's encrypted, with what algorithm, key storage location
- **Encryption in Transit** — TLS version, certificate provider, HSTS configuration
- **Key Management** — where keys live, rotation schedule, who has access
- **Data Boundaries** — where data crosses trust boundaries (browser->server, server->database, server->external API)

## Bias Testing (AI Modules)

AI modules that process human data (face recognition, profiling, scoring, classification) must include a BIAS_TESTING_FRAMEWORK.md.

**Required content:**
- **Demographic groups tested** — at minimum: age ranges, skin tones (Fitzpatrick I-VI), gender presentation
- **Metrics per group** — FAR, FRR, FTE (Failure to Enroll), FTA (Failure to Acquire) broken down by demographic
- **Acceptable thresholds** — maximum allowed variance between demographic groups
- **Test methodology** — reference ISO/IEC 19795-10:2024 for demographic performance testing
- **Remediation process** — what happens when bias is detected (model retraining, threshold adjustment, disclosure)
- **Reporting cadence** — bias testing is repeated when the model changes, the training data changes, or annually

## Maintenance Cadence

| Artifact | Review Frequency | Trigger for Update |
|---|---|---|
| THREAT_MODEL.md | Quarterly | New component, new integration, new threat identified |
| SECURITY_CONTROLS.md | With every code change to controls | New control added, control implementation changed |
| PENETRATION_TEST_PLAN.md | Quarterly | New threat in model, new attack vector identified |
| INCIDENT_RESPONSE.md | Annually | After any incident, regulation change |
| ACCESS_CONTROL_MATRIX.md | With every role/permission change | New role, new table, new API endpoint |
| DATA_FLOW_SECURITY.md | With every architecture change | New data path, new encryption point, key rotation |
| BIAS_TESTING_FRAMEWORK.md | Annually or on model change | Model update, training data change, demographic disparity report |

## Integration with Development Workflow

1. **Architect review agent** checks: threat model covers all components, controls reference valid implementations, access matrix matches RLS policies
2. **Security review agent** checks: API routes match access matrix, no secrets in code, input validation on all endpoints
3. **Docs enforcement agent** checks: all required security artifacts exist and are current

## API Route Security Middleware (v2.0 — Core Security Module)

Every API route in every NexusBlue project must use the security middleware from `@nexusbluedev/core/security`. This is enforced by governance rules and the `boundary-guard.sh` hook.

### Required Middleware

| Route Type | Required Middleware | Import |
|---|---|---|
| **Mutation (POST/PUT/PATCH/DELETE)** | `secureRoute()` or `withAuditEvent()` | `@nexusbluedev/core/security` |
| **Public endpoint** | `withRateLimit()` | `@nexusbluedev/core/security` |
| **Input-accepting** | `withValidation()` with Zod schema | `@nexusbluedev/core/security` |
| **High-stakes AI** | `coreGroundedGenerate()` + `truthVerification: true` | `@nexusbluedev/core/ai` |

### Example: Secured Route

```typescript
import { secureRoute } from '@nexusbluedev/core/security';
import { z } from 'zod';

const CreateSchema = z.object({ name: z.string(), email: z.string().email() });

export const POST = secureRoute(async (req, data) => {
  // data is typed as { name: string; email: string }
  // Auth already verified, rate limit checked, body validated
  return Response.json(await createContact(data));
}, {
  audit: { action: 'create', entityType: 'contacts' },
  rateLimit: { authenticated: { requests: 50, windowMs: 60_000 } },
  validation: CreateSchema,
  requireAuth: true,
  requireRole: ['admin', 'employee'],
});
```

### .env.example Additions

```
# Langfuse observability (Tier 1 — required for AI routes)
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_HOST=https://langfuse.nexusblue.ai
```

## Version History

- v2.0 (2026-04-12) — Added API Route Security Middleware section. Core security module (`@nexusbluedev/core/security`): secureRoute, withAuditEvent, withRateLimit, withValidation. Governance-enforced via gate rules.
- v1.0 (2026-03-04) — Initial standard established by BioGate module. STRIDE threat model format, security controls matrix format, penetration test plan template, incident response playbook, access control matrix, data flow security, bias testing framework.
