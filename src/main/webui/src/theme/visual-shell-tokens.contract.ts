/**
 * Visual shell theme contract (GitHub-dark developer palette).
 * Production CSS on :root must expose these custom properties with exact hex values.
 * Shared layout classes must consume the tokens (not hard-coded light colours).
 */
export const VISUAL_SHELL_TOKENS = {
  '--color-header': '#010409',
  '--color-sidebar': '#010409',
  '--color-main-bg': '#0d1117',
  '--color-surface': '#161b22',
  '--color-accent': '#238636',
  '--color-link': '#58a6ff',
  '--color-border': '#30363d',
  '--color-text': '#e6edf3',
  '--color-text-muted': '#8b949e',
  '--color-danger': '#f85149',
} as const;

export type VisualShellTokenName = keyof typeof VISUAL_SHELL_TOKENS;

/** Shared two-column shell layout class names (AQ1). */
export const VISUAL_SHELL_LAYOUT = {
  page: 'app-shell-page',
  sidebar: 'app-shell-sidebar',
  main: 'app-shell-main',
} as const;

/** Primary action control class: green fill, light text, visible focus. */
export const VISUAL_SHELL_ACCENT_CONTROL = 'btn-primary';

export const VISUAL_SHELL_ACCENT_TEXT = '#ffffff';
