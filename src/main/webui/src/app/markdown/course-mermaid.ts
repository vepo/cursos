import { COURSE_MERMAID_CLASS } from './course-markdown';

type MermaidApi = {
  initialize: (config: Record<string, unknown>) => void;
  run: (options: { nodes: HTMLElement[] }) => Promise<void>;
};

let mermaidPromise: Promise<MermaidApi> | null = null;
let mermaidInitialized = false;

async function loadMermaid(): Promise<MermaidApi> {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then(mod => (mod.default ?? mod) as MermaidApi);
  }
  const mermaid = await mermaidPromise;
  if (!mermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'strict'
    });
    mermaidInitialized = true;
  }
  return mermaid;
}

/** Pending Mermaid placeholders that still need SVG hydration. */
export function pendingMermaidNodes(root: ParentNode): HTMLElement[] {
  return [...root.querySelectorAll(`pre.${COURSE_MERMAID_CLASS}`)].filter(
    (el): el is HTMLElement =>
      el instanceof HTMLElement
      && !el.querySelector('svg')
      && !el.classList.contains('course-mermaid-error')
  );
}

/**
 * Hydrate ```mermaid placeholders inside root after sanitized HTML is bound.
 * Safe to call repeatedly — skips already-rendered or errored nodes.
 */
export async function hydrateCourseMermaid(root: ParentNode): Promise<void> {
  const nodes = pendingMermaidNodes(root);
  if (!nodes.length) {
    return;
  }

  let mermaid: MermaidApi;
  try {
    mermaid = await loadMermaid();
  } catch {
    for (const node of nodes) {
      markMermaidError(node, node.textContent ?? '', 'Não foi possível carregar o motor de diagramas.');
    }
    return;
  }

  for (const node of nodes) {
    const source = node.textContent ?? '';
    try {
      await mermaid.run({ nodes: [node] });
      if (isMermaidFailure(node)) {
        markMermaidError(node, source, 'Diagrama Mermaid inválido.');
      }
    } catch {
      markMermaidError(node, source, 'Diagrama Mermaid inválido.');
    }
  }
}

function isMermaidFailure(node: HTMLElement): boolean {
  if (!node.querySelector('svg')) {
    return true;
  }
  return !!node.querySelector('.error-icon, .error-text, [aria-roledescription="error"]');
}

function markMermaidError(node: HTMLElement, source: string, message: string): void {
  node.classList.add('course-mermaid-error');
  node.setAttribute('role', 'alert');
  node.replaceChildren();
  const msg = document.createElement('p');
  msg.className = 'course-mermaid-error-msg';
  msg.textContent = message;
  const code = document.createElement('code');
  code.textContent = source;
  node.append(msg, code);
}

/** Test helper — reset lazy loader state between specs. */
export function resetCourseMermaidForTests(): void {
  mermaidPromise = null;
  mermaidInitialized = false;
}
