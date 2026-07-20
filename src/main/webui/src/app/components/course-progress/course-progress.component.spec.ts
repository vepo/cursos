import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Subject, Observable, of, throwError } from 'rxjs';

import { CoursesApi } from '../../generated/api/courses.service';
import { ProgressApi } from '../../generated/api/progress.service';
import { ConfirmationService } from '../../services/confirmation.service';
import {
  VISUAL_SHELL_LAYOUT,
  VISUAL_SHELL_TOKENS,
} from '../../../theme/visual-shell-tokens.contract';
import { CourseProgressComponent } from './course-progress.component';

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

const COURSE_ITEMS = [
  { id: 1, title: 'Bem-vindo', sortOrder: 1 },
  { id: 2, title: 'Primeira aula', sortOrder: 2 },
  { id: 3, title: 'Injeção', sortOrder: 3 }
];

const SUMMARIES = [
  {
    enrollmentId: 1,
    studentPassportUserId: 10,
    studentName: 'Bob',
    completedItems: 3,
    totalItems: 3,
    percentComplete: 100,
    items: [
      { courseItemId: 1, completed: true, updatedAt: '2026-07-10T10:00:00Z' },
      { courseItemId: 2, completed: true, updatedAt: '2026-07-12T10:00:00Z' },
      { courseItemId: 3, completed: true, updatedAt: '2026-07-14T10:00:00Z' }
    ]
  },
  {
    enrollmentId: 2,
    studentPassportUserId: 20,
    studentName: 'Alice',
    completedItems: 1,
    totalItems: 3,
    percentComplete: 33.3,
    items: [
      { courseItemId: 1, completed: true, updatedAt: '2026-07-15T10:00:00Z' },
      { courseItemId: 2, completed: false, updatedAt: '2026-07-11T10:00:00Z' }
    ]
  },
  {
    enrollmentId: 3,
    studentPassportUserId: 30,
    studentName: 'Carol',
    completedItems: 0,
    totalItems: 3,
    percentComplete: 0,
    items: []
  }
];

describe('CourseProgressComponent nested shell chrome (T26)', () => {
  let fixture: ComponentFixture<CourseProgressComponent>;

  beforeEach(async () => {
    const progressApi = jasmine.createSpyObj('ProgressApi', {
      listCourseProgress: of([
        {
          enrollmentId: 1,
          studentName: 'Bob',
          completedItems: 2,
          totalItems: 5,
          percentComplete: 40,
          items: []
        }
      ]),
      updateItemProgress: of({})
    });
    const coursesApi = jasmine.createSpyObj('CoursesApi', {
      findCourse: of({ course: { id: 10, title: 'Introdução ao Quarkus' }, items: COURSE_ITEMS })
    });
    const confirmation = jasmine.createSpyObj('ConfirmationService', {
      confirm: of(true)
    });

    await TestBed.configureTestingModule({
      imports: [CourseProgressComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: ProgressApi, useValue: progressApi },
        { provide: CoursesApi, useValue: coursesApi },
        { provide: ConfirmationService, useValue: confirmation },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ id: '10' }) }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CourseProgressComponent);
    fixture.detectChanges();
  });

  function shellMain(): HTMLElement | null {
    return fixture.nativeElement.querySelector(
      '[data-testid="shell-main"], main.app-shell-main, .app-shell-main'
    );
  }

  it('shouldOmitNestedPrimaryMatToolbarOnCourseProgress', () => {
    expect(fixture.nativeElement.querySelector('mat-toolbar[color="primary"]'))
      .withContext('Course progress must not nest mat-toolbar[color=primary] under the shell header')
      .toBeNull();
    expect(fixture.nativeElement.querySelector('mat-toolbar'))
      .withContext('Course progress must not nest any mat-toolbar under the shell header')
      .toBeNull();
  });

  it('shouldUseShellMainPageTitleAndPageActionsOnCourseProgress', () => {
    const main = shellMain();
    expect(main).withContext('Progress content lives in shell-main / app-shell-main').not.toBeNull();
    expect(main?.classList.contains(VISUAL_SHELL_LAYOUT.main))
      .withContext('Main uses app-shell-main')
      .toBeTrue();

    const title = fixture.nativeElement.querySelector('.page-title, [data-testid="page-title"]');
    const actions = fixture.nativeElement.querySelector('.page-actions, [data-testid="page-actions"]');

    expect(title).withContext('Page title chrome (.page-title) replaces nested toolbar').not.toBeNull();
    expect(actions).withContext('Page actions chrome (.page-actions) lives in main').not.toBeNull();
    expect(main?.contains(title!)).toBeTrue();
    expect(main?.contains(actions!)).toBeTrue();

    const text = (fixture.nativeElement.textContent ?? '').replace(/\s+/g, ' ');
    expect(text).toMatch(/Progresso/i);
    expect(text).toContain('Bob');
  });

  it('shouldPaintCourseProgressMainWithShellTokenBackground', () => {
    const main = shellMain();
    expect(main).not.toBeNull();
    if (!main) {
      return;
    }

    const mainBg = getComputedStyle(main).backgroundColor;
    expect(cssColorEquals(mainBg, VISUAL_SHELL_TOKENS['--color-main-bg']))
      .withContext(`shell-main background must be ${VISUAL_SHELL_TOKENS['--color-main-bg']} (got ${mainBg})`)
      .toBeTrue();
  });
});

