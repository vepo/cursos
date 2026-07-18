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
| `cto-boss` | `cto@passport.vepo.dev` | `qwas1234` | Full platform access via Passport profiles |

Log in through the Cursos UI (redirects to Passport or uses stored JWT after login). Cursos reads the Passport JWT `sub` claim as the user identity.

### After backend API changes

```bash
./mvnw test
cd src/main/webui && npm run generate:api
```

Generated TypeScript clients land in `src/app/generated/` (gitignored). Angular facades in `services/` wrap the generated `*Api` classes.

## Features (MVP — planned)

### Catalog & courses

- **Home catalog** — three sections: **Ensinando** (courses you teach), **Matriculado** (enrolled courses), **Disponível / Solicitado** (available to request or pending approval)
- **Categories** — classify courses for browsing and filtering
- **Course** — title, description, category; creator is the **teacher**
- **Course items** — ordered content blocks: **MARKDOWN**, **IMAGE**, **VIDEO** (media stored in PostgreSQL `bytea`)

### Enrollment & progress

- **Enrollment request** — student self-enrolls → status **REQUESTED** until teacher approves
- **Direct enrollment** — teacher adds a student by email; optional notification email
- **Progress** — student marks items complete; teacher can adjust; **progress percentage** derived from completed items vs total items

### Post-MVP (designed, not yet implemented)

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
