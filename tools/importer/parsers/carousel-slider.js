/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-slider. Base block: carousel.
 * Sources:
 *   - https://www.mpg.de/en (homepage): Publications, From-the-Institutes, Multimedia sliders.
 *   - Article pages: "#related-articles-container" related-articles slider.
 * Generated for xwalk project (field-hinted output).
 *
 * xwalk container block. Model `carousel-slider-item` (blocks/carousel-slider/_carousel-slider.json):
 *   - media_image (reference) -> cell 1 (field:media_image). Slide image (mandatory when present).
 *   - media_imageAlt (collapsed) -> becomes the <img alt> attribute, no own cell/hint.
 *   - content_text (richtext) -> cell 2 (field:content_text). Optional title/description/CTA/date/tags.
 *
 * Each slide = 1 row, 2 cells. Empty cells carry NO field hint (per xwalk hinting rules).
 *
 * slick.js note: every source slider (homepage AND article) duplicates its real slides as
 * `.slick-slide.slick-cloned` (leading + trailing clones). Any slide contained in a
 * `.slick-cloned` ancestor is skipped so only unique slides are emitted.
 *
 * Variants handled (all share this parser):
 *   - "Publications" (homepage): each slide = a linked cover image (".pub-slider-item > a > picture > img"),
 *     no text -> image cell holds the linked <a>, text cell empty (no field hint).
 *   - "From the Institutes" (homepage): each slide (".box-color") = institute name (.box-header) + date
 *     (time.date) + heading link (a.h3) + more link (a.more). No image -> image cell empty.
 *   - "Multimedia" (homepage): each slide (".teaser.media-teaser") = linked poster image
 *     (.img-box a picture img) + title link (h3 a) + "Video" label + description + optional more link.
 *   - "related-articles" (article): each slide (".teaser.white") = linked image (.img-box a picture img)
 *     + title link (.meta-information h3 a) + date (.data .date) + tag links (.tags a) + description (p).
 */
export default function parse(element, { document }) {
  // Slide "root" for each variant. Each root represents exactly one slide's content.
  //   - Publications: .pub-slider-item
  //   - From-the-Institutes: .box-color
  //   - Multimedia + related-articles (and any other .teaser slider): .teaser
  // These class families are mutually exclusive, so the OR list never double-selects a slide.
  let slideEls = Array.from(element.querySelectorAll(
    ':scope .pub-slider-item, :scope .box-color, :scope .teaser',
  ));

  // Fallback for unforeseen slider markup: use slide wrappers directly.
  if (slideEls.length === 0) {
    slideEls = Array.from(element.querySelectorAll(':scope .slick-slide, :scope [class*="slider-item"]'));
  }

  // Exclude slick.js clones (leading/trailing duplicates) so only unique slides are emitted.
  slideEls = slideEls.filter((el) => !el.closest('.slick-cloned'));

  const cells = [];

  slideEls.forEach((slide) => {
    // ---- CELL 1: media_image (field:media_image) ----
    // The slide image, if any. Keep a wrapping <a> so the linked image is preserved.
    const image = slide.querySelector('picture img, img');
    const imageLink = image ? image.closest('a') : null;

    let imageCell = '';
    if (image) {
      const frag = document.createDocumentFragment();
      frag.appendChild(document.createComment(' field:media_image '));
      frag.appendChild(imageLink || image);
      imageCell = frag;
    }

    // ---- CELL 2: content_text (field:content_text) rich text ----
    // Collect title/heading link, date, tags, description, and CTAs as clean rich text.
    const textParts = [];

    // Heading / title (may be an <a class="h3"> in institutes, or <h3><a> in teasers).
    const headingLink = slide.querySelector(':scope > a.h3, .text-box > a.h3');
    const headingEl = slide.querySelector('.text-box h3, .meta-information h3, h1, h2, h3, h4, .headline');
    if (headingEl && !headingEl.closest('a')) {
      // <h3> wrapping a link (teaser variants) or a plain heading.
      textParts.push(headingEl);
    } else if (headingLink) {
      // Institutes variant: heading is a bare <a class="h3">. Wrap in an <h3> so it stays a heading.
      const h = document.createElement('h3');
      const a = document.createElement('a');
      if (headingLink.getAttribute('href')) a.setAttribute('href', headingLink.getAttribute('href'));
      a.textContent = headingLink.textContent.trim();
      h.appendChild(a);
      textParts.push(h);
    }

    // Institute name (From-the-Institutes .box-header) — small label above the heading.
    const boxHeader = slide.querySelector(':scope > .box-header, .box-header');
    if (boxHeader && boxHeader.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = boxHeader.textContent.trim();
      // Prepend so the institute name sits above the heading (source order).
      textParts.unshift(p);
    }

    // Date: <time class="date"> (institutes) or <span class="date"> inside .data (article).
    const dateEl = slide.querySelector('time.date, .data .date, .date');
    if (dateEl && dateEl.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = dateEl.textContent.trim();
      textParts.push(p);
    }

    // Topic / label (e.g. "Video" in Multimedia).
    const topicEl = slide.querySelector('.meta-information .topic, .data .topic, .topic, .label');
    if (topicEl && topicEl.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = topicEl.textContent.trim();
      textParts.push(p);
    }

    // Tags (article variant): render each tag as plain inline text in one paragraph,
    // dropping site-specific classes. Preserve tag link text.
    const tagLinks = Array.from(slide.querySelectorAll('.tags a'));
    if (tagLinks.length > 0) {
      const p = document.createElement('p');
      tagLinks.forEach((a, i) => {
        const span = document.createElement('a');
        if (a.getAttribute('href')) span.setAttribute('href', a.getAttribute('href'));
        span.textContent = a.textContent.trim();
        if (i > 0) p.appendChild(document.createTextNode(', '));
        p.appendChild(span);
      });
      textParts.push(p);
    }

    // Description paragraph(s): teaser .text-box > p, or a .description block.
    const descEls = Array.from(slide.querySelectorAll(
      ':scope .text-box > p, :scope > .description, :scope .text-box > .description',
    ));
    descEls.forEach((d) => {
      if (!d.textContent.trim()) return;
      const p = document.createElement('p');
      p.textContent = d.textContent.trim();
      textParts.push(p);
    });

    // "More" / CTA link that is not the image link and not the heading link.
    const moreLink = slide.querySelector('a.more, .more-link a');
    if (moreLink && moreLink !== imageLink && moreLink.textContent.trim()) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      if (moreLink.getAttribute('href')) a.setAttribute('href', moreLink.getAttribute('href'));
      a.textContent = moreLink.textContent.trim();
      p.appendChild(a);
      textParts.push(p);
    }

    let textCell = '';
    if (textParts.length > 0) {
      const frag = document.createDocumentFragment();
      frag.appendChild(document.createComment(' field:content_text '));
      textParts.forEach((n) => frag.appendChild(n));
      textCell = frag;
    }

    // Skip genuinely empty slides (no image and no text).
    if (imageCell === '' && textCell === '') return;

    cells.push([imageCell, textCell]);
  });

  // Empty-block guard: if nothing was extracted, unwrap the element.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-slider', cells });
  element.replaceWith(block);
}
