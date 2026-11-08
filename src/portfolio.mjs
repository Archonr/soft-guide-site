// Portfolio and platform content. Case studies describe work patterns, never a client or
// employer: no company, product, account or domain names appear here.

export const topics = {
  aws: 'AWS', pulumi: 'Pulumi', kubernetes: 'Kubernetes', cilium: 'Cilium',
  envoy: 'Envoy', flux: 'Flux', gitops: 'GitOps', cicd: 'CI/CD', kyverno: 'Kyverno',
  security: 'Security', observability: 'Observability', agents: 'AI agents'
};

// Small SVG vocabulary shared by the diagrams. Colours come from the theme tokens.
const box = (x, y, w, h, title, sub = '', kind = '') => `<g class="fig-box ${kind}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/><text x="${x + 14}" y="${y + (sub ? 24 : h / 2 + 5)}" class="fig-title">${title}</text>${sub ? `<text x="${x + 14}" y="${y + 43}" class="fig-sub">${sub}</text>` : ''}</g>`;
const arrow = (x1, y1, x2, y2, label = '', kind = '') => `<g class="fig-arrow ${kind}"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="url(#fig-head${kind ? '-' + kind : ''})"/>${label ? `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 + 20}" text-anchor="middle" class="fig-sub">${label}</text>` : ''}</g>`;
const svg = (w, h, label, body) => `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}"><defs><marker id="fig-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="fig-head"/></marker><marker id="fig-head-deny" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="9" markerHeight="9" orient="auto"><path d="M1 1L9 9M9 1L1 9" class="fig-deny"/></marker><marker id="fig-head-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="fig-head-accent"/></marker></defs>${body}</svg>`;

