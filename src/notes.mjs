// Notes: how the platform works, one topic per note. Patterns and reasons, no client or
// employer details. Bodies are HTML built from small helpers so code is always escaped.

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const h = (t) => `<h2>${t}</h2>`;
const p = (...t) => t.map((x) => `<p>${x}</p>`).join('');
const code = (lang, src) => `<pre class="code" data-lang="${lang}"><code>${esc(src.replace(/^\n/, '').replace(/\n\s*$/, ''))}</code></pre>`;
const ul = (...items) => `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
const c = (t) => `<code>${esc(t)}</code>`;

export const notes = [
  {
    slug: 'gitops-bridge-flux',
    title: 'Terraform to Flux through one ConfigMap',
    summary: 'The GitOps Bridge pattern for Flux: Terraform publishes the AWS facts once, every manifest substitutes them, and no manifest names an account, a region or an ARN.',
    topics: ['terraform', 'flux', 'gitops', 'aws'],
    body: [
      h('The gap between the two tools'),
      p(`Add-ons on EKS need facts only the infrastructure code knows: the Karpenter interruption queue, the role ARN for the load balancer controller, the VPC ID, the KMS key for node volumes. Terraform creates those things; Flux installs the charts that need them. Copying the values into Git by hand drifts on the next apply. Letting Terraform install the charts with the Helm provider makes Terraform own state that Flux then changes under it.`,
        `The <a href="https://github.com/gitops-bridge-dev/gitops-bridge">GitOps Bridge</a> project names the pattern that closes this gap: the infrastructure tool creates the cloud resources and stores their metadata where the GitOps engine can read it; the GitOps engine installs everything and passes the metadata to the charts. Its reference implementation is for Argo CD: Terraform writes the cluster secret, add-on switches become labels, values become annotations, and ApplicationSets select clusters by label and template values from the annotations. The Flux side of the project is still in progress, so this is how the platform does it for Flux.`),
      h('One ConfigMap, written once'),
      p(`Terraform writes a single ConfigMap, ${c('cell-metadata')}, into ${c('flux-system')}. It holds identifiers only, never a secret value:`),
      code('hcl', `
resource "kubernetes_config_map_v1" "cell_metadata" {
  metadata {
    name      = "cell-metadata"
    namespace = "flux-system"
  }
  data = {
    cell_name                    = var.name
    aws_region                   = local.region
    cluster_name                 = module.eks.cluster_name
    karpenter_interruption_queue = module.karpenter.queue_name
    karpenter_node_role          = module.karpenter.node_iam_role_name
    app_role_arn                 = aws_iam_role.app_abac.arn
    admission_action             = var.environment == "dev" ? "Audit" : "Deny"
  }
}`),
      p(`Every Flux Kustomization substitutes from it after building, so a manifest simply writes ${c('${cluster_name}')}:`),
      code('yaml', `
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: controllers
  namespace: flux-system
