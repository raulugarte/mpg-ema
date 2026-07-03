/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Max Planck Society (mpg.de) site-wide cleanup.
 *
 * Removes non-authorable site chrome so the import contains only page-level
 * authorable content. In EDS the header and footer are auto-populated by the
 * header/footer blocks (and instrumented by the navigation/footer orchestrators),
 * so the source header, navigation, and footers must not survive into the import.
 *
 * Every selector below was verified against migration-work/cleaned.html
 * (line references are from that captured DOM):
 *   - nav.skiplink                                     (line 2)   skip link
 *   - header.navbar.hero.navigation-on-bottom          (line 5)   main header/nav
 *   - header.container-full-width.visible-print-block  (line 515) print-only header
 *   - div.footer-wrap.noindex                          (line 2927) wraps green footer + darkgreen sub-footer
 *   - footer.container-full-width.visible-print-block  (line 3041) print-only footer
 *
 * NOTE: The two `.deferred_extension` divs in the captured DOM (lines 2857, 2896)
 * carry durable authorable content (the Social Media post embeds consumed by the
 * columns-social block), so they are intentionally NOT removed here.
 *
 * ARTICLE-TEMPLATE CHROME (verified against migration-work/article/cleaned.html):
 * The article/detail template adds chrome the homepage does not have. These
 * selectors were confirmed ABSENT from migration-work/cleaned.html (the homepage
 * capture), so adding them here does not regress the homepage import:
 *   - div.content.py-0                    (line 533) breadcrumb wrapper: div.noindex >
 *                                                    nav.hidden-print > ol.breadcrumb.
 *                                                    Uniquely identified by the `py-0`
 *                                                    class — the article BODY is the
 *                                                    sibling `div.content` (no py-0) at
 *                                                    line 563 and is NOT matched here.
 *   - aside.sidebar                       (line 726) sibling of <main>, outside <article>:
 *                                                    sidebar-slider + graybox_container
 *                                                    (contact box + "Further articles").
 *   - div.social-media-buttons            (line 566) in-article social share toolbar
 *                                                    (Facebook/LinkedIn/etc. buttons).
 *                                                    Interactive chrome inside the body;
 *                                                    removing it leaves the title,
 *                                                    subtitle, meta date+tags, figures,
 *                                                    captions, headings, paragraphs and
 *                                                    lists intact.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // No cookie/consent/overlay widgets remain in the sanitized DOM, and nothing
    // here blocks block parsing. All chrome removal is deferred to afterTransform.
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site chrome (header/nav + footers) — auto-populated in EDS.
    WebImporter.DOMUtils.remove(element, [
      'nav.skiplink',
      'header.navbar.hero.navigation-on-bottom',
      'header.container-full-width.visible-print-block',
      'div.footer-wrap.noindex',
      'footer.container-full-width.visible-print-block',
    ]);

    // Article-template chrome (absent from the homepage capture — see header note).
    // Breadcrumb wrapper and the in-article social share toolbar are non-authorable.
    // div.content.py-0 targets ONLY the breadcrumb wrapper; the article body
    // (sibling div.content, no py-0) is left untouched.
    // NOTE: aside.sidebar is intentionally NOT removed here — the article-aside
    // parser converts it into the left utility column (Contact / Further articles /
    // Explore). It is parsed before this cleanup runs.
    WebImporter.DOMUtils.remove(element, [
      'div.content.py-0',
      'div.social-media-buttons',
    ]);

    // Body-level interactive widgets and print-only duplicates present on every mpg.de
    // page (confirmed leaking into BOTH the homepage and article imports). None are
    // authorable content; the on-screen equivalents live in the kept .hidden-print
    // siblings:
    //   - .visible-print / .visible-print-block  print-only duplicate <img>s + captions,
    //                                             and the "Web-View / Print Page /
    //                                             Estimated DIN-A4" print-footer bar
    //   - .extension-image-zoom                  image-zoom lightbox (slick gallery of
    //                                             zoomable figures with repeated captions
    //                                             and Previous/Next/Esc controls)
    //   - #pwa-settings-panel                    "Notification Settings" modal
    //   - #go_to_live                            "Go to Editor View" infobox link
    WebImporter.DOMUtils.remove(element, [
      '.visible-print',
      '.visible-print-block',
      '.extension-image-zoom',
      '#pwa-settings-panel',
      '#go_to_live',
    ]);

    // Safe leftover element/attribute cleanup.
    WebImporter.DOMUtils.remove(element, ['iframe', 'noscript']);
  }
}
