# Feature change requests

One markdown file per **high-level capability**: `feature/<feature-slug>.md` (kebab-case).

**Mandatory process:** [development-process.mdc](../.cursor/rules/development-process.mdc) — feature analysis → architecture design → task break → **explicit task approval** → TDD.

## Feature index (Cursos)

| Capability | File | Status |
|------------|------|--------|
| Cursos platform MVP | [cursos-platform.md](cursos-platform.md) | done |
| Student study experience & teacher area | [student-study-experience.md](student-study-experience.md) | done |
| Course markdown (Marked) | [course-markdown.md](course-markdown.md) | done |
| UI visual shell | [ui-visual-shell.md](ui-visual-shell.md) | done (superseded palette by Learn) |
| Learn productization | [learn-productization.md](learn-productization.md) | done |
| Account settings | [account-settings.md](account-settings.md) | done |
| Course authoring UX | [course-authoring-ux.md](course-authoring-ux.md) | done |
| Git course sync | [git-course-sync.md](git-course-sync.md) | architecture-ready (post-MVP) |

## Resolving `<feature-slug>`

1. Name the **capability** (not the task).
2. Derive a 2–4 word kebab-case slug aligned with [feature-catalog.md](../docs/feature-catalog.md).
3. Search `feature/*.md` — **extend** if it exists.
4. If ambiguous → **ask the user**.

## Template (minimal)

Each feature doc includes: **Summary**, **Wireframe** (if UI), **Impact**, **Architecture**, **Changelog** with **Feature checklist (FC*)**, **Tasks (T*)**, **Test coverage (TC*)**, and **Development approval** line.

Full template structure: copy from [development-process.mdc](../.cursor/rules/development-process.mdc) or Issues `feature/README.md` pattern — keep Cursos domain terms (Course, Enrollment, Teacher, Student).

## Status values

`planned` → `architecture-ready` → `tasks-ready` → `approved` → `in-progress` → `done`

See [development-process.mdc](../.cursor/rules/development-process.mdc) for phase gates.
