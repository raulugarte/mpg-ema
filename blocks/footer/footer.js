/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // Fetch footer fragment: local dev server first (repo content/ served at
  // /content/footer.plain.html), then the published AEM site path.
  const footerPath = block.getAttribute('data-footer') || '/content/mpg-ema/footer';
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) {
    resp = await fetch(`${footerPath}.plain.html`);
  }
  if (!resp.ok) return;

  const html = await resp.text();
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const sections = [...tmp.children];

  block.textContent = '';
  const footer = document.createElement('div');
  footer.className = 'footer-inner';

  // --- Section 0: green band (link columns + back-to-top) ---
  const green = document.createElement('div');
  green.className = 'footer-green';
  const greenContainer = document.createElement('div');
  greenContainer.className = 'footer-container';

  const backToTop = document.createElement('a');
  backToTop.className = 'footer-top';
  backToTop.href = '#top';
  backToTop.textContent = 'Top';
  backToTop.setAttribute('aria-label', 'Back to top');
  backToTop.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  if (sections[0]) {
    // group each heading + following list into a column
    const cols = document.createElement('div');
    cols.className = 'footer-columns';
    const nodes = [...sections[0].children];
    let currentCol = null;
    nodes.forEach((node) => {
      if (/^H[1-6]$/.test(node.tagName)) {
        currentCol = document.createElement('div');
        currentCol.className = 'footer-column';
        currentCol.append(node);
        cols.append(currentCol);
      } else if (node.tagName === 'UL') {
        if (!currentCol) {
          currentCol = document.createElement('div');
          currentCol.className = 'footer-column';
          cols.append(currentCol);
        }
        currentCol.append(node);
      }
    });
    greenContainer.append(cols);
  }
  green.append(backToTop, greenContainer);

  // --- Section 1: darkgreen legal bar ---
  const dark = document.createElement('div');
  dark.className = 'footer-subfooter';
  const darkContainer = document.createElement('div');
  darkContainer.className = 'footer-container';
  if (sections[1]) {
    while (sections[1].firstElementChild) darkContainer.append(sections[1].firstElementChild);
  }
  dark.append(darkContainer);

  footer.append(green, dark);
  block.append(footer);
}
