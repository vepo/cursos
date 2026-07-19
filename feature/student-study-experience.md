# Student study experience & teacher area

**Feature version:** 4  
**Status:** in-progress  
**Requested:** 2026-07-18

## Summary

Make the default SPA **student-first**: catalog home focuses on learning (**Matriculado**, **Disponível / Solicitado**). All **teacher** authoring and roster tools live under a **Teacher area** at `/teacher`.

Add a shell **navigation menu** (at most **two levels**) with groups **Aprender**, **Ensinar**, and **Admin** that reaches **every** product feature. Features may be organized in **menu groups** (level 1) with leaf links (level 2), or as top-level leaves when a group is unnecessary.

**Course study** (student): left **lesson tree** listing each ordered **course item** (UI **Aula**); completed aulas show a check; an aula is **accessible only when all previous aulas are completed** (sequential unlock). **Markdown items** render as **HTML** in study view; raw markdown is only for **create/edit**.

Each accessible **aula** has a discussion area for enrolled students and the course teacher. Users may post **comments** and toggle one **upvote** per comment; downvotes do not exist. The teacher may hide and restore comments; students cannot see hidden comments. Author edit/delete is out of scope for v1.

## Wireframe

| Field | Value |
|-------|-------|
| **Source** | ASCII below |
| **Last updated** | 2026-07-18 |

### Shell: navigation menu (≤ 2 levels)

| Region | Elements |
|--------|----------|
| Brand | **Cursos** → `/` |
| **Navigation menu** | Horizontal on desktop; hamburger drawer on mobile; menu groups contain leaf items |
| User | Email + **Sair** |

**Menu groups:** **Aprender**, **Ensinar**, **Admin**. **Ensinar** is visible to every authenticated user. **Admin** contains **Categorias** and is visible only with Passport JWT group `cursos.admin`; the category API enforces the same role.

| Level 1 | Level 2 | Route | Notes |
|---------|---------|-------|-------|
| **Aprender** | Catálogo | `/` | Student catalog home |
| **Aprender** | Meus cursos | `/#matriculado` | Enrolled courses |
| **Ensinar** | Meus cursos | `/teacher` | Teacher area list |
| **Ensinar** | Novo curso | `/teacher/courses/new` | Create course |
| **Ensinar** | *(per-course tools)* | via course pages | Edit / Alunos / Progresso stay on course screens, not every course in the menu |
| **Admin** | Categorias | `/admin/categories` | Category CRUD; requires `cursos.admin` |

```
┌─────────────────────────────────────────────────────────────┐
│  Cursos   Aprender ▼   Ensinar ▼   Admin ▼      user Sair   │
│           ├ Catálogo   ├ Meus cursos  ├ Categorias          │
│           └ Meus cursos├ Novo curso                         │
└─────────────────────────────────────────────────────────────┘
```

Rule: **no third level** — groups contain only leaves; leaves never nest.

### Screen: `/` — student catalog home

| Region | Elements |
|--------|----------|
| Shell | Brand + **navigation menu** (above) |
| Sections | **Matriculado**; **Disponível / Solicitado**; no **Ensinando** section |
| Cards | Title, categories, progress % when enrolled; **Solicitar matrícula** |

```
┌─────────────────────────────────────────────────────────────┐
│  Cursos   Aprender ▼   Ensinar ▼   Admin ▼      user Sair   │
├─────────────────────────────────────────────────────────────┤
│  Matriculado                                                │
│  ┌──────────────┐                                           │
│  │ Quarkus 101  │  ████████░░░░  67%                        │
│  └──────────────┘                                           │
│  Disponível / Solicitado                                    │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │ Angular SPA  │  │ Docker       │  [ Solicitado ]         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

### Screen: `/teacher` — teacher area (course list)

| Region | Elements |
|--------|----------|
| Header | **Meus cursos** + **Novo curso** |
| List | Courses the user teaches; links to edit / alunos / progresso |

```
┌─────────────────────────────────────────────────────────────┐
│  Área do professor                    [ Novo curso ]        │
├─────────────────────────────────────────────────────────────┤
│  Intro Quarkus   [ Editar ] [ Alunos ] [ Progresso ]        │
│  Rascunho UI     [ Editar ]                                 │
└─────────────────────────────────────────────────────────────┘
```

### Screen: `/courses/:id` — course overview (before aulas)

| Region | Elements |
|--------|----------|
| Left tree | **Visão geral** (selected) above ordered aulas with state icons |
| Main | **Sobre o curso** + **Sobre o autor** only — no aula content |

```
┌──────────────┬──────────────────────────────────────────────┐
│ Aulas        │  Sobre o curso          Sobre o autor        │
│ ▶ Visão geral│  [capa]                 Ana                  │
│ ○ 1. Intro   │  Resumo…                Descrição…           │
│ 🔒 2. Setup  │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

