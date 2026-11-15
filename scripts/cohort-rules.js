/*
 * Cohort rules for the Citizens homepage (demo POC). Order matters: the first rule that
 * matches decides the experience.
 *
 * Every field here is read in two places:
 *   - the browser (scripts/cohorts.js) decides the page with `when`
 *   - the homepage-cohorts skill's size.js / review.js evaluate the same `when` on Optel
 *     bundles, use `model` to estimate memory-based rules, `goal` to measure each rule and
 *     `support` for its secondary action
 *
 * MODELLED: no Optel data was sized for this demo host yet. Every share shown in the demo is an
 * estimate until size.js runs on real bundles. Rule ids are measurement keys: keep them stable.
 *
 * Regexes are strings (case-insensitive) so the file stays plain data.
 */
export default {
  // must match the homepage metadata `Experiment` value (as a class name)
  experiment: 'homepage-cohorts',

  // product interests, from campaign tags and from pages visited (first match wins)
  intents: [
    ['checking', 'checking|free-checking|switch'],
    ['savings', 'savings|money-market|cds|ira'],
    ['cards', 'credit-cards|credit-card|cards'],
    ['home', 'home-equity|heloc|mortgage|refinance'],
    ['auto', 'auto-loans|auto-loan|car'],
    ['business', 'small-business|business'],
  ],

  // demo panel Insights mode: size.js output. ILLUSTRATIVE: sized on synthetic bundles
  // (citizens-poc-work/synth/gen.mjs), not measured traffic. Swap in real Optel bundles later.
  insights: {
    src: '/cohorts/cohorts.json',
    label: 'Illustrative',
    pages: {
      '/checking': 'Checking',
      '/savings': 'Savings',
      '/credit-cards': 'Credit cards',
      '/home-equity': 'Home equity',
      '/offers/free-checking': 'Free checking offer',
      '/appointment': 'Meet with a banker',
    },
  },

  // the site's conversion: open an account or book a banker
  conversion: {
    click: 'get started|open|apply|appointment|schedule',
    path: '^/(appointment|offers/)',
    label: 'open an account or book a banker',
  },

  memory: {
    storeKey: 'cohorts-v1',
    sessionGapMs: 30 * 60 * 1000,
    // US retail demo: no consent gate (decision recorded in the PR)
    requireConsent: false,
    // CSS selector of sign-in controls; a click marks this browser as signed in
    signIn: 'a[href*="login"], a[href*="signin"], a[href*="sign-in"], [data-signin]',
  },

  // what each experience is, for the Sankey, the review, the video and the demo panel
  experiences: {
    customer: { label: 'Customer: sign-in first', sub: 'Log in · top tasks · branch and banker · one offer' },
    prospect: { label: 'Prospect: answer & act', sub: 'Repeats the ad or the interest · open an account · meet a banker' },
    mobile: { label: 'Mobile: quick tasks', sub: 'Thumb-sized top tasks first · shorter page' },
    agent: { label: 'Personal agent: plain & actionable', sub: 'The task as a form · every product named · nothing hidden behind carousels' },
  },

  sources: [],

  rules: [
    {
      // An assistant browsing for one person (ChatGPT, Claude, Google, Manus, Meta agents).
      // First: the signal is explicit, and an agent matches no other rule.
      id: 'personal-agent',
      label: 'A personal AI agent is browsing',
      experience: 'agent',
      intent: 'utm',
      when: { agent: true },
      goal: { click: 'checking|savings|credit-cards|home-equity|appointment' },
      goalLabel: 'open a product page or book a banker',
    },
    {
      id: 'signed-in-before',
      label: 'Has signed in before',
      experience: 'customer',
      when: { signedIn: true },
      // not in Optel: views that click Log in today are recognised on their next visit
      model: { click: 'login|sign-in|signin' },
      goal: { click: 'login|sign-in|signin' },
      goalLabel: 'log in',
      support: { click: 'appointment|locator|contact' },
      supportLabel: 'branch, banker or customer service',
    },
    {
      id: 'ai-referred',
      label: 'Sent by an AI assistant',
      experience: 'prospect',
      when: { source: 'ai' },
      goal: { click: 'checking|savings|credit-cards|home-equity|appointment' },
      goalLabel: 'open a product page or book a banker',
      support: { click: 'offers|free-checking' },
      supportLabel: 'the current offer',
    },
    {
      id: 'campaign',
      label: 'Clicked an ad or campaign link',
      experience: 'prospect',
      intent: 'utm',
      when: { any: [{ paid: true }, { utm: { medium: '^(paid|cpc|ppc|display|paid[_-]?social|email)$' } }] },
      goal: { click: 'checking|savings|credit-cards|home-equity|appointment|offers' },
      goalLabel: 'continue to the advertised product',
    },
    {
      id: 'returning-interest',
      label: 'Back with a product interest',
      experience: 'prospect',
      intent: 'memory',
      when: { visits: { min: 2 }, interest: true, source: ['direct', 'search', 'other'] },
      // not in Optel: views that click into a product page today come back with that interest
      model: { clickIntent: true },
      goal: { click: 'checking|savings|credit-cards|home-equity|appointment|offers' },
      goalLabel: 'continue with that product',
    },
    {
      id: 'mobile-first-visit',
      label: 'First visit on a phone',
      experience: 'mobile',
      when: { device: 'mobile', visits: { max: 1 } },
      goal: { navigate: true },
      goalLabel: 'go to any page',
    },
  ],

  // demo panel (?demo): visitors to simulate, each sets real signals
  scenarios: [
    ['No signal', {}],
    ['A personal AI agent', { agent: 'chatgpt-agent' }],
    ['Has signed in before', {}, { visits: 3, signedIn: true }],
    ['From ChatGPT', { utm_source: 'chatgpt.com' }],
    ['Paid ad: free checking', { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'free-checking' }],
    ['Returning, looked at home equity', {}, { visits: 2, interests: { home: 3 } }],
    ['First visit on a phone', { cohort: 'mobile-first-visit' }],
  ],
};
