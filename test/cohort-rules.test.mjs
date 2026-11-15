import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchRule } from '../scripts/cohorts.js';
import rules from '../scripts/cohort-rules.js';

const s = (o) => ({
  refHost: '', source: 'direct', utm: {}, paid: [], device: 'desktop', bot: false, memory: {}, ...o,
});

test('no signal gets the original homepage', () => {
  assert.equal(matchRule(rules, s({})).rule, null);
});

test('a personal agent gets the agent experience, before anything else', () => {
  const m = matchRule(rules, s({ agent: 'chatgpt-agent', memory: { signedIn: true } }));
  assert.equal(m.rule, 'personal-agent');
  assert.equal(m.experience, 'agent');
});

test('signed in before is a customer', () => {
  assert.equal(matchRule(rules, s({ memory: { signedIn: true, visits: 3 } })).experience, 'customer');
});

test('AI referrals are prospects', () => {
  assert.equal(matchRule(rules, s({ source: 'ai' })).rule, 'ai-referred');
});

test('a free-checking ad is a prospect with the checking intent', () => {
  const m = matchRule(rules, s({ source: 'search', utm: { medium: 'cpc', campaign: 'free-checking' } }));
  assert.equal(m.rule, 'campaign');
  assert.equal(m.intent, 'checking');
});

test('returning with a home interest is a prospect with the home intent', () => {
  const m = matchRule(rules, s({ memory: { visits: 2, interests: { home: 3 } } }));
  assert.equal(m.rule, 'returning-interest');
  assert.equal(m.intent, 'home');
});

test('first visit on a phone is mobile', () => {
  assert.equal(matchRule(rules, s({ device: 'mobile', memory: { visits: 1 } })).rule, 'mobile-first-visit');
});
