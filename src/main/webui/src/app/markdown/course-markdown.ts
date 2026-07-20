import DOMPurify, { type Config } from 'dompurify';
import { Marked, type Tokens } from 'marked';

const COURSE_ASSET_IMAGE = /!\[([^\]]*)\]\(course-asset:(\d+)\)/g;
const COURSE_ASSET_HREF = /^course-asset:(\d+)$/;

const PURIFY_CONFIG: Config = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr', 'blockquote',
    'ul', 'ol', 'li',
    'strong', 'em', 'del', 's',
    'code', 'pre',
    'a', 'img', 'span',
    'table', 'thead', 'tbody', 'tr', 'th', 'td'
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'target', 'rel',
    'class', 'data-asset-id', 'role', 'aria-label', 'loading'
  ],
  ALLOW_DATA_ATTR: false,
  RETURN_TRUSTED_TYPE: false
};

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
  if (!markdown) {
    return '';
  }

  const parser = new Marked({
    gfm: true,
    breaks: false,
    async: false,
    renderer: {
      image({ href, text }: Tokens.Image): string {
        return renderCourseImage(href ?? '', text ?? '', signedUrlByAssetId);
      },
      link(token: Tokens.Link): string {
        const content = this.parser.parseInline(token.tokens ?? []);
        const href = token.href ?? '';
        if (!/^https?:\/\//i.test(href)) {
          return content || escapeHtml(`[${token.text}](${href})`);
        }
        const title = token.title ? ` title="${escapeAttr(token.title)}"` : '';
        return `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer"${title}>${content}</a>`;
      }
    }
  });

  const html = parser.parse(markdown) as string;
  return String(DOMPurify.sanitize(html, PURIFY_CONFIG));
}

function renderCourseImage(
  href: string,
  rawAlt: string,
  signedUrlByAssetId: ReadonlyMap<number, string>
): string {
  const assetMatch = COURSE_ASSET_HREF.exec(href);
  const alt = sanitizeAlt(rawAlt);

  if (assetMatch) {
    const assetId = Number(assetMatch[1]);
    const src = signedUrlByAssetId.get(assetId);
    if (!src) {
      return `<span class="course-asset-missing" data-asset-id="${assetId}" role="img" aria-label="${alt || 'Imagem indisponível'}">Imagem indisponível</span>`;
    }
    return `<img class="course-asset-image" data-asset-id="${assetId}" src="${escapeAttr(src)}" alt="${alt}" loading="lazy" />`;
  }

  return escapeHtml(`![${stripTags(rawAlt)}](${href})`);
}

function sanitizeAlt(raw: string): string {
  return escapeAttr(stripTags(raw).replace(/[\r\n]+/g, ' ').trim());
}

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, '');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(value: string): string {
  return escapeHtml(value);
}
