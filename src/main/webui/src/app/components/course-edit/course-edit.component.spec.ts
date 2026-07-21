import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { CategoriesApi } from '../../generated/api/categories.service';
import { CourseImagesApi } from '../../generated/api/courseImages.service';
import { AulaBlocksApi } from '../../generated/api/aulaBlocks.service';
import { CourseItemsApi } from '../../generated/api/courseItems.service';
import { CoursesApi } from '../../generated/api/courses.service';
import { GitApi } from '../../generated/api/git.service';
import { ConfirmationService } from '../../services/confirmation.service';
import {
  VISUAL_SHELL_LAYOUT,
  VISUAL_SHELL_TOKENS,
} from '../../../theme/visual-shell-tokens.contract';
import { CourseEditComponent } from './course-edit.component';

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

describe('CourseEditComponent nested shell chrome (T26)', () => {
  let fixture: ComponentFixture<CourseEditComponent>;

  beforeEach(async () => {
    const coursesApi = jasmine.createSpyObj('CoursesApi', [
      'findCourse', 'createCourse', 'updateCourse', 'publishCourse', 'unpublishCourse'
    ]);
    coursesApi.findCourse.and.returnValue(of({
      teaching: true,
      enrolled: false,
      course: {
        id: 10,
        title: 'Quarkus na prática',
        summary: 'Backend',
        status: 'DRAFT',
        categories: []
      },
      items: [
        {
          id: 1,
          title: 'Intro',
          sortOrder: 0,
          blocks: [
            { id: 10, courseItemId: 1, blockType: 'MARKDOWN', sortOrder: 0, markdownBody: '# Hi' }
          ]
        }
      ]
    }));

    const categoriesApi = jasmine.createSpyObj('CategoriesApi', {
      listCategories: of([{ id: 1, name: 'Backend', slug: 'backend' }])
    });
    const courseItemsApi = jasmine.createSpyObj('CourseItemsApi', [
      'createMarkdownItem', 'updateMarkdownItem', 'createLinkItem', 'updateLinkItem', 'updateCourseItemTitle',
      'uploadMediaItem', 'deleteCourseItem', 'reorderCourseItems'
    ]);
    const aulaBlocksApi = jasmine.createSpyObj('AulaBlocksApi', [
      'appendMarkdownBlock', 'appendLinkBlock', 'appendMediaBlock',
      'updateMarkdownBlock', 'updateLinkBlock', 'deleteAulaBlock', 'reorderAulaBlocks'
    ]);

    const courseImagesApi = jasmine.createSpyObj('CourseImagesApi', {
      listCourseImages: of([]),
      uploadCourseImage: of({ id: 1, signedUrl: '/api/media/images/1/1' }),
      setCourseCover: of({ id: 10, coverImageAssetId: 1, coverImageUrl: '/api/media/images/10/1' }),
      clearCourseCover: of({ id: 10, coverImageAssetId: null }),
      deleteCourseImage: of(null)
    });
    const gitApi = jasmine.createSpyObj('GitApi', {
      getCourseGitStatus: of({ status: 'IDLE', remoteUrl: '', defaultBranch: 'main' }),
      linkCourseGit: of({ status: 'IDLE' }),
      syncCourseGit: of({ status: 'IDLE' })
    });
    const confirmation = jasmine.createSpyObj('ConfirmationService', ['confirm', 'confirmOrTrue']);
    confirmation.confirm.and.returnValue(of(false));
    confirmation.confirmOrTrue.and.callFake((needs: boolean) => of(!needs));

    await TestBed.configureTestingModule({
      imports: [CourseEditComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CoursesApi, useValue: coursesApi },
        { provide: CategoriesApi, useValue: categoriesApi },
        { provide: CourseItemsApi, useValue: courseItemsApi },
        { provide: AulaBlocksApi, useValue: aulaBlocksApi },
        { provide: CourseImagesApi, useValue: courseImagesApi },
        { provide: GitApi, useValue: gitApi },
        { provide: ConfirmationService, useValue: confirmation },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ id: '10' }) }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CourseEditComponent);
    fixture.detectChanges();
  });

  function shellMain(): HTMLElement | null {
    return fixture.nativeElement.querySelector(
      '[data-testid="shell-main"], main.app-shell-main, .app-shell-main'
    );
  }

  it('shouldOmitNestedPrimaryMatToolbarOnCourseEdit', () => {
    expect(fixture.nativeElement.querySelector('mat-toolbar[color="primary"]'))
      .withContext('Course edit must not nest mat-toolbar[color=primary] under the shell header')
      .toBeNull();
    expect(fixture.nativeElement.querySelector('mat-toolbar'))
      .withContext('Course edit must not nest any mat-toolbar under the shell header')
      .toBeNull();
  });

  it('shouldUseShellMainPageTitleAndPageActionsOnCourseEdit', () => {
    const main = shellMain();
    expect(main).withContext('Course edit content lives in shell-main / app-shell-main').not.toBeNull();
    expect(main?.classList.contains(VISUAL_SHELL_LAYOUT.main))
      .withContext('Main uses app-shell-main')
      .toBeTrue();

    const title = fixture.nativeElement.querySelector('.page-title, [data-testid="page-title"]');
    const actions = fixture.nativeElement.querySelector('.page-actions, [data-testid="page-actions"]');

    expect(title).withContext('Page title chrome (.page-title) replaces nested toolbar').not.toBeNull();
    expect(actions).withContext('Page actions chrome (.page-actions) lives in main').not.toBeNull();
    expect(main?.contains(title!)).withContext('page-title is inside shell-main').toBeTrue();
    expect(main?.contains(actions!)).withContext('page-actions is inside shell-main').toBeTrue();

    const text = (fixture.nativeElement.textContent ?? '').replace(/\s+/g, ' ');
    expect(text).toMatch(/Editar curso|Novo curso/i);
    expect(text).toMatch(/Salvar/i);
  });

  it('shouldPaintCourseEditMainWithShellTokenBackground', () => {
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

  it('shouldExposeLeftItemPanelAndPublishControls', () => {
    expect(fixture.nativeElement.querySelector('[data-testid="shell-sidebar"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="nav-details"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="nav-item-1"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="publish-course"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="course-status"]')?.textContent)
      .toMatch(/Rascunho/i);
  });

  it('shouldPaintNovaAulaQuietButtonWithOnChromeOnInkSidebar', () => {
    const sidebar = fixture.nativeElement.querySelector(
      '[data-testid="shell-sidebar"]'
    ) as HTMLElement | null;
    const novaAula = fixture.nativeElement.querySelector(
      '[data-testid="new-item"]'
    ) as HTMLElement | null;
    expect(sidebar).withContext('course edit sidebar').not.toBeNull();
    expect(novaAula).withContext('+ Nova aula control').not.toBeNull();
    if (!sidebar || !novaAula) {
      return;
    }

    expect(sidebar.classList.contains(VISUAL_SHELL_LAYOUT.sidebar)).toBeTrue();
    expect(novaAula.classList.contains('btn-quiet')).toBeTrue();

    const sidebarBg = getComputedStyle(sidebar).backgroundColor;
    expect(cssColorEquals(sidebarBg, VISUAL_SHELL_TOKENS['--color-sidebar']))
      .withContext(`sidebar background must be ink (--color-sidebar), got ${sidebarBg}`)
      .toBeTrue();

    const novaColor = getComputedStyle(novaAula).color;
    expect(cssColorEquals(novaColor, VISUAL_SHELL_TOKENS['--color-on-chrome']))
      .withContext(
        `+ Nova aula must use --color-on-chrome on ink sidebar (got ${novaColor})`
      )
      .toBeTrue();
  });

  it('shouldPaintUnselectedEditorNavItemWithOnChromeOnInkSidebar', () => {
    const sidebar = fixture.nativeElement.querySelector(
      '[data-testid="shell-sidebar"]'
    ) as HTMLElement | null;
    const navItem = fixture.nativeElement.querySelector(
      '[data-testid="nav-item-1"]'
    ) as HTMLElement | null;
    expect(sidebar).withContext('course edit sidebar').not.toBeNull();
    expect(navItem).withContext('aula nav item').not.toBeNull();
    if (!sidebar || !navItem) {
      return;
    }

    expect(navItem.classList.contains('is-selected'))
      .withContext('default selection is details — aula nav must be unselected')
      .toBeFalse();

    const itemColor = getComputedStyle(navItem).color;
    expect(cssColorEquals(itemColor, VISUAL_SHELL_TOKENS['--color-on-chrome']))
      .withContext(
        `unselected editor nav item must use --color-on-chrome on ink sidebar (got ${itemColor})`
      )
      .toBeTrue();

    const icon = navItem.querySelector('mat-icon.aula-type-icon') as HTMLElement | null;
    expect(icon).withContext('aula type icon in sidebar nav').not.toBeNull();
    if (icon) {
      const iconColor = getComputedStyle(icon).color;
      expect(cssColorEquals(iconColor, VISUAL_SHELL_TOKENS['--color-text-muted']))
        .withContext(`sidebar aula icon must not use page --color-text-muted (got ${iconColor})`)
        .toBeFalse();
      expect(cssColorEquals(iconColor, VISUAL_SHELL_TOKENS['--color-text']))
        .withContext(`sidebar aula icon must not use page --color-text (got ${iconColor})`)
        .toBeFalse();
    }
  });

  it('shouldWarnWhenLeavingDirtyEditor', () => {
    const component = fixture.componentInstance;
    const confirmation = TestBed.inject(ConfirmationService) as jasmine.SpyObj<ConfirmationService>;
    component.title = 'Changed';
    component.markDirty();
    confirmation.confirm.and.returnValue(of(false));
    const result = component.canDeactivate();
    expect(result).toBeInstanceOf(Object);
    (result as import('rxjs').Observable<boolean>).subscribe(ok => expect(ok).toBeFalse());
    expect(confirmation.confirm).toHaveBeenCalled();
  });

  it('shouldExposeItemTypeSelectorForNewItems', () => {
    fixture.componentInstance.selectNewItem();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="item-type"]')).not.toBeNull();
  });

  it('shouldShowLiveMarkdownPreviewUpdatingWithItemBody', () => {
    const component = fixture.componentInstance;
    component.selectItem({
      id: 1,
      title: 'Intro',
      sortOrder: 0,
      blocks: [
        { id: 10, courseItemId: 1, blockType: 'MARKDOWN', sortOrder: 0, markdownBody: '# Hi' }
      ]
    });
    fixture.detectChanges();

    const preview = fixture.nativeElement.querySelector('[data-testid="markdown-preview"]');
    expect(preview).not.toBeNull();
    expect(preview.querySelector('.markdown[appcoursemermaid], .markdown')).not.toBeNull();
    expect(preview).withContext('Markdown editor shows live preview').not.toBeNull();
    expect(preview?.querySelector('.markdown')?.innerHTML ?? '').toContain('<h1>');

    component.itemBody = 'Texto com **negrito**.';
    fixture.detectChanges();
    expect(preview?.querySelector('.markdown')?.innerHTML ?? '').toContain('<strong>negrito</strong>');
  });

  it('shouldTrackDirtyStateForLinkFields', () => {
    const component = fixture.componentInstance;
    component.selectNewItem();
    component.itemType = 'LINK';
    component.linkUrl = 'https://example.com';
    component.markDirty();
    expect(component.dirty).toBeTrue();
  });
});

