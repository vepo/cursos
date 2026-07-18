# Feature catalog

UI feature index for Cursos. Update when routes, menu items, or primary user flows change (see [.cursor/rules/feature-catalog.mdc](../.cursor/rules/feature-catalog.mdc)).

Authentication uses **Passport JWT**. Login obtains token from Passport (`:8080`); Cursos SPA stores Bearer token and calls Cursos API (`:8083`).

| Feature | Route | Roles | Steps (happy path) |
|---------|-------|-------|-------------------|
| Login | `/login` | public | Open Cursos → redirect to Passport login → enter email/password → return with JWT → catalog home |
| Catalog home | `/` | authenticated (JWT) | Login → **Início** with three sections: **Ensinando**, **Matriculado**, **Disponível / Solicitado**; each course card shows title, category, progress (if enrolled), enrollment badge |
| Create course | `/courses/new` | authenticated | Home → **Novo curso** → title, description, category → save → course edit |
| Course study (student) | `/courses/:courseId` | enrolled student | **Matriculado** → open course → ordered items (markdown rendered, image/video displayed) → mark items complete → see progress % |
| Course edit (teacher) | `/courses/:courseId/edit` | course teacher | **Ensinando** → open course → **Editar** → update metadata; add/reorder/delete items (markdown/image/video) → **Publicar** |
| Request enrollment | `/courses/:courseId` | authenticated (not enrolled) | **Disponível / Solicitado** → open course preview → **Solicitar matrícula** → status **Solicitado** |
| Enrollment admin | `/courses/:courseId/enrollments` | course teacher | **Ensinando** → course → **Matrículas** → list **Pendentes** → **Aprovar** / **Recusar**; **Matricular aluno** by email |
| Category list | `/categories` | authenticated (teachers) | Menu → **Categorias** → list → create/edit |
| Progress summary | `/courses/:courseId` (sidebar/header) | enrolled student or teacher | Open course → progress bar shows `n/m` items and percentage |

## Catalog home sections

| Section | Content | Empty state |
|---------|---------|-------------|
| **Ensinando** | Courses where current user is **teacher** | "Você ainda não criou cursos" + **Novo curso** |
| **Matriculado** | Courses with **ENROLLED** enrollment | "Nenhuma matrícula ativa" |
| **Disponível / Solicitado** | Published courses not taught by user; badge **Solicitado** when REQUESTED | "Nenhum curso disponível" |

## Course item display

| Type | Student view | Teacher edit |
|------|--------------|--------------|
| MARKDOWN | Rendered markdown | Markdown editor |
| IMAGE | Inline image from media endpoint | Upload image |
| VIDEO | Inline video player | Upload video |

## API-only features (no dedicated UI page)

| Feature | API | Notes |
|---------|-----|-------|
| Sync identity | `POST /identity/sync` | Upsert local identity from JWT claims on first request |
| Item media | `GET /courses/{id}/items/{itemId}/media` | Streams bytea for IMAGE/VIDEO items |
| Progress mark | `POST /enrollments/{id}/progress/{itemId}` | Student toggle complete |
| Teacher progress adjust | `POST /enrollments/{id}/progress/{itemId}/adjust` | Teacher override |

## Post-MVP (designed — no UI yet)

| Feature | Route | Notes |
|---------|-------|-------|
| Git repository link | `/courses/:courseId/edit` (Git section) | Link repo + `course.yml` path — [git-course-sync.md](../feature/git-course-sync.md) |
| Sync from Git | API `POST /courses/{id}/git/sync` | Teacher triggers sync |

## Dev personas

Use Passport dev seed (`dev-import.sql` in Passport). Cursos `dev-import.sql` references the same Passport user ids.

| Passport user | Email | Use for |
|---------------|-------|---------|
| `cto-boss` | `cto@passport.vepo.dev` | Teacher + student flows (seed courses and enrollments) |

Default dev password: `qwas1234` (Passport seed).

## Navigation shell (MVP)

| Element | Action |
|---------|--------|
| Brand | Link to `/` |
| **Novo curso** | `/courses/new` |
| **Categorias** | `/categories` |
| User menu | Logout (clear JWT); link to Passport account if needed |