### Screen: `/courses/:id/lessons/:itemId` — selected aula

| Region | Elements |
|--------|----------|
| Left tree | **Visão geral** (not selected) + ordered **aulas**; state icons: ✓ completed, ▶ current, ○ accessible, 🔒 locked |
| Main | Selected aula content only — **Sobre o curso** / **Sobre o autor** are **hidden** |
| Actions | **Concluir** marks the aula complete and opens the next aula; on the final aula, remain on the completed aula |
| Discussion | Aula comments, one-way **upvote**, and teacher **hide** action |

```
┌──────────────┬──────────────────────────────────────────────┐
│ Aulas        │  Aula 3 — Injeção de dependência             │
│ ○ Visão geral│                                              │
│ ✓ 1. Intro   │  <rendered HTML from markdown>               │
│ ✓ 2. Setup   │                                              │
│ ▶ 3. DI      │                          [ Concluir aula ]   │
│ 🔒 4. REST   │  Comentários                                 │
│              │  Ana: Excelente exemplo!  [▲ 4]              │
│              │  [ Escreva um comentário… ] [ Publicar ]     │
└──────────────┴──────────────────────────────────────────────┘
```

Return to overview: click **Visão geral** or navigate to `/courses/:id` (e.g. course title in the page header).

### Screen: `/teacher/courses/:id/edit` — markdown edit (unchanged intent)

Raw markdown editor / media upload — not HTML preview as primary edit surface (optional live preview later).

## Feature questions (FQ)

