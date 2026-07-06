/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: mpg-ema site-wide cleanup.
 *
 * Removes non-authorable site chrome from the Max Planck Society homepage
 * (https://www.mpg.de/en) so the import contains only page-level content.
 *
 * All selectors verified against migration-work/cleaned.html:
 *   - <nav class="skiplink">                                    (line 2)  skip link
 *   - <header class="navbar hero navigation-on-bottom">         (line 5)  main header/nav + search + pwa settings
 *   - <header class="container-full-width visible-print-block"> (line 515) print-only header
 *   - <footer class="... green footer trngl-footer hidden-print">      (line 2915) footer
 *   - <footer class="... darkgreen subfooter hidden-print">           (line 2993) sub-footer
 *   - <footer class="container-full-width visible-print-block">        (line 3028) print footer
 *   - <div class="pwa-settings-panel pwa-settings-close">              trailing PWA settings overlay
 *   - <div class="slick-slide slick-cloned ...">                      duplicated carousel clones
 *
 * NOTE: <div class="deferred_extension"> is intentionally NOT removed — on
 * this page it wraps the social-media-box embeds (Facebook/Bluesky) which are
 * authorable content extracted by the embed-social parser.
 *
 * Removal is done via WebImporter.DOMUtils.remove when available, with a native
 * fallback. mpg.de is an AMD/RequireJS page: when a `define` loader is present,
 * the injected helix-importer UMD bundle registers as an AMD module instead of
 * attaching `WebImporter` to the global scope, so the global can be absent at
 * runtime. The fallback keeps cleanup working in that case.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

function removeAll(element, selectors) {
  const wi = (typeof WebImporter !== 'undefined' && WebImporter)
    || (typeof globalThis !== 'undefined' && globalThis.WebImporter)
    || null;
  if (wi && wi.DOMUtils && typeof wi.DOMUtils.remove === 'function') {
    wi.DOMUtils.remove(element, selectors);
    return;
  }
  selectors.forEach((selector) => {
    element.querySelectorAll(selector).forEach((el) => el.remove());
  });
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Remove duplicated carousel slides injected by slick before block parsing,
    // so parsers don't extract cloned/duplicate cards from the sliders.
    removeAll(element, ['.slick-cloned']);
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site chrome (header/nav, search, footers, PWA overlays).
    removeAll(element, [
      'nav.skiplink',
      'header.navbar',
      'header.visible-print-block',
      'footer',
      '.pwa-settings-panel',
      'iframe',
      'link',
      'noscript',
      'script',
      'style',
    ]);
  }
}
