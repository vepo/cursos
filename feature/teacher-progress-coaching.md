# Teacher progress coaching

**Feature version:** 1
**Status:** done
**Requested:** 2026-07-19

## Summary

Turn the teacher progress screen at `/teacher/courses/:courseId/progress` into a coaching tool. Today it renders one `<article>` per student with only a name and a raw `2/5 (40%)` line — no course context, no visual progress, no per-aula breakdown, no way to act on a student's progress, no sorting, and no aggregate view of the class.

Angular-only change: all required APIs exist — `GET /courses/{courseId}/progress` already returns per-item completion (`ItemProgressResponse` with `courseItemId`, `completed`, `updatedAt`), `GET /courses/{id}` supplies course title and aula titles/order, and `PUT /courses/{courseId}/items/{itemId}/progress` with `studentPassportUserId` is the existing **Teacher adjust** operation.

## Wireframe

| Field | Value |
|-------|-------|
| **Source** | ASCII below |
| **Last updated** | 2026-07-19 |

### Screen: `/teacher/courses/:courseId/progress`

```
┌────────────────────────────────────────────────────────────────────┐
│ Progresso — Introdução ao Quarkus       [Voltar] [Curso] [Alunos]  │
├────────────────────────────────────────────────────────────────────┤
│ (feedback banner: "Aula marcada como concluída para Alice" / erro) │
│                                                                    │
│ 3 alunos · conclusão média 52% · 1 concluiu o curso                │
│                                                                    │
│ Alunos (3)   — ordenados do menor para o maior progresso           │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ ▸ Carol Mendes           [██░░░░░░░░] 20% (1/5)                │ │
│ │     última atividade 12/07/2026                                │ │
│ ├────────────────────────────────────────────────────────────────┤ │
│ │ ▾ Alice Santos           [████░░░░░░] 40% (2/5)                │ │
│ │     última atividade 15/07/2026                                │ │
│ │   ┌────────────────────────────────────────────────────────┐   │ │
│ │   │ ✓ 1. Bem-vindo ao curso            [Desfazer]          │   │ │
│ │   │ ✓ 2. Primeira aula                 [Desfazer]          │   │ │
│ │   │ ○ 3. Injeção de dependência        [Marcar concluída]  │   │ │
│ │   │ ○ 4. REST com Quarkus              [Marcar concluída]  │   │ │
│ │   │ ○ 5. Encerramento                  [Marcar concluída]  │   │ │
│ │   └────────────────────────────────────────────────────────┘   │ │
│ ├────────────────────────────────────────────────────────────────┤ │
│ │ ▸ Bob Oliveira           [██████████] 100% (5/5)  [Concluído] │ │
│ └────────────────────────────────────────────────────────────────┘ │
│ (empty: "Nenhum aluno matriculado ainda.")                         │
└────────────────────────────────────────────────────────────────────┘
```

- Each student row expands/collapses to reveal the per-aula checklist (aulas in `sortOrder`, titles from course detail).
- **Desfazer** shows a confirmation dialog explaining the cascade (clears this aula and all later ones) before calling the API.
- **Marcar concluída** applies immediately; both actions show a success/error banner, disable buttons in flight, and reload summaries.
- Students sort by percent ascending (coaching focus: who needs help first), name as tiebreaker; **Concluído** badge at 100%.
- Última atividade = latest `updatedAt` across the student's item progress; omitted when the student has no activity.

## Impact

| Area | Effect |
|------|--------|
| Bounded contexts | `progress` (UI only) — no backend change |
| Packages | none (Angular `components/course-progress/` only) |
| API | none — uses existing `GET /courses/{id}`, `GET /courses/{id}/progress`, `PUT /courses/{id}/items/{itemId}/progress` (teacher adjust) |
| UI | `course-progress.component.{ts,html,scss,spec.ts}`; reusable progress-bar style |
| Schema | none |
| Seed | none — `dev-import.sql` already has partial (alice) and concluded (bob) progress on Quarkus |
| Tests | Angular specs for aggregates, sorting, expansion, adjust actions, confirmation, feedback |
| Docs | `docs/ui-elements-gallery.md` (progress bar), `docs/feature-catalog.md` (steps), domain spec UI labels |

### Risks

- Teacher adjust reuses the student-facing endpoint; undo cascades (`clearCompletedAfterSortOrder`) — mitigated by the confirmation dialog copy.
- Two API calls on load (course detail + summaries); acceptable, same pattern as the students screen.

### Feature questions (FQ*n*)

| # | Question | Status | Answer |
|---|----------|--------|--------|
| FQ1 | Per-aula breakdown with teacher adjust actions on this screen? | answered | Yes — expandable checklist per student with **Marcar concluída** / **Desfazer** (Teacher adjust) |
| FQ2 | Default ordering of students? | answered | Percent ascending (least progress first — coaching focus), student name as tiebreaker |
| FQ3 | Show last-activity date per student? | answered | Yes — latest `updatedAt` across item progress; hidden when no activity |
| FQ4 | Confirm before **Desfazer**? | answered | Yes — `ConfirmationDialogComponent`; copy explains that later aulas are also cleared (cascade) |
| FQ5 | Class-level aggregate header? | answered | Yes — student count, average completion %, and how many concluded |

