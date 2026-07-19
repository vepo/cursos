import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';

import { CourseImagesApi } from '../../generated/api/courseImages.service';
import { CourseItemsApi } from '../../generated/api/courseItems.service';
import { CoursesApi } from '../../generated/api/courses.service';
import { DiscussionApi } from '../../generated/api/discussion.service';
import { ProgressApi } from '../../generated/api/progress.service';
import { StudyApi } from '../../generated/api/study.service';
import { CommentResponse } from '../../generated/model/commentResponse';
import { CourseItemResponse } from '../../generated/model/courseItemResponse';
import { StudyItemResponse } from '../../generated/model/studyItemResponse';
import { StudyResponse } from '../../generated/model/studyResponse';
import { AuthService } from '../../services/auth.service';
import { ConfirmationService } from '../../services/confirmation.service';
import {
  VISUAL_SHELL_LAYOUT,
  VISUAL_SHELL_TOKENS,
} from '../../../theme/visual-shell-tokens.contract';
import { CourseViewComponent } from './course-view.component';

const authServiceStub = {
  getDisplayName: () => 'Ana',
  getEmail: () => 'ana@cursos.dev',
  getUsername: () => 'ana'
};

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

describe('CourseViewComponent study UI', () => {
  const courseId = 42;

  const studyTree: StudyItemResponse[] = [
    { id: 1, title: 'Intro', sortOrder: 1, completed: true, accessible: true },
    { id: 2, title: 'Setup', sortOrder: 2, completed: false, accessible: true },
    { id: 3, title: 'DI', sortOrder: 3, completed: false, accessible: false }
  ];

  const introContent: CourseItemResponse = {
    id: 1,
    courseId,
    title: 'Intro',
    itemType: 'MARKDOWN',
    sortOrder: 1,
    markdownBody: '# Boas-vindas\n\nTexto seguro.'
  };

  const setupContent: CourseItemResponse = {
    id: 2,
    courseId,
    title: 'Setup',
    itemType: 'MARKDOWN',
    sortOrder: 2,
    markdownBody: '## Ambiente\n\nInstale o JDK.'
  };

  const dangerousContent: CourseItemResponse = {
    id: 2,
    courseId,
    title: 'Setup',
    itemType: 'MARKDOWN',
    sortOrder: 2,
    markdownBody: 'Olá <script>window.__xss = true</script><img src=x onerror="window.__xss=true">'
  };

  let fixture: ComponentFixture<CourseViewComponent>;
  let studyApi: jasmine.SpyObj<StudyApi>;
  let progressApi: jasmine.SpyObj<ProgressApi>;
  let coursesApi: jasmine.SpyObj<CoursesApi>;
  let router: Router;
  let paramMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  function studyResponse(items: StudyItemResponse[] = studyTree): StudyResponse {
    const completedItems = items.filter(item => item.completed).length;
    const totalItems = items.length;
    const concluded = totalItems > 0 && completedItems === totalItems;
    return {
      courseId,
      items,
      completedItems,
      totalItems,
      percentComplete: totalItems === 0 ? 0 : (completedItems * 100) / totalItems,
      concluded,
      concludedAt: concluded ? '2026-07-19T12:00:00Z' : undefined
    };
  }

  function configure(params: Record<string, string>): void {
    TestBed.resetTestingModule();

    paramMap$ = new BehaviorSubject(convertToParamMap(params));
    studyApi = jasmine.createSpyObj('StudyApi', ['getCourseStudy', 'getStudyItem']);
    progressApi = jasmine.createSpyObj('ProgressApi', ['updateItemProgress', 'downloadCourseCertificate']);
    coursesApi = jasmine.createSpyObj('CoursesApi', ['findCourse']);
    const discussionApi = jasmine.createSpyObj('DiscussionApi', [
      'listComments',
      'createComment',
      'upvoteComment',
      'hideComment',
      'restoreComment'
    ]);
    const confirmation = jasmine.createSpyObj('ConfirmationService', ['confirm', 'confirmOrTrue']);
    confirmation.confirm.and.returnValue(of(true));
    confirmation.confirmOrTrue.and.returnValue(of(true));
    discussionApi.listComments.and.returnValue(of([]) as never);

    studyApi.getCourseStudy.and.returnValue(of(studyResponse()) as never);
    studyApi.getStudyItem.and.callFake((_cId: number, itemId: number) => {
      if (itemId === 1) {
        return of(introContent) as never;
      }
      return of(setupContent) as never;
    });
    progressApi.updateItemProgress.and.returnValue(of({ completed: true }) as never);
    progressApi.downloadCourseCertificate.and.returnValue(of(new Blob(['%PDF'], { type: 'application/pdf' })) as never);
    coursesApi.findCourse.and.returnValue(of({
      teaching: false,
      enrolled: true,
      course: { id: courseId, title: 'Quarkus', summary: 'Curso completo', teacherName: 'Ana', teacherDescription: 'Instrutora backend' },
      items: [introContent, setupContent]
    }) as never);

    TestBed.configureTestingModule({
      imports: [CourseViewComponent, NoopAnimationsModule],
      providers: [
        provideRouter([
          { path: 'courses/:courseId', component: CourseViewComponent },
          { path: 'courses/:courseId/lessons/:itemId', component: CourseViewComponent }
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: StudyApi, useValue: studyApi },
        { provide: ProgressApi, useValue: progressApi },
        { provide: CoursesApi, useValue: coursesApi },
        { provide: CourseItemsApi, useValue: jasmine.createSpyObj('CourseItemsApi', { createPlaybackTicket: of({ url: '/api/media/playback/1/1/1?expires=1&sig=x' }) }) },
        { provide: CourseImagesApi, useValue: jasmine.createSpyObj('CourseImagesApi', { createImageTickets: of({ tickets: [] }) }) },
        { provide: DiscussionApi, useValue: discussionApi },
        { provide: ConfirmationService, useValue: confirmation },
        { provide: AuthService, useValue: authServiceStub },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap(params) },
            paramMap: paramMap$.asObservable()
          }
        }
      ]
    });

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    fixture = TestBed.createComponent(CourseViewComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
  }

  function aulaNodes(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('[data-aula-id]')) as HTMLElement[];
  }

  function aulaNode(itemId: number): HTMLElement | null {
    return fixture.nativeElement.querySelector(`[data-aula-id="${itemId}"]`);
  }

  function aulaState(itemId: number): string {
    const node = aulaNode(itemId);
    if (!node) {
      return '';
    }
    if (node.classList.contains('aula-completed') || node.getAttribute('data-aula-state') === 'completed') {
      return 'completed';
    }
    if (node.classList.contains('aula-current') || node.getAttribute('data-aula-state') === 'current') {
      return 'current';
    }
    if (node.classList.contains('aula-locked') || node.getAttribute('data-aula-state') === 'locked') {
      return 'locked';
    }
    return node.getAttribute('data-aula-state') ?? '';
  }

  function selectedContent(): HTMLElement | null {
    return fixture.nativeElement.querySelector('[data-testid="aula-content"]');
  }

  it('shouldRenderOrderedLeftAulaTreeFromStudyApiState', fakeAsync(() => {
    configure({ courseId: String(courseId) });

    expect(studyApi.getCourseStudy).toHaveBeenCalledWith(courseId);

    const nodes = aulaNodes();
    expect(nodes.map(node => node.getAttribute('data-aula-id'))).toEqual(['1', '2', '3']);
    expect(nodes.map(node => node.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
      jasmine.stringMatching(/Intro/),
      jasmine.stringMatching(/Setup/),
      jasmine.stringMatching(/DI/)
    ]);
    expect(fixture.nativeElement.querySelector('[data-testid="aula-tree"]')).not.toBeNull();
  }));

  it('shouldIndicateCompletedCurrentAndLockedAulasAndPreventLockedNavigation', fakeAsync(() => {
    // Course root: no aula selected — accessible incomplete aula is not "current".
    configure({ courseId: String(courseId) });

    expect(aulaState(1)).toBe('completed');
    expect(aulaState(2)).toBe('accessible');
    expect(aulaState(3)).toBe('locked');
    expect(aulaNode(3)?.getAttribute('aria-disabled')).toBe('true');

    aulaNode(3)?.click();
    fixture.detectChanges();

    expect(router.navigate).not.toHaveBeenCalledWith(['/courses', courseId, 'lessons', 3]);
    expect(studyApi.getStudyItem).not.toHaveBeenCalledWith(courseId, 3);
  }));

  it('shouldShowOverviewOnCourseRouteAndOpenAulaOnLessonRoute', fakeAsync(() => {
    configure({ courseId: String(courseId) });

    const summary = fixture.nativeElement.querySelector('[data-testid="course-summary"]');
    expect(summary).not.toBeNull();
    expect(summary?.textContent).toContain('Sobre o curso');
    expect(summary?.textContent).toContain('Sobre o autor');
    expect(selectedContent()).toBeNull();
    expect(studyApi.getStudyItem).not.toHaveBeenCalled();
    expect(fixture.componentInstance.selectedAulaId).toBeNull();

    paramMap$.next(convertToParamMap({ courseId: String(courseId), itemId: '1' }));
    tick();
    fixture.detectChanges();

    expect(studyApi.getStudyItem).toHaveBeenCalledWith(courseId, 1);
    expect(selectedContent()?.textContent).toContain('Boas-vindas');
    expect(fixture.nativeElement.querySelector('[data-testid="course-summary"]')).toBeNull();
  }));

  it('shouldDisplayOnlySelectedAulaContent', fakeAsync(() => {
    configure({ courseId: String(courseId), itemId: '2' });

    const content = selectedContent();
    expect(content).not.toBeNull();
    expect(content?.textContent).toContain('Ambiente');
    expect(content?.textContent).not.toContain('Boas-vindas');
    expect(fixture.nativeElement.querySelectorAll('[data-testid="aula-content"]').length).toBe(1);
    expect(fixture.nativeElement.querySelector('[data-testid="course-summary"]')).toBeNull();
  }));

  it('shouldShowCourseOverviewWithoutSelectingAulaOnCourseRoot', fakeAsync(() => {
    configure({ courseId: String(courseId) });

    const summary = fixture.nativeElement.querySelector('[data-testid="course-summary"]');
    expect(summary).withContext('Course overview must be present on course root').not.toBeNull();
    expect(summary?.textContent).toContain('Sobre o curso');
    expect(summary?.textContent).toContain('Sobre o autor');
    expect(selectedContent()).toBeNull();
    expect(studyApi.getStudyItem).not.toHaveBeenCalled();
    expect(fixture.componentInstance.selectedAulaId).toBeNull();
  }));

  it('shouldHideCourseOverviewWhenViewingAula', fakeAsync(() => {
    configure({ courseId: String(courseId), itemId: '2' });

    expect(fixture.nativeElement.querySelector('[data-testid="course-summary"]')).toBeNull();
    expect(selectedContent()).withContext('Aula content must be present on lesson route').not.toBeNull();
    expect(selectedContent()?.textContent).toContain('Ambiente');
  }));

  it('shouldReturnToOverviewViaVisaoGeralAndCourseTitle', fakeAsync(() => {
    configure({ courseId: String(courseId), itemId: '2' });

    expect(selectedContent()).not.toBeNull();

    const visaoGeral = fixture.nativeElement.querySelector('[data-testid="visao-geral"]') as HTMLElement | null;
    expect(visaoGeral).withContext('Visão geral sidebar entry must be present').not.toBeNull();
    expect(visaoGeral?.getAttribute('data-aula-id')).toBeNull();

    (router.navigate as jasmine.Spy).calls.reset();
    visaoGeral?.click();
    fixture.detectChanges();

    expect(router.navigate).toHaveBeenCalledWith(['/courses', courseId]);

    const titleControl = fixture.nativeElement.querySelector(
      '[data-testid="course-overview-title"]'
    ) as HTMLElement | null;
    expect(titleControl)
      .withContext('Course title control data-testid="course-overview-title" must navigate to course root')
      .not.toBeNull();

    (router.navigate as jasmine.Spy).calls.reset();
    titleControl?.click();
    fixture.detectChanges();

    expect(router.navigate).toHaveBeenCalledWith(['/courses', courseId]);
  }));

  it('shouldRenderMarkdownAsSanitizedHtmlNotRawPre', fakeAsync(() => {
    studyApi = jasmine.createSpyObj('StudyApi', ['getCourseStudy', 'getStudyItem']);
    progressApi = jasmine.createSpyObj('ProgressApi', ['updateItemProgress']);
    coursesApi = jasmine.createSpyObj('CoursesApi', ['findCourse']);
    const discussionApi = jasmine.createSpyObj('DiscussionApi', [
      'listComments',
      'createComment',
      'upvoteComment',
      'hideComment',
      'restoreComment'
    ]);
    discussionApi.listComments.and.returnValue(of([]) as never);
    studyApi.getCourseStudy.and.returnValue(of(studyResponse()) as never);
    studyApi.getStudyItem.and.returnValue(of(dangerousContent) as never);
    progressApi.updateItemProgress.and.returnValue(of({ completed: true }) as never);
    coursesApi.findCourse.and.returnValue(of({
      teaching: false,
      enrolled: true,
      course: { id: courseId, title: 'Quarkus', summary: 'Curso completo', teacherName: 'Ana', teacherDescription: 'Instrutora backend' },
      items: [dangerousContent]
    }) as never);

    TestBed.resetTestingModule();
    paramMap$ = new BehaviorSubject(convertToParamMap({ courseId: String(courseId), itemId: '2' }));
    TestBed.configureTestingModule({
      imports: [CourseViewComponent, NoopAnimationsModule],
      providers: [
        provideRouter([{ path: 'courses/:courseId/lessons/:itemId', component: CourseViewComponent }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: StudyApi, useValue: studyApi },
        { provide: ProgressApi, useValue: progressApi },
        { provide: CoursesApi, useValue: coursesApi },
        { provide: CourseItemsApi, useValue: jasmine.createSpyObj('CourseItemsApi', { createPlaybackTicket: of({ url: '/api/media/playback/1/1/1?expires=1&sig=x' }) }) },
        { provide: CourseImagesApi, useValue: jasmine.createSpyObj('CourseImagesApi', { createImageTickets: of({ tickets: [] }) }) },
        { provide: DiscussionApi, useValue: discussionApi },
        { provide: ConfirmationService, useValue: jasmine.createSpyObj('ConfirmationService', {
          confirm: of(true),
          confirmOrTrue: of(true)
        }) },
        { provide: AuthService, useValue: authServiceStub },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ courseId: String(courseId), itemId: '2' }) },
            paramMap: paramMap$.asObservable()
          }
        }
      ]
    });

    (window as unknown as { __xss?: boolean }).__xss = false;
    fixture = TestBed.createComponent(CourseViewComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const content = selectedContent();
    expect(content).not.toBeNull();
    expect(fixture.nativeElement.querySelector('pre.markdown')).toBeNull();
    expect(content?.querySelector('script')).toBeNull();
    expect(content?.innerHTML).not.toMatch(/onerror=/i);
    expect(content?.innerHTML).not.toContain('<script');
    expect((window as unknown as { __xss?: boolean }).__xss).toBeFalsy();
    expect(content?.textContent).toContain('Olá');
  }));

  it('shouldRefreshTreeStateAfterCompletionAction', fakeAsync(() => {
    configure({ courseId: String(courseId), itemId: '2' });

    const afterCompleteTree = studyResponse([
      { id: 1, title: 'Intro', sortOrder: 1, completed: true, accessible: true },
      { id: 2, title: 'Setup', sortOrder: 2, completed: true, accessible: true },
      { id: 3, title: 'DI', sortOrder: 3, completed: false, accessible: true }
    ]);
    studyApi.getCourseStudy.and.returnValue(of(afterCompleteTree) as never);

    const concluirButton = fixture.debugElement.query(By.css('[data-testid="concluir-aula"]'))
      ?? fixture.debugElement.queryAll(By.css('button'))
        .find(button => /concluir/i.test(button.nativeElement.textContent ?? ''));

    expect(concluirButton).withContext('Concluir aula action must be present').toBeTruthy();
    if (!concluirButton) {
      return;
    }

    concluirButton.nativeElement.click();
    tick();
    fixture.detectChanges();

    expect(progressApi.updateItemProgress).toHaveBeenCalledWith(
      courseId,
      2,
      jasmine.objectContaining({ completed: true })
    );
    expect(studyApi.getCourseStudy).toHaveBeenCalledTimes(2);
    expect(aulaState(3)).not.toBe('locked');
    expect(aulaNode(3)?.getAttribute('aria-disabled')).not.toBe('true');
  }));

  function concluirAulaButton() {
    return fixture.debugElement.query(By.css('[data-testid="concluir-aula"]'))
      ?? fixture.debugElement.queryAll(By.css('button'))
        .find(button => /concluir/i.test(button.nativeElement.textContent ?? ''));
  }

  const diContent: CourseItemResponse = {
    id: 3,
    courseId,
    title: 'DI',
    itemType: 'MARKDOWN',
    sortOrder: 3,
    markdownBody: '## Injeção de dependências'
  };

  it('shouldAdvanceToNextAulaAfterSuccessfulCompletion', fakeAsync(() => {
    configure({ courseId: String(courseId), itemId: '2' });

    const afterCompleteTree = studyResponse([
      { id: 1, title: 'Intro', sortOrder: 1, completed: true, accessible: true },
      { id: 2, title: 'Setup', sortOrder: 2, completed: true, accessible: true },
      { id: 3, title: 'DI', sortOrder: 3, completed: false, accessible: true }
    ]);
    studyApi.getCourseStudy.and.returnValue(of(afterCompleteTree) as never);
    studyApi.getStudyItem.and.callFake((_cId: number, itemId: number) => {
      if (itemId === 1) {
        return of(introContent) as never;
      }
      if (itemId === 3) {
        return of(diContent) as never;
      }
      return of(setupContent) as never;
    });

    const concluirButton = concluirAulaButton();
    expect(concluirButton).withContext('Concluir aula action must be present').toBeTruthy();
    if (!concluirButton) {
      return;
    }

    (router.navigate as jasmine.Spy).calls.reset();
    concluirButton.nativeElement.click();
    tick();
    fixture.detectChanges();

    expect(progressApi.updateItemProgress).toHaveBeenCalledWith(
      courseId,
      2,
      jasmine.objectContaining({ completed: true })
    );
    expect(router.navigate).toHaveBeenCalledWith(['/courses', courseId, 'lessons', 3]);
    expect(fixture.componentInstance.selectedAulaId).toBe(3);
    expect(aulaState(3)).toBe('current');
  }));

  it('shouldRemainOnFinalAulaAfterCompletingLastItem', fakeAsync(() => {
    configure({ courseId: String(courseId), itemId: '2' });

    studyApi.getStudyItem.and.callFake((_cId: number, itemId: number) => {
      if (itemId === 1) {
        return of(introContent) as never;
      }
      if (itemId === 3) {
        return of(diContent) as never;
      }
      return of(setupContent) as never;
    });

    const afterPenultimateComplete = studyResponse([
      { id: 1, title: 'Intro', sortOrder: 1, completed: true, accessible: true },
      { id: 2, title: 'Setup', sortOrder: 2, completed: true, accessible: true },
      { id: 3, title: 'DI', sortOrder: 3, completed: false, accessible: true }
    ]);
    studyApi.getCourseStudy.and.returnValue(of(afterPenultimateComplete) as never);

    let concluirButton = concluirAulaButton();
    expect(concluirButton).withContext('Concluir aula action must be present').toBeTruthy();
    if (!concluirButton) {
      return;
    }

    (router.navigate as jasmine.Spy).calls.reset();
    concluirButton.nativeElement.click();
    tick();
    fixture.detectChanges();

    expect(progressApi.updateItemProgress).toHaveBeenCalledWith(
      courseId,
      2,
      jasmine.objectContaining({ completed: true })
    );
    expect(router.navigate).toHaveBeenCalledWith(['/courses', courseId, 'lessons', 3]);
    expect(fixture.componentInstance.selectedAulaId).toBe(3);

    const afterFinalComplete = studyResponse([
      { id: 1, title: 'Intro', sortOrder: 1, completed: true, accessible: true },
      { id: 2, title: 'Setup', sortOrder: 2, completed: true, accessible: true },
      { id: 3, title: 'DI', sortOrder: 3, completed: true, accessible: true }
    ]);
    studyApi.getCourseStudy.and.returnValue(of(afterFinalComplete) as never);

    concluirButton = concluirAulaButton();
    expect(concluirButton).withContext('Concluir aula must remain available on final aula').toBeTruthy();
    if (!concluirButton) {
      return;
    }

    (router.navigate as jasmine.Spy).calls.reset();
    progressApi.updateItemProgress.calls.reset();
    concluirButton.nativeElement.click();
    tick();
    fixture.detectChanges();

    expect(progressApi.updateItemProgress).toHaveBeenCalledWith(
      courseId,
      3,
      jasmine.objectContaining({ completed: true })
    );
    expect(router.navigate).not.toHaveBeenCalledWith(['/courses', courseId, 'lessons', 4]);
    expect(router.navigate).not.toHaveBeenCalled();
    expect(fixture.componentInstance.selectedAulaId).toBe(3);
    expect(fixture.nativeElement.querySelector('[data-testid="course-finish"]'))
      .withContext('Finish screen must replace final aula content at 100%')
      .toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="download-certificate"]')).toBeTruthy();
  }));

  it('shouldShowSidebarProgressPercentage', fakeAsync(() => {
    configure({ courseId: String(courseId), itemId: '2' });

    const progress = fixture.nativeElement.querySelector('[data-testid="study-progress"]') as HTMLElement | null;
    expect(progress).withContext('Sidebar progress must be visible').toBeTruthy();
    expect(progress?.textContent).toContain('1/3');
    expect(progress?.textContent).toMatch(/33/);
  }));

  it('shouldRollbackCompletedAulaAfterConfirmation', fakeAsync(() => {
    const completedTree = studyResponse([
      { id: 1, title: 'Intro', sortOrder: 1, completed: true, accessible: true },
      { id: 2, title: 'Setup', sortOrder: 2, completed: true, accessible: true },
      { id: 3, title: 'DI', sortOrder: 3, completed: false, accessible: true }
    ]);
    TestBed.resetTestingModule();
    paramMap$ = new BehaviorSubject(convertToParamMap({ courseId: String(courseId), itemId: '2' }));
    studyApi = jasmine.createSpyObj('StudyApi', ['getCourseStudy', 'getStudyItem']);
    progressApi = jasmine.createSpyObj('ProgressApi', ['updateItemProgress', 'downloadCourseCertificate']);
    coursesApi = jasmine.createSpyObj('CoursesApi', ['findCourse']);
    const discussionApi = jasmine.createSpyObj('DiscussionApi', [
      'listComments', 'createComment', 'upvoteComment', 'hideComment', 'restoreComment'
    ]);
    const confirmation = jasmine.createSpyObj('ConfirmationService', ['confirm', 'confirmOrTrue']);
    confirmation.confirm.and.returnValue(of(true));
    confirmation.confirmOrTrue.and.returnValue(of(true));
    discussionApi.listComments.and.returnValue(of([]) as never);
    studyApi.getCourseStudy.and.returnValue(of(completedTree) as never);
    studyApi.getStudyItem.and.returnValue(of(setupContent) as never);
    progressApi.updateItemProgress.and.returnValue(of({ completed: false }) as never);
    progressApi.downloadCourseCertificate.and.returnValue(of(new Blob(['%PDF'], { type: 'application/pdf' })) as never);
    coursesApi.findCourse.and.returnValue(of({
      teaching: false,
      enrolled: true,
      course: { id: courseId, title: 'Quarkus', summary: 'Curso completo', teacherName: 'Ana', teacherDescription: 'Instrutora backend' },
      items: [introContent, setupContent]
    }) as never);

    TestBed.configureTestingModule({
      imports: [CourseViewComponent, NoopAnimationsModule],
      providers: [
        provideRouter([
          { path: 'courses/:courseId', component: CourseViewComponent },
          { path: 'courses/:courseId/lessons/:itemId', component: CourseViewComponent }
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: StudyApi, useValue: studyApi },
        { provide: ProgressApi, useValue: progressApi },
        { provide: CoursesApi, useValue: coursesApi },
        { provide: CourseItemsApi, useValue: jasmine.createSpyObj('CourseItemsApi', { createPlaybackTicket: of({ url: '/api/media/playback/1/1/1?expires=1&sig=x' }) }) },
        { provide: CourseImagesApi, useValue: jasmine.createSpyObj('CourseImagesApi', { createImageTickets: of({ tickets: [] }) }) },
        { provide: DiscussionApi, useValue: discussionApi },
        { provide: ConfirmationService, useValue: confirmation },
        { provide: AuthService, useValue: authServiceStub },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ courseId: String(courseId), itemId: '2' }) },
            paramMap: paramMap$.asObservable()
          }
        }
      ]
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(CourseViewComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const rollbackButton = fixture.debugElement.query(By.css('[data-testid="desfazer-progresso"]'));
    expect(rollbackButton).withContext('Desfazer progresso must replace Concluir on completed aula').toBeTruthy();
    if (!rollbackButton) {
      return;
    }

    studyApi.getCourseStudy.and.returnValue(of(studyResponse([
      { id: 1, title: 'Intro', sortOrder: 1, completed: true, accessible: true },
      { id: 2, title: 'Setup', sortOrder: 2, completed: false, accessible: true },
      { id: 3, title: 'DI', sortOrder: 3, completed: false, accessible: false }
    ])) as never);

    rollbackButton.nativeElement.click();
    tick();
    fixture.detectChanges();

    expect(progressApi.updateItemProgress).toHaveBeenCalledWith(
      courseId,
      2,
      jasmine.objectContaining({ completed: false })
    );
  }));

  it('shouldDownloadCertificateFromFinishScreen', fakeAsync(() => {
    const concludedTree = studyResponse([
      { id: 1, title: 'Intro', sortOrder: 1, completed: true, accessible: true },
      { id: 2, title: 'Setup', sortOrder: 2, completed: true, accessible: true },
      { id: 3, title: 'DI', sortOrder: 3, completed: true, accessible: true }
    ]);
    TestBed.resetTestingModule();
    paramMap$ = new BehaviorSubject(convertToParamMap({ courseId: String(courseId), itemId: '3' }));
    studyApi = jasmine.createSpyObj('StudyApi', ['getCourseStudy', 'getStudyItem']);
    progressApi = jasmine.createSpyObj('ProgressApi', ['updateItemProgress', 'downloadCourseCertificate']);
    coursesApi = jasmine.createSpyObj('CoursesApi', ['findCourse']);
    const discussionApi = jasmine.createSpyObj('DiscussionApi', [
      'listComments', 'createComment', 'upvoteComment', 'hideComment', 'restoreComment'
    ]);
    const confirmation = jasmine.createSpyObj('ConfirmationService', ['confirm', 'confirmOrTrue']);
    confirmation.confirm.and.returnValue(of(true));
    confirmation.confirmOrTrue.and.returnValue(of(true));
    discussionApi.listComments.and.returnValue(of([]) as never);
    studyApi.getCourseStudy.and.returnValue(of(concludedTree) as never);
    studyApi.getStudyItem.and.returnValue(of(diContent) as never);
    progressApi.updateItemProgress.and.returnValue(of({ completed: true }) as never);
    progressApi.downloadCourseCertificate.and.returnValue(of(new Blob(['%PDF'], { type: 'application/pdf' })) as never);
    coursesApi.findCourse.and.returnValue(of({
      teaching: false,
      enrolled: true,
      course: { id: courseId, title: 'Quarkus', summary: 'Curso completo', teacherName: 'Ana', teacherDescription: 'Instrutora backend' },
      items: [introContent, setupContent, diContent]
    }) as never);

    TestBed.configureTestingModule({
      imports: [CourseViewComponent, NoopAnimationsModule],
      providers: [
        provideRouter([
          { path: 'courses/:courseId', component: CourseViewComponent },
          { path: 'courses/:courseId/lessons/:itemId', component: CourseViewComponent }
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: StudyApi, useValue: studyApi },
        { provide: ProgressApi, useValue: progressApi },
        { provide: CoursesApi, useValue: coursesApi },
        { provide: CourseItemsApi, useValue: jasmine.createSpyObj('CourseItemsApi', { createPlaybackTicket: of({ url: '/api/media/playback/1/1/1?expires=1&sig=x' }) }) },
        { provide: CourseImagesApi, useValue: jasmine.createSpyObj('CourseImagesApi', { createImageTickets: of({ tickets: [] }) }) },
        { provide: DiscussionApi, useValue: discussionApi },
        { provide: ConfirmationService, useValue: confirmation },
        { provide: AuthService, useValue: authServiceStub },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ courseId: String(courseId), itemId: '3' }) },
            paramMap: paramMap$.asObservable()
          }
        }
      ]
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(CourseViewComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const downloadButton = fixture.nativeElement.querySelector('[data-testid="download-certificate"]') as HTMLButtonElement | null;
    expect(downloadButton).withContext('Certificate download must be on finish screen').toBeTruthy();
    downloadButton?.click();
    tick();

    expect(progressApi.downloadCourseCertificate).toHaveBeenCalledWith(courseId);
  }));

  it('shouldNotNavigateAwayWhenProgressUpdateFails', fakeAsync(() => {
    configure({ courseId: String(courseId), itemId: '2' });

    progressApi.updateItemProgress.and.returnValue(
      throwError(() => ({ status: 500, message: 'progress update failed' })) as never
    );

    const concluirButton = concluirAulaButton();
    expect(concluirButton).withContext('Concluir aula action must be present').toBeTruthy();
    if (!concluirButton) {
      return;
    }

    (router.navigate as jasmine.Spy).calls.reset();
    concluirButton.nativeElement.click();
    tick();
    fixture.detectChanges();

    expect(progressApi.updateItemProgress).toHaveBeenCalledWith(
      courseId,
      2,
      jasmine.objectContaining({ completed: true })
    );
    expect(router.navigate).not.toHaveBeenCalledWith(['/courses', courseId, 'lessons', 3]);
    expect(router.navigate).not.toHaveBeenCalled();
    expect(fixture.componentInstance.selectedAulaId).toBe(2);
    expect(aulaState(2)).toBe('current');
  }));
});

