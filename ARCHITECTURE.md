# Architecture & Conventions

Canonical reference for developers and AI agents. Domain language lives in [docs/domain-specification.md](docs/domain-specification.md). Agent entry point: [AGENTS.md](AGENTS.md).

## 1. Core principles

- **Modular monolith** — one Maven module, feature packages under `dev.vepo.cursos.*`.
- **REST JSON API** — JAX-RS endpoints at `/api`; Angular SPA consumes JSON.
- **Full-stack bundle** — Quarkus Quinoa builds and serves the Angular app from the same JAR.
- **PostgreSQL + Flyway** — schema in `src/main/resources/db/migration/`.
- **Passport JWT auth** — SmallRye JWT (RS256) validates tokens issued by Passport; Cursos does not own user passwords.
- **Role by relationship** — a **teacher** is the user who created a course; a **student** is a user with an enrollment on that course.
- **Platform administration** — Passport JWT group `cursos.admin` gates category writes and the **Admin** menu.
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
├── course/         # Courses, items, image gallery (`course.image`), video playback (`course.playback`)
├── enrollment/     # Request, approve, direct enroll
├── progress/       # Item completion + percentage
├── discussion/     # Aula comments, upvotes, moderation
├── mailer/         # Enrollment emails
├── git/            # POST-MVP — course.yml sync
└── infra/          # Cross-cutting HTTP, dev setup
```

Frontend: `src/main/webui/src/app/` — `components/`, `services/`, `generated/`, `guards/`, `interceptors/`. Global dark-shell tokens and shared `.app-shell-page`, `.app-shell-sidebar`, and `.app-shell-main` layout classes live in `src/main/webui/src/styles.scss`; root header/drawer behavior lives in `app.*`.

Bounded contexts: [docs/domain-specification.md](docs/domain-specification.md) §Bounded contexts.

## 6. Design patterns

### Repository

One per entity; `@ApplicationScoped`; `EntityManager`; `@Transactional` on mutating methods.

### Service layer

| Service | Responsibility |
|---------|----------------|
| `CourseService` | Course CRUD, publish, teacher ownership |
| `CourseImageAssetService` | Gallery/cover upload, signed tickets, reference-guarded delete |
| `CourseItemService` | Ordered MARKDOWN/IMAGE/VIDEO items |
| `CategoryService` | Category CRUD |
| `CatalogService` | Teaching / enrolled / available-requested sections |
| `EnrollmentService` | Request, approve, reject, direct enroll |
| `ProgressService` | Completion, cascade rollback, conclusion, percentage |
| `CertificateService` | On-demand PDF certificate for concluded enrollments |
| `StudyService` | Sequential aula accessibility, tree state, teacher preview |
| `CommentService` | Aula comments, upvote toggle, hide/restore |
| `IdentityService` | Upsert local identity from JWT |
| `MailerService` | Enrollment emails |
| `GitCourseSyncService` | Link/unlink repo; **JGit** clone + import `course.yml` |

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
| Cursos admin | Passport JWT `groups` contains `cursos.admin`; `@RolesAllowed("cursos.admin")` on category writes |

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
| GET | `/categories` | List categories (authenticated) |
| POST | `/categories` | Create category (`cursos.admin`) |
| POST | `/categories/{id}` | Update category (`cursos.admin`) |

### Courses

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/courses` | Create course (caller becomes teacher) |
| GET | `/courses/mine` | Teacher's courses |
| GET | `/courses/{id}` | Course detail |
| POST | `/courses/{id}` | Update course |
| POST | `/courses/{id}/publish` | Publish course |
| POST | `/courses/{id}/unpublish` | Unpublish course (back to draft) |

