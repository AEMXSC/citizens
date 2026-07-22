/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroBillboardParser from './parsers/hero-billboard.js';
import heroPromoParser from './parsers/hero-promo.js';
import cardsFeatureParser from './parsers/cards-feature.js';
import cardsAnnounceParser from './parsers/cards-announce.js';
import cardsProductParser from './parsers/cards-product.js';
import cardsEditorialParser from './parsers/cards-editorial.js';
import cardsCalcParser from './parsers/cards-calc.js';
import columnsStatsParser from './parsers/columns-stats.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/newyorklife-cleanup.js';
import sectionsTransformer from './transformers/newyorklife-sections.js';
import dmImagesTransformer from './transformers/newyorklife-dm-images.js';

// PARSER REGISTRY
const parsers = {
  'hero-billboard': heroBillboardParser,
  'hero-promo': heroPromoParser,
  'cards-feature': cardsFeatureParser,
  'cards-announce': cardsAnnounceParser,
  'cards-product': cardsProductParser,
  'cards-editorial': cardsEditorialParser,
  'cards-calc': cardsCalcParser,
  'columns-stats': columnsStatsParser,
};

// PAGE TEMPLATE CONFIGURATION
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'Corporate homepage',
  urls: ['https://www.newyorklife.com/'],
  blocks: [
    { name: 'hero-billboard', instances: ["section[data-section='hero']"] },
    { name: 'hero-promo', instances: ["section[data-section='promo-assist']", "section[data-section='community-cta'] .cta-teaser"] },
    { name: 'cards-feature', instances: ["section[data-section='personalized-guidance'] .feature-cards"] },
    { name: 'cards-announce', instances: ["section[data-section='announcement']"] },
    { name: 'cards-product', instances: ["section[data-section='products-solutions'] .product-cards"] },
    { name: 'cards-editorial', instances: ["section[data-section='financial-insights'] .article-cards", "section[data-section='community-impact'] .community-cards"] },
    { name: 'cards-calc', instances: ["section[data-section='financial-insights'] .calculator-cards"] },
    { name: 'columns-stats', instances: ["section[data-section='about-stats'] .stats-grid"] },
  ],
  sections: [
    { id: 's2', name: 'promo-assist', selector: "section[data-section='promo-assist']", style: 'dark', blocks: ['hero-promo'], defaultContent: [] },
    { id: 's4', name: 'announcement', selector: "section[data-section='announcement']", style: null, blocks: ['cards-announce'], defaultContent: [] },
    { id: 's5', name: 'products-solutions', selector: "section[data-section='products-solutions']", style: 'dark', blocks: ['cards-product'], defaultContent: [] },
    { id: 's7', name: 'about-stats', selector: "section[data-section='about-stats']", style: 'accent', blocks: ['columns-stats'], defaultContent: [] },
    { id: 's8', name: 'community-impact', selector: "section[data-section='community-impact']", style: 'green', blocks: ['cards-editorial', 'hero-promo'], defaultContent: [] },
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
