import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { CatalogApi } from '../../generated/api/catalog.service';
import { CoursesApi } from '../../generated/api/courses.service';
import {
  VISUAL_SHELL_LAYOUT,
  VISUAL_SHELL_TOKENS,
} from '../../../theme/visual-shell-tokens.contract';
import { TeacherHomeComponent } from './teacher-home.component';

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

const teachingCatalog = {
  teaching: [
    {
      id: 10,
      title: 'Quarkus na prática',
      summary: 'Backend com Quarkus',
      status: 'PUBLISHED',
      categories: []
    },
    {
      id: 11,
      title: 'Angular avançado',
      summary: 'SPA e Material',
      status: 'DRAFT',
      categories: []
    }
  ],
  enrolled: [],
  available: []
};

describe('TeacherHomeComponent teaching shell (T26)', () => {
  let fixture: ComponentFixture<TeacherHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherHomeComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        {
          provide: CatalogApi,
          useValue: jasmine.createSpyObj('CatalogApi', {
            listCatalog: of(teachingCatalog)
          })
        },
        {
          provide: CoursesApi,
          useValue: jasmine.createSpyObj('CoursesApi', {
            publishCourse: of({ id: 11, status: 'PUBLISHED' }),
            unpublishCourse: of({ id: 10, status: 'DRAFT' })
          })
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TeacherHomeComponent);
    fixture.detectChanges();
  });

  function teacherShell(): HTMLElement | null {
    return fixture.nativeElement.querySelector('[data-testid="teacher-shell"]');
  }

  function shellSidebar(): HTMLElement | null {
    return fixture.nativeElement.querySelector('[data-testid="shell-sidebar"]');
  }

  function shellMain(): HTMLElement | null {
    return fixture.nativeElement.querySelector('[data-testid="shell-main"]');
  }

  function teachingCourseOptions(): HTMLElement[] {
    const sidebar = shellSidebar();
    if (!sidebar) {
      return [];
    }
    return Array.from(
      sidebar.querySelectorAll(
        '[data-testid="teaching-course-option"], button, a, [role="option"], [role="button"]'
      )
    ) as HTMLElement[];
  }

  function teachingCourseByTitle(title: string): HTMLElement | null {
    return teachingCourseOptions().find(el => {
      const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
      return text.includes(title);
    }) ?? null;
  }

  function novoCursoAction(): HTMLElement | null {
    const sidebar = shellSidebar();
    const root = sidebar ?? fixture.nativeElement;
    return Array.from(root.querySelectorAll('a, button'))
      .map(el => el as HTMLElement)
      .find(el => /novo curso/i.test((el.textContent ?? '').replace(/\s+/g, ' ').trim()))
      ?? null;
  }

  function courseActionLink(label: RegExp): HTMLElement | null {
    const main = shellMain();
    if (!main) {
      return null;
    }
    return Array.from(main.querySelectorAll('a'))
      .map(el => el as HTMLElement)
      .find(el => label.test((el.textContent ?? '').replace(/\s+/g, ' ').trim()))
      ?? null;
  }

  function sidebarAccessControl(): HTMLElement | null {
    const byTestId = fixture.nativeElement.querySelector(
      '[data-testid="teaching-courses-toggle"], [data-testid="shell-sidebar-toggle"]'
    );
    if (byTestId) {
      return byTestId;
    }
    return fixture.debugElement.queryAll(By.css('button, [role="button"], a'))
      .map(el => el.nativeElement as HTMLElement)
      .find(el => /cursos|meus cursos|lista/i.test((el.textContent ?? '').replace(/\s+/g, ' ').trim())
        || /abrir cursos|mostrar cursos|lista de cursos/i.test(el.getAttribute('aria-label') ?? ''))
      ?? null;
  }

  it('shouldExposeTeacherShellWithSidebarAndMainRegions', () => {
    const shell = teacherShell();
    expect(shell).withContext('Teacher root must expose data-testid="teacher-shell"').not.toBeNull();
    expect(shell?.classList.contains(VISUAL_SHELL_LAYOUT.page))
      .withContext('Teacher root must use app-shell-page')
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

  it('shouldListTeachingCoursesAndNovoCursoInSidebar', () => {
    const sidebar = shellSidebar();
    expect(sidebar).withContext('Teaching course list lives in shell-sidebar').not.toBeNull();

    const sidebarText = (sidebar?.textContent ?? '').replace(/\s+/g, ' ');
    expect(sidebarText).toContain('Quarkus na prática');
    expect(sidebarText).toContain('Angular avançado');

    const novoCurso = novoCursoAction();
    expect(novoCurso).withContext('Novo curso action lives with the teaching list').not.toBeNull();
    expect(novoCurso?.getAttribute('href') ?? novoCurso?.getAttribute('ng-reflect-router-link') ?? '')
      .withContext('Novo curso routes to /teacher/courses/new')
      .toMatch(/teacher\/courses\/new|\/teacher\/courses\/new/);

    const main = shellMain();
    const mainText = (main?.textContent ?? '').replace(/\s+/g, ' ');
    expect(mainText).not.toMatch(/Novo curso/i);
  });

  it('shouldShowSelectedCourseActionsInMainWhenTeacherSelectsCourse', () => {
    const quarkus = teachingCourseByTitle('Quarkus na prática');
    expect(quarkus)
      .withContext('Teaching course option must be selectable in the sidebar')
      .not.toBeNull();

    quarkus?.click();
    fixture.detectChanges();

    const main = shellMain();
    expect(main).withContext('Selected course details render in shell-main').not.toBeNull();

    const mainText = (main?.textContent ?? '').replace(/\s+/g, ' ');
    expect(mainText).toContain('Quarkus na prática');
    expect(mainText).toContain('Backend com Quarkus');
    expect(mainText).toMatch(/Publicado/i);

    const edit = courseActionLink(/^Editar$/i);
    const students = courseActionLink(/^Alunos$/i);
    const progress = courseActionLink(/^Progresso$/i);

    expect(edit).withContext('Main exposes Editar for the selected course').not.toBeNull();
    expect(students).withContext('Main exposes Alunos for the selected course').not.toBeNull();
    expect(progress).withContext('Main exposes Progresso for the selected course').not.toBeNull();

    expect(edit?.getAttribute('href') ?? '').toMatch(/\/teacher\/courses\/10\/edit/);
    expect(students?.getAttribute('href') ?? '').toMatch(/\/teacher\/courses\/10\/students/);
    expect(progress?.getAttribute('href') ?? '').toMatch(/\/teacher\/courses\/10\/progress/);

    const sidebar = shellSidebar();
    expect(sidebar?.contains(edit!)).withContext('Editar must not live only in the sidebar').toBeFalse();
  });

  it('shouldReplaceMainDetailsWhenSelectingAnotherTeachingCourse', () => {
    teachingCourseByTitle('Quarkus na prática')?.click();
    fixture.detectChanges();

    teachingCourseByTitle('Angular avançado')?.click();
    fixture.detectChanges();

    const main = shellMain();
    const mainText = (main?.textContent ?? '').replace(/\s+/g, ' ');
    expect(mainText).toContain('Angular avançado');
    expect(mainText).toContain('SPA e Material');
    expect(mainText).toMatch(/Rascunho/i);
    expect(mainText).not.toContain('Quarkus na prática');

    const edit = courseActionLink(/^Editar$/i);
    expect(edit?.getAttribute('href') ?? '').toMatch(/\/teacher\/courses\/11\/edit/);
  });

  it('shouldStackSidebarOrOfferCourseListAccessOnNarrowViewport', fakeAsync(() => {
    const host = fixture.nativeElement as HTMLElement;
    host.style.width = '360px';
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 360 });
    window.dispatchEvent(new Event('resize'));
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const shell = teacherShell();
    const sidebar = shellSidebar();
    expect(shell).withContext('Teacher shell remains in the DOM').not.toBeNull();
    expect(sidebar).withContext('Sidebar / teaching list must remain in the DOM').not.toBeNull();

    const pageStyle = shell ? getComputedStyle(shell) : null;
    const stackedOrOverlay = !pageStyle
      || pageStyle.gridTemplateColumns.split(/\s+/).filter(Boolean).length <= 1
      || getComputedStyle(sidebar!).position === 'fixed'
      || getComputedStyle(sidebar!).position === 'absolute'
      || host.classList.contains('teacher-sidebar-open')
      || sidebar?.classList.contains('is-open')
      || sidebar?.getAttribute('data-sidebar-mode') === 'overlay'
      || sidebar?.hidden
      || getComputedStyle(sidebar!).display === 'none'
      || getComputedStyle(sidebar!).transform !== 'none';

    const listControl = sidebarAccessControl();
    expect(listControl || stackedOrOverlay)
      .withContext('Narrow viewport must stack sidebar/main or expose coherent teaching-list access')
      .toBeTruthy();

    if (listControl && (sidebar?.hidden || getComputedStyle(sidebar!).display === 'none')) {
      listControl.click();
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      const revealed = shellSidebar();
      expect(revealed).withContext('List control should reveal sidebar access').not.toBeNull();
      expect(revealed?.hidden).not.toBeTrue();
      expect(getComputedStyle(revealed!).display).not.toBe('none');
    }
  }));
});
