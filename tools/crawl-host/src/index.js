// Demo crawl host for the Citizens EDS site. *.aem.live forces robots.txt "Disallow: /" and
// X-Robots-Tag: noindex, so Content AI's crawler indexes nothing there. This Worker serves an
// open robots.txt, strips the noindex header and points the sitemap at itself. Not for SEO use.

const STRIPPED_HEADERS = ['x-robots-tag'];

function robotsTxt(host) {
  return `User-agent: *\nAllow: /\n\nSitemap: https://${host}/sitemap.xml\n`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405 });
    }
    if (url.pathname === '/robots.txt') {
      return new Response(robotsTxt(url.host), { headers: { 'content-type': 'text/plain' } });
    }

    const origin = new URL(env.ORIGIN);
    const upstream = await fetch(`${origin.origin}${url.pathname}${url.search}`, {
      method: request.method,
      headers: { 'user-agent': request.headers.get('user-agent') || 'citizens-crawl-host' },
    });

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
