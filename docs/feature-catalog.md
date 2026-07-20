# Feature catalog

UI feature index for **Learn** (repo `cursos`). Update when routes, menu items, or primary user flows change (see [.cursor/rules/feature-catalog.mdc](../.cursor/rules/feature-catalog.mdc)).

Authentication uses **Passport JWT**. Login obtains token from Passport (`:8080`); Learn SPA stores Bearer token and calls API (`:8083`).

| Feature | Route | Roles | Steps (happy path) |
|---------|-------|-------|-------------------|
| Login | `/login` | public | Open Learn → enter Passport email/password → JWT stored → catalog home |
| Catalog home | `/` | authenticated | Open the top-right menu icon → **Aprender → Catálogo** → filter with the left **Categorias** sidebar → browse **Ensinando** (taught courses), **Matriculado**, and **Disponível / Solicitado** |
| Course study | `/courses/:courseId` or `/courses/:courseId/lessons/:itemId` | enrolled student or course teacher | Open enrolled course → **resume current aula** (or overview if not started / finish if concluded) → unlock aulas with **Concluir aula** / **Desfazer progresso** → **Visão geral** anytime for course/author panels → sidebar progress % → finish screen at 100% → **Baixar certificado** |
| Minha conta | `/account` | authenticated | Header name or menu **Conta → Minha conta** → edit name/email/author description → change password |
| Request enrollment | `/` card or course preview | authenticated | **Disponível / Solicitado** → **Solicitar matrícula** |
| Teacher area | `/teacher` | authenticated | Open the top-right menu icon → **Ensinar → Meus cursos** → choose a course → **Publicar curso** / **Despublicar** / Editar / Alunos / Progresso |
| Create course | `/teacher/courses/new` | authenticated | Open the top-right menu icon → **Ensinar → Novo curso** → save → editor |
| Course edit | `/teacher/courses/:courseId/edit` | course teacher | Left item list → edit details/items → optional **capa** + Markdown **galeria** (`course-asset:id`) → **Publicar curso** / **Despublicar**; unsaved changes and deletes use in-app confirmation dialogs |
| Enrollment admin | `/teacher/courses/:courseId/students` | course teacher | Sections **Solicitações pendentes** / **Alunos matriculados** / **Recusados** with counts → **Aprovar** / **Recusar** (confirmação) → **Matricular aluno** via busca no Passport (já matriculados exibem badge) |
| Progress admin | `/teacher/courses/:courseId/progress` | course teacher | Class aggregates → students sorted by least progress → expand for per-aula checklist → **Marcar concluída** / **Desfazer** (Teacher adjust; cascade confirmed) |
| Category admin | `/admin/categories` | `cursos.admin` | Open the top-right menu icon → **Admin → Categorias** → create categories |

## Navigation shell

Authenticated navigation is a right-anchored, two-level drawer behind the top-right header **menu icon**. It is closed by default at every breakpoint and closes through the toggle, a leaf link, or Escape; Escape returns focus to the toggle. On narrow viewports the drawer spans the viewport width. The authenticated header keeps only the **Learn** brand and menu icon; **Minha conta**, display name, and **Sair** live in the drawer **Conta** section. Unauthenticated users see **Entrar** without the drawer. A sticky **footer** shows copyright, optional Support/Docs/Legal/credit from branding config, and OpenAPI only when developer links are enabled; only the central page content scrolls. Branding loads from `GET /api/branding`. See [learn-productization.md](../feature/learn-productization.md) and [ui-visual-shell.md](../feature/ui-visual-shell.md).

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
| Study | Aula tree with **Visão geral** first; **Aulas** hide/show on narrow viewports | Overview (**Sobre o curso** / **Sobre o autor**) or selected aula + discussion |
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
| Aula tree | Ordered course items; completed / current / accessible / locked with color + Material icon (`check_circle` / `play_arrow` / `radio_button_unchecked` / `lock`) |
| Unlock | First aula open; later aulas require all previous completed |
| Progress bar | Sidebar shows completed/total and percentage |
| Rollback | **Desfazer progresso** clears selected aula and all later aulas; clears conclusion below 100% |
| Course overview | **Visão geral** / `/courses/:id?overview=1` shows **Sobre o curso** + **Sobre o autor**; lesson routes hide overview |
| Open-course resume | Opening `/courses/:id` (no overview query): in-progress enrolled → current aula; concluded → finish; not started / not enrolled / teacher → overview |
| Completion navigation | **Concluir aula** opens the next ordered aula after completion; at 100% the finish screen replaces aula content |
| Finish / certificate | Finish screen offers **Baixar certificado** (authenticated PDF); catalog shows **Concluído** while status stays `ENROLLED` |
| Teacher preview | Course teacher bypasses sequential lock; opening own course lands on overview (no auto-resume) |
| Markdown | Study renders sanitized HTML (bold/italic/code/links/lists/fenced code + `course-asset:` images); raw markdown only in teacher editor |
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

Use Passport and Cursos `dev-import.sql`. After Passport clean seed:

| Id | Passport user | Email | Password | Use for |
|----|---------------|-------|----------|---------|
| 1 | `guest-user` | `guest@passport.vepo.dev` | `qwas1234` | Student with **REQUESTED** enrollment on Quarkus |
| 2 | `cto-boss` | `cto@passport.vepo.dev` | `qwas1234` | Teacher + `cursos.admin`; teaches Quarkus/PostgreSQL; concluded on Angular (certificate); Admin → Categorias |
| 3 | `junior` | `junior_dev@passport.vepo.dev` | `qwas1234` | Teacher of Angular; enrolled student on Quarkus (1ª aula done) and PostgreSQL |
| 4 | `alice` | `alice@passport.vepo.dev` | `qwas1234` | Student with partial Quarkus progress; pending on Angular/DevOps |
| 5 | `bob` | `bob@passport.vepo.dev` | `qwas1234` | Student who concluded Quarkus (certificate); mid progress on Angular |
| 6 | `carol` | `carol@passport.vepo.dev` | `qwas1234` | Pending on Quarkus; enrolled (0%) on PostgreSQL |
| 7 | `diego` | `diego@passport.vepo.dev` | `qwas1234` | **REJECTED** on Quarkus (roster status demo) |
| 8 | `mentor` | `mentor@passport.vepo.dev` | `qwas1234` | Second teacher — DevOps published + Observabilidade draft |

Seed covers: 5 categories; 4 published + 2 draft courses; MARKDOWN/IMAGE/LINK/VIDEO aulas; cover + gallery embed; REQUESTED/ENROLLED/REJECTED enrollments; partial and concluded progress; comments, upvote, and a hidden comment.
