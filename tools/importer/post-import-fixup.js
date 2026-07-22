/* eslint-disable */
/**
 * Post-import fixup for the New York Life migration.
 *
 * The bulk importer serializes content from a locally-served copy of the
 * clean HTML (http://localhost:8899). Two things need normalizing afterward
 * so the pages work on the dev server and in production:
 *
 *   1. Absolute localhost asset URLs -> root-relative/canonical:
 *        http://localhost:8899/icons/...            -> /icons/...
 *        http://localhost:8899/<path>/images/x.jpg  -> (canonical Scene7 URL, if known)
 *   2. Inject `nav` and `footer` page-metadata rows pointing at the shared
 *      /content/nav and /content/footer fragments (the header/footer blocks
 *      read these via getMetadata).
 *
 * Run after every import:  node tools/importer/post-import-fixup.js
 */
const fs = require('fs');
const path = require('path');

const CONTENT = path.resolve(__dirname, '../../content');
const NAV_PATH = '/content/nav';
const FOOTER_PATH = '/content/footer';

// Known local-scraped image -> canonical Scene7 URL replacements.
const IMAGE_FIXUPS = {
  'http://localhost:8899/articles/images/hero-women-computer.jpg':
    'https://assets.newyorklife.com/is/image/nylAssetsProd/women-working-on-computer-w575-h323',
};

function listPlainHtml(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listPlainHtml(p));
    else if (entry.name.endsWith('.plain.html')) out.push(p);
  }
  return out;
}

function injectNavFooterMeta(html) {
  if (html.includes('>nav</div><div>' + NAV_PATH)) return html; // already present
  const anchor = '<div class="metadata">';
  const i = html.indexOf(anchor);
  if (i === -1) return html; // no metadata block, skip
  // Find the matching closing </div> of the metadata block (brace-match).
  let depth = 0;
  let j = i;
  while (j < html.length) {
    if (html.startsWith('<div', j)) { depth += 1; j += 4; }
    else if (html.startsWith('</div>', j)) { depth -= 1; if (depth === 0) break; j += 6; }
    else j += 1;
  }
  const rows = `<div><div>nav</div><div>${NAV_PATH}</div></div>`
    + `<div><div>footer</div><div>${FOOTER_PATH}</div></div>`;
  return html.slice(0, j) + rows + html.slice(j);
}

let changed = 0;
for (const file of listPlainHtml(CONTENT)) {
  // Skip the nav/footer fragments themselves.
  if (/\/(nav|footer)\.plain\.html$/.test(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  const before = html;

  // 1a. Known image fixups.
  for (const [from, to] of Object.entries(IMAGE_FIXUPS)) {
    html = html.split(from).join(to);
  }
  // 1b. Any remaining localhost icon URLs -> root-relative.
  html = html.replace(/https?:\/\/localhost:8899\/icons\//g, '/icons/');
  // 1c. Strip localhost origin from any other same-origin asset refs.
  html = html.replace(/https?:\/\/localhost:8899\//g, '/');
  // 1d. Internal links to the canonical www host -> root-relative (the real
  // site serves them relative). Subdomains (mynyl, guestpay, assets, …) stay
  // absolute since they are genuinely off-site.
  html = html.replace(/https?:\/\/www\.newyorklife\.com\//g, '/');

  // 2. Inject nav/footer metadata.
  html = injectNavFooterMeta(html);

  if (html !== before) { fs.writeFileSync(file, html); changed += 1; console.log('fixed', path.relative(CONTENT, file)); }
}
console.log(`post-import-fixup: updated ${changed} file(s)`);
