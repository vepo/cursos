import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { JWT_OPTIONS, JwtHelperService } from '@auth0/angular-jwt';
import { of } from 'rxjs';

import { signal } from '@angular/core';

import { AppComponent } from './app';
import { routes } from './app.routes';
import { CatalogApi } from './generated/api/catalog.service';
import { CategoriesApi } from './generated/api/categories.service';
import { CoursesApi } from './generated/api/courses.service';
import { EnrollmentsApi } from './generated/api/enrollments.service';
import { AuthService } from './services/auth.service';
import { Branding, BrandingService } from './services/branding.service';
import { VISUAL_SHELL_TOKENS } from '../theme/visual-shell-tokens.contract';

function brandingProvider(overrides: Partial<Branding> = {}): {
  provide: typeof BrandingService;
  useValue: Pick<BrandingService, 'branding' | 'load' | 'apply'>;
} {
  const value: Branding = {
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
    showDeveloperLinks: true,
    ...overrides
  };
  const brandingSignal = signal(value);
  return {
    provide: BrandingService,
    useValue: {
      branding: () => brandingSignal.asReadonly(),
      load: () => Promise.resolve(),
      apply: () => undefined
    }
  };
}

function authStub(roles: string[] = [], loggedIn = true): jasmine.SpyObj<AuthService> {
  const auth = jasmine.createSpyObj('AuthService', [
    'isLoggedIn',
    'getEmail',
    'getDisplayName',
    'getToken',
    'logout',
    'hasRole'
  ]);
  auth.isLoggedIn.and.returnValue(loggedIn);
  auth.getEmail.and.returnValue(loggedIn ? 'ana@cursos.dev' : null);
  auth.getDisplayName.and.returnValue(loggedIn ? 'Ana' : null);
  auth.getToken.and.returnValue(
    loggedIn
      ? 'header.' + btoa(JSON.stringify({ email: 'ana@cursos.dev', groups: roles })) + '.sig'
      : null
  );
  auth.hasRole.and.callFake((role: string) => loggedIn && roles.includes(role));
  return auth;
}

function catalogProviders(
  catalog: object,
  roles: string[] = [],
  loggedIn = true,
  brandingOverrides: Partial<Branding> = {}
) {
  return [
    { provide: AuthService, useValue: authStub(roles, loggedIn) },
    brandingProvider(brandingOverrides),
    { provide: JWT_OPTIONS, useValue: JWT_OPTIONS },
    JwtHelperService,
    {
      provide: CatalogApi,
      useValue: jasmine.createSpyObj('CatalogApi', { listCatalog: of(catalog) })
    },
    {
      provide: CategoriesApi,
      useValue: jasmine.createSpyObj('CategoriesApi', { listCategories: of([]) })
    },
    {
      provide: EnrollmentsApi,
      useValue: jasmine.createSpyObj('EnrollmentsApi', ['requestEnrollment'])
    },
    {
      provide: CoursesApi,
      useValue: jasmine.createSpyObj('CoursesApi', {
        publishCourse: of({ id: 1, status: 'PUBLISHED' }),
        unpublishCourse: of({ id: 1, status: 'DRAFT' })
      })
    }
  ];
}

function cssColorEquals(actualCssColor: string, expectedHex: string): boolean {
  return normalizeCssColor(actualCssColor) === normalizeCssColor(hexToRgb(expectedHex));
}

