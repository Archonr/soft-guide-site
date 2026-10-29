// Portfolio and platform content. Case studies describe work patterns, never a client or
// employer: no company, product, account or domain names appear here.

export const topics = {
  aws: 'AWS', terraform: 'Terraform', terramate: 'Terramate', kubernetes: 'Kubernetes', cilium: 'Cilium',
  envoy: 'Envoy', flux: 'Flux', gitops: 'GitOps', cicd: 'CI/CD', kyverno: 'Kyverno',
  security: 'Security', observability: 'Observability', agents: 'AI agents'
};

// Small SVG vocabulary shared by the diagrams. Colours come from the theme tokens.
const box = (x, y, w, h, title, sub = '', kind = '') => `<g class="fig-box ${kind}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/><text x="${x + 14}" y="${y + (sub ? 24 : h / 2 + 5)}" class="fig-title">${title}</text>${sub ? `<text x="${x + 14}" y="${y + 43}" class="fig-sub">${sub}</text>` : ''}</g>`;
const arrow = (x1, y1, x2, y2, label = '', kind = '') => `<g class="fig-arrow ${kind}"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="url(#fig-head${kind ? '-' + kind : ''})"/>${label ? `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 + 20}" text-anchor="middle" class="fig-sub">${label}</text>` : ''}</g>`;
const svg = (w, h, label, body) => `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}"><defs><marker id="fig-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="fig-head"/></marker><marker id="fig-head-deny" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="9" markerHeight="9" orient="auto"><path d="M1 1L9 9M9 1L1 9" class="fig-deny"/></marker><marker id="fig-head-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="fig-head-accent"/></marker></defs>${body}</svg>`;

