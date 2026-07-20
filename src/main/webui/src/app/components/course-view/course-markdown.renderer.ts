const EMBEDDED_SCRIPT = /<script[\s\S]*?<\/script>/gi;
const EMBEDDED_HTML_TAG = /<[^>]*>/g;
const MARKDOWN_HEADING = /^(#{1,6})\s+(.+)$/;
const COURSE_ASSET_IMAGE = /!\[([^\]]*)\]\(course-asset:(\d+)\)/g;
const FENCED_CODE_BLOCK = /```[^\n]*\n?([\s\S]*?)```/g;
const INLINE_CODE = /`([^`]+)`/g;
const SAFE_LINK = /(?<!!)\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const BOLD_ASTERISKS = /\*\*([^*]+)\*\*/g;
const BOLD_UNDERSCORES = /__([^_]+)__/g;
const ITALIC_ASTERISK = /\*([^*]+)\*/g;
const ITALIC_UNDERSCORE = /(^|[^\w`])_([^_]+)_(?=[^\w]|$)/g;
const UNORDERED_LIST_ITEM = /^[-*]\s+/;
const ORDERED_LIST_ITEM = /^\d+[.)]\s+/;

const CODE_PLACEHOLDER = '\u0000';
const FENCE_PLACEHOLDER = '\u0001';

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
  const fences: string[] = [];
  const withoutFences = (markdown ?? '').replace(FENCED_CODE_BLOCK, (_match, code: string) => {
    fences.push(`<pre><code>${escapeHtml(code.replace(/\n$/, ''))}</code></pre>`);
    return `${FENCE_PLACEHOLDER}${fences.length - 1}${FENCE_PLACEHOLDER}`;
  });
  return removeEmbeddedHtml(withoutFences)
    .split(/\n{2,}/)
    .map(block => renderBlock(block, signedUrlByAssetId))
    .join('')
    .replace(new RegExp(`${FENCE_PLACEHOLDER}(\\d+)${FENCE_PLACEHOLDER}`, 'g'),
             (_match, index: string) => fences[Number(index)]);
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
  if (!content) {
    return '';
  }
  if (new RegExp(`^${FENCE_PLACEHOLDER}\\d+${FENCE_PLACEHOLDER}$`).test(content)) {
    return content;
  }

  const heading = MARKDOWN_HEADING.exec(content);
  if (heading) {
    const level = heading[1].length;
    return `<h${level}>${renderInline(heading[2], signedUrlByAssetId)}</h${level}>`;
  }

  const list = renderList(content, signedUrlByAssetId);
  if (list) {
    return list;
  }

  return `<p>${renderInline(content, signedUrlByAssetId).replace(/\n/g, '<br>')}</p>`;
}

function renderList(content: string, signedUrlByAssetId: ReadonlyMap<number, string>): string | null {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const listItems = (marker: RegExp, tag: string): string =>
    `<${tag}>${lines.map(line => `<li>${renderInline(line.replace(marker, ''), signedUrlByAssetId)}</li>`).join('')}</${tag}>`;

  if (lines.every(line => UNORDERED_LIST_ITEM.test(line))) {
    return listItems(UNORDERED_LIST_ITEM, 'ul');
  }
  if (lines.every(line => ORDERED_LIST_ITEM.test(line))) {
    return listItems(ORDERED_LIST_ITEM, 'ol');
  }
  return null;
}

function renderInline(content: string, signedUrlByAssetId: ReadonlyMap<number, string>): string {
  const parts: string[] = [];
  let lastIndex = 0;
  for (const match of content.matchAll(COURSE_ASSET_IMAGE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push(renderInlineText(content.slice(lastIndex, index)));
    }
    parts.push(renderImage(match[1], Number(match[2]), signedUrlByAssetId));
    lastIndex = index + match[0].length;
  }
  if (lastIndex < content.length) {
    parts.push(renderInlineText(content.slice(lastIndex)));
  }
  return parts.join('');
}

/** Emphasis, code, and safe links over already-escaped text (FQ23). */
function renderInlineText(raw: string): string {
  const codeSpans: string[] = [];
  let text = escapeHtml(raw).replace(INLINE_CODE, (_match, code: string) => {
    codeSpans.push(`<code>${code}</code>`);
    return `${CODE_PLACEHOLDER}${codeSpans.length - 1}${CODE_PLACEHOLDER}`;
  });
  text = text.replace(SAFE_LINK, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  text = text.replace(BOLD_ASTERISKS, '<strong>$1</strong>');
  text = text.replace(BOLD_UNDERSCORES, '<strong>$1</strong>');
  text = text.replace(ITALIC_ASTERISK, '<em>$1</em>');
  text = text.replace(ITALIC_UNDERSCORE, '$1<em>$2</em>');
  return text.replace(new RegExp(`${CODE_PLACEHOLDER}(\\d+)${CODE_PLACEHOLDER}`, 'g'),
                      (_match, index: string) => codeSpans[Number(index)]);
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
