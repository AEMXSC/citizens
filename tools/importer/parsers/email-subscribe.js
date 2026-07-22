/* eslint-disable */
/* global WebImporter */
/**
 * Parser for email-subscribe. Base: email-subscribe (simple block with a model).
 * Source: https://www.newyorklife.com/products/insurance (email-subscribe section)
 * Simple block: one column, one row per model field.
 * Model fields: eyebrow (text), heading (text), text (richtext), action (aem-content), actionText (collapsed → action link text).
 * 'actionText' ends with 'Text' so it collapses into the action field's link — no separate row/hint.
 */
export default function parse(element, { document }) {
  const cells = [];

  // Eyebrow — short label above the heading (e.g. "SUBSCRIBE").
  const form = element.querySelector('form');

  // Collect candidate text blocks, excluding the form region.
  const eyebrowEl = Array.from(element.querySelectorAll('div, p, h1, h2, h3, h4, span'))
    .find((el) => {
      const t = el.textContent.trim();
      return t && t.length < 40 && !el.querySelector('form, input, p, h1, h2, h3, h4')
        && t === t.toUpperCase() && /[A-Z]/.test(t);
    });

  // Heading — the primary marketing line (a bare text div or heading, not the eyebrow).
  const headingEl = Array.from(element.querySelectorAll('div'))
    .find((el) => {
      if (el === eyebrowEl) return false;
      if (el.querySelector('form, input, p, div, h1, h2, h3, h4')) return false;
      const t = el.textContent.trim();
      return t && t.length >= 40;
    });

  // Supporting text — the descriptive paragraph.
  const textEl = element.querySelector('p');

  if (eyebrowEl) {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(' field:eyebrow '));
    const p = document.createElement('p');
    p.textContent = eyebrowEl.textContent.trim();
    frag.appendChild(p);
    cells.push([frag]);
  }

  if (headingEl) {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(' field:heading '));
    const h = document.createElement('h2');
    h.textContent = headingEl.textContent.trim();
    frag.appendChild(h);
    cells.push([frag]);
  }

  if (textEl) {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(' field:text '));
    frag.appendChild(textEl.cloneNode(true));
    cells.push([frag]);
  }

  // Action — the form submit target, rendered as a link whose text is the submit label (actionText, collapsed).
  if (form) {
    const action = form.getAttribute('action') || '#';
    const button = form.querySelector('button, input[type="submit"]');
    // Prefer a visible submit label; the source button here is icon-only (aria-label
    // only), so fall back to the model default 'Subscribe' rather than the aria text.
    const label = (button && (button.textContent.trim() || button.getAttribute('value')))
      || 'Subscribe';
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(' field:action '));
    const a = document.createElement('a');
    a.setAttribute('href', action);
    a.textContent = label;
    frag.appendChild(a);
    cells.push([frag]);
  }

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'email-subscribe', cells });
  element.replaceWith(block);
}