| ID | Question | Status | Answer |
|----|----------|--------|--------|
| **FQ1** | Should the catalog home **remove** the **Ensinando** section entirely (teachers only manage courses under `/teacher`), or keep a compact link/card pointing to `/teacher`? | answered | Remove **Ensinando**; teaching management lives under `/teacher`. |
| **FQ2** | Sequential unlock: enforce on the **API** (403 when reading/updating a locked aula) as well as UI, or **UI-only** for MVP? | answered | Enforce in API and UI; inaccessible aula content/progress/comment operations return 403. |
| **FQ3** | May a student **un-complete** an aula? If yes, do later aulas become locked again until re-completed? | answered | Yes via **Rollback progress** (**Desfazer progresso**): clears the selected aula **and every later aula**; earlier aulas stay complete; later aulas relock. |
| **FQ4** | When the **teacher** opens the study view of their own course, do they **bypass** sequential lock (preview all aulas)? | answered | Yes; the course teacher can preview every aula. |
| **FQ5** | Confirm UI term for a course item in the tree: **Aula** (pt-BR)? (Domain code remains **course item**.) | answered | Yes: UI **Aula**; code/domain entity `CourseItem`. |
| **FQ6** | Teacher routes: prefer `/teacher`, `/teacher/courses/new`, `/teacher/courses/:id/edit`, `/teacher/courses/:id/students`, `/teacher/courses/:id/progress` (redirect old `/courses/.../edit` paths)? | answered | Adopt `/teacher/*`; no legacy redirects because Cursos is not in production. |
| **FQ7** | First aula is always unlocked; unlock rule is “all **previous** by item order completed” — confirm. | answered | Confirmed. |
| **FQ8** | Confirm **navigation menu** model: at most **two levels** = optional **menu group** → leaf **menu items** only (no nested groups). Every user-facing feature reachable from the menu (course-specific edit/alunos/progresso via **Ensinar → Meus cursos** then in-page actions — OK?). | answered | Confirmed; course-specific actions are reached from **Ensinar → Meus cursos**. |
| **FQ9** | Confirm **menu groups / items** for MVP. Proposal: **Início** (leaf `/`); **Ensinar** group → Meus cursos, Novo curso, Categorias. Is a separate **Aprender** group needed, or is **Início** enough for student features? | answered | **Aprender**, **Ensinar**, and **Admin** (admin actions). No standalone **Início** leaf — catalog lives under **Aprender**. |
| **FQ10** | Should the **Ensinar** group always be visible to every authenticated user (anyone can become a teacher by creating a course), or only after the user already teaches at least one course? | answered | Always visible to authenticated users. |
| **FQ11** | Mobile: collapse the navigation menu into a **hamburger drawer**, or keep a compact horizontal scroll? | answered | Hamburger drawer. |
| **FQ12** | Who may comment and upvote: only **enrolled students and the course teacher**, or any authenticated user who can preview the course? | answered | Enrolled students and the course teacher only. |
| **FQ13** | Is an upvote limited to **one per user per comment**, with a second click removing it (toggle)? | answered | Yes; one per user/comment, toggled off by a second click. |
| **FQ14** | When a teacher hides a comment, should students see nothing, a “comment hidden” placeholder, or the hidden content only to its author? | answered | Students **cannot see** a hidden comment (omit from student list/API — no placeholder, no author exception). |
| **FQ15** | May a teacher **restore** a hidden comment? May comment authors edit or delete their own comments? | answered | Teacher may restore; authors cannot edit or delete comments in v1. |
| **FQ16** | Are comments allowed only after the aula is **unlocked**, and do they remain readable if that aula becomes locked again? | answered | List/create/upvote only while accessible. Preserve comments when relocked, but hide them until the aula unlocks again. |
| **FQ17** | **Admin** menu (**FQ9**): which leaf items belong under **Admin**, and who may see the group (Passport JWT role vs always hidden until a platform-admin feature exists)? | answered | **Categorias** under `/admin/categories`; show only for Passport JWT group `cursos.admin`, and enforce that role in the API. |
| **FQ18** | After opening an aula, how does the student return to **Sobre o curso** / **Sobre o autor**? | answered | Both: sidebar leaf **Visão geral** above the aulas **and** navigating to `/courses/:id` (course title / root URL). |
| **FQ19** | Should `/courses/:courseId` (no lesson id) show the overview only and **not** auto-open the first accessible aula? | answered | Yes — course root shows overview only; aulas open only via tree selection or lesson routes. |

## Impact

| Area | Change |
|------|--------|
| Domain | Sequential unlock; UI **Aula**; **Teacher area**; menu groups **Aprender** / **Ensinar** / **Admin**; **Comment**, **Upvote**, **Hidden comment** (invisible to students) |
| API | Study/accessibility response; 403 enforcement; comment list/create/upvote; teacher hide/restore; `cursos.admin` category authorization |
| UI | Three menu groups; role-gated **Admin**; `/teacher/*`; lesson tree; markdown → HTML; aula discussion; no student placeholder for hidden comments |
| Schema | New comment and comment-upvote tables; hide/moderation metadata |
| Dev seed | Passport `cto-boss` receives `cursos.admin`; Cursos data includes sequential progress and discussions |
| Tests | Menu groups/role visibility; unlock and relock rules; HTML rendering; discussion authorization/upvote/moderation |
| Docs | Domain spec, feature catalog (menu map), ARCHITECTURE routes |

## Architecture

### Layer and package flow

- Study access: `*Endpoint → StudyService → CourseItemRepository + EnrollmentRepository + ProgressRepository`.
- Discussion: `*Endpoint → CommentService → CommentRepository + CommentUpvoteRepository`; `CommentService` delegates accessibility checks to `StudyService`.
- Categories remain in `category`; create/update endpoints use `@RolesAllowed("cursos.admin")`. Listing remains authenticated because catalog filters need categories.
- Angular: shell `NavMenuComponent` uses declarative groups and JWT group visibility; `TeacherHomeComponent`; existing teacher screens move under `/teacher/*`; `CourseViewComponent` shows one selected aula and a lesson tree.
- After a successful completion update, `CourseViewComponent` reloads the study tree, selects the next item by `sortOrder`, and navigates to its canonical lesson route. If no next item exists, it keeps the completed final aula selected.
- Course root `/courses/:courseId` loads the study tree but does **not** auto-select an aula; main shows overview panels only. Lesson routes select the aula and hide overview. Sidebar **Visão geral** and the course title navigate to the course root.
- Markdown rendering uses an Angular-compatible renderer and sanitizes generated HTML before display.

