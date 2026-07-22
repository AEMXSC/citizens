# Citizens EDS: AEM author setup + content package export

This runbook takes the reskinned `AEMXSC/citizens` code repo to a live,
Universal-Editor-authorable crosswalk site, then exports the homepage as a
reusable AEM content package. It mirrors how `AEMXSC/nyl` was set up.

Everything below needs AEM author access to the shared XSC tenant
(`aemxsc`, program/env `p153659-e1614585`). None of it can be done from the
code repo alone.

## Known values (from this repo)

- Repo: `AEMXSC/citizens`
- Crosswalk mount (`fstab.yaml`): `https://author-p153659-e1614585.adobeaemcloud.com/bin/franklin.delivery/aemxsc/citizens/main`
- Preview host (once wired): `https://main--citizens--aemxsc.aem.page/`
- Shared Content Fragments: the XSC Showcase set under the `securbank` persisted-query namespace (`ArticleList`, `OfferList`/`OfferByPath`) — the same fragments `citizens-next` and the `content-fragment`/`offer` blocks consume.

## Step 1 — Provision the AEM author `citizens` site

Create the site under the shared author, the same way the `nyl` site was
created (confirm the exact content path with whoever set up nyl; it is the
`aemxsc/citizens` target the fstab mount points at). The site must resolve
through `bin/franklin.delivery/aemxsc/citizens/main`.

## Step 2 — Add AEM Code Sync

Install the [AEM Code Sync GitHub App](https://github.com/apps/aem-code-sync)
on `AEMXSC/citizens` so pushes to `main` publish the block code
(`component-definition.json` etc. are already built and committed).

## Step 3 — Register in Universal Editor

Point Universal Editor at the author site so the blocks are editable. The four
net-new blocks (`hero-commercial`, `feature-grid`, `fdic-banner`,
`section-title`) plus the existing library are already in the merged
`component-definition.json` / `component-models.json` / `component-filters.json`
and added to the `section` filter, so they appear in the UE component list.

## Step 4 — Confirm the shared CFs are published

The `securbank` persisted queries (`ArticleList`, `OfferList`/`OfferByPath`)
must be published on this author/publish tier. They are shared with nyl, so
they are likely already present; confirm in the GraphQL query console.

## Step 5 — Author the homepage in Universal Editor

Build the homepage from the analyzed structure in
`.snowflake/projects/001-homepage/decisions.json`, in order:

1. `fdic-banner` — FDIC logo + disclosure
2. `hero-commercial` — "Welcome to simplified checking and payments." + Get Started + image (sage)
3. `feature-grid` (image variant) — 4 product cards (credit cards, Multi-Year Approval, home equity, Round Ups)
4. `section-title` — "Customer service at your fingertips"
5. `feature-grid` (icon variant) — 4 service cards (Mobile & Online Banking, Contact Us, Find a Branch, Meet with a banker)
6. Optional: `content-fragment` / `offer` blocks to show the shared XSC Showcase CFs (the cross-surface parity with `citizens-next`)

## Step 6 — Export the content package

Once the homepage is authored, export it from Package Manager as the canonical,
reusable content package:

1. Go to `https://author-p153659-e1614585.adobeaemcloud.com/crx/packmgr`
2. Create a package; add a filter covering the citizens content root (the path from Step 1, e.g. `/content/aemxsc/citizens`).
3. Build, then download the `.zip`. That is the content package to re-upload / hand off. Store it alongside this repo or in the demo assets.

Because it is exported from a working instance, the xwalk JCR is guaranteed
correct, which is why we did not hand-build one.

## Step 7 — (pending) aem.live technical-account credential

Same long-standing item as nyl: wire the aem.live technical-account credential
so the public `.aem.page` URL renders. Needed for the public preview, not for
authoring.