describe('CourseViewComponent aula discussion (T16)', () => {
  const courseId = 42;

  const studyTree: StudyItemResponse[] = [
    { id: 1, title: 'Intro', sortOrder: 1, completed: true, accessible: true },
    { id: 2, title: 'Setup', sortOrder: 2, completed: false, accessible: true },
    { id: 3, title: 'DI', sortOrder: 3, completed: false, accessible: false }
  ];

  const introContent: CourseItemResponse = {
    id: 1,
    courseId,
    title: 'Intro',
    itemType: 'MARKDOWN',
    sortOrder: 1,
    markdownBody: '# Intro'
  };

  const setupContent: CourseItemResponse = {
    id: 2,
    courseId,
    title: 'Setup',
    itemType: 'MARKDOWN',
    sortOrder: 2,
    markdownBody: '## Setup'
  };

  const setupComments: CommentResponse[] = [
    {
      id: 10,
      courseItemId: 2,
      authorPassportUserId: 7,
      authorUsername: 'ana',
      authorName: 'Ana',
      content: 'Excelente exemplo!',
      createdAt: '2026-07-18T10:00:00Z',
      hidden: false,
      count: 4,
      callerUpvoted: true
    },
    {
      id: 11,
      courseItemId: 2,
      authorPassportUserId: 8,
      authorUsername: 'bob',
      authorName: 'Bob',
      content: 'Dúvida sobre o JDK.',
      createdAt: '2026-07-18T11:00:00Z',
      hidden: false,
      count: 1,
      callerUpvoted: false
    }
  ];

  const introComments: CommentResponse[] = [
    {
      id: 20,
      courseItemId: 1,
      authorPassportUserId: 9,
      authorUsername: 'carla',
      authorName: 'Carla',
      content: 'Bem-vindo ao curso!',
      createdAt: '2026-07-17T09:00:00Z',
      hidden: false,
      count: 2,
      callerUpvoted: false
    }
  ];

  const teacherComments: CommentResponse[] = [
    ...setupComments,
    {
      id: 12,
      courseItemId: 2,
      authorPassportUserId: 8,
      authorUsername: 'bob',
      authorName: 'Bob',
      content: 'Comentário oculto do aluno',
      createdAt: '2026-07-18T12:00:00Z',
      hidden: true,
      count: 0,
      callerUpvoted: false
    }
  ];

  let fixture: ComponentFixture<CourseViewComponent>;
  let studyApi: jasmine.SpyObj<StudyApi>;
  let progressApi: jasmine.SpyObj<ProgressApi>;
  let coursesApi: jasmine.SpyObj<CoursesApi>;
  let discussionApi: jasmine.SpyObj<DiscussionApi>;
  let paramMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  function studyResponse(items: StudyItemResponse[] = studyTree): StudyResponse {
    const completedItems = items.filter(item => item.completed).length;
    const totalItems = items.length;
    const concluded = totalItems > 0 && completedItems === totalItems;
    return {
      courseId,
      items,
      completedItems,
      totalItems,
      percentComplete: totalItems === 0 ? 0 : (completedItems * 100) / totalItems,
      concluded,
      concludedAt: concluded ? '2026-07-19T12:00:00Z' : undefined
    };
  }

  function configure(options: {
    params: Record<string, string>;
    teaching?: boolean;
    enrolled?: boolean;
    commentsByItem?: Record<number, CommentResponse[]>;
  }): void {
    TestBed.resetTestingModule();

    const teaching = options.teaching ?? false;
    const enrolled = options.enrolled ?? true;
    const commentsByItem = options.commentsByItem ?? {
      1: introComments,
      2: setupComments
    };

    paramMap$ = new BehaviorSubject(convertToParamMap(options.params));
    studyApi = jasmine.createSpyObj('StudyApi', ['getCourseStudy', 'getStudyItem']);
    progressApi = jasmine.createSpyObj('ProgressApi', ['updateItemProgress', 'downloadCourseCertificate']);
    coursesApi = jasmine.createSpyObj('CoursesApi', ['findCourse']);
    discussionApi = jasmine.createSpyObj('DiscussionApi', [
      'listComments',
      'createComment',
      'upvoteComment',
      'hideComment',
      'restoreComment'
    ]);
    const confirmation = jasmine.createSpyObj('ConfirmationService', ['confirm', 'confirmOrTrue']);
    confirmation.confirm.and.returnValue(of(true));
    confirmation.confirmOrTrue.and.returnValue(of(true));

    studyApi.getCourseStudy.and.returnValue(of(studyResponse()) as never);
    studyApi.getStudyItem.and.callFake((_cId: number, itemId: number) => {
      if (itemId === 1) {
        return of(introContent) as never;
      }
      return of(setupContent) as never;
    });
    progressApi.updateItemProgress.and.returnValue(of({ completed: true }) as never);
    progressApi.downloadCourseCertificate.and.returnValue(of(new Blob(['%PDF'], { type: 'application/pdf' })) as never);
    coursesApi.findCourse.and.returnValue(of({
      teaching,
      enrolled,
      course: { id: courseId, title: 'Quarkus', summary: 'Curso completo', teacherName: 'Ana', teacherDescription: 'Instrutora backend' },
      items: [introContent, setupContent]
    }) as never);
    discussionApi.listComments.and.callFake((_cId: number, itemId: number) =>
      of(commentsByItem[itemId] ?? []) as never
    );
    discussionApi.createComment.and.returnValue(of({
      id: 99,
      courseItemId: 2,
      authorPassportUserId: 1,
      authorUsername: 'me',
      authorName: 'Eu',
      content: 'Novo comentário',
      createdAt: '2026-07-18T13:00:00Z',
      hidden: false,
      count: 0,
      callerUpvoted: false
    }) as never);
    discussionApi.upvoteComment.and.callFake((commentId: number) => {
      const updated = {
        ...setupComments.find(comment => comment.id === commentId)!,
        count: 5,
        callerUpvoted: false
      };
      return of(updated) as never;
    });
    discussionApi.hideComment.and.returnValue(of({
      ...setupComments[0],
      hidden: true
    }) as never);
    discussionApi.restoreComment.and.returnValue(of({
      ...teacherComments[2],
      hidden: false
    }) as never);

    TestBed.configureTestingModule({
      imports: [CourseViewComponent, NoopAnimationsModule],
      providers: [
        provideRouter([
          { path: 'courses/:courseId', component: CourseViewComponent },
          { path: 'courses/:courseId/lessons/:itemId', component: CourseViewComponent }
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: StudyApi, useValue: studyApi },
        { provide: ProgressApi, useValue: progressApi },
        { provide: CoursesApi, useValue: coursesApi },
        { provide: CourseItemsApi, useValue: jasmine.createSpyObj('CourseItemsApi', { createPlaybackTicket: of({ url: '/api/media/playback/1/1/1?expires=1&sig=x' }) }) },
        { provide: CourseImagesApi, useValue: jasmine.createSpyObj('CourseImagesApi', { createImageTickets: of({ tickets: [] }) }) },
        { provide: DiscussionApi, useValue: discussionApi },
        { provide: ConfirmationService, useValue: confirmation },
        { provide: AuthService, useValue: authServiceStub },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap(options.params) },
            paramMap: paramMap$.asObservable()
          }
        }
      ]
    });

    fixture = TestBed.createComponent(CourseViewComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
  }

  function discussionRoot(): HTMLElement | null {
    return fixture.nativeElement.querySelector('[data-testid="aula-discussion"]');
  }

  function commentNodes(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('[data-comment-id]')) as HTMLElement[];
  }

  function commentNode(commentId: number): HTMLElement | null {
    return fixture.nativeElement.querySelector(`[data-comment-id="${commentId}"]`);
  }

  function commentInput(): HTMLTextAreaElement | HTMLInputElement | null {
    return fixture.nativeElement.querySelector(
      '[data-testid="comment-input"], textarea[name="comment"], input[name="comment"]'
    );
  }

  function publishButton(): HTMLElement | null {
    const byTestId = fixture.nativeElement.querySelector('[data-testid="publish-comment"]');
    if (byTestId) {
      return byTestId;
    }
    return fixture.debugElement.queryAll(By.css('button'))
      .map(button => button.nativeElement as HTMLElement)
      .find(button => /comentar/i.test(button.textContent ?? '')) ?? null;
  }

  function upvoteControl(commentId: number): HTMLElement | null {
    const comment = commentNode(commentId);
    return comment?.querySelector('[data-testid="comment-upvote"], button.upvote, [aria-label*="upvote" i]')
      ?? null;
  }

  it('shouldLoadAndDisplayVisibleCommentsWithUpvoteCountAndCallerState', fakeAsync(() => {
    configure({ params: { courseId: String(courseId), itemId: '2' } });

    expect(discussionApi.listComments).toHaveBeenCalledWith(courseId, 2);
    expect(discussionRoot()).withContext('Discussion region must be present').not.toBeNull();

    const nodes = commentNodes();
    expect(nodes.map(node => node.getAttribute('data-comment-id'))).toEqual(['10', '11']);
    expect(commentNode(10)?.textContent).toContain('Excelente exemplo!');
    expect(commentNode(10)?.textContent).toMatch(/4/);
    expect(commentNode(10)?.getAttribute('data-caller-upvoted')).toBe('true');
    expect(commentNode(11)?.textContent).toContain('Dúvida sobre o JDK.');
    expect(commentNode(11)?.textContent).toMatch(/1/);
    expect(commentNode(11)?.getAttribute('data-caller-upvoted')).toBe('false');
  }));

  it('shouldCreateNonblankCommentRefreshListAndKeepInputErrorSafe', fakeAsync(() => {
    configure({ params: { courseId: String(courseId), itemId: '2' } });

    const input = commentInput();
    const publish = publishButton();
    expect(input).withContext('Comment input must be present').not.toBeNull();
    expect(publish).withContext('Comentar action must be present').not.toBeNull();
    expect((publish?.textContent ?? '').trim()).toMatch(/Comentar/i);
    if (!input || !publish) {
      return;
    }

    input.value = '   ';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    publish.click();
    tick();
    fixture.detectChanges();

    expect(discussionApi.createComment).not.toHaveBeenCalled();

    discussionApi.createComment.and.returnValue(throwError(() => ({ status: 400 })) as never);
    input.value = 'Comentário inválido no servidor';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    publish.click();
    tick();
    fixture.detectChanges();

    expect(discussionApi.createComment).toHaveBeenCalledWith(
      courseId,
      2,
      jasmine.objectContaining({ content: 'Comentário inválido no servidor' })
    );
    expect(commentInput()).withContext('Input must remain usable after API error').not.toBeNull();
    expect(discussionRoot()?.textContent).not.toMatch(/undefined|null|\[object Object\]/i);

    discussionApi.createComment.and.returnValue(of({
      id: 99,
      courseItemId: 2,
      authorPassportUserId: 1,
      authorUsername: 'me',
      authorName: 'Eu',
      content: 'Novo comentário válido',
      createdAt: '2026-07-18T13:00:00Z',
      hidden: false,
      count: 0,
      callerUpvoted: false
    }) as never);
    discussionApi.listComments.and.returnValue(of([
      ...setupComments,
      {
        id: 99,
        courseItemId: 2,
        authorPassportUserId: 1,
        authorUsername: 'me',
        authorName: 'Eu',
        content: 'Novo comentário válido',
        createdAt: '2026-07-18T13:00:00Z',
        hidden: false,
        count: 0,
        callerUpvoted: false
      }
    ]) as never);

    input.value = 'Novo comentário válido';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    publish.click();
    tick();
    fixture.detectChanges();

    expect(discussionApi.createComment).toHaveBeenCalledWith(
      courseId,
      2,
      jasmine.objectContaining({ content: 'Novo comentário válido' })
    );
    expect(discussionApi.listComments).toHaveBeenCalledTimes(2);
    expect(commentNode(99)?.textContent).toContain('Novo comentário válido');
  }));

  it('shouldToggleUpvoteAndRefreshCountAndCallerState', fakeAsync(() => {
    configure({ params: { courseId: String(courseId), itemId: '2' } });

    const upvote = upvoteControl(10);
    expect(upvote).withContext('Upvote control must be present').not.toBeNull();
    if (!upvote) {
      return;
    }

    discussionApi.listComments.and.returnValue(of([
      { ...setupComments[0], count: 5, callerUpvoted: false },
      setupComments[1]
    ]) as never);

    upvote.click();
    tick();
    fixture.detectChanges();

    expect(discussionApi.upvoteComment).toHaveBeenCalledWith(10);
    expect(commentNode(10)?.textContent).toMatch(/5/);
    expect(commentNode(10)?.getAttribute('data-caller-upvoted')).toBe('false');
  }));

  it('shouldShowHiddenCommentsAndHideRestoreControlsForTeacherOnly', fakeAsync(() => {
    configure({
      params: { courseId: String(courseId), itemId: '2' },
      teaching: true,
      enrolled: false,
      commentsByItem: { 2: teacherComments }
    });

    expect(commentNode(12)?.textContent).toContain('Comentário oculto do aluno');
    expect(commentNode(12)?.getAttribute('data-comment-hidden')).toBe('true');

    const hideControl = commentNode(10)?.querySelector('[data-testid="hide-comment"]')
      ?? fixture.debugElement.queryAll(By.css('button'))
        .map(button => button.nativeElement as HTMLElement)
        .find(button => /ocultar/i.test(button.textContent ?? ''));
    const restoreControl = commentNode(12)?.querySelector('[data-testid="restore-comment"]')
      ?? fixture.debugElement.queryAll(By.css('button'))
        .map(button => button.nativeElement as HTMLElement)
        .find(button => /restaurar/i.test(button.textContent ?? ''));

    expect(hideControl).withContext('Teacher hide control must be present').toBeTruthy();
    expect(restoreControl).withContext('Teacher restore control must be present').toBeTruthy();

    configure({
      params: { courseId: String(courseId), itemId: '2' },
      teaching: false,
      enrolled: true,
      commentsByItem: {
        2: [
          ...setupComments,
          {
            id: 12,
            courseItemId: 2,
            authorPassportUserId: 8,
            authorUsername: 'bob',
            authorName: 'Bob',
            content: 'Comentário oculto do aluno',
            createdAt: '2026-07-18T12:00:00Z',
            hidden: true,
            count: 0,
            callerUpvoted: false
          }
        ]
      }
    });

    expect(commentNode(12)).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Comentário oculto do aluno');
    expect(fixture.nativeElement.querySelector('[data-testid="hide-comment"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="restore-comment"]')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toMatch(/ocultar|restaurar/i);
  }));

  it('shouldReloadDiscussionWhenSelectedAulaChanges', fakeAsync(() => {
    configure({ params: { courseId: String(courseId), itemId: '2' } });

    expect(discussionApi.listComments).toHaveBeenCalledWith(courseId, 2);
    expect(commentNode(10)?.textContent).toContain('Excelente exemplo!');
    expect(commentNode(20)).toBeNull();

    paramMap$.next(convertToParamMap({ courseId: String(courseId), itemId: '1' }));
    tick();
    fixture.detectChanges();

    expect(discussionApi.listComments).toHaveBeenCalledWith(courseId, 1);
    expect(commentNode(20)?.textContent).toContain('Bem-vindo ao curso!');
    expect(commentNode(10)).toBeNull();
  }));

  it('shouldOmitDiscussionInteractionsForLockedAula', fakeAsync(() => {
    configure({ params: { courseId: String(courseId), itemId: '2' } });

    expect(discussionRoot())
      .withContext('Accessible aula must expose discussion before locked checks')
      .not.toBeNull();
    expect(discussionApi.listComments).toHaveBeenCalledWith(courseId, 2);
    expect(commentInput()).withContext('Accessible aula must allow commenting').not.toBeNull();
    discussionApi.listComments.calls.reset();

    const locked = fixture.nativeElement.querySelector('[data-aula-id="3"]') as HTMLElement | null;
    expect(locked).not.toBeNull();
    locked?.click();
    tick();
    fixture.detectChanges();

    expect(discussionApi.listComments).not.toHaveBeenCalledWith(courseId, 3);
    expect(discussionApi.createComment).not.toHaveBeenCalled();
    expect(discussionApi.upvoteComment).not.toHaveBeenCalled();
    expect(discussionRoot()).not.toBeNull();
    expect(commentNode(10)?.textContent).toContain('Excelente exemplo!');

    paramMap$.next(convertToParamMap({ courseId: String(courseId), itemId: '3' }));
    tick();
    fixture.detectChanges();

    expect(discussionApi.listComments).not.toHaveBeenCalledWith(courseId, 3);
    expect(discussionApi.createComment).not.toHaveBeenCalled();
    expect(discussionApi.upvoteComment).not.toHaveBeenCalled();
    expect(commentNode(10)?.textContent).toContain('Excelente exemplo!');
  }));
});