### Routes

| Route | Purpose / access |
|-------|------------------|
| `/` | Student catalog: **Matriculado**, **Disponível / Solicitado** |
| `/courses/:courseId` | Study **overview** (**Sobre o curso** / **Sobre o autor**); enrolled student or teacher |
| `/courses/:courseId/lessons/:itemId` | Selected aula; overview hidden; enrolled student if unlocked, or course teacher |
| `/teacher` | Courses taught by current user |
| `/teacher/courses/new` | Create course; authenticated |
| `/teacher/courses/:courseId/edit` | Teacher editor |
| `/teacher/courses/:courseId/students` | Enrollment management |
| `/teacher/courses/:courseId/progress` | Student progress management |
| `/admin/categories` | Category administration; `cursos.admin` |

No redirects are retained for old `/courses/new`, `/courses/:id/edit`, `/courses/:id/students`, `/courses/:id/progress`, or `/categories` UI routes.

### API changes

| Method | Path | Rule |
|--------|------|------|
| GET | `/courses/{courseId}/study` | Aula tree with completed/locked state; enrolled student or teacher |
| GET | `/courses/{courseId}/items/{itemId}` | Content; 403 when locked; teacher bypasses lock |
| POST | `/enrollments/{id}/progress/{itemId}` | Toggle complete; locked item returns 403; un-complete may relock later items |
| GET/POST | `/courses/{courseId}/items/{itemId}/comments` | Accessible aula; enrolled student or teacher |
| POST | `/comments/{commentId}/upvote` | Toggle caller's unique upvote |
| POST | `/comments/{commentId}/hide` | Course teacher only |
| POST | `/comments/{commentId}/restore` | Course teacher only |
| POST | `/categories` and `/categories/{id}` | `cursos.admin` |

### Schema

- `tb_comments`: course item, author identity, content, created timestamp, hidden timestamp, moderator identity.
- `tb_comment_upvotes`: comment, voter identity, created timestamp; unique `(comment_id, voter_identity_id)`.
- Foreign keys preserve comments/upvotes; hidden comments are retained. No author edit/delete fields or endpoints in v1.

### Testing and dev data

- Backend integration tests cover access/relock, teacher bypass, comment authorization, hidden filtering, restore, and unique toggle.
- Angular tests cover menu hierarchy/roles, teacher routes, aula tree, sanitized markdown, and discussion behavior.
- Dev data includes incomplete/complete sequential aulas, comments/upvotes/hidden comments, and `cto-boss` with `cursos.admin`.

## Changelog

### 2026-07-19 — Course completion, rollback, and certificates

**Status:** `done`

**Development approval:** approved 2026-07-19 — tasks: T23, T24, T25, T26, T27, T28, T29, T30  
(Plan implementation: Course Completion and Certificates)

**Scope:**
1. Completed aula CTA becomes **Desfazer progresso**; after confirmation, cascade-clears that aula and all later progress.
2. Study sidebar shows progress percentage (completed/total).
3. Completing the final aula replaces main content with a **finish screen**; **Download certificate** issues a server PDF.
4. Catalog enrolled cards show **Concluído** when enrollment is fully complete (`concluded_at` set).

**Impact on other features:** Revises FQ3 / Progress invariant 5 (cascade clear instead of storing later completions). Adds `concluded_at` on enrollments. New certificate download API. Study/catalog response fields. OpenPDF dependency.

**Architecture:**
- Schema: `tb_enrollments.concluded_at TIMESTAMPTZ NULL` — set on reaching 100%, cleared on rollback below 100% (latest completion date).
- `ProgressService.updateItemProgress`: on `completed:false`, clear selected + later rows; sync `concluded_at`.
- `StudyResponse` adds `completedItems`, `totalItems`, `percentComplete`, `concluded`, `concludedAt`.
- `CatalogCourseResponse` adds progress/concluded fields for enrolled section.
- `GET /api/courses/{courseId}/certificate` → `DownloadCertificateEndpoint` → `CertificateService` (OpenPDF on demand).
- Angular: rollback CTA + confirm; sidebar progress; finish screen replaces final aula; Blob download; catalog **Concluído** badge.