describe('CourseEditComponent new course full-width shell', () => {
  let fixture: ComponentFixture<CourseEditComponent>;

  beforeEach(async () => {
    const coursesApi = jasmine.createSpyObj('CoursesApi', [
      'findCourse', 'createCourse', 'updateCourse', 'publishCourse', 'unpublishCourse'
    ]);
    coursesApi.createCourse.and.returnValue(of({ id: 99, title: 'Novo', status: 'DRAFT' }));

    const categoriesApi = jasmine.createSpyObj('CategoriesApi', {
      listCategories: of([{ id: 1, name: 'Backend', slug: 'backend' }])
    });
    const courseItemsApi = jasmine.createSpyObj('CourseItemsApi', [
      'createMarkdownItem', 'updateMarkdownItem', 'createLinkItem', 'updateLinkItem', 'updateCourseItemTitle',
      'uploadMediaItem', 'deleteCourseItem', 'reorderCourseItems'
    ]);
    const aulaBlocksApi = jasmine.createSpyObj('AulaBlocksApi', [
      'appendMarkdownBlock', 'appendLinkBlock', 'appendMediaBlock',
      'updateMarkdownBlock', 'updateLinkBlock', 'deleteAulaBlock', 'reorderAulaBlocks'
    ]);

    const courseImagesApi = jasmine.createSpyObj('CourseImagesApi', {
      listCourseImages: of([]),
      uploadCourseImage: of({ id: 1, signedUrl: '/api/media/images/1/1' }),
      setCourseCover: of({ id: 10, coverImageAssetId: 1, coverImageUrl: '/api/media/images/10/1' }),
      clearCourseCover: of({ id: 10, coverImageAssetId: null }),
      deleteCourseImage: of(null)
    });
    const gitApi = jasmine.createSpyObj('GitApi', {
      getCourseGitStatus: of({ status: 'IDLE', remoteUrl: '', defaultBranch: 'main' }),
      linkCourseGit: of({ status: 'IDLE' }),
      syncCourseGit: of({ status: 'IDLE' })
    });
    const confirmation = jasmine.createSpyObj('ConfirmationService', ['confirm', 'confirmOrTrue']);
    confirmation.confirm.and.returnValue(of(false));
    confirmation.confirmOrTrue.and.callFake((needs: boolean) => of(!needs));

    await TestBed.configureTestingModule({
      imports: [CourseEditComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CoursesApi, useValue: coursesApi },
        { provide: CategoriesApi, useValue: categoriesApi },
        { provide: CourseItemsApi, useValue: courseItemsApi },
        { provide: AulaBlocksApi, useValue: aulaBlocksApi },
        { provide: CourseImagesApi, useValue: courseImagesApi },
        { provide: GitApi, useValue: gitApi },
        { provide: ConfirmationService, useValue: confirmation },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({}) }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CourseEditComponent);
    fixture.detectChanges();
  });

  it('shouldOmitSidebarAndUseFullWidthGridOnNewCourse', () => {
    const shell = fixture.nativeElement.querySelector('[data-testid="course-edit-shell"]') as HTMLElement | null;
    expect(shell).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="shell-sidebar"]'))
      .withContext('New course has no left item panel')
      .toBeNull();
    expect(fixture.componentInstance.isNew).toBeTrue();

    const columns = getComputedStyle(shell!).gridTemplateColumns;
    const trackCount = columns.trim() === 'none' ? 0 : columns.split(' ').filter(Boolean).length;
    expect(trackCount)
      .withContext(`New course shell must be one-column full width (got: ${columns})`)
      .toBe(1);
  });
});


