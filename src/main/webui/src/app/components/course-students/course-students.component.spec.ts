import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';

import { CoursesApi } from '../../generated/api/courses.service';
import { DirectoryApi } from '../../generated/api/directory.service';
import { EnrollmentsApi } from '../../generated/api/enrollments.service';
import { ConfirmationService } from '../../services/confirmation.service';
import {
  VISUAL_SHELL_LAYOUT,
  VISUAL_SHELL_TOKENS,
} from '../../../theme/visual-shell-tokens.contract';
import { CourseStudentsComponent } from './course-students.component';

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

describe('CourseStudentsComponent nested shell chrome (T26)', () => {
  let fixture: ComponentFixture<CourseStudentsComponent>;

  beforeEach(async () => {
    const enrollmentsApi = jasmine.createSpyObj('EnrollmentsApi', {
      listCourseEnrollments: of([
        {
          id: 1,
          studentName: 'Ana',
          studentEmail: 'ana@example.com',
          status: 'REQUESTED'
        }
      ]),
      approveEnrollment: of({}),
      rejectEnrollment: of({}),
      directEnroll: of({})
    });
    const directoryApi = jasmine.createSpyObj('DirectoryApi', {
      searchDirectory: of({ items: [] })
    });
    const coursesApi = jasmine.createSpyObj('CoursesApi', {
      findCourse: of({ course: { id: 10, title: 'Angular na prática' } })
    });
    const confirmation = jasmine.createSpyObj('ConfirmationService', {
      confirm: of(true),
      confirmOrTrue: of(true)
    });

    await TestBed.configureTestingModule({
      imports: [CourseStudentsComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: EnrollmentsApi, useValue: enrollmentsApi },
        { provide: DirectoryApi, useValue: directoryApi },
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

    fixture = TestBed.createComponent(CourseStudentsComponent);
    fixture.detectChanges();
  });

  function shellMain(): HTMLElement | null {
    return fixture.nativeElement.querySelector(
      '[data-testid="shell-main"], main.app-shell-main, .app-shell-main'
    );
  }

  it('shouldOmitNestedPrimaryMatToolbarOnCourseStudents', () => {
    expect(fixture.nativeElement.querySelector('mat-toolbar[color="primary"]'))
      .withContext('Course students must not nest mat-toolbar[color=primary] under the shell header')
      .toBeNull();
    expect(fixture.nativeElement.querySelector('mat-toolbar'))
      .withContext('Course students must not nest any mat-toolbar under the shell header')
      .toBeNull();
  });

  it('shouldUseShellMainPageTitleAndPageActionsOnCourseStudents', () => {
    const main = shellMain();
    expect(main).withContext('Students content lives in shell-main / app-shell-main').not.toBeNull();
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
    expect(text).toMatch(/Alunos/i);
    expect(text).toContain('Ana');
    expect(text).toMatch(/Solicitações pendentes/i);
  });

  it('shouldPaintCourseStudentsMainWithShellTokenBackground', () => {
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

describe('CourseStudentsComponent enrollment admin (enrollment-admin-ux)', () => {
  let fixture: ComponentFixture<CourseStudentsComponent>;
  let enrollmentsApi: jasmine.SpyObj<EnrollmentsApi>;
  let directoryApi: jasmine.SpyObj<DirectoryApi>;
  let confirmation: jasmine.SpyObj<ConfirmationService>;

  const seededEnrollments = [
    { id: 1, studentPassportUserId: 6, studentName: 'Carol Mendes', studentEmail: 'carol@passport.vepo.dev', status: 'REQUESTED' },
    { id: 2, studentPassportUserId: 4, studentName: 'Alice Santos', studentEmail: 'alice@passport.vepo.dev', status: 'ENROLLED' },
    { id: 3, studentPassportUserId: 5, studentName: 'Bob Oliveira', studentEmail: 'bob@passport.vepo.dev', status: 'ENROLLED' },
    { id: 4, studentPassportUserId: 7, studentName: 'Diego Costa', studentEmail: 'diego@passport.vepo.dev', status: 'REJECTED' }
  ];

  async function setup(enrollments: object[] = seededEnrollments): Promise<void> {
    enrollmentsApi = jasmine.createSpyObj('EnrollmentsApi', {
      listCourseEnrollments: of(enrollments),
      approveEnrollment: of({}),
      rejectEnrollment: of({}),
      directEnroll: of({})
    });
    directoryApi = jasmine.createSpyObj('DirectoryApi', {
      searchDirectory: of({ items: [] })
    });
    confirmation = jasmine.createSpyObj('ConfirmationService', {
      confirm: of(true),
      confirmOrTrue: of(true)
    });
    const coursesApi = jasmine.createSpyObj('CoursesApi', {
      findCourse: of({ course: { id: 2, title: 'Angular na prática' } })
    });

    await TestBed.configureTestingModule({
      imports: [CourseStudentsComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: EnrollmentsApi, useValue: enrollmentsApi },
        { provide: DirectoryApi, useValue: directoryApi },
        { provide: CoursesApi, useValue: coursesApi },
        { provide: ConfirmationService, useValue: confirmation },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ id: '2' }) }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CourseStudentsComponent);
    fixture.detectChanges();
  }

  function pageText(): string {
    return (fixture.nativeElement.textContent ?? '').replace(/\s+/g, ' ');
  }

  it('shouldGroupEnrollmentsBySectionWithCountsAndDomainLabels', async () => {
    await setup();

    const text = pageText();
    expect(text).toContain('Solicitações pendentes (1)');
    expect(text).toContain('Alunos matriculados (2)');
    expect(text).toContain('Recusados (1)');
    expect(text).not.toContain('REQUESTED');
    expect(text).not.toContain('ENROLLED');
    expect(text).not.toContain('REJECTED');

    const badges = Array.from(
      fixture.nativeElement.querySelectorAll('.status-badge') as NodeListOf<HTMLElement>
    ).map(badge => badge.textContent?.trim());
    expect(badges).toContain('Matriculado');
    expect(badges).toContain('Recusado');
  });

  it('shouldShowEmptyStatesWhenCourseHasNoEnrollments', async () => {
    await setup([]);

    const text = pageText();
    expect(text).toContain('Nenhuma solicitação pendente');
    expect(text).toContain('Nenhum aluno matriculado');
  });

  it('shouldShowCourseTitleAndTeacherNavigationActions', async () => {
    await setup();

    expect(pageText()).toContain('Angular na prática');

    const actionLinks = Array.from(
      fixture.nativeElement.querySelectorAll('.page-actions a') as NodeListOf<HTMLAnchorElement>
    ).map(link => link.getAttribute('href'));
    expect(actionLinks).toContain('/teacher');
    expect(actionLinks).toContain('/courses/2');
    expect(actionLinks).toContain('/teacher/courses/2/progress');
  });

  it('shouldShowSuccessFeedbackAfterApprovingRequest', async () => {
    await setup();

    const approveButton = fixture.nativeElement.querySelector(
      '[data-testid="approve-enrollment"]'
    ) as HTMLButtonElement;
    expect(approveButton).withContext('pending request exposes Aprovar').not.toBeNull();
    approveButton.click();
    fixture.detectChanges();

    expect(enrollmentsApi.approveEnrollment).toHaveBeenCalledWith(1);
    expect(pageText()).toContain('Solicitação aprovada');
  });

  it('shouldDisableActionsWhileApprovalIsInFlight', async () => {
    await setup();
    const pendingApproval = new Subject<object>();
    enrollmentsApi.approveEnrollment.and.returnValue(pendingApproval as never);

    const approveButton = fixture.nativeElement.querySelector(
      '[data-testid="approve-enrollment"]'
    ) as HTMLButtonElement;
    approveButton.click();
    fixture.detectChanges();

    expect(approveButton.disabled).withContext('Aprovar disabled while request pending').toBeTrue();
    expect(
      (fixture.nativeElement.querySelector('[data-testid="reject-enrollment"]') as HTMLButtonElement).disabled
    ).withContext('Recusar disabled while request pending').toBeTrue();

    pendingApproval.next({});
    pendingApproval.complete();
    fixture.detectChanges();

    expect(pageText()).toContain('Solicitação aprovada');
  });

  it('shouldShowErrorFeedbackWhenApprovalFails', async () => {
    await setup();
    enrollmentsApi.approveEnrollment.and.returnValue(throwError(() => new Error('boom')));

    (fixture.nativeElement.querySelector('[data-testid="approve-enrollment"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('.error');
    expect(error).withContext('failure renders .error feedback').not.toBeNull();
  });

  it('shouldAskConfirmationBeforeRejectingRequest', async () => {
    await setup();
    confirmation.confirm.and.returnValue(of(false));

    (fixture.nativeElement.querySelector('[data-testid="reject-enrollment"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(confirmation.confirm).toHaveBeenCalled();
    expect(enrollmentsApi.rejectEnrollment).not.toHaveBeenCalled();

    confirmation.confirm.and.returnValue(of(true));
    (fixture.nativeElement.querySelector('[data-testid="reject-enrollment"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(enrollmentsApi.rejectEnrollment).toHaveBeenCalledWith(1);
  });

  it('shouldBadgeDirectorySearchResultsAlreadyEnrolledOrRequested', async () => {
    await setup();
    directoryApi.searchDirectory.and.returnValue(of({
      items: [
        { id: 4, username: 'alice', name: 'Alice Santos', email: 'alice@passport.vepo.dev' },
        { id: 6, username: 'carol', name: 'Carol Mendes', email: 'carol@passport.vepo.dev' },
        { id: 8, username: 'mentor', name: 'Ana Mentora', email: 'mentor@passport.vepo.dev' }
      ]
    }) as never);

    const component = fixture.componentInstance;
    component.query = 'a';
    component.search();
    fixture.detectChanges();

    const results = Array.from(
      fixture.nativeElement.querySelectorAll('[data-testid="directory-result"]') as NodeListOf<HTMLElement>
    );
    expect(results.length).toBe(3);

    const aliceRow = results.find(row => row.textContent?.includes('Alice Santos'));
    expect(aliceRow?.textContent).toContain('Já matriculado');
    expect(aliceRow?.querySelector('[data-testid="direct-enroll"]')).toBeNull();

    const carolRow = results.find(row => row.textContent?.includes('Carol Mendes'));
    expect(carolRow?.textContent).toContain('Solicitado');
    expect(carolRow?.querySelector('[data-testid="direct-enroll"]')).toBeNull();

    const mentorRow = results.find(row => row.textContent?.includes('Ana Mentora'));
    expect(mentorRow?.querySelector('[data-testid="direct-enroll"]')).not.toBeNull();
  });

  it('shouldClearSearchAndShowFeedbackAfterDirectEnroll', async () => {
    await setup();
    directoryApi.searchDirectory.and.returnValue(of({
      items: [{ id: 8, username: 'mentor', name: 'Ana Mentora', email: 'mentor@passport.vepo.dev' }]
    }) as never);

    const component = fixture.componentInstance;
    component.query = 'mentor';
    component.search();
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('[data-testid="direct-enroll"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(enrollmentsApi.directEnroll).toHaveBeenCalled();
    expect(component.query).toBe('');
    expect(fixture.nativeElement.querySelector('[data-testid="directory-result"]')).toBeNull();
    expect(pageText()).toContain('Aluno matriculado');
  });

  it('shouldShowEmptyStateWhenDirectorySearchFindsNobody', async () => {
    await setup();

    const component = fixture.componentInstance;
    component.query = 'ninguem';
    component.search();
    fixture.detectChanges();

    expect(pageText()).toContain('Nenhum usuário encontrado');
  });
});
