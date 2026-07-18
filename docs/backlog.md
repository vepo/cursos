# Product backlog

Ordered ideas for Cursos that are **not yet** in active development (or are queued). Agents and humans keep this table current and **reorderable** by the **Order** column (lower = higher priority).

**Canonical file:** [docs/backlog.md](backlog.md)  
**Rule:** [.cursor/rules/backlog-management.mdc](../.cursor/rules/backlog-management.mdc)  
**Active work:** [feature/](../feature/) changelog entries — promote a backlog row into a feature doc when starting analysis.

## How to use

| Action | How |
|--------|-----|
| Reorder | Change **Order** integers (1, 2, 3…); keep unique contiguous ranks for `idea` / `ready` rows |
| Add | Append a row; assign next Order or insert and renumber |
| Start work | Set Status `promoted`; create/extend `feature/<slug>.md`; link in **Feature doc** |
| Drop | Status `wont` or `done` (if shipped without a prior feature doc) |

### Status values

| Status | Meaning |
|--------|---------|
| `idea` | Suggested; not analyzed |
| `ready` | Scoped enough to start feature analysis when picked |
| `promoted` | Has an active `feature/*.md` changelog |
| `done` | Shipped |
| `wont` | Rejected or deferred indefinitely |

## Backlog (ordered)

| Order | Status | Idea | Why / notes | Suggested slug | Feature doc |
|------:|--------|------|-------------|----------------|-------------|
| — | promoted | **Cursos platform MVP** | Catalog, courses, items, enrollment, progress — Passport JWT | `cursos-platform` | [cursos-platform.md](../feature/cursos-platform.md) |
| — | promoted | **Git course sync** | course.yml → CourseItems; **implement after MVP** | `git-course-sync` | [git-course-sync.md](../feature/git-course-sync.md) |
| 1 | idea | **Course search and filters** | Full-text search, filter by category on catalog | `course-search` | — |
| 2 | idea | **Unpublish / archive course** | Hide without deleting enrollments | `course-lifecycle` | — |
| 3 | idea | **Co-teachers** | Multiple teachers per course | `co-teachers` | — |
| 4 | idea | **Student roster export** | CSV of enrolled students | `enrollment-export` | — |
| 5 | idea | **Quizzes / assessments** | New item type with scoring | `assessments` | — |
| 6 | idea | **Discussion threads** | Per-item or per-course comments | `discussions` | — |
| 7 | idea | **Certificates** | PDF on 100% progress | `certificates` | — |
| 8 | idea | **Backoffice integration** | Manage Cursos from Backoffice shell | `backoffice-integration` | — |
| 9 | idea | **i18n (EN + PT-BR)** | Runtime locale switching | `i18n` | — |
| 10 | idea | **Large video streaming** | External storage instead of bytea | `media-storage` | — |

## Implementation order (mandatory)

1. **MVP platform** ([cursos-platform.md](../feature/cursos-platform.md)) — tasks T1–T9 — must reach `done` first.
2. **Git course sync** ([git-course-sync.md](../feature/git-course-sync.md)) — task T10 — **blocked until MVP is done**.

## Suggested next picks (post-MVP)

1. **Course search and filters** — discoverability as catalog grows.
2. **Large video streaming** — bytea limits for big media.

## Changelog (backlog maintenance)

| Date | Change |
|------|--------|
| 2026-07-18 | Initial backlog; MVP platform and git sync promoted; git sync explicitly last |
