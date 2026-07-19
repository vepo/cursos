const EMBEDDED_SCRIPT = /<script[\s\S]*?<\/script>/gi;
const EMBEDDED_HTML_TAG = /<[^>]*>/g;
const MARKDOWN_HEADING = /^(#{1,6})\s+(.+)$/;
const COURSE_ASSET_IMAGE = /!\[([^\]]*)\]\(course-asset:(\d+)\)/g;

export function extractCourseAssetIds(markdown: string | undefined): number[] {
  if (!markdown) {
    return [];
  }
  const ids = new Set<number>();
  for (const match of markdown.matchAll(COURSE_ASSET_IMAGE)) {
    ids.add(Number(match[2]));
  }
  return [...ids];
}

export function renderCourseMarkdown(
  markdown: string | undefined,
  signedUrlByAssetId: ReadonlyMap<number, string> = new Map()
): string {
  return removeEmbeddedHtml(markdown ?? '')
    .split(/\n{2,}/)
    .map(block => renderBlock(block, signedUrlByAssetId))
    .join('');
}

function removeEmbeddedHtml(markdown: string): string {
  return markdown.replace(EMBEDDED_SCRIPT, '').replace(EMBEDDED_HTML_TAG, '');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderBlock(block: string, signedUrlByAssetId: ReadonlyMap<number, string>): string {
  const content = block.trim();
  const heading = MARKDOWN_HEADING.exec(content);
  if (!heading) {
    return `<p>${renderInline(content, signedUrlByAssetId).replace(/\n/g, '<br>')}</p>`;
  }

  const level = heading[1].length;
  return `<h${level}>${renderInline(heading[2], signedUrlByAssetId)}</h${level}>`;
}

function renderInline(content: string, signedUrlByAssetId: ReadonlyMap<number, string>): string {
  const parts: string[] = [];
  let lastIndex = 0;
  for (const match of content.matchAll(COURSE_ASSET_IMAGE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push(escapeHtml(content.slice(lastIndex, index)));
    }
    parts.push(renderImage(match[1], Number(match[2]), signedUrlByAssetId));
    lastIndex = index + match[0].length;
  }
  if (lastIndex < content.length) {
    parts.push(escapeHtml(content.slice(lastIndex)));
  }
  return parts.join('');
}

function renderImage(
  rawAlt: string,
  assetId: number,
  signedUrlByAssetId: ReadonlyMap<number, string>
): string {
  const alt = escapeHtml(rawAlt.replace(/[\r\n]+/g, ' ').trim());
  const src = signedUrlByAssetId.get(assetId);
  if (!src) {
    return `<span class="course-asset-missing" data-asset-id="${assetId}" role="img" aria-label="${alt || 'Imagem indisponível'}">Imagem indisponível</span>`;
  }
  return `<img class="course-asset-image" data-asset-id="${assetId}" src="${escapeHtml(src)}" alt="${alt}" loading="lazy" />`;
}
