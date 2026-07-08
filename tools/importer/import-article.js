/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import articleMetaParser from './parsers/article-meta.js';
import articleAsideParser from './parsers/article-aside.js';
import cardsNewsParser from './parsers/cards-news.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/mpg-ema-cleanup.js';
import sectionsTransformer from './transformers/mpg-ema-sections.js';

// PARSER REGISTRY
const parsers = {
  'article-meta': articleMetaParser,
  'article-aside': articleAsideParser,
  'cards-news': cardsNewsParser,
};

// TRANSFORMER REGISTRY (cleanup first, sections after)
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION (embedded from page-templates.json "article").
// Includes the section-* pseudo-block so the sections transformer's
// template-driven styling path activates (section-related-articles ->
// cards-news, grey band with a preceding <hr>).
const PAGE_TEMPLATE = {
  name: 'article',
  description: 'Max Planck Society article/detail page: header/nav, article body with title, subtitle, meta information (date + tags), inline figures with captions, body paragraphs, section headings and lists, a sidebar, a related-articles block, and green/darkgreen footer.',
  urls: ['https://www.mpg.de/26798800/democracy-cannot-be-taken-for-granted'],
  blocks: [
    { name: 'article-meta', instances: ['#page_content > div.container.content-wrapper > div.row > main > article > div.content:nth-of-type(2) > div.meta-information'] },
    { name: 'article-aside', instances: ['#page_content > div.container.content-wrapper > div.row > aside.sidebar'] },
    { name: 'cards-news', instances: ['#related-articles-container'] },
    {
      name: 'section-related-articles',
      instances: ['#page_content > div.container-full-width.grey.hidden-print'],
      section: 'grey',
      block: 'cards-news',
    },
  ],
};

/**
 * Execute all page transformers for a specific hook.
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration.
 * Only real block variants are parsed (section-* entries are handled by the
 * sections transformer, not parsed here).
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    if (blockDef.name.startsWith('section-')) return;
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
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

export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // 1. beforeTransform (initial cleanup + remove slick clones)
    executeTransformers('beforeTransform', main, payload);

    // 2. Discover blocks
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block (skip elements already replaced by a prior parser)
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

    // 4. afterTransform (final cleanup + section breaks/metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
