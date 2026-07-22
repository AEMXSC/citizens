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
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-calc-card-image';
      else div.className = 'cards-calc-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    // SVGs are vector: createOptimizedPicture would rewrite the src with raster
    // resize/format params that break the asset. Instead, rebase the icon onto
    // window.hlx.codeBasePath so it resolves to the EDS delivery host on the
    // Universal Editor author canvas (empty string on the published site).
    if (/\.svg(\?|$)/i.test(img.src)) {
      img.src = `${window.hlx.codeBasePath}${new URL(img.src).pathname}`;
      return;
    }
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.textContent = '';
  block.append(ul);
}

// code-sync 20260722
