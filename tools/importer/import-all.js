/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS (union of all templates)
import heroBillboardParser from './parsers/hero-billboard.js';
import heroDarkParser from './parsers/hero-dark.js';
import heroPromoParser from './parsers/hero-promo.js';
import cardsFeatureParser from './parsers/cards-feature.js';
import cardsAnnounceParser from './parsers/cards-announce.js';
import cardsProductParser from './parsers/cards-product.js';
import cardsEditorialParser from './parsers/cards-editorial.js';
import cardsCalcParser from './parsers/cards-calc.js';
import columnsStatsParser from './parsers/columns-stats.js';
import accordionFaqParser from './parsers/accordion-faq.js';
import emailSubscribeParser from './parsers/email-subscribe.js';
import tableParser from './parsers/table.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/newyorklife-cleanup.js';
import sectionsTransformer from './transformers/newyorklife-sections.js';
import dmImagesTransformer from './transformers/newyorklife-dm-images.js';

// PARSER REGISTRY (shared across all templates)
const parsers = {
  'hero-billboard': heroBillboardParser,
  'hero-dark': heroDarkParser,
  'hero-promo': heroPromoParser,
  'cards-feature': cardsFeatureParser,
  'cards-announce': cardsAnnounceParser,
  'cards-product': cardsProductParser,
  'cards-editorial': cardsEditorialParser,
  'cards-calc': cardsCalcParser,
  'columns-stats': columnsStatsParser,
  'accordion-faq': accordionFaqParser,
  'email-subscribe': emailSubscribeParser,
  table: tableParser,
};

// PAGE TEMPLATE CONFIGURATIONS
const TEMPLATES = {
  homepage: {
    name: 'homepage',
    description: 'Corporate homepage',
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
  },
  'product-page': {
    name: 'product-page',
    description: 'Product/solution landing page',
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
  },
  'article-page': {
    name: 'article-page',
    description: 'Editorial article page',
    blocks: [
      { name: 'table', instances: ["div[data-section='article-body'] table"] },
      { name: 'cards-editorial', instances: ["div[data-section='related-content'] .article-cards"] },
      { name: 'hero-promo', instances: ["div[data-section='teaser']"] },
    ],
    sections: [
      { id: 's5', name: 'teaser', selector: "div[data-section='teaser']", style: 'dark', blocks: ['hero-promo'], defaultContent: [] },
    ],
  },
};

/**
 * Select the page template from the URL path. Falls back to homepage.
 */
function selectTemplate(url) {
  const path = (() => {
    try { return new URL(url).pathname; } catch (e) { return String(url || ''); }
  })();
  if (/\/articles\//.test(path)) return TEMPLATES['article-page'];
  if (/\/products\//.test(path)) return TEMPLATES['product-page'];
  return TEMPLATES.homepage;
}

const transformers = [
  cleanupTransformer,
  dmImagesTransformer,
  // Always run: splits by authored <section>/<div data-*> elements in the DOM.
  sectionsTransformer,
];

function executeTransformers(hookName, element, payload, template) {
  const enhancedPayload = { ...payload, template };
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

    const template = selectTemplate(params.originalURL || url);
    console.log(`Using template: ${template.name}`);

    executeTransformers('beforeTransform', main, payload, template);

    const pageBlocks = findBlocksOnPage(document, template);
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

    executeTransformers('afterTransform', main, payload, template);

    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname
        // Sources are served under /import-src/ on the branch preview host;
        // strip that prefix so pages land at their canonical paths.
        .replace(/^\/import-src\//, '/')
        .replace(/\/$/, '')
        .replace(/\.html$/, ''),
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: template.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