describe('CourseViewComponent visual shell (T24)', () => {
  const courseId = 42;

  const studyTree: StudyItemResponse[] = [
    { id: 1, title: 'Intro', sortOrder: 1, completed: true, accessible: true },
    { id: 2, title: 'Setup', sortOrder: 2, completed: false, accessible: true },
    { id: 3, title: 'DI', sortOrder: 3, completed: false, accessible: false }
  ];

  const introContent: CourseItemResponse = {
    id: 1,
    courseId,
    title: 'Intro',
    itemType: 'MARKDOWN',
    sortOrder: 1,
    markdownBody: '# Boas-vindas'
  };

  const setupContent: CourseItemResponse = {
    id: 2,
    courseId,
    title: 'Setup',
    itemType: 'MARKDOWN',
    sortOrder: 2,
    markdownBody: '## Ambiente'
  };

  let fixture: ComponentFixture<CourseViewComponent>;
  let studyApi: jasmine.SpyObj<StudyApi>;
  let progressApi: jasmine.SpyObj<ProgressApi>;
  let coursesApi: jasmine.SpyObj<CoursesApi>;
  let router: Router;
  let paramMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  function configure(
    params: Record<string, string> = { courseId: String(courseId), itemId: '2' },
    options: { teaching?: boolean; enrolled?: boolean } = {}
  ): void {
    TestBed.resetTestingModule();

    const teaching = options.teaching ?? false;
    const enrolled = options.enrolled ?? true;

    paramMap$ = new BehaviorSubject(convertToParamMap(params));
    studyApi = jasmine.createSpyObj('StudyApi', ['getCourseStudy', 'getStudyItem']);
    progressApi = jasmine.createSpyObj('ProgressApi', ['updateItemProgress', 'downloadCourseCertificate']);
    coursesApi = jasmine.createSpyObj('CoursesApi', ['findCourse']);
    const discussionApi = jasmine.createSpyObj('DiscussionApi', [
      'listComments',
      'createComment',
      'upvoteComment',
      'hideComment',
      'restoreComment'
    ]);
    const confirmation = jasmine.createSpyObj('ConfirmationService', ['confirm', 'confirmOrTrue']);
    confirmation.confirm.and.returnValue(of(true));
    confirmation.confirmOrTrue.and.returnValue(of(true));
    discussionApi.listComments.and.returnValue(of([]) as never);

    studyApi.getCourseStudy.and.returnValue(of({
      courseId,
      items: studyTree,
      completedItems: 1,
      totalItems: 3,
      percentComplete: 33.333,
      concluded: false
    }) as never);
    studyApi.getStudyItem.and.callFake((_cId: number, itemId: number) => {
      if (itemId === 1) {
        return of(introContent) as never;
      }
      return of(setupContent) as never;
    });
    progressApi.updateItemProgress.and.returnValue(of({ completed: true }) as never);
    progressApi.downloadCourseCertificate.and.returnValue(of(new Blob(['%PDF'], { type: 'application/pdf' })) as never);
    coursesApi.findCourse.and.returnValue(of({
      teaching,
      enrolled,
      course: { id: courseId, title: 'Quarkus', summary: 'Curso completo', teacherName: 'Ana', teacherDescription: 'Instrutora backend' },
      items: [introContent, setupContent]
    }) as never);

    TestBed.configureTestingModule({
      imports: [CourseViewComponent, NoopAnimationsModule],
      providers: [
        provideRouter([
          { path: 'courses/:courseId', component: CourseViewComponent },
          { path: 'courses/:courseId/lessons/:itemId', component: CourseViewComponent }
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: StudyApi, useValue: studyApi },
        { provide: ProgressApi, useValue: progressApi },
        { provide: CoursesApi, useValue: coursesApi },
        { provide: CourseItemsApi, useValue: jasmine.createSpyObj('CourseItemsApi', { createPlaybackTicket: of({ url: '/api/media/playback/1/1/1?expires=1&sig=x' }) }) },
        { provide: CourseImagesApi, useValue: jasmine.createSpyObj('CourseImagesApi', { createImageTickets: of({ tickets: [] }) }) },
        { provide: DiscussionApi, useValue: discussionApi },
        { provide: ConfirmationService, useValue: confirmation },
        { provide: AuthService, useValue: authServiceStub },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap(params) },
            paramMap: paramMap$.asObservable()
          }
        }
      ]
    });

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    fixture = TestBed.createComponent(CourseViewComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
  }

  function studyShell(): HTMLElement | null {
    return fixture.nativeElement.querySelector('[data-testid="study-shell"]');
  }

  function shellSidebar(): HTMLElement | null {
    return fixture.nativeElement.querySelector('[data-testid="shell-sidebar"]');
  }

  function shellMain(): HTMLElement | null {
    return fixture.nativeElement.querySelector('[data-testid="shell-main"]');
  }

  function aulaTree(): HTMLElement | null {
    return fixture.nativeElement.querySelector('[data-testid="aula-tree"]');
  }

  function aulaNode(itemId: number): HTMLElement | null {
    return fixture.nativeElement.querySelector(`[data-aula-id="${itemId}"]`);
  }

  function aulaStateIcon(itemId: number): HTMLElement | null {
    const node = aulaNode(itemId);
    if (!node) {
      return null;
    }
    return node.querySelector('mat-icon[aria-hidden="true"], .mat-icon[aria-hidden="true"]');
  }

  function iconFontName(icon: HTMLElement): string {
    return (
      icon.getAttribute('data-mat-icon-name')
      ?? icon.getAttribute('fontIcon')
      ?? icon.getAttribute('ng-reflect-font-icon')
      ?? (icon.textContent ?? '').replace(/\s+/g, ' ').trim()
    );
  }

  function aulasAccessControl(): HTMLElement | null {
    const byTestId = fixture.nativeElement.querySelector(
      '[data-testid="aulas-toggle"], [data-testid="shell-sidebar-toggle"]'
    );
    if (byTestId) {
      return byTestId;
    }
    return fixture.debugElement.queryAll(By.css('button, [role="button"], a'))
      .map(el => el.nativeElement as HTMLElement)
      .find(el => /^aulas$/i.test((el.textContent ?? '').replace(/\s+/g, ' ').trim())
        || /abrir aulas|mostrar aulas|aulas/i.test(el.getAttribute('aria-label') ?? ''))
      ?? null;
  }

  function teacherActionLink(label: RegExp): HTMLAnchorElement | null {
    return fixture.debugElement.queryAll(By.css('a'))
      .map(el => el.nativeElement as HTMLAnchorElement)
      .find(anchor => label.test((anchor.textContent ?? '').replace(/\s+/g, ' ').trim()))
      ?? null;
  }

  it('shouldLinkTeacherActionsToTeacherCourseRoutes', fakeAsync(() => {
    configure({ courseId: String(courseId), itemId: '2' }, { teaching: true, enrolled: false });

    const edit = teacherActionLink(/^Editar$/i);
    const students = teacherActionLink(/^Alunos$/i);
    const progress = teacherActionLink(/^Progresso$/i);

    expect(edit).withContext('Teacher Editar action must be present').not.toBeNull();
    expect(students).withContext('Teacher Alunos action must be present').not.toBeNull();
    expect(progress).withContext('Teacher Progresso action must be present').not.toBeNull();

    expect(edit?.getAttribute('href')).toBe(`/teacher/courses/${courseId}/edit`);
    expect(students?.getAttribute('href')).toBe(`/teacher/courses/${courseId}/students`);
    expect(progress?.getAttribute('href')).toBe(`/teacher/courses/${courseId}/progress`);

    expect(edit?.getAttribute('href')).not.toMatch(new RegExp(`^/courses/${courseId}/edit$`));
    expect(students?.getAttribute('href')).not.toMatch(new RegExp(`^/courses/${courseId}/students$`));
    expect(progress?.getAttribute('href')).not.toMatch(new RegExp(`^/courses/${courseId}/progress$`));
  }));

  it('shouldExposeStudyShellWithSidebarAndMainRegions', fakeAsync(() => {
    configure();

    const shell = studyShell();
    expect(shell).withContext('Study root must expose data-testid="study-shell"').not.toBeNull();
    expect(shell?.classList.contains(VISUAL_SHELL_LAYOUT.page))
      .withContext('Study root must use app-shell-page')
      .toBeTrue();

    const sidebar = shellSidebar();
    const main = shellMain();
    const tree = aulaTree();

    expect(sidebar).withContext('Sidebar region data-testid="shell-sidebar"').not.toBeNull();
    expect(main).withContext('Main region data-testid="shell-main"').not.toBeNull();
    expect(tree).withContext('Aula tree remains available').not.toBeNull();
    expect(sidebar?.classList.contains(VISUAL_SHELL_LAYOUT.sidebar))
      .withContext('Sidebar uses app-shell-sidebar')
      .toBeTrue();
    expect(main?.classList.contains(VISUAL_SHELL_LAYOUT.main))
      .withContext('Main uses app-shell-main')
      .toBeTrue();
    expect(
      sidebar === tree
        || !!sidebar?.contains(tree)
        || !!tree?.closest('[data-testid="shell-sidebar"]')
    ).withContext('aula-tree lives in shell-sidebar').toBeTrue();
    expect(shell?.contains(sidebar!)).toBeTrue();
    expect(shell?.contains(main!)).toBeTrue();
  }));

  it('shouldPaintSidebarAndMainWithShellTokenBackgrounds', fakeAsync(() => {
    configure();

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
  }));

  it('shouldOmitNestedMatToolbarInsideStudyPage', fakeAsync(() => {
    configure();

    expect(fixture.nativeElement.querySelector('mat-toolbar'))
      .withContext('Study page must not nest a second mat-toolbar under the shell header')
      .toBeNull();
  }));

  it('shouldStyleCompletedCurrentAndLockedAulasWithAccentAndMutedTokens', fakeAsync(() => {
    // Lesson route so aula 2 is current (course root no longer auto-selects).
    configure({ courseId: String(courseId), itemId: '2' });

    const completed = aulaNode(1);
    const current = aulaNode(2);
    const locked = aulaNode(3);

    expect(completed).not.toBeNull();
    expect(current).not.toBeNull();
    expect(locked).not.toBeNull();
    expect(completed?.classList.contains('aula-completed')).toBeTrue();
    expect(current?.classList.contains('aula-current')).toBeTrue();
    expect(locked?.classList.contains('aula-locked')).toBeTrue();
    expect(locked?.getAttribute('aria-disabled')).toBe('true');

    const accent = VISUAL_SHELL_TOKENS['--color-accent'];
    const muted = VISUAL_SHELL_TOKENS['--color-text-muted'];

    expect(usesTokenColor(getComputedStyle(completed!), accent))
      .withContext('aula-completed must use --color-accent')
      .toBeTrue();
    expect(usesTokenColor(getComputedStyle(current!), accent))
      .withContext('aula-current must use --color-accent')
      .toBeTrue();
    expect(usesTokenColor(getComputedStyle(locked!), muted))
      .withContext('aula-locked must use --color-text-muted')
      .toBeTrue();

    locked?.click();
    fixture.detectChanges();
    expect(router.navigate).not.toHaveBeenCalledWith(['/courses', courseId, 'lessons', 3]);
  }));

  it('shouldRenderStateIconForCompletedCurrentAccessibleAndLockedAulas', fakeAsync(() => {
    // Select completed aula so item 2 is accessible (not current) and item 3 stays locked.
    configure({ courseId: String(courseId), itemId: '1' });

    expect(aulaNode(1)?.getAttribute('data-aula-state')).toBe('completed');
    expect(aulaNode(2)?.getAttribute('data-aula-state')).toBe('accessible');
    expect(aulaNode(3)?.getAttribute('data-aula-state')).toBe('locked');

    const completedIcon = aulaStateIcon(1);
    const accessibleIcon = aulaStateIcon(2);
    const lockedIcon = aulaStateIcon(3);

    expect(completedIcon)
      .withContext('completed aula must render a decorative mat-icon')
      .not.toBeNull();
    expect(accessibleIcon)
      .withContext('accessible aula must render a decorative mat-icon')
      .not.toBeNull();
    expect(lockedIcon)
      .withContext('locked aula must render a decorative mat-icon')
      .not.toBeNull();
    if (!completedIcon || !accessibleIcon || !lockedIcon) {
      return;
    }

    expect(iconFontName(completedIcon)).toBe('check_circle');
    expect(iconFontName(accessibleIcon)).toBe('radio_button_unchecked');
    expect(iconFontName(lockedIcon)).toBe('lock');
    expect(completedIcon.getAttribute('aria-hidden')).toBe('true');
    expect(accessibleIcon.getAttribute('aria-hidden')).toBe('true');
    expect(lockedIcon.getAttribute('aria-hidden')).toBe('true');

    // Current takes precedence over accessible when that aula is selected.
    configure({ courseId: String(courseId), itemId: '2' });

    expect(aulaNode(2)?.getAttribute('data-aula-state')).toBe('current');
    const currentIcon = aulaStateIcon(2);
    expect(currentIcon)
      .withContext('current aula must render a decorative mat-icon')
      .not.toBeNull();
    if (!currentIcon) {
      return;
    }
    expect(iconFontName(currentIcon)).toBe('play_arrow');
    expect(currentIcon.getAttribute('aria-hidden')).toBe('true');
  }));

  it('shouldKeepLockedAulaMutedWithLockIconAndUnlockedAccentIcons', fakeAsync(() => {
    // Lesson route so aula 2 is current (course root no longer auto-selects).
    configure({ courseId: String(courseId), itemId: '2' });

    const completed = aulaNode(1);
    const current = aulaNode(2);
    const locked = aulaNode(3);
    const completedIcon = aulaStateIcon(1);
    const currentIcon = aulaStateIcon(2);
    const lockedIcon = aulaStateIcon(3);

    expect(completed).not.toBeNull();
    expect(current).not.toBeNull();
    expect(locked).not.toBeNull();
    expect(locked?.getAttribute('aria-disabled')).toBe('true');

    expect(completedIcon).withContext('completed needs check_circle icon').not.toBeNull();
    expect(currentIcon).withContext('current needs play_arrow icon').not.toBeNull();
    expect(lockedIcon).withContext('locked needs lock icon').not.toBeNull();
    if (!completed || !current || !locked || !completedIcon || !currentIcon || !lockedIcon) {
      return;
    }

    expect(iconFontName(completedIcon)).toBe('check_circle');
    expect(iconFontName(currentIcon)).toBe('play_arrow');
    expect(iconFontName(lockedIcon)).toBe('lock');
    expect(completedIcon.getAttribute('aria-hidden')).toBe('true');
    expect(currentIcon.getAttribute('aria-hidden')).toBe('true');
    expect(lockedIcon.getAttribute('aria-hidden')).toBe('true');

    const accent = VISUAL_SHELL_TOKENS['--color-accent'];
    const muted = VISUAL_SHELL_TOKENS['--color-text-muted'];

    expect(
      usesTokenColor(getComputedStyle(completed), accent)
      || usesTokenColor(getComputedStyle(completedIcon), accent)
    ).withContext('completed unlocked icon/row must use accent').toBeTrue();
    expect(
      usesTokenColor(getComputedStyle(current), accent)
      || usesTokenColor(getComputedStyle(currentIcon), accent)
    ).withContext('current unlocked icon/row must use accent').toBeTrue();
    expect(
      usesTokenColor(getComputedStyle(locked), muted)
      || usesTokenColor(getComputedStyle(lockedIcon), muted)
    ).withContext('locked icon/row must use muted token').toBeTrue();
  }));

  it('shouldExposeAulasControlForSidebarAccessOnNarrowViewport', fakeAsync(() => {
    configure();

    const host = fixture.nativeElement as HTMLElement;
    host.style.width = '360px';
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 360 });
    window.dispatchEvent(new Event('resize'));
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const sidebar = shellSidebar() ?? aulaTree();
    expect(sidebar).withContext('Sidebar / aula tree must remain in the DOM').not.toBeNull();

    const pageStyle = studyShell() ? getComputedStyle(studyShell()!) : null;
    const stackedOrOverlay = !pageStyle
      || pageStyle.gridTemplateColumns.split(/\s+/).filter(Boolean).length <= 1
      || getComputedStyle(sidebar!).position === 'fixed'
      || getComputedStyle(sidebar!).position === 'absolute'
      || host.classList.contains('study-sidebar-open')
      || sidebar?.classList.contains('is-open')
      || sidebar?.getAttribute('data-sidebar-mode') === 'overlay'
      || sidebar?.hidden
      || getComputedStyle(sidebar!).display === 'none'
      || getComputedStyle(sidebar!).transform !== 'none';

    const aulasControl = aulasAccessControl();
    expect(aulasControl)
      .withContext('Narrow viewport must expose an Aulas control to open or identify sidebar access')
      .not.toBeNull();

    if (aulasControl && (sidebar?.hidden || getComputedStyle(sidebar!).display === 'none')) {
      aulasControl.click();
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      expect(shellSidebar() ?? aulaTree())
        .withContext('Aulas control should reveal sidebar access')
        .not.toBeNull();
      const revealed = shellSidebar() ?? aulaTree();
      expect(revealed?.hidden).not.toBeTrue();
      expect(getComputedStyle(revealed!).display).not.toBe('none');
    } else {
      expect(stackedOrOverlay || !!aulasControl)
        .withContext('Sidebar stacks/slides on narrow viewports and/or Aulas control identifies access')
        .toBeTrue();
    }
  }));
});

