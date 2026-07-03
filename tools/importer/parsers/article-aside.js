/* eslint-disable */
/* global WebImporter */
/**
 * Parser for article-aside. Base: plain block (single cell of rich content).
 * Source: mpg.de article pages, `aside.sidebar` — the left utility column:
 *   - Contact person (name, role, phone, email)
 *   - "Further articles" list (linked related headlines)
 *   - Quick links box (Science Magazine, Events, ...)
 *
 * Emitted as one block, one row, one cell of clean rich text (headings + lists),
 * so it authors as ordinary sidebar content. No images are carried (the source
 * "further articles" thumbnails are decorative placeholders).
 */
export default function parse(element, { document }) {
  const parts = [];

  const addHeading = (text) => {
    const h = document.createElement('h3');
    h.textContent = text;
    parts.push(h);
  };

  // --- Quick links box (graybox linklist) — sits at the TOP of the source
  // sidebar, above Contact, and carries no heading in the source. ---
  const quick = element.querySelector('.linklist, .graybox_container ul');
  if (quick) {
    const links = Array.from(quick.querySelectorAll('a[href]'))
      .filter((a) => a.textContent.trim());
    if (links.length) {
      const ul = document.createElement('ul');
      links.forEach((a) => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.setAttribute('href', a.getAttribute('href'));
        link.textContent = a.textContent.trim();
        li.appendChild(link);
        ul.appendChild(li);
      });
      parts.push(ul);
    }
  }

  // --- Contact ---
  const name = element.querySelector('.employee_name');
  if (name && name.textContent.trim()) {
    addHeading('Contact');
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = name.textContent.trim();
    p.appendChild(strong);
    const position = element.querySelector('.position');
    if (position && position.textContent.trim()) {
      p.appendChild(document.createElement('br'));
      p.appendChild(document.createTextNode(position.textContent.trim()));
    }
    parts.push(p);

    const phone = element.querySelector('.phone a');
    if (phone && phone.textContent.trim()) {
      const pp = document.createElement('p');
      const a = document.createElement('a');
      a.setAttribute('href', phone.getAttribute('href'));
      a.textContent = phone.textContent.trim();
      pp.appendChild(a);
      parts.push(pp);
    }
    const email = element.querySelector('.email a');
    if (email && email.textContent.trim()) {
      const pe = document.createElement('p');
      const a = document.createElement('a');
      a.setAttribute('href', email.getAttribute('href'));
      a.textContent = email.textContent.trim();
      pe.appendChild(a);
      parts.push(pe);
    }
  }

  // --- Further articles (linked headlines) ---
  // NOTE: headline links only — no thumbnails. The block's model has a single
  // `content` richtext field, and a richtext field stops consuming at the first
  // <img> (md2jcr greedy-richtext rule). Mixing images into this one field leaves
  // trailing nodes with no field to map to, which fails md2jcr with
  // "content isn't mapping to the model". Keeping the list text-only keeps the
  // whole aside inside one richtext field.
  const groups = element.querySelectorAll('.group-extension');
  groups.forEach((g) => {
    if (!/further articles/i.test(g.textContent)) return;
    addHeading('Further articles');
    const ul = document.createElement('ul');
    // Prefer the structured .teaser-extension entries (one headline each).
    const teasers = Array.from(g.querySelectorAll('.teaser-extension'));
    if (teasers.length) {
      teasers.forEach((t) => {
        const headlineA = t.querySelector('.text-box a[href], .meta-information a[href]')
          || t.querySelector('a[href]');
        if (!headlineA || !headlineA.textContent.trim()) return;
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.setAttribute('href', headlineA.getAttribute('href'));
        link.textContent = headlineA.textContent.trim();
        li.appendChild(link);
        ul.appendChild(li);
      });
    } else {
      // Fallback: headline links only (no structured teasers found).
      const seen = new Set();
      g.querySelectorAll('a[href]').forEach((a) => {
        const href = a.getAttribute('href');
        const text = a.textContent.trim();
        if (!text || seen.has(href)) return;
        seen.add(href);
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.setAttribute('href', href);
        link.textContent = text;
        li.appendChild(link);
        ul.appendChild(li);
      });
    }
    if (ul.children.length) parts.push(ul);
  });

  // Nothing to author — unwrap so the aside simply disappears.
  if (parts.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Single cell mapped to the model's `content` richtext field (xwalk hint).
  const cell = document.createDocumentFragment();
  cell.appendChild(document.createComment(' field:content '));
  parts.forEach((n) => cell.appendChild(n));

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'article-aside',
    cells: [[cell]],
  });
  element.replaceWith(block);
}
