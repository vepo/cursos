import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { CatalogApi } from '../../generated/api/catalog.service';
import { CategoriesApi } from '../../generated/api/categories.service';
import { CoursesApi } from '../../generated/api/courses.service';
import { EnrollmentsApi } from '../../generated/api/enrollments.service';
import { AuthService } from '../../services/auth.service';
import {
  VISUAL_SHELL_ACCENT_CONTROL,
  VISUAL_SHELL_LAYOUT,
  VISUAL_SHELL_TOKENS,
} from '../../../theme/visual-shell-tokens.contract';
import { HomeComponent } from './home.component';

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

function usesTokenColor(style: CSSStyleDeclaration, tokenHex: string): boolean {
  return cssColorEquals(style.color, tokenHex)
    || cssColorEquals(style.borderLeftColor, tokenHex)
    || cssColorEquals(style.borderColor, tokenHex)
    || cssColorEquals(style.backgroundColor, tokenHex)
    || cssColorEquals(style.outlineColor, tokenHex);
}

const catalogPayload = {
  teaching: [
    {
      id: 1,
      title: 'Curso que ensino',
      summary: 'Curso que estou ensinando',
      status: 'PUBLISHED',
      categories: []
    }
  ],
  enrolled: [
    {
      id: 2,
      title: 'Curso matriculado',
      summary: 'OK',
      enrollmentStatus: 'ENROLLED',
      categories: []
    }
  ],
  available: [
    {
      id: 3,
      title: 'Curso disponível',
      summary: 'OK',
      teacherName: 'Bob',
      categories: []
    }
  ]
};

const categoryPayload = [
  { id: 10, name: 'Backend', slug: 'backend' },
  { id: 11, name: 'Frontend', slug: 'frontend' }
];

describe('HomeComponent student catalog (T13)', () => {
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    const auth = jasmine.createSpyObj('AuthService', [
      'getDisplayName',
      'logout',
      'isLoggedIn',
      'getEmail'
    ]);
    auth.getDisplayName.and.returnValue('Ana');
    auth.isLoggedIn.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [HomeComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        {
          provide: CatalogApi,
          useValue: jasmine.createSpyObj('CatalogApi', {
            listCatalog: of(catalogPayload)
          })
        },
        {
          provide: CategoriesApi,
          useValue: jasmine.createSpyObj('CategoriesApi', {
            listCategories: of(categoryPayload)
          })
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
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
  });

  it('shouldShowEnsinandoSectionOnCatalogHome', () => {
    const text = (fixture.nativeElement.textContent ?? '').replace(/\s+/g, ' ');

    expect(text).toMatch(/Ensinando/i);
    expect(fixture.nativeElement.querySelector('[data-testid="teaching-section"]')).not.toBeNull();
    expect(text).toContain('Curso que ensino');
  });

  it('shouldKeepStudentLearningSectionsReachableOnCatalogHome', () => {
    const text = (fixture.nativeElement.textContent ?? '').replace(/\s+/g, ' ');

    expect(text).toMatch(/Matriculado/i);
    expect(text).toMatch(/Disponível/i);
    expect(text).toContain('Curso matriculado');
    expect(text).toContain('Curso disponível');
  });

  it('shouldUseCanonicalCatalogSectionAndEnrollmentLabels', () => {
    const enrolledHeading = fixture.nativeElement.querySelector('#catalog-enrolled-heading') as HTMLElement | null;
    const availableHeading = fixture.nativeElement.querySelector('#catalog-available-heading') as HTMLElement | null;
    const enrolledText = (enrolledHeading?.textContent ?? '').replace(/\s+/g, ' ').trim();
    const availableText = (availableHeading?.textContent ?? '').replace(/\s+/g, ' ').trim();
    const pageText = (fixture.nativeElement.textContent ?? '').replace(/\s+/g, ' ');

    expect(enrolledHeading).withContext('Matriculado section heading must exist').not.toBeNull();
    expect(availableHeading).withContext('Disponível / Solicitado section heading must exist').not.toBeNull();
    expect(enrolledText).toBe('Matriculado');
    expect(availableText).toBe('Disponível / Solicitado');

    const requestAction = Array.from(fixture.nativeElement.querySelectorAll('button, a'))
      .map(el => el as HTMLElement)
      .find(el => /^Solicitar matrícula$/i.test((el.textContent ?? '').replace(/\s+/g, ' ').trim()));
    expect(requestAction)
      .withContext('Primary CTA must be Solicitar matrícula')
      .not.toBeNull();

    expect(pageText).not.toMatch(/\bInscrito\b/i);
    expect(pageText).not.toMatch(/\bDisponíveis\b/i);
    expect(pageText).not.toMatch(/Solicitar inscrição/i);
  });
});