const diagrams = {
  cell: svg(860, 330, 'A cell: guardrails at the organization, a baseline per account, and inside the cell a VPC with three subnet tiers, EKS with Cilium, the egress gateway and Flux, which reads the GitOps repository.',
    box(10, 10, 840, 50, 'Organization guardrails', 'Attached once, where each rule is true') +
    box(10, 72, 840, 50, 'Account baseline', 'Boundaries, keyless CI access, secure defaults, budgets') +
    `<g class="fig-group"><rect x="10" y="134" width="840" height="186" rx="8"/><text x="24" y="158" class="fig-label">CELL · ONE VPC · ONE CLUSTER</text></g>` +
    box(30, 172, 250, 58, 'Public tier', 'NAT, load balancers') +
    box(30, 242, 250, 58, 'Egress tier', 'Gateway nodes only', 'accent') +
    box(300, 172, 260, 128, 'Private tier: EKS', 'Cilium · Karpenter · Pod Identity') +
    box(580, 172, 250, 58, 'Flux', 'Reads cell-gitops') +
    box(580, 242, 250, 58, 'Cell facts', 'published once for GitOps', 'accent') +
    arrow(300, 270, 282, 270) + arrow(155, 242, 155, 232) + arrow(705, 242, 705, 232)),

  egress: svg(860, 300, 'Three fences around one exit: an application pod has no route to the internet; it reaches the egress gateway on the egress tier, which forwards only allowlisted hosts through NAT. A direct attempt is dropped.',
    box(10, 40, 200, 66, 'Application pod', 'Private tier, no route out') +
    box(300, 30, 250, 86, 'Egress gateway', 'allowlist · every refusal logged', 'accent') +
    box(640, 40, 210, 66, 'NAT → Internet', 'Fixed source IPs') +
    arrow(210, 73, 298, 73, 'label opt-in') + arrow(550, 73, 638, 73, 'allowlisted', 'accent') +
    `<path d="M110 110 L110 220 L600 220" class="fig-path deny" marker-end="url(#fig-head-deny)"/><text x="130" y="210" class="fig-sub deny-text">direct to the internet: no route, dropped by policy, refused by the security group</text>` +
    `<text x="10" y="270" class="fig-label">FENCE 1 · ROUTING</text><text x="300" y="270" class="fig-label">FENCE 2 · NETWORK POLICY</text><text x="600" y="270" class="fig-label">FENCE 3 · ALLOWLIST</text>`),

  netpol: svg(860, 290, 'Capability-based network policy: a caller carries a capability label, its namespace lists the component, and the destination admits callers with the same label. A pod without the label is dropped.',
    box(10, 30, 240, 70, 'Caller pod', 'declares: payments') +
    box(10, 170, 240, 70, 'Other pod', 'no label') +
    box(330, 115, 220, 70, 'Namespace', 'opts in to payments') +
    box(610, 30, 240, 70, 'payments API', 'admits the same declaration', 'accent') +
    arrow(250, 65, 608, 65, 'allowed: one declaration, both sides', 'accent') +
    `<path d="M250 205 L560 205 L600 100" class="fig-path deny" marker-end="url(#fig-head-deny)"/><text x="300" y="235" class="fig-sub deny-text">default deny: dropped, and visible in the dropped-flow log</text>`),

  guardrails: svg(860, 300, 'Guardrail tree: Root carries root protection and the data perimeter, the Workloads OU carries boundaries and surface controls, Production adds write-path guards, Suspended denies everything. Accounts inherit from their OU.',
    box(300, 10, 260, 56, 'Root', 'root protection · data perimeter') +
    box(40, 110, 300, 56, 'Workloads OU', 'boundaries · regions · IMDSv2 · encryption') +
    box(560, 110, 260, 56, 'Suspended OU', 'deny all') +
    box(10, 210, 200, 56, 'Development') + box(230, 210, 200, 56, 'Staging') +
    box(450, 210, 260, 56, 'Production', 'CI-only images · code-only edges', 'accent') +
    arrow(430, 66, 190, 108) + arrow(430, 66, 690, 108) + arrow(190, 166, 110, 208) + arrow(190, 166, 330, 208) + arrow(190, 166, 580, 208)),

  admission: svg(860, 260, 'Admission policies are tested both ways: good fixtures must be admitted, bad fixtures must be rejected by the named policy, before a policy reaches a cluster.',
    box(10, 20, 230, 60, 'Policy', 'what must hold') +
    box(10, 110, 230, 60, 'Good fixtures', 'must pass') +
    box(10, 190, 230, 60, 'Bad fixtures', 'must fail, by name') +
    box(330, 95, 220, 90, 'Policy tests', 'on every change', 'accent') +
    box(640, 40, 210, 60, 'Audit in dev', 'violations reported') +
    box(640, 160, 210, 60, 'Enforce in prod', 'violations rejected', 'accent') +
    arrow(240, 50, 328, 120) + arrow(240, 140, 328, 140) + arrow(240, 220, 328, 160) + arrow(550, 125, 638, 75) + arrow(550, 155, 638, 185, '', 'accent')),

  delivery: svg(860, 250, 'Delivery: a pull request gets tests and a read-only preview checked against policy; after review and merge the deployment service applies the merged code, production after a person approves; a scheduled check reports drift.',
    box(10, 20, 190, 60, 'Pull request', 'tests and scans') +
    box(230, 20, 190, 60, 'Preview', 'read-only') +
    box(450, 20, 190, 60, 'Policy check', 'every preview, every update', 'accent') +
    box(670, 20, 180, 60, 'Merge, deploy', 'prod: a person approves') +
    box(450, 160, 400, 60, 'Drift check', 'every stack · an issue when it drifts') +
    arrow(200, 50, 228, 50) + arrow(420, 50, 448, 50) + arrow(640, 50, 668, 50, '', 'accent') + arrow(760, 158, 760, 82)),

  agent: svg(860, 300, 'The agents cluster: an alert, a schedule or a question starts a read-only investigation from outside production; the agent posts a bounded plan; a named person or an earned policy approves it; the agent carries it out with access that exists only for that plan; everything is recorded.',
    box(10, 20, 200, 60, 'Alert, schedule or chat') +
    box(260, 20, 250, 60, 'Investigate', 'read-only, from outside') +
    box(560, 20, 290, 60, 'Plan in chat', 'cause · evidence · bounded fix', 'accent') +
    box(560, 160, 290, 60, 'Approve', 'a named person, or earned policy') +
    box(260, 160, 250, 60, 'Act within the plan', 'temporary, plan-only access', 'accent') +
    box(10, 160, 200, 60, 'Record and learn', 'audit · lessons') +
    `<text x="10" y="270" class="fig-label">NO APPROVED PLAN → NO ACCESS · AGENTS NEVER APPROVE THEMSELVES</text>` +
    arrow(210, 50, 258, 50) + arrow(510, 50, 558, 50) + arrow(705, 82, 705, 158) + arrow(560, 190, 512, 190) + arrow(260, 190, 212, 190)),

  networking: svg(860, 280, 'Three traffic directions, three tools: north-south through Gateway API and the AWS load balancer controller; east-west on Cilium eBPF with node-local Envoy only where L7 is needed; egress through a dedicated Envoy gateway with authorization.',
    `<text x="20" y="24" class="fig-label">NORTH-SOUTH</text><text x="310" y="24" class="fig-label">EAST-WEST</text><text x="600" y="24" class="fig-label">EGRESS</text>` +
    box(10, 40, 260, 56, 'AWS ALB', 'data plane in AWS') + box(10, 120, 260, 56, 'LB controller', 'Gateway API → ALB') + box(10, 200, 260, 56, 'Workloads') +
    box(300, 40, 260, 56, 'Cilium eBPF', 'L3/L4 in the kernel', 'accent') + box(300, 120, 260, 56, 'Node-local Envoy', 'only where L7 is needed') + box(300, 200, 260, 56, 'Policy by identity', 'not by IP') +
    box(590, 40, 260, 56, 'Egress gateway', 'allowlist · authorization', 'accent') + box(590, 120, 260, 56, 'Hostname policy', 'second fence') + box(590, 200, 260, 56, 'NAT', 'fixed source IPs') +
    arrow(140, 96, 140, 118) + arrow(140, 176, 140, 198) + arrow(430, 96, 430, 118) + arrow(720, 96, 720, 118) + arrow(720, 176, 720, 198))
};

