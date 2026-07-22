/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-promo. Base: hero (simple block, 1 column, up to 3 rows).
 * Source: https://www.newyorklife.com/ (promo-assist, cta-teaser) and product/article teaser sections.
 * Row 2 = image (field:image, optional); Row 3 = text (field:text): heading + subheading + CTA.
 * Model fields: image (reference/DM), imageAlt (collapsed → img alt attr), text (richtext).
 * Instances vary across pages (some may lack an image) — image row is emitted only when present.
 */
export default function parse(element, { document }) {
  const cells = [];

  // Promo image — preserve picture/img (incl. Scene7/DM URLs); alt collapses onto the img.
  const picture = element.querySelector('picture');
  const img = picture || element.querySelector('img');
  if (img) {
    const imageFrag = document.createDocumentFragment();
    imageFrag.appendChild(document.createComment(' field:image '));
    imageFrag.appendChild(img.cloneNode(true));
    cells.push([imageFrag]);
  }

  // Text content — heading + subheading paragraph(s) + CTA (rich text).
  const textFrag = document.createDocumentFragment();
  textFrag.appendChild(document.createComment(' field:text '));

  const heading = element.querySelector('h1, h2, h3, h4');
  const paragraphs = Array.from(element.querySelectorAll('p'));
  const ctaLinks = Array.from(element.querySelectorAll('a'))
    .filter((a) => !paragraphs.some((p) => p.contains(a)));

  let added = false;
  if (heading) { textFrag.appendChild(heading.cloneNode(true)); added = true; }
  paragraphs.forEach((p) => { textFrag.appendChild(p.cloneNode(true)); added = true; });
  ctaLinks.forEach((a) => {
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

  // The closing CTA teaser (white card, blue angled outline) is a distinct
  // variant from the navy promo/teaser panels.
  const isCta = element.classList.contains('cta-teaser');
  const name = isCta ? 'hero-promo (cta)' : 'hero-promo';
  const block = WebImporter.Blocks.createBlock(document, { name, cells });
  element.replaceWith(block);
}
