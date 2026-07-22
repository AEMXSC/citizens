/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-product. Base: cards.
 * Source: https://www.newyorklife.com/ (products-solutions product-cards) and product-page container-product.
 * Container block: 2 columns per card. Cell 1 = image (may be empty), cell 2 = text (title + copy, linked).
 * Each source card is an <a> wrapping a title div and paragraphs; often no image.
 * xwalk field hints: item model 'card' fields = image (reference/DM), text (richtext).
 * Empty image cell carries no field hint (per hinting rules for empty cells).
 */
export default function parse(element, { document }) {
  const cells = [];

  // Each product card is an <a> (linked card). The source nests these anchors
  // at varying depths (flat `.product-cards > a` on the homepage; deeply
  // wrapped `section > div > div > div > a` on product pages). Collect the
  // OUTERMOST anchors — an anchor that is not itself inside another anchor —
  // so each card is one root regardless of nesting.
  let cardRoots = Array.from(element.querySelectorAll('a'))
    .filter((a) => !a.parentElement.closest('a'));

  // Fallback: no anchors at all → treat structured child blocks as cards.
  if (cardRoots.length === 0) {
    cardRoots = Array.from(element.querySelectorAll(':scope > .card, :scope > li, :scope > div'));
  }

  cardRoots.forEach((root) => {
    const href = root.tagName === 'A' ? root.getAttribute('href') : (root.querySelector('a') || {}).getAttribute?.('href');

    // Image cell — present it only if the card actually has an image; else empty cell (no hint).
    const picture = root.querySelector('picture');
    const img = picture || root.querySelector('img');
    const imageFrag = document.createDocumentFragment();
    if (img) {
      imageFrag.appendChild(document.createComment(' field:image '));
      imageFrag.appendChild(img.cloneNode(true));
    }

    // Text cell — title + descriptive lines kept as SEPARATE block-level
    // elements. Do NOT keep them inside one <a>: markdown collapses block
    // content inside a link into a single flattened text run (title+tagline+
    // desc+"See X" all mashed together). Extract semantically:
    //   - title  = first heading, else first non-empty text node/bold
    //   - body   = each <p> (description/tagline)
    // Link only the title; cards-product.js makes the whole card clickable.
    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(' field:text '));

    const heading = root.querySelector('h1, h2, h3, h4, h5, h6');
    const titleText = (heading ? heading.textContent : (root.querySelector('.title') || {}).textContent || '').trim();

    const h = document.createElement('h3');
    if (href && titleText) {
      const a = document.createElement('a');
      a.setAttribute('href', href);
      a.textContent = titleText;
      h.appendChild(a);
    } else {
      h.textContent = titleText;
    }
    if (titleText) textFrag.appendChild(h);

    // Description paragraphs (skip empty ones and the "See X" affordance span).
    root.querySelectorAll('p').forEach((p) => {
      const t = p.textContent.trim();
      if (!t) return;
      const np = document.createElement('p');
      np.textContent = t;
      textFrag.appendChild(np);
    });

    cells.push([imageFrag, textFrag]);
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-product', cells });
  element.replaceWith(block);
}
