# UI visual shell

**Feature version:** 5  
**Status:** done  
**Requested:** 2026-07-18

## Summary

Apply a dark **visual shell** for Cursos using a **GitHub-dark developer** palette (near-black backgrounds, blue links, green primary actions, subtle borders). Earlier phosphor/neon tokens are replaced. The SPA uses three distinct zones:

1. **Header** — black, different from other sections; brand + user + single **menu icon** (top-right).
2. **Left component (sidebar)** — dark blue; contextual (categories on catalog, aula tree on study, course list on teacher).
3. **Main** — content surface (`#10182B`).

**Navigation menu** is hidden until the header icon is clicked (all breakpoints). Groups remain **Aprender**, **Ensinar**, **Admin** (≤2 levels). Dark theme only; nested page `mat-toolbar` chrome is removed so there is a single shell header.

## Wireframe

| Field | Value |
|-------|-------|
| **Source** | ASCII below |
| **Last updated** | 2026-07-18 |

### Palette

| Token | Hex | Role |
|-------|-----|------|
| `--color-header` | `#0A0A0A` | Header |
| `--color-sidebar` | `#0B1D3A` | Left component |
| `--color-main-bg` | `#10182B` | Main background |
| `--color-surface` | `#16213E` | Cards / surfaces |
| `--color-accent` | `#39FF14` | Actions, active, progress (accent only) |
| `--color-text` | `#F5F7FA` | Primary text |
| `--color-text-muted` | `#8FA3BF` | Secondary / locked |

Green is never a large background. Buttons with green fill use black text.

### Shell + icon menu

```
┌──────────────────────────────────────────────────────────────┐
│ ██ HEADER (#0A0A0A)                                          │
│  🟩 Cursos                          user@email   [Sair] [☰] │
├──────────────┬───────────────────────────────────────────────┤
│ SIDEBAR      │  MAIN (#10182B)                                │
│ (#0B1D3A)    │  content                                       │
└──────────────┴───────────────────────────────────────────────┘
```

Menu open (right-anchored panel / drawer; closed by default):

```
│ … [Sair] [☰] │
│              ┌──────────────────────┐
│              │ APRENDER             │
│              │  ├ Catálogo          │
│              │  └ Meus cursos       │
│              │ ENSINAR              │
│              │  ├ Meus cursos       │
│              │  └ Novo curso        │
│              │ ADMIN (if allowed)   │
│              │  └ Categorias        │
│              └──────────────────────┘
```

The icon remains the menu glyph while open; its accessible label changes from **Abrir menu** to **Fechar menu**.

### Catalog `/`

Left: category filter. Main: Matriculado + Disponível / Solicitado cards.

### Study `/courses/:id/lessons/:itemId`

Left: aula tree (completed / current / locked). Main: selected aula + discussion.

### Teacher `/teacher`

Left: teaching course list + Novo curso. Main: selected course actions / details.

### Nested teacher/admin pages

No second coloured header toolbar — page title and actions live inside **main**.

### Mobile

☰ opens full drawer. Sidebar becomes a slide-over or stacked section when space is tight (study: “Aulas” control can open sidebar).

## Feature questions (FQ)

| ID | Question | Status | Answer |
|----|----------|--------|--------|
| **FQ1** | Does ☰ replace desktop horizontal menu groups on all breakpoints? | answered | Yes — menu only via icon click. |
| **FQ2** | Catalog left panel content? | answered | Category filter. |
| **FQ3** | Teacher left panel? | answered | Course list; main shows selected course tools. |
| **FQ4** | Dark-only theme? | answered | Yes — no light variant. |
| **FQ5** | Nested `mat-toolbar` on edit/students/progress/admin? | answered | Remove/restyle into main page chrome; single shell header. |

## Architecture questions (AQ)

