/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroTeaserParser from './parsers/hero-teaser.js';
import cardsTeasersParser from './parsers/cards-teasers.js';
import cardsNewsParser from './parsers/cards-news.js';
import cardsTopicParser from './parsers/cards-topic.js';
import carouselSliderParser from './parsers/carousel-slider.js';
import columnsEventsParser from './parsers/columns-events.js';
import embedSocialParser from './parsers/embed-social.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/mpg-ema-cleanup.js';
import sectionsTransformer from './transformers/mpg-ema-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-teaser': heroTeaserParser,
  'cards-teasers': cardsTeasersParser,
  'cards-news': cardsNewsParser,
  'cards-topic': cardsTopicParser,
  'carousel-slider': carouselSliderParser,
  'columns-events': columnsEventsParser,
  'embed-social': embedSocialParser,
};

// TRANSFORMER REGISTRY (cleanup first, sections after)
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION (embedded from page-templates.json)
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'Max Planck Society homepage: header/nav, hero teaser, multiple teaser/card rows across white/grey/primary bands, publications and institute-news sliders, events, and a green/darkgreen footer.',
  urls: ['https://www.mpg.de/en'],
  blocks: [
    { name: 'hero-teaser', instances: ['#page_content > main > div.container-full-width.background-block.teaser-hero'] },
    { name: 'cards-teasers', instances: ['#page_content > main > div.responsive_column.container-full-width.white:nth-of-type(2)'] },
    {
      name: 'cards-news',
      instances: [
        '#page_content > main > div.responsive_column.container-full-width.grey:nth-of-type(3)',
        '#page_content > main > div.responsive_column.container-full-width.white:nth-of-type(4)',
        '#page_content > main > div.responsive_column.container-full-width.grey:nth-of-type(5)',
      ],
    },
    { name: 'cards-topic', instances: ['#page_content > main > div.responsive_column.container-full-width.primary'] },
    {
      name: 'carousel-slider',
      instances: [
        '#page_content > main > div.container-full-width.white:nth-of-type(7)',
        '#page_content > main > div.container-full-width.grey:nth-of-type(8)',
        '#page_content > main > div.container-full-width.homepage_slider.grey',
      ],
    },
    { name: 'columns-events', instances: ['#page_content > main > div.responsive_column.container-full-width.white:nth-of-type(9)'] },
    { name: 'embed-social', instances: ['#page_content > main > div.responsive_column.container-full-width.white:nth-of-type(11)'] },
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