function hexToRgb(hex: string): string {
  const raw = hex.replace('#', '');
  const full = raw.length === 3
    ? raw.split('').map(ch => ch + ch).join('')
    : raw;
  const value = Number.parseInt(full, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgb(${r}, ${g}, ${b})`;
}

function normalizeCssColor(color: string): string {
  return color.trim().toLowerCase().replace(/\s+/g, '');
}

function headerInteractiveControls(header: HTMLElement): HTMLElement[] {
  return Array.from(header.querySelectorAll('a, button')) as HTMLElement[];
}

function leafLinks(group: HTMLElement): HTMLAnchorElement[] {
  return Array.from(group.querySelectorAll('a[data-testid="nav-menu-item"], a[routerLink], a[href]'))
    .filter(anchor => !anchor.querySelector('[data-testid="nav-menu-group"]')) as HTMLAnchorElement[];
}

function label(anchor: HTMLAnchorElement): string {
  return (anchor.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function href(anchor: HTMLAnchorElement): string {
  return anchor.getAttribute('routerLink')
    ?? anchor.getAttribute('ng-reflect-router-link')
    ?? anchor.getAttribute('href')
    ?? '';
}

function isVisuallyHidden(el: HTMLElement): boolean {
  const style = getComputedStyle(el);
  return style.display === 'none'
    || style.visibility === 'hidden'
    || style.opacity === '0'
    || el.getAttribute('aria-hidden') === 'true'
    || el.hidden;
}

function menuToggle(root: HTMLElement): HTMLButtonElement | null {
  return root.querySelector(
    '[data-testid="nav-menu-toggle"], button[aria-label="Abrir menu"], button[aria-label="Fechar menu"]'
  ) as HTMLButtonElement | null;
}

function menuPanel(root: HTMLElement): HTMLElement | null {
  return root.querySelector(
    '[data-testid="nav-menu-drawer"], .nav-menu-drawer, [data-testid="nav-menu-panel"]'
  ) as HTMLElement | null;
}

function isPanelOpen(panel: HTMLElement, toggle: HTMLButtonElement | null): boolean {
  return panel.getAttribute('aria-hidden') === 'false'
    || panel.classList.contains('open')
    || panel.classList.contains('mat-drawer-opened')
    || toggle?.getAttribute('aria-expanded') === 'true';
}

function openMenuPanel(
  fixture: ComponentFixture<AppComponent>
): { toggle: HTMLButtonElement; panel: HTMLElement } {
  const root = fixture.nativeElement as HTMLElement;
  const toggle = menuToggle(root);
  expect(toggle).withContext('menu toggle').not.toBeNull();
  if (!toggle) {
    throw new Error('menu toggle missing');
  }

  toggle.click();
  fixture.detectChanges();

  const panel = menuPanel(root);
  expect(panel).withContext('menu panel/drawer').not.toBeNull();
  if (!panel) {
    throw new Error('menu panel missing');
  }

  expect(isPanelOpen(panel, toggle)).withContext('panel open after toggle').toBeTrue();
  expect(isVisuallyHidden(panel))
    .withContext('open panel must be visible (all breakpoints)')
    .toBeFalse();

  return { toggle, panel };
}

describe('Icon menu panel (T23)', () => {
  async function createApp(roles: string[] = []): Promise<ComponentFixture<AppComponent>> {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AppComponent, NoopAnimationsModule],
      providers: [
        provideRouter(routes),
        ...catalogProviders({ teaching: [], enrolled: [], available: [] }, roles)
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('should create the app', async () => {
    const fixture = await createApp();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shouldHideInlineNavigationGroupsFromHeaderOnDesktopAndMobile', async () => {
    const fixture = await createApp();
    const header = fixture.nativeElement.querySelector(
      '[data-testid="visual-shell-header"], header.main-header'
    ) as HTMLElement | null;
    expect(header).withContext('shell header').not.toBeNull();
    if (!header) {
      return;
    }

    const inlineMenu = header.querySelector(
      '[data-testid="nav-menu"].nav-menu, nav.nav-menu, .nav-menu:not([data-testid="nav-menu-drawer"])'
    ) as HTMLElement | null;

    if (inlineMenu) {
      expect(isVisuallyHidden(inlineMenu))
        .withContext('inline .nav-menu must not be visible in header at any breakpoint')
        .toBeTrue();
    }

    const inlineGroups = Array.from(
      header.querySelectorAll('[data-testid="nav-menu-group"], [data-menu-group]')
    ) as HTMLElement[];
    const visibleInlineGroups = inlineGroups.filter(group => !isVisuallyHidden(group));
    expect(visibleInlineGroups.length)
      .withContext('no visible navigation groups inline in header')
      .toBe(0);

    const inlineItems = Array.from(
      header.querySelectorAll('[data-testid="nav-menu-item"]')
    ) as HTMLElement[];
    const visibleInlineItems = inlineItems.filter(item => !isVisuallyHidden(item));
    expect(visibleInlineItems.length)
      .withContext('no visible navigation leaf items inline in header')
      .toBe(0);
  });

  it('shouldKeepMenuPanelClosedByDefaultWithSyncedAria', async () => {
    const fixture = await createApp();
    const root = fixture.nativeElement as HTMLElement;
    const toggle = menuToggle(root);
    expect(toggle).withContext('menu toggle').not.toBeNull();
    if (!toggle) {
      return;
    }

    expect(toggle.getAttribute('aria-expanded'))
      .withContext('toggle aria-expanded closed by default')
      .toBe('false');

    const panel = menuPanel(root);
    if (panel) {
      expect(panel.getAttribute('aria-hidden'))
        .withContext('panel aria-hidden when closed')
        .toBe('true');
      expect(isPanelOpen(panel, toggle)).toBeFalse();
      expect(
        isVisuallyHidden(panel)
        || panel.getAttribute('aria-hidden') === 'true'
      ).withContext('closed panel absent or hidden').toBeTrue();
    }

    expect(root.querySelector(
      '[data-testid="nav-menu-drawer"][aria-hidden="false"], .nav-menu-drawer.open, mat-sidenav.mat-drawer-opened'
    )).toBeNull();
  });

  it('shouldOpenPanelWithAprenderAndEnsinarFromTopRightToggle', async () => {
    const fixture = await createApp();
    const header = fixture.nativeElement.querySelector(
      '[data-testid="visual-shell-header"], header.main-header'
    ) as HTMLElement | null;
    expect(header).not.toBeNull();
    if (!header) {
      return;
    }

    const toggle = menuToggle(header);
    expect(toggle).withContext('exactly one top-right toggle in header').not.toBeNull();
    if (!toggle) {
      return;
    }

    const interactives = headerInteractiveControls(header);
    expect(interactives[interactives.length - 1]).toBe(toggle);

    const { panel } = openMenuPanel(fixture);

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(panel.getAttribute('aria-hidden')).toBe('false');

    expect(panel.textContent).toMatch(/Aprender/);
    expect(panel.textContent).toMatch(/Ensinar/);
    expect(panel.textContent).toMatch(/Conta/);
    expect(panel.textContent).toMatch(/Minha conta/);

    const groups = Array.from(
      panel.querySelectorAll('[data-menu-group], [data-testid="nav-menu-group"]')
    ) as HTMLElement[];
    const groupLabels = groups.map(group =>
      (group.getAttribute('data-menu-group') ?? group.getAttribute('aria-label') ?? '')
        .replace(/\s+/g, ' ')
        .trim()
    );
    expect(groupLabels).toEqual(jasmine.arrayContaining(['Aprender', 'Ensinar', 'Conta']));
    expect(panel.querySelectorAll('[data-menu-level="3"]').length).toBe(0);
  });

  it('shouldListAprenderAndEnsinarLeafItemsInsideOpenPanel', async () => {
    const fixture = await createApp();
    const { panel } = openMenuPanel(fixture);

    const aprender = panel.querySelector('[data-menu-group="Aprender"]') as HTMLElement | null;
    const ensinar = panel.querySelector('[data-menu-group="Ensinar"]') as HTMLElement | null;
    expect(aprender).withContext('Aprender group in panel').not.toBeNull();
    expect(ensinar).withContext('Ensinar group in panel').not.toBeNull();
    if (!aprender || !ensinar) {
      return;
    }

    const aprenderLeaves = leafLinks(aprender);
    const ensinarLeaves = leafLinks(ensinar);

    expect(aprenderLeaves.map(label)).toEqual(['Catálogo', 'Meus cursos']);
    expect(ensinarLeaves.map(label)).toEqual(['Meus cursos', 'Novo curso']);
    expect(aprenderLeaves.map(href)).toEqual(['/', '/#matriculado']);
    expect(ensinarLeaves.map(href)).toEqual(['/teacher', '/teacher/courses/new']);
  });

  it('shouldShowAdminGroupInsidePanelWhenJwtIncludesCursosAdmin', async () => {
    const fixture = await createApp(['cursos.admin']);
    const { panel } = openMenuPanel(fixture);

    const admin = panel.querySelector('[data-menu-group="Admin"]') as HTMLElement | null;
    expect(admin).withContext('Admin group for cursos.admin inside panel').not.toBeNull();
    if (!admin) {
      return;
    }

    const leaves = leafLinks(admin);
    expect(leaves.map(label)).toEqual(['Categorias']);
    expect(leaves.map(href)).toEqual(['/admin/categories']);
  });

  it('shouldPlaceContaAfterAdminAndSairAsLastInteractiveWhenAdminPresent', async () => {
    const fixture = await createApp(['cursos.admin']);
    const { panel } = openMenuPanel(fixture);

    const groups = Array.from(
      panel.querySelectorAll('[data-menu-group]')
    ) as HTMLElement[];
    const groupLabels = groups.map(group => group.getAttribute('data-menu-group') ?? '');
    expect(groupLabels)
      .withContext('Conta is last nav group; Admin precedes Conta')
      .toEqual(['Aprender', 'Ensinar', 'Admin', 'Conta']);

    const interactives = Array.from(
      panel.querySelectorAll('a, button')
    ) as HTMLElement[];
    expect(interactives.length).withContext('drawer has interactive controls').toBeGreaterThan(0);
    const last = interactives[interactives.length - 1];
    expect(last.getAttribute('data-testid'))
      .withContext('Sair is last interactive option in the drawer')
      .toBe('menu-logout');
  });

  it('shouldStyleSairWithDangerColorAndMenuToggleWithOnChrome', async () => {
    const fixture = await createApp(['cursos.admin']);
    const root = fixture.nativeElement as HTMLElement;
    const toggle = menuToggle(root);
    expect(toggle).withContext('menu toggle').not.toBeNull();
    if (!toggle) {
      return;
    }

    const toggleColor = getComputedStyle(toggle).color;
    const icon = toggle.querySelector('mat-icon, .mat-icon') as HTMLElement | null;
    const iconColor = icon ? getComputedStyle(icon).color : toggleColor;
    const onChrome = VISUAL_SHELL_TOKENS['--color-on-chrome'];
    expect(
      cssColorEquals(toggleColor, onChrome) || cssColorEquals(iconColor, onChrome)
    )
      .withContext(
        `menu toggle/icon must use --color-on-chrome (got toggle=${toggleColor}, icon=${iconColor})`
      )
      .toBeTrue();

    const { panel } = openMenuPanel(fixture);
    const logout = panel.querySelector('[data-testid="menu-logout"]') as HTMLElement | null;
    expect(logout).withContext('Sair control').not.toBeNull();
    if (!logout) {
      return;
    }

    const logoutColor = getComputedStyle(logout).color;
    expect(cssColorEquals(logoutColor, VISUAL_SHELL_TOKENS['--color-danger']))
      .withContext(`Sair must use --color-danger (got ${logoutColor})`)
      .toBeTrue();
  });

  it('shouldHideAdminGroupInsidePanelWhenJwtOmitsCursosAdmin', async () => {
    const fixture = await createApp([]);
    const { panel } = openMenuPanel(fixture);

    expect(panel.querySelector('[data-menu-group="Admin"]')).toBeNull();
    expect(panel.textContent).not.toMatch(/\bAdmin\b/);
  });

  it('shouldClosePanelOnToggleLinkClickAndEscape', async () => {
    const fixture = await createApp();
    const { toggle, panel } = openMenuPanel(fixture);

    toggle.click();
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(panel.getAttribute('aria-hidden')).toBe('true');
    expect(isPanelOpen(panel, toggle)).toBeFalse();

    openMenuPanel(fixture);
    const link = panel.querySelector('a[routerLink], a[href]') as HTMLAnchorElement | null;
    expect(link).withContext('panel leaf link').not.toBeNull();
    if (!link) {
      return;
    }

    link.click();
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(panel.getAttribute('aria-hidden')).toBe('true');

    openMenuPanel(fixture);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-expanded'))
      .withContext('Escape closes panel (aria-expanded)')
      .toBe('false');
    expect(panel.getAttribute('aria-hidden'))
      .withContext('Escape closes panel (aria-hidden)')
      .toBe('true');
  });

  it('shouldKeepAriaSyncedAndReturnFocusToToggleAfterEscape', async () => {
    const fixture = await createApp();
    const { toggle, panel } = openMenuPanel(fixture);

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(panel.getAttribute('aria-hidden')).toBe('false');

    toggle.focus();
    expect(document.activeElement).toBe(toggle);

    const firstLink = panel.querySelector('a') as HTMLAnchorElement | null;
    firstLink?.focus();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(panel.getAttribute('aria-hidden')).toBe('true');
    expect(document.activeElement)
      .withContext('focus returns to menu toggle after Escape')
      .toBe(toggle);
  });

  it('shouldRightAnchorPanelOnDesktopAndUseFullDrawerWidthOnMobile', async () => {
    const fixture = await createApp();
    const { panel } = openMenuPanel(fixture);
    const style = getComputedStyle(panel);

    expect(['fixed', 'absolute', 'sticky'].includes(style.position))
      .withContext('open panel is positioned overlay (right-anchored / drawer)')
      .toBeTrue();

    const right = style.right;
    const rightPx = Number.parseFloat(right);
    expect(right === '0px' || rightPx === 0)
      .withContext('desktop/default: panel right-anchored (right: 0)')
      .toBeTrue();

    const widthPx = Number.parseFloat(style.width);
    const viewport = window.innerWidth || document.documentElement.clientWidth;
    const mobileDrawer = window.matchMedia('(max-width: 750px)').matches;
    if (mobileDrawer) {
      expect(widthPx)
        .withContext('mobile: full-width drawer')
        .toBeGreaterThanOrEqual(viewport * 0.9);
    } else {
      expect(widthPx)
        .withContext('desktop: constrained right panel (not full viewport)')
        .toBeLessThan(viewport * 0.9);
      expect(widthPx).withContext('desktop panel has usable width').toBeGreaterThan(120);
    }
  });
});

describe('Visual shell header (T22)', () => {
  async function createApp(loggedIn = true): Promise<ComponentFixture<AppComponent>> {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AppComponent, NoopAnimationsModule],
      providers: [
        provideRouter(routes),
        ...catalogProviders({ teaching: [], enrolled: [], available: [] }, [], loggedIn)
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('shouldExposeVisualShellHeaderWithBlackBackground', async () => {
    const fixture = await createApp(true);
    const header = fixture.nativeElement.querySelector(
      '[data-testid="visual-shell-header"]'
    ) as HTMLElement | null;

    expect(header).withContext('shell header data-testid').not.toBeNull();
    if (!header) {
      return;
    }

    const background = getComputedStyle(header).backgroundColor;
    expect(cssColorEquals(background, VISUAL_SHELL_TOKENS['--color-header']))
      .withContext('header background uses --color-header')
      .toBeTrue();
  });

  it('shouldShowLearnBrandLinkingHome', async () => {
    const fixture = await createApp(true);
    const header = fixture.nativeElement.querySelector(
      '[data-testid="visual-shell-header"], header.main-header'
    ) as HTMLElement | null;
    expect(header).withContext('shell header').not.toBeNull();
    if (!header) {
      return;
    }

    const brand = header.querySelector('a.brand, [data-testid="visual-shell-brand"]') as HTMLAnchorElement | null;
    expect(brand).withContext('Learn brand link').not.toBeNull();
    if (!brand) {
      return;
    }

    expect((brand.textContent ?? '').replace(/\s+/g, ' ').trim()).toContain('Learn');

    const hrefAttr = brand.getAttribute('routerLink')
      ?? brand.getAttribute('ng-reflect-router-link')
      ?? brand.getAttribute('href')
      ?? '';
    expect(hrefAttr === '/' || hrefAttr.endsWith('/')).withContext('brand links home').toBeTrue();

    const onChrome = VISUAL_SHELL_TOKENS['--color-on-chrome'];
    const brandColor = getComputedStyle(brand).color;
    const nameEl = brand.querySelector('.brand-name') as HTMLElement | null;
    const nameColor = nameEl ? getComputedStyle(nameEl).color : brandColor;

    const chromeVisible = cssColorEquals(brandColor, onChrome)
      || cssColorEquals(nameColor, onChrome);
    expect(chromeVisible)
      .withContext('Learn brand uses --color-on-chrome on ink header')
      .toBeTrue();
  });

  it('shouldKeepAuthenticatedAccountAndSairInsideMenuContaSection', async () => {
    const fixture = await createApp(true);
    const header = fixture.nativeElement.querySelector(
      '[data-testid="visual-shell-header"], header.main-header'
    ) as HTMLElement | null;
    expect(header).withContext('shell header').not.toBeNull();
    if (!header) {
      return;
    }

    expect(header.querySelector('[data-testid="account-link"]'))
      .withContext('account link must not remain in header')
      .toBeNull();
    expect(header.textContent).not.toMatch(/\bSair\b/);

    const { panel } = openMenuPanel(fixture);
    expect(panel.querySelector('[data-testid="menu-account-name"]')?.textContent)
      .toMatch(/Ana|ana@cursos\.dev/);
    expect(panel.querySelector('[data-menu-group="Conta"]')).not.toBeNull();
    expect(panel.querySelector('[data-testid="menu-logout"]')?.textContent)
      .toMatch(/Sair/i);
  });

  it('shouldExposePersistentFooterWithBrandAndGatedOpenApiLink', async () => {
    const fixture = await createApp(true);
    const root = fixture.nativeElement as HTMLElement;
    const footer = root.querySelector(
      'footer[data-testid="visual-shell-footer"], footer.main-footer'
    ) as HTMLElement | null;
    expect(footer).withContext('shell footer').not.toBeNull();
    if (!footer) {
      return;
    }

    expect(footer.textContent).toMatch(/Learn/);
    expect(footer.querySelector('[data-testid="footer-copyright"]')?.textContent)
      .toMatch(/Learn/);
    const credit = footer.querySelector('[data-testid="footer-credit"]') as HTMLElement | null;
    expect(credit?.textContent).toMatch(/Desenvolvido por/);
    expect(credit?.textContent).toMatch(/Victor Osório/);
    const authorLink = credit?.querySelector(
      'a[href="https://github.com/vepo"]'
    ) as HTMLAnchorElement | null;
    expect(authorLink).withContext('author GitHub profile link').not.toBeNull();
    expect(authorLink?.textContent?.trim()).toBe('Victor Osório');
    const openApi = footer.querySelector(
      'a[href="/openapi"], [data-testid="footer-openapi"]'
    ) as HTMLAnchorElement | null;
    expect(openApi).withContext('OpenAPI when showDeveloperLinks').not.toBeNull();

    const footerStyle = getComputedStyle(footer);
    expect(footerStyle.paddingLeft).withContext('footer matches header horizontal inset')
      .toBe('24px');
    expect(footerStyle.paddingRight).toBe('24px');
    expect(footer.querySelector('nav.footer-links')?.getAttribute('aria-label'))
      .toBe('Ajuda e informações');
  });

  it('shouldScrollOnlyPageContentInsideFixedShell', async () => {
    const fixture = await createApp(true);
    const root = fixture.nativeElement.querySelector(
      '[data-testid="app-shell-root"]'
    ) as HTMLElement | null;
    const content = fixture.nativeElement.querySelector(
      '[data-testid="shell-page-content"], main.page-content'
    ) as HTMLElement | null;
    expect(root).not.toBeNull();
    expect(content).not.toBeNull();
    if (!root || !content) {
      return;
    }

    const rootStyle = getComputedStyle(root);
    const contentStyle = getComputedStyle(content);
    expect(rootStyle.overflow === 'hidden' || rootStyle.overflowY === 'hidden')
      .withContext('shell root does not document-scroll')
      .toBeTrue();
    expect(contentStyle.overflow === 'auto' || contentStyle.overflowY === 'auto')
      .withContext('page content is the scroll container')
      .toBeTrue();
  });

  it('shouldPlaceSingleMenuIconToggleLastInHeaderInteractiveOrder', async () => {
    const fixture = await createApp(true);
    const header = fixture.nativeElement.querySelector(
      '[data-testid="visual-shell-header"], header.main-header'
    ) as HTMLElement | null;
    expect(header).withContext('shell header').not.toBeNull();
    if (!header) {
      return;
    }

    const toggles = header.querySelectorAll(
      '[data-testid="nav-menu-toggle"], button[aria-label="Abrir menu"], button[aria-label="Fechar menu"]'
    );
    expect(toggles.length).withContext('exactly one menu icon toggle').toBe(1);

    const toggle = toggles[0] as HTMLElement;
    const interactives = headerInteractiveControls(header);
    expect(interactives.length).withContext('header has interactive controls').toBeGreaterThan(0);
    expect(interactives[interactives.length - 1])
      .withContext('menu toggle is last interactive control (top-right in DOM order)')
      .toBe(toggle);
  });

  it('shouldKeepUnauthenticatedHeaderCoherentWithBrandAndEntrarWithoutMenu', async () => {
    const fixture = await createApp(false);
    const header = fixture.nativeElement.querySelector(
      '[data-testid="visual-shell-header"], header.main-header'
    ) as HTMLElement | null;
    expect(header).withContext('shell header').not.toBeNull();
    if (!header) {
      return;
    }

    const brand = header.querySelector('a.brand, [data-testid="visual-shell-brand"]') as HTMLAnchorElement | null;
    expect(brand).withContext('Learn brand').not.toBeNull();
    expect((brand?.textContent ?? '').replace(/\s+/g, ' ').trim()).toContain('Learn');

    const entrar = Array.from(header.querySelectorAll('a')).find(anchor =>
      /entrar/i.test(anchor.textContent ?? '')
    );
    expect(entrar).withContext('Entrar control').toBeTruthy();

    expect(header.querySelector('[data-testid="nav-menu-toggle"]'))
      .withContext('menu toggle absent when unauthenticated')
      .toBeNull();
    expect(header.querySelector('[data-testid="nav-menu"]'))
      .withContext('nav menu absent when unauthenticated')
      .toBeNull();
    expect(header.textContent).not.toMatch(/\bSair\b/);
  });
});

describe('App shell landmarks and a11y (T27)', () => {
  async function createApp(roles: string[] = []): Promise<ComponentFixture<AppComponent>> {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AppComponent, NoopAnimationsModule],
      providers: [
        provideRouter(routes),
        ...catalogProviders({ teaching: [], enrolled: [], available: [] }, roles)
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('shouldExposeHeaderNavAndMainLandmarksWithMenuToggleLabels', async () => {
    const fixture = await createApp();
    const root = fixture.nativeElement as HTMLElement;

    const header = root.querySelector(
      'header[data-testid="visual-shell-header"], header.main-header'
    ) as HTMLElement | null;
    expect(header).withContext('header landmark').not.toBeNull();
    expect(header?.tagName.toLowerCase()).toBe('header');

    const main = root.querySelector('main.page-content, main') as HTMLElement | null;
    expect(main).withContext('main landmark').not.toBeNull();
    expect(main?.tagName.toLowerCase()).toBe('main');

    const nav = root.querySelector(
      'nav[data-testid="nav-menu-drawer"], nav[aria-label], nav.nav-menu-drawer'
    ) as HTMLElement | null;
    expect(nav).withContext('nav landmark for shell menu').not.toBeNull();
    expect(nav?.tagName.toLowerCase()).toBe('nav');
    expect((nav?.getAttribute('aria-label') ?? '').trim().length)
      .withContext('nav has accessible name')
      .toBeGreaterThan(0);

    const toggle = menuToggle(root);
    expect(toggle).withContext('menu toggle').not.toBeNull();
    if (!toggle) {
      return;
    }

    expect(toggle.getAttribute('aria-label'))
      .withContext('closed toggle label')
      .toMatch(/abrir menu/i);

    toggle.click();
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-label'))
      .withContext('open toggle label')
      .toMatch(/fechar menu/i);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('shouldKeepPrimaryTextContrastOnHeaderAgainstInkShell', async () => {
    const fixture = await createApp();
    const header = fixture.nativeElement.querySelector(
      '[data-testid="visual-shell-header"]'
    ) as HTMLElement | null;
    expect(header).not.toBeNull();
    if (!header) {
      return;
    }

    const style = getComputedStyle(header);
    expect(cssColorEquals(style.backgroundColor, VISUAL_SHELL_TOKENS['--color-header']))
      .withContext('header uses ink shell token')
      .toBeTrue();
    expect(
      cssColorEquals(style.color, VISUAL_SHELL_TOKENS['--color-on-chrome'])
      || cssColorEquals(style.color, VISUAL_SHELL_TOKENS['--color-text-muted'])
    ).withContext('header text uses on-chrome tokens on ink').toBeTrue();

    const footer = fixture.nativeElement.querySelector(
      '[data-testid="visual-shell-footer"]'
    ) as HTMLElement | null;
    expect(footer).withContext('footer landmark for contrast check').not.toBeNull();
    if (footer) {
      expect(cssColorEquals(getComputedStyle(footer).backgroundColor, VISUAL_SHELL_TOKENS['--color-header']))
        .withContext('footer uses ink shell token')
        .toBeTrue();
    }
  });
});

describe('Teacher home reachability (T13)', () => {
  it('shouldListTeachingCoursesAndActionLinksOnTeacherHome', fakeAsync(() => {
    const teachingCourse = {
      id: 7,
      title: 'Intro Quarkus',
      summary: 'Base',
      status: 'PUBLISHED',
      categories: []
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [AppComponent, NoopAnimationsModule],
      providers: [
        provideRouter(routes),
        ...catalogProviders({ teaching: [teachingCourse], enrolled: [], available: [] })
      ]
    });

    const fixture = TestBed.createComponent(AppComponent);
    const router = TestBed.inject(Router);
    const jwtHelper = TestBed.inject(JwtHelperService);
    spyOn(jwtHelper, 'isTokenExpired').and.returnValue(false as never);

    fixture.detectChanges();

    void router.navigateByUrl('/teacher');
    tick();
    fixture.detectChanges();

    const teacherHome = fixture.nativeElement.querySelector(
      '[data-testid="teacher-shell"], [data-testid="teacher-home"], app-teacher-home'
    ) as HTMLElement | null;
    expect(teacherHome).withContext('teacher home at /teacher').not.toBeNull();
    if (!teacherHome) {
      return;
    }

    expect(teacherHome.textContent).toContain('Intro Quarkus');

    const courseOption = teacherHome.querySelector(
      '[data-testid="teaching-course-option"]'
    ) as HTMLButtonElement | null;
    expect(courseOption).withContext('teaching course option').not.toBeNull();
    courseOption?.click();
    fixture.detectChanges();

    const main = teacherHome.querySelector('[data-testid="shell-main"]') as HTMLElement | null;
    expect(main).withContext('shell-main after course selection').not.toBeNull();

    const links = Array.from((main ?? teacherHome).querySelectorAll('a')) as HTMLAnchorElement[];
    const edit = links.find(a =>
      /editar/i.test(a.textContent ?? '')
      || (a.getAttribute('href') ?? '').includes('/teacher/courses/7/edit')
      || (a.getAttribute('ng-reflect-router-link') ?? '').includes('edit')
    );
    const students = links.find(a =>
      /alunos/i.test(a.textContent ?? '') || (a.getAttribute('href') ?? '').includes('/students')
    );
    const progress = links.find(a =>
      /progresso/i.test(a.textContent ?? '') || (a.getAttribute('href') ?? '').includes('/progress')
    );

    expect(edit).withContext('Editar action').toBeTruthy();
    expect(students).withContext('Alunos action').toBeTruthy();
    expect(progress).withContext('Progresso action').toBeTruthy();

    const novoCurso = fixture.debugElement.queryAll(By.css('a'))
      .find(link => /novo curso/i.test(link.nativeElement.textContent ?? ''));
    expect(novoCurso).withContext('Novo curso reachable from teacher area').toBeTruthy();
  }));
});
