/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: mpg-ema section breaks + section metadata.
 *
 * The mpg.de/en homepage renders as a single vertical stack of full-width
 * "bands". Most bands are white/default and need no metadata; five bands are
 * styled grey/primary and need a Section Metadata block plus a preceding <hr>
 * to split them into their own EDS sections.
 *
 * ── Why this runs on the POST-PARSE DOM ─────────────────────────────────────
 * This transformer runs in the afterTransform hook. By that point the block
 * parsers have already called `element.replaceWith(block)` on every source
 * band, so the ORIGINAL source elements (e.g.
 * "#page_content > main > div.responsive_column...grey:nth-of-type(3)") NO
 * LONGER EXIST. They have been replaced by parsed block tables produced by
 * `WebImporter.Blocks.createBlock(document, { name, cells })` — each a <table>
 * whose first <th> text is the computed block name (e.g. "Cards News",
 * "Cards Topic", "Carousel Slider"). Anchoring on the source selectors would
 * (and did) match nothing, so no <hr>/Section Metadata was emitted.
 *
 * Instead we walk the parsed block tables in document order and pick the
 * styled instances by their per-class document-order index:
 *   parsed block            index  style    original band
 *   cards-news        #1  (idx 0)  grey     News
 *   cards-news        #2  (idx 1)  —        International (white/default)
 *   cards-news        #3  (idx 2)  grey     Career
 *   cards-topic       #1  (idx 0)  primary  Topic Specials
 *   carousel-slider   #1  (idx 0)  —        Publications (white/default)
 *   carousel-slider   #2  (idx 1)  grey     From the Institutes
 *   carousel-slider   #3  (idx 2)  grey     Multimedia
 *
 * page-templates.json still carries these as section-* pseudo-blocks with the
 * original source selectors; that data is the source of truth for WHICH bands
 * are styled and their style value. We translate it here into the post-parse
 * DOM via BAND_STYLE_MAP below, keyed by parsed block name + instance index.
 *
 * A parsed block is a single <table>, not a container <div>, so the Section
 * Metadata table is inserted as the band's next sibling (end of the section's
 * content), and the <hr> is inserted before the band (start of the section).
 *
 * WebImporter globals are resolved defensively: mpg.de is an AMD/RequireJS page,
 * so the injected helix-importer UMD bundle may register as an AMD module rather
 * than attaching WebImporter to the global scope. Native fallbacks keep the
 * transformer working (build a Section Metadata table, insert <hr>) in that case.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

/**
 * Which parsed-block instances are styled bands, keyed by parsed block name and
 * that block's document-order instance index (0-based). Mirrors the section-*
 * pseudo-blocks in page-templates.json, translated onto the post-parse DOM.
 */
const BAND_STYLE_MAP = {
  'cards-news': { 0: 'grey', 2: 'grey' }, // News, Career (index 1 = International, white)
  'cards-topic': { 0: 'primary' }, // Topic Specials
  'carousel-slider': { 1: 'grey', 2: 'grey' }, // From the Institutes, Multimedia (index 0 = Publications, white)
};

function getWebImporter() {
  return (typeof WebImporter !== 'undefined' && WebImporter)
    || (typeof globalThis !== 'undefined' && globalThis.WebImporter)
    || null;
}

/**
 * Normalize text for comparison: collapse whitespace, lowercase.
 */
function norm(text) {
  return (text || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * The block-name text stamped into a parsed block table's header cell, e.g.
 * `cards-news` -> "Cards News". Mirrors helix-importer Blocks.computeBlockName.
 */
function computeBlockName(name) {
  return name
    .replace(/-/g, ' ')
    .replace(/\s(.)/g, (s) => s.toUpperCase())
    .replace(/^(.)/g, (s) => s.toUpperCase());
}

// Lookup: normalized header text -> canonical block name (for the block types
// we style). e.g. "cards news" -> "cards-news".
const BLOCK_NAME_BY_HEADER = Object.keys(BAND_STYLE_MAP).reduce((acc, name) => {
  acc[norm(computeBlockName(name))] = name;
  return acc;
}, {});

/**
 * Read the first header cell text of a parsed block table. A parsed block table
 * has structure <table><tr><th>Block Name</th>...</tr>...</table>.
 */
function blockTableHeaderName(table) {
  const firstRow = table.querySelector(':scope > tbody > tr, :scope > tr');
  if (!firstRow) return '';
  const th = firstRow.querySelector(':scope > th');
  if (!th) return '';
  return norm(th.textContent);
}

/**
 * Locate the styled bands among the POST-PARSE DOM. Walks every block table
 * under `element` in document order, tracks a per-block-name instance counter,
 * and returns { el, style } for each instance that BAND_STYLE_MAP marks styled.
 * Order matches document order (top to bottom).
 */
function resolveStyledBands(element) {
  const doc = element.ownerDocument || document;
  const root = element || doc.body;
  const tables = Array.from(root.querySelectorAll('table'));
  const perName = {};
  const bands = [];

  tables.forEach((table) => {
    const header = blockTableHeaderName(table);
    const blockName = BLOCK_NAME_BY_HEADER[header];
    if (!blockName) return; // not a block type we style (or a metadata table)

    const idx = perName[blockName] || 0;
    perName[blockName] = idx + 1;

    const style = BAND_STYLE_MAP[blockName][idx];
    if (style) bands.push({ el: table, style });
  });

  return bands;
}

function buildSectionMetadata(doc, style, wi) {
  if (wi && wi.Blocks && typeof wi.Blocks.createBlock === 'function') {
    return wi.Blocks.createBlock(doc, { name: 'Section Metadata', cells: { style } });
  }
  // Native fallback: 2-row Section Metadata table.
  const table = doc.createElement('table');
  const head = doc.createElement('tr');
  const th = doc.createElement('th');
  th.textContent = 'Section Metadata';
  head.appendChild(th);
  table.appendChild(head);
  const row = doc.createElement('tr');
  const keyCell = doc.createElement('td');
  keyCell.textContent = 'style';
  const valCell = doc.createElement('td');
  valCell.textContent = style;
  row.appendChild(keyCell);
  row.appendChild(valCell);
  table.appendChild(row);
  return table;
}

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;

  const wi = getWebImporter();
  const doc = element.ownerDocument || document;

  // Anchor styled bands among the parsed block tables (source selectors are
  // gone by now — the parsers replaced them with these tables).
  const bands = resolveStyledBands(element);

  // Process in reverse document order so DOM insertions don't shift earlier
  // anchors (each anchor is captured as a live node reference, but inserting
  // siblings before/after later bands must not disturb bands we still need to
  // touch — reverse iteration keeps every remaining anchor valid).
  for (let i = bands.length - 1; i >= 0; i -= 1) {
    const { style, el } = bands[i];

    // Section Metadata block belongs at the END of the styled section's
    // content. The parsed band is a single <table>, so insert the metadata
    // table as the band's next sibling.
    if (style) {
      const meta = buildSectionMetadata(doc, style, wi);
      if (el.nextSibling) {
        el.parentNode.insertBefore(meta, el.nextSibling);
      } else {
        el.parentNode.appendChild(meta);
      }
    }

    // Section break BEFORE this band, so it starts a new EDS section — but only
    // when there is preceding content (i.e. the band is not the first child).
    if (el.previousElementSibling) {
      const hr = doc.createElement('hr');
      el.parentNode.insertBefore(hr, el);
    }
  }
}
