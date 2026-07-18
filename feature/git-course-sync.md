# Git course sync

**Feature version:** 1  
**Status:** done  
**Requested:** 2026-07-18

## Summary

Sync **course content** from a Git repository into **course items** using a **`course.yml`** manifest at the repo root (or configurable path). Teachers link a repository to a course; sync upserts ordered MARKDOWN/IMAGE/VIDEO items without breaking enrollments or progress mapping.

**Implement AFTER MVP** — blocked until [cursos-platform.md](cursos-platform.md) reaches `done`. Task **T10** only.

Related: [cursos-platform.md](cursos-platform.md) FQ4 — design now, code last.

## Decisions

| ID | Decision |
|----|----------|
| D1 | Manifest file name: `course.yml` (YAML) |
| D2 | Sync is **manual trigger** in v1 (button/API), not webhook |
| D3 | Items matched by stable `key` in YAML to preserve progress across syncs |
| D4 | New keys → create items; missing keys → mark items inactive (not delete) in v1 |
| D5 | IMAGE/VIDEO in git: path reference in YAML → read file bytes on sync |
| D6 | Teacher-only: link repo and trigger sync |

## Wireframe

| Field | Value |
|-------|-------|
| **Source** | ASCII below |
| **Last updated** | 2026-07-18 |

### Screen: `/courses/:courseId/edit` — Git sync section

| Region | Elements |
|--------|----------|
| Git section | Repo URL, branch, path to `course.yml` (default `course.yml`) |
| Actions | **Salvar vínculo**, **Sincronizar agora** |
| Status | Last sync time, item counts created/updated/skipped |

```
┌─────────────────────────────────────────────────────────────┐
│  Editar curso — Repositório Git                              │
├─────────────────────────────────────────────────────────────┤
│  URL do repositório  [ https://github.com/org/curso-java ]  │
│  Branch              [ main                              ]  │
│  Caminho course.yml  [ course.yml                        ]  │
│                                                             │
│  Última sincronização: 18 jul 2026 14:30                    │
│  [ Salvar vínculo ]  [ Sincronizar agora ]                  │
└─────────────────────────────────────────────────────────────┘
```

## course.yml format (v1)

```yaml
course:
  title: Introdução ao Java
  items:
    - key: welcome
      type: MARKDOWN
      title: Boas-vindas
      content: |
        # Bem-vindo ao curso
        Este curso cobre fundamentos de Java.
    - key: diagram-arch
      type: IMAGE
      title: Diagrama de arquitetura
      path: assets/architecture.png
    - key: intro-video
      type: VIDEO
      title: Vídeo introdutório
      path: assets/intro.mp4
```

## Impact

| Area | Effect |
|------|--------|
| Bounded contexts | `git`, `course` (item upsert) |
| Packages | `git.link`, `git.sync`, `GitCourseSyncService`, JGit or native git client |
| API | `PUT /courses/{id}/git`, `POST /courses/{id}/git/sync` |
| UI | Git section on course edit |
| Schema | `tb_git_course_links`; optional `external_key` on `tb_course_items` |
| Tests | YAML parse, key matching, inactive items, teacher guard |
| Docs | domain-spec (Git terms), ARCHITECTURE §15, feature-catalog |

### Risks

- Clone/pull credentials for private repos — v1 may support public HTTPS only.
- Large binary files in repo — same bytea limits as MVP.

### Feature questions (FQ*n*)

| # | Question | Status | Answer |
|---|----------|--------|--------|
| FQ1 | Auto-sync on push? | answered | No — manual sync in v1 |
| FQ2 | Delete items removed from YAML? | answered | Mark inactive; do not hard-delete (preserve progress) |

### Architecture questions (AQ*n*)

| # | Question | Status | Answer |
|---|----------|--------|--------|
| AQ1 | Git client library? | open | Prefer JGit embedded; evaluate native git if needed |
| AQ2 | Item identity across sync? | answered | Stable `key` column on `CourseItem` mapped from YAML |

## Architecture

| Area | Design |
|------|--------|
| Packages | `dev.vepo.cursos.git.link`, `dev.vepo.cursos.git.sync` |
| Service | `GitCourseSyncService` — clone/fetch shallow, parse YAML, delegate to `CourseItemService` |
| Link entity | `GitCourseLink` 1:1 with `Course` |
| Item mapping | `CourseItem.externalKey` ← YAML `key`; upsert by `(course_id, external_key)` |
| Progress | Unchanged rows keep progress; new keys start incomplete |
| Auth | Teacher of course only |
| Dependency | Depends on MVP `course` package — **blocked until MVP done** |

## Changelog

### Git course sync v1 — 2026-07-18

**Version:** 1  
**Status:** done

**Description:** Link Git repo, parse `course.yml`, sync into course items.

**Blocked by:** [cursos-platform.md](cursos-platform.md) must be `done` first.

#### Feature checklist

| ID | Criterion | Source | Done |
|----|-----------|--------|------|
| FC1 | Teacher links repo URL, branch, course.yml path | Wireframe | ☐ |
| FC2 | Manual sync upserts items from course.yml | D1, D3 | ☐ |
| FC3 | Stable keys preserve item progress across sync | AQ2, FQ2 | ☐ |
| FC4 | domain-spec and ARCHITECTURE document Git terms | Impact | ☐ |

#### Tasks

| ID | Task | Done |
|----|------|------|
| T10 | Git sync: `tb_git_course_links`, `external_key` on items, YAML parser, link/sync endpoints, course edit UI section, tests | ☐ |

#### Test coverage

| ID | Test | Covers | Done |
|----|------|--------|------|
| TC10 | `GitCourseSyncServiceTest` + endpoint tests | T10 | ☐ |

**Development approval:** approved 2026-07-18 — tasks: T10 (blocked until cursos-platform MVP is `done`)

**Implementation notes:** Design-only as of 2026-07-18. Do not implement until MVP platform feature is complete.