const diagrams = {
  cell: svg(860, 330, 'A cell: guardrails at the organization, a baseline per account, and inside the cell a VPC with three subnet tiers, EKS with Cilium, the egress gateway and Flux, which reads the GitOps repository.',
    box(10, 10, 840, 50, 'Organization guardrails', 'Five SCPs and one RCP, attached once per OU') +
    box(10, 72, 840, 50, 'Account baseline', 'Permissions boundaries, CI roles over OIDC, encryption and IMDSv2 defaults, budgets') +
    `<g class="fig-group"><rect x="10" y="134" width="840" height="186" rx="8"/><text x="24" y="158" class="fig-label">CELL · ONE VPC · ONE CLUSTER</text></g>` +
    box(30, 172, 250, 58, 'Public tier', 'NAT, load balancers') +
    box(30, 242, 250, 58, 'Egress tier', 'Gateway nodes only', 'accent') +
    box(300, 172, 260, 128, 'Private tier: EKS', 'Cilium · Karpenter · Pod Identity') +
    box(580, 172, 250, 58, 'Flux', 'Reads cell-gitops') +
    box(580, 242, 250, 58, 'cell-metadata', 'AWS facts → ${variables}', 'accent') +
    arrow(300, 270, 282, 270) + arrow(155, 242, 155, 232) + arrow(705, 242, 705, 232)),

  egress: svg(860, 300, 'Three fences around one exit: an application pod has no route to the internet; it reaches the egress gateway on the egress tier, which forwards only allowlisted hosts through NAT. A direct attempt is dropped.',
    box(10, 40, 200, 66, 'Application pod', 'Private tier, no route out') +
    box(300, 30, 250, 86, 'Egress gateway', 'Envoy CONNECT · allowlist · 403 log', 'accent') +
    box(640, 40, 210, 66, 'NAT → Internet', 'Fixed source IPs') +
    arrow(210, 73, 298, 73, 'label opt-in') + arrow(550, 73, 638, 73, 'allowlisted', 'accent') +
    `<path d="M110 110 L110 220 L600 220" class="fig-path deny" marker-end="url(#fig-head-deny)"/><text x="130" y="210" class="fig-sub deny-text">direct to the internet: no route, dropped by policy, refused by the security group</text>` +
    `<text x="10" y="270" class="fig-label">FENCE 1 · ROUTE TABLE</text><text x="300" y="270" class="fig-label">FENCE 2 · CILIUM toFQDNs</text><text x="600" y="270" class="fig-label">FENCE 3 · ENVOY ALLOWLIST</text>`),

  netpol: svg(860, 290, 'Capability-based network policy: a caller carries a capability label, its namespace lists the component, and the destination admits callers with the same label. A pod without the label is dropped.',
    box(10, 30, 240, 70, 'Caller pod', 'netpol…/svc-payments: "true"') +
    box(10, 170, 240, 70, 'Other pod', 'no label') +
    box(330, 115, 220, 70, 'Namespace', 'lists component svc-payments') +
    box(610, 30, 240, 70, 'payments API', 'admits the same label', 'accent') +
    arrow(250, 65, 608, 65, 'allowed: one label, both sides', 'accent') +
    `<path d="M250 205 L560 205 L600 100" class="fig-path deny" marker-end="url(#fig-head-deny)"/><text x="300" y="235" class="fig-sub deny-text">default deny: dropped, and visible in the dropped-flow log</text>`),

  guardrails: svg(860, 300, 'Guardrail tree: Root carries root protection and the data perimeter, the Workloads OU carries boundaries and surface controls, Production adds write-path guards, Suspended denies everything. Accounts inherit from their OU.',
    box(300, 10, 260, 56, 'Root', 'root protection · data perimeter') +
    box(40, 110, 300, 56, 'Workloads OU', 'boundaries · regions · IMDSv2 · encryption') +
    box(560, 110, 260, 56, 'Suspended OU', 'deny all') +
    box(10, 210, 200, 56, 'Development') + box(230, 210, 200, 56, 'Staging') +
    box(450, 210, 260, 56, 'Production', 'CI-only images · code-only edges', 'accent') +
    arrow(430, 66, 190, 108) + arrow(430, 66, 690, 108) + arrow(190, 166, 110, 208) + arrow(190, 166, 330, 208) + arrow(190, 166, 580, 208)),

  admission: svg(860, 260, 'Admission policies are tested both ways: good fixtures must be admitted, bad fixtures must be rejected by the named policy, before a policy reaches a cluster.',
    box(10, 20, 230, 60, 'Policy (CEL)', 'what must hold') +
    box(10, 110, 230, 60, 'Good fixtures', 'must pass') +
    box(10, 190, 230, 60, 'Bad fixtures', 'must fail, by name') +
    box(330, 95, 220, 90, 'Policy tests', 'in CI, every PR', 'accent') +
    box(640, 40, 210, 60, 'Audit in dev', 'violations reported') +
    box(640, 160, 210, 60, 'Enforce in prod', 'violations rejected', 'accent') +
    arrow(240, 50, 328, 120) + arrow(240, 140, 328, 140) + arrow(240, 220, 328, 160) + arrow(550, 125, 638, 75) + arrow(550, 155, 638, 185, '', 'accent')),

  delivery: svg(860, 250, 'Delivery: a pull request gets checks and a plan for changed stacks only; merge applies behind a protected environment; a nightly plan opens an issue on drift.',
    box(10, 20, 190, 60, 'Pull request', 'fmt · lint · scans · tests') +
    box(230, 20, 190, 60, 'Plan', 'changed stacks only') +
    box(450, 20, 190, 60, 'Review', 'plan in the PR', 'accent') +
    box(670, 20, 180, 60, 'Apply', 'protected env, OIDC') +
    box(450, 160, 400, 60, 'Nightly drift check', 'plan every stack · issue per drifted stack') +
    arrow(200, 50, 228, 50) + arrow(420, 50, 448, 50) + arrow(640, 50, 668, 50, '', 'accent') + arrow(760, 158, 760, 82)),

  agent: svg(860, 300, 'The SRE agent: an alert or a question starts a read-only investigation; the agent reports cause and evidence; a fix becomes a runbook action that needs one approval in chat, or a pull request that needs review.',
    box(10, 20, 200, 60, 'Alert, sweep or chat') +
    box(260, 20, 250, 60, 'Investigate', 'read-only, own identity') +
    box(560, 20, 290, 60, 'Report in chat', 'cause · evidence · proposed fix', 'accent') +
    box(260, 160, 250, 60, 'Runbook action', 'one approval, audited') +
    box(560, 160, 290, 60, 'Pull request', 'CI, review, GitOps') +
    `<text x="10" y="270" class="fig-label">NO APPROVAL → NOTHING CHANGES · THE AGENT NEVER APPROVES ITSELF</text>` +
    arrow(210, 50, 258, 50) + arrow(510, 50, 558, 50) + arrow(650, 82, 400, 158) + arrow(705, 82, 705, 158)),

  networking: svg(860, 280, 'Three traffic directions, three tools: north-south through Gateway API and the AWS load balancer controller; east-west on Cilium eBPF with node-local Envoy only where L7 is needed; egress through a dedicated Envoy gateway with authorization.',
    `<text x="20" y="24" class="fig-label">NORTH-SOUTH</text><text x="310" y="24" class="fig-label">EAST-WEST</text><text x="600" y="24" class="fig-label">EGRESS</text>` +
    box(10, 40, 260, 56, 'AWS ALB', 'data plane in AWS') + box(10, 120, 260, 56, 'LB controller', 'Gateway API → ALB') + box(10, 200, 260, 56, 'Workloads') +
    box(300, 40, 260, 56, 'Cilium eBPF', 'L3/L4 in the kernel', 'accent') + box(300, 120, 260, 56, 'Node-local Envoy', 'only where L7 is needed') + box(300, 200, 260, 56, 'Policy by identity', 'not by IP') +
    box(590, 40, 260, 56, 'Envoy egress gateway', 'allowlist · ext_authz', 'accent') + box(590, 120, 260, 56, 'Cilium FQDN policy', 'second fence') + box(590, 200, 260, 56, 'NAT', 'fixed source IPs') +
    arrow(140, 96, 140, 118) + arrow(140, 176, 140, 198) + arrow(430, 96, 430, 118) + arrow(720, 96, 720, 118) + arrow(720, 176, 720, 198))
};

