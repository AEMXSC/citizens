/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-announce. Base: cards.
 * Source: https://www.newyorklife.com/ (announcement section)
 * Container block: 2 columns per card. Cell 1 = image, cell 2 = text (heading + description + CTA).
 * xwalk field hints: item model 'card' fields = image (reference/DM), text (richtext).
 */
export default function parse(element, { document }) {
  const cells = [];

  // The announcement is a single card: one icon/image + heading + CTA.
  // Support multiple cards if the source ever contains repeated card wrappers.
  let cardRoots = Array.from(element.querySelectorAll(':scope > .card, :scope > li, :scope > div.card'));
  if (cardRoots.length === 0) {
    // Flat structure — the section itself is the single card.
    cardRoots = [element];
  }

  cardRoots.forEach((root) => {
    // Image cell — the picture/img (DM URLs preserved via the img element as-is).
    const picture = root.querySelector('picture');
    const img = picture || root.querySelector('img');
    const imageFrag = document.createDocumentFragment();
    if (img) {
      imageFrag.appendChild(document.createComment(' field:image '));
      imageFrag.appendChild(img.cloneNode(true));
    }

    // Text cell — heading + descriptive text + CTA (rich text), excluding the image.
    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(' field:text '));
    const textNodes = Array.from(root.children).filter((c) => {
      if (c === picture) return false;
      if (c.tagName === 'PICTURE' || c.tagName === 'IMG') return false;
      return true;
    });
    textNodes.forEach((n) => textFrag.appendChild(n.cloneNode(true)));

    cells.push([imageFrag, textFrag]);
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-announce', cells });
  element.replaceWith(block);
}