### Course items

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/courses/{id}/items/markdown` | Create markdown aula |
| PUT | `/courses/{id}/items/{itemId}` | Update markdown aula |
| POST | `/courses/{id}/items/link` | Create link aula (`https` only) |
| PUT | `/courses/{id}/items/{itemId}/link` | Update link aula |
| POST | `/courses/{id}/items/media` | Upload IMAGE/VIDEO (multipart; video up to 250 MiB) |
| DELETE | `/courses/{id}/items/{itemId}` | Delete item |
| POST | `/courses/{id}/items/reorder` | Reorder |
| GET | `/courses/{id}/resources/{resourceId}` | Download course-bound media (JWT) |
| POST | `/courses/{id}/items/{itemId}/playback-ticket` | Issue short-lived signed video URL |
| GET | `/media/playback/{courseId}/{itemId}/{resourceId}` | Public Range stream (`206`) with HMAC ticket |
| GET | `/courses/{id}/study` | Aula tree with completion/accessibility |

### Course images (cover + gallery)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/courses/{id}/images` | Upload gallery raster (JPEG/PNG/WebP/GIF) |
| GET | `/courses/{id}/images` | List gallery (teacher or enrolled) |
| DELETE | `/courses/{id}/images/{assetId}` | Delete asset (blocked if cover or Markdown-referenced) |
| PUT | `/courses/{id}/cover/{assetId}` | Set optional course cover |
| DELETE | `/courses/{id}/cover` | Clear cover |
| POST | `/courses/{id}/images/tickets` | Batch issue signed image URLs |
| GET | `/media/images/{courseId}/{assetId}` | Public image stream with HMAC ticket |

Markdown embeds use stable `![alt](course-asset:{id})` references (not raw signed URLs). Config also: `cursos.media.max-image-bytes`.

Student item reads, progress updates, and discussions return 403 for a locked aula. The course teacher bypasses the lock.

Config: `cursos.media.max-image-bytes`, `cursos.media.max-video-bytes`, `cursos.media.signing-secret` (`CURSOS_MEDIA_SIGNING_SECRET`), `cursos.media.playback-ticket-ttl-seconds`, `cursos.media.range-chunk-bytes`.

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
| PUT | `/courses/{id}/items/{itemId}/progress` | Mark complete or rollback (`completed:false` cascade-clears later aulas) |
| GET | `/enrollments/{id}/progress` | Summary + percentage |
| GET | `/courses/{id}/progress` | Teacher: all enrolled summaries |
| GET | `/courses/{id}/certificate` | Download PDF when enrollment is concluded |

`completed:false` clears the selected aula and all later item progress; sets/clears `tb_enrollments.concluded_at` when crossing 100%.

### Aula discussion

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/courses/{id}/items/{itemId}/comments` | List visible comments |
| POST | `/courses/{id}/items/{itemId}/comments` | Create comment |
| POST | `/comments/{id}/upvote` | Toggle caller's upvote |
| POST | `/comments/{id}/hide` | Teacher hide |
| POST | `/comments/{id}/restore` | Teacher restore |

Only enrolled students and the course teacher may participate. Student responses omit hidden comments.

### Auth & identity

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/auth/me` | Current user (proxies Passport when available; includes author description) |
| PUT | `/account` | Update own name/email/description (proxies Passport `PUT /auth/me`) |
| POST | `/account/change-password` | Change password (proxies Passport) |
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
| `tb_course_resources` | media `BYTEA`, content type, filename, size |
| `tb_course_image_assets` | course-owned gallery/cover rasters (`BYTEA`) |
| `tb_courses.cover_image_asset_id` | optional FK to gallery asset |
| `tb_course_items` | position, type (`MARKDOWN`/`IMAGE`/`VIDEO`/`LINK`), markdown, `link_url`/`link_description`, resource FK |
| `tb_enrollments` | course, student, status (REQUESTED/ENROLLED/REJECTED), optional `concluded_at` |
| `tb_item_progress` | enrollment, item, completed, adjusted_by_teacher |
| `tb_comments` | aula author/content plus hide/moderation audit |
| `tb_comment_upvotes` | unique comment/voter upvote |
| `tb_git_course_links` | **Post-MVP** — repo URL, branch, course.yml path |

Progress: `round(100 * completedItems / totalItems)`.

## 10. Frontend routes

