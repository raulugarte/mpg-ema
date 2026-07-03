/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-social. Base block: columns.
 * Source: https://www.mpg.de/en (Max Planck Society homepage).
 * Generated for xwalk project.
 *
 * Columns block (blocks/columns-social/_columns-social.json). Per xwalk hinting rules,
 * Columns blocks carry NO field hints — cells hold default content only.
 * Structure: first row = block name; second row = one cell per column (here: 2 columns).
 *
 * Source: two ".col-md-6" columns, each a "social post" area = a linked title
 * (".linked_title" holding an <h2>) plus a deferred RSS/social feed placeholder
 * (".deferred_extension[data-deffered-url]"). The remote feed is not present in the
 * static DOM, so we preserve the title and the deferred-extension node (its data-url
 * anchors the feed) as the column's content.
 */
export default function parse(element, { document }) {
  // Locate the two columns. Validated against source.html (".row > .col-md-6").
  let columnEls = Array.from(element.querySelectorAll(':scope .row > [class*="col-"]'));
  if (columnEls.length === 0) {
    columnEls = Array.from(element.querySelectorAll('[class*="col-md-"], [class*="col-sm-"]'));
  }

  // Empty-block guard.
  if (columnEls.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Build one cell per column for the single content row.
  const row = columnEls.map((col) => {
    const cellContent = [];

    // Column heading (social channel title), if present and non-empty.
    const title = col.querySelector('.linked_title, h2, h3');
    if (title && title.textContent.trim()) cellContent.push(title);

    // Deferred social/RSS feed placeholder — preserve so the feed URL survives import.
    const deferred = col.querySelector('.deferred_extension[data-deffered-url], [data-deffered-url]');
    if (deferred) cellContent.push(deferred);

    // Fallback: if nothing matched, keep the column's own children.
    if (cellContent.length === 0) {
      Array.from(col.children).forEach((c) => cellContent.push(c));
    }

    return cellContent.length ? cellContent : '';
  });

  // Columns blocks: no field hints. Single content row with one cell per column.
  const cells = [row];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-social', cells });
  element.replaceWith(block);
}