| ID | Question | Status | Answer |
|----|----------|--------|--------|
| **AQ1** | Shared layout: CSS grid mixin vs shell layout component? | answered | CSS custom properties + shared SCSS layout classes (`.app-shell-page`, `.app-shell-sidebar`, `.app-shell-main`); no new Angular layout package required. |
| **AQ2** | Material theming approach? | answered | Global CSS variables in `styles.scss` + dark Material overrides; accent green for primary buttons/links. Prefer no new UI library. |

## Impact

| Area | Change |
|------|--------|
| Domain | UI terms **Shell**, **Header**, **Sidebar**, **Main**, **Menu icon** |
| API | None |
| Schema | None |
| UI | Theme tokens; header/menu behaviour; home/study/teacher (and nested) layouts |
| Tests | Shell specs (menu closed by default; icon opens panel); layout region testids; existing route reachability |
| Docs | Feature catalog navigation shell; domain UI labels; ARCHITECTURE frontend notes |

**Risks:** WCAG contrast on green accents; existing `app.spec.ts` expects desktop inline groups — rewrite with T23; Angular bundle budget already over — CSS-only.

## Architecture

### Layers

Frontend-only. No backend endpoints.

### Structure

| Piece | Location |
|-------|----------|
| Design tokens | `src/main/webui/src/styles.scss` |
| Shell header + icon menu | `app.html`, `app.ts`, `app.scss` |
| Shared layout classes | `styles.scss` |
| Catalog sidebar | `home.component.*` |
| Study sidebar | `course-view.component.*` (existing tree) |
| Teacher sidebar | `teacher-home.component.*` |
| Nested pages | `course-edit`, `course-students`, `course-progress`, `category-admin` — drop `mat-toolbar color="primary"` |
| Login polish | `login.component.html` + global auth-card classes |

### Menu behaviour

- Inline `.nav-menu` not visible at any breakpoint.
- Toggle is the last control in the header (top-right).
- `.nav-menu-drawer` opens on click; closes on navigation, Escape, and toggle. Escape returns focus to the toggle.
- Groups/items and `cursos.admin` gating unchanged.
- The drawer is right-anchored on desktop and full-width at `750px` and below.

### Test strategy

Angular unit tests for shell and page layout regions; keep `data-testid` contracts where possible (`nav-menu-toggle`, drawer, `aula-tree`, new `shell-sidebar` / `shell-main`).

## Changelog

### 2026-07-18 — GitHub-dark developer palette

**Status:** `done`

**Delta:** Replace phosphor/neon tokens with GitHub-dark developer style; shared card/badge/button polish.

**Development approval:** approved 2026-07-18 — tasks: T36

| ID | Task | Done |
|----|------|------|
| T36 | GitHub-dark tokens + restyle component SCSS | ☑ |

### 2026-07-18 — Visual shell implemented

**Status:** `done`

**Delta:** Delivered T21–T27: phosphor-green/black/dark-blue theme, distinct header/sidebar/main zones, icon-only navigation panel, responsive catalog/study/teacher layouts, nested page chrome cleanup, login and accessibility polish.

### 2026-07-18 — Visual shell planned with defaults

**Status:** `tasks-ready`

**Delta:** Accepted suggested defaults for **FQ1–FQ5** and **AQ1–AQ2**. Architecture and tasks defined.

**Impact on other features:** Restyles shell from [student-study-experience.md](student-study-experience.md); does not change routes or discussion rules.

## Feature checklist

| ID | Criterion | Done |
|----|-----------|------|
| FC1 | Global tokens implement palette (header black, sidebar dark blue, main darker blue, accent green) | ☑ |
| FC2 | Header visually distinct; brand, user, Sair, menu icon top-right | ☑ |
| FC3 | Navigation only via menu icon; closed by default on all breakpoints | ☑ |
| FC4 | Catalog: left category filter + main sections | ☑ |
| FC5 | Study: left aula tree (sidebar colour) + main content/discussion | ☑ |
| FC6 | Teacher: left course list + main actions | ☑ |
| FC7 | Nested teacher/admin pages have no second Material primary toolbar header | ☑ |
| FC8 | Dark theme only; accent green used for actions/active states with readable contrast | ☑ |
| FC9 | Feature catalog + domain UI labels document shell terms | ☑ |
| FCdev | Verifiable in `./scripts/dev.sh` on catalog, study, teacher, admin | ☑ |

