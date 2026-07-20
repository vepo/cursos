# UI elements gallery

Canonical reusable UI elements for the Cursos SPA. Prefer these over ad-hoc controls.

## Shell

| Element | Class / testid | Behavior |
|---------|----------------|----------|
| App shell | `.app-shell-root` | Column flex `100dvh`; header/footer fixed height; `.page-content` scrolls |
| Header | `.main-header`, `data-testid="visual-shell-header"` | Sticky top; brand + menu (auth) or Entrar |
| Footer | `.main-footer`, `data-testid="visual-shell-footer"` | Sticky bottom; copyright + OpenAPI link |
| Navigation drawer | `.nav-menu-drawer` | Right-anchored; Conta includes Minha conta + Sair |
| Menu toggle | `data-testid="nav-menu-toggle"` | Last header control when authenticated |

## Buttons

| Element | Class | Use |
|---------|-------|-----|
| Primary | `.btn-primary` | Publish, save, enroll, Abrir recurso |
| Quiet | `.btn-quiet` | Secondary actions |
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

## Dialogs

| Element | Component | Use |
|---------|-----------|-----|
| Confirmation dialog | `ConfirmationDialogComponent` | Delete item, discard dirty edits, leave route |

## Forms

| Element | Pattern | Use |
|---------|---------|-----|
| Outline field | `mat-form-field appearance="outline"` + `.full` | All forms |
| File upload | `.media-upload` | Video/image file pickers |
