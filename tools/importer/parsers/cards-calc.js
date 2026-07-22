/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-calc. Base: cards.
 * Source: https://www.newyorklife.com/ (financial-insights calculator-cards)
 * Container block: 2 columns per card. Cell 1 = image/icon, cell 2 = text (linked label).
 * Each source card is an <a> wrapping an <img> and a <p> label.
 * xwalk field hints: item model 'card' fields = image (reference/DM), text (richtext).
 */
export default function parse(element, { document }) {
  const cells = [];

  // Each card is an anchor (icon + label). Fall back to div wrappers if present.
  let cardRoots = Array.from(element.querySelectorAll(':scope > a'));
  if (cardRoots.length === 0) {
    cardRoots = Array.from(element.querySelectorAll(':scope > .card, :scope > li, :scope > div'));
  }

  cardRoots.forEach((root) => {
    const href = root.tagName === 'A' ? root.getAttribute('href') : (root.querySelector('a') || {}).href;

    // Image cell — icon image (src may be lazy/empty; preserve as-is incl. DM URLs).
    const img = root.querySelector('img');
    const imageFrag = document.createDocumentFragment();
    if (img) {
      imageFrag.appendChild(document.createComment(' field:image '));
      imageFrag.appendChild(img.cloneNode(true));
    }

    // Text cell — the label as a CTA link so the destination is preserved.
    const label = root.querySelector('p, span, h3, h4') || root;
    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(' field:text '));
    if (href) {
      const a = document.createElement('a');
      a.setAttribute('href', href);
      a.textContent = label.textContent.trim();
      const p = document.createElement('p');
      p.appendChild(a);
      textFrag.appendChild(p);
    } else {
      const p = document.createElement('p');
      p.textContent = label.textContent.trim();
      textFrag.appendChild(p);
    }

    cells.push([imageFrag, textFrag]);
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-calc', cells });
  element.replaceWith(block);
}
