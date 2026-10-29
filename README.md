# Soft Guide s. r. o.

English corporate website for Soft Guide, focused on hands-on DevOps, AWS infrastructure, Kubernetes, automation, and security posture advisory. Five pages: Home, Services, About, Contact, and CV / Resume, plus a 404 page. Original SVG identity and architecture illustration; no third-party runtime assets or dependencies.

## Status and publication boundaries

Local review only. The owner authorized a public source repository after initially requesting a private one. That permission does **not** authorize public deployment. No GitHub Pages, hosting, DNS records, or automatic deployment workflow is configured. The owner reports purchasing `softguide.dev` at Namecheap on 29 October 2026. The origin is configured, but this does not verify registration, DNS, or live hosting.

Default builds show a design comparison bar and block search indexing. Robots directives are not access control: do not upload review builds to a public host. Keep this repository separate from all financial, accounting, tax, identity, and client materials in its parent workspace.

## Run locally

Use Node.js 22 or newer. No dependency installation is needed.

```sh
node scripts/build.mjs
node --test tests/site.test.mjs
node scripts/serve.mjs
```

Open `http://127.0.0.1:4173`. The preview binds only to the local computer. Stop it with Ctrl+C. You can also open `dist/index.html` directly, although browser restrictions and storage behavior vary for local files. No command in this project deploys anything.

## Compare designs

The local comparison bar offers:

| Design | Palette | Direct local URL |
| --- | --- | --- |
| Blue / Light | Cool white, navy, cobalt | `http://127.0.0.1:4173/?theme=blue` |
| Midnight / Dark | Charcoal, pale text, amber | `http://127.0.0.1:4173/?theme=midnight` |
| Glacier / Dark | Deep blue-charcoal, ice-blue accents | `http://127.0.0.1:4173/?theme=glacier` |
| Sage / Original | Warm white, forest, lime | `http://127.0.0.1:4173/?theme=sage` |

Theme selection applies across all pages, including the logo, panels, forms, buttons, and footer. A URL parameter takes precedence over a saved preference. Storage failure is tolerated; links retain the design parameter. The default is `blue`, configured in `config/site.json`. The comparison bar is excluded from release builds.

## Project structure

- `src/content.mjs`: company details, services, and engagement process.
- `scripts/build.mjs`: static HTML, structured data, robots, sitemap, and downloadable text CV generation.
- `public/assets/`: original SVGs, shared responsive layout, theme palettes, and progressive enhancement.
- `config/site.json`: public configuration, with no personal email or phone by default.
- `tests/site.test.mjs`: isolated build, link integrity, metadata, release gate, and local-data isolation checks.
- `docs/`: brand notes, attribution, verification notes, and suggested LinkedIn text.
- `dist/`: generated, ignored output. Do not commit it: local builds may contain review-only personal contacts.
- `.local/`: ignored private overrides. Never upload or commit this folder.

## Contacts and inquiry behavior

Public configuration intentionally leaves email and phone blank. With no email, the Contact page offers LinkedIn and a useful inquiry checklist. A local-only `.local/preview.json` may contain `businessEmail` and `phone` for review. Copy approved contact details into public configuration only after confirming they may appear in a public repository and website. Do not assume a domain mailbox exists merely because the domain was purchased.

When an email is configured, the form prepares a `mailto:` draft in the visitor's email application. It does not send email, contact an API, or store messages. Native browser validation checks required fields and email format. The visitor must open, review, and send the draft. If no mail application is configured, use the visible email link. JavaScript-disabled visitors can use direct contact links; navigation remains visible without JavaScript.

## CV and LinkedIn

The CV is an honest draft with printable A4 styles and a downloadable plain-text version. It contains the owner-confirmed founder/company information and declared service focus. Earlier employers, roles, dates, education, credentials, and languages remain unverified placeholders. No years of experience, seniority, performance metrics, client names, or professional certification claims are invented. LinkedIn's public profile response was incomplete and search tooling did not return a usable match; no LinkedIn account was edited. See `docs/linkedin-experience.txt` for suggested text.

Before setting `resumeApproved`, replace placeholders with verified history or consciously approve a short founder profile that omits unverified history. Approval currently hides incomplete history sections; it does not magically populate them. `Founder` is used; a formal director role is not asserted.

## Future release — separate authorization required

Before publication, review the actual generated pages and set these values deliberately in `config/site.json`:

- `origin`: `https://softguide.dev`, without trailing slash.
- `theme`: the selected design (`blue`, `midnight`, `glacier`, or `sage`).
- `businessEmail`: a real, working, approved address.
- `phone`: only if approved for publication.
- `contactsApproved`, `contentApproved`, `resumeApproved`: `true` only after owner review.
- `allowIndexing`: `true` only when indexing is wanted.

```sh
node scripts/build.mjs --release
```

The release gate rejects incomplete approvals and ignores `.local/preview.json`. A release build removes the review toolbar and CV draft sections and creates canonical URLs and a sitemap. This is only a build; hosting and DNS still need separate authorization and setup. Configure the eventual host for HTTPS, security headers, a 404 response, and a single preferred hostname. The preview server is a local QA tool, not a production server.

Page titles, descriptions, language, canonical URLs, Open Graph text, and Organization structured data are included. Original social artwork is provided as SVG source; a widely supported raster social preview should be exported and its absolute URL configured if social image previews are required. No raster Open Graph image is claimed to be integrated.

## Accessibility and privacy

Semantic landmarks, a skip link, labelled controls, native disclosure widgets, visible keyboard focus, reduced-motion support, mobile navigation with Escape dismissal, and print styles are included. Layout adapts at 950px and 700px. Review keyboard, contrast, touch targets, and assistive technology behavior on the final design before release. Automated checks are not a certification of accessibility. No analytics, external fonts, trackers, or backend message database are included. Theme choice alone is stored locally when the browser permits it.

## License

The project is currently **All rights reserved**; see `LICENSE`. Public source visibility is not an open-source license. For later open sourcing, MIT is a simple permissive option; Apache-2.0 adds an explicit patent grant. Make that decision deliberately, and decide separately whether company names, logos, and copy should be excluded. No license was inherited from the inspiration repository and none of its code or assets was copied. See `docs/ATTRIBUTION.txt`.
