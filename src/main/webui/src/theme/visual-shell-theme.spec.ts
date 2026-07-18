import {
  VISUAL_SHELL_ACCENT_CONTROL,
  VISUAL_SHELL_ACCENT_TEXT,
  VISUAL_SHELL_LAYOUT,
  VISUAL_SHELL_TOKENS,
} from './visual-shell-tokens.contract';

/**
 * T21 / TC1 — global visual theme contract.
 * Asserts :root CSS custom properties and shared shell classes against the TS token contract
 * (avoids brittle string-matching of compiled SCSS).
 */
describe('Visual shell theme contract (T21)', () => {
  const fixtures: HTMLElement[] = [];

  afterEach(() => {
    while (fixtures.length) {
      fixtures.pop()?.remove();
    }
  });

  it('shouldExposeApprovedPaletteTokensOnRoot', () => {
    const rootStyle = getComputedStyle(document.documentElement);

    (Object.keys(VISUAL_SHELL_TOKENS) as Array<keyof typeof VISUAL_SHELL_TOKENS>).forEach(token => {
      const expected = VISUAL_SHELL_TOKENS[token];
      const actual = rootStyle.getPropertyValue(token).trim();
      expect(actual)
        .withContext(`:root ${token} must match approved palette`)
        .toBe(expected);
    });
  });

  it('shouldApplyDarkMainAndTextTokensOnBody', () => {
    const bodyStyle = getComputedStyle(document.body);

    expect(cssColorEquals(bodyStyle.backgroundColor, VISUAL_SHELL_TOKENS['--color-main-bg']))
      .withContext('body background uses --color-main-bg')
      .toBeTrue();
    expect(cssColorEquals(bodyStyle.color, VISUAL_SHELL_TOKENS['--color-text']))
      .withContext('body text uses --color-text')
      .toBeTrue();
  });

  it('shouldLayoutShellPageSidebarAndMainWithTokensAndTwoColumnGrid', () => {
    const page = document.createElement('div');
    page.className = VISUAL_SHELL_LAYOUT.page;

    const sidebar = document.createElement('aside');
    sidebar.className = VISUAL_SHELL_LAYOUT.sidebar;

    const main = document.createElement('main');
    main.className = VISUAL_SHELL_LAYOUT.main;

    page.append(sidebar, main);
    document.body.appendChild(page);
    fixtures.push(page);

    const pageStyle = getComputedStyle(page);
    const sidebarStyle = getComputedStyle(sidebar);
    const mainStyle = getComputedStyle(main);

    expect(pageStyle.display).withContext('.app-shell-page is CSS grid').toBe('grid');
    expect(columnTrackCount(pageStyle.gridTemplateColumns))
      .withContext('.app-shell-page is two-column')
      .toBe(2);

    expect(cssColorEquals(sidebarStyle.backgroundColor, VISUAL_SHELL_TOKENS['--color-sidebar']))
      .withContext('.app-shell-sidebar uses --color-sidebar')
      .toBeTrue();
    expect(cssColorEquals(mainStyle.backgroundColor, VISUAL_SHELL_TOKENS['--color-main-bg']))
      .withContext('.app-shell-main uses --color-main-bg')
      .toBeTrue();
  });

  it('shouldUseBlackTextAndVisibleFocusOnAccentFilledControls', () => {
    const control = document.createElement('button');
    control.type = 'button';
    control.className = VISUAL_SHELL_ACCENT_CONTROL;
    control.textContent = 'Ação';
    document.body.appendChild(control);
    fixtures.push(control);

    const idle = getComputedStyle(control);
    expect(cssColorEquals(idle.backgroundColor, VISUAL_SHELL_TOKENS['--color-accent']))
      .withContext('.btn-primary fill uses --color-accent')
      .toBeTrue();
    expect(cssColorEquals(idle.color, VISUAL_SHELL_ACCENT_TEXT))
      .withContext('.btn-primary text is light for contrast')
      .toBeTrue();

    control.focus();
    const focused = getComputedStyle(control);
    expect(hasVisibleFocusState(focused))
      .withContext('.btn-primary exposes a visible focus state')
      .toBeTrue();
  });
});

/**
 * T27 — global focus-visible, reduced-motion, and basic contrast token contract.
 */
