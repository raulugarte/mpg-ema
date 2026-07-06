/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-events. Base: columns. Source: https://www.mpg.de/en
 * xwalk COLUMNS block (core/franklin/components/columns/v1/columns).
 * Per hinting rules, Columns blocks use ONLY default content — NO field hint comments.
 * Table: Row 1 = block name. Row 2 = 2 cells (2 columns):
 *   left  cell: month/year label + upcoming events list from the calendar widget
 *   right cell: "Upcoming Events" ticker heading + its list
 * The raw <table class="calendar_table"> is a dynamic JS widget placeholder and is
 * intentionally NOT copied (blocks/tables must not be nested inside a block cell).
 * The section heading (.linked_title h2 "Events") is section-level DEFAULT content
 * emitted BEFORE the block table; trailing "All Events" button is excluded.
 * Heading hierarchy matches source: event title = h5, "Upcoming Events" = h3.
 * The month/year label (e.g. "July 2026") is a plain caption, NOT a heading.
 */
export default function parse(element, { document }) {
  const columns = Array.from(element.querySelectorAll(':scope .row > [class*="col-"]'));

  // Empty-block guard
  if (columns.length < 1) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Section heading (.linked_title h2 "Events") — default content BEFORE the block.
  const sectionTitleEl = element.querySelector('.linked_title h2, .linked_title h1, .linked_title h3');
  let sectionHeading = null;
  if (sectionTitleEl && sectionTitleEl.textContent.trim()) {
    sectionHeading = document.createElement('h2');
    sectionHeading.textContent = sectionTitleEl.textContent.trim();
  }

  const leftSource = columns[0];
  const rightSource = columns[1] || null;

  // --- Left column: calendar month label + events ---
  const leftCell = document.createElement('div');
  // Month/year is a plain caption (e.g. "July 2026"), NOT a heading.
  const monthYear = leftSource ? leftSource.querySelector('.month_year') : null;
  if (monthYear) {
    const p = document.createElement('p');
    p.textContent = monthYear.textContent.replace(/\s+/g, ' ').trim();
    leftCell.appendChild(p);
  }
  // Individual day events: event title = h5 (matches source hierarchy), time = plain text.
  const events = leftSource ? Array.from(leftSource.querySelectorAll('.single_event')) : [];
  events.forEach((ev) => {
    const titleLink = ev.querySelector('h5 a, a');
    const time = ev.querySelector('.event_time');
    if (titleLink) {
      const h = document.createElement('h5');
      h.appendChild(titleLink);
      leftCell.appendChild(h);
    }
    if (time) {
      const p = document.createElement('p');
      p.textContent = time.textContent.trim();
      leftCell.appendChild(p);
    }
  });

  // --- Right column: Upcoming Events ticker ---
  const rightCell = document.createElement('div');
  if (rightSource) {
    const tickerHead = rightSource.querySelector('.ticker_head, h2, h3');
    if (tickerHead) {
      const h = document.createElement('h3');
      h.textContent = tickerHead.textContent.trim();
      rightCell.appendChild(h);
    }
    const tickerItems = Array.from(rightSource.querySelectorAll('.ticker_children a, .ticker_children .single_event'));
    if (tickerItems.length > 0) {
      tickerItems.forEach((item) => {
        const p = document.createElement('p');
        p.appendChild(item.cloneNode(true));
        rightCell.appendChild(p);
      });
    } else {
      const empty = rightSource.querySelector('.nothing_found');
      if (empty) {
        const p = document.createElement('p');
        p.textContent = empty.textContent.trim();
        rightCell.appendChild(p);
      }
    }
  }

  // Columns block: no field hints, just the two column cells.
  const cells = [[leftCell, rightCell]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-events', cells });

  // Emit "Events" section heading (before) as default content preceding the block.
  const out = [];
  if (sectionHeading) out.push(sectionHeading);
  out.push(block);
  element.replaceWith(...out);
}
