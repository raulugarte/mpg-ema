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

  // tools/importer/parsers/carousel-slider.js
  function parse(element, { document }) {
    let slideEls = Array.from(element.querySelectorAll(
      ":scope .pub-slider-item, :scope .box-color, :scope .teaser"
    ));
    if (slideEls.length === 0) {
      slideEls = Array.from(element.querySelectorAll(':scope .slick-slide, :scope [class*="slider-item"]'));
    }
    slideEls = slideEls.filter((el) => !el.closest(".slick-cloned"));
    const cells = [];
    slideEls.forEach((slide) => {
      const image = slide.querySelector("picture img, img");
      const imageLink = image ? image.closest("a") : null;
      let imageCell = "";
      if (image) {
        const frag = document.createDocumentFragment();
        frag.appendChild(document.createComment(" field:media_image "));
        frag.appendChild(imageLink || image);
        imageCell = frag;
      }
      const textParts = [];
      const headingLink = slide.querySelector(":scope > a.h3, .text-box > a.h3");
      const headingEl = slide.querySelector(".text-box h3, .meta-information h3, h1, h2, h3, h4, .headline");
      if (headingEl && !headingEl.closest("a")) {
        textParts.push(headingEl);
      } else if (headingLink) {
        const h = document.createElement("h3");
        const a = document.createElement("a");
        if (headingLink.getAttribute("href")) a.setAttribute("href", headingLink.getAttribute("href"));
        a.textContent = headingLink.textContent.trim();
        h.appendChild(a);
        textParts.push(h);
      }
      const boxHeader = slide.querySelector(":scope > .box-header, .box-header");
      if (boxHeader && boxHeader.textContent.trim()) {
        const p = document.createElement("p");
        p.textContent = boxHeader.textContent.trim();
        textParts.unshift(p);
      }
      const dateEl = slide.querySelector("time.date, .data .date, .date");
      if (dateEl && dateEl.textContent.trim()) {
        const p = document.createElement("p");
        p.textContent = dateEl.textContent.trim();
        textParts.push(p);
      }
      const topicEl = slide.querySelector(".meta-information .topic, .data .topic, .topic, .label");
      if (topicEl && topicEl.textContent.trim()) {
        const p = document.createElement("p");
        p.textContent = topicEl.textContent.trim();
        textParts.push(p);
      }
      const tagLinks = Array.from(slide.querySelectorAll(".tags a"));
      if (tagLinks.length > 0) {
        const p = document.createElement("p");
        tagLinks.forEach((a, i) => {
          const span = document.createElement("a");
          if (a.getAttribute("href")) span.setAttribute("href", a.getAttribute("href"));
          span.textContent = a.textContent.trim();
          if (i > 0) p.appendChild(document.createTextNode(", "));
          p.appendChild(span);
        });
        textParts.push(p);
      }
      const descEls = Array.from(slide.querySelectorAll(
        ":scope .text-box > p, :scope > .description, :scope .text-box > .description"
      ));
      descEls.forEach((d) => {
        if (!d.textContent.trim()) return;
        const p = document.createElement("p");
        p.textContent = d.textContent.trim();
        textParts.push(p);
      });
      const moreLink = slide.querySelector("a.more, .more-link a");
      if (moreLink && moreLink !== imageLink && moreLink.textContent.trim()) {
        const p = document.createElement("p");
        const a = document.createElement("a");
        if (moreLink.getAttribute("href")) a.setAttribute("href", moreLink.getAttribute("href"));
        a.textContent = moreLink.textContent.trim();
        p.appendChild(a);
        textParts.push(p);
      }
      let textCell = "";
      if (textParts.length > 0) {
        const frag = document.createDocumentFragment();
        frag.appendChild(document.createComment(" field:content_text "));
        textParts.forEach((n) => frag.appendChild(n));
        textCell = frag;
      }
      if (imageCell === "" && textCell === "") return;
      cells.push([imageCell, textCell]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-slider", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/article-aside.js
  function parse2(element, { document }) {
    const parts = [];
    const addHeading = (text) => {
      const h = document.createElement("h3");
      h.textContent = text;
      parts.push(h);
    };
    const quick = element.querySelector(".linklist, .graybox_container ul");
    if (quick) {
      const links = Array.from(quick.querySelectorAll("a[href]")).filter((a) => a.textContent.trim());
      if (links.length) {
        const ul = document.createElement("ul");
        links.forEach((a) => {
          const li = document.createElement("li");
          const link = document.createElement("a");
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
      const p = document.createElement("p");
      const strong = document.createElement("strong");
      strong.textContent = name.textContent.trim();
      p.appendChild(strong);
      const position = element.querySelector(".position");
      if (position && position.textContent.trim()) {
        p.appendChild(document.createElement("br"));
        p.appendChild(document.createTextNode(position.textContent.trim()));
      }
      parts.push(p);
      const phone = element.querySelector(".phone a");
      if (phone && phone.textContent.trim()) {
        const pp = document.createElement("p");
        const a = document.createElement("a");
        a.setAttribute("href", phone.getAttribute("href"));
        a.textContent = phone.textContent.trim();
        pp.appendChild(a);
        parts.push(pp);
      }
      const email = element.querySelector(".email a");
      if (email && email.textContent.trim()) {
        const pe = document.createElement("p");
        const a = document.createElement("a");
        a.setAttribute("href", email.getAttribute("href"));
        a.textContent = email.textContent.trim();
        pe.appendChild(a);
        parts.push(pe);
      }
    }
    const groups = element.querySelectorAll(".group-extension");
    groups.forEach((g) => {
      if (!/further articles/i.test(g.textContent)) return;
      addHeading("Further articles");
      const ul = document.createElement("ul");
      const teasers = Array.from(g.querySelectorAll(".teaser-extension"));
      if (teasers.length) {
        teasers.forEach((t) => {
          const headlineA = t.querySelector(".text-box a[href], .meta-information a[href]") || t.querySelector("a[href]");
          if (!headlineA || !headlineA.textContent.trim()) return;
          const li = document.createElement("li");
          const link = document.createElement("a");
          link.setAttribute("href", headlineA.getAttribute("href"));
          link.textContent = headlineA.textContent.trim();
          li.appendChild(link);
          ul.appendChild(li);
        });
      } else {
        const seen = /* @__PURE__ */ new Set();
        g.querySelectorAll("a[href]").forEach((a) => {
          const href = a.getAttribute("href");
          const text = a.textContent.trim();
          if (!text || seen.has(href)) return;
          seen.add(href);
          const li = document.createElement("li");
          const link = document.createElement("a");
          link.setAttribute("href", href);
          link.textContent = text;
          li.appendChild(link);
          ul.appendChild(li);
        });
      }
      if (ul.children.length) parts.push(ul);
    });
    if (parts.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cell = document.createDocumentFragment();
    cell.appendChild(document.createComment(" field:content "));
    parts.forEach((n) => cell.appendChild(n));
    const block = WebImporter.Blocks.createBlock(document, {
      name: "article-aside",
      cells: [[cell]]
    });
    element.replaceWith(block);
  }

  // tools/importer/transformers/mpg-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "nav.skiplink",
        "header.navbar.hero.navigation-on-bottom",
        "header.container-full-width.visible-print-block",
        "div.footer-wrap.noindex",
        "footer.container-full-width.visible-print-block"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "div.content.py-0",
        "div.social-media-buttons"
      ]);
      WebImporter.DOMUtils.remove(element, [
        ".visible-print",
        ".visible-print-block",
        ".extension-image-zoom",
        "#pwa-settings-panel",
        "#go_to_live"
      ]);
      WebImporter.DOMUtils.remove(element, ["iframe", "noscript"]);
    }
  }

  // tools/importer/transformers/mpg-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform2(hookName, element, payload) {
    if (hookName !== TransformHook2.beforeTransform) return;
    const sections = payload && payload.template && payload.template.sections;
    if (!Array.isArray(sections) || sections.length < 2) return;
    const doc = payload && payload.document || element && element.ownerDocument;
    if (!doc) return;
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section || !section.selector) continue;
      const sectionEl = element.querySelector(section.selector);
      if (!sectionEl) continue;
      if (section.style) {
        const table = doc.createElement("table");
        const headRow = doc.createElement("tr");
        const headCell = doc.createElement("th");
        headCell.setAttribute("colspan", "2");
        headCell.textContent = "Section Metadata";
        headRow.append(headCell);
        const styleRow = doc.createElement("tr");
        const keyCell = doc.createElement("td");
        keyCell.textContent = "style";
        const valCell = doc.createElement("td");
        valCell.textContent = section.style;
        styleRow.append(keyCell, valCell);
        table.append(headRow, styleRow);
        sectionEl.after(table);
      }
      if (i > 0) {
        sectionEl.before(doc.createElement("hr"));
      }
    }
  }

  // tools/importer/import-article.js
  var parsers = {
    "carousel-slider": parse,
    "article-aside": parse2
  };
  var PAGE_TEMPLATE = {
    name: "article",
    description: 'Max Planck Society article/detail page: single-column article body (title, subtitle, meta info, inline figures with captions, rich text paragraphs and lists) followed by a grey "Other Interesting Articles" related-articles slider.',
    urls: [
      "https://www.mpg.de/26798800/democracy-cannot-be-taken-for-granted"
    ],
    sections: [
      { id: "rc2", name: "article-body", selector: "#page_content > div.container.content-wrapper > div.row > main > article.col-md-9.col-md-push-3 > div.content:nth-of-type(2)" },
      { id: "rc3", name: "related-articles", selector: "#page_content > div.container-full-width.grey.hidden-print", style: "grey" }
    ],
    blocks: [
      {
        name: "article-aside",
        instances: [
          "#page_content > div.container.content-wrapper > div.row > aside.sidebar"
        ]
      },
      {
        name: "carousel-slider",
        instances: [
          "#related-articles-container"
        ]
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
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
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_article_default = {
    transform: (payload) => {
      const {
        document,
        url,
        html,
        params
      } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
      );
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_article_exports);
})();
