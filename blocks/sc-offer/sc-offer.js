// sc-offer — renders one or more DA Structured Content "offer" documents on an
// EDS/DA web page, in a responsive grid. Mirrors the AEM `offer` block, but the
// source is DA Structured Content delivered as JSON by the da-sc worker
// (CORS-open), not an AEM Content Fragment. Proves the same DA SC fragment
// powers headless AND the web.
//
// Authoring: one row per offer. Cell 1 = the SC doc path (e.g.
// sc/citizens-checking), optional cell 2 = env (live | preview), default live.

const DA_SC_BASE = 'https://da-sc.adobeaem.workers.dev';
const ORG = 'aemxsc';
const SITE = 'citizens';
const PUBLISH = 'https://publish-p153659-e1614585.adobeaemcloud.com';

function esc(s) {
  return (s || '').replace(/[&<>"]/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
  }[c]));
}

function imgUrl(ref) {
  if (!ref) return '';
  return ref.startsWith('/') ? PUBLISH + ref : ref;
}

async function fetchDoc(path, preferredEnv) {
  const envs = preferredEnv === 'preview' ? ['preview', 'live'] : ['live', 'preview'];
  for (const env of envs) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const res = await fetch(`${DA_SC_BASE}/${env}/${ORG}/${SITE}/${path}?ts=${Date.now()}`, { cache: 'no-store' });
      // eslint-disable-next-line no-continue
      if (!res.ok) continue;
      // eslint-disable-next-line no-await-in-loop
      const json = await res.json();
      if (json && json.data) return { data: json.data, env };
    } catch (e) { /* try next env */ }
  }
  return null;
}

function cardHtml(result, path) {
  if (!result) {
    return `<article class="sc-offer-card sc-offer-card--empty"><div class="sc-offer-body"><p class="sc-offer-status">Could not load <code>${esc(path)}</code>. Preview or publish it first.</p></div></article>`;
  }
  const d = result.data;
  const bg = imgUrl(d.heroImage);
  return `
    <article class="sc-offer-card">
      ${bg ? `<div class="sc-offer-media" style="background-image:url(${esc(bg)})" role="img" aria-label="${esc(d.headline)}"></div>` : ''}
      <div class="sc-offer-body">
        ${d.pretitle ? `<p class="sc-offer-pre">${esc(d.pretitle)}</p>` : ''}
        <h3 class="sc-offer-head">${esc(d.headline)}</h3>
        ${d.detail ? `<p class="sc-offer-det">${esc(d.detail)}</p>` : ''}
        ${d.callToAction ? `<a class="sc-offer-cta" href="${esc(d.ctaUrl || '#')}">${esc(d.callToAction)}</a>` : ''}
        <p class="sc-offer-src">DA Structured Content · <code>${esc(result.env)}/${ORG}/${SITE}/${esc(path)}</code></p>
      </div>
    </article>`;
}

export default async function decorate(block) {
  const offers = [...block.children].map((row) => {
    const cells = [...row.querySelectorAll(':scope > div')];
    const path = (cells[0] ? cells[0].textContent : '').trim().replace(/^\/+/, '');
    const env = ((cells[1] ? cells[1].textContent : '') || 'live').trim();
    return { path, env };
  }).filter((o) => o.path);

  if (!offers.length) {
    block.innerHTML = '<p class="sc-offer-status">Add a DA Structured Content path per row (e.g. sc/citizens-checking).</p>';
    return;
  }

  block.innerHTML = '<p class="sc-offer-status">Loading from DA Structured Content…</p>';

  const results = await Promise.all(offers.map((o) => fetchDoc(o.path, o.env)));
  const cards = results.map((result, i) => cardHtml(result, offers[i].path)).join('');
  block.innerHTML = `<div class="sc-offer-grid">${cards}</div>`;
}

// code-sync 20260723b
