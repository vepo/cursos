import {
  extractCourseAssetIds,
  renderCourseMarkdown
} from './course-markdown';

describe('course-markdown', () => {
  it('shouldExtractOnlyCourseAssetImageIds', () => {
    const markdown = 'Hello ![One](course-asset:12) and ![Two](https://evil.example/x.png) ![Again](course-asset:12)';
    expect(extractCourseAssetIds(markdown)).toEqual([12]);
  });

  it('shouldReturnEmptyAssetIdsForUndefinedMarkdown', () => {
    expect(extractCourseAssetIds(undefined)).toEqual([]);
  });

  it('shouldRenderSignedCourseAssetImagesAndKeepExternalMarkdownAsText', () => {
    const html = renderCourseMarkdown(
      'Intro\n\n![Diagrama](course-asset:7)\n\n![External](https://evil.example/x.png)',
      new Map([[7, '/api/media/images/1/7?expires=1&sig=abc']])
    );
    expect(html).toContain('src="/api/media/images/1/7?expires=1&amp;sig=abc"');
    expect(html).toContain('alt="Diagrama"');
    expect(html).not.toContain('<img src="https://evil.example/x.png"');
    expect(html.match(/<img/g)?.length ?? 0).toBe(1);
  });

  it('shouldShowMissingPlaceholderWhenTicketAbsent', () => {
    const html = renderCourseMarkdown('![Alt](course-asset:99)');
    expect(html).toContain('course-asset-missing');
    expect(html).toContain('Imagem indisponível');
    expect(html).not.toContain('<img');
  });

  it('shouldSanitizeAltTextAndStripEmbeddedHtml', () => {
    const html = renderCourseMarkdown('![ok <b>x</b>](course-asset:3)', new Map([[3, '/img']]));
    expect(html).not.toContain('<b>');
    expect(html).toContain('alt="ok x"');
  });

  it('shouldRenderBoldItalicAndInlineCode', () => {
    const html = renderCourseMarkdown(
      'Primeira **aula** do curso com __destaque__, *ênfase*, _leve_ e `codigo()`.'
    );
    expect(html).toContain('<strong>aula</strong>');
    expect(html).toContain('<strong>destaque</strong>');
    expect(html).toContain('<em>ênfase</em>');
    expect(html).toContain('<em>leve</em>');
    expect(html).toContain('<code>codigo()</code>');
    expect(html).not.toContain('**');
  });

  it('shouldRenderEmphasisInsideHeadings', () => {
    const html = renderCourseMarkdown('# Bem-vindo ao **Quarkus**');
    expect(html).toContain('<h1>');
    expect(html).toContain('<strong>Quarkus</strong>');
    expect(html).toContain('</h1>');
  });

  it('shouldNotFormatInsideInlineCode', () => {
    const html = renderCourseMarkdown('Use `**args` com cuidado **sempre**.');
    expect(html).toContain('<code>**args</code>');
    expect(html).toContain('<strong>sempre</strong>');
  });

  it('shouldRenderSafeHttpLinksInNewTab', () => {
    const html = renderCourseMarkdown('Veja o [guia oficial](https://quarkus.io/guides/) antes.');
    expect(html).toContain('href="https://quarkus.io/guides/"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('guia oficial');
  });

  it('shouldNotLinkUnsafeSchemes', () => {
    const html = renderCourseMarkdown('Cuidado com [isto](javascript:alert(1)).');
    expect(html).not.toMatch(/href\s*=\s*["']javascript:/i);
    expect(html).not.toContain('javascript:alert');
  });

  it('shouldRenderUnorderedAndOrderedLists', () => {
    const html = renderCourseMarkdown('- Java\n- Quarkus\n\n1. Clonar\n2. Rodar **local**');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>Java</li>');
    expect(html).toContain('<li>Quarkus</li>');
    expect(html).toContain('</ul>');
    expect(html).toContain('<ol>');
    expect(html).toContain('<li>Clonar</li>');
    expect(html).toContain('<strong>local</strong>');
    expect(html).toContain('</ol>');
  });

  it('shouldRenderFencedCodeBlocksWithoutInlineFormatting', () => {
    const html = renderCourseMarkdown('Exemplo:\n\n```java\nvar x = a < b && c > d; // **not bold**\n```\n\nFim.');
    expect(html).toContain('<pre><code');
    expect(html).toMatch(/a (&lt;|&amp;lt;) b/);
    expect(html).toContain('**not bold**');
    expect(html).not.toContain('<strong>not bold</strong>');
    expect(html).toContain('<p>Fim.</p>');
  });

  it('shouldEmitCourseMermaidPlaceholderForMermaidFences', () => {
    const html = renderCourseMarkdown(
      'Diagrama:\n\n```mermaid\nerDiagram\n    departments ||--o{ employees : "possui"\n```\n'
    );
    expect(html).toContain('class="course-mermaid"');
    expect(html).toContain('erDiagram');
    expect(html).toContain('departments');
    expect(html).not.toMatch(/<pre><code[^>]*>[\s\S]*erDiagram/);
  });

  it('shouldKeepNonMermaidFencesAsNormalCodeBlocks', () => {
    const html = renderCourseMarkdown('```ts\nconst x = 1;\n```');
    expect(html).toContain('<pre><code');
    expect(html).not.toContain('course-mermaid');
  });

  it('shouldKeepCourseAssetImagesWorkingAlongsideInlineFormatting', () => {
    const html = renderCourseMarkdown(
      'Veja **o diagrama** ![Diagrama](course-asset:7) no texto.',
      new Map([[7, '/img/7']])
    );
    expect(html).toContain('<strong>o diagrama</strong>');
    expect(html).toContain('<img');
    expect(html).toContain('course-asset-image');
  });

  it('shouldRenderGfmTableAndStrikethrough', () => {
    const html = renderCourseMarkdown(
      'Use ~~deprecated~~ API.\n\n| Coluna | Valor |\n| --- | --- |\n| A | 1 |'
    );
    expect(html).toMatch(/<(del|s)>deprecated<\/(del|s)>/);
    expect(html).toContain('<table>');
    expect(html).toContain('<th>');
    expect(html).toContain('Coluna');
    expect(html).toContain('<td>');
  });

  it('shouldStripScriptTagsAndOnerrorHandlers', () => {
    const html = renderCourseMarkdown(
      'Olá <script>window.__xss = true</script><img src=x onerror="window.__xss=true">'
    );
    expect(html).not.toContain('<script');
    expect(html).not.toMatch(/onerror\s*=/i);
    expect(html).not.toContain('window.__xss');
  });

  it('shouldNotExecuteRawHtmlInMarkdownInput', () => {
    const html = renderCourseMarkdown(
      'Texto <iframe src="https://evil.example"></iframe> e <div onclick="alert(1)">clique</div>.'
    );
    expect(html).not.toContain('<iframe');
    expect(html).not.toContain('<div');
    expect(html).not.toMatch(/onclick\s*=/i);
  });

  it('shouldRenderEmptyStringForUndefinedMarkdown', () => {
    expect(renderCourseMarkdown(undefined)).toBe('');
  });
});