describe('HomeComponent catalog shell (T25)', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let catalogApi: jasmine.SpyObj<CatalogApi>;

  beforeEach(async () => {
    const auth = jasmine.createSpyObj('AuthService', [
      'getDisplayName',
      'logout',
      'isLoggedIn',
      'getEmail'
    ]);
    auth.getDisplayName.and.returnValue('Ana');
    auth.isLoggedIn.and.returnValue(true);

    catalogApi = jasmine.createSpyObj('CatalogApi', {
      listCatalog: of(catalogPayload)
    });

    await TestBed.configureTestingModule({
      imports: [HomeComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: CatalogApi, useValue: catalogApi },
        {
          provide: CategoriesApi,
          useValue: jasmine.createSpyObj('CategoriesApi', {
            listCategories: of(categoryPayload)
          })
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
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
  });

  function catalogShell(): HTMLElement | null {
    return fixture.nativeElement.querySelector('[data-testid="catalog-shell"]');
  }

  function shellSidebar(): HTMLElement | null {
    return fixture.nativeElement.querySelector('[data-testid="shell-sidebar"]');
  }

  function shellMain(): HTMLElement | null {
    return fixture.nativeElement.querySelector('[data-testid="shell-main"]');
  }

  function categoryFilterOptions(): HTMLElement[] {
    const sidebar = shellSidebar();
    if (!sidebar) {
      return [];
    }
    return Array.from(
      sidebar.querySelectorAll(
        '[data-testid="category-option"], button, a, [role="option"], [role="button"]'
      )
    ) as HTMLElement[];
  }

  function categoryOptionByLabel(label: RegExp | string): HTMLElement | null {
    const match = typeof label === 'string'
      ? (text: string) => text === label
      : (text: string) => label.test(text);
    return categoryFilterOptions().find(el => {
      const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
      return match(text);
    }) ?? null;
  }

  function filterAccessControl(): HTMLElement | null {
    const byTestId = fixture.nativeElement.querySelector(
      '[data-testid="category-filter-toggle"], [data-testid="shell-sidebar-toggle"]'
    );
    if (byTestId) {
      return byTestId;
    }
    return fixture.debugElement.queryAll(By.css('button, [role="button"], a'))
      .map(el => el.nativeElement as HTMLElement)
      .find(el => /categorias?|filtros?/i.test((el.textContent ?? '').replace(/\s+/g, ' ').trim())
        || /abrir categorias|mostrar categorias|filtro/i.test(el.getAttribute('aria-label') ?? ''))
      ?? null;
  }

  function courseCards(): HTMLElement[] {
    const main = shellMain();
    if (!main) {
      return [];
    }
    return Array.from(
      main.querySelectorAll('article, [data-testid="course-card"], .course-card')
    ) as HTMLElement[];
  }

  function requestEnrollmentAction(): HTMLElement | null {
    const main = shellMain();
    const root = main ?? fixture.nativeElement;
    return Array.from(root.querySelectorAll('button, a, [role="button"]'))
      .map(el => el as HTMLElement)
      .find(el => /^Solicitar matrícula$/i.test((el.textContent ?? '').replace(/\s+/g, ' ').trim()))
      ?? null;
  }

  it('shouldExposeCatalogShellWithSidebarAndMainRegions', () => {
    const shell = catalogShell();
    expect(shell).withContext('Catalog root must expose data-testid="catalog-shell"').not.toBeNull();
    expect(shell?.classList.contains(VISUAL_SHELL_LAYOUT.page))
      .withContext('Catalog root must use app-shell-page')
      .toBeTrue();

    const sidebar = shellSidebar();
    const main = shellMain();

    expect(sidebar).withContext('Sidebar region data-testid="shell-sidebar"').not.toBeNull();
    expect(main).withContext('Main region data-testid="shell-main"').not.toBeNull();
    expect(sidebar?.classList.contains(VISUAL_SHELL_LAYOUT.sidebar))
      .withContext('Sidebar uses app-shell-sidebar')
      .toBeTrue();
    expect(main?.classList.contains(VISUAL_SHELL_LAYOUT.main))
      .withContext('Main uses app-shell-main')
      .toBeTrue();
    expect(shell?.contains(sidebar!)).toBeTrue();
    expect(shell?.contains(main!)).toBeTrue();
  });

  it('shouldPaintSidebarDarkBlueAndMainWithShellTokenBackgrounds', () => {
    const sidebar = shellSidebar();
    const main = shellMain();
    expect(sidebar).not.toBeNull();
    expect(main).not.toBeNull();
    if (!sidebar || !main) {
      return;
    }

    const sidebarBg = getComputedStyle(sidebar).backgroundColor;
    const mainBg = getComputedStyle(main).backgroundColor;

    expect(cssColorEquals(sidebarBg, VISUAL_SHELL_TOKENS['--color-sidebar']))
      .withContext(`shell-sidebar background must be ${VISUAL_SHELL_TOKENS['--color-sidebar']} (got ${sidebarBg})`)
      .toBeTrue();
    expect(cssColorEquals(mainBg, VISUAL_SHELL_TOKENS['--color-main-bg']))
      .withContext(`shell-main background must be ${VISUAL_SHELL_TOKENS['--color-main-bg']} (got ${mainBg})`)
      .toBeTrue();
  });

  it('shouldShowVisibleCategoryFilterOptionsIncludingTodasInSidebar', () => {
    const sidebar = shellSidebar();
    expect(sidebar).withContext('Category filter lives in shell-sidebar').not.toBeNull();

    const sidebarText = (sidebar?.textContent ?? '').replace(/\s+/g, ' ');
    expect(sidebarText).withContext('Sidebar includes Todas').toMatch(/Todas/i);
    expect(sidebarText).withContext('Sidebar includes Backend').toContain('Backend');
    expect(sidebarText).withContext('Sidebar includes Frontend').toContain('Frontend');

    const todas = categoryOptionByLabel(/^Todas$/i);
    const backend = categoryOptionByLabel(/^Backend$/i);
    const frontend = categoryOptionByLabel(/^Frontend$/i);

    expect(todas).withContext('Todas is a visible selectable category option').not.toBeNull();
    expect(backend).withContext('Backend is a visible selectable category option').not.toBeNull();
    expect(frontend).withContext('Frontend is a visible selectable category option').not.toBeNull();

    for (const option of [todas, backend, frontend]) {
      if (!option) {
        continue;
      }
      const style = getComputedStyle(option);
      expect(style.display).not.toBe('none');
      expect(style.visibility).not.toBe('hidden');
      expect(Number.parseFloat(style.opacity || '1')).toBeGreaterThan(0);
    }
  });

  it('shouldReloadCatalogWhenCategoryFilterIsSelected', fakeAsync(() => {
    catalogApi.listCatalog.calls.reset();

    const backend = categoryOptionByLabel(/^Backend$/i);
    expect(backend)
      .withContext('Backend category option must be clickable in the sidebar')
      .not.toBeNull();

    backend?.click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(catalogApi.listCatalog)
      .withContext('Selecting a category reloads catalog with that category')
      .toHaveBeenCalledWith('backend');
  }));

  it('shouldKeepEnsinandoMatriculadoAndDisponivelSectionsInShellMain', () => {
    const main = shellMain();
    expect(main).withContext('Catalog sections live in shell-main').not.toBeNull();

    const teachingHeading = main?.querySelector('#catalog-teaching-heading');
    const enrolledHeading = main?.querySelector('#catalog-enrolled-heading');
    const availableHeading = main?.querySelector('#catalog-available-heading');
    const mainText = (main?.textContent ?? '').replace(/\s+/g, ' ');

    expect((teachingHeading?.textContent ?? '').replace(/\s+/g, ' ').trim()).toBe('Ensinando');
    expect((enrolledHeading?.textContent ?? '').replace(/\s+/g, ' ').trim()).toBe('Matriculado');
    expect((availableHeading?.textContent ?? '').replace(/\s+/g, ' ').trim()).toBe('Disponível / Solicitado');
    expect(mainText).toContain('Curso que ensino');
    expect(mainText).toContain('Curso matriculado');
    expect(mainText).toContain('Curso disponível');
    expect(mainText).not.toMatch(/\bInscrito\b/i);
    expect(mainText).not.toMatch(/\bDisponíveis\b/i);

    const teachingSection = main?.querySelector('[data-testid="teaching-section"]');
    const enrolledSection = enrolledHeading?.closest('section');
    const availableSection = availableHeading?.closest('section');
    expect(enrolledHeading).not.toBeNull();
    expect(availableHeading).not.toBeNull();
    expect(teachingSection!.compareDocumentPosition(enrolledSection!) & Node.DOCUMENT_POSITION_FOLLOWING)
      .withContext('Ensinando must appear before Matriculado')
      .toBeTruthy();
    expect(enrolledSection!.compareDocumentPosition(availableSection!) & Node.DOCUMENT_POSITION_FOLLOWING)
      .withContext('Matriculado must appear before Disponível')
      .toBeTruthy();

    const sidebar = shellSidebar();
    const sidebarText = (sidebar?.textContent ?? '').replace(/\s+/g, ' ');
    expect(sidebarText).not.toContain('Curso matriculado');
    expect(sidebarText).not.toContain('Curso disponível');
    expect(sidebarText).not.toContain('Curso que ensino');
  });

  it('shouldStyleCourseCardsWithSurfaceTokenAndAccentRequestAction', () => {
    const cards = courseCards();
    expect(cards.length)
      .withContext('Course cards must render inside shell-main')
      .toBeGreaterThan(0);

    const surface = VISUAL_SHELL_TOKENS['--color-surface'];
    for (const card of cards) {
      expect(cssColorEquals(getComputedStyle(card).backgroundColor, surface))
        .withContext(`Course card background must use --color-surface ${surface}`)
        .toBeTrue();
    }

    const requestAction = requestEnrollmentAction();
    expect(requestAction)
      .withContext('Primary Solicitar matrícula action must exist')
      .not.toBeNull();
    if (!requestAction) {
      return;
    }

    const accent = VISUAL_SHELL_TOKENS['--color-accent'];
    const actionStyle = getComputedStyle(requestAction);
    const usesAccentClass = requestAction.classList.contains(VISUAL_SHELL_ACCENT_CONTROL);
    expect(usesAccentClass || usesTokenColor(actionStyle, accent))
      .withContext('Solicitar matrícula must use accent token / btn-primary')
      .toBeTrue();
  });

  it('shouldStackSidebarOrOfferFilterAccessOnNarrowViewport', fakeAsync(() => {
    const host = fixture.nativeElement as HTMLElement;
    host.style.width = '360px';
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 360 });
    window.dispatchEvent(new Event('resize'));
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const shell = catalogShell();
    const sidebar = shellSidebar();
    expect(shell).withContext('Catalog shell remains in the DOM').not.toBeNull();
    expect(sidebar).withContext('Sidebar / category filter must remain in the DOM').not.toBeNull();

    const pageStyle = shell ? getComputedStyle(shell) : null;
    const stackedOrOverlay = !pageStyle
      || pageStyle.gridTemplateColumns.split(/\s+/).filter(Boolean).length <= 1
      || getComputedStyle(sidebar!).position === 'fixed'
      || getComputedStyle(sidebar!).position === 'absolute'
      || host.classList.contains('catalog-sidebar-open')
      || sidebar?.classList.contains('is-open')
      || sidebar?.getAttribute('data-sidebar-mode') === 'overlay'
      || sidebar?.hidden
      || getComputedStyle(sidebar!).display === 'none'
      || getComputedStyle(sidebar!).transform !== 'none';

    const filterControl = filterAccessControl();
    expect(filterControl || stackedOrOverlay)
      .withContext('Narrow viewport must stack sidebar/main or expose coherent category filter access')
      .toBeTruthy();

    if (filterControl && (sidebar?.hidden || getComputedStyle(sidebar!).display === 'none')) {
      filterControl.click();
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      const revealed = shellSidebar();
      expect(revealed).withContext('Filter control should reveal sidebar access').not.toBeNull();
      expect(revealed?.hidden).not.toBeTrue();
      expect(getComputedStyle(revealed!).display).not.toBe('none');
    }
  }));
});
