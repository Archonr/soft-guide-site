// One collection: every article describes a part of the Soft Guide platform, what it does, why
// it is built that way and what it costs. Where a topic also has hands-on history behind it,
// the article says so in one line ("experience") instead of reading as a client report.
import { caseStudies } from './portfolio.mjs';
import { notes } from './notes.mjs';

const caseBy = Object.fromEntries(caseStudies.map((c) => [c.slug, c]));
const noteBy = Object.fromEntries(notes.map((n) => [n.slug, n]));
const sections = (list) => list.map(([h, t]) => `<h2>${h}</h2><p>${t}</p>`).join('');
const outcome = (c) => {
  const s = c.sections.find(([h]) => h === 'What changed');
  return s ? `<h2>What it changes</h2><p>${s[1]}</p>` : '';
};

// [slug, case slug, note slug], in reading order.
const plan = [
  ['cells', 'cells', null],
  ['gitops-bridge-flux', null, 'gitops-bridge-flux'],
  ['cilium-from-the-first-node', null, 'cilium-from-the-first-node'],
  ['three-traffic-directions', 'networking-notes', null],
  ['one-way-to-the-internet', 'egress', 'one-way-to-the-internet'],
  ['declared-network-access', 'network-policy', 'declared-network-access'],
  ['admission-policies', 'admission', 'policies-proven-to-block'],
  ['guardrails', 'guardrails', 'guardrails-from-day-one'],
  ['one-role-for-every-service', null, 'one-role-for-every-service'],
  ['nodes-without-internet', null, 'nodes-without-internet'],
  ['atlantis-delivery', 'delivery', 'atlantis-policy-checks'],
  ['three-products-one-repository', null, 'three-products-one-repository'],
  ['upgrades-through-a-baseline-branch', null, 'upgrades-through-a-baseline-branch'],
  ['sre-agent', 'sre-agent', 'an-sre-agent-inside-the-cluster'],
];

// Where each note-only article lives in the packages.
const packageOf = {
  'gitops-bridge-flux': 'Launch package · every cell',
  'cilium-from-the-first-node': 'Launch package · every cell',
  'one-role-for-every-service': 'Launch package · every cell',
  'nodes-without-internet': 'Secure package',
  'three-products-one-repository': 'How every package is built and delivered',
  'upgrades-through-a-baseline-branch': 'Every package · delivered under a support plan',
};

export const articles = plan.map(([slug, cs, ns], i) => {
  const c = cs && caseBy[cs];
  const n = ns && noteBy[ns];
  return {
    slug,
    number: String(i + 1).padStart(2, '0'),
    title: c ? c.title : n.title,
    summary: c ? c.summary : n.summary,
    topics: [...new Set([...(c ? c.topics : []), ...(n ? n.topics : [])])],
    figure: c ? c.figure : null,
    experience: c ? c.role : null,
    package: c ? c.available : packageOf[slug],
    body: n ? n.body.join('') + (c ? outcome(c) : '') : sections(c.sections),
    // Old addresses that now point here.
    aliases: [cs && `work-${cs}.html`, ns && `notes-${ns}.html`].filter((a) => a && a !== `notes-${slug}.html`),
  };
});
