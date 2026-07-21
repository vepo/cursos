import { renderCourseMarkdown } from './course-markdown';
import {
  COURSE_MERMAID_INIT,
  hydrateCourseMermaid,
  pendingMermaidNodes,
  resetCourseMermaidForTests
} from './course-mermaid';

describe('course-mermaid', () => {
  const fixtures: HTMLElement[] = [];

  afterEach(() => {
    resetCourseMermaidForTests();
    for (const el of fixtures.splice(0)) {
      el.remove();
    }
  });

  function mount(html: string): HTMLElement {
    const root = document.createElement('div');
    root.innerHTML = html;
    document.body.appendChild(root);
    fixtures.push(root);
    return root;
  }

  it('shouldFindPendingMermaidPlaceholders', () => {
    const root = document.createElement('div');
    root.innerHTML = renderCourseMarkdown('```mermaid\nerDiagram\n  A ||--o{ B : r\n```');
    expect(pendingMermaidNodes(root).length).toBe(1);
  });

  it('shouldHydrateErDiagramToSvg', async () => {
    const root = mount(
      renderCourseMarkdown(
        '```mermaid\nerDiagram\n    departments ||--o{ employees : "possui"\n```'
      )
    );

    await hydrateCourseMermaid(root);

    expect(root.querySelector('svg')).not.toBeNull();
    expect(pendingMermaidNodes(root).length).toBe(0);
  });

  it('shouldUseHighContrastInitForLightShell', () => {
    expect(COURSE_MERMAID_INIT.theme).toBe('base');
    expect(COURSE_MERMAID_INIT.themeVariables.lineColor).toBe('#0F172A');
    expect(COURSE_MERMAID_INIT.themeVariables.edgeLabelBackground).toBe('#FFFFFF');
    expect(COURSE_MERMAID_INIT.themeVariables.darkMode).toBe(false);
    expect(COURSE_MERMAID_INIT.themeCSS).toContain('.relationshipLine');
  });

  it('shouldShowErrorAndKeepSourceForInvalidDiagram', async () => {
    const root = mount(
      renderCourseMarkdown('```mermaid\nthis is not valid mermaid {{{{\n```')
    );

    await hydrateCourseMermaid(root);

    const errored = root.querySelector('pre.course-mermaid-error');
    expect(errored).not.toBeNull();
    expect(errored?.textContent).toContain('Diagrama Mermaid inválido');
    expect(errored?.textContent).toContain('this is not valid mermaid');
  });

  it('shouldBeIdempotentWhenCalledTwice', async () => {
    const root = mount(renderCourseMarkdown('```mermaid\nflowchart LR\n  A-->B\n```'));

    await hydrateCourseMermaid(root);
    const svgCount = root.querySelectorAll('svg').length;
    await hydrateCourseMermaid(root);

    expect(root.querySelectorAll('svg').length).toBe(svgCount);
    expect(pendingMermaidNodes(root).length).toBe(0);
  });
});
