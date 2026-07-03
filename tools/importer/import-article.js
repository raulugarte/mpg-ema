/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import carouselSliderParser from './parsers/carousel-slider.js';
import articleAsideParser from './parsers/article-aside.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/mpg-cleanup.js';
import sectionsTransformer from './transformers/mpg-sections.js';

// PARSER REGISTRY
const parsers = {
  'carousel-slider': carouselSliderParser,
  'article-aside': articleAsideParser,
};

// PAGE TEMPLATE CONFIGURATION - embedded from page-templates.json ("article")
const PAGE_TEMPLATE = {
  name: 'article',
  description: 'Max Planck Society article/detail page: single-column article body (title, subtitle, meta info, inline figures with captions, rich text paragraphs and lists) followed by a grey "Other Interesting Articles" related-articles slider.',
  urls: [
    'https://www.mpg.de/26798800/democracy-cannot-be-taken-for-granted',
  ],
  sections: [
    { id: 'rc2', name: 'article-body', selector: '#page_content > div.container.content-wrapper > div.row > main > article.col-md-9.col-md-push-3 > div.content:nth-of-type(2)' },
    { id: 'rc3', name: 'related-articles', selector: '#page_content > div.container-full-width.grey.hidden-print', style: 'grey' },
  ],
  blocks: [
    {
      name: 'article-aside',
      instances: [
        '#page_content > div.container.content-wrapper > div.row > aside.sidebar',
      ],
    },
    {
      name: 'carousel-slider',
      instances: [
        '#related-articles-container',
      ],
    },
  ],
};

// TRANSFORMER REGISTRY - cleanup first, then section breaks/metadata
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

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
 * Find all block instances on the page based on the embedded template.
 */
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
          section: blockDef.section || null,
        });
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

    // 1. beforeTransform cleanup
    executeTransformers('beforeTransform', main, payload);

    // 2. Discover blocks
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block (skip already-replaced/detached elements)
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

    // 4. afterTransform cleanup + section breaks/metadata
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
