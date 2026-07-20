/**
 * Visual shell theme contract (Learn default palette).
 * Production CSS on :root must expose these custom properties with exact default hex values.
 * Runtime branding may override the same variable names via GET /api/branding.
 */
export const VISUAL_SHELL_TOKEN_NAMES = [
  '--color-header',
  '--color-sidebar',
  '--color-on-chrome',
  '--color-main-bg',
  '--color-surface',
  '--color-accent',
  '--color-link',
  '--color-border',
  '--color-text',
  '--color-text-muted',
  '--color-danger',
] as const;

export type VisualShellTokenName = (typeof VISUAL_SHELL_TOKEN_NAMES)[number];

export const VISUAL_SHELL_TOKENS: Record<VisualShellTokenName, string> = {
  '--color-header': '#0F172A',
  '--color-sidebar': '#0F172A',
  '--color-on-chrome': '#F8FAFC',
  '--color-main-bg': '#F8FAFC',
  '--color-surface': '#FFFFFF',
  '--color-accent': '#0D9488',
  '--color-link': '#0F766E',
  '--color-border': '#E2E8F0',
  '--color-text': '#0F172A',
  '--color-text-muted': '#64748B',
  '--color-danger': '#DC2626',
};

/** Shared two-column shell layout class names (AQ1). */
export const VISUAL_SHELL_LAYOUT = {
  page: 'app-shell-page',
  sidebar: 'app-shell-sidebar',
  main: 'app-shell-main',
} as const;

/** Primary action control class: accent fill, light text, visible focus. */
export const VISUAL_SHELL_ACCENT_CONTROL = 'btn-primary';

export const VISUAL_SHELL_ACCENT_TEXT = '#ffffff';
