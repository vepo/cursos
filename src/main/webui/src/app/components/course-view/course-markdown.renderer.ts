const EMBEDDED_SCRIPT = /<script[\s\S]*?<\/script>/gi;
const EMBEDDED_HTML_TAG = /<[^>]*>/g;
const MARKDOWN_HEADING = /^(#{1,6})\s+(.+)$/;

export function renderCourseMarkdown(markdown: string | undefined): string {
  return escapeHtml(removeEmbeddedHtml(markdown ?? ''))
    .split(/\n{2,}/)
    .map(renderBlock)
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

function renderBlock(block: string): string {
  const content = block.trim();
  const heading = MARKDOWN_HEADING.exec(content);
  if (!heading) {
    return `<p>${content.replace(/\n/g, '<br>')}</p>`;
  }

  const level = heading[1].length;
  return `<h${level}>${heading[2]}</h${level}>`;
}
