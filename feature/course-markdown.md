# Course markdown (Marked)

**Feature version:** 2  
**Status:** done  
**Requested:** 2026-07-20

## Summary

Replace the hand-rolled study markdown pipeline and the plain teacher textarea experience with a shared **[Marked](https://marked.js.org/)**-based renderer (plus **DOMPurify** sanitization). Teachers keep editing raw Markdown and get a **live preview**; students see the same rendering rules (including `course-asset:{id}` embeds).

**v2 (planned):** fenced ```mermaid blocks render as interactive diagrams (e.g. `erDiagram`) in study and teacher preview via [Mermaid](https://mermaid.js.org/).

## Wireframe

### Study `/courses/:id/lessons/:itemId` (markdown aula)

```
┌──────────────┬───────────────────────────────────────────────┐
│ Aula tree    │ Aula title                                    │
│              │ <HTML from Marked + DOMPurify>                │
│              │ (course-asset images via signed URLs)         │
│              │ ┌ Mermaid diagram (SVG) ───────────────────┐  │
│              │ │ erDiagram / flowchart / …                │  │
│              │ └──────────────────────────────────────────┘  │
└──────────────┴───────────────────────────────────────────────┘
```

### Teacher editor `/teacher/courses/:id/edit` — markdown item

```
┌──────────────┬────────────────────────┬──────────────────────┐
│ Items        │ Markdown (source)      │ Pré-visualização     │
│              │ ```mermaid             │ (same Mermaid SVG)   │
│              │ erDiagram …            │                      │
│              │ ```                    │                      │
└──────────────┴────────────────────────┴──────────────────────┘
```

Narrow viewports: source on top, preview below. Gallery insert still writes `![alt](course-asset:{id})` into the source.

### Novo curso `/teacher/courses/new`

No markdown pane until after create (unchanged). Full-width shell (prior layout fix).

## Impact

| Area | Change |
|------|--------|
| Bounded contexts | Angular only (`course-view`, `course-edit`, `markdown/`); no backend/API/schema |
| Packages | Extend `course-markdown` (+ Mermaid init/run helper); optional lazy `mermaid` import |
| API / OpenAPI | None |
| Schema / Flyway | None (no new migration) |
| UI | Study + teacher preview render ```mermaid fences as diagrams |
| Tests | Unit: mermaid fence → container; invalid diagram fallback; XSS still stripped. Angular: study/preview show diagram node |
| Docs | Domain UL (**Study markdown** / Mermaid); feature-catalog; ui gallery |
| Cross-feature | [composite-aula.md](composite-aula.md) markdown blocks; [course-authoring-ux.md](course-authoring-ux.md); [student-study-experience.md](student-study-experience.md) |

### Risks

- Marked does **not** sanitize HTML — DOMPurify is mandatory on all outputs ([Marked security](https://marked.js.org/)).
- External image URLs must remain rejected; only `course-asset:{id}` → signed URL.
- `javascript:` / unsafe links must stay blocked (DOMPurify + link policy).
- Bundle size: `marked` + `dompurify` (acceptable for SPA).
- **Mermaid** is a large dependency and historically had XSS vectors — pin a current version, `securityLevel: 'strict'`, never pass unsanitized HTML into Mermaid; render from fenced **text** only.
- Async diagram paint after `innerHTML` — must re-run on aula/preview body changes without leaking listeners.
- Wide diagrams (ER) need horizontal scroll; Mermaid must use high-contrast colors on the light main content area (not Mermaid `dark`).

### Feature questions (FQ)

| ID | Question | Status | Answer |
|----|----------|--------|--------|
| **FQ1** | Scope: teacher editor, study renderer, or both? | answered | **Both** |
| **FQ2** | Which library? | answered | **[Marked](https://marked.js.org/)** for markdown→HTML; pair with DOMPurify for sanitization |
| **FQ3** | Mermaid surfaces: study, teacher preview, or both? | answered | **Both** (defaults accepted 2026-07-20) |
| **FQ4** | Which diagram types? (all Mermaid supports vs whitelist e.g. `erDiagram`, `flowchart`, `sequenceDiagram`) | answered | **All** Mermaid diagram types; configure `securityLevel: 'strict'` |
| **FQ5** | Invalid / unsupported diagram UX? | answered | Show error message + keep source; **do not** break the aula page |

### Architecture questions (AQ)

| ID | Question | Status | Answer |
|----|----------|--------|--------|
| **AQ1** | Teacher editor UX with Marked (compiler, not an editor)? | answered | Keep raw Markdown source; add **live preview** using the shared Marked pipeline. Side-by-side ≥900px; stacked on narrow. No second editor library. |
| **AQ2** | Markdown dialect / GFM extras (tables, strikethrough, task lists)? | answered | Enable Marked **GFM** defaults; keep domain invariants: strip/sanitize raw HTML; external images rejected; only `course-asset:` images; links http(s) only after sanitize. |
| **AQ3** | Package placement? | answered | Shared pure module `src/app/markdown/course-markdown.ts` (+ specs); both `course-view` and `course-edit` call it. Delete/replace `course-view/course-markdown.renderer.ts`. |
| **AQ4** | How to integrate Mermaid with sync `renderCourseMarkdown` → `innerHTML`? | answered | **Placeholder + `mermaid.run()`**: Marked code renderer emits `<pre class="course-mermaid">` with escaped source; after Angular binds `innerHTML`, call `hydrateCourseMermaid(root)` |
| **AQ5** | Load Mermaid eagerly or dynamic `import('mermaid')` on first fence? | answered | **Dynamic** `import('mermaid')` on first hydration (smaller initial bundle) |
| **AQ6** | Theme: Mermaid `dark` / `neutral` vs CSS variables matching Learn shell? | answered | **`base` + Learn light content tokens** (`lineColor`/`text` `#0F172A`, white edge-label bg); CSS overrides for ER lines/labels (revised 2026-07-20 — `dark` made lines/labels unreadable on light main) |

## Architecture

### Layers / packages

```
course-edit / course-view (Angular components)
        ↓
course-markdown.ts  →  marked.parse  →  DOMPurify.sanitize
        ↓
custom image/link hooks for course-asset: + signed URL map
        ↓  (v2, after DOM bind)
hydrateCourseMermaid(root) → dynamic import('mermaid') → mermaid.run → SVG
```

| Module | Role |
|--------|------|
| `app/markdown/course-markdown.ts` | Sync HTML; custom Marked `code` renderer for `lang === 'mermaid'` → `.course-mermaid` placeholder |
| `app/markdown/course-mermaid.ts` | `hydrateCourseMermaid(root)` — lazy init once (`theme: 'base'` + high-contrast `themeVariables`/`themeCSS`, `securityLevel: 'strict'`); error → `.course-mermaid-error` + source |
| `course-view` / `course-edit` | After setting markdown HTML, call hydrate (preview: after each body change; study: after aula load) |

No Endpoint/Service/Repository changes. **No Flyway** (Angular-only).

### Rendering contract

1. `extractCourseAssetIds(markdown)` — keep (regex or walk tokens).
2. `renderCourseMarkdown(markdown, signedUrlByAssetId)` — Marked + custom `image` renderer:
   - `course-asset:{id}` → `<img>` only if id is in the signed map; else omit/escape as text.
   - other image hrefs → do not emit `<img>` (text fallback).
3. Links: allow only `http:`/`https:` (Marked `cleanUrl` + DOMPurify).
4. Always `DOMPurify.sanitize(html, { … })` with a tight allowlist; allow `pre`/`code` with `class` for `.course-mermaid`.
5. **v2:** fenced ```mermaid → `<pre class="course-mermaid">` + escaped source text. After bind, `hydrateCourseMermaid` replaces with SVG. On parse/render failure: container gets error class/message and retains source (**FQ5**). Non-mermaid fences stay normal `<pre><code>`.
6. CSS: `.course-mermaid` / SVG wrapper `overflow-x: auto`; high-contrast ER lines/labels (`theme: base` + shell CSS overrides).

### Teacher editor

- Source: existing `[(ngModel)]="itemBody"` textarea (gallery insert API unchanged).
- Preview: `innerHTML` bound to `renderCourseMarkdown(itemBody, previewUrlMap)`; then `hydrateCourseMermaid(previewRoot)`.
- Dirty / save / unsaved guard unchanged.
- Debounce hydrate if preview fires too often on keystrokes (optional; prefer microtask after view update).

### Study view

- After markdown HTML is applied for each MARKDOWN block (or combined root), hydrate within that root.

### Tests

- Unit: mermaid fence → `.course-mermaid` placeholder; non-mermaid fence unchanged; XSS still stripped.
- Unit/integration: `hydrateCourseMermaid` with sample `erDiagram` produces SVG (or mermaid mock); invalid source → error UI, no throw.
- Angular: course-view / course-edit call hydrate after HTML bind (spy).

## Changelog

### 2026-07-20 — Mermaid diagrams in course markdown

**Status:** `done`  
**Development approval:** approved 2026-07-20 — tasks: T1, T2, T3, T4, T5, T6, T7, Tdev  
**Impact on other features:** Extends Marked pipeline; markdown **aula blocks** in [composite-aula.md](composite-aula.md); study/preview in authoring + student features.

#### Feature checklist

| ID | Criterion | Source | Done |
|----|-----------|--------|------|
| **FC7** | Mermaid fences render as diagrams (all types; sample `erDiagram`) | Request, FQ4 | ☑ |
| **FC8** | Same Mermaid rules in study and teacher preview | FQ3 | ☑ |
| **FC9** | Non-mermaid fenced code unchanged; XSS still blocked | Security | ☑ |
| **FC10** | Invalid diagram shows error + source; page stays usable | FQ5 | ☑ |
| **FC11** | Domain / feature-catalog / ui gallery / ARCHITECTURE document Mermaid | Docs | ☑ |
| **FC12** | Mermaid loaded via dynamic import; high-contrast base theme + securityLevel strict | AQ5, AQ6 | ☑ |
| **FCdev2** | Dev: paste sample erDiagram, preview + study match | Dev experience | ☑ |

#### Tasks

| ID | Task | Maps to | Done |
|----|------|---------|------|
| **T1** | Add npm dep `mermaid`; document in package.json | FC7, FC12 | ☑ |
| **T2** | Marked `code` renderer → `.course-mermaid` placeholder; DOMPurify allowlist; CSS overflow for diagrams | FC7, FC9 | ☑ |
| **T3** | `hydrateCourseMermaid` (dynamic import, dark + strict, error fallback) | FC7, FC10, FC12 | ☑ |
| **T4** | Wire study (`course-view`) hydrate after markdown HTML bind | FC8 | ☑ |
| **T5** | Wire teacher preview (`course-edit`) hydrate after preview update | FC8 | ☑ |
| **T6** | Unit + Angular specs (TC4–TC6) | FC7–FC10 | ☑ |
| **T7** | Docs: domain-spec UL/invariants, feature-catalog, ui gallery, ARCHITECTURE | FC11 | ☑ |
| **Tdev** | Manual: paste erDiagram sample in editor; confirm preview + study | FCdev2 | ☑ |

#### Test coverage

| ID | Coverage | Tasks | Done |
|----|----------|-------|------|
| **TC4** | Unit: mermaid fence → `.course-mermaid`; other fences unchanged; XSS strip still holds | T2 | ☑ |
| **TC5** | Unit: hydrate erDiagram → SVG; invalid → error + source, no throw | T3 | ☑ |
| **TC6** | Angular course-view + course-edit green with `appCourseMermaid` wired | T4, T5 | ☑ |

#### Implementation notes

- `course-markdown.ts` emits `<pre class="course-mermaid">` for language `mermaid`.
- `course-mermaid.ts` + `CourseMermaidDirective` hydrate after bind (dynamic import; theme `base` + Learn light contrast; `securityLevel: 'strict'`).
- Invalid diagrams (including Mermaid error SVG) → `.course-mermaid-error` + restored source.
- Specs: markdown/mermaid 23/23; course-edit/view 49/49; `npm run build` green.

---

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
