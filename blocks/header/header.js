import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// Citizens three-row header, matching citizensbank.com. The /nav fragment
// provides four sections in order: 1 brand  2 audience  3 products (dropdowns)
// 4 tools (Espanol, Find a Branch/ATM, Customer Service, Log in).
//   Row 1 (utility, thin, right): the tools links except Log in
//   Row 2 (main): logo + audience + search + Log in button
//   Row 3 (products): product nav with dropdowns
// Degrades gracefully if sections are missing.

const isDesktop = window.matchMedia('(min-width: 900px)');

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const [brand, audience, products, tools] = [...nav.children];
  if (brand) brand.classList.add('nav-brand');
  if (audience) audience.classList.add('nav-audience');
  if (products) products.classList.add('nav-products');

  // Split tools: last link is Log in (goes in the main row as a button);
  // the rest stay as the thin utility strip.
  let loginLink = null;
  if (tools) {
    tools.classList.add('nav-utility');
    const items = [...tools.querySelectorAll(':scope ul > li')];
    const lastLi = items[items.length - 1];
    loginLink = lastLi ? lastLi.querySelector('a') : null;
    if (loginLink) {
      loginLink.classList.add('nav-login');
      lastLi.remove();
    }
  }

  // Product dropdowns.
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

  // Row 1: utility strip.
  const utilityRow = document.createElement('div');
  utilityRow.className = 'nav-utility-row';
  if (tools) utilityRow.append(tools);

  // Row 2: main row (logo + audience + search + login).
  const top = document.createElement('div');
  top.className = 'nav-top';
  if (brand) top.append(brand);
  if (audience) top.append(audience);

  const search = document.createElement('form');
  search.className = 'nav-search';
  search.setAttribute('role', 'search');
  search.action = '/search';
  search.innerHTML = '<span class="nav-search-icon" aria-hidden="true"></span>'
    + '<input type="search" name="q" placeholder="How can we help you?" aria-label="Search Citizens">';
  top.append(search);
  if (loginLink) top.append(loginLink);

  // Row 3: product nav.
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
  nav.append(hamburger, utilityRow, top, bottom);

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
