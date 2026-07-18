# Cursos platform (MVP)

**Feature version:** 1  
**Status:** done  
**Requested:** 2026-07-18

## Summary

Deliver the **Cursos** MVP: a Quarkus + Angular Quinoa modular monolith authenticated via **Passport JWT**, where users act as **teachers** when they create courses and **students** when enrolled. The **catalog home** shows three sections (**Ensinando**, **Matriculado**, **Disponível / Solicitado**). Courses belong to **categories** and contain ordered **course items** (MARKDOWN, IMAGE, VIDEO) stored in PostgreSQL (bytea for media). **Enrollment** supports self **REQUESTED** flow with teacher approval, plus **direct enrollment** with email notification. **Progress** is mixed: students mark items complete; teachers can adjust; percentage derives from completed items.

**Out of MVP scope:** Git course sync — designed separately in [git-course-sync.md](git-course-sync.md) (task T10, implement after this feature is `done`).

## Wireframe

| Field | Value |
|-------|-------|
| **Source** | ASCII below |
| **Last updated** | 2026-07-18 |

### Screen: `/` — catalog home

| Region | Elements |
|--------|----------|
| Header | Brand, **Novo curso**, **Categorias**, user menu |
| Section 1 | **Ensinando** — course cards (title, category, student count); empty → **Novo curso** |
| Section 2 | **Matriculado** — cards with progress bar (e.g. 40%); link to study view |
| Section 3 | **Disponível / Solicitado** — published courses; badge **Solicitado** when REQUESTED |

