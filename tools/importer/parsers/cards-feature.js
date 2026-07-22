/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-feature. Base: cards.
 * Source: https://www.newyorklife.com/ (personalized-guidance feature-cards)
 * Container block: 2 columns per card. Cell 1 = icon/image, cell 2 = text (heading + body).
 * Each source card is a div.card wrapping <img>, <h3>, and <p>.
 * xwalk field hints: item model 'card' fields = image (reference/DM), text (richtext).
 */
export default function parse(element, { document }) {
  const cells = [];

  let cardRoots = Array.from(element.querySelectorAll(':scope > .card'));
  if (cardRoots.length === 0) {
    cardRoots = Array.from(element.querySelectorAll(':scope > li, :scope > div, :scope > a'));
  }

  cardRoots.forEach((root) => {
    // Image cell — icon/image (src may be lazy/empty; preserve incl. DM URLs).
    const picture = root.querySelector('picture');
    const img = picture || root.querySelector('img');
    const imageFrag = document.createDocumentFragment();
    if (img) {
      imageFrag.appendChild(document.createComment(' field:image '));
      imageFrag.appendChild(img.cloneNode(true));
    }

    // Text cell — heading + body copy (rich text), excluding the image.
    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(' field:text '));
    const textParts = Array.from(root.children).filter((c) => {
      if (c === picture) return false;
      return c.tagName !== 'PICTURE' && c.tagName !== 'IMG';
    });
    textParts.forEach((n) => textFrag.appendChild(n.cloneNode(true)));

    cells.push([imageFrag, textFrag]);
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Product-page feature grid is a 2-column, left-aligned layout (icon above
  // heading) — distinct from the homepage 3-column centered variant.
  const variant = element.getAttribute('data-variant') === 'two-col' ? ' (two-col)' : '';
  const block = WebImporter.Blocks.createBlock(document, { name: `cards-feature${variant}`, cells });
  element.replaceWith(block);
}
