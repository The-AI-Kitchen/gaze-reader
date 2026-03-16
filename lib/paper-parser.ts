export interface Chunk {
  id: string;
  type: 'heading' | 'paragraph' | 'reference' | 'caption' | 'list-item';
  text: string;
  html: string;
}

export interface ParsedPaper {
  title: string;
  abstract: string;
  chunks: Chunk[];
}

export function parsePaper(html: string): ParsedPaper {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Extract title
  const titleEl =
    doc.querySelector('.ltx_title') ||
    doc.querySelector('h1') ||
    doc.querySelector('title');
  const title = titleEl?.textContent?.trim() || 'Untitled Paper';

  // Extract abstract
  let abstract = '';
  const abstractSection =
    doc.querySelector('.ltx_abstract') ||
    doc.querySelector('[id*="abstract" i]');
  if (abstractSection) {
    const abstractP = abstractSection.querySelector('p');
    abstract = abstractP?.textContent?.trim() || abstractSection.textContent?.trim() || '';
  }

  const chunks: Chunk[] = [];
  let chunkIndex = 0;

  // Walk through the article content
  const article = doc.querySelector('article') || doc.body;
  const elements = article.querySelectorAll(
    'h1, h2, h3, h4, h5, h6, p, li, figcaption, .ltx_caption'
  );

  // Track if we've seen the title/abstract to skip duplicates
  const titleNorm = title.toLowerCase().replace(/\s+/g, ' ');
  let skippedTitle = false;

  elements.forEach((el) => {
    const tagName = el.tagName.toLowerCase();
    let type: Chunk['type'];

    if (/^h[1-6]$/.test(tagName)) {
      type = 'heading';
    } else if (tagName === 'li') {
      type = 'list-item';
    } else if (
      tagName === 'figcaption' ||
      el.classList.contains('ltx_caption')
    ) {
      type = 'caption';
    } else {
      type = 'paragraph';
    }

    const text = el.textContent?.trim() || '';
    if (!text || text.length < 3) return;

    // Skip the paper title (h1) since we display it separately
    if (!skippedTitle && tagName === 'h1') {
      const textNorm = text.toLowerCase().replace(/\s+/g, ' ');
      if (textNorm.includes(titleNorm) || titleNorm.includes(textNorm)) {
        skippedTitle = true;
        return;
      }
    }

    // Skip elements inside the abstract section (already displayed in header)
    if (el.closest('.ltx_abstract')) return;

    // Skip "Abstract." headings
    if (type === 'heading' && /^abstract\.?$/i.test(text)) return;

    const id = `chunk-${chunkIndex++}`;
    chunks.push({
      id,
      type,
      text,
      html: el.innerHTML,
    });
  });

  return { title, abstract, chunks };
}

/**
 * Wraps parsed chunks back into HTML with data-chunk-id attributes
 * and inline reference detection.
 */
export function chunksToHtml(chunks: Chunk[]): string {
  return chunks
    .map((chunk) => {
      const tag =
        chunk.type === 'heading'
          ? 'h2'
          : chunk.type === 'list-item'
          ? 'li'
          : chunk.type === 'caption'
          ? 'figcaption'
          : 'p';

      // Wrap inline references like [1], [2, 3], [Author et al., 2023]
      let inner = chunk.html;
      inner = inner.replace(
        /(\[(?:\d+(?:\s*,\s*\d+)*|[A-Z][a-zA-Z]*(?:\s+et\s+al\.?)?,?\s*\d{4})\])/g,
        `<span class="inline-ref" data-chunk-type="reference">$1</span>`
      );

      return `<${tag} data-chunk-id="${chunk.id}" data-chunk-type="${chunk.type}" class="paper-chunk">${inner}</${tag}>`;
    })
    .join('\n');
}