### Architecture questions (AQ*n*)

| # | Question | Status | Answer |
|---|----------|--------|--------|
| AQ1 | Where do aula titles come from? | answered | Existing `CoursesApi.findCourse` detail (`CourseItemResponse.title` + `sortOrder`); join client-side by `courseItemId` |
| AQ2 | Progress bar implementation? | answered | New flat `.progress-bar` style in `styles.scss` documented in the gallery (same visual language as study sidebar `study-progress`) |
| AQ3 | How does teacher adjust call the API? | answered | `ProgressApi.updateItemProgress(courseId, itemId, { completed, studentPassportUserId })`, then reload `listCourseProgress` |

## Architecture

| Area | Design |
|------|--------|
| Scope | Angular only — `components/course-progress/` |
| Data | `listCourseProgress` (summaries + per-item state) joined client-side with `findCourse` items (titles, `sortOrder`); expansion state kept per `enrollmentId` |
| Sorting | `percentComplete` ascending, `studentName` tiebreaker (FQ2) |
| Aggregates | Computed client-side: count, mean of `percentComplete` (rounded), count of `completedItems === totalItems` (FQ5) |
| Adjust | `updateItemProgress` with `studentPassportUserId` (AQ3); **Desfazer** guarded by `ConfirmationService` (FQ4); success/error banner + in-flight disable (pattern from `course-students`) |
| Última atividade | Max `updatedAt` across `summary.items`; rendered with `DatePipe` (FQ3) |
| Navigation | `.page-actions`: **Voltar** → `/teacher`, **Curso** → `/courses/:id`, **Alunos** → `/teacher/courses/:id/students` |
| Styles | Flat UI per gallery; `.progress-bar` global style (AQ2); keep `app-shell-main nested-page` chrome (T26 specs stay green) |
| Tests | Extend `course-progress.component.spec.ts`; keep existing shell chrome specs passing |

## Changelog

### 2026-07-19 — Progress coaching screen

**Status:** `done`

**Development approval:** approved 2026-07-20 — tasks: T1, T2, T3, T4, T5

**Impact on other features:** None identified — route, APIs, and roles unchanged. Feature catalog steps for "Progress admin" gain detail; students screen **Progresso** action now lands on a richer page.

**Feature checklist:**

- [x] **FC1** Page header shows course title and actions Voltar / Curso / Alunos
- [x] **FC2** Class aggregate line: student count, average %, concluded count (FQ5)
- [x] **FC3** Students sorted by percent ascending with name tiebreaker (FQ2); **Concluído** badge at 100%
- [x] **FC4** Each student shows a visual progress bar with % and counts, plus last activity when present (FQ3)
- [x] **FC5** Student row expands to per-aula checklist with titles in course order (FQ1, AQ1)
- [x] **FC6** **Marcar concluída** / **Desfazer** call Teacher adjust; **Desfazer** confirmed with cascade warning (FQ4); feedback banner + in-flight disable
- [x] **FC7** Empty state when no enrolled students
- [x] **FC8** Screen matches Wireframe regions; gallery, feature catalog, and domain spec updated

**Tasks:**

- [x] **T1** Page header with course title + Voltar/Curso/Alunos actions, aggregate stats line, empty state (FC1, FC2, FC7)
- [x] **T2** Student rows: progress bar with % and counts, Concluído badge, last activity, percent-ascending sort (FC3, FC4)
- [x] **T3** Expandable per-aula checklist joining summaries with course items by `courseItemId` (FC5)
- [x] **T4** Teacher adjust actions: Marcar concluída / Desfazer with confirmation, feedback banner, in-flight disabling, reload (FC6)
- [x] **T5** Styles (`.progress-bar` global + gallery doc), spec updates, feature-catalog + domain-spec docs (FC8)

**Test coverage:**

- [x] **TC1** Header shows course title and navigation actions; empty state renders without students (T1)
- [x] **TC2** Aggregate line computes count, average %, concluded count from summaries (T1)
- [x] **TC3** Students sorted percent-ascending; bar width, counts, Concluído badge, and last activity render (T2)
- [x] **TC4** Expanding a student lists aulas in order with completed/pending state (T3)
- [x] **TC5** Marcar concluída calls adjust and reloads; Desfazer requires confirmation and shows cascade copy; error shows banner; buttons disable in flight (T4)
- [x] **TC6** Existing nested-shell chrome specs (T26 contract) remain green (T1–T5)

**Implementation notes:**

- Angular-only change in `components/course-progress/`; no backend or schema edits.
- `CoursesApi.findCourse` supplies course title and aula titles; `ProgressApi.listCourseProgress` + `updateItemProgress` with `studentPassportUserId` power coaching and Teacher adjust.
- Global `.progress-bar` / `.progress-bar__fill` in `styles.scss`; documented in `docs/ui-elements-gallery.md`.
- Gates: `npm run build` green (pre-existing bundle-budget warnings only); full Angular suite 143/143; component suite 15/15; lints clean.
