# Feature catalog

UI feature index for Cursos. Update when routes, menu items, or primary user flows change (see [.cursor/rules/feature-catalog.mdc](../.cursor/rules/feature-catalog.mdc)).

Authentication uses **Passport JWT**. Login obtains token from Passport (`:8080`); Cursos SPA stores Bearer token and calls Cursos API (`:8083`).

| Feature | Route | Roles | Steps (happy path) |
|---------|-------|-------|-------------------|
| Login | `/login` | public | Open Cursos → enter Passport email/password → JWT stored → catalog home |
| Catalog home | `/` | authenticated | Open the top-right menu icon → **Aprender → Catálogo** → filter with the left **Categorias** sidebar → browse **Ensinando** (taught courses), **Matriculado**, and **Disponível / Solicitado** |
| Course study | `/courses/:courseId` or `/courses/:courseId/lessons/:itemId` | enrolled student or course teacher | Open enrolled course → left **aula** tree → open unlocked aula → read sanitized HTML / media → **Concluir aula** → **Comentar** |
| Minha conta | `/account` | authenticated | Header name or menu **Conta → Minha conta** → edit name/email/author description → change password |
| Request enrollment | `/` card or course preview | authenticated | **Disponível / Solicitado** → **Solicitar matrícula** |
| Teacher area | `/teacher` | authenticated | Open the top-right menu icon → **Ensinar → Meus cursos** → choose a course → **Publicar curso** / **Despublicar** / Editar / Alunos / Progresso |
| Create course | `/teacher/courses/new` | authenticated | Open the top-right menu icon → **Ensinar → Novo curso** → save → editor |
| Course edit | `/teacher/courses/:courseId/edit` | course teacher | Left item list → edit details/items → **Publicar curso** / **Despublicar**; unsaved changes warn on switch/leave |
| Enrollment admin | `/teacher/courses/:courseId/students` | course teacher | Approve/reject requests; **Matricular aluno** |
| Progress admin | `/teacher/courses/:courseId/progress` | course teacher | Review student completion |
| Category admin | `/admin/categories` | `cursos.admin` | Open the top-right menu icon → **Admin → Categorias** → create categories |

## Navigation shell

Authenticated navigation is a right-anchored, two-level drawer behind the top-right header **menu icon**. It is closed by default at every breakpoint and closes through the toggle, a leaf link, or Escape; Escape returns focus to the toggle. On narrow viewports the drawer spans the viewport width. The header keeps the Cursos brand, display name (**Minha conta**), **Sair**, and menu icon in that order; unauthenticated users see **Entrar** without the drawer. See [ui-visual-shell.md](../feature/ui-visual-shell.md).

| Group | Leaf | Route | Access |
|-------|------|-------|--------|
| **Aprender** | Catálogo | `/` | authenticated |
| **Aprender** | Meus cursos | `/#matriculado` | authenticated |
| **Ensinar** | Meus cursos | `/teacher` | authenticated (always visible in menu) |
| **Ensinar** | Novo curso | `/teacher/courses/new` | authenticated |
| **Conta** | Minha conta | `/account` | authenticated |
| **Admin** | Categorias | `/admin/categories` | Passport JWT group `cursos.admin` |

Visual shell layout zones:

| Screen | Sidebar | Main |
|--------|---------|------|
| Catalog `/` | Category filter; hide/show control on narrow viewports | Matriculado + Disponível / Solicitado |
| Study | Aula tree; **Aulas** hide/show control on narrow viewports | Selected aula + discussion |
| Teacher `/teacher` | Teaching course list + **Novo curso**; stacks above main on narrow viewports | Selected course details + publish/unpublish + Editar / Alunos / Progresso |
| Course edit | Course details + ordered items | Selected form (details or markdown item) |
| Nested teacher/admin pages | None | Page title and actions inside main; no second Material toolbar |

## Catalog home sections

| Section | Content | Empty state |
|---------|---------|-------------|
| **Matriculado** | Courses with **ENROLLED** enrollment | "Nenhuma matrícula ativa" |
| **Disponível / Solicitado** | Published courses not taught by user; badge **Solicitado** when REQUESTED | "Nenhum curso disponível" |

Teaching courses live under **Ensinar → Meus cursos**, not on the catalog home.

## Course study & discussion

| Concern | Behaviour |
|---------|-----------|
| Aula tree | Ordered course items; completed / current / locked states |
| Unlock | First aula open; later aulas require all previous completed |
| Teacher preview | Course teacher bypasses sequential lock |
| Markdown | Sanitized HTML in study; raw markdown only in teacher editor |
| Comments | Enrolled student or teacher on accessible aula |
| Upvote | One per user/comment; toggle removes |
| Hide / restore | Teacher only; students never see hidden comments |

## Course item display

| Type | Student view | Teacher edit |
|------|--------------|--------------|
| MARKDOWN | Rendered sanitized HTML | Markdown editor |
| IMAGE | Inline image from media endpoint | Upload image |
| VIDEO | Inline video player | Upload video |

## API-only features (no dedicated UI page)

| Feature | API | Notes |
|---------|-----|-------|
| Study tree | `GET /courses/{id}/study` | Accessibility + completion |
| Study item | `GET /courses/{id}/items/{itemId}` | 403 when locked for students |
| Progress mark | `PUT /courses/{id}/items/{itemId}/progress` | Sequential lock enforced |
| Comments | `GET/POST /courses/{id}/items/{itemId}/comments` | Discussion |
| Upvote | `POST /comments/{id}/upvote` | Toggle |
| Hide / restore | `POST /comments/{id}/hide` / `restore` | Teacher moderation |

## Post-MVP (designed — no UI yet)

| Feature | Route | Notes |
|---------|-------|-------|
| Git repository link | `/teacher/courses/:courseId/edit` (Git section) | Link repo + `course.yml` path — [git-course-sync.md](../feature/git-course-sync.md) |
| Sync from Git | API `POST /courses/{id}/git/sync` | Teacher triggers sync |

## Dev personas

Use Passport and Cursos `dev-import.sql`. After Passport clean seed: `guest-user=1`, `cto-boss=2`, `junior=3`.

| Passport user | Email | Password | Use for |
|---------------|-------|----------|---------|
| `cto-boss` | `cto@passport.vepo.dev` | `qwas1234` | Teacher + `cursos.admin`; teaches Quarkus course; Admin → Categorias |
| `junior` | `junior_dev@passport.vepo.dev` | `qwas1234` | Enrolled student with first aula completed; discussion sample author |

Seed data covers sequential aulas, a hidden comment, an upvote, and a second published course (`Angular na prática`) for catalog availability.