**Feature checklist:**

- [x] **FC21** Completed aula shows **Desfazer progresso**; incomplete shows **Concluir aula**.
- [x] **FC22** Rollback confirms, clears selected + later aulas, relocks later aulas.
- [x] **FC23** Study sidebar shows progress bar / percentage.
- [x] **FC24** At 100% completion, finish screen replaces aula content.
- [x] **FC25** Finish screen offers certificate PDF download when concluded.
- [x] **FC26** Catalog enrolled card shows **Concluído** when concluded; clears after rollback.
- [x] **FC27** Domain/ARCHITECTURE/feature-catalog/README updated.

**Tasks:**

- [x] **T23** Schema + `Enrollment.concludedAt` + sync on progress update.
- [x] **T24** Cascade clear on progress rollback in repository/service + update study accessibility tests.
- [x] **T25** Extend `StudyResponse` / study tree with progress + concluded fields.
- [x] **T26** Extend catalog enrolled projection with concluded/progress fields.
- [x] **T27** `CertificateService` + `DownloadCertificateEndpoint` + OpenPDF + tests.
- [x] **T28** Angular: rollback CTA, confirm dialog, sidebar progress, finish screen, certificate download.
- [x] **T29** Angular: catalog **Concluído** badge + specs.
- [x] **T30** Regenerate API client, docs, seed, full verify.

**Test coverage:**

- [x] **TC14** Cascade rollback clears later completions and relocks.
- [x] **TC15** Conclusion set/cleared with 100% / rollback.
- [x] **TC16** Certificate download allowed only when concluded; PDF headers/magic.
- [x] **TC17** Study API exposes progress percentage and concluded.
- [x] **TC18** Catalog enrolled includes concluded flag.
- [x] **TC19** Angular: rollback, progress bar, finish screen, certificate, catalog badge.

**Implementation notes:** OpenPDF on-demand PDF; enrollment status remains `ENROLLED` when concluded; finish screen replaces aula panel at 100%.

### 2026-07-19 — Course overview before first aula

**Status:** `done`

**Development approval:** approved 2026-07-19 — tasks: T21, T22

**Scope:** **Sobre o curso** and **Sobre o autor** appear as the course **Visão geral** overview **before** any aula is selected (**FQ19**). While an aula is open (`/courses/:id/lessons/:itemId`), those panels are **hidden**. Return via sidebar **Visão geral** and by navigating to `/courses/:id` / course title (**FQ18** option 3).

**Impact on other features:** `CourseViewComponent` stops auto-selecting the first accessible aula on course root. Catalog / card links to `/courses/:id` land on overview. Advance-after-complete stays on lesson routes (overview stays hidden). Domain term **Visão geral** added.

**Architecture:** Angular-only. No API/schema change.
- `loadStudy(null)` loads the tree without selecting an aula; clears `selectedAula` / `selectedAulaId`.
- Template: `@if (!selectedAula)` for overview; `@if (selectedAula)` for aula content + discussion.
- Sidebar: **Visão geral** button first → `router.navigate(['/courses', courseId])`.
- Course title (or equivalent header control) also navigates to course root.
- When `paramMap` has no `itemId`, clear selection and show overview (including when returning from a lesson).

**Feature checklist:**

- [x] **FC16** Overview panels show when no aula is selected.
- [x] **FC17** Overview panels are hidden while viewing an aula.
- [x] **FC18** `/courses/:courseId` shows overview and does not auto-open the first aula (**FQ19**).
- [x] **FC19** Student can return via **Visão geral** sidebar leaf and via `/courses/:id` / course title (**FQ18**).
- [x] **FC20** Wireframe: **Visão geral** above aulas; overview vs lesson main regions match.

**Tasks:**

- [x] **T21** Stop auto-selecting an aula on course root; clear selection when `itemId` is absent; show overview only when no aula is selected and hide it on lesson routes.
- [x] **T22** Add **Visão geral** sidebar entry and course-title (or header) navigation to `/courses/:id`.

**Test coverage:**

