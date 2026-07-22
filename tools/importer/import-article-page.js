/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import tableParser from './parsers/table.js';
import cardsEditorialParser from './parsers/cards-editorial.js';
import heroPromoParser from './parsers/hero-promo.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/newyorklife-cleanup.js';
import sectionsTransformer from './transformers/newyorklife-sections.js';
import dmImagesTransformer from './transformers/newyorklife-dm-images.js';

// PARSER REGISTRY
// Note: the comparison "table" block is a native Block Collection Table — no
// custom parser; its raw <table> markup is preserved and handled by WebImporter.
const parsers = {
  table: tableParser,
  'cards-editorial': cardsEditorialParser,
  'hero-promo': heroPromoParser,
};

// PAGE TEMPLATE CONFIGURATION
const PAGE_TEMPLATE = {
  name: 'article-page',
  description: 'Editorial article page',
  urls: ['https://www.newyorklife.com/articles/types-of-life-insurance-policies'],
  blocks: [
    { name: 'table', instances: ["div[data-section='article-body'] table"] },
    { name: 'cards-editorial', instances: ["div[data-section='related-content'] .article-cards"] },
    { name: 'hero-promo', instances: ["div[data-section='teaser']"] },
  ],
  sections: [
    { id: 's5', name: 'teaser', selector: "div[data-section='teaser']", style: 'dark', blocks: ['hero-promo'], defaultContent: [] },
  ],
};

const transformers = [
  cleanupTransformer,
  dmImagesTransformer,
  // Always run: splits by authored <section>/<div data-*> elements in the DOM
  // regardless of how many styled sections the template lists.
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
