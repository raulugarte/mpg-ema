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
 * ── Multi-page support (homepage + article) ─────────────────────────────────
 * This transformer is reused site-wide (homepage import script today; the
 * article import script will register it too). The index-based BAND_STYLE_MAP
 * above is HOMEPAGE-SPECIFIC and must only be applied to the homepage — on the
 * article page there is exactly ONE parsed cards-news table (the grey
 * "Other Interesting Articles" related-articles strip). Feeding that single
 * instance through the homepage map (cards-news idx 0 = grey) would style it
 * correctly by accident, but the coupling is fragile and semantically wrong.
 *
 * Instead we select the styling rule from the ACTIVE template:
 *   - Templates whose section list (page-templates.json section-* entries,
 *     surfaced as payload.template.sections OR payload.template.blocks[] whose
 *     name starts with "section-") is available drive styling from that data:
 *     each styled section names a block + style; we apply that style to the Nth
 *     parsed table of that block type (document order). This handles the article
 *     (single cards-news -> grey) without any homepage index assumptions.
 *   - Otherwise (homepage import script embeds no section list) we fall back to
 *     the homepage BAND_STYLE_MAP, so homepage output is byte-for-byte unchanged.
 *
 * WebImporter globals are resolved defensively: mpg.de is an AMD/RequireJS page,
 * so the injected helix-importer UMD bundle may register as an AMD module rather
 * than attaching WebImporter to the global scope. Native fallbacks keep the
 * transformer working (build a Section Metadata table, insert <hr>) in that case.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

/**
 * HOMEPAGE-ONLY fallback. Which parsed-block instances are styled bands, keyed
 * by parsed block name and that block's document-order instance index (0-based).
 * Mirrors the homepage section-* pseudo-blocks in page-templates.json, translated
 * onto the post-parse DOM. Only used when the active template carries no section
 * list (i.e. the homepage import script).
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

/**
 * Read the styled-section rules carried by the ACTIVE template, if any.
 *
 * page-templates.json expresses styled bands either as a `sections` array
 * (each entry may have { block, style }) or as `blocks[]` pseudo-entries whose
 * name starts with "section-" and carry a `section`/`style` value. The article
 * template surfaces the latter (section-related-articles -> cards-news, grey).
 *
 * Returns a per-block style map keyed by canonical parsed block name and the
 * document-order instance index of that block, e.g. { 'cards-news': { 0: 'grey' } },
 * or null when the template carries no section list (homepage import script) so
 * the caller can fall back to the hardcoded homepage BAND_STYLE_MAP.
 */
function styleMapFromTemplate(payload) {
  const template = payload && payload.template;
  if (!template) return null;

  // Real (non-section) block entries, used to resolve which parsed block a
  // section-* band maps to AND at which document-order instance index. The index
  // MUST be the real block's own instance position (its offset within its
  // instances[] list = its document-order occurrence among tables of that block
  // type), NOT the order the section-* entries appear. Otherwise a homepage where
  // only some cards-news instances are styled (idx 0 and 2) would collapse to
  // idx 0 and 1 and mis-style the wrong bands.
  const realBlocks = Array.isArray(template.blocks)
    ? template.blocks.filter((b) => b && typeof b.name === 'string' && !b.name.startsWith('section-'))
    : [];

  // Given a section selector, find { block, index } of the real block instance it
  // corresponds to: the real block whose instances[] contains that exact selector,
  // or (band-wrapper case) whose instance selector is a descendant string of the
  // section band selector. index = position within that block's instances[].
  function resolveBlockInstance(sectionSelectors, explicitBlock) {
    for (let b = 0; b < realBlocks.length; b += 1) {
      const rb = realBlocks[b];
      if (explicitBlock && rb.name !== explicitBlock) continue;
      const instances = Array.isArray(rb.instances) ? rb.instances : [];
      for (let i = 0; i < instances.length; i += 1) {
        const rbSel = instances[i];
        const hit = sectionSelectors.some(
          (secSel) => rbSel === secSel || rbSel.indexOf(secSel) !== -1 || secSel.indexOf(rbSel) !== -1,
        );
        if (hit) return { block: rb.name, index: i };
      }
    }
    // Explicit block named but no selector match: assume its first (only) instance.
    if (explicitBlock) {
      const rb = realBlocks.find((x) => x.name === explicitBlock);
      if (rb) return { block: explicitBlock, index: 0 };
    }
    return null;
  }

  // Collect { block, index, style } rules from whichever shape the template exposes.
  const rules = [];

  if (Array.isArray(template.sections)) {
    template.sections.forEach((section) => {
      if (!section) return;
      const style = section.style || section.section;
      if (!style) return;
      const selectors = Array.isArray(section.instances)
        ? section.instances
        : (section.selector ? [section.selector] : []);
      const resolved = resolveBlockInstance(selectors, section.block);
      if (resolved) rules.push({ ...resolved, style });
    });
  }

  if (Array.isArray(template.blocks)) {
    template.blocks.forEach((blockDef) => {
      if (!blockDef || typeof blockDef.name !== 'string') return;
      if (!blockDef.name.startsWith('section-')) return;
      const style = blockDef.style || blockDef.section;
      if (!style) return;
      const selectors = Array.isArray(blockDef.instances) ? blockDef.instances : [];
      const resolved = resolveBlockInstance(selectors, blockDef.block);
      if (resolved) rules.push({ ...resolved, style });
    });
  }

  if (rules.length === 0) return null;

  // Group by block name, keyed by the real instance index (document order).
  const map = {};
  rules.forEach(({ block, index, style }) => {
    map[block] = map[block] || {};
    map[block][index] = style;
  });
  return map;
}