| Route | Purpose |
|-------|---------|
| `/` | Catalog home (**Ensinando**, **Matriculado**, **Disponível / Solicitado**) |
| `/account` | Minha conta (profile, author description, change password) |
| `/courses/:courseId` | Study overview: **Sobre o curso** + **Sobre o autor**; does not auto-open an aula |
| `/courses/:courseId/lessons/:itemId` | Selected aula (overview panels hidden) |
| `/teacher` | Teacher's courses |
| `/teacher/courses/new` | Create course |
| `/teacher/courses/:courseId/edit` | Two-pane teacher editor (unsaved-changes guard) |
| `/teacher/courses/:courseId/students` | Enrollment administration |
| `/teacher/courses/:courseId/progress` | Teacher progress view |
| `/admin/categories` | Category administration (`cursos.admin`) |
| `/login` | Passport redirect |

### Frontend visual shell

- Default **Learn** palette (light page, ink header, teal accent) as CSS custom properties in `styles.scss`; runtime white-label overrides via `GET /api/branding` (`learn.brand.*` / env).
- Tokens include `--color-header`, `--color-on-chrome`, `--color-main-bg`, `--color-surface`, `--color-accent`, `--color-link`, `--color-border`, `--color-text`, `--color-text-muted`, `--color-danger`.
- `AppComponent` owns the single persistent header and authenticated navigation drawer. The drawer is right-anchored, closed by default at every breakpoint, role-filters **Admin**, and closes on toggle, leaf navigation, or Escape. On mobile it uses the full viewport width.
- Sticky footer: copyright + brand name, optional Support/Docs/Legal/credit, OpenAPI only when `showDeveloperLinks`.
- Catalog, study, teacher home, and course editor use the shared two-column shell classes. Sidebars hold category filters, the aula tree, teaching courses, or editor items respectively.
- In study, `/courses/:id` is the **Visão geral** overview (**Sobre o curso** / **Sobre o autor**). Lesson routes hide those panels. Completing an aula advances to the next lesson route; the final aula remains selected.
- Course edit, students, progress, and category administration render page titles/actions inside main and do not add nested `mat-toolbar` chrome.
- The menu has at most two levels: **Aprender**, **Ensinar**, **Conta**, **Admin**. Header display name links to **Minha conta**. Unauthenticated users see **Entrar** instead of the authenticated drawer controls.

Visual design: [feature/learn-productization.md](feature/learn-productization.md), [feature/ui-visual-shell.md](feature/ui-visual-shell.md). Click paths: [docs/feature-catalog.md](docs/feature-catalog.md).

Details: [docs/feature-catalog.md](docs/feature-catalog.md).

## 11. Dev experience

| Item | Value |
|------|-------|
| Learn (cursos) port | 8083 |
| Production host | `https://learn.vepo.dev` |
| Passport port | 8080 |
| Angular dev server (Quinoa) | 4203 |
| Test port | 8084 |
| Dev startup script | `scripts/dev.sh` (Passport + Learn) |
| Dev seed | `dev-import.sql` |
| Flyway | clean-at-start in `%dev` |
| Docker image | `vepo/cursos:main` (JVM) |

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

## 14. Configuration

Dev quick reference (full tables and prod env: [docs/configuration.md](docs/configuration.md); packaging: [docs/deployment.md](docs/deployment.md)):

| Property / env | Purpose |
|----------------|---------|
| `%dev` `quarkus.http.port` | 8083 |
| `JWT_ISSUER` / `mp.jwt.verify.issuer` | Passport issuer |
| `MP_JWT_VERIFY_PUBLICKEY_LOCATION` | Passport public key (`%prod` file mount) |
| `PASSPORT_API_URL` | Passport REST base (`http://localhost:8080` in dev) |
| `CURSOS_MEDIA_SIGNING_SECRET` | HMAC for media tickets |
| `learn.brand.*` / `LEARN_BRAND_*` | White-label branding |

## 15. Git package — implement last

Syncs `course.yml` from a Git repo into course items via **JGit** (embedded). Design: [feature/git-course-sync.md](feature/git-course-sync.md).

**Do not implement until [feature/cursos-platform.md](feature/cursos-platform.md) is `done`.**
