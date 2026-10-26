// Demo crawl host for the Citizens EDS site. *.aem.live forces robots.txt "Disallow: /" and
// X-Robots-Tag: noindex, so Content AI's crawler indexes nothing there. This Worker serves an
// open robots.txt, strips the noindex header and points the sitemap at itself. Not for SEO use.

const STRIPPED_HEADERS = ['x-robots-tag'];
const LOG_PATH = '/__crawl-log';
const LOG_TTL_SECONDS = 86400;

function logRequest(env, ctx, request, status) {
  if (!env.CRAWL_LOG) return;
  const url = new URL(request.url);
  const entry = {
    t: new Date().toISOString(),
    p: `${url.pathname}${url.search}`.slice(0, 300),
    s: status,
    ua: (request.headers.get('user-agent') || '').slice(0, 300),
  };
  const key = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  ctx.waitUntil(env.CRAWL_LOG.put(key, '', { metadata: entry, expirationTtl: LOG_TTL_SECONDS }));
}

async function readLog(env) {
  const { keys } = await env.CRAWL_LOG.list({ limit: 1000 });
  const entries = keys.map((k) => k.metadata).filter(Boolean);
  return new Response(JSON.stringify({ count: entries.length, entries }, null, 1), {
    headers: { 'content-type': 'application/json' },
  });
}

function robotsTxt(host) {
  return `User-agent: *\nAllow: /\n\nSitemap: https://${host}/sitemap.xml\n`;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === LOG_PATH) return readLog(env);
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405 });
    }
    if (url.pathname === '/robots.txt') {
      logRequest(env, ctx, request, 200);
      return new Response(robotsTxt(url.host), { headers: { 'content-type': 'text/plain' } });
    }

    const origin = new URL(env.ORIGIN);
    const upstream = await fetch(`${origin.origin}${url.pathname}${url.search}`, {
      method: request.method,
      headers: { 'user-agent': request.headers.get('user-agent') || 'citizens-crawl-host' },
    });

    logRequest(env, ctx, request, upstream.status);
    const headers = new Headers(upstream.headers);
    STRIPPED_HEADERS.forEach((h) => headers.delete(h));

    if (url.pathname.endsWith('sitemap.xml') && upstream.ok) {
      const body = (await upstream.text()).replaceAll(origin.origin, `https://${url.host}`);
      headers.delete('content-length');
      return new Response(body, { status: upstream.status, headers });
    }
    return new Response(upstream.body, { status: upstream.status, headers });
  },
};
