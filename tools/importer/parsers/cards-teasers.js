/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-teasers. Base: cards. Source: https://www.mpg.de/en
 * xwalk container block. Filter cards-teasers -> card items.
 *   card model (blocks/cards-teasers/_cards-teasers.json): image (reference) + text (richtext).
 * Table: 2 columns. Row 1 = block name. Each subsequent row = one card:
 *   cell 1: image  -> <!-- field:image --> (EMPTY here: these teasers have no image)
 *   cell 2: text   -> <!-- field:text --> (linked h2 heading + description paragraph incl. "more" CTA)
 * These teasers have NO images, so cell 1 is an empty cell (no hint per hinting Rule 2/4).
 */
export default function parse(element, { document }) {
  // Each card = a .teaser block inside a column. Use a single, non-overlapping
  // selector so we don't double-select the nested .text-box.
  let teasers = Array.from(element.querySelectorAll('.teaser'));
  if (teasers.length === 0) {
    // Fallback for variations: one card per column wrapper
    teasers = Array.from(element.querySelectorAll('[class*="col-"] > .text-box, [class*="col-"] > div'));
  }

  // Empty-block guard
  if (teasers.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  teasers.forEach((teaser) => {
    const box = teaser.querySelector('.text-box') || teaser;
    const heading = box.querySelector('h2, h3, h4');
    const paragraphs = Array.from(box.querySelectorAll('p'));

    // Optional image (none expected for this variant, but handle gracefully)
    const image = teaser.querySelector('picture img, img');

    const imageCell = document.createDocumentFragment();
    if (image) {
      imageCell.appendChild(document.createComment(' field:image '));
      imageCell.appendChild(image);
    }
    // else: leave empty cell, no hint

    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));
    if (heading) textCell.appendChild(heading);
    paragraphs.forEach((p) => textCell.appendChild(p));

    cells.push([imageCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-teasers', cells });
  element.replaceWith(block);
}
