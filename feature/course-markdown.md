# Course markdown (Marked)

**Feature version:** 1  
**Status:** done  
**Requested:** 2026-07-20

## Summary

Replace the hand-rolled study markdown pipeline and the plain teacher textarea experience with a shared **[Marked](https://marked.js.org/)**-based renderer (plus **DOMPurify** sanitization). Teachers keep editing raw Markdown and get a **live preview**; students see the same rendering rules (including `course-asset:{id}` embeds).

## Wireframe

### Study `/courses/:id/lessons/:itemId` (markdown aula)

```
┌──────────────┬───────────────────────────────────────────────┐
│ Aula tree    │ Aula title                                    │
│              │ <HTML from Marked + DOMPurify>                │
│              │ (course-asset images via signed URLs)         │
└──────────────┴──────────────────────────────────────────────┘
```

### Teacher editor `/teacher/courses/:id/edit` — markdown item

```
┌──────────────┬────────────────────────┬──────────────────────┐
│ Items        │ Markdown (source)      │ Pré-visualização     │
│              │ textarea / mat-field   │ (Marked, same rules) │
│              │ [gallery insert…]      │                      │
└──────────────┴────────────────────────┴──────────────────────┘
```

Narrow viewports: source on top, preview below. Gallery insert still writes `![alt](course-asset:{id})` into the source.

### Novo curso `/teacher/courses/new`

No markdown pane until after create (unchanged). Full-width shell (prior layout fix).

## Impact

| Area | Change |
|------|--------|
| Bounded contexts | Angular only (`course-view`, `course-edit`); no backend/API/schema |
| Packages | Shared `course-markdown` module under `webui` (renderer facade over Marked) |
| API / OpenAPI | None |
| Schema / Flyway | None |
| UI | Study HTML via Marked; editor live preview; gallery insert unchanged |
| Tests | Renderer unit tests retargeted to Marked pipeline; course-view XSS/sanitization; course-edit preview |
| Docs | Domain Ubiquitous Language (**Study markdown**); feature-catalog; ui-elements-gallery; package.json deps |
| Cross-feature | [course-authoring-ux.md](course-authoring-ux.md) editor pane; [student-study-experience.md](student-study-experience.md) study render |

### Risks

- Marked does **not** sanitize HTML — DOMPurify (or isomorphic-dompurify) is mandatory on all outputs ([Marked security](https://marked.js.org/)).
- External image URLs must remain rejected; only `course-asset:{id}` → signed URL.
- `javascript:` / unsafe links must stay blocked (DOMPurify + link policy).
- Bundle size: `marked` + `dompurify` (acceptable for SPA).

### Feature questions (FQ)

| ID | Question | Status | Answer |
|----|----------|--------|--------|
| **FQ1** | Scope: teacher editor, study renderer, or both? | answered | **Both** |
| **FQ2** | Which library? | answered | **[Marked](https://marked.js.org/)** for markdown→HTML; pair with DOMPurify for sanitization |

### Architecture questions (AQ)

| ID | Question | Status | Answer |
|----|----------|--------|--------|
| **AQ1** | Teacher editor UX with Marked (compiler, not an editor)? | answered | Keep raw Markdown source; add **live preview** using the shared Marked pipeline. Side-by-side ≥900px; stacked on narrow. No second editor library. |
| **AQ2** | Markdown dialect / GFM extras (tables, strikethrough, task lists)? | answered | Enable Marked **GFM** defaults; keep domain invariants: strip/sanitize raw HTML; external images rejected; only `course-asset:` images; links http(s) only after sanitize. |
| **AQ3** | Package placement? | answered | Shared pure module `src/app/markdown/course-markdown.ts` (+ specs); both `course-view` and `course-edit` call it. Delete/replace `course-view/course-markdown.renderer.ts`. |

## Architecture

### Layers / packages

```
course-edit / course-view (Angular components)
        ↓
course-markdown.ts  →  marked.parse  →  DOMPurify.sanitize
        ↓
custom image/link hooks for course-asset: + signed URL map
```

No Endpoint/Service/Repository changes.

### Rendering contract

1. `extractCourseAssetIds(markdown)` — keep (regex or walk tokens).
2. `renderCourseMarkdown(markdown, signedUrlByAssetId)` — Marked + custom `image` renderer:
   - `course-asset:{id}` → `<img>` only if id is in the signed map; else omit/escape as text.
   - other image hrefs → do not emit `<img>` (text fallback).
3. Links: allow only `http:`/`https:` (Marked `cleanUrl` + DOMPurify).
4. Always `DOMPurify.sanitize(html, { … })` with a tight allowlist aligned to study styles (headings, p, lists, code/pre, strong/em, a, img, br, blockquote, table elements if GFM).

### Teacher editor

- Source: existing `[(ngModel)]="itemBody"` textarea (gallery insert API unchanged).
- Preview: `innerHTML` bound to `renderCourseMarkdown(itemBody, previewUrlMap)` (reuse gallery signed URLs when available; otherwise show unresolved assets as plain).
- Dirty / save / unsaved guard unchanged.

### Tests

- Port existing `course-markdown.renderer.spec.ts` cases to Marked module.
- Keep course-view XSS regression (`<script>`, `onerror`).
- Add course-edit preview presence + updates when `itemBody` changes.

## Changelog

### 2026-07-20 — Marked pipeline for study + teacher preview

**Status:** `done`  
**Development approval:** approved 2026-07-20 — tasks: T1, T2, T3, T4, T5, Tdev  
**Impact on other features:** Replaces custom study renderer from [student-study-experience.md](student-study-experience.md); extends markdown pane in [course-authoring-ux.md](course-authoring-ux.md). No API change.

#### Feature checklist

| ID | Criterion | Source | Done |
|----|-----------|--------|------|
| **FC1** | Study markdown aulas render via Marked + DOMPurify | FQ1, FQ2 | ☑ |
| **FC2** | `course-asset:` embeds resolve to signed URLs; external images rejected | Domain invariants | ☑ |
| **FC3** | XSS vectors stripped (script/onerror/javascript links) | Security / Marked docs | ☑ |
| **FC4** | Teacher markdown item shows live preview matching study rules | AQ1, Wireframe | ☑ |
| **FC5** | Gallery “Inserir no Markdown” still inserts into source | Authoring UX | ☑ |
| **FC6** | Domain spec + feature-catalog + ui gallery updated | Docs | ☑ |
| **FCdev** | Dev: edit markdown item and confirm preview + study view match | Dev experience | ☑ |

#### Tasks

| ID | Task | Maps to | Done |
|----|------|---------|------|
| **T1** | Add npm deps `marked` + `dompurify` (+ `@types/dompurify` if needed) | FC1 | ☑ |
| **T2** | Implement shared `course-markdown.ts` (Marked + DOMPurify + course-asset hooks); migrate/replace old renderer; keep `extractCourseAssetIds` | FC1–FC3 | ☑ |
| **T3** | Wire `course-view` to shared module; keep styles on `.markdown` | FC1–FC3 | ☑ |
| **T4** | Teacher editor: live preview pane (responsive split); bind to shared renderer | FC4, FC5 | ☑ |
| **T5** | Update docs (domain-spec, feature-catalog, ui-elements-gallery, feature README) | FC6 | ☑ |
| **Tdev** | Manual check in `mvn quarkus:dev`: edit preview vs study for same aula | FCdev | ☑ |

#### Test coverage

| ID | Coverage | Tasks | Done |
|----|----------|-------|------|
| **TC1** | Unit: Marked pipeline — bold/lists/code/links/fences/GFM basics, course-asset map, reject external images, XSS strip | T2 | ☑ |
| **TC2** | Angular course-view: sanitized HTML, no raw `<pre class="markdown">` regression | T3 | ☑ |
| **TC3** | Angular course-edit: preview region updates with `itemBody`; sidebar/gallery insert still works | T4 | ☑ |

#### Implementation notes

- Shared module: `src/main/webui/src/app/markdown/course-markdown.ts` ([Marked](https://marked.js.org/) 18 + DOMPurify).
- Removed hand-rolled `course-markdown.renderer.ts`.
- Teacher editor: `.markdown-editor-split` with live **Pré-visualização**.
- Verified: `course-markdown` + `course-edit` + `course-view` specs green; `npm run build` green.
