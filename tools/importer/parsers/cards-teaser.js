/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-teaser. Base block: cards.
 * Source: https://www.mpg.de/en (Max Planck Society homepage).
 * Generated for xwalk project (field-hinted output).
 *
 * Container block. Model `card` (blocks/cards-teaser/_cards-teaser.json):
 *   - image (reference)  -> cell 1 (field:image). Optional/empty for text-only teasers.
 *   - text (richtext)    -> cell 2 (field:text): heading link + description + "more" CTA.
 *   (media_imageAlt collapses into the <img alt> attribute — no own hint.)
 *
 * Each card = 1 row, 2 cells. Empty cells carry NO field hint (per xwalk hinting rules).
 *
 * Source variations handled:
 *   - Cards are ".col-*" wrappers; content lives in ".teaser .text-box".
 *   - Text-only teasers (no image) => empty first cell.
 *   - Description text + inline ".more" CTA share the same <p> in source; kept together.
 */
export default function parse(element, { document }) {
  // Locate card items. Each ".col-*" wrapper holds one ".teaser".
  let cardEls = Array.from(element.querySelectorAll(':scope .row > [class*="col-"]'));
  if (cardEls.length === 0) {
    // Fallback: use the teaser blocks directly.
    cardEls = Array.from(element.querySelectorAll('.teaser'));
  }

  const cells = [];

  cardEls.forEach((card) => {
    // INPUT EXTRACTION — validated against source.html, with fallbacks for variation.
    const image = card.querySelector('picture img, img');
    const textBox = card.querySelector('.text-box') || card.querySelector('.teaser') || card;
    const heading = textBox.querySelector('h1, h2, h3, h4');
    // Everything in the text box that is prose/links (heading handled separately).
    const bodyNodes = Array.from(textBox.querySelectorAll(':scope > p, :scope > .date, :scope > .tags, :scope > .more-link'));

    // Skip empty cards.
    if (!image && !heading && bodyNodes.length === 0) return;

    // Cell 1: image (field:image). Empty cell => no hint.
    let imageCell;
    if (image) {
      imageCell = document.createDocumentFragment();
      imageCell.appendChild(document.createComment(' field:image '));
      imageCell.appendChild(image);
    } else {
      imageCell = '';
    }

    // Cell 2: text (field:text) — heading link + rich text (date/tags/description) + CTA.
    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));
    if (heading) textCell.appendChild(heading);
    bodyNodes.forEach((n) => textCell.appendChild(n));

    cells.push([imageCell, textCell]);
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-teaser', cells });
  element.replaceWith(block);
}
