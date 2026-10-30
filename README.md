# Soft Guide s. r. o.

English corporate website for Soft Guide, focused on hands-on DevOps, AWS infrastructure, Kubernetes, automation, and security posture advisory. Five pages: Home, Services, About, Contact, and CV / Resume, plus a 404 page. Original SVG identity and architecture illustration; no third-party runtime assets or dependencies.

## Status and publication boundaries

Public deployment to GitHub Pages and the custom domain `softguide.dev` was authorized by the owner on 29 October 2026. The `Publish website` workflow tests, builds, checks, and publishes only `dist/` on pushes to `main`. DNS and HTTPS status must be verified separately; see `docs/DEPLOYMENT.txt`. The public site uses professional profile links for contact, with no unconfirmed personal email or phone.

Default review builds block search indexing. Robots directives are not access control: do not upload review builds to a public host. Keep this repository separate from all financial, accounting, tax, identity, and client materials in its parent workspace.

## Run locally

Use Node.js 22 or newer. No dependency installation is needed.

```sh
node scripts/build.mjs
node --test tests/site.test.mjs
node scripts/serve.mjs
```

Open `http://127.0.0.1:4173`. The preview binds only to the local computer. Stop it with Ctrl+C. You can also open `dist/index.html` directly, although browser restrictions and storage behavior vary for local files. Local build commands do not deploy. Pushing to `main` triggers the Pages workflow.

## Light and dark themes

The header has a keyboard-accessible Light / Dark control on every page, including release builds. Light uses Blue; Dark uses Glacier. The initial default is light, independent of operating-system preference. A valid explicit theme URL takes precedence over a saved preference. Choices update instantly and are saved locally when permitted; navigation also preserves the choice if storage is unavailable. Old experimental themes fall back to Blue.

- Light: `http://127.0.0.1:4173/?theme=blue`
- Dark: `http://127.0.0.1:4173/?theme=glacier`

Without JavaScript, the configured light theme remains usable and the inactive switch is hidden. Print styles use a light palette. Logos, panels, forms, and navigation follow the selected theme.

## Project structure

- `src/content.mjs`: company details, services, and engagement process.
- `scripts/build.mjs`: static HTML, structured data, robots, sitemap, and downloadable text CV generation.
- `public/assets/`: original SVGs, shared responsive layout, theme palettes, and progressive enhancement.
- `config/site.json`: public configuration. The owner-approved contact email is set; phone stays blank.
- `tests/site.test.mjs`: isolated build, link integrity, metadata, release gate, and local-data isolation checks.
- `docs/`: brand notes, attribution, verification notes, and suggested LinkedIn text.
- `dist/`: generated, ignored output. Do not commit it: local builds may contain review-only personal contacts.
- `.local/`: ignored private overrides. Never upload or commit this folder.

## Contacts and inquiry behavior

The Contact page leads with the owner-approved email (approved 30 October 2026) and a Write an email button that opens the visitor's own mail app with the address and subject filled in; LinkedIn is the second option. Phone stays blank. With no email configured, the page falls back to LinkedIn and an inquiry checklist. A local-only `.local/preview.json` may contain `businessEmail` and `phone` for review. Copy approved contact details into public configuration only after confirming they may appear in a public repository and website. Do not assume a domain mailbox exists merely because the domain was purchased.

When an email is configured, the form prepares a `mailto:` draft in the visitor's email application. It does not send email, contact an API, or store messages. Native browser validation checks required fields and email format. The visitor must open, review, and send the draft. If no mail application is configured, use the visible email link. JavaScript-disabled visitors can use direct contact links; navigation remains visible without JavaScript.

## CV and LinkedIn

The public CV is a short founder profile with printable A4 styles and a downloadable plain-text version. Unverified earlier history is omitted. Local draft builds can display incomplete history when `resumeApproved` is false. It contains the owner-confirmed founder/company information and declared service focus. Earlier employers, roles, dates, education, credentials, and languages remain unverified and are excluded from publication. No years of experience, seniority, performance metrics, client names, or professional certification claims are invented. LinkedIn's public profile response was incomplete and search tooling did not return a usable match; no LinkedIn account was edited. See `docs/linkedin-experience.txt` for suggested text.

Before setting `resumeApproved`, replace placeholders with verified history or consciously approve a short founder profile that omits unverified history. Approval currently hides incomplete history sections; it does not magically populate them. `Founder` is used; a formal director role is not asserted.

## Release and deployment

Before publication, review the actual generated pages and set these values deliberately in `config/site.json`:

- `origin`: `https://softguide.dev`, without trailing slash.
- `theme`: the selected design (`blue` or `glacier`; keep `blue` for the first-visit default).
- `businessEmail`: leave blank to use LinkedIn, or set a real, working, approved address.
- `phone`: only if approved for publication.
- `contactsApproved`, `contentApproved`, `resumeApproved`: `true` only after owner review.
- `allowIndexing`: `true` only when indexing is wanted.

```sh
node scripts/build.mjs --release
```

The release gate rejects incomplete approvals and ignores `.local/preview.json`. A release build removes CV draft sections and creates canonical URLs and a sitemap. This command builds only; the authorized Pages workflow publishes on pushes to main. Configure the eventual host for HTTPS, security headers, a 404 response, and a single preferred hostname. The preview server is a local QA tool, not a production server.

Page titles, descriptions, language, canonical URLs, Open Graph text, and Organization structured data are included. Original social artwork is provided as SVG source; a widely supported raster social preview should be exported and its absolute URL configured if social image previews are required. No raster Open Graph image is claimed to be integrated.

## Accessibility and privacy

Semantic landmarks, a skip link, labelled controls, native disclosure widgets, visible keyboard focus, reduced-motion support, mobile navigation with Escape dismissal, and print styles are included. Layout adapts at 950px and 700px. Review keyboard, contrast, touch targets, and assistive technology behavior on the final design before release. Automated checks are not a certification of accessibility. No analytics, external fonts, trackers, or backend message database are included. Theme choice alone is stored locally when the browser permits it.

## License

The project is currently **All rights reserved**; see `LICENSE`. Public source visibility is not an open-source license. For later open sourcing, MIT is a simple permissive option; Apache-2.0 adds an explicit patent grant. Make that decision deliberately, and decide separately whether company names, logos, and copy should be excluded. No license was inherited from the inspiration repository and none of its code or assets was copied. See `docs/ATTRIBUTION.txt`.
