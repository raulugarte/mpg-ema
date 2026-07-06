# Update `.migration/project.json` Configuration

## Objective

Replace the contents of `.migration/project.json` with the new configuration provided, which adds AEM Author content-targeting properties (`contentHostUrl`, `aemSitePath`, `aemAssetsFolderPath`, `aemSiteName`, `aemSiteTitle`) needed by the AEM content packager, and drops the previous nested `sites.mpg-ema` structure in favor of a flat top-level shape.

## Current State (for reference)

The existing `.migration/project.json` uses a nested structure:

```json
{
  "type": "xwalk",
  "sites": {
    "mpg-ema": {
      "previewOrg": "raulugarte",
      "previewSite": "mpg-ema",
      "baseUrl": "https://www.mpg.de/en",
      "libraryUrl": "https://main--sta-xwalk-boilerplate--aemysites.aem.page/tools/sidekick/library.json"
    }
  }
}
```

## Target State (requested)

```json
{
  "type": "xwalk",
  "libraryUrl": "https://main--sta-xwalk-boilerplate--aemysites.aem.page/tools/sidekick/library.json",
  "previewOrg": "raulugarte",
  "previewSite": "mpg-ema",
  "contentHostUrl": "author-p130407-e1279066.adobeaemcloud.com",
  "aemSitePath": "/content/mpg-ema",
  "aemAssetsFolderPath": "/content/dam/mpg-ema",
  "aemSiteName": "mpg-ema",
  "aemSiteTitle": "mpg-ema"
}
```

## Key Changes

- **Adds** `contentHostUrl`, `aemSitePath`, `aemAssetsFolderPath`, `aemSiteName`, `aemSiteTitle` — these give the AEM content packager an explicit `/content/mpg-ema` site + `/content/dam/mpg-ema` assets target, directly addressing the "missing site configuration" the packager reported.
- **Flattens** structure: `previewOrg`, `previewSite`, `libraryUrl` move to top level (was under `sites.mpg-ema`).
- **Drops** `baseUrl` (`https://www.mpg.de/en`) — the source-site URL previously stored under the nested site.

## Considerations / Watch-outs

- **`baseUrl` removal:** the new shape has no `baseUrl`. If any migration tooling in this repo still reads `sites.<name>.baseUrl` or a top-level `baseUrl`, it may lose the source-site reference. Verify nothing depends on it before relying on the new file.
- **Shape change:** tooling that expects the nested `sites: { "mpg-ema": {...} }` object will no longer find it. Since the user supplied this exact target, we implement as given, but flag this for validation.
- **JSON validity:** write exactly the provided JSON (2-space indent), ensure it parses.

## Checklist

- [ ] Read current `.migration/project.json` to record the pre-change state
- [ ] Grep the repo for readers of `.migration/project.json` (e.g. `sites.`, `baseUrl`, `aemSitePath`, `contentHostUrl`) to assess impact of the shape change and `baseUrl` removal
- [ ] Overwrite `.migration/project.json` with the exact JSON provided by the user
- [ ] Validate the file is well-formed JSON
- [ ] Report the applied change and note any tooling that referenced the removed/renamed fields

## Execution Note

Applying this file replacement requires **Execute mode** — switch to Execute and I will write the new `.migration/project.json` and run the validation/impact checks above.
