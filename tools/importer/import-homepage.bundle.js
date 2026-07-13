/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/hero-teaser.js
  function parse(element, { document: document2 }) {
    const image = element.querySelector('picture img, img[class*="hero"], img');
    const headline = element.querySelector(".headline h1, h1");
    const teaserSpan = element.querySelector("a > span, .teaser-text, .description");
    const teaserText = teaserSpan ? teaserSpan.textContent.trim() : "";
    const cta = element.querySelector(".more-link a, a.more");
    if (!image && !headline) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (image) {
      const imageCell = document2.createDocumentFragment();
      imageCell.appendChild(document2.createComment(" field:image "));
      imageCell.appendChild(image);
      cells.push([imageCell]);
    } else {
      cells.push([""]);
    }
    const textCell = document2.createDocumentFragment();
    textCell.appendChild(document2.createComment(" field:text "));
    if (headline) textCell.appendChild(headline);
    if (teaserText) {
      const p = document2.createElement("p");
      p.textContent = teaserText;
      textCell.appendChild(p);
    }
    if (cta) {
      const p = document2.createElement("p");
      p.appendChild(cta);
      textCell.appendChild(p);
    }
    cells.push([textCell]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-teaser", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-teasers.js
  function parse2(element, { document: document2 }) {
    let teasers = Array.from(element.querySelectorAll(".teaser"));
    if (teasers.length === 0) {
      teasers = Array.from(element.querySelectorAll('[class*="col-"] > .text-box, [class*="col-"] > div'));
    }
    if (teasers.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    teasers.forEach((teaser) => {
      const box = teaser.querySelector(".text-box") || teaser;
      const heading = box.querySelector("h2, h3, h4");
      const paragraphs = Array.from(box.querySelectorAll("p"));
      const image = teaser.querySelector("picture img, img");
      const imageCell = document2.createDocumentFragment();
      if (image) {
        imageCell.appendChild(document2.createComment(" field:image "));
        imageCell.appendChild(image);
      }
      const textCell = document2.createDocumentFragment();
      textCell.appendChild(document2.createComment(" field:text "));
      if (heading) textCell.appendChild(heading);
      paragraphs.forEach((p) => textCell.appendChild(p));
      cells.push([imageCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-teasers", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-news.js
  function parse3(element, { document: document2 }) {
    const teasers = Array.from(element.querySelectorAll(".teaser")).filter((t) => !t.closest(".slick-cloned"));
    if (teasers.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    let sectionTitleEl = element.querySelector(".linked_title h2, .linked_title h1, .linked_title h3");
    if (!sectionTitleEl) {
      const greyBand = element.closest(".container-full-width");
      if (greyBand) {
        sectionTitleEl = greyBand.querySelector(":scope > .container h2, :scope > .container h1");
      }
    }
    let sectionHeading = null;
    if (sectionTitleEl && sectionTitleEl.textContent.trim()) {
      sectionHeading = document2.createElement("h2");
      sectionHeading.textContent = sectionTitleEl.textContent.trim();
      if (!element.contains(sectionTitleEl)) {
        const wrapper = sectionTitleEl.closest(".row") || sectionTitleEl;
        wrapper.remove();
      }
    }
    const ctaLink = element.querySelector(".text-center a.btn, .text-center a[href]");
    let ctaPara = null;
    if (ctaLink && ctaLink.getAttribute("href")) {
      const a = document2.createElement("a");
      a.setAttribute("href", ctaLink.getAttribute("href"));
      a.textContent = ctaLink.textContent.trim();
      ctaPara = document2.createElement("p");
      ctaPara.appendChild(a);
    }
    const cells = [];
    teasers.forEach((teaser) => {
      const image = teaser.querySelector(".img-box img, picture img, img");
      const textBox = teaser.querySelector(".text-box") || teaser;
      const title = textBox.querySelector("h3, h2, h4");
      const date = textBox.querySelector(".date, .data .attribute, .data");
      const tags = textBox.querySelector(".tags");
      let description = teaser.querySelector(".description, p.select-correct-strong-color");
      if (!description) {
        description = Array.from(teaser.querySelectorAll(":scope p, .text-box > p")).find((p) => p.textContent.trim() && !p.closest(".meta-information")) || null;
      }
      const imageCell = document2.createDocumentFragment();
      if (image) {
        imageCell.appendChild(document2.createComment(" field:image "));
        imageCell.appendChild(image);
      }
      const textCell = document2.createDocumentFragment();
      textCell.appendChild(document2.createComment(" field:text "));
      if (title) textCell.appendChild(title);
      if (date) {
        const p = document2.createElement("p");
        p.textContent = date.textContent.trim();
        textCell.appendChild(p);
      }
      if (tags) textCell.appendChild(tags);
      if (description) {
        const p = document2.createElement("p");
        p.textContent = description.textContent.trim();
        textCell.appendChild(p);
      }
      cells.push([imageCell, textCell]);
    });
    const isRelatedStrip = element.id === "related-articles-container" || !!element.closest("#related-articles-container") || !!element.querySelector(".slick-slider, .slick-track, .slick-list");
    const blockName = isRelatedStrip ? "cards-news (carousel)" : "cards-news";
    const block = WebImporter.Blocks.createBlock(document2, { name: blockName, cells });
    const out = [];
    if (sectionHeading) out.push(sectionHeading);
    out.push(block);
    if (ctaPara) out.push(ctaPara);
    element.replaceWith(...out);
  }

  // tools/importer/parsers/cards-topic.js
  function parse4(element, { document: document2 }) {
    const teasers = Array.from(element.querySelectorAll(".teaser"));
    if (teasers.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const sectionTitleEl = element.querySelector(".linked_title h2, .linked_title h1, .linked_title h3");
    let sectionHeading = null;
    if (sectionTitleEl && sectionTitleEl.textContent.trim()) {
      sectionHeading = document2.createElement("h2");
      sectionHeading.textContent = sectionTitleEl.textContent.trim();
    }
    const ctaLink = element.querySelector(".text-center a.btn, .text-center a[href]");
    let ctaPara = null;
    if (ctaLink && ctaLink.getAttribute("href")) {
      const a = document2.createElement("a");
      a.setAttribute("href", ctaLink.getAttribute("href"));
      a.textContent = ctaLink.textContent.trim();
      ctaPara = document2.createElement("p");
      ctaPara.appendChild(a);
    }
    const cells = [];
    teasers.forEach((teaser) => {
      const image = teaser.querySelector(".img-box img, picture img, img");
      const textBox = teaser.querySelector(".text-box") || teaser;
      const title = textBox.querySelector("h3, h2, h4");
      const description = textBox.querySelector(".description");
      const imageCell = document2.createDocumentFragment();
      if (image) {
        imageCell.appendChild(document2.createComment(" field:image "));
        imageCell.appendChild(image);
      }
      const textCell = document2.createDocumentFragment();
      textCell.appendChild(document2.createComment(" field:text "));
      if (title) textCell.appendChild(title);
      if (description) {
        const p = document2.createElement("p");
        p.textContent = description.textContent.trim();
        textCell.appendChild(p);
      }
      cells.push([imageCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-topic", cells });
    const out = [];
    if (sectionHeading) out.push(sectionHeading);
    out.push(block);
    if (ctaPara) out.push(ctaPara);
    element.replaceWith(...out);
  }

  // tools/importer/parsers/carousel-slider.js
  function parse5(element, { document: document2 }) {
    const sectionTitleEl = element.querySelector(":scope > .container > h2, :scope > .container > h1, :scope h2.h1, :scope h2.invert");
    let sectionHeading = null;
    if (sectionTitleEl && sectionTitleEl.textContent.trim()) {
      sectionHeading = document2.createElement("h2");
      sectionHeading.textContent = sectionTitleEl.textContent.trim();
    }
    let slides = Array.from(element.querySelectorAll(".slick-slide:not(.slick-cloned)"));
    if (slides.length === 0) {
      slides = Array.from(element.querySelectorAll(".slick-slide"));
    }
    if (slides.length === 0) {
      slides = Array.from(element.querySelectorAll(".pub-slider-item, .teaser, .box-color, .col-xs-12"));
    }
    if (slides.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    slides.forEach((slide) => {
      const image = slide.querySelector("picture img, img");
      const boxHeader = slide.querySelector(".box-header");
      const titleLink = slide.querySelector("a.h3, .text-box h3 a, h3 a, h2 a");
      const date = slide.querySelector("time.date, .date");
      const topic = slide.querySelector(".topic");
      const description = slide.querySelector(".description");
      const more = slide.querySelector("a.more");
      const coverLink = slide.querySelector(".pub-slider-item > a, a > picture");
      const imageCell = document2.createDocumentFragment();
      if (image) {
        imageCell.appendChild(document2.createComment(" field:media_image "));
        imageCell.appendChild(image);
      }
      const textCell = document2.createDocumentFragment();
      const textParts = [];
      if (boxHeader) {
        const p = document2.createElement("p");
        p.textContent = boxHeader.textContent.trim();
        textParts.push(p);
      }
      if (titleLink) {
        const h = document2.createElement("h3");
        h.appendChild(titleLink);
        textParts.push(h);
      }
      if (date) {
        const p = document2.createElement("p");
        p.textContent = date.textContent.trim();
        textParts.push(p);
      }
      if (topic) {
        const p = document2.createElement("p");
        p.textContent = topic.textContent.trim();
        textParts.push(p);
      }
      if (description) {
        const p = document2.createElement("p");
        p.textContent = description.textContent.trim();
        textParts.push(p);
      }
      if (more) {
        const p = document2.createElement("p");
        p.appendChild(more);
        textParts.push(p);
      }
      if (textParts.length > 0) {
        textCell.appendChild(document2.createComment(" field:content_text "));
        textParts.forEach((el) => textCell.appendChild(el));
      }
      cells.push([imageCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "carousel-slider", cells });
    const out = [];
    if (sectionHeading) out.push(sectionHeading);
    out.push(block);
    element.replaceWith(...out);
  }

  // tools/importer/parsers/columns-events.js
  function parse6(element, { document: document2 }) {
    const columns = Array.from(element.querySelectorAll(':scope .row > [class*="col-"]'));
    if (columns.length < 1) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const sectionTitleEl = element.querySelector(".linked_title h2, .linked_title h1, .linked_title h3");
    let sectionHeading = null;
    if (sectionTitleEl && sectionTitleEl.textContent.trim()) {
      sectionHeading = document2.createElement("h2");
      sectionHeading.textContent = sectionTitleEl.textContent.trim();
    }
    const leftSource = columns[0];
    const rightSource = columns[1] || null;
    const leftCell = document2.createElement("div");
    const monthYear = leftSource ? leftSource.querySelector(".month_year") : null;
    if (monthYear) {
      const p = document2.createElement("p");
      p.textContent = monthYear.textContent.replace(/\s+/g, " ").trim();
      leftCell.appendChild(p);
    }
    const events = leftSource ? Array.from(leftSource.querySelectorAll(".single_event")) : [];
    events.forEach((ev) => {
      const titleLink = ev.querySelector("h5 a, a");
      const time = ev.querySelector(".event_time");
      if (titleLink) {
        const h = document2.createElement("h5");
        h.appendChild(titleLink);
        leftCell.appendChild(h);
      }
      if (time) {
        const p = document2.createElement("p");
        p.textContent = time.textContent.trim();
        leftCell.appendChild(p);
      }
    });
    const rightCell = document2.createElement("div");
    if (rightSource) {
      const tickerHead = rightSource.querySelector(".ticker_head, h2, h3");
      if (tickerHead) {
        const h = document2.createElement("h3");
        h.textContent = tickerHead.textContent.trim();
        rightCell.appendChild(h);
      }
      const tickerItems = Array.from(rightSource.querySelectorAll(".ticker_children a, .ticker_children .single_event"));
      if (tickerItems.length > 0) {
        tickerItems.forEach((item) => {
          const p = document2.createElement("p");
          p.appendChild(item.cloneNode(true));
          rightCell.appendChild(p);
        });
      } else {
        const empty = rightSource.querySelector(".nothing_found");
        if (empty) {
          const p = document2.createElement("p");
          p.textContent = empty.textContent.trim();
          rightCell.appendChild(p);
        }
      }
    }
    const cells = [[leftCell, rightCell]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-events", cells });
    const out = [];
    if (sectionHeading) out.push(sectionHeading);
    out.push(block);
    element.replaceWith(...out);
  }

  // tools/importer/parsers/embed-social.js
  function parse7(element, { document: document2 }) {
    const deferred = Array.from(element.querySelectorAll(".deferred_extension[data-deffered-url]"));
    const image = element.querySelector("picture img, img");
    const uris = deferred.map((d) => d.getAttribute("data-deffered-url")).filter(Boolean).map((u) => {
      try {
        return new URL(u, "https://www.mpg.de/").href;
      } catch (e) {
        return u;
      }
    });
    if (uris.length === 0 && !image) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const contentCell = document2.createDocumentFragment();
    contentCell.appendChild(document2.createComment(" field:embed_placeholder "));
    if (image) {
      contentCell.appendChild(image);
    }
    contentCell.appendChild(document2.createComment(" field:embed_placeholderAlt "));
    contentCell.appendChild(document2.createComment(" field:embed_uri "));
    uris.forEach((uri) => {
      const a = document2.createElement("a");
      a.href = uri;
      a.textContent = uri;
      const p = document2.createElement("p");
      p.appendChild(a);
      contentCell.appendChild(p);
    });
    const cells = [[contentCell]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "embed-social", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/mpg-ema-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function removeAll(element, selectors) {
    const wi = typeof WebImporter !== "undefined" && WebImporter || typeof globalThis !== "undefined" && globalThis.WebImporter || null;
    if (wi && wi.DOMUtils && typeof wi.DOMUtils.remove === "function") {
      wi.DOMUtils.remove(element, selectors);
      return;
    }
    selectors.forEach((selector) => {
      element.querySelectorAll(selector).forEach((el) => el.remove());
    });
  }
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      removeAll(element, [".slick-cloned"]);
      removeAll(element, [
        "img.visible-print-block",
        ".description.visible-print",
        ".copyright.visible-print"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      removeAll(element, [
        "nav.skiplink",
        "header.navbar",
        "header.visible-print-block",
        "footer",
        ".pwa-settings-panel",
        // Article/detail page chrome (see docblock). Precise selectors only — the
        // related-articles band shares the .hidden-print class but is in scope.
        "div.content.py-0",
        // breadcrumb wrapper (holds only nav.hidden-print)
        "nav.hidden-print",
        // breadcrumb navigation list
        "div.social-media-buttons",
        // auto-generated share-widget row
        "div.print-footer",
        // print/editor chrome (Web-View, Print Page, Estimated DIN-A4)
        "#go_to_live",
        // editor overlay (Go to Editor View)
        "#slick_container_js",
        // fullscreen image-gallery lightbox (duplicated captions, Next/Esc)
        ".fullscreen-slick",
        // same gallery lightbox (class fallback if id differs at runtime)
        ".slick-grid-close-icon",
        // gallery close control (holds the stray "Esc" text)
        "iframe",
        "link",
        "noscript",
        "script",
        "style"
      ]);
    }
  }

  // tools/importer/transformers/mpg-ema-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var BAND_STYLE_MAP = {
    "cards-news": { 0: "grey", 2: "grey" },
    // News, Career (index 1 = International, white)
    "cards-topic": { 0: "primary" },
    // Topic Specials
    "carousel-slider": { 1: "grey", 2: "grey" }
    // From the Institutes, Multimedia (index 0 = Publications, white)
  };
  function getWebImporter() {
    return typeof WebImporter !== "undefined" && WebImporter || typeof globalThis !== "undefined" && globalThis.WebImporter || null;
  }
  function norm(text) {
    return (text || "").replace(/\s+/g, " ").trim().toLowerCase();
  }
  function computeBlockName(name) {
    return name.replace(/-/g, " ").replace(/\s(.)/g, (s) => s.toUpperCase()).replace(/^(.)/g, (s) => s.toUpperCase());
  }
  function styleMapFromTemplate(payload) {
    const template = payload && payload.template;
    if (!template) return null;
    const realBlocks = Array.isArray(template.blocks) ? template.blocks.filter((b) => b && typeof b.name === "string" && !b.name.startsWith("section-")) : [];
    function resolveBlockInstance(sectionSelectors, explicitBlock) {
      for (let b = 0; b < realBlocks.length; b += 1) {
        const rb = realBlocks[b];
        if (explicitBlock && rb.name !== explicitBlock) continue;
        const instances = Array.isArray(rb.instances) ? rb.instances : [];
        for (let i = 0; i < instances.length; i += 1) {
          const rbSel = instances[i];
          const hit = sectionSelectors.some(
            (secSel) => rbSel === secSel || rbSel.indexOf(secSel) !== -1 || secSel.indexOf(rbSel) !== -1
          );
          if (hit) return { block: rb.name, index: i };
        }
      }
      if (explicitBlock) {
        const rb = realBlocks.find((x) => x.name === explicitBlock);
        if (rb) return { block: explicitBlock, index: 0 };
      }
      return null;
    }
    const rules = [];
    if (Array.isArray(template.sections)) {
      template.sections.forEach((section) => {
        if (!section) return;
        const style = section.style || section.section;
        if (!style) return;
        const selectors = Array.isArray(section.instances) ? section.instances : section.selector ? [section.selector] : [];
        const resolved = resolveBlockInstance(selectors, section.block);
        if (resolved) rules.push(__spreadProps(__spreadValues({}, resolved), { style }));
      });
    }
    if (Array.isArray(template.blocks)) {
      template.blocks.forEach((blockDef) => {
        if (!blockDef || typeof blockDef.name !== "string") return;
        if (!blockDef.name.startsWith("section-")) return;
        const style = blockDef.style || blockDef.section;
        if (!style) return;
        const selectors = Array.isArray(blockDef.instances) ? blockDef.instances : [];
        const resolved = resolveBlockInstance(selectors, blockDef.block);
        if (resolved) rules.push(__spreadProps(__spreadValues({}, resolved), { style }));
      });
    }
    if (rules.length === 0) return null;
    const map = {};
    rules.forEach(({ block, index, style }) => {
      map[block] = map[block] || {};
      map[block][index] = style;
    });
    return map;
  }
  var BLOCK_NAME_BY_HEADER = Object.keys(BAND_STYLE_MAP).reduce((acc, name) => {
    acc[norm(computeBlockName(name))] = name;
    return acc;
  }, {});
  function headerLookupFor(styleMap) {
    return Object.keys(styleMap).reduce((acc, name) => {
      acc[norm(computeBlockName(name))] = name;
      return acc;
    }, {});
  }
  function blockTableHeaderName(table) {
    const firstRow = table.querySelector(":scope > tbody > tr, :scope > tr");
    if (!firstRow) return "";
    const th = firstRow.querySelector(":scope > th");
    if (!th) return "";
    return norm(th.textContent.replace(/\s*\([^)]*\)\s*$/, ""));
  }
  function resolveStyledBands(element, styleMap, headerMap) {
    const doc = element.ownerDocument || document;
    const root = element || doc.body;
    const tables = Array.from(root.querySelectorAll("table"));
    const perName = {};
    const bands = [];
    tables.forEach((table) => {
      const header = blockTableHeaderName(table);
      const blockName = headerMap[header];
      if (!blockName) return;
      const idx = perName[blockName] || 0;
      perName[blockName] = idx + 1;
      const style = styleMap[blockName] && styleMap[blockName][idx];
      if (style) bands.push({ el: table, style });
    });
    return bands;
  }
  function buildSectionMetadata(doc, style, wi) {
    if (wi && wi.Blocks && typeof wi.Blocks.createBlock === "function") {
      return wi.Blocks.createBlock(doc, { name: "Section Metadata", cells: { style } });
    }
    const table = doc.createElement("table");
    const head = doc.createElement("tr");
    const th = doc.createElement("th");
    th.textContent = "Section Metadata";
    head.appendChild(th);
    table.appendChild(head);
    const row = doc.createElement("tr");
    const keyCell = doc.createElement("td");
    keyCell.textContent = "style";
    const valCell = doc.createElement("td");
    valCell.textContent = style;
    row.appendChild(keyCell);
    row.appendChild(valCell);
    table.appendChild(row);
    return table;
  }
  function transform2(hookName, element, payload) {
    if (hookName !== TransformHook2.afterTransform) return;
    const wi = getWebImporter();
    const doc = element.ownerDocument || document;
    const templateMap = styleMapFromTemplate(payload);
    const styleMap = templateMap || BAND_STYLE_MAP;
    const headerMap = templateMap ? headerLookupFor(templateMap) : BLOCK_NAME_BY_HEADER;
    const bands = resolveStyledBands(element, styleMap, headerMap);
    for (let i = bands.length - 1; i >= 0; i -= 1) {
      const { style, el } = bands[i];
      if (style) {
        const meta = buildSectionMetadata(doc, style, wi);
        if (el.nextSibling) {
          el.parentNode.insertBefore(meta, el.nextSibling);
        } else {
          el.parentNode.appendChild(meta);
        }
      }
      let breakBefore = el;
      const prev = el.previousElementSibling;
      if (prev && /^H[1-6]$/.test(prev.tagName)) {
        breakBefore = prev;
      }
      const allElements = Array.from((element || doc.body).querySelectorAll("*"));
      const isFirstContent = allElements.indexOf(breakBefore) <= 0;
      if (!isFirstContent) {
        const hr = doc.createElement("hr");
        breakBefore.parentNode.insertBefore(hr, breakBefore);
      }
    }
  }

  // tools/importer/import-homepage.js
  var parsers = {
    "hero-teaser": parse,
    "cards-teasers": parse2,
    "cards-news": parse3,
    "cards-topic": parse4,
    "carousel-slider": parse5,
    "columns-events": parse6,
    "embed-social": parse7
  };
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    name: "homepage",
    description: "Max Planck Society homepage: header/nav, hero teaser, multiple teaser/card rows across white/grey/primary bands, publications and institute-news sliders, events, and a green/darkgreen footer.",
    urls: ["https://www.mpg.de/en"],
    blocks: [
      { name: "hero-teaser", instances: ["#page_content > main > div.container-full-width.background-block.teaser-hero"] },
      { name: "cards-teasers", instances: ["#page_content > main > div.responsive_column.container-full-width.white:nth-of-type(2)"] },
      {
        name: "cards-news",
        instances: [
          "#page_content > main > div.responsive_column.container-full-width.grey:nth-of-type(3)",
          "#page_content > main > div.responsive_column.container-full-width.white:nth-of-type(4)",
          "#page_content > main > div.responsive_column.container-full-width.grey:nth-of-type(5)"
        ]
      },
      { name: "cards-topic", instances: ["#page_content > main > div.responsive_column.container-full-width.primary"] },
      {
        name: "carousel-slider",
        instances: [
          "#page_content > main > div.container-full-width.white:nth-of-type(7)",
          "#page_content > main > div.container-full-width.grey:nth-of-type(8)",
          "#page_content > main > div.container-full-width.homepage_slider.grey"
        ]
      },
      { name: "columns-events", instances: ["#page_content > main > div.responsive_column.container-full-width.white:nth-of-type(9)"] },
      { name: "embed-social", instances: ["#page_content > main > div.responsive_column.container-full-width.white:nth-of-type(11)"] }
    ]
  };
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      if (blockDef.name.startsWith("section-")) return;
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({ name: blockDef.name, selector, element });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_homepage_default = {
    transform: (payload) => {
      const {
        document: document2,
        url,
        html,
        params
      } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
      );
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_homepage_exports);
})();
