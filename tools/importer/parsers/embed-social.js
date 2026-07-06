/* eslint-disable */
/* global WebImporter */
/**
 * Parser for embed-social. Base: embed. Source: https://www.mpg.de/en
 * xwalk simple block (core/franklin/components/block/v1/block, model embed-social).
 *   model (blocks/embed-social/_embed-social.json):
 *     embed_placeholder (reference/image) + embed_placeholderAlt (collapsed -> img alt)
 *     + embed_uri (text/URL)
 * All three fields share the "embed_" prefix, so they are GROUPED into a single cell.
 * Table: 1 column. Row 1 = block name. Row 2 = single grouped cell:
 *   [ <!-- field:embed_placeholder --> (image, if any) ] <!-- field:embed_uri --> <a href=URI>
 * Source is a social feed built from .deferred_extension placeholders (Facebook / Bluesky),
 * each carrying its remote endpoint in data-deffered-url. There is no poster image, so
 * embed_placeholder is left empty (no hint). The deferred URL(s) become the embed URI.
 * Gotcha note: no image precedes the URI text, so the grouped cell has no
 * richtext-after-image hazard.
 */
export default function parse(element, { document }) {
  // Deferred social-feed embeds carry their remote URL in data-deffered-url.
  const deferred = Array.from(element.querySelectorAll('.deferred_extension[data-deffered-url]'));
  // Optional poster/placeholder image (none expected for this variant).
  const image = element.querySelector('picture img, img');

  // Resolve endpoints to absolute URLs where possible.
  const uris = deferred
    .map((d) => d.getAttribute('data-deffered-url'))
    .filter(Boolean)
    .map((u) => {
      try {
        return new URL(u, 'https://www.mpg.de/').href;
      } catch (e) {
        return u;
      }
    });

  // Empty-block guard
  if (uris.length === 0 && !image) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Single grouped cell for the embed_ prefixed fields. md2jcr requires EVERY
  // model field to align with a hint in order, even when empty — so we always
  // emit embed_placeholder and embed_placeholderAlt (blank if no poster image),
  // then embed_uri.
  const contentCell = document.createDocumentFragment();

  // embed_placeholder (image) — always present as a hint; content only if a poster exists.
  contentCell.appendChild(document.createComment(' field:embed_placeholder '));
  if (image) {
    contentCell.appendChild(image);
  }

  // embed_placeholderAlt — always present as a hint (blank for this variant).
  contentCell.appendChild(document.createComment(' field:embed_placeholderAlt '));

  // embed_uri — the deferred social feed endpoint(s).
  contentCell.appendChild(document.createComment(' field:embed_uri '));
  uris.forEach((uri) => {
    const a = document.createElement('a');
    a.href = uri;
    a.textContent = uri;
    const p = document.createElement('p');
    p.appendChild(a);
    contentCell.appendChild(p);
  });

  const cells = [[contentCell]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'embed-social', cells });
  element.replaceWith(block);
}
