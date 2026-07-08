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
 * ── Article/detail page chrome (additive; from page-structure.json outOfScope) ──
 * The article template (e.g. /26798800/democracy-cannot-be-taken-for-granted)
 * carries page chrome the homepage does not. Verified against
 * migration-work/cleaned.html:
 *   - <div class="content py-0"> (line 533) wraps ONLY
 *       <div class="noindex"><nav class="hidden-print"><ol class="breadcrumb">…
 *     i.e. auto-generated breadcrumb navigation. The whole py-0 utility div is
 *     removed (it holds no authored content). We target the breadcrumb precisely
 *     rather than every ".py-0" or ".hidden-print".
 *   - <nav class="hidden-print"> (line 535) breadcrumb list — auto-generated nav.
 *   - <div class="social-media-buttons hidden-print"> (line 566) auto-generated
 *     share-widget row. It lives INSIDE the authored <div class="content"> next
 *     to the h1/subtitle/meta/figures, so ONLY this element is removed — never
 *     its container.
 *
 * ⚠️ The related-articles band <div class="container-full-width grey hidden-print">
 * (line 925) is IN SCOPE (parsed as cards-news). We must NOT remove by the broad
 * ".hidden-print" class — only the precise breadcrumb/share selectors below.
 * These selectors do not exist on the homepage, so adding them is safe there.
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

    // Article figures carry BOTH a screen version and a print-only duplicate:
    //   image:   <picture> (screen)  +  <img class="visible-print-block banner"> (print)
    //   caption: div.description.hidden-print  +  div.description.visible-print
    //   credit:  p.copyright.hidden-print       +  div.copyright.visible-print
    // Without removing the print copies, every image and caption imports twice.
    // Strip the print-only variants up front (before parsing) so only the
    // on-screen version survives. Scoped to the print classes so the in-scope
    // screen content (.hidden-print elements) is untouched.
    removeAll(element, [
      'img.visible-print-block',
      '.description.visible-print',
      '.copyright.visible-print',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site chrome (header/nav, search, footers, PWA overlays).
    removeAll(element, [
      'nav.skiplink',
      'header.navbar',
      'header.visible-print-block',
      'footer',
      '.pwa-settings-panel',
      // Article/detail page chrome (see docblock). Precise selectors only — the
      // related-articles band shares the .hidden-print class but is in scope.
      'div.content.py-0', // breadcrumb wrapper (holds only nav.hidden-print)
      'nav.hidden-print', // breadcrumb navigation list
      'div.social-media-buttons', // auto-generated share-widget row
      'div.print-footer', // print/editor chrome (Web-View, Print Page, Estimated DIN-A4)
      '#go_to_live', // editor overlay (Go to Editor View)
      '#slick_container_js', // fullscreen image-gallery lightbox (duplicated captions, Next/Esc)
      '.fullscreen-slick', // same gallery lightbox (class fallback if id differs at runtime)
      '.slick-grid-close-icon', // gallery close control (holds the stray "Esc" text)
      'iframe',
      'link',
      'noscript',
      'script',
      'style',
    ]);
  }
}
