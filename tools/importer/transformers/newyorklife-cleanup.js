/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: New York Life site-wide cleanup.
 *
 * Removes non-authorable content (site chrome, breadcrumbs, share bars,
 * tracking artifacts) so the import contains only page-level authorable
 * content. All selectors below are taken from the captured DOM in
 * migration-work/cleaned.html (article-page) and the site-chrome defaults
 * that the scraper strips upstream (header/footer/nav) — kept here
 * defensively so the transformer is robust across templates.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Non-authorable widgets/overlays that could interfere with parsing.
    // (Cookie/consent chrome is stripped upstream by the scraper; these
    //  selectors are defensive site-wide guards.)
    WebImporter.DOMUtils.remove(element, [
      '#onetrust-consent-sdk',
      '#onetrust-banner-sdk',
      '[class*="cookie"]',
      '[id*="cookie"]',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Site chrome (defensive — scraper strips these upstream).
    WebImporter.DOMUtils.remove(element, [
      'header',
      'footer',
      'nav',                          // breadcrumb <nav aria-label="Breadcrumb"> in article-header
      '.breadcrumb',
      '[aria-label="Breadcrumb"]',
    ]);

    // Non-authorable interactive widgets found in captured DOM.
    // article-header contains: <div class="share-bar"> (social share control)
    WebImporter.DOMUtils.remove(element, [
      '.share-bar',
    ]);

    // Safe leftover/embedded elements that are never authorable content.
    WebImporter.DOMUtils.remove(element, [
      'iframe',
      'link',
      'noscript',
      'source',
      'script',
      'style',
    ]);

    // Strip tracking/behavioral attributes wherever present.
    element.querySelectorAll('*').forEach((el) => {
      el.removeAttribute('onclick');
      el.removeAttribute('data-track');
      el.removeAttribute('data-tracking');
      el.removeAttribute('data-analytics');
    });
  }
}
