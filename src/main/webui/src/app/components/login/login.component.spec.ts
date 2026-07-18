import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import {
  VISUAL_SHELL_ACCENT_CONTROL,
  VISUAL_SHELL_ACCENT_TEXT,
  VISUAL_SHELL_TOKENS,
} from '../../../theme/visual-shell-tokens.contract';
import { AuthService } from '../../services/auth.service';
import { LoginComponent } from './login.component';

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

/**
 * T27 — login polish: dark shell tokens, phosphor submit, a11y semantics.
 */
describe('Login visual shell polish (T27)', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    auth = jasmine.createSpyObj('AuthService', ['login']);
    auth.login.and.returnValue(of({
      token: 'jwt',
      user: {
        id: 1,
        username: 'ana',
        name: 'Ana',
        email: 'ana@cursos.dev'
      }
    }));

    await TestBed.configureTestingModule({
      imports: [LoginComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
  });

  it('shouldUseDarkMainAndSurfaceTokensWithoutNestedToolbar', () => {
    const root = fixture.nativeElement as HTMLElement;
    const page = root.querySelector('.page-auth') as HTMLElement | null;
    const card = root.querySelector('.auth-card') as HTMLElement | null;

    expect(page).withContext('login page-auth region').not.toBeNull();
    expect(card).withContext('login auth-card surface').not.toBeNull();
    if (!page || !card) {
      return;
    }

    const pageBg = getComputedStyle(page).backgroundColor;
    const cardBg = getComputedStyle(card).backgroundColor;
    const cardColor = getComputedStyle(card).color;
    const pageTransparent = isTransparentColor(pageBg);

    if (pageTransparent) {
      expect(cssColorEquals(getComputedStyle(document.body).backgroundColor, VISUAL_SHELL_TOKENS['--color-main-bg']))
        .withContext('body under login uses --color-main-bg when page-auth is transparent')
        .toBeTrue();
    } else {
      expect(cssColorEquals(pageBg, VISUAL_SHELL_TOKENS['--color-main-bg']))
        .withContext(`page-auth uses --color-main-bg (got ${pageBg})`)
        .toBeTrue();
    }

    expect(cssColorEquals(cardBg, VISUAL_SHELL_TOKENS['--color-surface']))
      .withContext(`auth-card background must be surface ${VISUAL_SHELL_TOKENS['--color-surface']} (got ${cardBg})`)
      .toBeTrue();
    expect(cssColorEquals(cardColor, VISUAL_SHELL_TOKENS['--color-text']))
      .withContext(`auth-card text must be primary ${VISUAL_SHELL_TOKENS['--color-text']} (got ${cardColor})`)
      .toBeTrue();

    expect(root.querySelector('mat-toolbar'))
      .withContext('login must not nest mat-toolbar under the shell header')
      .toBeNull();
  });

  it('shouldSubmitWithPhosphorAccentFillAndBlackText', () => {
    const submit = fixture.nativeElement.querySelector(
      'button[type="submit"], .form-actions button'
    ) as HTMLButtonElement | null;

    expect(submit).withContext('Entrar submit control').not.toBeNull();
    if (!submit) {
      return;
    }

    expect(submit.classList.contains(VISUAL_SHELL_ACCENT_CONTROL))
      .withContext(`submit uses ${VISUAL_SHELL_ACCENT_CONTROL}`)
      .toBeTrue();

    const style = getComputedStyle(submit);
    expect(cssColorEquals(style.backgroundColor, VISUAL_SHELL_TOKENS['--color-accent']))
      .withContext(`submit fill uses accent ${VISUAL_SHELL_TOKENS['--color-accent']} (got ${style.backgroundColor})`)
      .toBeTrue();
    expect(cssColorEquals(style.color, VISUAL_SHELL_ACCENT_TEXT))
      .withContext(`submit text is light ${VISUAL_SHELL_ACCENT_TEXT} for contrast (got ${style.color})`)
      .toBeTrue();
  });

  it('shouldExposeFormLabelsErrorLiveRegionAndEmailAutofocus', fakeAsync(() => {
    const root = fixture.nativeElement as HTMLElement;

    const emailInput = root.querySelector(
      'input[name="email"], input[autocomplete="email"]'
    ) as HTMLInputElement | null;
    const passwordInput = root.querySelector(
      'input[name="password"], input[autocomplete="current-password"]'
    ) as HTMLInputElement | null;

    expect(emailInput).withContext('email field').not.toBeNull();
    expect(passwordInput).withContext('password field').not.toBeNull();
    if (!emailInput || !passwordInput) {
      return;
    }

    const emailLabel = associatedLabelText(emailInput, root);
    const passwordLabel = associatedLabelText(passwordInput, root);
    expect(emailLabel).withContext('email has accessible label').toMatch(/e-?mail/i);
    expect(passwordLabel).withContext('password has accessible label').toMatch(/senha/i);

    expect(emailInput.hasAttribute('autofocus') || emailInput === document.activeElement)
      .withContext('email receives autofocus / initial focus')
      .toBeTrue();

    const toggle = root.querySelector(
      'button[aria-label*="senha" i], button[matSuffix]'
    ) as HTMLButtonElement | null;
    expect(toggle).withContext('password visibility toggle').not.toBeNull();
    expect(toggle?.getAttribute('aria-label') ?? '')
      .withContext('toggle announces show/hide password')
      .toMatch(/mostrar|ocultar|esconder|senha/i);

    auth.login.and.returnValue(throwError(() => ({ status: 401 })));
    fixture.componentInstance.email = 'bad@cursos.dev';
    fixture.componentInstance.password = 'wrong';
    fixture.componentInstance.login();
    tick();
    fixture.detectChanges();

    const error = root.querySelector('.error, [role="alert"]') as HTMLElement | null;
    expect(error).withContext('error message after failed login').not.toBeNull();
    if (!error) {
      return;
    }

    expect(error.getAttribute('role')).withContext('error role=alert').toBe('alert');
    expect(error.getAttribute('aria-live') ?? 'assertive')
      .withContext('error is announced via aria-live')
      .toMatch(/assertive|polite/);
    expect((error.textContent ?? '').trim().length)
      .withContext('error has visible text')
      .toBeGreaterThan(0);
  }));
});

function associatedLabelText(input: HTMLInputElement, root: HTMLElement): string {
  const byId = input.id
    ? (root.querySelector(`label[for="${input.id}"]`) as HTMLLabelElement | null)?.textContent
    : null;
  if (byId) {
    return byId.replace(/\s+/g, ' ').trim();
  }

  const aria = input.getAttribute('aria-label');
  if (aria) {
    return aria;
  }

  const labelledBy = input.getAttribute('aria-labelledby');
  if (labelledBy) {
    return labelledBy
      .split(/\s+/)
      .map(id => root.querySelector(`#${CSS.escape(id)}`)?.textContent ?? '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const matLabel = input.closest('mat-form-field')?.querySelector('mat-label, .mdc-floating-label');
  if (matLabel) {
    return (matLabel.textContent ?? '').replace(/\s+/g, ' ').trim();
  }

  const wrapping = input.closest('label');
  return (wrapping?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function isTransparentColor(color: string): boolean {
  const normalized = normalizeCssColor(color);
  return !normalized
    || normalized === 'transparent'
    || normalized === 'rgba(0,0,0,0)'
    || normalized === 'rgba(0,0,0,0.0)';
}