## Tasks

| ID | Task | Covers | Done |
|----|------|--------|------|
| T21 | Add design tokens + global dark theme in `styles.scss` / Material overrides | FC1, FC8 | ☑ |
| T22 | Restyle shell header (black, brand green accent, user, menu icon top-right) | FC2 | ☑ |
| T23 | Collapse nav into click-only panel/drawer on all breakpoints; update shell specs | FC3 | ☑ |
| T24 | Study layout: sidebar colour + main; remove inner study toolbar chrome | FC5, FC7 | ☑ |
| T25 | Catalog home: left category filter + main cards using shell grid | FC4 | ☑ |
| T26 | Teacher home + nested edit/students/progress/admin: shell layout; drop nested toolbars | FC6, FC7 | ☑ |
| T27 | Login polish + a11y/contrast pass; update feature-catalog and domain UI labels | FC8, FC9, FCdev | ☑ |

## Test coverage

| ID | Test | Covers | Done |
|----|------|--------|------|
| TC1 | Theme tokens present on `:root` / shell (or documented CSS contract asserted in component) | T21 | ☑ |
| TC2 | Header structure: brand, user area, menu toggle top-right | T22 | ☑ |
| TC3 | Menu closed by default; opens only after toggle; groups only inside panel; Escape/close | T23 | ☑ |
| TC4 | Study exposes sidebar + main regions; tree still functional | T24 | ☑ |
| TC5 | Home exposes category sidebar + catalog main | T25 | ☑ |
| TC6 | Teacher/nested pages: no `mat-toolbar[color=primary]`; routes still reachable | T26 | ☑ |
| TC7 | Affected Angular specs + `npm run build` | T21–T27 | ☑ |

## Development approval

**Development approval:** approved 2026-07-18 — tasks: T21, T22, T23, T24, T25, T26, T27

## Implementation notes

- Implemented global dark tokens and shared shell regions in `styles.scss`, with the root header and right-anchored navigation drawer in `app.*`.
- Catalog, study, and teacher home now expose contextual sidebar/main regions. Catalog and study provide narrow-screen sidebar controls; the teacher layout stacks its regions on narrow screens.
- Course edit, students, progress, and category administration use in-main page headers without nested Material toolbars.
- Login uses the dark auth card, visible labels, password visibility control, live error region, and phosphor-green primary action.
- Component specs cover TC1–TC7. Full Angular suite: 80 tests passed; `mvn verify` includes a successful production Angular build.
- Documentation synced in `docs/domain-specification.md`, `docs/feature-catalog.md`, `README.md`, and `ARCHITECTURE.md`.

### 2026-07-18 — Persistent header/footer + account in menu

**Status:** done

**Description:** Fixed-height header and footer; only `.page-content` scrolls. Move display name / **Sair** into the menu Conta section. Footer: copyright + OpenAPI link.

#### Feature checklist

| ID | Criterion | Done |
|----|-----------|------|
| FC10 | Header and footer always visible; main scrolls | ☑ |
| FC11 | Account link and Sair only inside menu | ☑ |
| FC12 | Footer has copyright + OpenAPI | ☑ |

#### Tasks

| ID | Task | Done |
|----|------|------|
| T37 | Persistent shell + menu account/logout | ☑ |
| T38 | Shell docs/tests/verification | ☑ |

#### Test coverage

| ID | Test | Covers | Done |
|----|------|--------|------|
| TC8 | Shell scroll/landmarks + menu account controls | T37 | ☑ |

**Development approval:** approved 2026-07-18 — tasks: T37, T38 (plan implementation)

**Implementation notes:** `100dvh` column shell; Conta section holds Minha conta + Sair + display name; footer OpenAPI link.