spec:
  path: ./infrastructure/controllers
  postBuild:
    substituteFrom:
      - { kind: ConfigMap, name: cell-metadata }`),
      h('What differs from the Argo CD bridge'),
      ul(`<strong>Which add-ons a cell runs is decided in Git, not by labels Terraform writes.</strong> Each cell's directory lists its layers and optional components. A reviewer sees the full composition in one pull request; Terraform never decides what is installed.`,
        `<strong>Strict substitution.</strong> Flux fails a reconciliation when a manifest asks for a variable the ConfigMap does not have, so a missing value is a loud error, not an empty string in a chart.`,
        `<strong>Terraform installs only what must exist before Flux:</strong> the CNI, the egress gateway when the cell has one, and Flux itself. Everything else is Flux's.`,
        `<strong>Identity before workload.</strong> Terraform creates a workload's role and Pod Identity association before Flux deploys the workload, so a pod never starts without its permissions and Flux never needs IAM rights.`),
      h('Rules that keep it honest'),
      ul(`Identifiers only. A database endpoint is fine; its password is not. Secrets reach the cluster through External Secrets or Pod Identity.`,
        `The ConfigMap carries a schema number. Adding or renaming a key is a change on both sides, reviewed together.`,
        `CI renders every layer with a sample ConfigMap in strict mode, so a typo in ${c('${variable}')} fails the pull request, not the cluster.`),
      p(`The result is one GitOps tree for every cell. A new region is a new Terraform stack and a new directory that lists what the cell runs; no manifest is copied.`),
    ],
  },
  {
    slug: 'cilium-from-the-first-node',
    title: 'Cilium from the first node, and why not the VPC CNI',
    summary: 'Why the platform creates EKS without the VPC CNI and kube-proxy, what Cilium in ENI mode gives that the default does not, and what it costs.',
    topics: ['kubernetes', 'cilium', 'aws'],
    body: [
      h('The default, and why it is not enough'),
      p(`An EKS cluster comes with the Amazon VPC CNI for pod networking and kube-proxy for Services. They work, and for many clusters they are the right choice. The platform replaces both with Cilium, for reasons that are about security and operations rather than taste.`),
      h('Why Cilium'),
      ul(`<strong>Policy by identity, not by IP.</strong> Cilium enforces network policy on workload identity derived from labels, in the kernel with eBPF. Pod IPs change constantly; identities do not. The platform's default-deny model with declared capabilities depends on this.`,
        `<strong>FQDN policy.</strong> ${c('toFQDNs')} lets a policy say "this workload may reach api.example.com on 443" and have Cilium's DNS proxy enforce it. The VPC CNI's network policy support has no equivalent; the egress gateway's second fence is built on it.`,
        `<strong>Seeing what was dropped.</strong> Hubble records every flow with its verdict. "Why can't A reach B" becomes a log query instead of a guess, and dropped flows become an alert.`,
        `<strong>kube-proxy replacement.</strong> Service load balancing in eBPF with Maglev hashing instead of iptables chains that grow with every Service, and node processes can reach ClusterIPs, which the platform uses so nodes pull images through the egress gateway.`,
        `<strong>L7 only where needed.</strong> When a route needs retries or gRPC-aware balancing, Cilium sends that traffic through a node-local Envoy; everything else stays in the kernel. No sidecar in every pod.`),
      h('Why from the first node'),
      p(`The common path is to create the cluster with the VPC CNI, install Cilium later, and remove the old CNI with a script. That means two applies, a period where nodes run two datapaths, and a cleanup step that has to be right on every cluster.`,
        `The platform instead creates EKS with no self-managed add-ons, installs Cilium with Terraform right after the control plane, and only then creates node groups. Nodes carry a ${c('node.cilium.io/agent-not-ready')} taint until Cilium is running on them, and CoreDNS tolerates it. One apply builds a working cluster.`),
      code('hcl', `
resource "helm_release" "cilium" {
  chart = "cilium"
  wait  = false # nodes join after this release
  values = [yamlencode({
    ipam                 = { mode = "eni" }
    eni                  = { enabled = true, awsEnablePrefixDelegation = true }
    routingMode          = "native"
    kubeProxyReplacement = true
  })]
}
module "node_group_system" { depends_on = [helm_release.cilium] }`),
      h('Why ENI mode'),
      p(`In ENI mode Cilium gives each pod an address from its node's subnet, as the VPC CNI does. That keeps pods routable in the VPC without overlays, and it is what makes subnet tiers mean something for pods: a pod on a private-tier node is in the private tier and has no route to the internet; a pod on an egress-pool node leaves through that pool's NAT and fixed IP.`),
      h('What it costs'),
      ul(`<strong>You own the CNI.</strong> Cilium upgrades are platform changes, planned and rolled cell by cell, not an AWS-managed add-on version bump.`,
        `<strong>Support boundary.</strong> AWS supports the VPC CNI; for Cilium you rely on the project, a commercial distribution, or your own team.`,
        `<strong>IP planning still matters.</strong> ENI mode uses VPC addresses; prefix delegation makes it efficient, but subnets must be sized for pods, not only nodes.`),
      p(`For a platform whose security model is built on identity-aware policy, FQDN egress and flow visibility, those costs are worth paying. For a single small cluster with no network policy, the default is fine.`),
    ],
  },
  {
    slug: 'one-way-to-the-internet',
    title: 'One way out to the internet, three fences around it',
    summary: 'How the Secure package makes a cluster unable to reach the internet except through one allowlisting gateway, and why one control is never enough.',
    topics: ['aws', 'kubernetes', 'cilium', 'envoy', 'security'],
    body: [
      h('The problem'),
      p(`Most clusters let any pod open a connection to anywhere. A compromised dependency calling home, a cryptominer, data leaving through an innocent-looking HTTPS request: none of them need more than that. Network policy alone does not fix it, because it is one mistake away from open: a broad rule added in a hurry, a selector that matches nothing, an agent left in audit mode.`),
      h('Three independent fences'),
      ul(`<strong>Routing.</strong> Node and pod subnets have no default route. Only a dedicated egress tier routes to NAT, and only the egress gateway runs there. A pod that ignores every policy still has nowhere to send internet traffic.`,
        `<strong>CNI policy.</strong> The gateway pods may reach only the allowlisted hostnames, enforced by Cilium's DNS proxy with ${c('toFQDNs')}. Application pods may reach the gateway only if they carry the capability label.`,
        `<strong>L7 proxy.</strong> The gateway is an Envoy CONNECT proxy. It forwards only allowlisted ${c('host:port')} pairs and answers everything else with a 403 and a JSON log line.`),
      p(`A security group lets only the egress tier send HTTPS out of the VPC: a fourth, coarse fence. AWS APIs never touch the gateway; they are reached through VPC endpoints.`),
      code('yaml', `
virtual_hosts:
  - name: allowed
    domains: ["github.com:443", "*.githubusercontent.com:443", "api.stripe.com:443"]
    routes:
      - match: { connect_matcher: {} }
        route: { cluster: dynamic_forward_proxy, upgrade_configs: [{ upgrade_type: CONNECT, connect_config: {} }] }
  - name: denied
    domains: ["*"]
    routes:
      - match: { connect_matcher: {} }
        direct_response: { status: 403 }`),
      h('The details that matter'),
      ul(`Wildcards only for a vendor's own zone. ${c('*.github.io')} would let anything hosted on GitHub Pages through; ${c('*.s3.amazonaws.com')} is an exfiltration channel, not an allowlist entry.`,
        `Nodes pull container images through the same gateway, by a fixed ClusterIP, because they do not use cluster DNS. Even image pulls follow the policy.`,
        `The gateway is installed by Terraform, before Flux, because Flux reaches GitHub through it.`,
        `Workloads that must call hosts nobody can list (webhooks to customer URLs) get an egress pool with its own fixed IP and a named exception, instead of a wildcard on the gateway.`),
      h('What changes'),
      p(`Leaving the network becomes a decision someone reviews. A new dependency is a one-line allowlist change in a pull request; an unexpected destination shows up as a 403 and a dropped flow instead of a successful connection. And the allowlist is, for free, the documentation of everything the platform talks to.`),
    ],
  },
  {
    slug: 'declared-network-access',
    title: 'Capabilities: a network policy model that does not drift',
    summary: 'A default-deny network policy model where workloads declare dependencies by label, destinations admit the same label, and a narrowly privileged pipeline applies it all.',
    topics: ['kubernetes', 'cilium', 'gitops', 'security'],
    body: [
      h('Why hand-written policies drift'),
      p(`A caller's egress rule and the destination's ingress rule are usually written in different places by different people. A rule gets copied with more than it needs. A "temporary" broad rule stays because nobody can prove what removing it would break.`),
      h('Capabilities'),
      p(`Every tenant namespace is deny-by-default. A shared dependency is a <em>capability</em>: a reusable policy component the namespace lists, and a label the workload carries. The destination admits callers by the same label, so the two sides cannot drift apart.`),
      code('yaml', `
# destination side: admit any caller that carries the capability, from any namespace
ingress:
  - fromEndpoints:
      - matchLabels: { netpol.cell.io/svc-payments: "true" }
        matchExpressions:
          - { key: k8s:io.kubernetes.pod.namespace, operator: Exists }
    toPorts: [{ ports: [{ port: "8080", protocol: TCP }] }]`),
      p(`The ${c('matchExpressions')} line is not decoration: without it, a ${c('fromEndpoints')} selector silently means "only this namespace".`),
      h('Where the line is'),
      p(`The test for "is this a capability" is: if a second workload carried this label, would that be correct? Shared services and infrastructure pass it. A destination only one workload uses, such as its own bucket or database, does not: it lives as a private policy in that namespace, so a label can never grant access to someone else's data.`),
      h('Guardrails on the guardrails'),
      ul(`Policies are applied by a Flux service account that can manage Cilium policies and nothing else.`,
        `CI rejects ${c('world')}, ${c('cluster')} or ${c('0.0.0.0/0')} in allow rules, FQDN patterns that cover a whole provider, CIDR rules without ports, and the cross-namespace selector that silently means "this namespace only".`,
        `Dropped flows are exported and alerted on, so a missing capability becomes a ticket instead of a timeout someone debugs for a day.`,
        `Broad legacy rules are removed only after real traffic shows the replacement covers every flow: parity first, removal second.`),
      p(`Who may talk to whom becomes readable in one directory and reviewable in one pull request.`),
    ],
  },
  {
    slug: 'policies-proven-to-block',
    title: 'Testing admission policies both ways',
    summary: 'Kyverno CEL policies with fixtures that must pass and fixtures that must fail, reported in development and enforced in production from the same files.',
    topics: ['kubernetes', 'kyverno', 'security'],
    body: [
      h('The failure nobody sees'),
      p(`An admission policy that blocks nothing looks exactly like one that works. A verb that does not exist, a check on a field an attacker controls, a match that never fires: all pass review, all are silent, and all are discovered during an incident.`),
      h('Tested both ways'),
      p(`Every policy ships with fixtures that must be admitted and fixtures that must be rejected <em>by that policy, by name</em>. The test fails if a good fixture is rejected or a bad one gets through.`),
      code('yaml', `
results:
  - { policy: require-approved-registries, resources: [good-app], kind: Deployment, result: pass }
  - { policy: require-approved-registries, resources: [bad-registry], kind: Deployment, result: fail }
  - { policy: restrict-load-balancers, resources: [bad-public-lb, bad-misspelled-ranges], kind: Service, result: fail }`),
      h('What the policies cover'),
      p(`Pod Security Admission handles privileged pods, host access and capabilities natively. Kyverno, in CEL, adds what it does not: images only from the cell registry and signed by the release workflow, pinned versions, requests and memory limits, probes, read-only root filesystems, no default service account, internal load balancers unless exposure is approved, cluster-admin bound only by GitOps, and a namespace syncing only its own secrets.`,
        `One policy rejects a misspelled load balancer annotation. The controller ignores the misspelling and opens the load balancer to the internet while the manifest looks restricted. That kind of rule comes from incidents, and it is exactly the kind a test must prove.`),
      h('Same files, two modes'),
      p(`The action comes from the cell: ${c('Audit')} in development, ${c('Deny')} in staging and production. Teams see violations in their dev cell before production rejects them. Exceptions exist, but each names an owner, a reason and an expiry date, and exempts a workload, never a namespace.`),
    ],
  },
  {
    slug: 'guardrails-from-day-one',
    title: 'Guardrails an AWS account inherits on day one',
    summary: 'Service and resource control policies attached once per OU, tested offline, and changed only after replaying real CloudTrail history against them.',
    topics: ['aws', 'security', 'terraform'],
    body: [
      h('How guardrails rot'),
      p(`Guardrails grow account by account: the same rule copied with a different list of ARNs, accounts at the five-policy quota, new accounts with none at all. Nobody can say what an account actually has without reading every policy on its path.`),
      h('One rule, one place'),
      p(`Each rule lives once, at the highest level of the organization where it is true:`),
      ul(`<strong>Root:</strong> the audit trail cannot be stopped, the root user can do nothing, nobody leaves the organization, and the tags that grant privilege through ABAC can only be set by security admins.`,
        `<strong>Workloads OU:</strong> every role has a permissions boundary, regions are locked, IMDSv2 and encryption are required, interactive host access goes through the access proxy.`,
        `<strong>Production OU:</strong> only CI publishes images, only autoscalers start instances, only code changes cluster access and network edges.`,
        `<strong>A resource control policy</strong> keeps S3, Secrets Manager and KMS closed to principals outside the organization and to plain HTTP, whatever a resource policy says.`),
      h('SCPs have no audit mode'),
      p(`A broken SCP is found by an outage. So every change passes three gates. Offline tests check the quota, that every statement is a Deny, and that the break-glass role keeps a way in. A replay of ninety days of CloudTrail lists every principal the candidate would have denied. And new policies are attached next to the old ones for 48 hours before anything is removed, OU by OU, production last; policies combine as a union of denies, so this never opens a gap.`),
      code('hcl', `
run "guardrails_only_deny" {
  command = plan
  assert {
    condition = alltrue(flatten([
      for p in aws_organizations_policy.scp : [for s in jsondecode(p.content).Statement : s.Effect == "Deny"]
    ]))
    error_message = "An SCP contains an Allow statement; guardrails only take permissions away."
  }
}`),
      p(`The replay is the gate that pays for itself: it catches the change that would have stopped node autoscaling in production because one role name did not match a new pattern.`),
    ],
  },
  {
    slug: 'atlantis-policy-checks',
    title: 'Atlantis, and a policy a pull request cannot weaken',
    summary: 'Plans on every pull request, conftest checks on the plan itself, applies only of the reviewed plan, and policies baked into the image that runs them.',
    topics: ['cicd', 'atlantis', 'terraform', 'security'],
    body: [
      h('What CI applies were missing'),
      p(`Moving applies from laptops to CI removes credentials from laptops. It does not guarantee that the plan a reviewer approved is the plan that runs, and security rules live only in reviewers' heads.`),
      h('How the platform applies'),
      ul(`Atlantis plans every changed stack and posts the plan to the pull request. Projects are generated from the Terramate stack list, so the order follows the stacks' dependencies.`,
        `Each plan is checked with conftest before it may be applied: protected resources cannot be destroyed without an earlier, reviewed ${c('allow-destroy')} tag; open ingress, wildcard IAM, unencrypted storage and public buckets fail.`,
        `Apply requires an approving review, a mergeable pull request and a branch up to date with main, and applies exactly the saved plan.`,
        `Atlantis has its own workload identity that may only assume a plan role and an apply role in each account. No keys.`),
      code('rego', `
deny contains msg if {
  some rc in input.resource_changes
  rc.type in protected
  "delete" in rc.change.actions
  object.get(object.get(rc.change.before, "tags", {}), "allow-destroy", "false") != "true"
  msg := sprintf("%s would be destroyed; tag it allow-destroy=true in a reviewed change first", [rc.address])
}`),
      h('The policies live in the image'),
      p(`If the policies were read from the repository, a pull request could change the policy that checks it. They are baked into the Atlantis image instead, built and signed by CI; a policy change is a new image, reviewed like any other change. Overrides exist, but only the policy owners can approve one, and the approval is recorded on the pull request.`),
    ],
  },
  {
    slug: 'three-products-one-repository',
    title: 'Three products from one repository with Terramate',
    summary: 'One variable selects the package, Terramate composes the stacks, and a renderer gives each client a repository that contains only what they bought.',
    topics: ['terraform', 'terramate'],
    body: [
      h('The problem with feature flags'),
      p(`The platform is sold as three packages. Clients receive the source. Flags that switch off what a client did not buy still ship that code to them: noise to maintain, capabilities they do not have, and the higher packages given away.`),
      h('One variable composes the stacks'),
      p(`Capabilities live in separate modules per package. A global, ${c('tier')}, decides which modules each stack is generated from; Terramate writes the Terraform and it is committed, so reviewers read real code.`),
      code('hcl', `
generate_hcl "egress.tf" {
  condition = tm_contains(terramate.stack.tags, "cell") && global.tier != "launch"
  content {
    module "egress" {
      source     = "\${terramate.stack.path.to_root}/modules/cell-egress"
      cluster_ip = module.cell.egress.cluster_ip
    }
  }
}`),
      h('Rendering a client copy'),
      p(`A manifest maps paths to the lowest package that includes them; lines that differ inside shared files carry markers. The renderer copies only what the client's package includes, cuts the marked blocks, sets the tier, regenerates and validates. The result contains no trace of the higher packages.`),
      code('hcl', `
  egress_allowlist_hosts = [
    "api.stripe.com",
    # >>> tier:autonomous
    "api.anthropic.com",
    # <<< tier:autonomous
  ]`),
      p(`CI renders all three packages from the baseline on every pull request and runs the full checks on each, so a change that leaks a higher package into a lower one fails before it merges.`),
    ],
  },
  {
    slug: 'upgrades-through-a-baseline-branch',
    title: 'Upgrades a client receives as a pull request',
    summary: 'How a turnkey platform keeps moving after handover: a baseline branch in every client repository, and Git merging new releases with the client\'s own changes.',
    topics: ['gitops', 'terraform', 'cicd'],
    body: [
      h('Turnkey is not frozen'),
      p(`A client owns their copy of the platform. Kubernetes, add-ons and providers release every month and security fixes do not wait. Without a delivery channel, a platform starts decaying the day it is handed over.`),
      h('The vendor-branch pattern'),
      p(`Each client repository keeps a ${c('baseline')} branch that only ever contains rendered baseline code, never client edits. ${c('.platform.json')} records the baseline version and package.`),
      ol(`A new baseline version is rendered for the client's package onto ${c('baseline')}.`,
        `A branch from ${c('main')} merges ${c('baseline')}.`,
        `Git combines the new baseline with the client's own changes; conflicts appear only where the client edited baseline files.`,
        `The client reviews and merges a normal pull request; plans and policy checks run as for any change.`),
      p(`Moving from one package to the next is the same operation with a different package: the new modules arrive as a pull request, next to the client's own work.`),
      h('Who runs it'),
      p(`The mechanism is technical, not contractual. A client can run the upgrade themselves from release notes, or have it prepared, reviewed and applied under a support plan. Either way the change is a diff they can read.`),
    ],
  },
  {
    slug: 'one-role-for-every-service',
    title: 'One IAM role for every service, and no neighbour\'s secrets',
    summary: 'EKS Pod Identity session tags turn one shared role into per-service permissions: a pod reads only the secrets, tables and buckets under its own namespace and service account.',
    topics: ['aws', 'kubernetes', 'security'],
    body: [
      h('The IAM sprawl problem'),
      p(`A role per service means a Terraform change for every new service, dozens of near-identical policies, and the steady temptation to reuse one role for "just this other service".`),
      h('Session tags do the scoping'),
      p(`EKS Pod Identity tags every session with the pod's namespace and service account. One shared application role can then use those tags in resource paths:`),
      code('hcl', `
statement {
  sid     = "OwnSecretsOnly"
  actions = ["secretsmanager:GetSecretValue"]
  resources = [
    "arn:aws:secretsmanager:\${region}:\${account}:secret:\${cell}/services/$\${aws:PrincipalTag/kubernetes-namespace}/$\${aws:PrincipalTag/kubernetes-service-account}/*"
  ]
}`),
      p(`A pod in ${c('payments')} running as ${c('api')} reads ${c('<cell>/services/payments/api/*')} and nothing else. Tables and buckets follow the same prefix rule. A label change cannot widen it: the tags come from the platform, not from the pod.`),
      h('Where it stops'),
      ul(`A workload that needs something outside its prefix gets its own role, declared in code with the reason.`,
        `External Secrets syncing into a namespace is limited to that namespace's prefix by an admission policy, so the cluster-wide secret store cannot become a back door.`,
        `Every role, shared or not, carries a permissions boundary the organization requires.`),
    ],
  },
  {
    slug: 'nodes-without-internet',
    title: 'Nodes without internet: Bottlerocket and ECR pull-through cache',
    summary: 'How nodes start, join and pull images when their subnets have no route out, and what that removes from the attack surface.',
    topics: ['aws', 'kubernetes', 'security'],
    body: [
      h('Why bother'),
      p(`If a node can reach the internet, so can anything that compromises it. In the Secure package, node and pod subnets have no default route at all. That only works if nodes can still boot, join the cluster and pull images.`),
      h('What makes it work'),
      ul(`<strong>VPC endpoints</strong> for every AWS API a node needs: ECR, STS, EKS, EC2, SSM, KMS, logs. S3 and DynamoDB through gateway endpoints.`,
        `<strong>ECR pull-through cache</strong> for the platform's own images: quay, registry.k8s.io, public ECR, GitHub and Docker Hub are mirrored into the account's ECR on first pull, scanned continuously, and expired when unused. The CNI and Flux images come from there.`,
        `<strong>The egress gateway as the node's proxy</strong> for anything else. Bottlerocket's ${c('https-proxy')} setting sends containerd's pulls through the gateway by a fixed ClusterIP, so node pulls obey the same allowlist as everything else.`),
      code('toml', `
[settings.host-containers.admin]
enabled = false
[settings.kernel]
lockdown = "integrity"
[settings.network]
https-proxy = "http://172.20.0.50:3128"
no-proxy = [".svc", ".cluster.local", "169.254.169.254", ".amazonaws.com"]`),
      h('Bottlerocket, hardened'),
      p(`A minimal OS with an immutable root filesystem. The admin and control host containers are off: access is through the cluster, not the host. Kernel lockdown is on, IMDSv2 is required with a hop limit of one, so a pod cannot reach the node's instance credentials, and every volume is encrypted with the cell's key.`),
    ],
  },
  {
    slug: 'an-sre-agent-inside-the-cluster',
    title: 'An SRE agent inside the cluster that acts within your rules',
    summary: 'oncall-kit for behaviour, Claude Tag for the conversation, self-hosted runners in the cell for the data, and an action broker for everything it changes: how the Autonomous package builds its agents.',
    topics: ['agents', 'observability', 'kubernetes', 'security'],
    body: [
      h('What the agent is for'),
      p(`Most alerts need the same first hour of work: which service, since when, what changed, what the logs say. An agent can do that hour. The risk is not that it is slow; it is that it acts with too much power on too little evidence.`),
      h('Built on proven pieces'),
      ul(`<strong>Behaviour: <a href="https://github.com/anthropics/oncall-kit">oncall-kit</a>.</strong> Its setup mines the team's incident history into triage playbooks, ends every phase at a human gate, and requires a blind replay eval and a shadow period before anyone relies on it.`,
        `<strong>Conversation: Claude Tag</strong> in the team's Slack on-call and incident channels.`,
        `<strong>Execution: self-hosted runners inside the cell.</strong> Hosted sandboxes cannot reach private endpoints, so sessions run next to the data. An orchestrator holds the environment key and starts one Kubernetes Job per session with a single-use work order; the key never reaches a pod that runs a session.`),
      code('sh', `
# spawn-runner hook: one Job per order, named from the order ID so redelivery creates nothing new
name="runner-$(printf '%s' "$CLAUDE_RUNNER_ORDER_ID" | tr 'A-Z_' 'a-z-' | cut -c1-50)"
kubectl -n agents get job "$name" >/dev/null 2>&1 && exit 0
# ... create the Job, store the work order in a Secret owned by it, exit without waiting`),
      h('Acting, not only advising'),
      p(`oncall-kit keeps its agent read-only. That is the right start, but an agent that can only describe the restart still wakes someone up to type it. So the agent can act, through one door: an <strong>action broker</strong> in the cell. The agent's own identity stays read-only; to change something it asks the broker, with a reason.`),
      code('sh', `
act restart deployment/checkout -n shop \\
  --reason "OOMKilled 6 times since 02:10 after the 1.42 rollout; memory flat on 1.41"
# pending a1b2c3: waiting for approval in #platform-approvals`),
      p(`The broker knows five typed actions: restart a workload, scale it up to a ceiling, delete one pod, reconcile or resume a Flux object. There is no action that runs a command or applies a manifest. A policy in Git says which namespaces are open, who may approve, and which actions may run without asking, up to a number per hour. Everything starts behind approval: the broker posts the request to Slack with Approve and Reject buttons and runs it only when someone on the approver list presses one. When a team has approved the same restart for the tenth time, they move that action to run on its own with a pull request, not a prompt.`),
      p(`Lasting fixes, such as a memory limit, a configuration value or a version, stay pull requests. The DevSecOps agent writes only pull requests; branch protection keeps merging with people.`),
      h('Guarantees that do not depend on the model'),
      ul(`The agent's own RBAC is read-only, with no Secrets, no exec, no write verbs; managed settings in the image deny direct write commands.`,
        `The broker can run its five actions and nothing else. Its role is bound only in the namespaces the policy opens, and platform namespaces (Flux, Kyverno, the gateway, the agents themselves) are refused in its code as well.`,
        `Approvers are checked by the broker against the chat identity; a request nobody answers expires as rejected; <code>enabled: false</code> stops every action.`,
        `Network: the model API, GitHub, the in-cluster observability endpoints and the broker, nothing else.`,
        `Every request, decision and result is logged with the agent's reason and the approver.`),
      p(`Text the agent reads from logs, alerts and tickets is data, never instructions; that rule is in its prompt, and the credentials make sure it does not matter if the prompt is ignored.`),
    ],
  },
];

function ol(...items) { return `<ol>${items.map((i) => `<li>${i}</li>`).join('')}</ol>`; }
