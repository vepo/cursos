# UI elements gallery

Canonical reusable UI elements for the Cursos SPA. Prefer these over ad-hoc controls.

## Shell

| Element | Class / testid | Behavior |
|---------|----------------|----------|
| App shell | `.app-shell-root` | Column flex `100dvh`; header/footer fixed height; `.page-content` scrolls |
| App shell page | `.app-shell-page` | Two-column grid when `.app-shell-sidebar` is present; one column (full width) when sidebar is omitted (e.g. Novo curso); desktop row `minmax(0, 1fr)` so sidebar chrome fills down to the footer when content is short |
| App shell sidebar | `.app-shell-sidebar` | Left chrome column |
| App shell main | `.app-shell-main` | Primary content column |
| Header | `.main-header`, `data-testid="visual-shell-header"` | Sticky top; brand + menu (auth) or Entrar |
| Footer | `.main-footer`, `data-testid="visual-shell-footer"` | Sticky bottom; horizontal padding matches header (`1.5rem` / `1rem` mobile); copyright muted; hairline separator before utility links; **Suporte** / **Documentação** / **Jurídico**; **Desenvolvido por** Victor Osório → `https://github.com/vepo`; optional branding credit; OpenAPI when developer links enabled; on-chrome focus ring |
| Navigation drawer | `.nav-menu-drawer` | Right-anchored; groups Aprender → Ensinar → Admin (if allowed) → Conta; Conta = Minha conta + Sair (danger, last interactive) |
| Menu toggle | `data-testid="nav-menu-toggle"` | Last header control when authenticated; `--color-on-chrome` on ink header |
| Logout | `.nav-menu-drawer__logout`, `data-testid="menu-logout"` | **Sair**; danger color |

## Buttons

| Element | Class | Use |
|---------|-------|-----|
| Primary | `.btn-primary` | Publish, save, enroll, Abrir recurso |
| Quiet | `.btn-quiet` | Secondary actions on light/main surfaces |
| Quiet (chrome) | `.app-shell-sidebar .btn-quiet` | Secondary actions on ink sidebar (e.g. **+ Nova aula**); uses `--color-on-chrome` |
| Editor nav item (chrome) | `.app-shell-sidebar .editor-nav-item` | Course-edit aula / details list on ink sidebar; unselected and selected use `--color-on-chrome`; selected = accent left border + translucent accent bg |
| Danger | `.btn-danger` | Destructive icon actions |

## Status

| Element | Class | Use |
|---------|-------|-----|
| Status badge | `.status-badge`, `--published`, `--draft` | Course publication state |
| Enrollment badge | `.status-badge`, `--requested`, `--enrolled`, `--rejected` | Enrollment status (Solicitado / Matriculado / Recusado) |
| Progress bar | `.progress-bar`, `.progress-bar__fill` | Visual completion % (teacher coaching + study sidebar language) |

## Cards & media

| Element | Class | Use |
|---------|-------|-----|
| Card | `.card` | Surfaces, summary panels, comments |
| Course cover | `.course-cover` | 16:9 crop on catalog/summary |
| Image gallery | `.image-gallery` | Editor upload/select/insert |
| Media frame | `.media-frame` | Study video/image |
| Aula blocks stack | `.aula-blocks`, `.aula-block`, `data-testid="aula-blocks"` | Study: ordered blocks inside one aula |
| Block list (editor) | `.block-list`, `.block-row`, `data-testid="block-list"` | Teacher: select/reorder/delete blocks |
| Append block | `data-testid="append-block"` + `mat-menu` | Teacher: **+ Bloco** (Markdown / Vídeo / Link / Imagem) |
| Aula type icon | `.aula-type-icon` / `.aula-icon` | First-block type in editor/study sidebar |
| Aula type icon (chrome) | `.app-shell-sidebar .aula-type-icon` | Editor sidebar icons: muted `--color-on-chrome` mix (main block-list icons keep page `--color-text-muted`) |

## Dialogs

| Element | Component | Use |
|---------|-----------|-----|
| Confirmation dialog | `ConfirmationDialogComponent` | Delete item, discard dirty edits, leave route |

## Forms

| Element | Pattern | Use |
|---------|---------|-----|
| Outline field | `mat-form-field appearance="outline"` + `.full` | All forms |
| File upload | `.media-upload` | Video/image file pickers |
| Markdown editor split | `.markdown-editor-split`, `data-testid="markdown-editor-split"` | Teacher source + live preview (side-by-side ≥900px) |
| Markdown preview | `.markdown-preview`, `data-testid="markdown-preview"` | Marked + DOMPurify HTML preview (+ Mermaid hydrate) |
| Study markdown | `.markdown`, `appCourseMermaid` | Sanitized Marked HTML; `.course-mermaid` → SVG |
| Mermaid diagram | `.course-mermaid`, `.course-mermaid-error` | Fenced `mermaid` language; invalid keeps source |
