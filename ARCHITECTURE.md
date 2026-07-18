# Architecture & Conventions

Canonical reference for developers and AI agents. Domain language lives in [docs/domain-specification.md](docs/domain-specification.md). Agent entry point: [AGENTS.md](AGENTS.md).

## 1. Core principles

- **Modular monolith** — one Maven module, feature packages under `dev.vepo.cursos.*`.
- **REST JSON API** — JAX-RS endpoints at `/api`; Angular SPA consumes JSON.
- **Full-stack bundle** — Quarkus Quinoa builds and serves the Angular app from the same JAR.
- **PostgreSQL + Flyway** — schema in `src/main/resources/db/migration/`.
- **Passport JWT auth** — SmallRye JWT (RS256) validates tokens issued by Passport; Cursos does not own user passwords.
- **Role by relationship** — a **teacher** is the user who created a course; a **student** is a user with an enrollment on that course.
- **Git course sync** — `git` package links a remote and syncs `course.yml` into course items ([feature/git-course-sync.md](feature/git-course-sync.md)).

## 2. Request lifecycle

1. Browser posts credentials to Cursos `POST /api/auth/login`, which proxies to Passport and returns the Passport JWT.
2. Client calls Cursos `/api/...` with `Authorization: Bearer <passport-jwt>`.
3. SmallRye JWT validates signature (Passport public key) and extracts claims (`id`, `username`, `email`, `groups`).
4. JAX-RS `*Endpoint` validates input and authorization (`@DenyAll` + `@Authenticated` / ownership checks).
5. `*Repository` (and `*Service` when logic spans entities) reads/writes via `EntityManager`.
6. Response records serialize to JSON; errors map via exception mappers in `infra`.

## 3. Domain overview

**Cursos** is an online course platform. A **teacher** creates **courses** with ordered **course items** (markdown, image, video). **Students** browse the **catalog**, **request enrollment**, and track **progress**. **Categories** organize the home catalog.

## 4. Tech stack

| Layer | Technology |
|-------|------------|
| Backend | Java 21, Quarkus 3.37, Jakarta REST, CDI, Hibernate ORM |
| Frontend | Angular 20, Angular Material |
| Integration | Quarkus Quinoa |
| Identity | Passport (external, port 8080) |
| Database | PostgreSQL, Flyway |
| Auth | SmallRye JWT — validate Passport tokens |
| Email | Quarkus Mailer + Qute |
| Tests | JUnit 5, REST Assured, ArchUnit; Karma/Jasmine |

## 5. Package layout

```
dev.vepo.cursos/
├── auth/           # JWT validation, security helpers
├── identity/       # Local Passport user mirror
├── catalog/        # Home catalog sections
├── course/         # Courses, categories, items
├── enrollment/     # Request, approve, direct enroll
├── progress/       # Item completion + percentage
├── mailer/         # Enrollment emails
├── git/            # POST-MVP — course.yml sync
└── infra/          # Cross-cutting HTTP, dev setup
```

Frontend: `src/main/webui/src/app/` — `components/`, `services/`, `generated/`, `guards/`, `interceptors/`.

Bounded contexts: [docs/domain-specification.md](docs/domain-specification.md) §Bounded contexts.

## 6. Design patterns

### Repository

One per entity; `@ApplicationScoped`; `EntityManager`; `@Transactional` on mutating methods.

### Service layer

| Service | Responsibility |
|---------|----------------|
| `CourseService` | Course CRUD, publish, teacher ownership |
| `CourseItemService` | Ordered MARKDOWN/IMAGE/VIDEO items |
| `CategoryService` | Category CRUD |
| `CatalogService` | Teaching / enrolled / available-requested sections |
| `EnrollmentService` | Request, approve, reject, direct enroll |
| `ProgressService` | Completion, teacher adjust, percentage |
| `IdentityService` | Upsert local identity from JWT |
| `MailerService` | Enrollment emails |
| `GitCourseSyncService` | Link/unlink repo; clone + import `course.yml` |

### Endpoint layer

- One HTTP method per class (e.g. `course.create.CreateCourseEndpoint`).
- Class `@DenyAll` + method `@Authenticated` or `@RolesAllowed`.
- Records: `*Request` / `*Response` with static `load()` factories.

## 7. Security (Passport JWT)

| Concern | Approach |
|---------|----------|
| Issuer | Passport (`mp.jwt.verify.issuer`) |
| Public key | Passport JWKS or PEM |
| User identity | JWT `sub` → `tb_identities.passport_user_id` |
| Teacher check | `Course.teacherId == current identity` |
| Student check | `Enrollment` with status ENROLLED |

Cursos does not implement login — Angular obtains JWT from Passport and uses `auth.interceptor.ts`.