- [x] **TC11** Course root shows overview, no aula content, and does not call study-item load for auto-selection.
- [x] **TC12** Lesson route hides overview and shows aula content.
- [x] **TC13** **Visão geral** and course-title navigation return to overview (clear selection / navigate to course root).

**Implementation notes:** `openOverview()` + `clearAulaSelection()`; course root never auto-selects; lesson routes select via `itemId`.

### 2026-07-19 — Aula tree state icons and colors

**Status:** `done`

**Development approval:** approved 2026-07-19 — tasks: T20

**Scope:** Make locked vs unlocked aulas visually unambiguous in the left aula tree using **both** color and an icon per state: **completed** ✓ `check_circle` (accent green), **current** ▶ `play_arrow` (accent), **accessible** ○ `radio_button_unchecked` (default text), **locked** 🔒 `lock` (muted). Icons are decorative (`aria-hidden`); accessibility state stays on `aria-disabled` / `data-aula-state`.

**Impact on other features:** None identified — Angular study UI only (template + styles + specs). No API, schema, or seed change.

**Feature checklist:**

- [x] **FC13** Every aula row renders a state icon matching `data-aula-state` (completed/current/accessible/locked).
- [x] **FC14** Locked rows are visually muted with a lock icon; unlocked rows use accent/default colors — distinction by color **and** icon.
- [x] **FC15** Icons are `aria-hidden`; locked rows keep `aria-disabled="true"`.

**Tasks:**

- [x] **T20** Add per-state Material icons and state colors to the aula tree in `CourseViewComponent` (template + styles).

**Test coverage:**

- [x] **TC10** Angular tests assert each state renders its icon and locked/unlocked styling remains token-based.

**Implementation notes:** `aulaStateIcon()` maps state → Material `fontIcon`; icons inherit row color via `.aula-icon { color: inherit }`.

### 2026-07-18 — Advance after completing an aula

**Status:** `done`

**Development approval:** approved 2026-07-19 — tasks: T19

**Scope:** When an enrolled student selects **Concluir aula**, persist completion, reload the study tree, and automatically open the next aula in item order. Completing the final aula keeps the student on that completed aula.

**Impact on other features:** No API, schema, seed, or backend-domain change. The Angular study flow and its route-navigation tests change.

**Feature checklist:**

- [x] **FC10** Successful **Concluir aula** advances to the next ordered aula.
- [x] **FC11** Completing the final aula remains on that aula without invalid navigation.
- [x] **FC12** Progress failure does not navigate away from the current aula.

**Tasks:**

- [x] **T19** Update `CourseViewComponent` completion flow to select and navigate to the next aula after the refreshed study tree is available, with final-aula and failure fallbacks.

**Test coverage:**

- [x] **TC9** Angular component tests verify next-aula navigation, final-aula behavior, and no navigation on progress failure.

**Implementation notes:** `completeAula()` reloads the study tree with `advanceAfterCompletion`; the next accessible aula is opened via `openAula` (route + selection). No next aula or a progress error keeps the current selection.

### 2026-07-18 — T11–T18 implemented

**Status:** `done`

**Delta:** Sequential study API/UI, grouped navigation + teacher/admin routes, aula discussion with upvote/hide/restore, `cursos.admin` category writes, Passport/Cursos seed and docs.

### 2026-07-18 — Remaining FQs answered; architecture and tasks ready

**Status:** `tasks-ready`

**Delta:** Accepted defaults for **FQ1–FQ8**, **FQ10–FQ13**, **FQ15–FQ17**. Added concrete routes, API/schema design, role enforcement, dev data, tasks, and tests.

**Impact on other features:** Catalog loses **Ensinando**; teacher UI routes move without redirects; category writes require new Passport group `cursos.admin`; progress and course-item reads gain sequential-access rules.

### 2026-07-18 — FQ9 / FQ14 answered

**Status:** `planned`

**Delta:** Menu groups are **Aprender**, **Ensinar**, **Admin**. Hidden comments are omitted for students (no placeholder). Opened **FQ17** for Admin leaves and visibility.

**Impact on other features:** Feature catalog navigation shell and domain menu terms must list the three groups; comment API/UI must not leak hidden content to students.

### 2026-07-18 — Aula comments and upvotes added

**Status:** `planned`

