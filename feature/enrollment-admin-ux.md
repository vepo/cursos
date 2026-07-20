# Enrollment admin UX

**Feature version:** 1
**Status:** done
**Requested:** 2026-07-19

## Summary

Improve the teacher enrollment administration screen at `/teacher/courses/:courseId/students`. Today it renders one flat `<ul>` mixing pending requests and enrolled students, shows raw English enum values (`REQUESTED`, `ENROLLED`), has no counts, no empty states, no action feedback, no confirmation before rejecting, and no navigation back to the teacher area.

Angular-only change: all required APIs exist (list enrollments, approve, reject, direct enroll, Passport directory search, course detail).

## Wireframe

| Field | Value |
|-------|-------|
| **Source** | ASCII below |
| **Last updated** | 2026-07-19 |

### Screen: `/teacher/courses/:courseId/students`

```
┌──────────────────────────────────────────────────────────────────┐
│ Alunos — Angular na prática        [Voltar] [Curso] [Progresso]  │
├──────────────────────────────────────────────────────────────────┤
│ (feedback banner: "Matrícula aprovada" / erro)                   │
│                                                                  │
│ Solicitações pendentes (2)                                       │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ Carol Mendes · carol@passport.vepo.dev   [Aprovar] [Recusar] │ │
│ │ Guest User · guest@passport.vepo.dev     [Aprovar] [Recusar] │ │
│ └──────────────────────────────────────────────────────────────┘ │
│ (empty: "Nenhuma solicitação pendente")                          │
│                                                                  │
│ Alunos matriculados (3)                                          │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ Alice Santos · alice@…            [badge Matriculado]        │ │
│ │ Bob Oliveira · bob@…              [badge Matriculado]        │ │
│ └──────────────────────────────────────────────────────────────┘ │
│ (empty: "Nenhum aluno matriculado")                              │
│                                                                  │
│ Recusados (1)                                                    │
│ │ Diego Costa · diego@…             [badge Recusado]           │ │
│                                                                  │
│ Matricular aluno                                                 │
│ [ Buscar no Passport __________ ] [Buscar]                       │
│ │ Ana Mentora · mentor@…            [Matricular]               │ │
│ │ Alice Santos · alice@…            [badge Já matriculado]     │ │
│ (empty após busca: "Nenhum usuário encontrado")                  │
└──────────────────────────────────────────────────────────────────┘
```

- **Recusar** opens `ConfirmationDialogComponent` before calling the API.
- Directory results already enrolled/requested show a badge instead of the **Matricular** button.
- Action buttons disable while the request is in flight.

## Impact

| Area | Effect |
|------|--------|
| Bounded contexts | `enrollment` (UI only) — no backend change |
| Packages | none (Angular `components/course-students/` only) |
| API | none — uses existing `GET /courses/{id}`, `GET /courses/{id}/enrollments`, approve/reject/direct, `GET /directory/users` |
| UI | `course-students.component.{ts,html,scss,spec.ts}`; gallery status-badge variants |
| Schema | none |
| Seed | none — current `dev-import.sql` already provides REQUESTED/ENROLLED/REJECTED rows |
| Tests | Angular specs for grouping, labels, feedback, confirm dialog, direct enroll |
| Docs | `docs/ui-elements-gallery.md` (badge variants), `docs/feature-catalog.md` (steps) |

### Risks

- None significant — UI refactor over stable APIs. Reject confirmation adds one dialog dependency already used elsewhere.

### Feature questions (FQ*n*)

| # | Question | Status | Answer |
|---|----------|--------|--------|
| FQ1 | Show rejected enrollments on the screen? | answered | Yes — simple list with **Recusado** badge (history visible; student may re-request) |
| FQ2 | Show course title in the page header? | answered | Yes — load via existing `GET /courses/{id}` |
| FQ3 | Confirm before **Recusar**? | answered | Yes — `ConfirmationDialogComponent` (destructive action, Nielsen error prevention) |
| FQ4 | Directory results already enrolled/requested: hide or badge? | answered | Badge **Já matriculado** / **Solicitado**, button hidden (recognition over recall) |

### Architecture questions (AQ*n*)