export const caseStudies = [
  {
    slug: 'cells', number: '01', title: 'A new region is a new cell, not a bigger cluster',
    summary: 'A platform that grows by adding identical, isolated cells, each with its own network and cluster, built from one reviewed definition.',
    topics: ['aws', 'pulumi', 'kubernetes', 'gitops', 'flux'],
    role: 'Designed the cell model, its infrastructure code and the bridge to GitOps.',
    diagram: 'cell',
    sections: [
      ['The problem', 'One large cluster per environment concentrates the blast radius. A bad policy, a networking upgrade or a noisy tenant takes everything down at once, and every upgrade becomes a high-stakes event nobody wants to schedule.'],
      ['The approach', 'The unit of deployment is a cell: one account and region, its own network, its own cluster, its own keys and identities. A new region, or a customer that needs isolation, is a new cell built from the same reviewed definition, not a variation of an existing one.'],
      ['The bridge', 'The facts a cell\'s workloads need are published once by the infrastructure code and consumed by GitOps, so the same manifests serve every cell and none of them names an account or a region.'],
      ['What changed', 'Blast radius became one cell. Upgrades roll cell by cell, development first. Creating a cell went from a project to a pull request.']
    ],
    available: 'Platform'
  },
  {
    slug: 'egress', number: '02', title: 'One way out to the internet',
    summary: 'Every outbound connection from a cluster leaves through a single allowlisting exit, behind independent fences at the routing, network-policy and application layers.',
    topics: ['aws', 'kubernetes', 'cilium', 'envoy', 'security'],
    role: 'Designed the egress model: an allowlisting exit for CI runners and cluster traffic. The platform extends the same exit to every workload and node.',
    diagram: 'egress',
    sections: [
      ['The problem', 'In most clusters any pod can open a connection to anywhere. Exfiltration, a cryptominer or a compromised dependency calling home needs nothing more. Network policy alone is one mistake away from open.'],
      ['The approach', 'Workloads have no route out. A single exit forwards only approved destinations and logs every refusal, and independent layers repeat the rule, so one mistake is caught by the next. Cloud APIs are reached privately and never leave the network.'],
      ['What changed', 'Leaving the network became a decision someone reviews, not a default. A new external dependency is a one-line change in a pull request, and an unexpected destination shows up as a refusal instead of a successful connection.']
    ],
    available: 'Secure · also sold on its own'
  },
  {
    slug: 'network-policy', number: '03', title: 'Network access a service declares, not one it inherits',
    summary: 'Default-deny networking where each workload declares what it depends on, each destination admits exactly those callers, and a narrowly privileged pipeline applies the policies.',
    topics: ['kubernetes', 'cilium', 'gitops', 'flux', 'security'],
    role: 'Designed the declaration model, the policy repository and its review rules; migrated broad legacy rules with measured parity.',
    diagram: 'netpol',
    sections: [
      ['The problem', 'Hand-written network policies drift. Callers and destinations are edited in different places, a copied rule grants more than intended, and a "temporary" broad rule becomes permanent because nobody can prove what removing it would break.'],
      ['The approach', 'Every namespace starts closed. Callers declare their dependencies and destinations admit the same declaration, so the two sides cannot drift apart. A resource only one workload uses can never be shared by declaration.'],
      ['Guardrails on the guardrails', 'Policies are applied by an identity that can do nothing else, CI refuses the rule shapes that quietly open everything, and dropped flows are reported so a missing rule becomes a ticket instead of a mystery timeout.'],
      ['What changed', 'Who may talk to whom became readable in one place and reviewable in one pull request. Broad rules were removed only after real traffic showed the replacement covered every flow.']
    ],
    available: 'Secure · Kubernetes hardening module'
  },
  {
    slug: 'guardrails', number: '04', title: 'Guardrails an account inherits on day one',
    summary: 'Organization-wide guardrails consolidated from per-account copies into one baseline, changed only with evidence that nothing legitimate breaks.',
    topics: ['aws', 'security', 'pulumi'],
    role: 'Audited the existing policies, designed the target layout and the rollout, built the verification tooling.',
    diagram: 'guardrails',
    sections: [
      ['The problem', 'Guardrails had grown account by account: the same rule copied with a different list, some accounts at the quota, new accounts with no guardrails at all. Nobody could say which controls an account actually had.'],
      ['The approach', 'One rule lives in one place, at the highest level where it is true: the organization protects its audit trail and most powerful identities, workload accounts get boundaries and secure defaults, production adds guards on its write paths, and data stores stay closed to the outside.'],
      ['Changing guardrails safely', 'Organization policies have no audit mode, so a broken one is found by an outage. Every change is tested offline, checked against how the organization really behaved, and introduced next to the old rules before anything is removed, production last.'],
      ['What changed', 'Dead and duplicated policies went first with no change in effective access, and the layout became a small set an engineer can read in one sitting. The evidence step caught a change that would have stopped production autoscaling before it shipped.']
    ],
    available: 'Secure · AWS guardrails module, also sold on its own'
  },
  {
    slug: 'admission', number: '05', title: 'Admission policies that are proven to block',
    summary: 'Kubernetes admission policies that ship with proof that they reject what they should, reported in development and enforced in production.',
    topics: ['kubernetes', 'kyverno', 'security', 'gitops'],
    role: 'Wrote the policy set and the exception model, built the test harness and the promotion process.',
    diagram: 'admission',
    sections: [
      ['The problem', 'A policy that looks right in review can block nothing. Those failures are silent by nature, and they surface during an incident, not before it.'],
      ['The approach', 'Built-in Pod Security covers the basics; the platform adds rules for image provenance and signatures, resource and health requirements, public exposure, cluster-wide rights and secret delivery.'],
      ['Tested both ways', 'Every policy ships with examples that must pass and examples that must be rejected by it. Development reports violations before production refuses them. Exceptions name an owner, a reason and an expiry.'],
      ['What changed', 'A policy that blocks nothing can no longer pass review. Admission became something teams can predict rather than a wall they discover at deploy time.']
    ],
    available: 'Secure · Kubernetes hardening module'
  },
  {
    slug: 'delivery', number: '06', title: 'Nobody applies from a laptop',
    summary: 'Infrastructure delivery where every change shows a preview, is checked against security policy, is applied only from reviewed, merged code, and drift is found on a schedule.',
    topics: ['cicd', 'pulumi', 'aws', 'security'],
    role: 'Designed the CI identities and the reusable pipeline library. The platform adds policy checks on every preview and update, signed images and admission-time verification.',
    diagram: 'delivery',
    sections: [
      ['The problem', 'Applies from laptops mean unreviewed changes, credentials on laptops and no record of what was applied when. Console fixes become the new normal until the next apply silently reverts them.'],
      ['The approach', 'Infrastructure is tested code. Every change gets a read-only preview on the pull request, checked against security policy. Only reviewed, merged code is applied, by a deployment service with its own identity; production waits for a person. The policies cannot be weakened by the change they judge.'],
      ['Identity and supply chain', 'No long-lived keys anywhere. Third-party code is pinned, images are scanned, described and signed, and clusters admit only images the organization built.'],
      ['What changed', 'Only the code a reviewer approved reaches an account, and security rules are enforced on every change rather than remembered by reviewers.']
    ],
    available: 'Platform · CI/CD module, also sold on its own'
  },
  {
    slug: 'sre-agent', number: '07', title: 'Agents that operate production within your rules',
    summary: 'A separate cluster of SRE and DevSecOps agents: they investigate every alert from outside production, and act only on a plan a named person approved, with access that exists for that plan alone.',
    topics: ['agents', 'observability', 'kubernetes', 'security'],
    role: 'Designed the agents cluster, its access and approval model, the agents\' knowledge and their evaluation, and earlier a production SRE agent.',
    diagram: 'agent',
    sections: [
      ['The problem', 'Teams cannot staff round-the-clock on-call, and most alerts need the same first hour of work. The risk with an AI doing that work is not that it is slow; it is that it acts with too much power on too little evidence.'],
      ['The approach', 'The agents run in their own cluster and look at production from outside. They read by default, never secret values. To act, an agent posts a bounded plan with its evidence, success check and rollback; a named person approves it in chat, and the agent carries it out with access that exists only for that plan.'],
      ['Autonomy, earned', 'Each kind of action starts behind approval and can run on its own only after a reviewed record of harmless runs, falling back to approval on the first mistake. The riskiest changes never become autonomous.'],
      ['What changed', 'Alerts arrive investigated, fixes arrive as plans or pull requests, and nobody, human or agent, holds standing write access to production. Every step is recorded.']
    ],
    available: 'AI Factory · for enterprises'
  },
  {
    slug: 'networking-notes', number: '08', title: 'North-south, east-west, egress: three directions, three tools',
    summary: 'Notes from choosing a Kubernetes networking stack: the strongest component for each traffic direction instead of one product that does all three adequately.',
    topics: ['kubernetes', 'cilium', 'envoy', 'aws'],
    role: 'Research and architecture notes, verified against a running cluster.',
    diagram: 'networking',
    sections: [
      ['North-south', 'Gateway API as the interface and the cloud load balancer as the data plane, so no extra proxy runs in the cluster just to receive traffic. The trade-off is slower reaction to changes, which must be tested against your availability targets.'],
      ['East-west', 'L3 and L4 in the kernel with policy by workload identity, and L7 only where it is genuinely needed, on the node rather than in a sidecar in every pod.'],
      ['Egress', 'A central exit that reads each request and can ask business logic before letting it out, with source-address control underneath it rather than instead of it.'],
      ['Mental models', 'eBPF is not L7, and the kernel cannot parse HTTP. Transparency is ergonomics; latency is hops. Gateway API is a specification, not a product.']
    ],
    available: 'Architecture review · part of every level'
  }
].map(c => ({...c, figure: diagrams[c.diagram].replaceAll('id="fig-head', `id="${c.slug}-head`).replaceAll('url(#fig-head', `url(#${c.slug}-head`)}));