## 8. API surface

Base path: `/api`. OpenAPI at `/openapi`.

### Catalog

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/catalog/teaching` | Courses user teaches |
| GET | `/catalog/enrolled` | ENROLLED courses |
| GET | `/catalog/available` | Available + REQUESTED |

### Categories

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/categories` | List categories |
| POST | `/categories` | Create category |
| POST | `/categories/{id}` | Update category |

### Courses

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/courses` | Create course (caller becomes teacher) |
| GET | `/courses/mine` | Teacher's courses |
| GET | `/courses/{id}` | Course detail |
| POST | `/courses/{id}` | Update course |
| POST | `/courses/{id}/publish` | Publish course |

### Course items

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/courses/{id}/items` | List ordered items |
| POST | `/courses/{id}/items` | Create item |
| POST | `/courses/{id}/items/{itemId}` | Update item |
| DELETE | `/courses/{id}/items/{itemId}` | Delete item |
| POST | `/courses/{id}/items/reorder` | Reorder |
| GET | `/courses/{id}/items/{itemId}/media` | Download media |

### Enrollment

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/courses/{id}/enrollments/request` | Student request |
| POST | `/enrollments/{id}/approve` | Teacher approve |
| POST | `/enrollments/{id}/reject` | Teacher reject |
| POST | `/courses/{id}/enrollments/direct` | Teacher direct enroll |
| GET | `/courses/{id}/enrollments/pending` | Pending requests |

### Progress

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/enrollments/{id}/progress/{itemId}` | Student mark |
| POST | `/enrollments/{id}/progress/{itemId}/adjust` | Teacher adjust |
| GET | `/enrollments/{id}/progress` | Summary + percentage |

### Auth & identity

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/auth/me` | Current user from JWT |
| POST | `/identity/sync` | Upsert local identity |

### Git (post-MVP — designed only)

| Method | Path | Purpose |
|--------|------|---------|
| PUT | `/courses/{id}/git` | Link repository |
| POST | `/courses/{id}/git/sync` | Sync course.yml |

## 9. Data model

Baseline: `V1.0.0__Database_Creation.sql`.

| Table | Purpose |
|-------|---------|
| `tb_identities` | Passport user id, name, email |
| `tb_categories` | Category name, sort order |
| `tb_courses` | Title, description, category, teacher, published |
| `tb_course_items` | position, type, markdown_text, media bytea |
| `tb_enrollments` | course, student, status (REQUESTED/ENROLLED/REJECTED) |
| `tb_item_progress` | enrollment, item, completed, adjusted_by_teacher |
| `tb_git_course_links` | **Post-MVP** — repo URL, branch, course.yml path |

Progress: `round(100 * completedItems / totalItems)`.

## 10. Frontend routes

| Route | Purpose |
|-------|---------|
| `/` | Catalog home (three sections) |
| `/courses/new` | Create course |
| `/courses/:courseId` | Study or preview |
| `/courses/:courseId/edit` | Teacher editor |
| `/courses/:courseId/enrollments` | Enrollment admin |
| `/categories` | Category admin |
| `/login` | Passport redirect |

Details: [docs/feature-catalog.md](docs/feature-catalog.md).

## 11. Dev experience

| Item | Value |
|------|-------|
| Cursos port | 8083 |
| Passport port | 8080 |
| Angular dev server (Quinoa) | 4203 |
| Test port | 8084 |
| Dev startup script | `scripts/dev.sh` (Passport + Cursos) |
| Dev seed | `dev-import.sql` |
| Flyway | clean-at-start in `%dev` |

## 12. Feature workflow

```
planned → architecture-ready → tasks-ready → approved → in-progress → done
```

See [development-process.mdc](.cursor/rules/development-process.mdc).

**MVP:** [feature/cursos-platform.md](feature/cursos-platform.md) — T1–T9.

**Post-MVP:** [feature/git-course-sync.md](feature/git-course-sync.md) — T10, blocked until MVP done.

## 13. Adding a feature

1. Feature doc → domain spec → architecture → task approval → TDD.
2. Amend Flyway baseline (pre-production).
3. Entity → repository → service → endpoint → Angular.
4. Update feature catalog and dev seed.

## 14. Configuration (dev)

| Property | Purpose |
|----------|---------|
| `quarkus.http.port` | 8083 |
| `mp.jwt.verify.publickey.location` | Passport public key |
| `mp.jwt.verify.issuer` | Passport issuer |
| `cursos.passport.base-url` | http://localhost:8080 |

## 15. Git package — implement last

Syncs `course.yml` from a Git repo into course items. Design: [feature/git-course-sync.md](feature/git-course-sync.md).

**Do not implement until [feature/cursos-platform.md](feature/cursos-platform.md) is `done`.**
