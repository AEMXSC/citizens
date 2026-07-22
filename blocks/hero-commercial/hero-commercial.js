// Citizens "hero commercial" — sage-background hero with a content column
// (eyebrow / heading / message / CTA authored as rich text) beside an image.
// Mirrors dcom-c-hero-commercial from citizensbank.com. Leaf block: cells are
// tagged media vs content; CSS lays them out two-up.
export default function decorate(block) {
  [...block.children].forEach((row) => {
    // Drop the empty cell the optional image alt / blank fields can leave behind.
    if (row.children.length === 0 && row.textContent.trim() === '' && !row.querySelector('picture')) {
      row.remove();
      return;
    }
    row.classList.add(row.querySelector('picture') ? 'hero-commercial-media' : 'hero-commercial-content');
  });
}
