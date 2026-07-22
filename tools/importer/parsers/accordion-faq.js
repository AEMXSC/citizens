/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion-faq. Base: accordion.
 * Source: https://www.newyorklife.com/products/insurance
 * Container block: 2 columns. Each row = one FAQ item (summary cell + text cell).
 * xwalk field hints: item model 'accordion-faq-item' fields = summary (text), text (richtext).
 */
export default function parse(element, { document }) {
  const cells = [];

  // Each accordion item is anchored by an <h3> containing the clickable title.
  const headings = Array.from(element.querySelectorAll('h3'));

  headings.forEach((h3) => {
    // The item wrapper is the parent div that directly contains this h3.
    const wrapper = h3.parentElement;

    // Title text — from the button/span or the h3 itself.
    const titleSource = h3.querySelector('button span, button, span') || h3;
    const summaryFrag = document.createDocumentFragment();
    summaryFrag.appendChild(document.createComment(' field:summary '));
    const summary = document.createElement('p');
    summary.textContent = titleSource.textContent.trim();
    summaryFrag.appendChild(summary);

    // Content — sibling nodes of the h3 within the wrapper (the collapsible body).
    const contentFrag = document.createDocumentFragment();
    contentFrag.appendChild(document.createComment(' field:text '));
    const bodyNodes = Array.from(wrapper.children).filter((c) => c !== h3);
    bodyNodes.forEach((node) => {
      // Unwrap redundant single-child wrapper divs down to meaningful content.
      let target = node;
      while (
        target.children.length === 1
        && target.firstElementChild.tagName === 'DIV'
      ) {
        target = target.firstElementChild;
      }
      Array.from(target.childNodes).forEach((n) => contentFrag.appendChild(n.cloneNode(true)));
    });

    cells.push([summaryFrag, contentFrag]);
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-faq', cells });
  element.replaceWith(block);
}
