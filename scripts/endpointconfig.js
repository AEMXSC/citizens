// AEM endpoints for GraphQL Content Fragment delivery.
// On the AEM author (Universal Editor canvas) we call the author tier directly
// (same-origin, credentialed) so inline CF editing works. On the published site
// we route through the NYL worker, which proxies AEM publish and adds CORS +
// a cache-buster (AEM publish serves no CORS header for GraphQL).

export function getAEMAuthor() {
  return 'https://author-p153659-e1614585.adobeaemcloud.com';
}

export function getAEMPublish() {
  return 'https://nyl-app.compass-xsc.workers.dev';
}
