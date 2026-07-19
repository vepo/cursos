# Cursos — Online Course Platform

Teach and learn with structured courses: ordered **markdown**, **image**, and **video** items, category catalog, enrollment with teacher approval, and progress tracking.

Quarkus REST API + Angular SPA (Quinoa), authenticated via **Passport** JWT.

## Tech stack

| Layer | Technology |
|-------|------------|
| Backend | Quarkus 3, Java 21, JAX-RS, CDI, Hibernate ORM |
| Frontend | Angular 20, Angular Material |
| Integration | Quarkus Quinoa (SPA dev server + production bundle) |
| Database | PostgreSQL, Flyway |
| Auth | Passport JWT (RS256) — SmallRye JWT validation in Cursos |
| Email | Quarkus Mailer + Qute templates (enrollment notifications) |
| Tests | JUnit 5, REST Assured, ArchUnit; Karma/Jasmine (frontend) |
| Build | Maven |

## Quick start

One command (starts Passport if not already running, then Cursos):

```bash
./scripts/dev.sh
```

Or manually — start **Passport** first (identity), then **Cursos**:

```bash
# Terminal 1 — Passport (8080)
cd ../passport && mvn quarkus:dev

# Terminal 2 — Cursos (8083)
cd ../cursos && mvn quarkus:dev
```

- Cursos UI + API: [http://localhost:8083](http://localhost:8083) (Quinoa forwards to the Angular dev server on 4203)
- Passport login API: [http://localhost:8080/api/auth/login](http://localhost:8080/api/auth/login)
- OpenAPI / Swagger UI: [http://localhost:8083/openapi](http://localhost:8083/openapi)

Dev mode runs Flyway clean+migrate (`%dev.quarkus.flyway.clean-at-start=true`) and loads sample data from `dev-import.sql`.

### Dev login

Use Passport dev seed credentials (same as Backoffice):

| User | Email | Password | Notes |
|------|-------|----------|-------|
| `cto-boss` | `cto@passport.vepo.dev` | `qwas1234` | Teacher + `cursos.admin`; **Admin → Categorias** |
| `junior` | `junior_dev@passport.vepo.dev` | `qwas1234` | Enrolled student (first aula done; later aulas locked) |

Log in through the Cursos UI. Open the top-right menu icon for **Aprender**, **Ensinar**, and role-gated **Admin**.

### After backend API changes

```bash
./mvnw test
cd src/main/webui && npm run generate:api
```

Generated TypeScript clients land in `src/app/generated/` (gitignored). Angular facades in `services/` wrap the generated `*Api` classes.

## Features

### Catalog & courses

- **Catalog home** — **Ensinando**, **Matriculado**, and **Disponível / Solicitado** (taught courses stay out of Available)
- **Visual shell** — GitHub-dark developer workspace with sticky header/footer, contextual sidebars, and account/logout in the menu drawer
- **Navigation drawer** — top-right, click-only access to **Aprender**, **Ensinar**, **Conta**, and role-gated **Admin**
- **Minha conta** — edit name/email/author description and change password via Passport
- **Course media** — optional cover images, gallery assets embedded in Markdown via signed URLs, and video playback tickets
- **Categories** — classify courses; create requires `cursos.admin`
- **Course** — title, description, categories; creator is the **teacher**; clear **Publicar curso** / **Despublicar**
- **Course items / aulas** — ordered **MARKDOWN**, **LINK**, **IMAGE**, **VIDEO** (video in PostgreSQL `BYTEA` with signed Range playback); two-pane editor with unsaved-changes warnings

### Study & discussion

- **Course summary** — **Sobre o curso** and live **Sobre o autor** panels on the study page
- **Sequential unlock** — first aula open; later aulas unlock only after previous ones are completed (teacher preview bypasses)
- **Progress bar** — study sidebar shows completed/total and percentage
- **Rollback** — **Desfazer progresso** clears the selected aula and all later aulas
- **Course completion** — finish screen at 100%; authenticated PDF certificate download; catalog **Concluído** badge
- **Rendered markdown** — sanitized HTML with heading sizes below the aula title; raw markdown only when editing
- **Link aulas** — safe **Abrir recurso** (`target="_blank"`, `rel="noopener noreferrer"`)
- **Video aulas** — authenticated playback tickets and seekable HTTP Range streaming
- **Comments** — enrolled students and teacher discuss accessible aulas (**Comentar**)
- **Upvotes** — positive-only, one per user/comment (toggle)
- **Moderation** — teacher can hide/restore comments; students never see hidden ones

### Enrollment & progress

- **Enrollment request** — student self-enrolls → **REQUESTED** until teacher approves
- **Direct enrollment** — teacher adds a student by email; optional notification email
- **Progress** — students mark aulas complete or roll back; teachers can adjust; percentage from completed items; `concluded_at` when 100%
- **Certificate** — enrolled students download a server-generated PDF after course conclusion

### Post-MVP (designed)

- **Git course sync** — `course.yml` in a repository syncs content into course items ([feature/git-course-sync.md](feature/git-course-sync.md))

## Documentation

| Document | Purpose |
|----------|---------|
| [AGENTS.md](AGENTS.md) | Agent entry point |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Technical architecture |
| [docs/domain-specification.md](docs/domain-specification.md) | Domain language and invariants |
| [docs/feature-catalog.md](docs/feature-catalog.md) | UI routes and flows |
| [docs/backlog.md](docs/backlog.md) | Product backlog |
| [feature/](feature/) | Feature specs and task approval |
