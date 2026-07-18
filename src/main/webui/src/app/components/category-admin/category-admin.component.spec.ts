import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { CategoriesApi } from '../../generated/api/categories.service';
import {
  VISUAL_SHELL_LAYOUT,
  VISUAL_SHELL_TOKENS,
} from '../../../theme/visual-shell-tokens.contract';
import { CategoryAdminComponent } from './category-admin.component';

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

describe('CategoryAdminComponent nested shell chrome (T26)', () => {
  let fixture: ComponentFixture<CategoryAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryAdminComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        {
          provide: CategoriesApi,
          useValue: jasmine.createSpyObj('CategoriesApi', {
            listCategories: of([{ id: 1, name: 'Backend', slug: 'backend' }]),
            createCategory: of({ id: 2, name: 'Frontend', slug: 'frontend' })
          })
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryAdminComponent);
    fixture.detectChanges();
  });

  function shellMain(): HTMLElement | null {
    return fixture.nativeElement.querySelector(
      '[data-testid="shell-main"], main.app-shell-main, .app-shell-main'
    );
  }

  it('shouldOmitNestedPrimaryMatToolbarOnCategoryAdmin', () => {
    expect(fixture.nativeElement.querySelector('mat-toolbar[color="primary"]'))
      .withContext('Category admin must not nest mat-toolbar[color=primary] under the shell header')
      .toBeNull();
    expect(fixture.nativeElement.querySelector('mat-toolbar'))
      .withContext('Category admin must not nest any mat-toolbar under the shell header')
      .toBeNull();
  });

  it('shouldUseShellMainPageTitleAndPageActionsOnCategoryAdmin', () => {
    const main = shellMain();
    expect(main).withContext('Category admin content lives in shell-main / app-shell-main').not.toBeNull();
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
    expect(text).toMatch(/Categorias/i);
    expect(text).toContain('Backend');
    expect(text).toMatch(/Criar categoria/i);
  });

  it('shouldPaintCategoryAdminMainWithShellTokenBackground', () => {
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
