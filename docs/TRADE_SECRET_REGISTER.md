# NexusBlue Trade Secret Register

> Last updated: 2026-04-12
> Classification: CONFIDENTIAL — NexusBlue internal only
> Review cadence: Quarterly

## Purpose

This register classifies NexusBlue intellectual property into three categories:
1. **Trade Secrets** — proprietary algorithms, prompts, and heuristics that derive competitive value from secrecy
2. **Patentable** — novel inventions that may be filed for patent protection
3. **Defensive Publication** — patterns published to prevent others from patenting them

## Trade Secrets

| Asset | Location | Description | Value Source |
|-------|----------|-------------|-------------|
| NAOL Routing Algorithm | `nexusblue-core/src/ai/` | Multi-provider AI routing with cost optimization, failover, and budget enforcement | Competitive pricing advantage |
| System Prompts Library | `*/src/lib/*/prompts.ts` | Domain-specific prompts for 15+ modules (grant writing, compliance, pricing, etc.) | Quality of AI output |
| Heuristics Engine | Core DB `core_heuristics` | 48 founder-validated decision heuristics that guide AI and human decision-making | Institutional knowledge |
| Pricing Intelligence Algorithms | `nexusblue-website/src/lib/pricing/` | Competitive pricing analysis, margin optimization, market rate calculation | Revenue optimization |
| ProspectAI Pipeline | `nexusblue-website/src/lib/prospectai/` | Business analysis, competitor intelligence, lead scoring algorithms | Sales effectiveness |
| Workforce Orchestration | `nexusblue-core/src/workforce/` | AI agent coordination, task routing, capability matching | Operational efficiency |

## Patentable Inventions

| Invention | Status | Description | Filing Notes |
|-----------|--------|-------------|-------------|
| NAOL (Network-Aware Orchestration Layer) | **Review needed** | Multi-model AI gateway with automatic failover, cost routing, budget enforcement, and provider-agnostic abstraction | Novel composition of model routing + cost control + observability |
| Field Registry + RAG Integration | **Review needed** | Dynamic field registry driving both data schema and AI retrieval-augmented generation context | Novel pairing of metadata-driven schemas with vector search |
| Security Middleware Composition | **Monitor** | Single-call middleware composer (secureRoute) combining auth, rate limiting, validation, and audit | Potentially novel but may be obvious to practitioners |

## Defensive Publications

| Pattern | Description | Purpose |
|---------|-------------|---------|
| MCP Governance | Using MCP (Model Context Protocol) servers for platform governance — rules injection, protocol enforcement | Prevent patent trolls from claiming MCP governance patterns |
| Failover Cascade | Circuit breaker → fallback model → cached response → graceful degradation pattern for AI APIs | Widely applicable pattern that should remain open |
| Metadata-Driven Modules | Solution packs as configuration activating capabilities on universal primitives | Generalized SaaS architecture pattern |

## Protection Measures

- All source code in private GitHub repositories
- NDA required for all contractors and employees
- `.env.local` files contain API keys — never committed
- Vault-based credential management
- audit_events table logs all data access
- RLS policies enforce tenant isolation

## Review Schedule

- **Q2 2026**: Initial classification (this document)
- **Q3 2026**: Patent attorney review for NAOL + Field Registry inventions
- **Q4 2026**: Annual audit — review new modules for IP classification
