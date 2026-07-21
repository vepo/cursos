import { COURSE_MERMAID_CLASS } from './course-markdown';

type MermaidApi = {
  initialize: (config: Record<string, unknown>) => void;
  run: (options: { nodes: HTMLElement[] }) => Promise<void>;
};

/**
 * Learn study/preview content is a light surface (`--color-main-bg`).
 * Mermaid `dark` draws lightgrey relationship lines that vanish on that background.
 */
export const COURSE_MERMAID_INIT: Record<string, unknown> = {
  startOnLoad: false,
  theme: 'base',
  securityLevel: 'strict',
  themeVariables: {
    darkMode: false,
    background: '#F8FAFC',
    primaryColor: '#FFFFFF',
    primaryTextColor: '#0F172A',
    primaryBorderColor: '#0D9488',
    secondaryColor: '#E2E8F0',
    tertiaryColor: '#F8FAFC',
    lineColor: '#0F172A',
    textColor: '#0F172A',
    mainBkg: '#FFFFFF',
    nodeBorder: '#0F172A',
    clusterBkg: '#F8FAFC',
    titleColor: '#0F172A',
    edgeLabelBackground: '#FFFFFF',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    fontSize: '14px'
  },
  themeCSS: `
    .relationshipLine { stroke: #0F172A !important; stroke-width: 1.75px !important; fill: none !important; }
    .marker { stroke: #0F172A !important; fill: none !important; }
    .marker path { stroke: #0F172A !important; fill: none !important; }
    .marker circle { fill: #FFFFFF !important; stroke: #0F172A !important; }
    .entityBox, .node rect.basic, .node .label-container { fill: #FFFFFF !important; stroke: #0F172A !important; stroke-width: 1.5px !important; }
    .edgeLabel, .edgeLabel p, .labelBkg, .relationshipLabelBox {
      color: #0F172A !important;
      background-color: #FFFFFF !important;
      opacity: 1 !important;
    }
    .edgeLabel .label text { fill: #0F172A !important; }
    .nodeLabel, .nodeLabel p, .markdown-node-label, .markdown-node-label p { color: #0F172A !important; }
  `
};

let mermaidPromise: Promise<MermaidApi> | null = null;
let mermaidInitialized = false;

async function loadMermaid(): Promise<MermaidApi> {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then(mod => (mod.default ?? mod) as MermaidApi);
  }
  const mermaid = await mermaidPromise;
  if (!mermaidInitialized) {
    mermaid.initialize(COURSE_MERMAID_INIT);
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
