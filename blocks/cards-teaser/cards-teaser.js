import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.querySelector('picture')) {
        div.className = 'cards-teaser-card-image';
      } else if (div.children.length === 0 && div.textContent.trim() === '') {
        // empty image cell (text-only teaser) — drop it so cards stay flush
        div.remove();
      } else {
        div.className = 'cards-teaser-card-body';
      }
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    // createOptimizedPicture strips the host and rebuilds a path-only URL, which
    // only resolves for same-origin DAM assets. The source images are hosted on
    // www.mpg.de (cross-origin), so optimizing them yields a 404 — keep the
    // original <picture> for external URLs and only optimize same-origin ones.
    let external = false;
    try {
      external = new URL(img.src, window.location.href).origin !== window.location.origin;
    } catch (e) {
      external = false;
    }
    if (external) return;
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.textContent = '';
  block.append(ul);
}