describe('CourseViewComponent summary and media (T17)', () => {
  const courseId = 42;

  const studyTree: StudyItemResponse[] = [
    { id: 1, title: 'Intro', sortOrder: 1, completed: true, accessible: true },
    { id: 2, title: 'Docs', sortOrder: 2, completed: false, accessible: true }
  ];

  let fixture: ComponentFixture<CourseViewComponent>;
  let studyApi: jasmine.SpyObj<StudyApi>;
  let coursesApi: jasmine.SpyObj<CoursesApi>;

  function configure(item: CourseItemResponse, options: { courseRoot?: boolean } = {}): void {
    TestBed.resetTestingModule();

    const courseRoot = options.courseRoot === true;
    const params = courseRoot
      ? { courseId: String(courseId) }
      : { courseId: String(courseId), itemId: String(item.id) };

    studyApi = jasmine.createSpyObj('StudyApi', ['getCourseStudy', 'getStudyItem']);
    coursesApi = jasmine.createSpyObj('CoursesApi', ['findCourse']);
    const progressApi = jasmine.createSpyObj('ProgressApi', ['updateItemProgress', 'downloadCourseCertificate']);
    const discussionApi = jasmine.createSpyObj('DiscussionApi', [
      'listComments',
      'createComment',
      'upvoteComment',
      'hideComment',
      'restoreComment'
    ]);
    const confirmation = jasmine.createSpyObj('ConfirmationService', ['confirm', 'confirmOrTrue']);
    confirmation.confirm.and.returnValue(of(true));
    confirmation.confirmOrTrue.and.returnValue(of(true));
    discussionApi.listComments.and.returnValue(of([]) as never);

    studyApi.getCourseStudy.and.returnValue(of({
      courseId,
      items: studyTree,
      completedItems: 1,
      totalItems: 2,
      percentComplete: 50,
      concluded: false
    }) as never);
    studyApi.getStudyItem.and.returnValue(of(item) as never);
    progressApi.updateItemProgress.and.returnValue(of({ completed: true }) as never);
    progressApi.downloadCourseCertificate.and.returnValue(of(new Blob(['%PDF'], { type: 'application/pdf' })) as never);
    coursesApi.findCourse.and.returnValue(of({
      teaching: false,
      enrolled: true,
      course: {
        id: courseId,
        title: 'Quarkus',
        summary: 'Curso completo',
        teacherName: 'Ana',
        teacherDescription: 'Instrutora backend'
      },
      items: [item]
    }) as never);

    TestBed.configureTestingModule({
      imports: [CourseViewComponent, NoopAnimationsModule],
      providers: [
        provideRouter([
          { path: 'courses/:courseId', component: CourseViewComponent },
          { path: 'courses/:courseId/lessons/:itemId', component: CourseViewComponent }
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: StudyApi, useValue: studyApi },
        { provide: ProgressApi, useValue: progressApi },
        { provide: CoursesApi, useValue: coursesApi },
        { provide: CourseItemsApi, useValue: jasmine.createSpyObj('CourseItemsApi', { createPlaybackTicket: of({ url: '/api/media/playback/1/1/1?expires=1&sig=x' }) }) },
        { provide: CourseImagesApi, useValue: jasmine.createSpyObj('CourseImagesApi', { createImageTickets: of({ tickets: [] }) }) },
        { provide: DiscussionApi, useValue: discussionApi },
        { provide: ConfirmationService, useValue: confirmation },
        { provide: AuthService, useValue: authServiceStub },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap(params) },
            paramMap: of(convertToParamMap(params))
          }
        }
      ]
    });

    fixture = TestBed.createComponent(CourseViewComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
  }

  it('shouldRenderCourseAndAuthorSummaryPanels', fakeAsync(() => {
    // Overview panels belong on course root (not while viewing an aula).
    configure({
      id: 1,
      courseId,
      title: 'Intro',
      itemType: 'MARKDOWN',
      sortOrder: 1,
      markdownBody: '# Boas-vindas'
    }, { courseRoot: true });

    const summary = fixture.nativeElement.querySelector('[data-testid="course-summary"]');
    expect(summary).not.toBeNull();
    expect(summary?.textContent).toContain('Sobre o curso');
    expect(summary?.textContent).toContain('Curso completo');
    expect(summary?.textContent).toContain('Sobre o autor');
    expect(summary?.textContent).toContain('Ana');
    expect(summary?.textContent).toContain('Instrutora backend');
  }));

  it('shouldRenderMarkdownHeadingSmallerThanAulaTitle', fakeAsync(() => {
    configure({
      id: 1,
      courseId,
      title: 'Intro',
      itemType: 'MARKDOWN',
      sortOrder: 1,
      markdownBody: '# Boas-vindas'
    });

    const aulaTitle = fixture.nativeElement.querySelector('.aula-header h2') as HTMLElement;
    const markdownHeading = fixture.nativeElement.querySelector('.markdown h1') as HTMLElement;
    expect(aulaTitle).not.toBeNull();
    expect(markdownHeading).not.toBeNull();

    const aulaFontSize = Number.parseFloat(getComputedStyle(aulaTitle).fontSize);
    const markdownFontSize = Number.parseFloat(getComputedStyle(markdownHeading).fontSize);
    expect(aulaFontSize).toBeGreaterThan(markdownFontSize);
  }));

  it('shouldRenderSafeExternalLinkResource', fakeAsync(() => {
    configure({
      id: 2,
      courseId,
      title: 'Docs',
      itemType: 'LINK' as CourseItemResponse['itemType'],
      sortOrder: 2,
      linkUrl: 'https://example.com/guide',
      linkDescription: 'Guia oficial'
    } as CourseItemResponse);

    const link = fixture.nativeElement.querySelector('[data-testid="open-link-resource"]') as HTMLAnchorElement;
    expect(link).not.toBeNull();
    expect(link.textContent?.trim()).toBe('Abrir recurso');
    expect(link.getAttribute('href')).toBe('https://example.com/guide');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(fixture.nativeElement.textContent).toContain('Guia oficial');
  }));
});
