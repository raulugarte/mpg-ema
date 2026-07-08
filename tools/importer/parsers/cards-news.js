/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-news. Base: cards.
 * Reused for: homepage News / International / Career bands (static .responsive_column
 * bands) AND the article-page "related articles" strip (#related-articles-container,
 * a slick slider). Works for BOTH markups — do not narrow to one.
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
 * Slick-slider gotcha: the related-articles strip is a slick carousel that CLONES
 * slides (.slick-cloned) at both ends — those clones must be excluded or every card
 * is duplicated. Homepage news bands carry no clones, so the filter is a safe no-op there.
 * Excerpt gotcha: homepage teasers use <p class="description">; article teasers use
 * <p class="select-correct-strong-color">. Both are matched below.
 */
export default function parse(element, { document }) {
  // Exclude slick-slider clones so cards are not duplicated (related-articles strip).
  const teasers = Array.from(element.querySelectorAll('.teaser'))
    .filter((t) => !t.closest('.slick-cloned'));

  // Empty-block guard
  if (teasers.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Section heading — default content BEFORE the block.
  //   Homepage bands carry their heading in `.linked_title h2` INSIDE the band.
  //   The article "related articles" strip (#related-articles-container) carries
  //   its "Other Interesting Articles" heading as a SIBLING inside the enclosing
  //   grey band (`.container-full-width.grey > .container .row h2`) — outside the
  //   parsed element. Look there too, and remove the original node so the heading
  //   doesn't also linger in the preceding (article-body) section.
  let sectionTitleEl = element.querySelector('.linked_title h2, .linked_title h1, .linked_title h3');
  if (!sectionTitleEl) {
    const greyBand = element.closest('.container-full-width');
    if (greyBand) {
      sectionTitleEl = greyBand.querySelector(':scope > .container h2, :scope > .container h1');
    }
  }
  let sectionHeading = null;
  if (sectionTitleEl && sectionTitleEl.textContent.trim()) {
    sectionHeading = document.createElement('h2');
    sectionHeading.textContent = sectionTitleEl.textContent.trim();
    // If the heading lives outside the parsed element (article case), remove the
    // original so it is not left behind in the previous EDS section.
    if (!element.contains(sectionTitleEl)) {
      const wrapper = sectionTitleEl.closest('.row') || sectionTitleEl;
      wrapper.remove();
    }
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
    // Excerpt: homepage uses .description; article related-articles uses
    // p.select-correct-strong-color. Fall back to a direct <p> child of the teaser
    // that lives outside the meta-information block.
    let description = teaser.querySelector('.description, p.select-correct-strong-color');
    if (!description) {
      description = Array.from(teaser.querySelectorAll(':scope p, .text-box > p'))
        .find((p) => p.textContent.trim() && !p.closest('.meta-information')) || null;
    }

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

  // The article "related articles" strip (#related-articles-container) is a slick
  // slider in the source; render it as a carousel via the `carousel` variant
  // (-> class "cards-news carousel"). Homepage News/Career/International bands are
  // static grids and keep the plain `cards-news` name.
  const isRelatedStrip = element.id === 'related-articles-container'
    || !!element.closest('#related-articles-container')
    || !!element.querySelector('.slick-slider, .slick-track, .slick-list');
  const blockName = isRelatedStrip ? 'cards-news (carousel)' : 'cards-news';

  const block = WebImporter.Blocks.createBlock(document, { name: blockName, cells });

  // Emit section heading (before) and view-all CTA (after) as default content
  // surrounding the block table.
  const out = [];
  if (sectionHeading) out.push(sectionHeading);
  out.push(block);
  if (ctaPara) out.push(ctaPara);
  element.replaceWith(...out);
}
