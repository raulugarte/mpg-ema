/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-news. Base: cards. Source: https://www.mpg.de/en
 * Reused for News / International / Career bands.
 * xwalk container block. Filter cards-news -> card items.
 *   card model (blocks/cards-news/_cards-news.json): image (reference) + text (richtext).
 * Table: 2 columns. Row 1 = block name. Each subsequent row = one article card:
 *   cell 1: image -> <!-- field:image --> (linked cover image)
 *   cell 2: text  -> <!-- field:text --> (linked h3 title + date + tags + excerpt)
 * The section heading (.linked_title h2, e.g. "News"/"International"/"Career") and the
 * trailing "Further News" view-all link (href /en/newsroom) are NOT cards — they are
 * section-level DEFAULT content. They are emitted as siblings around the block table
 * (heading before, CTA after) so they render with the block.
 * Gotcha avoided: image lives in cell 1, richtext text lives in cell 2, so the
 * richtext field never has to consume content following an <img>.
 */
export default function parse(element, { document }) {
  const teasers = Array.from(element.querySelectorAll('.teaser'));

  // Empty-block guard
  if (teasers.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Section heading (.linked_title h2, e.g. "News") — default content BEFORE the block.
  const sectionTitleEl = element.querySelector('.linked_title h2, .linked_title h1, .linked_title h3');
  let sectionHeading = null;
  if (sectionTitleEl && sectionTitleEl.textContent.trim()) {
    sectionHeading = document.createElement('h2');
    sectionHeading.textContent = sectionTitleEl.textContent.trim();
  }

  // Trailing "Further News" view-all CTA — default content AFTER the block.
  const ctaLink = element.querySelector('.text-center a.btn, .text-center a[href]');
  let ctaPara = null;
  if (ctaLink && ctaLink.getAttribute('href')) {
    const a = document.createElement('a');
    a.setAttribute('href', ctaLink.getAttribute('href'));
    a.textContent = ctaLink.textContent.trim();
    ctaPara = document.createElement('p');
    ctaPara.appendChild(a);
  }

  const cells = [];
  teasers.forEach((teaser) => {
    // Cover image (inside .img-box, wrapped in an anchor)
    const image = teaser.querySelector('.img-box img, picture img, img');

    const textBox = teaser.querySelector('.text-box') || teaser;
    const title = textBox.querySelector('h3, h2, h4');
    const date = textBox.querySelector('.date, .data .attribute, .data');
    const tags = textBox.querySelector('.tags');
    const description = textBox.querySelector('.description');

    // Image cell
    const imageCell = document.createDocumentFragment();
    if (image) {
      imageCell.appendChild(document.createComment(' field:image '));
      imageCell.appendChild(image);
    }

    // Text cell: title + date + tags + description (richtext)
    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));
    if (title) textCell.appendChild(title);
    if (date) {
      const p = document.createElement('p');
      p.textContent = date.textContent.trim();
      textCell.appendChild(p);
    }
    if (tags) textCell.appendChild(tags);
    if (description) {
      const p = document.createElement('p');
      p.textContent = description.textContent.trim();
      textCell.appendChild(p);
    }

    cells.push([imageCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-news', cells });

  // Emit section heading (before) and view-all CTA (after) as default content
  // surrounding the block table.
  const out = [];
  if (sectionHeading) out.push(sectionHeading);
  out.push(block);
  if (ctaPara) out.push(ctaPara);
  element.replaceWith(...out);
}
