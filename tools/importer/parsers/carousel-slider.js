/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-slider. Base: carousel. Source: https://www.mpg.de/en
 * Reused for 3 homepage sliders: Publications (linked cover images),
 * From the Institutes (text teasers), Multimedia (thumbnail + linked title).
 * xwalk container block. Filter carousel-slider -> carousel-slider-item.
 *   item model (blocks/carousel-slider/_carousel-slider.json):
 *     media_image (reference) + media_imageAlt (collapsed -> img alt) + content_text (richtext)
 * Table: 2 columns. Row 1 = block name. Each subsequent row = one slide:
 *   cell 1: image -> <!-- field:media_image --> (mandatory in library, may be empty for text slides)
 *   cell 2: text  -> <!-- field:content_text --> (institute name/title/date/CTA or linked cover title)
 * Slick duplicates slides as .slick-cloned; we exclude clones so each slide appears once.
 * Gotcha avoided: for Multimedia slides that have BOTH image and text, image goes in
 * cell 1 and richtext text in cell 2 — the richtext field never consumes past an <img>.
 */
export default function parse(element, { document }) {
  // Section heading — each instance carries its own h2 ("Publications" /
  // "From the Institutes" / "Multimedia"). Emitted as default content BEFORE the
  // block table. Scoped to the container's direct .container child so we don't
  // pick up a heading nested inside a slide.
  const sectionTitleEl = element.querySelector(':scope > .container > h2, :scope > .container > h1, :scope h2.h1, :scope h2.invert');
  let sectionHeading = null;
  if (sectionTitleEl && sectionTitleEl.textContent.trim()) {
    sectionHeading = document.createElement('h2');
    sectionHeading.textContent = sectionTitleEl.textContent.trim();
  }

  // Real slides only (exclude slick clones). Falls back to raw markup where
  // .slick-slide isn't present yet.
  let slides = Array.from(element.querySelectorAll('.slick-slide:not(.slick-cloned)'));
  if (slides.length === 0) {
    slides = Array.from(element.querySelectorAll('.slick-slide'));
  }
  // Fallback for pre-hydration markup: use the item wrappers directly.
  if (slides.length === 0) {
    slides = Array.from(element.querySelectorAll('.pub-slider-item, .teaser, .box-color, .col-xs-12'));
  }

  if (slides.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  slides.forEach((slide) => {
    // --- Image (Publications cover / Multimedia thumbnail) ---
    const image = slide.querySelector('picture img, img');

    // --- Text teaser fields ---
    // Institute band name (From the Institutes)
    const boxHeader = slide.querySelector('.box-header');
    // Linked title: a.h3 (Institutes), .text-box h3 a (Multimedia)
    const titleLink = slide.querySelector('a.h3, .text-box h3 a, h3 a, h2 a');
    // Date
    const date = slide.querySelector('time.date, .date');
    // Topic label (Multimedia: Video)
    const topic = slide.querySelector('.topic');
    // Description
    const description = slide.querySelector('.description');
    // "more" CTA
    const more = slide.querySelector('a.more');
    // Publications: the slide is just a linked cover image (no title text). The
    // link href is preserved by keeping the anchor around the image in cell 1.
    const coverLink = slide.querySelector('.pub-slider-item > a, a > picture');

    // Build image cell
    const imageCell = document.createDocumentFragment();
    if (image) {
      imageCell.appendChild(document.createComment(' field:media_image '));
      imageCell.appendChild(image);
    }

    // Build text cell (richtext)
    const textCell = document.createDocumentFragment();
    const textParts = [];
    if (boxHeader) {
      const p = document.createElement('p');
      p.textContent = boxHeader.textContent.trim();
      textParts.push(p);
    }
    if (titleLink) {
      const h = document.createElement('h3');
      h.appendChild(titleLink);
      textParts.push(h);
    }
    if (date) {
      const p = document.createElement('p');
      p.textContent = date.textContent.trim();
      textParts.push(p);
    }
    if (topic) {
      const p = document.createElement('p');
      p.textContent = topic.textContent.trim();
      textParts.push(p);
    }
    if (description) {
      const p = document.createElement('p');
      p.textContent = description.textContent.trim();
      textParts.push(p);
    }
    if (more) {
      const p = document.createElement('p');
      p.appendChild(more);
      textParts.push(p);
    }

    if (textParts.length > 0) {
      textCell.appendChild(document.createComment(' field:content_text '));
      textParts.forEach((el) => textCell.appendChild(el));
    }

    cells.push([imageCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-slider', cells });

  // Emit section heading (before) as default content preceding the block table.
  const out = [];
  if (sectionHeading) out.push(sectionHeading);
  out.push(block);
  element.replaceWith(...out);
}
