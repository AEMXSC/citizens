/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: New York Life section handling.
 *
 * Splits the page into EDS sections by inserting a section break (<hr>)
 * between each top-level authored section element, and appends a Section
 * Metadata block to sections that declare a `style` in the template
 * (payload.template.sections, keyed by the section name).
 *
 * Source pages use one of two authored-section attributes:
 *   - `<section data-section="…">`  (homepage / article reconstructions)
 *   - `<section data-block="…">`    (product-page reconstruction)
 * Both are matched so EVERY template splits into real sections. If no breaks
 * are inserted the whole page collapses into a single section — and a single
 * section-metadata `style` (e.g. the hero's `dark`) then bleeds across every
 * block on the page (white text on white).
 *
 * Runs in beforeTransform — BEFORE the block parsers replace the authored
 * section elements with block tables (afterTransform would find nothing).
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.beforeTransform) return;

  const doc = element.ownerDocument;

  // Map of section name -> style, from the template's styled sections.
  const template = payload && payload.template;
  const styled = {};
  const templateSections = template && Array.isArray(template.sections) ? template.sections : [];
  templateSections.forEach((s) => {
    if (s && s.name && s.style) styled[s.name] = s.style;
  });

  // All authored sections, in document order. Source reconstructions use
  // either <section>/<div> with a data-section or data-block attribute.
  const sectionEls = Array.from(
    element.querySelectorAll('[data-section], [data-block]'),
  ).filter((el) => {
    // Only TOP-LEVEL authored sections (not nested block wrappers inside them).
    const parentSection = el.parentElement && el.parentElement.closest('[data-section], [data-block]');
    return !parentSection;
  });
  if (sectionEls.length < 2) return;

  sectionEls.forEach((sectionEl, i) => {
    // Section break before every non-first section.
    if (i > 0) {
      sectionEl.before(doc.createElement('hr'));
    }

    // Section Metadata block for sections that declare a style.
    const name = sectionEl.getAttribute('data-section') || sectionEl.getAttribute('data-block');
    const style = styled[name];
    if (style) {
      const metaBlock = WebImporter.Blocks.createBlock(doc, {
        name: 'Section Metadata',
        cells: { style },
      });
      sectionEl.append(metaBlock);
    }
  });
}
