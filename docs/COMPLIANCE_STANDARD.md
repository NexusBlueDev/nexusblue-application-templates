# Compliance Standard v1.0

> Canonical source: `nexusblue-application-templates/docs/COMPLIANCE_STANDARD.md`
> Established by: BioGate module (March 2026)
> Companion standards: MODULE_STANDARD.md, DOCUMENTATION_STANDARD.md, SECURITY_STANDARD.md

## Purpose

NexusBlue serves clients from small businesses to enterprise to government. Every module that handles PII, biometric data, health data, financial data, or education records must ship with compliance documentation that proves regulatory adherence.

Compliance documentation is not legal advice — it is engineering evidence that maps regulatory requirements to specific technical implementations. This evidence is used by:
- **Enterprise procurement teams** evaluating NexusBlue as a vendor
- **Legal counsel** assessing regulatory risk
- **Auditors** conducting SOC 2, ISO 27001, or regulatory audits
- **Government agencies** verifying compliance with public sector requirements
- **NexusBlue's own team** ensuring nothing is missed as regulations evolve

## Applicability

| Data Type | Applicable Laws | Compliance Layer Required? |
|---|---|---|
| **Biometric data** | BIPA, GDPR Art. 9, CCPA/CPRA, state biometric laws | Full — all artifacts |
| **Education records** | FERPA, COPPA (if minors), state student privacy laws | Full — all artifacts + FERPA checklist |
| **Health information** | HIPAA, HITECH, state health privacy laws | Full — all artifacts + HIPAA checklist |
| **Financial/payment data** | PCI DSS, GLBA, state financial privacy | Full — all artifacts + PCI checklist |
| **General PII** (name, email, phone) | GDPR, CCPA/CPRA, state privacy laws | Standard — GDPR + CCPA checklists, retention schedule, DPA |
| **AI/ML system** (high-risk) | EU AI Act, state AI laws (TX, CO) | Additional — EU AI Act risk register |
| **Non-personal business data** | N/A | Minimal — retention schedule only |

## Required Artifacts

### 1. Privacy Impact Assessment (PRIVACY_IMPACT_ASSESSMENT.md)

A DPIA (Data Protection Impact Assessment) per GDPR Article 35, or PIA (Privacy Impact Assessment) for non-EU contexts. Pre-filled for the specific module.

**Required sections:**
1. **Purpose of Processing** — why the module processes personal data, what legitimate interest or consent basis applies
2. **Data Inventory** — what personal data is collected, where it's stored, who has access, retention period
3. **Necessity and Proportionality** — why this data is necessary (not more than needed), proportional to the purpose
4. **Risk Assessment** — risks to data subjects: unauthorized access, data breach, function creep, re-identification
5. **Mitigation Measures** — technical and organizational measures to reduce risks (references SECURITY_CONTROLS.md)
6. **Consultation** — whether DPO or supervisory authority consultation is required
7. **Review Schedule** — when the DPIA will be reviewed (minimum annually, or on significant change)

### 2. Compliance Checklists ({LAW}_COMPLIANCE_CHECKLIST.md)

One checklist per applicable law. Each checklist maps every relevant section/article of the law to the module's implementation.

**Mandatory format:**

| Section/Article | Requirement | Implementation | Evidence | Status |
|---|---|---|---|---|
| [Specific legal reference] | [What the law requires, in plain language] | [Specific module implementation — table, function, config, process] | [What an auditor can check — query, log, UI, document] | Compliant / Partial / Planned / N/A |

**Status definitions:**
- **Compliant** — fully implemented, tested, and evidenced
- **Partial** — partially implemented; remaining items documented with timeline
- **Planned** — not yet implemented; scheduled for specific phase
- **N/A** — section does not apply to this module (must explain why)

**Standard checklists NexusBlue maintains templates for:**

| Law | Template | Key Focus Areas |
|---|---|---|
| **BIPA** | BIPA_COMPLIANCE_CHECKLIST.md | 740 ILCS 14/15(a)–(e): consent, retention, no-sale, reasonable care, destruction |
| **GDPR** | GDPR_COMPLIANCE_CHECKLIST.md | Articles 5–9, 12–23, 25, 28, 30, 32–35: principles, rights, security, DPIA, DPA |
| **CCPA/CPRA** | CCPA_COMPLIANCE_CHECKLIST.md | Sections 1798.100–1798.199: right to know, delete, opt-out, sensitive PI |
| **FERPA** | FERPA_COMPLIANCE_CHECKLIST.md | 34 CFR Part 99: consent, directory info, legitimate interest, biometric records |
| **EU AI Act** | EU_AI_ACT_RISK_REGISTER.md | Articles 6, 9, 13–15: high-risk classification, risk management, transparency, human oversight |
| **HIPAA** | HIPAA_COMPLIANCE_CHECKLIST.md | Privacy Rule, Security Rule, Breach Notification: safeguards, BAA, minimum necessary |
| **SOC 2** | SOC2_CONTROLS_MAPPING.md | Trust Service Criteria: security, availability, processing integrity, confidentiality, privacy |

