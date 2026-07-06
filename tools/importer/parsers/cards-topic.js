/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-topic. Base: cards. Source: https://www.mpg.de/en (brand-colored band).
 * xwalk container block. Filter cards-topic -> card items.
 *   card model (blocks/cards-topic/_cards-topic.json): image (reference) + text (richtext).
 * Table: 2 columns. Row 1 = block name. Each subsequent row = one topic card:
 *   cell 1: image -> <!-- field:image --> (linked topic image)
 *   cell 2: text  -> <!-- field:text --> (linked h3 title + optional description)
 * Section heading (.linked_title h2 "Topic Specials") and the trailing
 * "Further Topic Specials" view-all button (href /13872581/keyword-collection) are
 * section-level DEFAULT content — emitted as siblings around the block table
 * (heading before, CTA after) so they render with the block.
 * Gotcha avoided: image isolated in cell 1; richtext text in cell 2 (no <img> to consume past).
 */
export default function parse(element, { document }) {
  const teasers = Array.from(element.querySelectorAll('.teaser'));

  if (teasers.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Section heading (.linked_title h2 "Topic Specials") — default content BEFORE the block.
  const sectionTitleEl = element.querySelector('.linked_title h2, .linked_title h1, .linked_title h3');
  let sectionHeading = null;
  if (sectionTitleEl && sectionTitleEl.textContent.trim()) {
    sectionHeading = document.createElement('h2');
    sectionHeading.textContent = sectionTitleEl.textContent.trim();
  }

  // Trailing "Further Topic Specials" view-all CTA — default content AFTER the block.
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
    const image = teaser.querySelector('.img-box img, picture img, img');

    const textBox = teaser.querySelector('.text-box') || teaser;
    const title = textBox.querySelector('h3, h2, h4');
    const description = textBox.querySelector('.description');

    const imageCell = document.createDocumentFragment();
    if (image) {
      imageCell.appendChild(document.createComment(' field:image '));
      imageCell.appendChild(image);
    }

    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));
    if (title) textCell.appendChild(title);
    if (description) {
      const p = document.createElement('p');
      p.textContent = description.textContent.trim();
      textCell.appendChild(p);
    }

    cells.push([imageCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-topic', cells });

  // Emit section heading (before) and view-all CTA (after) as default content
  // surrounding the block table.
  const out = [];
  if (sectionHeading) out.push(sectionHeading);
  out.push(block);
  if (ctaPara) out.push(ctaPara);
  element.replaceWith(...out);
}
