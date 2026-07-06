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
      // this variant is text-only; drop empty cells (the unused image cell)
      if (!div.textContent.trim() && !div.querySelector('picture')) {
        div.remove();
        return;
      }
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-teasers-card-image';
      else div.className = 'cards-teasers-card-body';
    });
    // tag the trailing "more" link inside the paragraph so we can style it
    li.querySelectorAll('.cards-teasers-card-body p > a:last-child').forEach((a) => {
      if (a.textContent.trim().toLowerCase() === 'more') a.classList.add('more');
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.textContent = '';
  block.append(ul);
}
