---
name: cursos-agent
description: >-
  Build and extend the Cursos online course platform (Quarkus + Angular Quinoa).
  Apply when implementing courses, enrollment, progress, catalog, or Passport JWT
  integration in the cursos repository.
---

# Cursos agent skill

Use when coding or documenting the **Cursos** platform — not Issues tickets or MCP trackers.

## Before coding

1. Read [AGENTS.md](../../AGENTS.md) and [ARCHITECTURE.md](../../ARCHITECTURE.md).
2. Read [docs/domain-specification.md](../../docs/domain-specification.md) — use domain terms: **Course**, **Teacher**, **Student**, **Enrollment**, **Course item**, **Catalog home**.
3. Check [feature/cursos-platform.md](../../feature/cursos-platform.md) for approved tasks (**T1–T9** MVP; **T10** git sync only after MVP `done`).
4. Follow [development-process.mdc](../../.cursor/rules/development-process.mdc) — no production code without explicit task approval.

## Stack reminders

| Layer | Location |
|-------|----------|
| Backend packages | `dev.vepo.cursos.{auth,identity,catalog,course,enrollment,progress,mailer,git,infra}` |
| Endpoints | One class per HTTP method under `{context}.{action}` |
| Frontend | `src/main/webui/src/app/` |
| Auth | Passport JWT on `:8080`; validate in Cursos `:8083` |

## Implementation order

1. **MVP** ([cursos-platform.md](../../feature/cursos-platform.md)) — catalog, courses, items, enrollment, progress.
2. **Git sync** ([git-course-sync.md](../../feature/git-course-sync.md)) — **last**; blocked until MVP is `done`.

## Finish gate

- Backend: `mvn verify`
- Frontend (if touched): `npm run build` in `src/main/webui`
- Update domain spec, feature catalog, and ARCHITECTURE when behaviour changes