export const platform = {
  tiers: [
    {id: 'platform', name: 'Platform', page: 'platform.html', lead: 'You have a product. You need somewhere production-grade to run it.',
      items: ['AWS organization and landing zone', 'A cell: VPC, EKS on Graviton, Cilium, Karpenter', 'GitOps with Flux; AWS as tested Go code on Pulumi', 'Previews on pull requests, a mandatory policy pack, reviewed deployments, drift detection', 'Prometheus, Grafana, Loki and Tempo with alerts as code', 'Architecture guide, runbooks and a handover week']},
    {id: 'secure', name: 'Secure', page: 'secure.html', lead: 'Everything in Platform, plus the controls auditors and attackers both test first.',
      items: ['Organization guardrails: SCPs and RCPs with offline tests', 'Admission policy, tested both ways, enforced in production', 'Default-deny network policy with declared capabilities', 'One controlled path to the internet', 'Secrets with rotation; backups with tested restores', 'Evidence pack mapped to CIS and AWS Foundational Security Best Practices']},
    {id: 'ai-factory', name: 'AI Factory', page: 'ai-factory.html', lead: 'Agents that operate production and fix your CI, on top of Secure or alongside a platform you already run. For enterprises.',
      items: ['SRE agent: investigates every alert, reports cause and evidence', 'DevSecOps agent: turns findings into fixes as pull requests', 'CI agents: adapt the code when a dependency update breaks the build', 'Agents act on plans a named person approves, with access that exists only for that plan', 'Autonomy earned per kind of action from a reviewed record', 'Agents in their own cluster, outside your production', 'Full audit, from the alert to the approver']}
  ],
  modules: [
    ['CI/CD foundation', 'Reviewed infrastructure deployments with a policy pack, reusable pipelines, OIDC to AWS, signed images, drift detection.'],
    ['AWS guardrails', 'SCPs and RCPs, permission boundaries, a dry run against your CloudTrail history.'],
    ['Kubernetes hardening', 'Admission policy, default-deny network policy, workload identity.'],
    ['Controlled egress', 'One allowlisted path out for clusters and CI runners.'],
    ['Observability', 'Metrics, logs, traces, SLO burn-rate alerts, dashboards as code.'],
    ['Agents', 'For production and CI you already run: starts read-only, earns the right to act. Enterprise.'],
    ['Autonomy assessment', 'Where your operations are on the six levels, and what the next level needs.']
  ],
  steps: [
    ['Discover', 'One week. Your product, constraints and compliance needs, written down as decisions you can review.'],
    ['Build', 'Three to six weeks. The baseline, adapted to you, in your GitHub organization and your AWS accounts from the first day.'],
    ['Hand over', 'Runbooks, decision records and a pairing week. Your team can operate and extend everything.'],
    ['Operate, optionally', 'Upgrades, reviews and on-call for the platform, or agents that operate it under your rules.']
  ]
};
