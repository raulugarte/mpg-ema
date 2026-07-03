/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-teaser. Base block: hero.
 * Source: https://www.mpg.de/en (Max Planck Society homepage).
 * Generated for xwalk project (field-hinted output).
 *
 * xwalk model (blocks/hero-teaser/_hero-teaser.json):
 *   - image (reference)      -> row 1 (field:image)
 *   - imageAlt (collapsed)   -> becomes <img alt> attribute, no own row/hint
 *   - text (richtext)        -> row 2 (field:text) — headline link + "more" CTA
 *
 * Source variations handled:
 *   - Background image lives inside a trailing full-bleed anchor (picture > img).
 *   - Headline is an <h1><a>...</a></h1>; a separate ".more-link a.more" CTA may exist.
 */
export default function parse(element, { document }) {
  // INPUT EXTRACTION — selectors validated against source.html
  const image = element.querySelector('picture img, img.img-hero, img[class*="hero"], img');
  const heading = element.querySelector('.headline h1, h1, h2, [class*="headline"] h1');
  const ctaLink = element.querySelector('.more-link a, a.more, a[class*="more"]');

  // Empty-block guard: bail if no headline and no image
  if (!image && !heading) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 1: image (field:image). imageAlt is collapsed into the <img alt> attribute.
  const imageCell = document.createDocumentFragment();
  imageCell.appendChild(document.createComment(' field:image '));
  if (image) imageCell.appendChild(image);
  cells.push([imageCell]);

  // Row 2: text (field:text) — richtext holding the headline (with link) and CTA.
  const textCell = document.createDocumentFragment();
  textCell.appendChild(document.createComment(' field:text '));
  if (heading) textCell.appendChild(heading);
  if (ctaLink) {
    const p = document.createElement('p');
    p.appendChild(ctaLink);
    textCell.appendChild(p);
  }
  cells.push([textCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-teaser', cells });
  element.replaceWith(block);
}
