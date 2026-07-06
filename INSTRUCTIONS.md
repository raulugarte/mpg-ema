# XWalk Implementation Rules

Durable engineering rules for this AEM XWalk / Edge Delivery Services project. Follow
these across the whole site, not just individual files.

## Fragment loading (nav, footer, and any fragment)

- **Never hardcode `/content/nav.plain.html`** (or any `/content/...` fragment URL).
- **Never default to `/content/nav`** (or `/content/footer`, etc.).
- **Prefer page metadata as the source of truth.** Resolve the nav path from
  `getMetadata('nav')` and the footer path from `getMetadata('footer')`.
- **Safe XWalk fallback** when metadata is absent: the site-root default
  (`/nav`, `/footer`) — a public, mapped path that works on author, delivery, and
  the local `aem up` proxy.
- **Resolve to a pathname** for portability: `new URL(metaValue, window.location).pathname`.
  This normalizes absolute URLs, relative values, and root-relative paths to a
  single environment-safe form.
- **Do NOT make a guaranteed-first request that 404s and then falls back.** Issue a
  single request to the resolved path.

Canonical pattern:

```js
import { getMetadata } from '../../scripts/aem.js';

const meta = getMetadata('nav');                 // 'footer' for the footer block
const path = meta ? new URL(meta, window.location).pathname : '/nav';
const resp = await fetch(`${path}.plain.html`);
if (!resp.ok) return;
```

## Metadata-driven behavior

- When XWalk expects metadata-driven values, read them from the page head via
  `getMetadata(name)` (exported from `scripts/aem.js`) — do **not** rely on
  arbitrary block attributes (`data-nav`, `data-footer`) as the primary source.
- Metadata is authored per page / via the metadata sheet, so it stays correct
  across environments without code edits.

## Portability (author vs delivery)

- Code must behave identically on author, delivery (`*.aem.live`), preview
  (`*.aem.page`), and local proxy. Avoid any path that only resolves on one of them.
- Do not assume a specific `/content/<site>` root in client-side code. Delivery
  serves content at mapped public paths, not JCR `/content` paths.

## Site-specific workarounds

- Avoid site-specific fallbacks. If one is unavoidable, **label it clearly as
  temporary** with a comment explaining why and what removes the need for it.

## General

- Minimize diffs; do not change unrelated behavior.
- Fix an anti-pattern consistently everywhere it appears, not in one file only.