describe('Visual shell a11y and contrast (T27)', () => {
  const fixtures: HTMLElement[] = [];

  afterEach(() => {
    while (fixtures.length) {
      fixtures.pop()?.remove();
    }
  });

  it('shouldDeclareGlobalFocusVisibleStylesForLinksAndButtons', () => {
    expect(stylesheetHasFocusVisibleRule('a'))
      .withContext('global styles declare focus-visible (or focus) for links')
      .toBeTrue();
    expect(stylesheetHasFocusVisibleRule('button'))
      .withContext('global styles declare focus-visible (or focus) for buttons')
      .toBeTrue();

    const link = document.createElement('a');
    link.href = '#t27-focus';
    link.textContent = 'Link';
    document.body.appendChild(link);
    fixtures.push(link);

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Botão';
    document.body.appendChild(button);
    fixtures.push(button);

    link.focus();
    expect(hasVisibleFocusState(getComputedStyle(link)))
      .withContext('focused link exposes a visible focus ring')
      .toBeTrue();

    button.focus();
    expect(hasVisibleFocusState(getComputedStyle(button)))
      .withContext('focused button exposes a visible focus ring')
      .toBeTrue();
  });

  it('shouldRespectReducedMotionPreferenceForMenuAndSidebarTransitions', () => {
    expect(stylesheetHasReducedMotionRule())
      .withContext('@media (prefers-reduced-motion: reduce) must zero menu/sidebar transitions')
      .toBeTrue();

    const drawer = document.createElement('nav');
    drawer.className = 'nav-menu-drawer open';
    drawer.setAttribute('data-testid', 'nav-menu-drawer');
    document.body.appendChild(drawer);
    fixtures.push(drawer);

    const sidebar = document.createElement('aside');
    sidebar.className = VISUAL_SHELL_LAYOUT.sidebar;
    document.body.appendChild(sidebar);
    fixtures.push(sidebar);

    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches) {
      expect(transitionIsDisabled(getComputedStyle(drawer)))
        .withContext('menu drawer transitions disabled under reduced motion')
        .toBeTrue();
      expect(transitionIsDisabled(getComputedStyle(sidebar)))
        .withContext('sidebar transitions disabled under reduced motion')
        .toBeTrue();
    } else {
      expect(stylesheetHasReducedMotionRule())
        .withContext('reduced-motion CSS contract present even when OS preference is off')
        .toBeTrue();
    }
  });

  it('shouldMeetBasicContrastContractForPrimaryTextAndAccentControls', () => {
    const header = document.createElement('header');
    header.className = 'main-header';
    header.setAttribute('data-testid', 'visual-shell-header');
    header.textContent = 'Header';
    document.body.appendChild(header);
    fixtures.push(header);

    const main = document.createElement('main');
    main.className = VISUAL_SHELL_LAYOUT.main;
    main.textContent = 'Main';
    document.body.appendChild(main);
    fixtures.push(main);

    const accent = document.createElement('button');
    accent.type = 'button';
    accent.className = VISUAL_SHELL_ACCENT_CONTROL;
    accent.textContent = 'Ação';
    document.body.appendChild(accent);
    fixtures.push(accent);

    const headerStyle = getComputedStyle(header);
    const mainStyle = getComputedStyle(main);
    const accentStyle = getComputedStyle(accent);

    expect(cssColorEquals(headerStyle.color, VISUAL_SHELL_TOKENS['--color-text'])
      || cssColorEquals(headerStyle.color, VISUAL_SHELL_TOKENS['--color-text-muted']))
      .withContext('header primary text uses --color-text (or muted)')
      .toBeTrue();
    expect(cssColorEquals(headerStyle.backgroundColor, VISUAL_SHELL_TOKENS['--color-header']))
      .withContext('header background uses --color-header for contrast pair')
      .toBeTrue();

    expect(cssColorEquals(mainStyle.color, VISUAL_SHELL_TOKENS['--color-text']))
      .withContext('main primary text uses --color-text')
      .toBeTrue();
    expect(cssColorEquals(mainStyle.backgroundColor, VISUAL_SHELL_TOKENS['--color-main-bg']))
      .withContext('main background uses --color-main-bg for contrast pair')
      .toBeTrue();

    expect(cssColorEquals(accentStyle.backgroundColor, VISUAL_SHELL_TOKENS['--color-accent']))
      .withContext('accent control fill uses --color-accent')
      .toBeTrue();
    expect(cssColorEquals(accentStyle.color, VISUAL_SHELL_ACCENT_TEXT))
      .withContext('accent control text is black for contrast on verde fósforo')
      .toBeTrue();
  });
});

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

