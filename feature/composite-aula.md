# Composite aula

**Feature version:** 1  
**Status:** in-progress  
**Requested:** 2026-07-20

## Summary

Allow one **aula** (course item) to contain an **ordered list of aula blocks** (Markdown, Video, Link, Image). Within a single aula the teacher may stack any mix (e.g. video + markdown + link, only video, two videos, …). **Progress**, **sequential unlock**, and **discussion** stay **per aula**. All existing single-type aulas migrate to **≥1 block** (unified model; no legacy `COMPOSITE` type).

## Wireframe

### Study `/courses/:id/lessons/:itemId`

```
┌──────────────┬───────────────────────────────────────────────┐
│ Aula tree    │ Aula title                                    │
│ (icon from   │ ┌ block: video player ─────────────────────┐ │
│  first block │ └──────────────────────────────────────────┘ │
│  type)       │ ┌ block: markdown (Marked HTML) ───────────┐ │
│              │ └──────────────────────────────────────────┘ │
│              │ ┌ block: link CTA ─────────────────────────┐ │
│              │ └──────────────────────────────────────────┘ │
│              │ [Concluir aula]  discussion…                  │
└──────────────┴──────────────────────────────────────────────┘
```

### Teacher editor `/teacher/courses/:id/edit`

```
┌──────────────┬───────────────────────────────────────────────┐
│ Aulas        │ Aula title                                    │
│ • Intro ●    │ Blocks:                                       │
│ • Setup      │  [≡] Video ………  ↑ ↓ ×                         │
│ [+ shortcuts]│  [≡] Markdown … ↑ ↓ ×                         │
│  Markdown /  │  [≡] Link ………   ↑ ↓ ×                         │
│  Vídeo /     │  [+ Bloco ▼ Markdown|Vídeo|Link|Imagem]       │
│  Link / …    │ Selected block editor + markdown preview      │
│              │ [Salvar]                                      │
└──────────────┴──────────────────────────────────────────────┘
```

**Create shortcuts (FQ5):** “Novo item” type picker still creates an **aula + one block** of that type. **+ Bloco** adds another block to the selected aula.

## Impact

| Area | Change |
|------|--------|
| Bounded contexts | `course` owns `AulaBlock`; `progress` / `discussion` unchanged (still `course_item_id`) |
| Schema | `V1.0.1__Aula_Blocks.sql` (create `tb_aula_blocks`, backfill, drop item content columns); `dev-import.sql` |
| API | Item responses include `blocks[]`; create-item shortcuts create item+block; block CRUD + reorder |
| UI | Editor: aulas + blocks; study: stacked renderers; sidebar icon = first block type |
| Tests | Endpoint + Angular + migration seed scenarios |
| Docs | domain-spec, ARCHITECTURE, feature-catalog, git-sync note |
| Cross-feature | authoring UX, study experience, course-markdown (per markdown block), git-course-sync later |

### Risks

- Broad API/UI rewrite; keep OpenAPI codegen in sync.
- Playback/study paths must resolve media via block `resource_id` while auth stays aula-scoped.
- Publish validation: every aula must have ≥1 block (**FQ3**).

### Feature questions (FQ)

| ID | Question | Status | Answer |
|----|----------|--------|--------|
| **FQ1** | Unify all aulas as ≥1 blocks vs legacy + `COMPOSITE`? | answered | **Unify / migrate** |
| **FQ2** | Progress and discussion per-aula only in v1? | answered | **Yes** |
| **FQ3** | Empty draft aulas vs ≥1 block? | answered | **≥1** required (save / publish / study) |
| **FQ4** | Multiple same-type blocks? Max? | answered | **Yes**, **no max** |
| **FQ5** | Create flow? | answered | **Shortcuts** create aula + one block; **+ Bloco** adds more |
| **FQ6** | Sidebar icon for mixed aulas? | answered | **First-block type** |
| **FQ7** | Block types in v1? | answered | **MARKDOWN, VIDEO, LINK, IMAGE** |
| **FQ8** | Concluir aula explicit only? | answered | **Yes** (no video auto-complete) |

### Architecture questions (AQ)