describe('CourseEditComponent composite aula blocks (T7)', () => {
  let fixture: ComponentFixture<CourseEditComponent>;
  let aulaBlocksApi: jasmine.SpyObj<AulaBlocksApi>;

  beforeEach(async () => {
    const coursesApi = jasmine.createSpyObj('CoursesApi', [
      'findCourse', 'createCourse', 'updateCourse', 'publishCourse', 'unpublishCourse'
    ]);
    coursesApi.findCourse.and.returnValue(of({
      teaching: true,
      enrolled: false,
      course: {
        id: 10,
        title: 'Quarkus na prática',
        summary: 'Backend',
        status: 'DRAFT',
        categories: []
      },
      items: [
        {
          id: 1,
          title: 'Intro',
          sortOrder: 0,
          blocks: [
            { id: 10, courseItemId: 1, blockType: 'MARKDOWN', sortOrder: 0, markdownBody: '# Hi' },
            { id: 11, courseItemId: 1, blockType: 'LINK', sortOrder: 1, linkUrl: 'https://example.com', linkDescription: 'Docs' }
          ]
        }
      ]
    }));

    const categoriesApi = jasmine.createSpyObj('CategoriesApi', {
      listCategories: of([{ id: 1, name: 'Backend', slug: 'backend' }])
    });
    const courseItemsApi = jasmine.createSpyObj('CourseItemsApi', [
      'createMarkdownItem', 'updateMarkdownItem', 'createLinkItem', 'updateLinkItem', 'updateCourseItemTitle',
      'uploadMediaItem', 'deleteCourseItem', 'reorderCourseItems'
    ]);
    aulaBlocksApi = jasmine.createSpyObj('AulaBlocksApi', [
      'appendMarkdownBlock', 'appendLinkBlock', 'appendMediaBlock',
      'updateMarkdownBlock', 'updateLinkBlock', 'deleteAulaBlock', 'reorderAulaBlocks'
    ]);
    aulaBlocksApi.appendMarkdownBlock.and.returnValue(of({
      id: 12, courseItemId: 1, blockType: 'MARKDOWN', sortOrder: 2, markdownBody: ''
    }) as never);
    aulaBlocksApi.reorderAulaBlocks.and.returnValue(of([]) as never);
    aulaBlocksApi.deleteAulaBlock.and.returnValue(of(null) as never);
    const courseImagesApi = jasmine.createSpyObj('CourseImagesApi', {
      listCourseImages: of([]),
      uploadCourseImage: of({ id: 1, signedUrl: '/api/media/images/1/1' }),
      setCourseCover: of({ id: 10, coverImageAssetId: 1, coverImageUrl: '/api/media/images/10/1' }),
      clearCourseCover: of({ id: 10, coverImageAssetId: null }),
      deleteCourseImage: of(null)
    });
    const gitApi = jasmine.createSpyObj('GitApi', {
      getCourseGitStatus: of({ status: 'IDLE', remoteUrl: '', defaultBranch: 'main' }),
      linkCourseGit: of({ status: 'IDLE' }),
      syncCourseGit: of({ status: 'IDLE' })
    });
    const confirmation = jasmine.createSpyObj('ConfirmationService', ['confirm', 'confirmOrTrue']);
    confirmation.confirm.and.returnValue(of(true));
    confirmation.confirmOrTrue.and.callFake((needs: boolean) => of(!needs));

    await TestBed.configureTestingModule({
      imports: [CourseEditComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CoursesApi, useValue: coursesApi },
        { provide: CategoriesApi, useValue: categoriesApi },
        { provide: CourseItemsApi, useValue: courseItemsApi },
        { provide: AulaBlocksApi, useValue: aulaBlocksApi },
        { provide: CourseImagesApi, useValue: courseImagesApi },
        { provide: GitApi, useValue: gitApi },
        { provide: ConfirmationService, useValue: confirmation },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ id: '10' }) }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CourseEditComponent);
    fixture.detectChanges();
  });

  it('shouldListOrderedBlocksForSelectedAula', () => {
    const component = fixture.componentInstance;
    component.selectItem(component.items[0]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="block-list"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="block-row-10"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="block-row-11"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="append-block"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="markdown-preview"]')).not.toBeNull();
  });

  it('shouldUseFirstBlockTypeIconInAulaSidebar', () => {
    const icon = fixture.nativeElement.querySelector('[data-testid="nav-item-1"] mat-icon');
    expect(icon).not.toBeNull();
    expect(icon?.getAttribute('data-mat-icon-name') || icon?.getAttribute('fontIcon')).toBe('article');
  });
});