```
┌─────────────────────────────────────────────────────────────┐
│  Cursos          [ Novo curso ]  [ Categorias ]    [ User ▼]│
├─────────────────────────────────────────────────────────────┤
│  Ensinando                                                  │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │ Intro Java   │  │ UI Design    │                         │
│  │ Programação  │  │ Design       │                         │
│  └──────────────┘  └──────────────┘                         │
├─────────────────────────────────────────────────────────────┤
│  Matriculado                                                  │
│  ┌──────────────┐                                             │
│  │ Quarkus 101  │  ████████░░░░  67%                         │
│  │ Programação  │                                             │
│  └──────────────┘                                             │
├─────────────────────────────────────────────────────────────┤
│  Disponível / Solicitado                                      │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │ Angular SPA  │  │ Docker       │  [ Solicitado ]         │
│  │ Programação  │  │ DevOps       │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

### Screen: `/courses/:courseId/edit` — teacher editor

| Region | Elements |
|--------|----------|
| Metadata | Title, description, category, **Publicar** |
| Items list | Ordered rows: type icon, title, drag handle, edit/delete |
| Add item | **Markdown**, **Imagem**, **Vídeo** |
| Enrollments link | **Matrículas** → pending + direct enroll |

### Screen: `/courses/:courseId` — student study

| Region | Elements |
|--------|----------|
| Progress | Bar + `n/m` items |
| Content | Sequential items: rendered markdown, image, video player |
| Actions | Checkbox **Marcar como concluído** per item |

## Impact

| Area | Effect |
|------|--------|
| Bounded contexts | `auth`, `identity`, `catalog`, `course`, `enrollment`, `progress`, `mailer`, `infra` |
| API | Catalog, categories, courses, items, enrollment, progress endpoints (see ARCHITECTURE §8) |
| UI | Catalog home, course CRUD, study view, enrollment admin, categories |
| Schema | `V1.0.0__Database_Creation.sql` — identities, categories, courses, items, enrollments, progress |
| Auth | Passport JWT validation; no local login |
| Tests | `@QuarkusTest` per endpoint; Angular specs for catalog and enrollment flows |
| Docs | domain-spec, feature-catalog, README, ARCHITECTURE |

### Risks

- Large video bytea may hit memory limits — acceptable for MVP; backlog item for external storage.
- Passport must be running in dev — document in README quick start.

### Feature questions (FQ*n*)

| # | Question | Status | Answer |
|---|----------|--------|--------|
| FQ1 | Teacher role model? | answered | Teacher = course creator; no global teacher role in MVP |
| FQ2 | Enrollment without approval path? | answered | Self-enroll → REQUESTED; teacher direct-enroll → ENROLLED + email |
| FQ3 | Progress model? | answered | Mixed: student marks items; teacher adjusts; % from item count |
| FQ4 | Git sync in MVP? | answered | No — design now, implement last (T10 separate feature) |

## Architecture

| Area | Design |
|------|--------|
| Bounded contexts | See [domain-specification.md](../docs/domain-specification.md); no `git` in MVP |
| Packages | `auth`, `identity`, `catalog`, `course`, `enrollment`, `progress`, `mailer`, `infra` |
| Layers | Endpoint → Service → Repository per [cursos-layered-architecture.mdc](../.cursor/rules/cursos-layered-architecture.mdc) |
| Auth | SmallRye JWT validates Passport token; `IdentityService` upserts on first request |
| Schema | Tables per ARCHITECTURE §9; enums REQUESTED/ENROLLED/REJECTED; item types MARKDOWN/IMAGE/VIDEO |
| Catalog | `CatalogService` aggregates three list queries |
| Enrollment | `EnrollmentService` enforces invariants; `MailerService` on approve/direct |
| Progress | `ProgressService` — mark, adjust, percentage |
| Frontend | Angular routes per feature-catalog; `auth.interceptor.ts` Bearer from Passport login |
| Dev | Port 8083; `dev-import.sql` sample courses/enrollments; Passport on 8080 |

### Architecture questions (AQ*n*)

| # | Question | Status | Answer |
|---|----------|--------|--------|
| AQ1 | Monolith vs multi-module? | answered | Single Maven module modular monolith (Issues pattern) |
| AQ2 | Media storage? | answered | PostgreSQL bytea on `tb_course_items.media_content` for MVP |
| AQ3 | Identity cache? | answered | `tb_identities` keyed by Passport `sub` |
| AQ4 | Endpoint style? | answered | One HTTP method per class under `{context}.{action}` |

## Changelog

### MVP platform — 2026-07-18

**Version:** 1  
**Status:** done

**Description:** Initial Cursos platform — catalog, courses, items, enrollment, progress, Passport JWT.

**Impact on other features:**

| Feature / area | Impact |
|----------------|--------|
| git-course-sync | Blocked until this changelog is `done` |

#### Feature checklist

| ID | Criterion | Source | Done |
|----|-----------|--------|------|
| FC1 | Catalog home shows Ensinando, Matriculado, Disponível/Solicitado | Wireframe, FQ1 | ☐ |
| FC2 | Teacher creates course and becomes owner | FQ1, domain spec | ☐ |
| FC3 | Course items support MARKDOWN, IMAGE, VIDEO with bytea media | AQ2 | ☐ |
| FC4 | Student REQUESTED enrollment; teacher approve/reject | FQ2 | ☐ |
| FC5 | Teacher direct enroll sends email notification | FQ2 | ☐ |
| FC6 | Student marks items; teacher adjusts; progress % shown | FQ3 | ☐ |
| FC7 | Passport JWT auth — no local password storage | Architecture | ☐ |
| FC8 | `domain-specification.md` and `feature-catalog.md` updated | Impact | ☐ |
| FC9 | `dev-import.sql` exercises all catalog sections | Impact | ☐ |

#### Tasks

| ID | Task | Done |
|----|------|------|
| T1 | Project bootstrap: Quarkus + Quinoa, Flyway baseline, Passport JWT config, `dev-import.sql` skeleton | ☐ |
| T2 | Identity context: `tb_identities`, JWT → current user, `GET /auth/me`, sync endpoint | ☐ |
| T3 | Categories: entity, repository, CRUD API, seed categories | ☐ |
| T4 | Course aggregate: create/update/publish, teacher ownership enforcement | ☐ |
| T5 | Course items: MARKDOWN/IMAGE/VIDEO, reorder, media upload/download | ☐ |
| T6 | Catalog API: teaching, enrolled, available-requested list endpoints | ☐ |
| T7 | Enrollment: request, approve, reject, direct enroll + MailerService | ☐ |
| T8 | Progress: mark complete, teacher adjust, percentage summary | ☐ |
| T9 | Angular SPA: catalog home wireframe, course edit/study, enrollment admin, categories | ☐ |

#### Test coverage

| ID | Test | Covers | Done |
|----|------|--------|------|
| TC1 | `IdentitySyncEndpointTest` | T2 | ☐ |
| TC2 | `CategoryEndpointTest` | T3 | ☐ |
| TC3 | `CourseEndpointTest` + teacher guard | T4 | ☐ |
| TC4 | `CourseItemEndpointTest` (all types + reorder) | T5 | ☐ |
| TC5 | `CatalogEndpointTest` (three sections) | T6 | ☐ |
| TC6 | `EnrollmentEndpointTest` (request/approve/direct) | T7 | ☐ |
| TC7 | `ProgressEndpointTest` (mark/adjust/percentage) | T8 | ☐ |
| TC8 | `catalog-home.component.spec.ts` | T9 | ☐ |
| TC9 | `ArchitectureTest` bounded context rules | T1–T8 | ☐ |

**Development approval:** approved 2026-07-18 — tasks: T1, T2, T3, T4, T5, T6, T7, T8, T9, T10

Note: **T10** (Git course sync) is tracked in [git-course-sync.md](git-course-sync.md) and must not start until this feature is `done`.

**Implementation notes:** (pending — documentation-only session 2026-07-18)

### 2026-07-18 — Ensinando on home + live author summary

**Version:** 2  
**Status:** done

**Description:** Show **Ensinando** on the student-first catalog home. Add live Passport **author description** to course summary (two panels: course + author).

**Impact on other features:** course-authoring-ux (study view summary); Passport user description.

#### Wireframe — home Ensinando

```
Catálogo
├─ Ensinando (own courses: draft/published badges; Visualizar / Editar / Publicar|Despublicar)
├─ Matriculado
└─ Disponível / Solicitado
```

#### Wireframe — course summary panels

```
┌─────────────────────┬─────────────────────┐
│ Sobre o curso       │ Sobre o autor       │
│ summary text        │ avatar + name + bio │
└─────────────────────┴─────────────────────┘
```

#### Feature checklist

| ID | Criterion | Done |
|----|-----------|------|
| FC10 | Home shows Ensinando for taught courses | ☑ |
| FC11 | Live author description from Passport on course summary | ☑ |
| FC12 | Domain/feature-catalog/ARCHITECTURE updated | ☑ |

#### Tasks

| ID | Task | Done |
|----|------|------|
| T40 | Render Ensinando section + actions on home | ☑ |
| T41 | Passport user description + batch public authors API | ☑ |
| T42 | Cursos hydrate author + two-panel summary + Minha conta field | ☑ |

#### Test coverage

| ID | Test | Covers | Done |
|----|------|--------|------|
| TC10 | Home Ensinando section + no Available duplicate | T40 | ☑ |
| TC11 | Passport description update + batch authors | T41 | ☑ |
| TC12 | Course summary panels show live bio | T42 | ☑ |

**Development approval:** approved 2026-07-18 — tasks: T40, T41, T42 (plan implementation)

**Implementation notes:** Passport `User.description` + `POST /directory/authors`; Cursos `AuthorProfileService` hydrates catalog/course detail; home **Ensinando**; Minha conta description field.