| ID | Question | Status | Answer |
|----|----------|--------|--------|
| **AQ1** | Persistence shape? | answered | `tb_course_items` = aula shell (title, sort_order); `tb_aula_blocks` = ordered blocks with type + payload + optional `resource_id` |
| **AQ2** | API strategy? | answered | Keep create shortcuts (`…/items/markdown`, `…/link`, `…/media`) as **aula + one block**; add block CRUD under `…/items/{itemId}/blocks/…`; `CourseItemResponse` always includes ordered `blocks[]`; remove content fields from item |
| **AQ3** | Playback URL grain? | answered | Keep ticket/stream keyed by `courseId` + **aula** `itemId` + `resourceId` (resource owned via block → item); no per-block path required |
| **AQ4** | Delete last block? | answered | **Forbidden** while ≥1 required — delete block only if another remains; deleting the **aula** removes all blocks |
| **AQ5** | Enum rename? | answered | Introduce `AulaBlockType` (same values); retire `CourseItem.itemType` after migration |
| **AQ6** | Flyway strategy? | answered | **Incremental** `V1.0.1__Aula_Blocks.sql` — first version is deployed; do not edit `V1.0.0` |

## Architecture

### Domain

```
Course 1—* CourseItem (aula: title, sort_order)
CourseItem 1—* AulaBlock (sort_order, block_type, markdown/link/resource)
Enrollment —* ItemProgress → CourseItem
CourseItem —* Comment
```

### Schema (`V1.0.1__Aula_Blocks.sql`)

`tb_aula_blocks`:

| Column | Notes |
|--------|--------|
| id | PK |
| course_item_id | FK → `tb_course_items` ON DELETE CASCADE |
| sort_order | unique per item |
| block_type | `MARKDOWN` \| `VIDEO` \| `LINK` \| `IMAGE` |
| markdown_body | MARKDOWN |
| link_url / link_description | LINK |
| resource_id | IMAGE/VIDEO → `tb_course_resources` |
| created_at / updated_at | |

`tb_course_items`: drop `item_type`, `markdown_body`, `link_*`, `resource_id` (content lives on blocks only).

### Layers

```
*Endpoint → CourseService → CourseItemRepository / AulaBlockRepository → DB
```

Packages: `course` + `course.item.*` (extend with `course.item.block.*` for block endpoints).

### API (delta)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/courses/{id}/items/markdown` | Create aula + first MARKDOWN block (shortcut) |
| POST | `/courses/{id}/items/link` | Create aula + first LINK block |
| POST | `/courses/{id}/items/media` | Create aula + first IMAGE/VIDEO block |
| PUT | `/courses/{id}/items/{itemId}` | Update aula **title** only (or title + replace — prefer title) |
| POST | `/courses/{id}/items/{itemId}/blocks/markdown` | Append MARKDOWN block |
| PUT | `/courses/{id}/items/{itemId}/blocks/{blockId}/markdown` | Update MARKDOWN block |
| POST | `/courses/{id}/items/{itemId}/blocks/link` | Append LINK |
| PUT | `/courses/{id}/items/{itemId}/blocks/{blockId}/link` | Update LINK |
| POST | `/courses/{id}/items/{itemId}/blocks/media` | Append IMAGE/VIDEO |
| DELETE | `/courses/{id}/items/{itemId}/blocks/{blockId}` | Delete block if ≥2 remain |
| POST | `/courses/{id}/items/{itemId}/blocks/reorder` | Reorder blocks |
| GET | `/courses/{id}` / study | Item payloads include `blocks[]` |

Existing update-markdown / update-link on **item** either retarget first matching block or are replaced by block PUT (prefer **replace** with block endpoints; update Angular accordingly).

### Frontend

- **course-edit:** sidebar = aulas; main = title + block list + selected block editor (reuse Marked preview for markdown blocks).
- **course-view:** render `blocks` in order (video player / markdown / link / image).
- Sidebar type icon from `blocks[0].blockType` (**FQ6**).

### Tests

- Backend: create shortcut → 1 block; add second block; reject delete last block; reorder; study returns stacked blocks; progress still on item.
- Angular: editor block list; study stacked render; icon from first block.
- `dev-import.sql`: seed aulas as items + blocks.

