/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-teaser. Base: hero. Source: https://www.mpg.de/en
 * xwalk model (blocks/hero-teaser/_hero-teaser.json):
 *   image (reference) + imageAlt (collapsed -> img alt), text (richtext)
 * Table: 1 column.
 *   Row 1 (cell): image                        -> <!-- field:image -->
 *   Row 2 (cell): headline + teaser copy + CTA -> <!-- field:text -->
 * Note: image and text live in SEPARATE cells so the richtext field does not
 * greedily consume past the <img> (md2jcr richtext-after-image gotcha avoided).
 * Teaser paragraph: the source keeps its intro/teaser copy in a display:none span
 * inside the trailing image anchor (SEO/accessibility duplicate). It is meaningful
 * editorial copy and the hero-teaser model's text field is its intended slot, so it
 * is restored as a paragraph after the headline.
 */
export default function parse(element, { document }) {
  // Background/hero image (inside the full-bleed anchor wrapper)
  const image = element.querySelector('picture img, img[class*="hero"], img');

  // Headline (h1) with its linked title
  const headline = element.querySelector('.headline h1, h1');
  // Teaser/intro copy (source stores it in a display:none span in the image anchor)
  const teaserSpan = element.querySelector('a > span, .teaser-text, .description');
  const teaserText = teaserSpan ? teaserSpan.textContent.trim() : '';
  // CTA "more" link
  const cta = element.querySelector('.more-link a, a.more');

  // Empty-block guard
  if (!image && !headline) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row: image field
  if (image) {
    const imageCell = document.createDocumentFragment();
    imageCell.appendChild(document.createComment(' field:image '));
    imageCell.appendChild(image);
    cells.push([imageCell]);
  } else {
    cells.push(['']);
  }

  // Row: text (richtext) field — headline heading + CTA
  const textCell = document.createDocumentFragment();
  textCell.appendChild(document.createComment(' field:text '));
  if (headline) textCell.appendChild(headline);
  if (teaserText) {
    const p = document.createElement('p');
    p.textContent = teaserText;
    textCell.appendChild(p);
  }
  if (cta) {
    const p = document.createElement('p');
    p.appendChild(cta);
    textCell.appendChild(p);
  }
  cells.push([textCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-teaser', cells });
  element.replaceWith(block);
}
