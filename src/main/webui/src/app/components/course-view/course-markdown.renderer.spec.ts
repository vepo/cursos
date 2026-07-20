import {
  extractCourseAssetIds,
  renderCourseMarkdown
} from './course-markdown.renderer';

describe('course-markdown.renderer', () => {
  it('shouldExtractOnlyCourseAssetImageIds', () => {
    const markdown = 'Hello ![One](course-asset:12) and ![Two](https://evil.example/x.png) ![Again](course-asset:12)';
    expect(extractCourseAssetIds(markdown)).toEqual([12]);
  });

  it('shouldRenderSignedCourseAssetImagesAndKeepExternalMarkdownAsText', () => {
    const html = renderCourseMarkdown(
      'Intro\n\n![Diagrama](course-asset:7)\n\n![External](https://evil.example/x.png)',
      new Map([[7, '/api/media/images/1/7?expires=1&sig=abc']])
    );
    expect(html).toContain('src="/api/media/images/1/7?expires=1&amp;sig=abc"');
    expect(html).toContain('alt="Diagrama"');
    expect(html).toContain('![External](https://evil.example/x.png)');
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
    expect(html).toContain('<h1>Bem-vindo ao <strong>Quarkus</strong></h1>');
  });

  it('shouldNotFormatInsideInlineCode', () => {
    const html = renderCourseMarkdown('Use `**args` com cuidado **sempre**.');
    expect(html).toContain('<code>**args</code>');
    expect(html).toContain('<strong>sempre</strong>');
  });

  it('shouldRenderSafeHttpLinksInNewTab', () => {
    const html = renderCourseMarkdown('Veja o [guia oficial](https://quarkus.io/guides/) antes.');
    expect(html).toContain('<a href="https://quarkus.io/guides/" target="_blank" rel="noopener noreferrer">guia oficial</a>');
  });

  it('shouldNotLinkUnsafeSchemes', () => {
    const html = renderCourseMarkdown('Cuidado com [isto](javascript:alert(1)).');
    expect(html).not.toContain('<a ');
    expect(html).toContain('[isto](javascript:alert(1))');
  });

  it('shouldRenderUnorderedAndOrderedLists', () => {
    const html = renderCourseMarkdown('- Java\n- Quarkus\n\n1. Clonar\n2. Rodar **local**');
    expect(html).toContain('<ul><li>Java</li><li>Quarkus</li></ul>');
    expect(html).toContain('<ol><li>Clonar</li><li>Rodar <strong>local</strong></li></ol>');
  });

  it('shouldRenderFencedCodeBlocksWithoutInlineFormatting', () => {
    const html = renderCourseMarkdown('Exemplo:\n\n```java\nvar x = a < b && c > d; // **not bold**\n```\n\nFim.');
    expect(html).toContain('<pre><code>');
    expect(html).toContain('a &lt; b &amp;&amp; c &gt; d; // **not bold**');
    expect(html).not.toContain('<strong>not bold</strong>');
    expect(html).toContain('<p>Fim.</p>');
  });

  it('shouldKeepCourseAssetImagesWorkingAlongsideInlineFormatting', () => {
    const html = renderCourseMarkdown(
      'Veja **o diagrama** ![Diagrama](course-asset:7) no texto.',
      new Map([[7, '/img/7']])
    );
    expect(html).toContain('<strong>o diagrama</strong>');
    expect(html).toContain('<img class="course-asset-image"');
  });
});
