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
});
