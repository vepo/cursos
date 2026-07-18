# Course authoring UX

**Feature version:** 1  
**Status:** done  
**Requested:** 2026-07-18

## Summary

Improve teacher course authoring: two-pane editor with left item list and main edit form, unsaved-changes concern when switching items or leaving the route, clear **Publicar curso** / **Despublicar** controls, and a clearer aula discussion composer (**Comentar** instead of ambiguous **Publicar**).

## Wireframe

### Editor `/teacher/courses/:id/edit`

```
┌──────────────┬───────────────────────────────────────────────┐
│ SIDEBAR      │ MAIN                                          │
│ Detalhes     │ [badge Rascunho] [Publicar curso] [Salvar]    │
│ • Aula 1 ●   │ Title / markdown body (selected item)         │
│ • Aula 2     │ or course details + Git                       │
│ [+ Novo item]│                                               │
└──────────────┴──────────────────────────────────────────────┘
```

Dirty selection shows a dot; switch/leave prompts confirm.

### Comments (study)

Composer card: avatar initial, placeholder "Participe da discussão…", button **Comentar** (disabled when empty).

## Impact

| Area | Change |
|------|--------|
| API | `POST /courses/{id}/unpublish` |
| UI | course-edit two-pane; teacher-home badges; course-view comments |
| Guards | `CanDeactivate` on edit route |

### Feature questions (FQ)

| ID | Question | Status | Answer |
|----|----------|--------|--------|
| **FQ1** | Unsaved concern on item switch and route leave? | answered | Yes — confirm dialog + beforeunload |
| **FQ2** | Comment CTA label? | answered | **Comentar** |

### Architecture questions (AQ)

| ID | Question | Status | Answer |
|----|----------|--------|--------|
| **AQ1** | Unpublish endpoint? | answered | Mirror publish: `UnpublishCourseEndpoint` |
| **AQ2** | Dirty guard? | answered | Functional `CanDeactivate` + component `canDeactivate()` |

## Architecture

- `CourseService.unpublish` + `UnpublishCourseEndpoint`
- Editor uses existing `CourseItemsApi` create/update/delete/reorder
- Shared confirm via `window.confirm` (MVP) for dirty switch/leave

## Changelog

### 2026-07-18 — Authoring UX

**Status:** `approved`

## Feature checklist

| ID | Criterion | Done |
|----|-----------|------|
| FC1 | Two-pane editor with item select/add/reorder/delete | ☑ |
| FC2 | Dirty guard on switch and route leave | ☑ |
| FC3 | Publish/unpublish clear in editor + teacher home | ☑ |
| FC4 | Comment UI uses Comentar; composer clearer | ☑ |

## Tasks

| ID | Task | Done |
|----|------|------|
| T31 | Unpublish endpoint + test | ☑ |
| T32 | Two-pane course editor | ☑ |
| T33 | Dirty tracking + CanDeactivate + beforeunload | ☑ |
| T34 | Status badge + publish/unpublish UI | ☑ |
| T35 | Comment composer redesign | ☑ |

## Test coverage

| ID | Test | Covers | Done |
|----|------|--------|------|
| TC1 | Unpublish API | T31 | ☑ |
| TC2 | Editor item switch / dirty | T32–T33 | ☑ |
| TC3 | Comment button label | T35 | ☑ |

**Development approval:** approved 2026-07-18 — tasks: T31–T35 (plan implementation)

### 2026-07-18 — Link and video aulas + heading hierarchy

**Status:** done

**Description:** Support MARKDOWN, LINK, and VIDEO aulas. Fix Markdown heading hierarchy below aula title. Authenticated seekable video playback via signed tickets + Range streaming.

#### Feature checklist

| ID | Criterion | Done |
|----|-----------|------|
| FC5 | Markdown h1 smaller than aula title | ☑ |
| FC6 | LINK aula create/view with safe Abrir recurso | ☑ |
| FC7 | VIDEO upload to DB + seekable authenticated playback | ☑ |

#### Tasks

| ID | Task | Done |
|----|------|------|
| T43 | Markdown heading CSS + size contract test | ☑ |
| T44 | LINK type, schema, API, editor, student view | ☑ |
| T45 | VIDEO upload validation + editor UX | ☑ |
| T46 | Playback tickets + Range streaming + player | ☑ |

#### Test coverage

| ID | Test | Covers | Done |
|----|------|--------|------|
| TC4 | Heading hierarchy font-size contract | T43 | ☑ |
| TC5 | LINK validation + safe anchor | T44 | ☑ |
| TC6 | VIDEO upload + ticket/range security | T45–T46 | ☑ |

**Development approval:** approved 2026-07-18 — tasks: T43–T46 (plan implementation)

**Implementation notes:** `CourseItemType.LINK` + `link_url`/`link_description`; VIDEO upload limit 250 MiB; HMAC playback tickets + PostgreSQL `substr` Range streaming; course-view player and editor type selector.

