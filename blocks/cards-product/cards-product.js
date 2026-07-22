import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      // Drop the empty image cell these no-image product cards produce.
      if (div.children.length === 0 && div.textContent.trim() === '') {
        div.remove();
        return;
      }
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-product-card-image';
      else div.className = 'cards-product-card-body';
    });

    // Make the whole card clickable via the title link, if present.
    const link = li.querySelector('a[href]');
    if (link) li.dataset.href = link.getAttribute('href');
    ul.append(li);
  });

  ul.querySelectorAll('li[data-href]').forEach((li) => {
    li.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      window.location.href = li.dataset.href;
    });
  });

  block.textContent = '';
  block.append(ul);
}
