# CODEOWNERS Standard v1.0

> Canonical source: `nexusblue-application-templates/docs/CODEOWNERS_STANDARD.md`
> Established by: wrapops CI/governance-gap remediation (S80, 2026-09-01)
> Companion standards: `github-ci-template.yml`, SECURITY_STANDARD.md
> Enforces: Rule #265 (production repos require CODEOWNERS + branch protection)

## Purpose

Rule #265 requires every production repository to have a `CODEOWNERS` file. Until this
standard, no canonical template existed for one — `nexusblue-bluetalk` had written a
`CODEOWNERS` file unilaterally, and it was mistaken for an org-wide precedent by a
session working on a different repo (wrapops) before that session checked whether
`nexusblue-core`, `setup-copilot`, or this templates repo actually had one (they did not).
This doc exists so the next repo doesn't have to reinvent — or misattribute — the pattern.

## The pattern

Every NexusBlue repo is currently solo-maintained (one founder, `@wrmagnuson`). Rule #265's
SOLO-MAINTAINER exception means the PR-approval requirement is satisfied by CI/governance
checks passing rather than a second human reviewer — but the `CODEOWNERS` file itself still
needs to exist; the exception waives the review-count requirement, not the file.

Seed path-level ownership now, even under a single owner, so:
1. `CODEOWNERS` existing at all satisfies Rule #265's literal requirement.
2. When a second maintainer joins, ownership can be split by module without a structural
   rewrite of the file — just changing which handle owns which path.
3. Security/compliance/tenant-isolation-sensitive paths are flagged for extra scrutiny
   even under solo maintenance (a marker for "read this diff twice," not an enforced gate).

## Template

Copy to `CODEOWNERS` at repo root:

```
# CODEOWNERS — [Project Name] by NexusBlue
#
# Solo-maintainer repo (Rule #265). One owner today; path mapping is seeded
# now so ownership can be split by module as the team grows without a
# structural rewrite of this file.

* @wrmagnuson

# [Category]-sensitive surfaces — flagged for extra scrutiny on review
# even under the solo-maintainer exception (automated checks + self-review).
/path/to/sensitive/module/ @wrmagnuson
```

Replace the path list with whatever this project's own sensitive surfaces are — typically:
multi-tenant isolation code, pricing/billing logic, auth/session handling, webhook handlers,
and DB migrations. Don't copy another project's path list verbatim; it should reflect this
repo's actual architecture (see `wrapops/CODEOWNERS` and `nexusblue-bluetalk/CODEOWNERS`
for two real, divergent examples — pricing/tenant/webhooks/migrations vs.
compliance/webhooks/migrations).

## Relationship to branch protection

`CODEOWNERS` existing does not by itself enforce anything — GitHub only consults it when a
branch protection rule has "Require review from Code Owners" enabled. Under the current
solo-maintainer reality, most repos should instead rely on `github-ci-template.yml`'s status
checks as the required check, with `enforce_admins: false` so the owner's own direct pushes
aren't blocked (see that template's branch-protection guidance). Turn on Code Owner review
requirements only once a second maintainer actually exists to review against.

## Adoption status (as of 2026-09-01)

| Repo | CODEOWNERS | Notes |
|---|---|---|
| `nexusblue-bluetalk` | Yes | Pre-existing, informal — not written against this standard, but compatible with it. |
| `wrapops` | Yes | First repo onboarded against this standard. |
| `nexusblue-core` | No | Gap — should adopt (it's the platform's own "brain" repo). |
| `setup-copilot` | No | Gap — should adopt (it's the project registry). |
| All others | Unaudited | Sweep not yet run beyond core/setup-copilot/bluetalk/wrapops. |