export const caseStudies = [
  {
    slug: 'cells', number: '01', title: 'A new region is a new cell, not a bigger cluster',
    summary: 'A platform that grows by adding identical, isolated cells: one VPC and one cluster each, built from one module and handed to GitOps through a single ConfigMap.',
    topics: ['aws', 'terraform', 'terramate', 'kubernetes', 'gitops', 'flux'],
    role: 'Designed the cell model, wrote the Terraform module and the Terramate layout, built the GitOps bridge.',
    diagram: 'cell',
    sections: [
      ['The problem', 'One large cluster per environment concentrates the blast radius. A bad admission policy, a CNI upgrade or a noisy tenant takes everything down at once, and every upgrade becomes a high-stakes event that nobody wants to schedule.'],
      ['The approach', 'The unit of deployment became a cell: one account and region, one VPC with private, egress and public tiers, one EKS cluster, its own keys and identities. A new region or a customer that needs isolation is a new cell. Terramate globals cascade from the organization through the account to the cell, so a new cell is one small stack file; the backend, providers and module call are generated and committed so reviewers read real Terraform.'],
      ['The bridge', 'Terraform knows the AWS facts that manifests need: role ARNs, queue names, key ARNs, the VPC. It writes them once into a cell-metadata ConfigMap, and every Flux Kustomization substitutes ${variables} from it. Manifests carry no account, region or ARN, so one GitOps tree serves every cell. Terraform installs only what must exist before Flux: Cilium, the egress gateway and Flux itself.'],
      ['What changed', 'Blast radius became one cell. Upgrades roll cell by cell, development first. Creating a cell went from a project to a pull request, and the same reviewed code builds every one of them.']
    ],
    available: 'Launch package · cell-platform and cell-gitops baselines'
  },
  {
    slug: 'egress', number: '02', title: 'One way out to the internet',
    summary: 'Every outbound connection from a cluster leaves through a single gateway that allowlists hostnames, behind three independent fences: routing, CNI policy and an L7 proxy.',
    topics: ['aws', 'kubernetes', 'cilium', 'envoy', 'security'],
    role: 'Designed the egress model: an allowlisting proxy as the only exit for CI runners and cluster control traffic, FQDN policies for workloads. The baseline extends the same exit to every pod and node.',
    diagram: 'egress',
    sections: [
      ['The problem', 'In most clusters any pod can open a connection to anywhere. Exfiltration, a cryptominer or a compromised dependency calling home needs nothing more. Network policies alone are one mistake away from open: a broad rule, a missing selector, an agent left in audit mode.'],
      ['The approach', 'Node and pod subnets have no default route. Only a dedicated egress tier routes to NAT, and only the egress gateway runs there. The gateway is an Envoy CONNECT proxy that forwards allowlisted host:port pairs and answers everything else with a 403 and a log line. Around it, a Cilium toFQDNs policy repeats the allowlist at the CNI layer, and a security group lets only that tier send HTTPS out of the VPC. AWS APIs go through VPC endpoints and never touch the gateway.'],
      ['The details that matter', 'Wildcards only for a vendor\'s own zone, never a public suffix or a multi-tenant storage domain: those are exfiltration channels, not allowlist entries. Nodes pull container images through the same gateway, so even image pulls follow the policy. The allowlist doubles as documentation of everything the platform talks to.'],
      ['What changed', 'Leaving the network became a decision someone reviews, not a default. A new external dependency is a one-line change in a pull request, and an unexpected destination shows up as a 403 and a dropped flow instead of a successful connection.']
    ],
    available: 'Secure package · also sold on its own'
  },
  {
    slug: 'network-policy', number: '03', title: 'Network access a service declares, not one it inherits',
    summary: 'Default-deny networking where each workload declares its dependencies by label, each destination admits the same label, and a separate, narrowly privileged pipeline applies the policies.',
    topics: ['kubernetes', 'cilium', 'gitops', 'flux', 'security'],
    role: 'Designed the capability model, the policy repository and its review rules; migrated broad legacy rules with measured parity.',
    diagram: 'netpol',
    sections: [
      ['The problem', 'Hand-written network policies drift. Callers and the allow-lists of what they call are edited in different places, a copied rule grants more than intended, and a "temporary" broad rule becomes permanent because nobody can prove what removing it would break.'],
      ['The approach', 'Every tenant namespace is deny-by-default. A shared dependency is a capability: a reusable component the namespace lists and a label the workload carries. The destination admits callers by that same label, so the two sides cannot drift apart. A destination only one workload uses, such as its own bucket, is a private numbered policy, so a label can never grant access to someone else\'s data.'],
      ['Guardrails on the guardrails', 'Policies live in their own path, applied by a service account that can manage Cilium policies and nothing else. CI rejects world, cluster-wide or 0.0.0.0/0 allows, broad FQDN patterns, CIDR rules without ports, and the cross-namespace selector that silently means "this namespace only". Dropped flows are exported and alerted on, which turns a missing rule into a ticket instead of a mystery timeout.'],
      ['What changed', 'Who may talk to whom became readable in one directory and reviewable in one pull request. Broad rules were removed only after real traffic showed the replacement covered every flow: parity first, removal second, evidence always.']
    ],
    available: 'Secure package · Kubernetes hardening module'
  },
  {
    slug: 'guardrails', number: '04', title: 'Guardrails an account inherits on day one',
    summary: 'Organization-wide SCP and RCP guardrails consolidated from per-account copies into one baseline per OU, with offline tests and a dry run against real CloudTrail history.',
    topics: ['aws', 'security', 'terraform'],
    role: 'Audited the existing policies, designed the target layout and the rollout, built the verification tooling.',
    diagram: 'guardrails',
    sections: [
      ['The problem', 'Guardrails had grown account by account: the same rule copied with a different list of ARNs, some accounts at the five-policy quota, new accounts with no guardrails at all. Nobody could say which controls an account actually had without reading every policy on its path.'],
      ['The approach', 'One rule lives in one place, at the highest level where it is true. Root protects the audit trail, the root user and the tags that grant privilege. The workloads OU requires permission boundaries, locks regions, enforces IMDSv2 and encryption, and removes interactive host access. Production adds write-path guards: only CI publishes images, only autoscalers start instances, only code changes cluster access and network edges. A resource control policy keeps S3, Secrets Manager and KMS closed to principals outside the organization and to plain HTTP.'],
      ['Changing guardrails safely', 'SCPs have no audit mode, so a broken one is found by an outage. Every change passes offline tests for quota, Deny-only content and break-glass exemptions, then a replay of ninety days of CloudTrail against the candidate policy lists every principal it would have denied. New policies attach alongside the old ones for 48 hours before anything is removed, OU by OU, production last.'],
      ['What changed', 'Dead and duplicated policies went first, cutting the custom set by a third with no change in effective access. The target layout takes it from nineteen policies to six and from thirteen account-level attachments to one deliberate exception, rolled out OU by OU. The dry run has already paid for itself: it caught a change that would have stopped node autoscaling in production before it shipped.']
    ],
    available: 'Secure package · AWS guardrails module, also sold on its own'
  },
  {
    slug: 'admission', number: '05', title: 'Admission policies that are proven to block',
    summary: 'Kubernetes admission policy written in CEL, tested with good and bad fixtures on every pull request, reported in development and enforced in production.',
    topics: ['kubernetes', 'kyverno', 'security', 'gitops'],
    role: 'Wrote the policy set and the exception model, built the test harness and the promotion process.',
    diagram: 'admission',
    sections: [
      ['The problem', 'A policy that looks right in review can block nothing: a verb that does not exist, a check on a field an attacker controls, a match that never fires. Those failures are silent by nature, and they surface during an incident, not before it.'],
      ['The approach', 'Pod Security Admission covers privileged pods and host access natively; Kyverno CEL policies add what it does not: images only from the platform registry and signed by the release workflow, pinned versions, requests and memory limits, probes, read-only root filesystems, no default service accounts, no public load balancers without an approval reference and source ranges, cluster-admin bound only by GitOps, and a namespace syncing only its own secrets.'],
      ['Tested both ways', 'Every policy ships with fixtures that must be admitted and fixtures that must be rejected by that policy by name. The same policies run in Audit in development, so teams see violations before production rejects them. Exceptions exist, but each names its owner, its reason and its expiry, and exempts a workload, never a namespace.'],
      ['What changed', 'A policy that blocks nothing can no longer pass review, because its test fails. Admission policy became something teams can predict, rather than a wall they discover at deploy time.']
    ],
    available: 'Secure package · Kubernetes hardening module'
  },
  {
    slug: 'delivery', number: '06', title: 'Nobody applies from a laptop',
    summary: 'Infrastructure delivery through GitHub Actions with OIDC: plans for changed stacks on every pull request, applies behind a protected environment, nightly drift detection, a supply chain signed end to end.',
    topics: ['cicd', 'terraform', 'terramate', 'aws', 'security'],
    role: 'Designed the CI roles and workflows and the reusable pipeline library with its versioning. The baseline adds image signing and admission-time verification.',
    diagram: 'delivery',
    sections: [
      ['The problem', 'Applies from laptops mean unreviewed changes, credentials on laptops and no record of what was applied when. Console fixes become the new normal until the next apply silently reverts them.'],
      ['The approach', 'CI reaches AWS through OIDC with three roles per repository, each trusted only from where it is used: plan from pull requests, apply from a protected environment, publish from release tags. Only changed stacks are planned, and the plan is posted to the pull request. A nightly plan of every stack opens one issue per drifted stack.'],
      ['Supply chain', 'Third-party actions are pinned to commit SHAs; tool versions come from one file for laptops and CI alike. Images are built, scanned, given an SBOM and signed with keyless cosign; the cluster admits only images signed by the organization\'s release workflow. Build steps run with an allowlisted environment, so a dependency\'s install script never sees cloud credentials or the job token.'],
      ['What changed', 'Every change has a pull request, a plan and an approval. Drift is found the next morning instead of during the next incident.']
    ],
    available: 'Launch package · CI/CD module, also sold on its own'
  },
  {
    slug: 'sre-agent', number: '07', title: 'An on-call engineer that never acts alone',
    summary: 'An AI SRE agent inside the cluster: it investigates every alert with read-only tools, reports cause and evidence in chat, and changes nothing without a human approval checked in code.',
    topics: ['agents', 'observability', 'kubernetes', 'security'],
    role: 'Designed the agent\'s safety model and permissions, built its tools, skills and approval flow, and its evaluation suite.',
    diagram: 'agent',
    sections: [
      ['The problem', 'Small teams cannot staff round-the-clock on-call, and most alerts need the same first hour of work: which service, since when, what changed, what the logs say. The risk with an AI doing that work is not that it is slow; it is that it acts with too much power on too little evidence.'],
      ['The approach', 'The agent runs in the cluster with its own identity. It reads metrics, logs, traces, Kubernetes objects, GitOps state and the code, but not secrets. It answers in a fixed shape: verdict, observed facts with the query that produced each one, hypotheses and how each was tested, blast radius, and one next action. A measurement that is the same in the incident window and a healthy window is a precondition, not a cause.'],
      ['Approval by blast radius', 'Reading needs no approval. A runbook action, such as restarting a deployment or resuming a reconciliation, runs under a separate operator identity after one approval in chat; the approver is checked in code against the chat identity, not in the prompt, and no answer within thirty minutes counts as a rejection. Anything else is a pull request that goes through CI and review. Secret values are redacted from every message and refused in commits, and every run has a spend limit.'],
      ['What changed', 'Alerts arrive already investigated. People decide; the agent does the legwork and leaves an audit trail of every tool call and every decision.']
    ],
    available: 'Autonomous package · also sold for an existing cluster'
  },
  {
    slug: 'networking-notes', number: '08', title: 'North-south, east-west, egress: three directions, three tools',
    summary: 'Notes from choosing a Kubernetes networking stack: the strongest component for each traffic direction instead of one product that does all three adequately.',
    topics: ['kubernetes', 'cilium', 'envoy', 'aws'],
    role: 'Research and architecture notes, verified against a running cluster.',
    diagram: 'networking',
    sections: [
      ['North-south', 'Gateway API as the interface, the AWS Load Balancer Controller as the implementation. The data plane stays in the AWS load balancer, so no extra proxy runs in the cluster just to receive traffic. The trade-off: target registration is an external control-plane operation and reacts more slowly than an in-cluster proxy, so test it against your availability targets.'],
      ['East-west', 'Cilium handles L3 and L4 in the kernel with eBPF, and policy is by workload identity, not IP. Where L7 is genuinely needed (gRPC routing, retries, circuit breaking, L7 policy), traffic is redirected to a node-local Envoy, not a sidecar in every pod. The Gateway API mesh profile describes those routes in a standard API; it standardises routing, not mutual TLS, which is a separate decision.'],
      ['Egress', 'The requirement is stronger than a stable source IP: a central point that reads the request and asks business logic before letting it out. A dedicated Envoy gateway does that, with external authorization served over a Unix socket inside the same pod, so the decision costs no network hop. Cilium\'s egress gateway is a different tool: L3 and L4 source-address control, useful underneath, not a replacement.'],
      ['Mental models', 'eBPF is not L7, and the kernel cannot parse HTTP. Transparency is ergonomics; latency is hops. Gateway API is a specification, not a product. Priority classes order scheduling; they do not make one pod wait for another.']
    ],
    available: 'Architecture review · part of every package'
  }
].map(c => ({...c, figure: diagrams[c.diagram]}));

