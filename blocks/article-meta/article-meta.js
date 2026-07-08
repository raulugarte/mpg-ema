export default function decorate(block) {
  // Block model: two rows -> row 0 = date, row 1 = category tags (rich text of links).
  const rows = [...block.children];
  const dateRow = rows[0];
  const tagsRow = rows[1];

  if (dateRow) dateRow.classList.add('article-meta-date');

  if (tagsRow) {
    tagsRow.classList.add('article-meta-tags');
    // Style each tag link as a pill.
    tagsRow.querySelectorAll('a').forEach((a) => a.classList.add('article-meta-tag'));
  }
}
