// Citizens "hero commercial" — warm-panel hero with a content column
// (heading / message / CTA) beside an image. Mirrors dcom-c-hero-commercial.
// Leaf block: EDS wraps the fields in a single row <div>, so we lift the cells
// up to the block, drop the empty alt cell, and tag image vs content. CSS then
// lays them out two-up (content left, image right).
export default function decorate(block) {
  // Lift cells out of the single wrapper row so they become grid items.
  const row = block.firstElementChild;
  if (row && row.children.length > 1) {
    [...row.children].forEach((cell) => block.append(cell));
    row.remove();
  }

  [...block.children].forEach((cell) => {
    if (cell.children.length === 0 && cell.textContent.trim() === '' && !cell.querySelector('picture, img')) {
      cell.remove();
      return;
    }
    cell.classList.add(cell.querySelector('picture, img') ? 'hero-commercial-media' : 'hero-commercial-content');
  });
}
