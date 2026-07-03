/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Max Planck Society (mpg.de) section breaks + section metadata.
 *
 * Reads the template's section list (payload.template.sections) — populated in
 * tools/importer/page-templates.json from migration-work/page-structure.json — and:
 *   - inserts a section break (<hr>) before every section except the first, so the
 *     11 homepage sections import as 11 distinct EDS sections; and
 *   - appends a Section Metadata block (style = section.style) after each section
 *     that carries a background style, so the styled backgrounds survive the import.
 *
 * Styled sections (style comes straight from the source background class, matching
 * the block-mapping `section` hints):
 *   - grey:    News, Career, From the Institutes, Multimedia
 *   - primary: Topic Specials (brand-green band)
 * White/default sections and the full-bleed hero intentionally carry no style.
 *
 * Every section selector below is authored in page-templates.json and was verified
 * against migration-work/cleaned.html / page-structure.json. Runs in afterTransform
 * only (block parsers must run against the untouched DOM first).
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  // Run in beforeTransform: the block parsers replace the source section
  // elements (grey/primary divs become blocks) during parsing, so by
  // afterTransform their selectors no longer match. Inserting <hr> breaks
  // and Section Metadata blocks here — while the original section divs still
  // exist — lets the boundaries survive parsing as siblings.
  if (hookName !== TransformHook.beforeTransform) return;

  const sections = payload && payload.template && payload.template.sections;
  if (!Array.isArray(sections) || sections.length < 2) return;

  const doc = (payload && payload.document) || (element && element.ownerDocument);
  if (!doc) return;

  // Process in reverse so inserting/appending nodes never shifts the elements
  // we still have to visit.
  for (let i = sections.length - 1; i >= 0; i -= 1) {
    const section = sections[i];
    if (!section || !section.selector) continue;

    const sectionEl = element.querySelector(section.selector);
    if (!sectionEl) continue;

    // Section Metadata block for styled sections (append after the section content).
    // Built as the standard EDS block table via plain DOM so this does not depend
    // on the WebImporter global (which is unavailable in some harness contexts).
    if (section.style) {
      const table = doc.createElement('table');
      const headRow = doc.createElement('tr');
      const headCell = doc.createElement('th');
      headCell.setAttribute('colspan', '2');
      headCell.textContent = 'Section Metadata';
      headRow.append(headCell);
      const styleRow = doc.createElement('tr');
      const keyCell = doc.createElement('td');
      keyCell.textContent = 'style';
      const valCell = doc.createElement('td');
      valCell.textContent = section.style;
      styleRow.append(keyCell, valCell);
      table.append(headRow, styleRow);
      sectionEl.after(table);
    }

    // Section break before every section except the first.
    if (i > 0) {
      sectionEl.before(doc.createElement('hr'));
    }
  }
}
