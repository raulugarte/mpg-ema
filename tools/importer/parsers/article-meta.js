/* eslint-disable */
/* global WebImporter */
/**
 * Parser for article-meta. Base: article-meta (custom block, not in library catalog).
 * Source: mpg.de article pages, `div.meta-information` — the byline strip under the
 * article title:
 *   <div class="meta-information">
 *     <div class="data"><span class="date">June 17, 2026</span></div>
 *     <div class="tags"><a href="/newsroom/Awards/en"><span>Awards</span></a> ...</div>
 *   </div>
 *
 * xwalk simple block. Model (blocks/article-meta/_article-meta.json) fields, in order:
 *   1. date  — component:text     -> row 1, <!-- field:date --> (plain date string)
 *   2. tags  — component:richtext -> row 2, <!-- field:tags --> (category tag anchors)
 * Simple block => 1 column, one row per model field, field hint BEFORE content.
 * md2jcr greedy-richtext rule: a text field consumes a single node, a richtext field
 * greedily consumes the rest — so `date` (text) MUST come before `tags` (richtext),
 * matching the model field order. Every model field gets a cell even if empty.
 */
export default function parse(element, { document }) {
  // --- date (text) ---
  const dateEl = element.querySelector('.data .date, .date, .data');
  const dateText = dateEl ? dateEl.textContent.trim() : '';

  // --- tags (richtext): rebuild the category anchors as clean <a> links.
  // Source wraps label text in a <span>; flatten to anchor text so the richtext
  // field stores plain <a href>label</a> markup. Keep them in one <p>.
  const tagAnchors = Array.from(element.querySelectorAll('.tags a[href]'))
    .filter((a) => a.textContent.trim());
  let tagsPara = null;
  if (tagAnchors.length) {
    tagsPara = document.createElement('p');
    tagAnchors.forEach((a, i) => {
      const link = document.createElement('a');
      link.setAttribute('href', a.getAttribute('href'));
      link.textContent = a.textContent.trim();
      if (i > 0) tagsPara.appendChild(document.createTextNode(' '));
      tagsPara.appendChild(link);
    });
  }

  // Empty-block guard: nothing meaningful to author.
  if (!dateText && !tagsPara) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Row 1: date (text field). Hint before content.
  const dateCell = document.createDocumentFragment();
  dateCell.appendChild(document.createComment(' field:date '));
  if (dateText) dateCell.appendChild(document.createTextNode(dateText));

  // Row 2: tags (richtext field). Hint before content; empty if no tags.
  const tagsCell = document.createDocumentFragment();
  tagsCell.appendChild(document.createComment(' field:tags '));
  if (tagsPara) tagsCell.appendChild(tagsPara);

  const cells = [[dateCell], [tagsCell]];

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'article-meta',
    cells,
  });
  element.replaceWith(block);
}
