export default function decorate(block) {
  // Content-only utility column; styling handled in article-aside.css.
  // Unwrap the single block cell so the rich content sits directly in the block.
  const inner = block.querySelector(':scope > div > div');
  if (inner) {
    block.replaceChildren(...inner.childNodes);
  }
}