### 2026-07-21 — Menu layout: Sair last + contrast

**Status:** done

**Description:** Fix navigation drawer ordering and chrome contrast. **Sair** must be the last interactive option (Conta group after Admin). Style **Sair** with danger color distinct from nav links. Ensure the header **menu icon** uses `--color-on-chrome` so it contrasts on the ink header. Fix **+ Nova aula** (and other `.btn-quiet` controls on the ink sidebar) so they use chrome-readable colors instead of muted/page tokens.

**Impact on other features:** Shell menu (`app.*`); course editor sidebar (`course-edit` + shared `.app-shell-sidebar .btn-quiet` in `styles.scss`); docs for Conta order, logout, and chrome quiet-button contrast. No API/schema.

#### Wireframe (menu open)

```
│ … [☰] │
│       ┌──────────────────────┐
│       │ APRENDER             │
│       │  ├ Catálogo          │
│       │  └ Meus cursos       │
│       │ ENSINAR              │
│       │  ├ Meus cursos       │
│       │  └ Novo curso        │
│       │ ADMIN (if allowed)   │
│       │  └ Categorias        │
│       │ CONTA                │
│       │  ├ Minha conta       │
│       │  └ Sair  (danger)    │
│       │  display name        │
│       └──────────────────────┘
```

☰ uses `--color-on-chrome` on `--color-header`.

#### Wireframe (course edit sidebar)

```
┌─────────────────────┬──────────────────────┐
│ Aulas  [+ Nova aula]│  Editar curso …      │
│ (on-chrome quiet)   │                      │
│ Detalhes…           │                      │
│ aula list…          │                      │
└─────────────────────┴──────────────────────┘
```

#### Feature questions (FQ)

| ID | Question | Status | Answer |
|----|----------|--------|--------|
| **FQ6** | Should Conta always be the last group (after Admin when present)? | answered | Yes — Sair is the last interactive option. |
| **FQ7** | Logout color token? | answered | Danger (`--color-danger` / `.nav-menu-drawer__logout`), distinct from nav links. |
| **FQ8** | How to fix **+ Nova aula** contrast on ink sidebar? | answered | Scope `.btn-quiet` (and related quiet chrome actions) under `.app-shell-sidebar` to `--color-on-chrome` / chrome borders — not page muted tokens. Opened by user report 2026-07-21. |

#### Architecture questions (AQ)

| ID | Question | Status | Answer |
|----|----------|--------|--------|
| **AQ6** | Implementation surface? | answered | Reorder `navigationGroups` in `app.ts`; CSS in `app.scss` for logout + toggle; shared sidebar quiet-button rule in `styles.scss` (FQ8); specs in `app.spec.ts` + `course-edit.component.spec.ts`; no new packages/API. |

#### Architecture

| Area | Design |
|------|--------|
| Packages | Frontend shell — `app.{ts,html,scss,spec.ts}`; shared tokens/classes in `styles.scss`; course editor sidebar contrast via `.app-shell-sidebar .btn-quiet` |
| Layers | N/A (Angular shell / CSS) |
| API | None |
| Schema | None |
| Tests | `app.spec.ts`: Conta after Admin; Sair last interactive; logout danger color; menu toggle/icon on-chrome. `course-edit.component.spec.ts`: `+ Nova aula` / sidebar `.btn-quiet` uses on-chrome (or readable chrome mix) |

#### Feature checklist

| ID | Criterion | Source | Done |
|----|-----------|--------|------|
| FC13 | Conta is last nav group; Admin (when present) precedes Conta | FQ6 | ☑ |
| FC14 | Sair is last interactive control in the drawer | FQ6 | ☑ |
| FC15 | Sair uses danger color distinct from other menu links | FQ7 | ☑ |
| FC16 | Menu icon/toggle visible on header (`--color-on-chrome`) | bug report | ☑ |
| FC17 | Domain / gallery / feature-catalog note Conta order and logout styling | Impact | ☑ |
| FC18 | **+ Nova aula** (sidebar `.btn-quiet`) readable on ink sidebar | FQ8 | ☑ |
| FC19 | Gallery documents chrome quiet button on sidebar | FQ8 | ☑ |

