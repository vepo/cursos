# Agent instructions (Cursos)

Read these before changing code or tests:

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Stack, packages, patterns, API map, naming, feature workflow |
| [docs/domain-specification.md](docs/domain-specification.md) | Ubiquitous language, bounded contexts, invariants |
| [docs/feature-catalog.md](docs/feature-catalog.md) | UI routes and navigation paths |
| [docs/backlog.md](docs/backlog.md) | Ordered product backlog (ideas and priority) |
| [feature/](feature/) | Feature analysis, tasks, approval, and changelog per capability |
| [.cursor/rules/](.cursor/rules/) | Four pillars + file-scoped detail |
| [.cursor/agents/](.cursor/agents/) | Project subagents (specialized behaviour) |
| [.cursor/skills/cursos-agent/](.cursor/skills/cursos-agent/) | Skill: build and extend the Cursos platform |

**Not in production yet**: This project is not in production yet. There is no need to keep legacy or update any production environment. Schema changes: amend `V1.0.0__Database_Creation.sql` only — see [cursos-flyway.mdc](.cursor/rules/cursos-flyway.mdc).

**Authentication:** Cursos trusts **Passport** JWT (RS256). Users log in via Passport; Cursos validates the Bearer token and reads `sub` / `groups` from JWT claims. Dev stack: Passport on **8080**, Cursos on **8083**.

**Development process:** [development-process.mdc](.cursor/rules/development-process.mdc) — (1) feature analysis → (2) architecture design → (3) task break → (4) **explicit task approval** → (5) TDD. Each feature doc has **Wireframe** and **Architecture** sections; each changelog entry maintains a **Feature checklist** (**FC*n***) **rechecked before `done`**. Two question kinds: **FQ*n*** (product) and **AQ*n*** (technical). Answering FQ/AQ triggers a mandatory **impact review** (not approval). No code before approved task IDs. **Never end with non-working code** — `mvn verify` green before stopping.

**API codegen:** after backend endpoint changes, run `mvn test` then `cd src/main/webui && npm run generate:api`. Endpoints live in `{context}.{action}` subpackages — one HTTP method per class (e.g. `course.create.CreateCourseEndpoint`).

## Bounded contexts (modular monolith)

Single Maven module; logical packages under `dev.vepo.cursos.*`:

| Context | Packages |
|---------|----------|
| Platform | `infra` |
| Identity & access | `auth`, `identity` |
| Catalog | `catalog` |
| Course | `course` |
| Enrollment | `enrollment` |
| Progress | `progress` |
| Study | `study` |
| Discussion | `discussion` |
| Email | `mailer` |
| Git course sync | `git` — **design now; implement after MVP** |

Full dependency rules: [docs/domain-specification.md](docs/domain-specification.md) §Bounded contexts.

## Agents vs commands

| Surface | Location | Purpose |
|---------|----------|---------|
| **Subagents** | `.cursor/agents/*.md` | Specialized system prompts — TDD, domain modeling, API contract review. Delegate by name or let Cursor route from `description`. |
| **Commands** | `.cursor/commands/*.md` | Repeatable workflows you slash-invoke — fix all tests, Sonar loop, coverage loop, structure review. |

## Rules — four pillars (always on)

| Pillar | Rule | Covers |
|--------|------|--------|
| 1. Building the model | [cursos-model.mdc](.cursor/rules/cursos-model.mdc) | Domain language, architecture, packages, **TDD guidance**, doc triggers |
| 2. Testing | [cursos-testing.mdc](.cursor/rules/cursos-testing.mdc) | Tiered Maven/Angular commands, impact map, failure workflow |
| 3. Coding quality | [cursos-quality.mdc](.cursor/rules/cursos-quality.mdc) | Finish gate, ReadLints, `mvn verify`, standards index |
| 4. Platform usage | [cursos-platform.mdc](.cursor/rules/cursos-platform.mdc) | Java 21, Quarkus, Angular, approved libraries, tooling boundaries |

Additional always-on rules: [development-process.mdc](.cursor/rules/development-process.mdc) (five-phase gate + TDD), [change-request-analysis.mdc](.cursor/rules/change-request-analysis.mdc) (phase 1 feature analysis), [architecture-design.mdc](.cursor/rules/architecture-design.mdc) (phase 2 architecture design), [backlog-management.mdc](.cursor/rules/backlog-management.mdc) (ordered product backlog), [cursos-core.mdc](.cursor/rules/cursos-core.mdc), [domain-model.mdc](.cursor/rules/domain-model.mdc), [cursos-layered-architecture.mdc](.cursor/rules/cursos-layered-architecture.mdc), [cursos-bounded-contexts.mdc](.cursor/rules/cursos-bounded-contexts.mdc), [static-analysis.mdc](.cursor/rules/static-analysis.mdc), [development-experience.mdc](.cursor/rules/development-experience.mdc), [feature-catalog.mdc](.cursor/rules/feature-catalog.mdc), [readme.mdc](.cursor/rules/readme.mdc) (keep README features and quick start current).

