/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-billboard. Base: hero (simple block, 1 column, up to 3 rows).
 * Source: https://www.newyorklife.com/ (hero section)
 * Row 2 = image (field:image); Row 3 = text (field:text): heading + subheading + CTA.
 * Model fields: image (reference/DM), imageAlt (collapsed → img alt attr), text (richtext).
 */
export default function parse(element, { document }) {
  const cells = [];

  // Background/hero image — preserve picture/img as-is (incl. DM URLs); alt stays on the img.
  const picture = element.querySelector('picture');
  const img = picture || element.querySelector('img');
  if (img) {
    const imageFrag = document.createDocumentFragment();
    imageFrag.appendChild(document.createComment(' field:image '));
    imageFrag.appendChild(img.cloneNode(true));
    cells.push([imageFrag]);
  }

  // Text content — heading, subheading, and CTA (rich text).
  const contentRoot = element.querySelector('.hero-content') || element;
  const textFrag = document.createDocumentFragment();
  textFrag.appendChild(document.createComment(' field:text '));

  const heading = contentRoot.querySelector('h1, h2, h3');
  const paragraphs = Array.from(contentRoot.querySelectorAll('p'));

  let added = false;
  if (heading) { textFrag.appendChild(heading.cloneNode(true)); added = true; }
  paragraphs.forEach((p) => { textFrag.appendChild(p.cloneNode(true)); added = true; });

  if (added) cells.push([textFrag]);

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-billboard', cells });
  element.replaceWith(block);
}
