# Project Context — mpg-ema

Site-specific assumptions, known paths, and environment notes. Pair with the durable
rules in [INSTRUCTIONS.md](./INSTRUCTIONS.md).

## Project

- **Type:** AEM XWalk / Edge Delivery Services (crosswalk / Universal Editor).
- **Org / Site:** `raulugarte` / `mpg-ema`, branch `main`.
- **Source site being modernized:** https://www.mpg.de/en

## Environments

- **Preview:** https://main--mpg-ema--raulugarte.aem.page/
- **Live:** https://main--mpg-ema--raulugarte.aem.live/
- **AEM author:** https://author-p130407-e1279066.adobeaemcloud.com
- **Local dev:** `aem up` → http://localhost:3000 (proxies the repo)

## AEM content targets (from `.migration/project.json`)

- **Site path:** `content/mpg-ema`
- **Assets folder:** `content/dam/mpg-ema`
- These are **AEM JCR paths** used by the content packager / import tooling.
  They are **not** used for client-side fragment fetches — see below.

## Fragment paths (nav / footer)

- Client-side blocks resolve fragments from **page metadata** first, then the
  site-root default:
  - nav: `getMetadata('nav')` → else `/nav`
  - footer: `getMetadata('footer')` → else `/footer`
- Do **not** fetch `/content/...` for fragments in delivery — content is served at
  mapped public paths. The JCR `content/mpg-ema` path above is for authoring/import
  only.
- If nav/footer are published at a non-root location, set `<meta name="nav">` /
  `<meta name="footer">` in page metadata rather than hardcoding a path in code.

## Blocks (migrated)

- `header`, `footer`, `hero-teaser`, `cards-teaser`, `carousel-slider`,
  `columns-social`, `article-aside` — each with its `_<block>.json` model registered
  in `component-definition.json` / `component-models.json`.

## Notes

- `fstab.yaml` mountpoint uses the `franklin.delivery` markup endpoint (xwalk
  rendering), separate from the JCR content targets above.
- External images from the source (`www.mpg.de/...`) are kept as absolute URLs in
  blocks; only same-origin images are run through `createOptimizedPicture`.