**Delta:** Add comments per aula, upvote-only voting, and teacher comment hiding. Opened **FQ12–FQ16**. This changes API and schema scope and adds discussion/moderation UI to the study view.

### 2026-07-18 — Navigation menu scope added

**Status:** `planned`

**Delta:** Require a **navigation menu** with at most two levels and **menu groups** so users can reach all features. Opened **FQ8–FQ11**. Updated wireframe and impact (domain terms for menu; SPA config, not schema).

**Impact on other features:** Replaces ad-hoc header links (**Novo curso**, **Categorias**) from MVP shell with structured menu.

### 2026-07-18 — Feature analysis opened

**Status:** `planned`

**Impact on other features:** Supersedes MVP catalog “three sections including Ensinando on home” UX from [cursos-platform.md](cursos-platform.md); study view currently dumps all items as raw markdown `<pre>`.

## Feature checklist

| ID | Criterion | Done |
|----|-----------|------|
| FC1 | Catalog home is student-first and omits **Ensinando** | ☑ |
| FC2 | Two-level responsive menu exposes **Aprender**, **Ensinar**, role-gated **Admin** | ☑ |
| FC3 | Teacher workflows use `/teacher/*`; category admin uses `/admin/categories` | ☑ |
| FC4 | API and UI enforce sequential unlock, relock on un-complete, and teacher bypass | ☑ |
| FC5 | Study shows an aula tree and sanitized rendered markdown | ☑ |
| FC6 | Only enrolled students and teacher can discuss an accessible aula | ☑ |
| FC7 | Upvote is unique per user/comment and toggles | ☑ |
| FC8 | Teacher can hide/restore; students never receive hidden comments | ☑ |
| FC9 | Category writes and Admin menu require `cursos.admin` | ☑ |
| FCdev | Dev personas/data exercise menu roles, sequential study, and moderation | ☑ |

## Tasks

| ID | Task | Covers | Done |
|----|------|--------|------|
| T11 | Add `StudyService` accessibility model and API enforcement | FC4 | ☑ |
| T12 | Build aula-tree study UI with sanitized markdown rendering | FC4, FC5 | ☑ |
| T13 | Add responsive grouped menu and relocate teacher/admin routes | FC1–FC3 | ☑ |
| T14 | Add comment/upvote schema, entities, and repositories | FC6–FC8 | ☑ |
| T15 | Add discussion service/endpoints with access, toggle, hide, restore rules | FC6–FC8 | ☑ |
| T16 | Add aula discussion and moderation UI | FC6–FC8 | ☑ |
| T17 | Enforce `cursos.admin` for category writes and seed the Passport role/persona | FC9 | ☑ |
| T18 | Update Cursos dev seed and final architecture/domain/catalog documentation | FCdev | ☑ |

## Test coverage

| ID | Test | Covers | Done |
|----|------|--------|------|
| TC1 | Study service/endpoint: first unlock, preceding completion, 403, relock, teacher bypass | T11 | ☑ |
| TC2 | Angular study: tree states, navigation, completion, sanitized markdown | T12 | ☑ |
| TC3 | Angular shell/routes: menu depth, mobile drawer, visibility, reachability, no old routes | T13, T17 | ☑ |
| TC4 | Persistence: comment relations and unique upvote constraint | T14 | ☑ |
| TC5 | Discussion endpoints: enrollment/teacher access, locked aula, toggle | T15 | ☑ |
| TC6 | Moderation: hide/restore authorization and student hidden filtering | T15, T16 | ☑ |
| TC7 | Category API rejects non-admin writes and accepts `cursos.admin` | T17 | ☑ |
| TC8 | Full `./mvnw -B clean test` including Angular production build/tests | T11–T18 | ☑ |

## Implementation notes

- Backend contexts: `study`, `discussion`; progress lock via `StudyService`.
- Angular: shell menu model, teacher/admin routes, CourseView tree + discussion, conservative markdown renderer.
- Passport seed: role/profile `cursos.admin` assigned to `cto-boss`.
- Cursos seed: three Quarkus aulas, junior enrollment/progress, visible+hidden comments, upvote, second published course for catalog availability.

## Development approval

**Development approval:** approved 2026-07-18 — tasks: T11, T12, T13, T14, T15, T16, T17, T18
