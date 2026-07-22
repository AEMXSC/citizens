/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-editorial. Base: cards.
 * Source: https://www.newyorklife.com/ (financial-insights article-cards, community-cards)
 * Container block: 2 columns per card. Cell 1 = image, cell 2 = text (label + title, linked).
 * Each source card is an <a> wrapping <img>, a label div, and a <p> title.
 * xwalk field hints: item model 'card' fields = image (reference/DM), text (richtext).
 */
export default function parse(element, { document }) {
  const cells = [];

  // Each card is an <a> (linked). Source nests these anchors at varying depths
  // (flat `.article-cards > a` on the homepage; deeply wrapped
  // `section > div > div > div > a` on product pages). Collect the OUTERMOST
  // anchors so each card is one root regardless of nesting.
  let cardRoots = Array.from(element.querySelectorAll('a'))
    .filter((a) => !a.parentElement.closest('a'));
  if (cardRoots.length === 0) {
    cardRoots = Array.from(element.querySelectorAll(':scope > .card, :scope > li, :scope > div'));
  }

  cardRoots.forEach((root) => {
    const href = root.tagName === 'A' ? root.getAttribute('href') : (root.querySelector('a') || {}).getAttribute?.('href');

    // Image cell — preserve img/picture as-is (incl. DM URLs).
    const picture = root.querySelector('picture');
    const img = picture || root.querySelector('img');
    const imageFrag = document.createDocumentFragment();
    if (img) {
      imageFrag.appendChild(document.createComment(' field:image '));
      imageFrag.appendChild(img.cloneNode(true));
    }

    // Text cell — label + title as SEPARATE block-level lines. Markdown would
    // otherwise collapse block content inside a link into one flattened run
    // (e.g. "ArticleGuide to life insurance policy types"). Extract
    // semantically regardless of nesting:
    //   - title = the card heading (h1-h6)
    //   - label = the short eyebrow text that precedes it (e.g. "Article",
    //     "New York Life Foundation"), if any
    // Ignore "Read article" affordance text. Link only the title.
    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(' field:text '));

    // Collect leaf text nodes inside the card, in order, ignoring the image
    // and the "Read article" affordance. A leaf = element with text but no
    // child element that itself carries the same text (avoids grabbing
    // wrapper divs that concatenate everything).
    const isAffordance = (t) => /^read\b/i.test(t) || /^see\b/i.test(t);
    const leaves = [];
    const seen = new Set();
    // Prefer explicit label + heading when present.
    const labelEl = root.querySelector('.label');
    const heading = root.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      const titleText = heading.textContent.trim();
      let labelText = labelEl ? labelEl.textContent.trim() : '';
      // If no .label, the eyebrow is the first short leaf before the heading.
      if (!labelText) {
        const cand = Array.from(root.querySelectorAll('div, span, p')).find((n) => {
          const t = n.textContent.trim();
          return t && t !== titleText && !isAffordance(t)
            && !n.querySelector('*') // leaf only
            && (heading.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_PRECEDING);
        });
        if (cand) labelText = cand.textContent.trim();
      }
      if (labelText) { leaves.push({ cls: 'label', text: labelText }); }
      leaves.push({ cls: '', text: titleText, link: true });
    } else {
      // No heading (homepage): label div + <p> title.
      const labelText = labelEl ? labelEl.textContent.trim() : '';
      if (labelText) { leaves.push({ cls: 'label', text: labelText }); seen.add(labelText); }
      const p = Array.from(root.querySelectorAll('p')).find((n) => {
        const t = n.textContent.trim();
        return t && !seen.has(t) && !isAffordance(t);
      });
      if (p) leaves.push({ cls: '', text: p.textContent.trim(), link: true });
    }

    leaves.forEach((leaf) => {
      const p = document.createElement('p');
      if (leaf.cls) p.className = leaf.cls;
      if (leaf.link && href) {
        const a = document.createElement('a');
        a.setAttribute('href', href);
        a.textContent = leaf.text;
        p.appendChild(a);
      } else {
        p.textContent = leaf.text;
      }
      textFrag.appendChild(p);
    });

    cells.push([imageFrag, textFrag]);
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-editorial', cells });
  element.replaceWith(block);
}