export const platform = {
  tiers: [
    {id: 'launch', name: 'Launch', lead: 'You have a product. You need somewhere production-grade to run it.',
      items: ['AWS organization and landing zone', 'A cell: VPC, EKS on Graviton, Cilium, Karpenter', 'GitOps with Flux; Terraform and Terramate for AWS', 'CI/CD over OIDC: plans on pull requests, protected applies, drift detection', 'Prometheus, Grafana, Loki and Tempo with alerts as code', 'Architecture guide, runbooks and a handover week']},
    {id: 'secure', name: 'Secure', lead: 'Everything in Launch, plus the controls auditors and attackers both test first.',
      items: ['Organization guardrails: SCPs and RCPs with offline tests', 'Admission policy, tested both ways, enforced in production', 'Default-deny network policy with declared capabilities', 'One controlled path to the internet', 'Secrets with rotation; backups with tested restores', 'Evidence pack mapped to CIS and AWS Foundational Security Best Practices']},
    {id: 'autonomous', name: 'Autonomous', lead: 'Everything in Secure, plus agents that watch the platform and propose the fixes.',
      items: ['SRE agent: investigates every alert, reports cause and evidence', 'DevSecOps agent: turns findings into patch pull requests', 'Ask the platform from Slack; approve actions with a button', 'Own identities, least privilege, approval by blast radius', 'Spend limits, redaction and a full audit trail', 'You keep the agents and their skills as your own code']}
  ],
  modules: [
    ['CI/CD foundation', 'Reusable pipelines, OIDC to AWS, signed images, drift detection.'],
    ['AWS guardrails', 'SCPs and RCPs, permission boundaries, a dry run against your CloudTrail history.'],
    ['Kubernetes hardening', 'Admission policy, default-deny network policy, workload identity.'],
    ['Controlled egress', 'One allowlisted path out for clusters and CI runners.'],
    ['Observability', 'Metrics, logs, traces, SLO burn-rate alerts, dashboards as code.'],
    ['SRE agent', 'For a cluster you already run, with read-only access to start.']
  ],
  steps: [
    ['Discover', 'One week. Your product, constraints and compliance needs, written down as decisions you can review.'],
    ['Build', 'Three to six weeks. The baseline, adapted to you, in your GitHub organization and your AWS accounts from the first day.'],
    ['Hand over', 'Runbooks, decision records and a pairing week. Your team can operate and extend everything.'],
    ['Operate, optionally', 'Upgrades, reviews and on-call for the platform, or agents that do the first hour of every incident.']
  ]
};
