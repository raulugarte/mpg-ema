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
  function parse(element, { document }) {
    const image = element.querySelector('picture img, img.img-hero, img[class*="hero"], img');
    const heading = element.querySelector('.headline h1, h1, h2, [class*="headline"] h1');
    const ctaLink = element.querySelector('.more-link a, a.more, a[class*="more"]');
    if (!image && !heading) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    const imageCell = document.createDocumentFragment();
    imageCell.appendChild(document.createComment(" field:image "));
    if (image) imageCell.appendChild(image);
    cells.push([imageCell]);
    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(" field:text "));
    if (heading) textCell.appendChild(heading);
    if (ctaLink) {
      const p = document.createElement("p");
      p.appendChild(ctaLink);
      textCell.appendChild(p);
    }
    cells.push([textCell]);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-teaser", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-teaser.js
  function parse2(element, { document }) {
    let cardEls = Array.from(element.querySelectorAll(':scope .row > [class*="col-"]'));
    if (cardEls.length === 0) {
      cardEls = Array.from(element.querySelectorAll(".teaser"));
    }
    const cells = [];
    cardEls.forEach((card) => {
      const image = card.querySelector("picture img, img");
      const textBox = card.querySelector(".text-box") || card.querySelector(".teaser") || card;
      const heading = textBox.querySelector("h1, h2, h3, h4");
      const bodyNodes = Array.from(textBox.querySelectorAll(":scope > p, :scope > .date, :scope > .tags, :scope > .more-link"));
      if (!image && !heading && bodyNodes.length === 0) return;
      let imageCell;
      if (image) {
        imageCell = document.createDocumentFragment();
        imageCell.appendChild(document.createComment(" field:image "));
        imageCell.appendChild(image);
      } else {
        imageCell = "";
      }
      const textCell = document.createDocumentFragment();
      textCell.appendChild(document.createComment(" field:text "));
      if (heading) textCell.appendChild(heading);
      bodyNodes.forEach((n) => textCell.appendChild(n));
      cells.push([imageCell, textCell]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-teaser", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-slider.js
  function parse3(element, { document }) {
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

  // tools/importer/parsers/columns-social.js
  function parse4(element, { document }) {
    let columnEls = Array.from(element.querySelectorAll(':scope .row > [class*="col-"]'));
    if (columnEls.length === 0) {
      columnEls = Array.from(element.querySelectorAll('[class*="col-md-"], [class*="col-sm-"]'));
    }
    if (columnEls.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const row = columnEls.map((col) => {
      const cellContent = [];
      const title = col.querySelector(".linked_title, h2, h3");
      if (title && title.textContent.trim()) cellContent.push(title);
      const deferred = col.querySelector(".deferred_extension[data-deffered-url], [data-deffered-url]");
      if (deferred) cellContent.push(deferred);
      if (cellContent.length === 0) {
        Array.from(col.children).forEach((c) => cellContent.push(c));
      }
      return cellContent.length ? cellContent : "";
    });
    const cells = [row];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-social", cells });
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
        "aside.sidebar",
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

  // tools/importer/import-homepage.js
  var parsers = {
    "hero-teaser": parse,
    "cards-teaser": parse2,
    "carousel-slider": parse3,
    "columns-social": parse4
  };
  var PAGE_TEMPLATE = {
    name: "homepage",
    description: "Max Planck Society homepage: hero teaser, news/research highlight grids (cards), topic promo bands, image/video sliders, and social posts.",
    urls: [
      "https://www.mpg.de/en"
    ],
    sections: [
      { id: "rc2", name: "hero", selector: "#page_content > main > div.container-full-width.background-block.teaser-hero" },
      { id: "rc3", name: "text-teasers", selector: "#page_content > main > div.responsive_column.container-full-width.white:nth-of-type(2)" },
      { id: "rc4", name: "news", selector: "#page_content > main > div.responsive_column.container-full-width.grey:nth-of-type(3)", style: "grey" },
      { id: "rc5", name: "international", selector: "#page_content > main > div.responsive_column.container-full-width.white:nth-of-type(4)" },
      { id: "rc6", name: "career", selector: "#page_content > main > div.responsive_column.container-full-width.grey:nth-of-type(5)", style: "grey" },
      { id: "rc7", name: "topic-specials", selector: "#page_content > main > div.responsive_column.container-full-width.primary", style: "primary" },
      { id: "rc8", name: "publications", selector: "#page_content > main > div.container-full-width.white:nth-of-type(7)" },
      { id: "rc9", name: "from-the-institutes", selector: "#page_content > main > div.container-full-width.grey:nth-of-type(8)", style: "grey" },
      { id: "rc10", name: "events", selector: "#page_content > main > div.responsive_column.container-full-width.white:nth-of-type(9)" },
      { id: "rc11", name: "multimedia", selector: "#page_content > main > div.container-full-width.homepage_slider.grey", style: "grey" },
      { id: "rc12", name: "social-media", selector: "#page_content > main > div.responsive_column.container-full-width.white:nth-of-type(11)" }
    ],
    blocks: [
      { name: "hero-teaser", instances: ["#page_content > main > div.container-full-width.background-block.teaser-hero"] },
      {
        name: "cards-teaser",
        instances: [
          "#page_content > main > div.responsive_column.container-full-width.white:nth-of-type(2)",
          "#page_content > main > div.responsive_column.container-full-width.grey:nth-of-type(3)",
          "#page_content > main > div.responsive_column.container-full-width.white:nth-of-type(4)",
          "#page_content > main > div.responsive_column.container-full-width.grey:nth-of-type(5)",
          "#page_content > main > div.responsive_column.container-full-width.primary",
          "#page_content > main > div.responsive_column.container-full-width.white:nth-of-type(9)"
        ]
      },
      {
        name: "carousel-slider",
        instances: [
          "#page_content > main > div.container-full-width.white:nth-of-type(7) div.slick-slider.row",
          "#page_content > main > div.container-full-width.grey:nth-of-type(8) div.slick-slider.row",
          "#page_content > main > div.container-full-width.homepage_slider.grey div.slick-slider.row.homepage-slider"
        ]
      },
      { name: "columns-social", instances: ["#page_content > main > div.responsive_column.container-full-width.white:nth-of-type(11)"] }
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
  var import_homepage_default = {
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
  return __toCommonJS(import_homepage_exports);
})();
