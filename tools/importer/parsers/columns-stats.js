/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-stats. Base: columns (core/franklin/components/columns).
 * Source: https://www.newyorklife.com/ (about-stats stats-grid) and product-page container-columns.
 * Columns block: one content row whose cells are the columns. Each stat = one column (heading + copy).
 * NOTE: Columns blocks do NOT use field hints (per xwalk hinting rules).
 */
export default function parse(element, { document }) {
  // Each stat is a direct child div holding a heading + paragraph.
  let statDivs = Array.from(element.querySelectorAll(':scope > div'));
  if (statDivs.length === 0) {
    statDivs = Array.from(element.querySelectorAll(':scope > li, :scope > .stat, :scope > .column'));
  }

  // Build one content row: one cell per stat column (no field comments for columns blocks).
  const row = statDivs.map((div) => {
    const cell = [];
    Array.from(div.childNodes).forEach((n) => cell.push(n.cloneNode(true)));
    return cell;
  });

  if (row.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [row];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-stats', cells });
  element.replaceWith(block);
}