#### Tasks

| ID | Task | Covers | Done |
|----|------|--------|------|
| T39 | Reorder Conta after Admin; style Sair (danger), menu toggle contrast, sidebar `.btn-quiet` chrome contrast | FC13–FC16, FC18 | ☑ |
| T40 | Specs for order, logout color, icon + Nova aula contrast; sync docs/gallery | FC13–FC19 | ☑ |

#### Test coverage

| ID | Test | Covers | Done |
|----|------|--------|------|
| TC9 | Conta group follows Admin when admin role present; Sair last interactive in drawer | T39 | ☑ |
| TC10 | Logout computed color matches danger token; menu toggle/icon matches on-chrome | T39 | ☑ |
| TC11 | Course edit `data-testid="new-item"` / sidebar quiet button contrasts with sidebar bg | T39 | ☑ |
| TC12 | Docs/gallery updated; Angular specs green | T40 | ☑ |

**Development approval:** approved 2026-07-21 — tasks: T39, T40

**Implementation notes:** Conta moved after Admin in `navigationGroups`. Sair uses `--color-danger`. Menu toggle inherits `--color-on-chrome`. `.app-shell-sidebar .btn-quiet` uses on-chrome for **+ Nova aula**. Specs in `app.spec.ts` and `course-edit.component.spec.ts`. Docs: domain-spec, feature-catalog, ui-elements-gallery. `npm test` (34) + `npm run build` green.

### 2026-07-21 — Editor aula nav: unselected label contrast

**Status:** done

**Description:** Unselected course-editor aula titles (`.editor-nav-item`) were invisible on the ink sidebar because they used page tokens (`--color-text` / `--color-text-muted`). Use `--color-on-chrome` for sidebar nav labels and icons; align selected state with other chrome sidebars (accent cue + on-chrome text, not light surface + dark text). Scope icon color under `.app-shell-sidebar` so main-pane block-list icons stay on page tokens.

**Impact on other features:** Course editor sidebar only (`course-edit` SCSS + spec); gallery note for chrome editor nav. Catalog / study / teacher sidebars already correct. No API/schema.

#### Feature questions (FQ)

| ID | Question | Status | Answer |
|----|----------|--------|--------|
| **FQ9** | Unselected aula nav color on ink sidebar? | answered | `--color-on-chrome` (and muted on-chrome mix for `.aula-type-icon` in sidebar). Opened by user report 2026-07-21. |

#### Architecture questions (AQ)

| ID | Question | Status | Answer |
|----|----------|--------|--------|
| **AQ7** | Scope of CSS fix? | answered | Component SCSS under `.app-shell-sidebar` for `.editor-nav-item` / `.aula-type-icon` / `.sidebar-heading` / selected; do not change global `.aula-type-icon` used in main block list. |

#### Architecture

| Area | Design |
|------|--------|
| Packages | `course-edit.component.scss` + `.spec.ts`; gallery doc |
| Layers | N/A (Angular CSS) |
| API / schema | None |
| Tests | Unselected `[data-testid^="nav-item-"]` computed color = `--color-on-chrome` |

#### Feature checklist

| ID | Criterion | Source | Done |
|----|-----------|--------|------|
| FC20 | Unselected editor aula nav labels readable on ink (`--color-on-chrome`) | FQ9 | ☑ |
| FC21 | Selected editor nav keeps on-chrome text with chrome accent selection (not page surface + dark text) | FQ9, AQ7 | ☑ |
| FC22 | Sidebar `.aula-type-icon` muted on-chrome; main block-list icons unchanged | AQ7 | ☑ |
| FC23 | Spec + gallery document chrome editor nav labels | Impact | ☑ |

