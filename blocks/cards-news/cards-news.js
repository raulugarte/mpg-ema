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
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-news-card-image';
      } else {
        div.className = 'cards-news-card-body';
        // Classify the paragraphs inside the body: date, category tags, excerpt.
        const paras = [...div.querySelectorAll(':scope > p')];
        paras.forEach((p) => {
          const links = p.querySelectorAll(':scope > a');
          const onlyLinks = links.length > 0 && p.textContent.trim() === [...links].map((a) => a.textContent).join('').trim();
          const isDate = !links.length && /^[A-Za-z]+\s+\d{1,2},\s+\d{4}$/.test(p.textContent.trim());
          if (isDate) {
            p.classList.add('cards-news-date');
          } else if (onlyLinks) {
            p.classList.add('cards-news-tags');
            // Undo EDS auto button decoration so tags render as inline links.
            p.classList.remove('button-container');
            links.forEach((a) => a.classList.remove('button'));
          } else {
            p.classList.add('cards-news-excerpt');
          }
        });
      }
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    // Only optimize same-origin images. External source images (e.g. www.mpg.de
    // CDN URLs carrying a required `?t=` token) must keep their original src —
    // createOptimizedPicture strips the host and query string, which 404s.
    let sameOrigin = false;
    try {
      sameOrigin = new URL(img.src, window.location.href).origin === window.location.origin;
    } catch (e) {
      sameOrigin = false;
    }
    if (!sameOrigin) return;
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.textContent = '';
  block.append(ul);
}
