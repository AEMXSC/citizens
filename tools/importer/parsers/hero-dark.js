/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-dark. Base: hero (simple block, 1 column, up to 3 rows).
 * Source: https://www.newyorklife.com/products/insurance (dark-blue hero)
 * Row 2 = image (field:image); Row 3 = text (field:text): heading + subheading + CTA.
 * Model fields: image (reference/DM), imageAlt (collapsed → img alt attr), text (richtext).
 * Note: source image is a Dynamic Media / Scene7 URL — preserved as-is; DM transformer handles the round-trip.
 */
export default function parse(element, { document }) {
  const cells = [];

  // Hero image — preserve picture/img (incl. Scene7/DM URLs) exactly; alt collapses onto the img.
  const picture = element.querySelector('picture');
  const img = picture || element.querySelector('img');
  if (img) {
    const imageFrag = document.createDocumentFragment();
    imageFrag.appendChild(document.createComment(' field:image '));
    imageFrag.appendChild(img.cloneNode(true));
    cells.push([imageFrag]);
  }

  // Text content — heading + subheading paragraph(s) + CTA link (rich text).
  const textFrag = document.createDocumentFragment();
  textFrag.appendChild(document.createComment(' field:text '));

  const heading = element.querySelector('h1, h2, h3');
  const paragraphs = Array.from(element.querySelectorAll('p'));
  // CTA(s) — anchors not already contained within a captured paragraph.
  const ctaLinks = Array.from(element.querySelectorAll('a'))
    .filter((a) => !paragraphs.some((p) => p.contains(a)));

  let added = false;
  if (heading) { textFrag.appendChild(heading.cloneNode(true)); added = true; }
  paragraphs.forEach((p) => { textFrag.appendChild(p.cloneNode(true)); added = true; });
  ctaLinks.forEach((a) => {
    // Wrap standalone CTA anchors in a paragraph and flatten nested spans to link text.
    const p = document.createElement('p');
    const link = document.createElement('a');
    link.setAttribute('href', a.getAttribute('href'));
    link.textContent = a.textContent.trim();
    p.appendChild(link);
    textFrag.appendChild(p);
    added = true;
  });

  if (added) cells.push([textFrag]);

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-dark', cells });
  element.replaceWith(block);
}
