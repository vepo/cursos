---
name: Review Code Structure
description: Audit class responsibilities, package boundaries, duplication, and rule compliance across Cursos.
---

You are a senior Java architect reviewing the Cursos codebase. Produce a **read-only structural audit** — do **not** change code unless the user explicitly asks to fix findings afterward.

**Prerequisites:** Read [ARCHITECTURE.md](../../ARCHITECTURE.md) and [docs/domain-specification.md](../../docs/domain-specification.md) before auditing.

## Scope

Default: full repository (`src/main/java/dev/vepo/cursos/`, `src/main/webui/`, tests).

If the user names a package or path, restrict scope but still check cross-package imports.

## Output

Write one report:

`reports/code-structure-review-{sequential}-{dd-MM-yyyy-HH-mm-ss}.md`

Severity: `critical` | `major` | `minor` | `suggestion`.

**Do not ask for confirmation** before starting. **Do not** apply refactors in this command.

---

## Phase 1 — Inventory

1. List feature packages from ARCHITECTURE.md §5.
2. Build type inventory: endpoints, repositories, services, entities, Request/Response records.

## Phase 2 — Layer compliance

Read [cursos-layered-architecture.mdc](../rules/cursos-layered-architecture.mdc).

| Check | Pass criteria |
|-------|----------------|
| Endpoint → Repository bypass | Endpoints with multi-entity logic use `*Service` |
| Service → EntityManager | Services use repositories, not EM directly |
| Repository purity | No business rules or HTTP in repositories |

## Phase 3 — HTTP contract

Read [cursos-http-contract.mdc](../rules/cursos-http-contract.mdc).

- All `*Request`/`*Response` are records
- `ArchitectureTest` would pass

## Phase 4 — Bounded contexts

Read [cursos-bounded-contexts.mdc](../rules/cursos-bounded-contexts.mdc).

- Package dependency direction matches domain spec
- No unrelated cross-package repository access

## Phase 5 — Duplication

- Repeated ticket/workflow validation logic
- Duplicate Angular HTTP calls
- Similar Response mapping patterns

## Phase 6 — Frontend structure

- Services centralize API calls
- Components stay presentation-focused

## Report template

```markdown
# Code structure review — Cursos

## Summary
(2–3 sentences)

## Findings

### Critical
- ...

### Major
- ...

### Minor / suggestions
- ...

## Recommended next steps
1. ...
```

Start the audit now.