// Lookup: normalized header text -> canonical block name (for the block types
// the homepage fallback styles). e.g. "cards news" -> "cards-news".
const BLOCK_NAME_BY_HEADER = Object.keys(BAND_STYLE_MAP).reduce((acc, name) => {
  acc[norm(computeBlockName(name))] = name;
  return acc;
}, {});

/**
 * Build a header-text -> canonical-block-name lookup for an arbitrary style map
 * (so template-driven maps can name any block type, not just the homepage set).
 */
function headerLookupFor(styleMap) {
  return Object.keys(styleMap).reduce((acc, name) => {
    acc[norm(computeBlockName(name))] = name;
    return acc;
  }, {});
}

/**
 * Read the first header cell text of a parsed block table. A parsed block table
 * has structure <table><tr><th>Block Name</th>...</tr>...</table>.
 * A block may carry a variant suffix in its header ("Cards News (carousel)");
 * strip the trailing "(...)" so matching keys off the canonical block name.
 */
function blockTableHeaderName(table) {
  const firstRow = table.querySelector(':scope > tbody > tr, :scope > tr');
  if (!firstRow) return '';
  const th = firstRow.querySelector(':scope > th');
  if (!th) return '';
  return norm(th.textContent.replace(/\s*\([^)]*\)\s*$/, ''));
}

/**
 * Locate the styled bands among the POST-PARSE DOM. Walks every block table
 * under `element` in document order, tracks a per-block-name instance counter,
 * and returns { el, style } for each instance the given styleMap marks styled.
 * Order matches document order (top to bottom).
 *
 * @param {Element} element    root to search under
 * @param {Object}  styleMap   { blockName: { instanceIdx: style } }
 * @param {Object}  headerMap  normalized header text -> canonical block name
 */
function resolveStyledBands(element, styleMap, headerMap) {
  const doc = element.ownerDocument || document;
  const root = element || doc.body;
  const tables = Array.from(root.querySelectorAll('table'));
  const perName = {};
  const bands = [];

  tables.forEach((table) => {
    const header = blockTableHeaderName(table);
    const blockName = headerMap[header];
    if (!blockName) return; // not a block type we style (or a metadata table)

    const idx = perName[blockName] || 0;
    perName[blockName] = idx + 1;

    const style = styleMap[blockName] && styleMap[blockName][idx];
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

  // Choose the styling rule for the ACTIVE page:
  //  - Template-driven when the active template carries a resolvable section
  //    list (e.g. the article template -> single cards-news band = grey). This
  //    avoids applying homepage index assumptions to other templates.
  //  - Homepage fallback (hardcoded BAND_STYLE_MAP) when the template exposes no
  //    section list, so homepage output is unchanged.
  const templateMap = styleMapFromTemplate(payload);
  const styleMap = templateMap || BAND_STYLE_MAP;
  const headerMap = templateMap ? headerLookupFor(templateMap) : BLOCK_NAME_BY_HEADER;

  // Anchor styled bands among the parsed block tables (source selectors are
  // gone by now — the parsers replaced them with these tables).
  const bands = resolveStyledBands(element, styleMap, headerMap);

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

    // Section break BEFORE this band, so it starts a new EDS section. The band
    // is often preceded by its own section heading (e.g. the article's
    // "Other Interesting Articles" <h2>, emitted by the parser as a sibling just
    // before the block table). That heading belongs INSIDE the styled section,
    // so place the <hr> before the heading — not between heading and band —
    // otherwise the heading is stranded at the end of the previous section.
    let breakBefore = el;
    const prev = el.previousElementSibling;
    if (prev && /^H[1-6]$/.test(prev.tagName)) {
      breakBefore = prev;
    }
    // Insert the break as long as the band is not literally the very first
    // content on the page. Use document-order position rather than just
    // previousElementSibling: the band may be the first child of its own
    // wrapper yet still follow the whole article body, so a sibling check alone
    // wrongly skips the break (leaving the styled section merged with the
    // article body and turning the whole page grey).
    const allElements = Array.from((element || doc.body).querySelectorAll('*'));
    const isFirstContent = allElements.indexOf(breakBefore) <= 0;
    if (!isFirstContent) {
      const hr = doc.createElement('hr');
      breakBefore.parentNode.insertBefore(hr, breakBefore);
    }
  }
}
