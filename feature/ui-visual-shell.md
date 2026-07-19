# UI visual shell

**Feature version:** 2  
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
