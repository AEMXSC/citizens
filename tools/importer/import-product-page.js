/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroDarkParser from './parsers/hero-dark.js';
import cardsFeatureParser from './parsers/cards-feature.js';
import cardsProductParser from './parsers/cards-product.js';
import accordionFaqParser from './parsers/accordion-faq.js';
import cardsEditorialParser from './parsers/cards-editorial.js';
import columnsStatsParser from './parsers/columns-stats.js';
import heroPromoParser from './parsers/hero-promo.js';
import emailSubscribeParser from './parsers/email-subscribe.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/newyorklife-cleanup.js';
import sectionsTransformer from './transformers/newyorklife-sections.js';
import dmImagesTransformer from './transformers/newyorklife-dm-images.js';

// PARSER REGISTRY
const parsers = {
  'hero-dark': heroDarkParser,
  'cards-feature': cardsFeatureParser,
  'cards-product': cardsProductParser,
  'accordion-faq': accordionFaqParser,
  'cards-editorial': cardsEditorialParser,
  'columns-stats': columnsStatsParser,
  'hero-promo': heroPromoParser,
  'email-subscribe': emailSubscribeParser,
};

// PAGE TEMPLATE CONFIGURATION
const PAGE_TEMPLATE = {
  name: 'product-page',
  description: 'Product/solution landing page',
  urls: ['https://www.newyorklife.com/products/insurance'],
  blocks: [
    { name: 'hero-dark', instances: ["section[data-block='hero']"] },
    { name: 'cards-feature', instances: ["section[data-block='container-feature'] .feature-cards"] },
    { name: 'cards-product', instances: ["section[data-block='container-product']"] },
    { name: 'accordion-faq', instances: ["section[data-block='accordion']"] },
    { name: 'cards-editorial', instances: ["section[data-block='container-editorial']"] },
    { name: 'columns-stats', instances: ["section[data-block='container-columns']"] },
    { name: 'hero-promo', instances: ["section[data-block='teaser']"] },
    { name: 'email-subscribe', instances: ["section[data-block='email-subscribe']"] },
  ],
  sections: [
    { id: 's1', name: 'hero', selector: "section[data-block='hero']", style: 'dark', blocks: ['hero-dark'], defaultContent: [] },
  ],
};

const transformers = [
  cleanupTransformer,
  dmImagesTransformer,
  // Always run the sections transformer: it splits the page by the authored
  // <section data-section|data-block> elements in the DOM (there are many even
  // when the template lists only one styled section). Gating on
  // template.sections.length collapsed multi-section pages into one section,
  // letting the hero's `dark` style bleed across the whole page.
  sectionsTransformer,
];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({ name: blockDef.name, selector, element, section: blockDef.section || null });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    executeTransformers('beforeTransform', main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    executeTransformers('afterTransform', main, payload);

    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
