// Shared handler: forwards the content-ai-search block's POST body to Adobe Content AI,
// adding the X-Api-Key server-side and CORS for the allowed sites.

const DEFAULT_ORIGINS = ['.aem.page', '.aem.live', 'localhost'];

function allowedOrigin(origin, allowed) {
  if (!origin) return '';
  const list = (allowed || '').split(',').map((s) => s.trim()).filter(Boolean);
  const rules = list.length ? list : DEFAULT_ORIGINS;
  try {
    const { hostname } = new URL(origin);
    const ok = rules.some((r) => hostname === r.replace(/^\./, '') || hostname.endsWith(r));
    return ok ? origin : '';
  } catch (e) {
    return '';
  }
}

function corsHeaders(origin) {
  return origin
    ? {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      Vary: 'Origin',
    }
    : {};
}

function readBody(params) {
  const raw = params.__ow_body;
  if (!raw) return null;
  const text = params.__ow_isBase64Encoded ? Buffer.from(raw, 'base64').toString('utf8') : raw;
  return typeof text === 'string' ? text : JSON.stringify(text);
}

export function createHandler(endpoint, fetchImpl = fetch) {
  return async function main(params) {
    const headers = params.__ow_headers || {};
    const origin = allowedOrigin(headers.origin, params.ALLOWED_ORIGINS);
    const cors = corsHeaders(origin);
    const method = (params.__ow_method || 'post').toLowerCase();

    if (method === 'options') return { statusCode: origin ? 204 : 403, headers: cors };
    if (method !== 'post') return { statusCode: 405, headers: cors, body: { error: 'POST only' } };
    if (!params.CONTENT_AI_API_KEY || !params.CONTENT_AI_BASE_URL) {
      return { statusCode: 500, headers: cors, body: { error: 'Proxy is not configured' } };
    }
    const body = readBody(params);
    if (!body) return { statusCode: 400, headers: cors, body: { error: 'Missing JSON body' } };

    try {
      const base = params.CONTENT_AI_BASE_URL.replace(/\/+$/, '');
      const resp = await fetchImpl(`${base}/content-sources/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': params.CONTENT_AI_API_KEY },
        body,
      });
      return {
        statusCode: resp.status,
        headers: { ...cors, 'Content-Type': 'application/json' },
        body: await resp.text(),
      };
    } catch (e) {
      return { statusCode: 502, headers: cors, body: { error: 'Content AI request failed' } };
    }
  };
}