#### Tasks

| ID | Task | Covers | Done |
|----|------|--------|------|
| T41 | Scope course-edit sidebar `.editor-nav-item` / `.aula-type-icon` / selected / `.sidebar-heading` to on-chrome tokens | FC20–FC22 | ☑ |
| T42 | Spec for unselected nav-item on-chrome; update ui-elements-gallery | FC23 | ☑ |

#### Test coverage

| ID | Test | Covers | Done |
|----|------|--------|------|
| TC13 | Unselected `nav-item-*` color equals `--color-on-chrome` on ink sidebar | T41, T42 | ☑ |
| TC14 | Gallery notes chrome editor nav; Angular specs green | T42 | ☑ |

**Development approval:** approved 2026-07-21 — tasks: T41, T42 (plan implementation)

**Implementation notes:** `.editor-nav-item` uses `--color-on-chrome`; selected uses accent left border + translucent accent bg (same pattern as teacher/catalog). `.app-shell-sidebar .aula-type-icon` muted on-chrome mix. Spec `shouldPaintUnselectedEditorNavItemWithOnChromeOnInkSidebar`. Gallery updated. `npm test` course-edit: 13 SUCCESS.

### 2026-07-21 — Footer author credit (Victor Osório)

**Status:** done

**Description:** Sticky footer credits **Victor Osório** with a link to the GitHub profile `https://github.com/vepo` (Backoffice-style “Desenvolvido por”). Optional white-label `learn.brand.credit` remains as a secondary line when set; default credit is empty. Aligns with Backoffice shell credit.

**Impact on other features:** Shell footer (`app.html` / `app.spec.ts`); branding defaults (`application.properties`, `branding.service.ts`); docs (gallery, feature-catalog, domain-spec, configuration). No API/schema shape change.

#### Feature questions (FQ)

| ID | Question | Status | Answer |
|----|----------|--------|--------|
| **FQ10** | Author name and profile URL? | answered | Victor Osório → `https://github.com/vepo`. |

#### Architecture questions (AQ)

| ID | Question | Status | Answer |
|----|----------|--------|--------|
| **AQ8** | Credit via branding string vs hardcoded author line? | answered | Hardcoded author credit in template (like Backoffice); keep optional `branding().credit` as secondary when non-empty; default `learn.brand.credit` empty. |

#### Architecture

| Area | Design |
|------|--------|
| Packages | `app.html`, `app.scss` (existing `.footer-credit`), `app.spec.ts`, `branding.service.ts`; `application.properties` |
| Layers | N/A (Angular shell) |
| API / schema | None (no new branding fields) |
| Tests | Footer asserts author name + GitHub href |

#### Feature checklist

| ID | Criterion | Source | Done |
|----|-----------|--------|------|
| FC24 | Footer shows “Desenvolvido por” + Victor Osório linking to github.com/vepo | FQ10, AQ8 | ☑ |
| FC25 | Optional branding credit still shown when non-empty; default empty | AQ8 | ☑ |
| FC26 | Spec + gallery / domain / catalog / configuration synced | Impact | ☑ |

#### Tasks

| ID | Task | Covers | Done |
|----|------|--------|------|
| T43 | Footer author credit markup + empty default branding credit | FC24, FC25 | ☑ |
| T44 | Update `app.spec.ts` and docs (gallery, domain, catalog, configuration) | FC26 | ☑ |

#### Test coverage

| ID | Test | Covers | Done |
|----|------|--------|------|
| TC15 | Footer credit contains Victor Osório and `a[href="https://github.com/vepo"]` | T43, T44 | ☑ |

**Development approval:** approved 2026-07-21 — tasks: T43, T44 (plan implementation)

**Implementation notes:** Author credit hardcoded in `app.html` (Victor Osório → github.com/vepo). `learn.brand.credit` default empty; optional secondary `.footer-credit-extra`. Specs and docs updated. Backoffice author link pointed to the same GitHub profile (including minimal auth footer).
