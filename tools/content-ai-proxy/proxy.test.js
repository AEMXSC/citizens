import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from './actions/proxy.js';

const base = {
  CONTENT_AI_API_KEY: 'k',
  CONTENT_AI_BASE_URL: 'https://x.test/contentAI/',
  __ow_headers: { origin: 'https://main--citizens--aemxsc.aem.live' },
  __ow_method: 'post',
  __ow_body: '{"query":"a"}',
};

test('forwards body with api key and adds CORS', async () => {
  let call;
  const main = createHandler('search', async (url, init) => {
    call = { url, init };
    return { status: 200, text: async () => '{"results":[]}' };
  });
  const res = await main(base);
  assert.equal(call.url, 'https://x.test/contentAI/content-sources/search');
  assert.equal(call.init.headers['X-Api-Key'], 'k');
  assert.equal(call.init.body, '{"query":"a"}');
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['Access-Control-Allow-Origin'], base.__ow_headers.origin);
});

test('preflight allowed and disallowed origins', async () => {
  const main = createHandler('search');
  assert.equal((await main({ ...base, __ow_method: 'options' })).statusCode, 204);
  const bad = { ...base, __ow_method: 'options', __ow_headers: { origin: 'https://evil.example' } };
  assert.equal((await main(bad)).statusCode, 403);
});

test('rejects non-POST, missing body, missing config', async () => {
  const main = createHandler('gensearch');
  assert.equal((await main({ ...base, __ow_method: 'get' })).statusCode, 405);
  assert.equal((await main({ ...base, __ow_body: undefined })).statusCode, 400);
  assert.equal((await main({ ...base, CONTENT_AI_API_KEY: '' })).statusCode, 500);
});

test('decodes base64 body', async () => {
  let sent;
  const main = createHandler('search', async (u, i) => { sent = i.body; return { status: 200, text: async () => '{}' }; });
  await main({ ...base, __ow_isBase64Encoded: true, __ow_body: Buffer.from('{"q":1}').toString('base64') });
  assert.equal(sent, '{"q":1}');
});

test('decodes base64 body even without the encoding flag', async () => {
  let sent;
  const main = createHandler('search', async (u, i) => { sent = i.body; return { status: 200, text: async () => '{}' }; });
  await main({ ...base, __ow_body: Buffer.from('{"q":2}').toString('base64') });
  assert.equal(sent, '{"q":2}');
});
