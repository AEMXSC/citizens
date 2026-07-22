import { getAEMPublish, getAEMAuthor } from '../../scripts/endpointconfig.js';

/* eslint-disable no-underscore-dangle */
// Offer block — renders an AEM Content Fragment (Offer model) via GraphQL, with
// Universal Editor instrumentation (data-aue-*) so the fragment fields are
// editable inline in UE. The same fragment feeds the headless NYL app, so one
// edit updates the website and the app.
export default async function decorate(block) {
  const aempublishurl = getAEMPublish();
  const aemauthorurl = getAEMAuthor();
  const persistedquery = '/graphql/execute.json/securbank/OfferByPath';

  const pathCell = block.querySelector(':scope div:nth-child(1) > div');
  const pathLink = pathCell ? pathCell.querySelector('a') : null;
  let offerpathRaw = '';
  if (pathLink) offerpathRaw = pathLink.textContent;
  else if (pathCell) offerpathRaw = pathCell.textContent;
  const offerpath = offerpathRaw.trim();
  const variationEl = block.querySelector(':scope div:nth-child(2) > div');
  const variationname = (variationEl && variationEl.textContent.trim()) || 'main';

  if (!offerpath) {
    block.innerHTML = '<p>Select an Offer Content Fragment.</p>';
    return;
  }

  const onAuthor = window.location && window.location.origin && window.location.origin.includes('author');
  const base = onAuthor ? aemauthorurl : aempublishurl;
  const ts = Math.floor(Math.random() * 1000000);
  const url = `${base}${persistedquery};path=${offerpath};variation=${variationname};ts=${ts}`;
  const options = onAuthor ? { credentials: 'include' } : {};

  const item = await fetch(url, options)
    .then((r) => r.json())
    .then((cf) => (cf && cf.data && cf.data.offerByPath ? cf.data.offerByPath.item : null))
    .catch(() => null);

  if (!item) {
    block.innerHTML = '<p>Offer unavailable.</p>';
    return;
  }

  const itemId = `urn:aemconnection:${offerpath}/jcr:content/data/master`;
  const bg = (item.heroImage && item.heroImage._publishUrl) || '';
  const detail = (item.detail && item.detail.plaintext) || '';

  block.innerHTML = `
  <div class="banner-content" data-aue-resource="${itemId}" data-aue-label="offer content fragment" data-aue-type="reference" data-aue-filter="cf">
    <div data-aue-prop="heroImage" data-aue-label="hero image" data-aue-type="media" class="banner-detail" style="background-image: linear-gradient(90deg,rgba(0,10,98,0.75), rgba(0,10,98,0.15) 80%), url(${bg});">
      <p data-aue-prop="pretitle" data-aue-label="pretitle" data-aue-type="text" class="pretitle">${item.pretitle || ''}</p>
      <p data-aue-prop="headline" data-aue-label="headline" data-aue-type="text" class="headline">${item.headline || ''}</p>
      <p data-aue-prop="detail" data-aue-label="detail" data-aue-type="richtext" class="detail">${detail}</p>
    </div>
  </div>`;
}

// code-sync 20260722