## File-scoped rules

| Rule | Globs | Topic |
|------|-------|-------|
| [cursos-http-contract.mdc](.cursor/rules/cursos-http-contract.mdc) | `**/*Endpoint.java`, `**/*Request.java`, `**/*Response.java` | Request/Response records; no VO/DTO suffix |
| [cursos-java.mdc](.cursor/rules/cursos-java.mdc) | `**/*.java` | Style, logging, `var`, streams |
| [cursos-format-imports.mdc](.cursor/rules/cursos-format-imports.mdc) | `**/*.java` | Imports and formatter |
| [cursos-strings.mdc](.cursor/rules/cursos-strings.mdc) | `src/main/java/**/*.java` | String building |
| [cursos-jpa.mdc](.cursor/rules/cursos-jpa.mdc) | `*Repository.java` | EntityManager queries |
| [cursos-tests.mdc](.cursor/rules/cursos-tests.mdc) | `src/test/**` | REST Assured, Given, ArchUnit, domain narrative |
| [cursos-angular.mdc](.cursor/rules/cursos-angular.mdc) | `src/main/webui/**` | Components, services, Material |
| [cursos-ux.mdc](.cursor/rules/cursos-ux.mdc) | `src/main/webui/**` | Nielsen heuristics, flat UI design |
| [cursos-test-failure-diagnosis.mdc](.cursor/rules/cursos-test-failure-diagnosis.mdc) | `src/test/**` | Failure classification and reports |
| [documentation.mdc](.cursor/rules/documentation.mdc) | `docs/**`, `README.md` | User-facing docs maintenance |
| [dev-import-sql-safety.mdc](.cursor/rules/dev-import-sql-safety.mdc) | `dev-import.sql`, migrations | Safe dev seed changes |
| [cursos-flyway.mdc](.cursor/rules/cursos-flyway.mdc) | always on | Pre-production: amend `V1.0.0` only, no `V1.0.x` files |

## Project subagents (`.cursor/agents/`)

| Subagent | When to delegate |
|----------|------------------|
| [tdd-red](.cursor/agents/tdd-red.md) | New behaviour — **create** a failing test only (no production code) |
| [tdd-green](.cursor/agents/tdd-green.md) | After Red — minimal production code to pass the test |
| [tdd-refactor](.cursor/agents/tdd-refactor.md) | After Green — design cleanup, tests stay green |
| [domain-model](.cursor/agents/domain-model.md) | Before coding — domain-spec and vocabulary |
| [api-compliance](.cursor/agents/api-compliance.md) | Before merge — REST contract and ArchUnit rules |
| [docs-sync](.cursor/agents/docs-sync.md) | After API/behaviour change — architecture and feature catalog |
| [product-owner](.cursor/agents/product-owner.md) | Catalog/feature compliance gaps; backlog suggestions (no code) |
| [security-audit](.cursor/agents/security-audit.md) | Security findings report + teach-fix tasks (no patches) |

**TDD cycle (phase 5 only):** feature analysis → architecture design → task break → user approval → `tdd-red` → `tdd-green` → `tdd-refactor` per approved task.

## Commands (workflows only)

| Command | Purpose |
|---------|---------|
| [fix_tests.md](.cursor/commands/fix_tests.md) | Loop until tests pass |
| [fix_sonar_issues.md](.cursor/commands/fix_sonar_issues.md) | Static analysis fixes |
| [increase_coverage.md](.cursor/commands/increase_coverage.md) | Coverage improvements |
| [review_code_structure.md](.cursor/commands/review_code_structure.md) | Responsibilities, boundaries, duplication audit |
| [review_feature_catalog.md](.cursor/commands/review_feature_catalog.md) | Full feature-catalog vs implementation audit |
| [review_security.md](.cursor/commands/review_security.md) | Full-codebase security audit + remediation teaching tasks |

## Stack-specific workflow

**Backend:** entity → repository → service (if non-trivial) → `*Endpoint` with `*Request`/`*Response` records → `@QuarkusTest` + REST Assured.

**Frontend:** service → component → route → `*.spec.ts` when behaviour is non-trivial.

**Full-stack:** align API contract with Angular service; update [feature-catalog.md](docs/feature-catalog.md) when adding routes.

**Frontend finish gate:** `npm run build` (regenerates API client via `prebuild`) — not bare `ng build`.

**Tests:** use `Given` for seed data; run `mvn test` for backend, `npm test` in `src/main/webui` for frontend.

**MVP scope:** implement [feature/cursos-platform.md](feature/cursos-platform.md) tasks **T1–T9** first. **Git course sync** ([feature/git-course-sync.md](feature/git-course-sync.md), task **T10**) is designed but **blocked until MVP is done**.
