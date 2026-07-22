/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the native "Table" block (Block Collection).
 * Source: a raw <table> (thead + tbody with th/td cells).
 *
 * EDS Table convention: the block table's FIRST row contains only the block
 * name ("Table"); each subsequent row is a data row with two or more cells,
 * all rows having the same number of cells. WebImporter.Blocks.createBlock
 * emits exactly that shape (name row, then one row per `cells` entry).
 *
 * The Table block decorator promotes the first DATA row to <thead>, which
 * matches the source comparison chart's header row.
 */
export default function parse(element, { document }) {
  const table = element.tagName === 'TABLE' ? element : element.querySelector('table');
  if (!table) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const rows = Array.from(table.querySelectorAll('tr'));
  const cells = rows.map((tr) => Array.from(tr.children).map((cell) => {
    const frag = document.createDocumentFragment();
    Array.from(cell.childNodes).forEach((n) => frag.appendChild(n.cloneNode(true)));
    return frag;
  }));

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Table', cells });
  element.replaceWith(block);
}
