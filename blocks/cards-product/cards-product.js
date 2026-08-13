import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);

    // Cards are authored two ways: one cell holding heading+copy+link, or
    // separate cells per part. Normalise both into a single card body (plus an
    // optional image cell) so the layout is consistent.
    const body = document.createElement('div');
    body.className = 'cards-product-card-body';
    [...row.children].forEach((cell) => {
      if (cell.children.length === 1 && cell.querySelector('picture')) {
        const image = document.createElement('div');
        image.className = 'cards-product-card-image';
        while (cell.firstElementChild) image.append(cell.firstElementChild);
        li.append(image);
      } else {
        while (cell.firstElementChild) body.append(cell.firstElementChild);
      }
    });
    if (body.childElementCount) li.append(body);

    // Make the whole card clickable via its link, if present.
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

// code-sync 20260813-cardfix
