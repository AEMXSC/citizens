import { moveInstrumentation } from '../../scripts/scripts.js';

// Citizens "feature grid" — card grid mirroring dcom-c-featureGrid. Two variants
// via block classes: `feature-grid (icon)` for small centered icons, and
// `feature-grid (image)` for full-bleed image cards. Each card's title link (or
// card link) makes the whole card clickable.
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 0 && div.textContent.trim() === '') {
        div.remove();
        return;
      }
      if (div.children.length === 1 && div.querySelector('picture, img')) div.className = 'feature-grid-card-media';
      else div.className = 'feature-grid-card-body';
    });
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

// code-sync 20260722
