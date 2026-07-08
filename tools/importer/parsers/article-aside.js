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
 * so it authors as ordinary sidebar content.
 *
 * ⚠️ NO IMAGES may be carried. The model has a SINGLE `content` richtext field
 * mapped to the one body cell. In md2jcr's grid-table processing a richtext
 * field is greedy but STOPS at the first image; the `content` field is then
 * consumed, leaving the image node with no remaining column to map to — which
 * throws "The content isn't mapping to the model correctly…". Verified by
 * reproducing md2jcr@1.2.11 against this exact model: any <img> in the cell
 * fails, link/text-only content maps cleanly. So the "further articles"
 * thumbnails are dropped and each teaser is emitted as a plain linked headline.
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

  // --- Further articles (linked headlines only) ---
  // The block has a single `content` richtext field mapped to the one body cell.
  // Images CANNOT appear here (see docblock): md2jcr's greedy richtext stops at
  // the first image and then has no column left for it. Emit each teaser as a
  // plain linked headline in a <ul> — no thumbnails.
  const groups = element.querySelectorAll('.group-extension');
  groups.forEach((g) => {
    if (!/further articles/i.test(g.textContent)) return;

    const ul = document.createElement('ul');
    const seen = new Set();
    const teasers = Array.from(g.querySelectorAll('.teaser-extension'));
    const sources = teasers.length ? teasers : [g];

    sources.forEach((t) => {
      const headlineA = t.querySelector('.text-box a[href], .meta-information a[href]')
        || t.querySelector('a[href]');
      // When falling back to the whole group, iterate all anchors instead.
      const anchors = teasers.length
        ? (headlineA ? [headlineA] : [])
        : Array.from(t.querySelectorAll('a[href]'));
      anchors.forEach((a) => {
        const href = a.getAttribute('href');
        const label = a.textContent.trim();
        if (!label || seen.has(href)) return;
        seen.add(href);
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.setAttribute('href', href);
        link.textContent = label;
        li.appendChild(link);
        ul.appendChild(li);
      });
    });

    if (ul.children.length) {
      addHeading('Further articles');
      parts.push(ul);
    }
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
