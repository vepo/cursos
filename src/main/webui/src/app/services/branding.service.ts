import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { VISUAL_SHELL_TOKENS } from '../../theme/visual-shell-tokens.contract';

export interface Branding {
  name: string;
  tagline: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  accent: string;
  headerBg: string;
  onChrome: string;
  pageBg: string;
  surface: string;
  text: string;
  textMuted: string;
  link: string;
  border: string;
  danger: string;
  supportUrl: string | null;
  docsUrl: string | null;
  legalUrl: string | null;
  credit: string | null;
  showDeveloperLinks: boolean;
}

const DEFAULT_BRANDING: Branding = {
  name: 'Learn',
  tagline: 'Aprenda no seu ritmo',
  logoUrl: null,
  faviconUrl: null,
  accent: VISUAL_SHELL_TOKENS['--color-accent'],
  headerBg: VISUAL_SHELL_TOKENS['--color-header'],
  onChrome: VISUAL_SHELL_TOKENS['--color-on-chrome'],
  pageBg: VISUAL_SHELL_TOKENS['--color-main-bg'],
  surface: VISUAL_SHELL_TOKENS['--color-surface'],
  text: VISUAL_SHELL_TOKENS['--color-text'],
  textMuted: VISUAL_SHELL_TOKENS['--color-text-muted'],
  link: VISUAL_SHELL_TOKENS['--color-link'],
  border: VISUAL_SHELL_TOKENS['--color-border'],
  danger: VISUAL_SHELL_TOKENS['--color-danger'],
  supportUrl: null,
  docsUrl: null,
  legalUrl: null,
  credit: null,
  showDeveloperLinks: false
};

@Injectable({ providedIn: 'root' })
export class BrandingService {
  private readonly http = inject(HttpClient);
  private readonly brandingSignal = signal<Branding>(DEFAULT_BRANDING);

  branding() {
    return this.brandingSignal.asReadonly();
  }

  async load(): Promise<void> {
    try {
      const branding = await firstValueFrom(this.http.get<Branding>('/api/branding'));
      this.apply(branding);
    } catch {
      this.apply(DEFAULT_BRANDING);
    }
  }

  apply(branding: Branding): void {
    this.brandingSignal.set(branding);
    const root = document.documentElement;
    root.style.setProperty('--color-header', branding.headerBg);
    root.style.setProperty('--color-sidebar', branding.headerBg);
    root.style.setProperty('--color-on-chrome', branding.onChrome);
    root.style.setProperty('--color-main-bg', branding.pageBg);
    root.style.setProperty('--color-surface', branding.surface);
    root.style.setProperty('--color-accent', branding.accent);
    root.style.setProperty('--color-accent-hover', branding.accent);
    root.style.setProperty('--color-link', branding.link);
    root.style.setProperty('--color-border', branding.border);
    root.style.setProperty('--color-text', branding.text);
    root.style.setProperty('--color-text-muted', branding.textMuted);
    root.style.setProperty('--color-danger', branding.danger);
    root.style.setProperty('--color-error', branding.danger);

    document.title = branding.name;
    this.applyFavicon(branding.faviconUrl ?? '/brand-mark.svg');
  }

  private applyFavicon(href: string): void {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = href.endsWith('.svg') ? 'image/svg+xml' : 'image/x-icon';
    link.href = href;
  }
}