describe('CourseProgressComponent coaching UI', () => {
  let fixture: ComponentFixture<CourseProgressComponent>;
  let progressApi: jasmine.SpyObj<ProgressApi>;
  let confirmation: jasmine.SpyObj<ConfirmationService>;

  async function configure(options: {
    summaries?: typeof SUMMARIES;
    list$?: Observable<typeof SUMMARIES>;
    update$?: Observable<unknown>;
    confirm$?: Observable<boolean>;
  } = {}): Promise<void> {
    progressApi = jasmine.createSpyObj('ProgressApi', {
      listCourseProgress: options.list$ ?? of(options.summaries ?? SUMMARIES),
      updateItemProgress: options.update$ ?? of({ courseItemId: 1, completed: true })
    });
    const coursesApi = jasmine.createSpyObj('CoursesApi', {
      findCourse: of({
        course: { id: 10, title: 'Introdução ao Quarkus' },
        items: COURSE_ITEMS
      })
    });
    confirmation = jasmine.createSpyObj('ConfirmationService', {
      confirm: options.confirm$ ?? of(true)
    });

    await TestBed.configureTestingModule({
      imports: [CourseProgressComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: ProgressApi, useValue: progressApi },
        { provide: CoursesApi, useValue: coursesApi },
        { provide: ConfirmationService, useValue: confirmation },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ id: '10' }) }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CourseProgressComponent);
    fixture.detectChanges();
  }

  it('shouldShowCourseTitleAndNavigationActions', async () => {
    await configure();
    const text = (fixture.nativeElement.textContent ?? '').replace(/\s+/g, ' ');
    expect(text).toContain('Progresso');
    expect(text).toContain('Introdução ao Quarkus');
    expect(text).toContain('Voltar');
    expect(text).toContain('Curso');
    expect(text).toContain('Alunos');
  });

  it('shouldShowEmptyStateWhenNoEnrolledStudents', async () => {
    await configure({ summaries: [] });
    expect(fixture.nativeElement.querySelector('[data-testid="progress-empty"]')?.textContent)
      .toContain('Nenhum aluno matriculado ainda.');
    expect(fixture.nativeElement.querySelector('[data-testid="class-aggregate"]')).toBeNull();
  });

  it('shouldShowClassAggregateStats', async () => {
    await configure();
    const aggregate = fixture.nativeElement.querySelector('[data-testid="class-aggregate"]')?.textContent ?? '';
    expect(aggregate).toContain('3 alunos');
    expect(aggregate).toMatch(/conclusão média 44[,.]4%/);
    expect(aggregate).toContain('1 concluiu o curso');
  });

  it('shouldSortStudentsByPercentAscendingWithNameTiebreaker', async () => {
    await configure();
    const names = Array.from(
      fixture.nativeElement.querySelectorAll('[data-testid="student-progress-row"] strong') as NodeListOf<Element>
    ).map(el => el.textContent?.trim());
    expect(names).toEqual(['Carol', 'Alice', 'Bob']);
  });

  it('shouldRenderProgressBarCountsAndConcludedBadge', async () => {
    await configure();
    const rows = fixture.nativeElement.querySelectorAll('[data-testid="student-progress-row"]');
    const bobRow = rows[2] as HTMLElement;
    expect(bobRow.querySelector('[data-testid="progress-bar"]')).not.toBeNull();
    expect(bobRow.querySelector('[data-testid="progress-counts"]')?.textContent)
      .toMatch(/100.*\(3\/3\)/);
    expect(bobRow.querySelector('[data-testid="concluded-badge"]')?.textContent)
      .toContain('Concluído');
    expect((rows[0] as HTMLElement).querySelector('[data-testid="concluded-badge"]')).toBeNull();
  });

  it('shouldShowLastActivityWhenPresent', async () => {
    await configure();
    const rows = fixture.nativeElement.querySelectorAll('[data-testid="student-progress-row"]');
    const aliceRow = rows[1] as HTMLElement;
    expect(aliceRow.querySelector('[data-testid="last-activity"]')?.textContent)
      .toContain('15/07/2026');
    expect((rows[0] as HTMLElement).querySelector('[data-testid="last-activity"]')).toBeNull();
  });

  it('shouldExpandStudentToShowAulaChecklistInOrder', async () => {
    await configure();
    const aliceToggle = fixture.nativeElement.querySelectorAll('[data-testid="expand-student"]')[1] as HTMLButtonElement;
    aliceToggle.click();
    fixture.detectChanges();

    const checklist = fixture.nativeElement.querySelector('[data-testid="aula-checklist"]');
    expect(checklist).not.toBeNull();
    const aulas = Array.from(checklist!.querySelectorAll('[data-testid="aula-checklist-row"]') as NodeListOf<Element>)
      .map(el => (el.textContent ?? '').replace(/\s+/g, ' ').trim());
    expect(aulas[0]).toContain('1. Bem-vindo');
    expect(aulas[0]).toContain('Desfazer');
    expect(aulas[1]).toContain('2. Primeira aula');
    expect(aulas[1]).toContain('Marcar concluída');
    expect(aulas[2]).toContain('3. Injeção');
    expect(aulas[2]).toContain('Marcar concluída');
  });

  it('shouldMarkAulaCompleteAndReload', async () => {
    await configure();
    const aliceToggle = fixture.nativeElement.querySelectorAll('[data-testid="expand-student"]')[1] as HTMLButtonElement;
    aliceToggle.click();
    fixture.detectChanges();

    const markButton = fixture.nativeElement.querySelector('[data-testid="mark-aula"]') as HTMLButtonElement;
    markButton.click();
    fixture.detectChanges();

    expect(progressApi.updateItemProgress).toHaveBeenCalledWith(10, 2, {
      completed: true,
      studentPassportUserId: 20
    });
    expect(progressApi.listCourseProgress).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.querySelector('[data-testid="progress-message"]')?.textContent)
      .toContain('Aula marcada como concluída para Alice');
  });

  it('shouldConfirmBeforeUndoWithCascadeCopy', async () => {
    await configure();
    const aliceToggle = fixture.nativeElement.querySelectorAll('[data-testid="expand-student"]')[1] as HTMLButtonElement;
    aliceToggle.click();
    fixture.detectChanges();

    const undoButton = fixture.nativeElement.querySelector('[data-testid="undo-aula"]') as HTMLButtonElement;
    undoButton.click();
    fixture.detectChanges();

    expect(confirmation.confirm).toHaveBeenCalled();
    const args = confirmation.confirm.calls.mostRecent().args[0];
    expect(args.message).toContain('aulas posteriores');
    expect(progressApi.updateItemProgress).toHaveBeenCalledWith(10, 1, {
      completed: false,
      studentPassportUserId: 20
    });
  });

  it('shouldNotUndoWhenConfirmationCancelled', async () => {
    await configure({ confirm$: of(false) });
    const aliceToggle = fixture.nativeElement.querySelectorAll('[data-testid="expand-student"]')[1] as HTMLButtonElement;
    aliceToggle.click();
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('[data-testid="undo-aula"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(progressApi.updateItemProgress).not.toHaveBeenCalled();
  });

  it('shouldShowErrorBannerOnAdjustFailure', async () => {
    progressApi = jasmine.createSpyObj('ProgressApi', {
      listCourseProgress: of(SUMMARIES),
      updateItemProgress: throwError(() => new Error('fail'))
    });
    const coursesApi = jasmine.createSpyObj('CoursesApi', {
      findCourse: of({
        course: { id: 10, title: 'Introdução ao Quarkus' },
        items: COURSE_ITEMS
      })
    });
    confirmation = jasmine.createSpyObj('ConfirmationService', { confirm: of(true) });

    await TestBed.configureTestingModule({
      imports: [CourseProgressComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: ProgressApi, useValue: progressApi },
        { provide: CoursesApi, useValue: coursesApi },
        { provide: ConfirmationService, useValue: confirmation },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ id: '10' }) }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CourseProgressComponent);
    fixture.detectChanges();

    const aliceToggle = fixture.nativeElement.querySelectorAll('[data-testid="expand-student"]')[1] as HTMLButtonElement;
    aliceToggle.click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[data-testid="mark-aula"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="progress-error"]')?.textContent)
      .toContain('Não foi possível atualizar o progresso');
  });

  it('shouldDisableAdjustButtonsWhileRequestInFlight', async () => {
    const update$ = new Subject<unknown>();
    await configure({ update$ });

    const aliceToggle = fixture.nativeElement.querySelectorAll('[data-testid="expand-student"]')[1] as HTMLButtonElement;
    aliceToggle.click();
    fixture.detectChanges();

    const markButton = fixture.nativeElement.querySelector('[data-testid="mark-aula"]') as HTMLButtonElement;
    markButton.click();
    fixture.detectChanges();

    expect(markButton.disabled).toBeTrue();
    const undoButton = fixture.nativeElement.querySelector('[data-testid="undo-aula"]') as HTMLButtonElement;
    expect(undoButton.disabled).toBeTrue();

    update$.next({ courseItemId: 2, completed: true });
    update$.complete();
    fixture.detectChanges();
  });
});