### 3. Consent Policy Template (CONSENT_POLICY_TEMPLATE.md)

A ready-to-use consent document that orgs can customize. Written in plain language, meeting the informed consent requirements of all applicable laws.

**Required sections:**
1. **What We Collect** — specific data types, in plain language (e.g., "a mathematical representation of your facial features")
2. **Why We Collect It** — specific, enumerated purposes
3. **How We Use It** — processing activities tied to each purpose
4. **How Long We Keep It** — specific retention period (not "as long as necessary")
5. **Who Has Access** — roles and systems that can access the data
6. **Third-Party Sharing** — list of subprocessors (or explicit statement that there are none)
7. **Your Rights** — withdrawal, deletion, access, correction, portability (per applicable law)
8. **How to Exercise Your Rights** — specific contact method, expected response time
9. **Changes to This Policy** — how subjects will be notified, whether re-consent is required

**Rules:**
- Written at 8th-grade reading level (Flesch-Kincaid)
- No legal jargon without a plain-language explanation
- Specific, not vague ("3 years from your last interaction" not "a reasonable period")
- Includes the specific legal basis for collection (consent, legitimate interest, contract)

### 4. Retention Schedule (RETENTION_SCHEDULE.md)

Documents what data is retained, for how long, and how it's destroyed.

**Required format:**

| Data Type | Table/Storage | Retention Period | Legal Basis for Retention | Destruction Method | Auto-Purge? |
|---|---|---|---|---|---|
| [Type of data] | [Where stored] | [Specific duration] | [Why this duration — law, contract, business need] | [How destroyed — DELETE, crypto-shred, overwrite] | Yes (cron) / No (manual) |

### 5. Data Processing Agreement (DATA_PROCESSING_AGREEMENT.md)

DPA template for enterprise clients. Defines NexusBlue as processor, client as controller.

**Required clauses:**
- Scope of processing (what data, what purpose, what duration)
- NexusBlue's obligations (security measures, confidentiality, subprocessor management)
- Client's obligations (lawful basis, data subject rights fulfillment)
- Subprocessor management (notification, right to object)
- Data subject rights assistance
- Audit rights
- Data return/deletion on termination
- Cross-border transfer mechanisms (if applicable)

### 6. Subprocessor List (SUBPROCESSOR_LIST.md)

All third parties with access to the module's data.

**Required format:**

| Subprocessor | Purpose | Data Accessed | Location | DPA in Place? |
|---|---|---|---|---|
| [Company name] | [What they do] | [What data they see] | [Country/region] | Yes / No |

**Best practice:** Design modules so this list is as short as possible. BioGate's list is empty (no cloud biometric APIs) — this is the gold standard.

### 7. Audit Guide (AUDIT_GUIDE.md)

Step-by-step instructions for conducting a compliance audit of the module. Written for an external auditor who has no prior knowledge of NexusBlue.

**Required sections:**
1. **Module Overview** — what it does, what data it processes, who uses it
2. **Data Flow** — how data enters, is processed, is stored, and is deleted
3. **Compliance Artifacts** — where to find each compliance document
4. **Control Verification** — how to verify each control from SECURITY_CONTROLS.md (with specific queries, UI paths, or log commands)
5. **Consent Verification** — how to verify consent was obtained before data collection
6. **Retention Verification** — how to verify data is being destroyed per schedule
7. **Access Verification** — how to verify access controls are enforced (RLS test, API test)
8. **Evidence Collection** — what to export as audit evidence (DB queries, screenshots, log excerpts)

## Compliance Documentation Lifecycle

1. **Created before code** — compliance artifacts are part of the "docs before code" requirement
2. **Updated with implementation** — as controls are implemented, compliance checklists move from "Planned" to "Compliant"
3. **Reviewed at module release** — all checklists must show "Compliant" or "N/A" for required items before the module goes live
4. **Audited annually** — even stable modules get an annual compliance review
5. **Updated when laws change** — NexusBlue monitors regulatory changes and updates affected checklists

## Regulatory Monitoring

NexusBlue tracks the following regulatory landscapes:
- **US State Privacy Laws** — 20+ states with comprehensive privacy laws (as of 2026). Design for the strictest (currently: Illinois BIPA for biometric, California CCPA/CPRA for general PII)
- **EU AI Act** — high-risk AI systems compliance deadline: August 2, 2026
- **GDPR enforcement** — evolving case law around biometric data consent
- **FERPA** — education sector requirements for student data protection
- **Emerging:** Federal biometric privacy legislation (anticipated), FTC AI enforcement actions

When a new law is passed that affects an existing module, a new compliance checklist is created within 90 days of the law's effective date.

## Version History

- v1.0 (2026-03-04) — Initial standard established by BioGate module. Compliance checklist format, consent policy template requirements, retention schedule format, DPA template, subprocessor list, audit guide, regulatory monitoring framework.