## Changelog

### 2026-07-20 — Composite aula (blocks inside one aula)

**Status:** `in-progress`  
**Development approval:** approved 2026-07-20 — tasks: T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, Tdev  
**Flyway note (2026-07-20):** First version is **deployed** — schema changes use a **new** migration (`V1.0.1__…`), not edits to `V1.0.0`.  
**Impact on other features:** [course-authoring-ux.md](course-authoring-ux.md); [student-study-experience.md](student-study-experience.md); [course-markdown.md](course-markdown.md) per markdown block; [git-course-sync.md](git-course-sync.md) (later: one aula → many blocks).

#### Feature checklist

| ID | Criterion | Source | Done |
|----|-----------|--------|------|
| **FC1** | Aula may contain ordered mix of blocks (any combination) | Request, FQ4, FQ7 | ☐ |
| **FC2** | Single-block aulas valid (e.g. only video) | Request, FQ1 | ☐ |
| **FC3** | Tree / unlock / Concluir aula / discussion per aula | FQ2, FQ8 | ☐ |
| **FC4** | Teacher add/reorder/delete blocks; cannot delete last block | Wireframe, AQ4 | ☑ |
| **FC5** | Shortcuts create aula + one block; + Bloco adds more | FQ5 | ☑ |
| **FC6** | Sidebar icon from first block type | FQ6 | ☑ |
| **FC7** | Study stacks all blocks in order | Wireframe | ☑ |
| **FC8** | ≥1 block enforced | FQ3 | ☐ |
| **FC9** | Seed + docs (domain, catalog, ARCHITECTURE) | Impact | ☑ (catalog + ui gallery; domain/ARCHITECTURE via backend tasks) |
| **FCdev** | Dev: multi-block aula editable and studyable | Dev experience | ☐ |

#### Tasks

| ID | Task | Maps to |
|----|------|---------|
| **T1** | Domain spec UL + invariants for Aula block; ARCHITECTURE API/schema notes | FC9 |
| **T2** | Flyway `V1.0.1__Aula_Blocks.sql`: create `tb_aula_blocks`, backfill from items, drop item content columns; entities/`AulaBlock`/`AulaBlockRepository` | FC1, FC2, FC8 |
| **T3** | `CourseService` + migrate create/update/list to blocks; `CourseItemResponse` + `AulaBlockResponse` | FC1–FC3, FC8 |
| **T4** | Block endpoints (CRUD markdown/link/media, reorder, delete-last guard); adjust/retire item-level content updates | FC4, FC5 |
| **T5** | Endpoint tests (shortcuts, multi-block, delete guard, study/detail payloads) | FC1–FC5, FC8 |
| **T6** | `dev-import.sql` seed items + blocks | FC9, FCdev |
| **T7** | Angular course-edit: aulas + blocks UI, shortcuts, Marked preview per markdown block | FC4–FC6 | ✅ |
| **T8** | Angular course-view: stacked block render; first-block sidebar icon | FC6, FC7 | ✅ |
| **T9** | Angular specs + `npm run generate:api` / build | FC4–FC7 | ✅ |
| **T10** | feature-catalog + ui-elements-gallery | FC9 | ✅ |
| **Tdev** | Manual: create multi-block aula, study + conclude | FCdev |

#### Test coverage

| ID | Coverage | Tasks |
|----|----------|-------|
| **TC1** | Backend: shortcut creates item+1 block; append block; reorder; reject delete last; publish/study ≥1 | T3–T5 |
| **TC2** | Backend: progress/comments still on `course_item_id` with multi-block aula | T5 |
| **TC3** | Angular edit: block list, add/reorder/delete, shortcut create | T7, T9 | ✅ |
| **TC4** | Angular study: stacked blocks + first-block icon | T8, T9 | ✅ |

**Implementation notes (Angular T7–T10, 2026-07-20):** `npm run generate:api` + `npm run build` green; course-edit/course-view specs **49/49** green. Title save for media-only aulas still relies on markdown/link update shortcuts (no title-only API). Playback ticket covers first VIDEO block only when an aula has multiple videos.