function columnTrackCount(gridTemplateColumns: string): number {
  const value = gridTemplateColumns.trim();
  if (!value || value === 'none') {
    return 0;
  }
  return value.split(/\s+/).filter(Boolean).length;
}

function hasVisibleFocusState(style: CSSStyleDeclaration): boolean {
  const outlineWidth = Number.parseFloat(style.outlineWidth || '0');
  const outlineStyle = (style.outlineStyle || 'none').toLowerCase();
  const hasOutline = outlineWidth > 0 && outlineStyle !== 'none';
  const hasRing = !!style.boxShadow && style.boxShadow !== 'none';
  const hasOutlineOffset = Number.parseFloat(style.outlineOffset || '0') !== 0 && hasOutline;
  return hasOutline || hasRing || hasOutlineOffset;
}

function stylesheetHasFocusVisibleRule(element: 'a' | 'button'): boolean {
  return walkStyleRules(rule => {
    if (!(rule instanceof CSSStyleRule)) {
      return false;
    }
    const selector = (rule.selectorText ?? '').toLowerCase();
    if (!selectorTargetsElementFocus(selector, element)) {
      return false;
    }
    const outline = rule.style.outline
      || rule.style.outlineWidth
      || rule.style.boxShadow
      || rule.style.getPropertyValue('outline')
      || rule.style.getPropertyValue('box-shadow');
    return !!outline && !/^none$/i.test(outline.trim()) && outline.trim() !== '0';
  });
}

function selectorTargetsElementFocus(selector: string, element: 'a' | 'button'): boolean {
  return selector.split(',').some(part => {
    const subject = part.trim();
    const focuses = /:(focus-visible|focus)\b/.test(subject);
    if (!focuses) {
      return false;
    }
    const pattern = new RegExp(`(^|[\\s>+~])${element}(:|\\.|#|\\[|$)`);
    return pattern.test(subject) || subject.startsWith(`${element}:`);
  });
}

function stylesheetHasReducedMotionRule(): boolean {
  return walkStyleRules(rule => {
    if (!(rule instanceof CSSMediaRule)) {
      return false;
    }
    const media = rule.conditionText || rule.media?.mediaText || '';
    if (!/prefers-reduced-motion\s*:\s*reduce/i.test(media)) {
      return false;
    }
    return Array.from(rule.cssRules).some(inner => {
      if (!(inner instanceof CSSStyleRule)) {
        return false;
      }
      const selector = (inner.selectorText ?? '').toLowerCase();
      const targetsShell = selector.includes('nav-menu')
        || selector.includes('app-shell-sidebar')
        || selector.includes('sidebar')
        || selector === '*'
        || selector.includes('html')
        || selector.includes('body');
      if (!targetsShell) {
        return false;
      }
      const duration = inner.style.transitionDuration || inner.style.getPropertyValue('transition');
      return /0(s|ms)?/i.test(duration) || /none/i.test(duration);
    });
  });
}

function walkStyleRules(predicate: (rule: CSSRule) => boolean): boolean {
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList | undefined;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    if (!rules) {
      continue;
    }
    if (walkRuleList(rules, predicate)) {
      return true;
    }
  }
  return false;
}

function walkRuleList(rules: CSSRuleList, predicate: (rule: CSSRule) => boolean): boolean {
  for (const rule of Array.from(rules)) {
    if (predicate(rule)) {
      return true;
    }
    if (rule instanceof CSSGroupingRule) {
      try {
        if (walkRuleList(rule.cssRules, predicate)) {
          return true;
        }
      } catch {
        // ignore
      }
    }
  }
  return false;
}

function transitionIsDisabled(style: CSSStyleDeclaration): boolean {
  const duration = style.transitionDuration || '';
  const property = style.transitionProperty || '';
  if (/^none$/i.test(property.trim())) {
    return true;
  }
  const parts = duration.split(',').map(part => part.trim().toLowerCase());
  return parts.length > 0 && parts.every(part => part === '0s' || part === '0ms' || part === '0');
}
