// sc-offer — renders a DA Structured Content "offer" document on an EDS/DA web
// page. Mirrors the AEM `offer` block, but the source is DA Structured Content
// delivered as JSON by the da-sc worker (CORS-open), not an AEM Content
// Fragment. Proves the same DA SC fragment powers headless AND the web.
//
// Authoring: first cell = the SC doc path (e.g. sc/citizens-checking),
//            optional second cell = env (live | preview), default live.

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
      const res = await fetch(`${DA_SC_BASE}/${env}/${ORG}/${SITE}/${path}?ts=${Date.now()}`, { cache: 'no-store' });
      // eslint-disable-next-line no-continue
      if (!res.ok) continue;
      const json = await res.json();
      if (json && json.data) return { data: json.data, env };
    } catch (e) { /* try next env */ }
  }
  return null;
}

export default async function decorate(block) {
  const rows = [...block.children];
  const pathCell = rows[0] && rows[0].querySelector('div');
  const path = (pathCell ? pathCell.textContent : '').trim().replace(/^\/+/, '');
  const envCell = rows[1] && rows[1].querySelector('div');
  const env = ((envCell ? envCell.textContent : '') || 'live').trim();

  if (!path) {
    block.innerHTML = '<p class="sc-offer-status">Set a DA Structured Content path (e.g. sc/citizens-checking).</p>';
    return;
  }

  block.innerHTML = '<p class="sc-offer-status">Loading from DA Structured Content…</p>';

  const result = await fetchDoc(path, env);
  if (!result) {
    block.innerHTML = '<p class="sc-offer-status">Could not load DA Structured Content. Preview or publish the document first.</p>';
    return;
  }

  const d = result.data;
  const bg = imgUrl(d.heroImage);
  block.innerHTML = `
    <article class="sc-offer-card">
      ${bg ? `<div class="sc-offer-media" style="background-image:url(${esc(bg)})" role="img" aria-label="${esc(d.headline)}"></div>` : ''}
      <div class="sc-offer-body">
        ${d.pretitle ? `<p class="sc-offer-pre">${esc(d.pretitle)}</p>` : ''}
        <h3 class="sc-offer-head">${esc(d.headline)}</h3>
        ${d.detail ? `<p class="sc-offer-det">${esc(d.detail)}</p>` : ''}
        ${d.callToAction ? `<a class="sc-offer-cta" href="${esc(d.ctaUrl || '#')}">${esc(d.callToAction)}</a>` : ''}
      </div>
      <p class="sc-offer-src">Delivered from DA Structured Content · <code>${esc(result.env)}/${ORG}/${SITE}/${esc(path)}</code></p>
    </article>`;
}

// code-sync 20260723
