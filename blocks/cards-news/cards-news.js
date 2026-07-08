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

  // Carousel variant (article "related articles" strip): the cards scroll
  // horizontally with prev/next arrows, mirroring the source's slick slider.
  // Static homepage grids (plain `.cards-news`) are unaffected.
  if (block.classList.contains('carousel')) {
    // eslint-disable-next-line no-use-before-define
    decorateCarousel(block, ul);
  }
}

/**
 * Turn the cards list into a horizontally-scrolling carousel with prev/next
 * arrows. Uses native scroll + scroll-snap (styled in CSS); the arrows scroll
 * the track by roughly one card width.
 * @param {Element} block the cards-news block
 * @param {HTMLUListElement} ul the cards list (the scroll track)
 */
function decorateCarousel(block, ul) {
  const nav = document.createElement('div');
  nav.className = 'cards-news-carousel-nav';

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'cards-news-carousel-btn cards-news-carousel-prev';
  prev.setAttribute('aria-label', 'Previous');

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'cards-news-carousel-btn cards-news-carousel-next';
  next.setAttribute('aria-label', 'Next');

  const step = () => {
    const first = ul.querySelector(':scope > li');
    const gap = parseFloat(getComputedStyle(ul).columnGap || '0') || 0;
    return first ? first.getBoundingClientRect().width + gap : ul.clientWidth * 0.8;
  };

  prev.addEventListener('click', () => ul.scrollBy({ left: -step(), behavior: 'smooth' }));
  next.addEventListener('click', () => ul.scrollBy({ left: step(), behavior: 'smooth' }));

  nav.append(prev, next);
  block.append(nav);
}
