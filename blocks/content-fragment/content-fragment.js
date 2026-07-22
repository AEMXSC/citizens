// Content Fragment block — renders an AEM Content Fragment (the same one the
// headless NYL app consumes) so a single fragment edit updates the website AND
// the app. Fetches through the NYL worker, which adds CORS + a cache-buster and
// proxies AEM GraphQL server-side.

// Same AEM persisted query the headless NYL app's card grid consumes, so a single
// Article Content Fragment edit updates the website AND the app.
const CF_ENDPOINT = 'https://nyl-app.compass-xsc.workers.dev/graphql/execute.json/securbank/ArticleList';

function imgUrl(hero) {
  if (!hero) return '';
  return hero._dmS7Url || hero._publishUrl || hero._dynamicUrl || '';
}

function buildCard(article) {
  const card = document.createElement('article');
  card.className = 'cf-card';

  const src = imgUrl(article.heroImage);
  if (src) {
    const media = document.createElement('div');
    media.className = 'cf-media';
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.src = src;
    img.alt = article.headline || '';
    media.append(img);
    card.append(media);
  }

  const body = document.createElement('div');
  body.className = 'cf-body';
  const h = document.createElement('h3');
  h.textContent = article.headline || '';
  const p = document.createElement('p');
  p.textContent = (article.main && article.main.plaintext) || '';
  body.append(h, p);
  card.append(body);
  return card;
}

export default async function decorate(block) {
  const authoredHeading = block.textContent.trim();
  block.textContent = '';
  const status = document.createElement('p');
  status.className = 'cf-status';
  status.textContent = 'Loading from AEM…';
  block.append(status);

  try {
    const res = await fetch(`${CF_ENDPOINT}?ts=${Date.now()}`, { cache: 'no-store' });
    const data = await res.json();
    const articles = (data && data.data && data.data.articleList
      && data.data.articleList.items) || [];
    const greeting = authoredHeading || '';

    block.textContent = '';

    if (greeting) {
      const h2 = document.createElement('h2');
      h2.className = 'cf-greeting';
      h2.textContent = greeting;
      block.append(h2);
    }

    if (!articles.length) {
      const empty = document.createElement('p');
      empty.className = 'cf-status';
      empty.textContent = 'No content fragment data returned.';
      block.append(empty);
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'cf-grid';
    articles.forEach((a) => grid.append(buildCard(a)));
    block.append(grid);
  } catch (e) {
    block.textContent = '';
    const err = document.createElement('p');
    err.className = 'cf-status';
    err.textContent = 'Could not load the content fragment.';
    block.append(err);
  }
}
