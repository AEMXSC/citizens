/**
 * hero-billboard
 * The source wraps a bullet-separated uppercase eyebrow line inside the H1,
 * e.g. "LIFE INSURANCE • INVESTMENTS • RETIREMENT • ADVISORY With you for the
 * moments ahead". Markdown import flattens the <span class="eyebrow"> to plain
 * text, so re-detect that prefix and re-wrap it so it can be styled as a small
 * grey eyebrow above the display heading.
 */
export default function decorate(block) {
  const h1 = block.querySelector('h1');
  if (!h1 || h1.querySelector('.eyebrow')) return;

  // Only the direct text nodes form the flattened heading text.
  const raw = h1.textContent;
  // Eyebrow = leading run containing bullet separators. Split at the last
  // bullet-delimited uppercase token boundary: find the last "•" then the
  // first following word that starts a normal sentence.
  const lastBullet = raw.lastIndexOf('•');
  if (lastBullet === -1) return;

  // After the last bullet comes " ADVISORY With you…" — the eyebrow's final
  // token is the ALL-CAPS word, the heading starts at the next capitalized
  // word that is not all-caps.
  const after = raw.slice(lastBullet + 1);
  const m = after.match(/^\s*([A-Z][A-Z\s&]+?)\s+(?=[A-Z][a-z])/);
  if (!m) return;

  const eyebrowText = raw.slice(0, lastBullet + 1 + m[0].length).trim();
  const headingText = raw.slice(lastBullet + 1 + m[0].length).trim();

  h1.textContent = '';
  const span = document.createElement('span');
  span.className = 'eyebrow';
  span.textContent = eyebrowText;
  h1.append(span, document.createTextNode(headingText));
}
