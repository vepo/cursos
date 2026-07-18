# Student study experience & teacher area

**Feature version:** 1  
**Status:** done  
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

### Screen: `/courses/:id` (or `/courses/:id/lessons/:itemId`) — student study

| Region | Elements |
|--------|----------|
| Left tree | Ordered **aulas**; ✓ if completed; locked icon if previous incomplete |
| Main | Selected aula content: **HTML** for markdown; image/video for media |
| Actions | **Concluir** (mark complete) when enrolled and aula unlocked |
| Discussion | Aula comments, one-way **upvote**, and teacher **hide** action |

```
┌──────────────┬──────────────────────────────────────────────┐
│ Aulas        │  Aula 3 — Injeção de dependência             │
│ ✓ 1. Intro   │                                              │
│ ✓ 2. Setup   │  <rendered HTML from markdown>               │
│ ▶ 3. DI      │                                              │
│ 🔒 4. REST   │                          [ Concluir aula ]   │
│              │  Comentários                                 │
│              │  Ana: Excelente exemplo!  [▲ 4]              │
│              │  [ Escreva um comentário… ] [ Publicar ]     │
└──────────────┴──────────────────────────────────────────────┘
```

### Screen: `/teacher/courses/:id/edit` — markdown edit (unchanged intent)

Raw markdown editor / media upload — not HTML preview as primary edit surface (optional live preview later).

## Feature questions (FQ)

| ID | Question | Status | Answer |
|----|----------|--------|--------|
| **FQ1** | Should the catalog home **remove** the **Ensinando** section entirely (teachers only manage courses under `/teacher`), or keep a compact link/card pointing to `/teacher`? | answered | Remove **Ensinando**; teaching management lives under `/teacher`. |
| **FQ2** | Sequential unlock: enforce on the **API** (403 when reading/updating a locked aula) as well as UI, or **UI-only** for MVP? | answered | Enforce in API and UI; inaccessible aula content/progress/comment operations return 403. |
| **FQ3** | May a student **un-complete** an aula? If yes, do later aulas become locked again until re-completed? | answered | Yes; later aulas relock until all preceding aulas are complete again. |
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
- Markdown rendering uses an Angular-compatible renderer and sanitizes generated HTML before display.

### Routes

| Route | Purpose / access |
|-------|------------------|
| `/` | Student catalog: **Matriculado**, **Disponível / Solicitado** |
| `/courses/:courseId` | Study shell; selects first accessible aula |
| `/courses/:courseId/lessons/:itemId` | Selected aula; enrolled student if unlocked, or course teacher |
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
