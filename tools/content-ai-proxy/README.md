# content-ai-proxy

App Builder web actions (`content-ai/search`, `content-ai/gensearch`) that sit between the
`content-ai-search` block and Adobe Content AI. They add the API key server-side and CORS for
`*.aem.page`, `*.aem.live` and localhost. Content AI does not answer browser CORS preflights, so a
proxy is required.

## Deploy
1. Developer Console: project with the **AEM Content AI Services** API (Server-to-Server) -> copy the API Key (Client ID).
2. `aio login`, then `aio app use` (or `aio console ws select`) to pick the org/project/workspace.
3. `cp .env.example .env` and fill in `CONTENT_AI_API_KEY`, `CONTENT_AI_BASE_URL`.
4. `aio app deploy`; `aio app get-url --json` gives the action URLs.
5. In the block, set **Base Url** to the URL without the trailing `/search` (e.g. `.../api/v1/web/content-ai`).

`npm test` runs the unit tests.
