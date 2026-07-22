import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// Citizens two-tier header. The /nav fragment provides four sections in order:
//   1 brand  2 audience  3 products (with dropdowns)  4 tools
// We render a top row (brand + audience + tools) and a product row beneath,
// matching citizensbank.com. Degrades gracefully if sections are missing.

const isDesktop = window.matchMedia('(min-width: 900px)');

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const sections = [...nav.children];
  const [brand, audience, products, tools] = sections;
  if (brand) brand.classList.add('nav-brand');
  if (audience) audience.classList.add('nav-audience');
  if (products) products.classList.add('nav-products');
  if (tools) tools.classList.add('nav-tools');

  // Last tools link (Log in) becomes the orange button.
  if (tools) {
    const links = tools.querySelectorAll('a');
    const last = links[links.length - 1];
    if (last) last.classList.add('nav-login');
  }

  // Product items with a nested list are dropdowns.
  if (products) {
    products.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((li) => {
      if (li.querySelector('ul')) {
        li.classList.add('nav-drop');
        li.setAttribute('aria-expanded', 'false');
        li.addEventListener('click', (e) => {
          if (!isDesktop.matches) return;
          if (e.target.closest('ul ul')) return;
          const open = li.getAttribute('aria-expanded') === 'true';
          products.querySelectorAll('.nav-drop[aria-expanded="true"]').forEach((d) => d.setAttribute('aria-expanded', 'false'));
          li.setAttribute('aria-expanded', open ? 'false' : 'true');
        });
      }
    });
  }

  const top = document.createElement('div');
  top.className = 'nav-top';
  if (brand) top.append(brand);
  if (audience) top.append(audience);
  if (tools) top.append(tools);

  const bottom = document.createElement('div');
  bottom.className = 'nav-bottom';
  if (products) bottom.append(products);

  const hamburger = document.createElement('button');
  hamburger.type = 'button';
  hamburger.className = 'nav-hamburger';
  hamburger.setAttribute('aria-label', 'Open menu');
  hamburger.innerHTML = '<span class="nav-hamburger-icon"></span>';
  hamburger.addEventListener('click', () => {
    const open = nav.getAttribute('aria-expanded') === 'true';
    nav.setAttribute('aria-expanded', open ? 'false' : 'true');
  });

  nav.textContent = '';
  nav.setAttribute('aria-expanded', 'false');
  nav.append(hamburger, top, bottom);

  // Close open dropdowns when leaving the header.
  nav.addEventListener('mouseleave', () => {
    if (isDesktop.matches) {
      nav.querySelectorAll('.nav-drop[aria-expanded="true"]').forEach((d) => d.setAttribute('aria-expanded', 'false'));
    }
  });

  const wrapper = document.createElement('div');
  wrapper.className = 'nav-wrapper';
  wrapper.append(nav);
  block.append(wrapper);
}