| # | Question | Status | Answer |
|---|----------|--------|--------|
| AQ1 | Where do PT-BR status labels live? | answered | Component-level mapping function (same pattern as `home.component.ts` `enrollmentLabel()`); no i18n framework yet |
| AQ2 | New status badge styles? | answered | Extend gallery `.status-badge` with `--requested`, `--enrolled`, `--rejected` variants in `styles.scss` |

## Architecture

| Area | Design |
|------|--------|
| Scope | Angular only — `components/course-students/` |
| Data | `listCourseEnrollments` grouped client-side into pending / enrolled / rejected; `CoursesApi.findCourse` for title |
| Status labels | `statusLabel(status)` mapping → Solicitado / Matriculado / Recusado (domain UI labels) |
| Feedback | `message` / `error` fields rendered as banner (pattern from `teacher-home` / `account`); set on approve/reject/enroll success and error callbacks |
| Confirm | `ConfirmationService` + `ConfirmationDialogComponent` before reject |
| Direct enroll | Search keeps existing endpoint; results cross-checked against current enrollments to badge already-enrolled users; success clears query + results and reloads list |
| Navigation | `.page-actions`: **Voltar** → `/teacher`, **Curso** → `/courses/:id`, **Progresso** → `/teacher/courses/:id/progress` |
| Styles | Flat UI per gallery; `.status-badge` variants; keep `app-shell-main nested-page` chrome (specs T26 stay green) |
| Tests | Extend `course-students.component.spec.ts`; keep existing shell chrome specs passing |

## Changelog

### 2026-07-19 — Enrollment admin screen polish

**Status:** `done`

**Development approval:** approved 2026-07-19 — tasks: T1, T2, T3, T4 (FQ1–FQ4 defaults accepted)

**Impact on other features:** None identified — route, APIs, and roles unchanged. Feature catalog steps for "Enrollment admin" gain detail.

**Feature checklist:**

- [x] **FC1** Enrollments grouped into Solicitações pendentes / Alunos matriculados / Recusados with counts (FQ1)
- [x] **FC2** Status shown as PT-BR badges (Solicitado / Matriculado / Recusado), never raw enum values
- [x] **FC3** Each section has an empty state message
- [x] **FC4** Page header shows course title (FQ2) and actions Voltar / Curso / Progresso
- [x] **FC5** Aprovar / Recusar / Matricular give success and error feedback; buttons disable in flight
- [x] **FC6** Recusar requires in-app confirmation (FQ3)
- [x] **FC7** Directory results already enrolled/requested show badge instead of Matricular (FQ4)
- [x] **FC8** Screen matches Wireframe regions; gallery + feature catalog updated

**Tasks:**

- [x] **T1** Restructure template into grouped sections with counts, PT-BR status badges, empty states, and page header with course title + Voltar/Curso/Progresso actions (FC1–FC4)
- [x] **T2** Action feedback and safety: success/error banner, in-flight disabling, reject confirmation dialog (FC5, FC6)
- [x] **T3** Direct enroll UX: already-enrolled badges on search results, empty-state after search, clear query on success (FC7)
- [x] **T4** Styles (status-badge variants in `styles.scss`), spec updates, gallery + feature-catalog docs (FC8)

**Test coverage:**

- [x] **TC1** Sections group by status with counts, PT-BR labels, and empty states (T1)
- [x] **TC2** Approve/reject: confirmation on reject, success banner, error banner on failure, buttons disabled while pending (T2)
- [x] **TC3** Direct enroll: already-enrolled badge, success clears results, error feedback (T3)
- [x] **TC4** Existing nested-shell chrome specs (T26 contract) remain green (T1–T4)

**Implementation notes:**

- Angular-only change in `components/course-students/`; no backend or schema edits.
- `CoursesApi.findCourse` supplies the course name in the page title; `ConfirmationService` guards **Recusar**.
- REJECTED enrollments are ignored when badging directory results, so a teacher can directly re-enroll a previously rejected student.
- New global `.status-badge--requested/--enrolled/--rejected` variants documented in `docs/ui-elements-gallery.md`; catalog steps and domain-spec UI labels updated.
- Gates: `npm run build` green (pre-existing bundle-budget warnings only); full Angular suite 116/116; component suite 13/13; lints clean.
