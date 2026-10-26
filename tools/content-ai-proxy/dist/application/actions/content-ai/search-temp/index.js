/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  main: () => (/* binding */ main)
});

;// ./actions/proxy.js
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

// Raw web actions deliver the body as base64 or plain text depending on content type
// (and do not always set __ow_isBase64Encoded), so accept either.
function readBody(params) {
  const raw = params.__ow_body;
  if (!raw) return null;
  if (typeof raw !== 'string') return JSON.stringify(raw);
  if (params.__ow_isBase64Encoded) return Buffer.from(raw, 'base64').toString('utf8');
  try {
    JSON.parse(raw);
    return raw;
  } catch (e) {
    return Buffer.from(raw, 'base64').toString('utf8');
  }
}

function createHandler(endpoint, fetchImpl = fetch) {
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

;// ./actions/search.js


const main = createHandler('search');

module.exports = __webpack_exports__;
/******/ })()
;