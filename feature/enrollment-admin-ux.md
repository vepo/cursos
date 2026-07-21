# Enrollment admin UX

**Feature version:** 2
**Status:** planned
**Requested:** 2026-07-19 (v1 polish); 2026-07-21 (enroll new user)

## Summary

Teacher enrollment administration at `/teacher/courses/:courseId/students`.

**v1 (done):** polish — grouped sections, PT-BR badges, feedback, reject confirmation, Passport directory direct enroll.

**v2 (planned):** allow teachers to **Enroll new user** when the student has no Passport account yet — create the Passport user, send account activation email, and enroll them on the course in one teacher flow. Existing **Matricular aluno** (directory search) remains for users who already exist in Passport.

## Wireframe

| Field | Value |
|-------|-------|
| **Source** | ASCII below |
| **Last updated** | 2026-07-21 |

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
│ │ Ana Mentora · mentor@…            [Matricular]               │
│ │ Alice Santos · alice@…            [badge Já matriculado]     │
│ (empty após busca: "Nenhum usuário encontrado")                  │
│                                                                  │
│ Enroll new user / Matricular novo usuário                        │
│ Nome: [____________________]                                     │
│ E-mail: [____________________]                                   │
│ (username: TBD per FQ5)                                          │
│ [Enroll new user]                                                │
│ (success: "Conta criada e aluno matriculado. E-mail enviado.")   │
└──────────────────────────────────────────────────────────────────┘
```

- **Recusar** opens `ConfirmationDialogComponent` before calling the API.
- Directory results already enrolled/requested show a badge instead of the **Matricular** button.
- Action buttons disable while the request is in flight.
- **Enroll new user** is a separate form from Passport search (FQ3). Field set and activation semantics depend on open **FQ** answers.

## Impact

| Area | Effect |
|------|--------|
| Bounded contexts | `enrollment`, `infra` (Passport client), possibly **Passport** repo (peer create / activation) |
| Packages (Cursos) | `enrollment.*` (new enroll-new-user endpoint/service), `infra/passport` (create-user client), `mailer` if Learn also emails; Angular `course-students` |
| Packages (Passport) | TBD — today `POST /users` is `passport.admin` only; no peer invite/activate API (see **AQ5–AQ7**) |
| API (Cursos) | New teacher-only operation to provision + enroll (path TBD in architecture); keep existing directory direct enroll |
| UI | Students page: form **Enroll new user** beside **Matricular aluno** |
| Schema | None expected in Learn (enrollment denormalizes student fields); Passport may need invite/activation if FQ2 chooses real activate-before-login |
| Seed | Optional persona/scenario for invited student; Passport may need a zero-role profile if create still requires `profileIds` |
| Tests | Endpoint + Angular specs; Passport tests if new invite/create peer API |
| Docs | Domain spec (enroll new user, activation), feature catalog, ARCHITECTURE (both repos), Passport domain if activation changes |

### Risks

- Teachers typically lack `passport.admin` — cannot call existing `POST /users` with their JWT.
- Passport create requires `@NotEmpty profileIds`, while seed students have **no** profiles — peer create needs a product decision.
- Passport today emails a **temporary password** (account already enabled); there is **no** activation-token flow. “Activate account” as stated may require Passport changes.
- Dual email risk: Passport welcome/activation + Learn enrollment invitation — clarify which messages the student receives (FQ6).
- Email collision: teacher enters an address that already exists in Passport (FQ4).

### Feature questions (FQ*n*)

| # | Question | Status | Answer |
|---|----------|--------|--------|
| FQ1 | Show rejected enrollments on the screen? | answered | Yes — simple list with **Recusado** badge (history visible; student may re-request) |
| FQ2 | Show course title in the page header? | answered | Yes — load via existing `GET /courses/{id}` |
| FQ3 | Confirm before **Recusar**? | answered | Yes — `ConfirmationDialogComponent` (destructive action, Nielsen error prevention) |
| FQ4 | Directory results already enrolled/requested: hide or badge? | answered | Badge **Já matriculado** / **Solicitado**, button hidden (recognition over recall) |
| FQ5 | Form fields for **Enroll new user**? | open | Options: (A) name + email only (username auto-derived); (B) name + email + username; (C) email only |
| FQ6 | What does “activate the account” mean? | open | Options: (A) **Reuse Passport create** — welcome email with temporary password, account login-ready immediately; (B) **New Passport activation** — disabled until student sets password via email link; (C) create user + trigger password-reset email as the “activation” step |
| FQ7 | Keep **Matricular aluno** (Passport search) and add **Enroll new user** as a second section? | open | Default proposal: yes — both on the students page |
| FQ8 | If email already exists in Passport? | open | Options: (A) enroll existing user and skip create; (B) show error “já existe — use Matricular aluno”; (C) enroll existing after confirm |
| FQ9 | UI label language? | open | Request used English “Enroll new user”; rest of screen is PT-BR (**Matricular aluno**). Prefer **Matricular novo usuário** / **Matricular novo aluno**? |
| FQ10 | Which emails does the student receive? | open | Options: (A) Passport activation/welcome only; (B) Passport + Learn enrollment invitation; (C) single combined Learn email (Passport still must notify credentials/activation somehow) |

### Architecture questions (AQ*n*)

| # | Question | Status | Answer |
|---|----------|--------|--------|
| AQ1 | Where do PT-BR status labels live? | answered | Component-level mapping function (same pattern as `home.component.ts` `enrollmentLabel()`); no i18n framework yet |
| AQ2 | New status badge styles? | answered | Extend gallery `.status-badge` with `--requested`, `--enrolled`, `--rejected` variants in `styles.scss` |
| AQ5 | How does Learn create Passport users without teacher `passport.admin`? | open | Options: (A) Passport **internal** `POST /internal/users` (service key); (B) new authenticated peer endpoint for trusted apps; (C) Learn service account with `passport.admin` calling `POST /users` |
| AQ6 | Passport `profileIds` for a plain student? | open | Options: (A) make `profileIds` optional on create; (B) seed a zero-role **Learner** profile and assign it; (C) create with empty profiles via new invite API |
| AQ7 | Single Learn endpoint that creates Passport user + enrolls, or UI calls two APIs? | open | Proposal: one Learn endpoint (teacher-only) orchestrates Passport provision then `EnrollmentService.directEnroll` |
| AQ8 | Username uniqueness when auto-derived (if FQ5=A)? | open | Proposal: derive from email local-part, sanitize to Passport rules (4–15 chars), suffix on collision |

## Architecture

### v1 (done)

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

### v2 (draft — blocked on FQ5–FQ10 / AQ5–AQ8)

| Area | Design |
|------|--------|
| Bounded contexts | Enrollment owns orchestration; Passport remains external identity |
| Happy path | Teacher submits form → Learn creates/ensures Passport user → Learn creates **ENROLLED** → student gets activation/welcome email (per FQ6/FQ10) |
| Layer map (proposed) | `EnrollNewUserEndpoint` → `EnrollmentService.enrollNewUser` → `PassportRestClient` (create/invite) + enrollment persist + optional `MailerService` |
| Auth | Course teacher only (`requireTaughtBy`), same as direct enroll |
| Passport change | Required unless Learn already has a service identity with `passport.admin` and FQ6=A is accepted |
| Frontend | New form section on `course-students`; OpenAPI codegen after endpoint lands |
| Tests | `@QuarkusTest` for provision+enroll + conflict cases; Angular form validation/success/error; Passport tests if new API |

## Changelog

### 2026-07-21 — Enroll new user (Passport provision)

**Status:** `planned`

**Impact on other features:** Extends enrollment admin students page; requires Passport capability for peer/user create or activation (cross-repo). Does not change student self-request flow. Account-settings / login remain Passport-owned.

**Feature checklist:**

- [ ] **FC1** Students page offers **Enroll new user** form (FQ7, FQ9) separate from Passport search
- [ ] **FC2** Teacher can enroll a student who has no Passport account; Passport user is created as part of the flow
- [ ] **FC3** Student receives email to activate / set access per FQ6 and FQ10
- [ ] **FC4** Existing Passport users still enrollable via **Matricular aluno** (directory)
- [ ] **FC5** Email-already-exists behaviour matches FQ8
- [ ] **FC6** Enrollment row is **ENROLLED** with denormalized student identity fields
- [ ] **FC7** Only the course teacher can enroll new users
- [ ] **FC8** Domain spec, feature catalog, ARCHITECTURE (Learn + Passport if changed) updated
- [ ] **FC9** Wireframe regions match the students page after implementation

**Tasks:** _(phase 3 — after FQ/AQ resolved)_

**Test coverage:** _(phase 3 — after FQ/AQ resolved)_

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
