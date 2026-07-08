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

  // tools/importer/import-article.js
  var import_article_exports = {};
  __export(import_article_exports, {
    default: () => import_article_default
  });

  // tools/importer/parsers/article-meta.js
  function parse(element, { document: document2 }) {
    const dateEl = element.querySelector(".data .date, .date, .data");
    const dateText = dateEl ? dateEl.textContent.trim() : "";
    const tagAnchors = Array.from(element.querySelectorAll(".tags a[href]")).filter((a) => a.textContent.trim());
    let tagsPara = null;
    if (tagAnchors.length) {
      tagsPara = document2.createElement("p");
      tagAnchors.forEach((a, i) => {
        const link = document2.createElement("a");
        link.setAttribute("href", a.getAttribute("href"));
        link.textContent = a.textContent.trim();
        if (i > 0) tagsPara.appendChild(document2.createTextNode(" "));
        tagsPara.appendChild(link);
      });
    }
    if (!dateText && !tagsPara) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const dateCell = document2.createDocumentFragment();
    dateCell.appendChild(document2.createComment(" field:date "));
    if (dateText) dateCell.appendChild(document2.createTextNode(dateText));
    const tagsCell = document2.createDocumentFragment();
    tagsCell.appendChild(document2.createComment(" field:tags "));
    if (tagsPara) tagsCell.appendChild(tagsPara);
    const cells = [[dateCell], [tagsCell]];
    const block = WebImporter.Blocks.createBlock(document2, {
      name: "article-meta",
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/article-aside.js
  function parse2(element, { document: document2 }) {
    const parts = [];
    const addHeading = (text) => {
      const h = document2.createElement("h3");
      h.textContent = text;
      parts.push(h);
    };
    const quick = element.querySelector(".linklist, .graybox_container ul");
    if (quick) {
      const links = Array.from(quick.querySelectorAll("a[href]")).filter((a) => a.textContent.trim());
      if (links.length) {
        const ul = document2.createElement("ul");
        links.forEach((a) => {
          const li = document2.createElement("li");
          const link = document2.createElement("a");
          link.setAttribute("href", a.getAttribute("href"));
          link.textContent = a.textContent.trim();
          li.appendChild(link);
          ul.appendChild(li);
        });
        parts.push(ul);
      }
    }
    const name = element.querySelector(".employee_name");
    if (name && name.textContent.trim()) {
      addHeading("Contact");
      const p = document2.createElement("p");
      const strong = document2.createElement("strong");
      strong.textContent = name.textContent.trim();
      p.appendChild(strong);
      const position = element.querySelector(".position");
      if (position && position.textContent.trim()) {
        p.appendChild(document2.createElement("br"));
        p.appendChild(document2.createTextNode(position.textContent.trim()));
      }
      parts.push(p);
      const phone = element.querySelector(".phone a");
      if (phone && phone.textContent.trim()) {
        const pp = document2.createElement("p");
        const a = document2.createElement("a");
        a.setAttribute("href", phone.getAttribute("href"));
        a.textContent = phone.textContent.trim();
        pp.appendChild(a);
        parts.push(pp);
      }
      const email = element.querySelector(".email a");
      if (email && email.textContent.trim()) {
        const pe = document2.createElement("p");
        const a = document2.createElement("a");
        a.setAttribute("href", email.getAttribute("href"));
        a.textContent = email.textContent.trim();
        pe.appendChild(a);
        parts.push(pe);
      }
    }
    const groups = element.querySelectorAll(".group-extension");
    groups.forEach((g) => {
      if (!/further articles/i.test(g.textContent)) return;
      const ul = document2.createElement("ul");
      const seen = /* @__PURE__ */ new Set();
      const teasers = Array.from(g.querySelectorAll(".teaser-extension"));
      const sources = teasers.length ? teasers : [g];
      sources.forEach((t) => {
        const headlineA = t.querySelector(".text-box a[href], .meta-information a[href]") || t.querySelector("a[href]");
        const anchors = teasers.length ? headlineA ? [headlineA] : [] : Array.from(t.querySelectorAll("a[href]"));
        anchors.forEach((a) => {
          const href = a.getAttribute("href");
          const label = a.textContent.trim();
          if (!label || seen.has(href)) return;
          seen.add(href);
          const li = document2.createElement("li");
          const link = document2.createElement("a");
          link.setAttribute("href", href);
          link.textContent = label;
          li.appendChild(link);
          ul.appendChild(li);
        });
      });
      if (ul.children.length) {
        addHeading("Further articles");
        parts.push(ul);
      }
    });
    if (parts.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cell = document2.createDocumentFragment();
    cell.appendChild(document2.createComment(" field:content "));
    parts.forEach((n) => cell.appendChild(n));
    const block = WebImporter.Blocks.createBlock(document2, {
      name: "article-aside",
      cells: [[cell]]
    });
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

  // tools/importer/import-article.js
  var parsers = {
    "article-meta": parse,
    "article-aside": parse2,
    "cards-news": parse3
  };
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    name: "article",
    description: "Max Planck Society article/detail page: header/nav, article body with title, subtitle, meta information (date + tags), inline figures with captions, body paragraphs, section headings and lists, a sidebar, a related-articles block, and green/darkgreen footer.",
    urls: ["https://www.mpg.de/26798800/democracy-cannot-be-taken-for-granted"],
    blocks: [
      { name: "article-meta", instances: ["#page_content > div.container.content-wrapper > div.row > main > article > div.content:nth-of-type(2) > div.meta-information"] },
      { name: "article-aside", instances: ["#page_content > div.container.content-wrapper > div.row > aside.sidebar"] },
      { name: "cards-news", instances: ["#related-articles-container"] },
      {
        name: "section-related-articles",
        instances: ["#page_content > div.container-full-width.grey.hidden-print"],
        section: "grey",
        block: "cards-news"
      }
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
  var import_article_default = {
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
  return __toCommonJS(import_article_exports);
})();
