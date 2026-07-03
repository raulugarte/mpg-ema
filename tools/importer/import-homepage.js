/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroTeaserParser from './parsers/hero-teaser.js';
import cardsTeaserParser from './parsers/cards-teaser.js';
import carouselSliderParser from './parsers/carousel-slider.js';
import columnsSocialParser from './parsers/columns-social.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/mpg-cleanup.js';
import sectionsTransformer from './transformers/mpg-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-teaser': heroTeaserParser,
  'cards-teaser': cardsTeaserParser,
  'carousel-slider': carouselSliderParser,
  'columns-social': columnsSocialParser,
};

// PAGE TEMPLATE CONFIGURATION - embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'Max Planck Society homepage: hero teaser, news/research highlight grids (cards), topic promo bands, image/video sliders, and social posts.',
  urls: [
    'https://www.mpg.de/en',
  ],
  sections: [
    { id: 'rc2', name: 'hero', selector: '#page_content > main > div.container-full-width.background-block.teaser-hero' },
    { id: 'rc3', name: 'text-teasers', selector: '#page_content > main > div.responsive_column.container-full-width.white:nth-of-type(2)' },
    { id: 'rc4', name: 'news', selector: '#page_content > main > div.responsive_column.container-full-width.grey:nth-of-type(3)', style: 'grey' },
    { id: 'rc5', name: 'international', selector: '#page_content > main > div.responsive_column.container-full-width.white:nth-of-type(4)' },
    { id: 'rc6', name: 'career', selector: '#page_content > main > div.responsive_column.container-full-width.grey:nth-of-type(5)', style: 'grey' },
    { id: 'rc7', name: 'topic-specials', selector: '#page_content > main > div.responsive_column.container-full-width.primary', style: 'primary' },
    { id: 'rc8', name: 'publications', selector: '#page_content > main > div.container-full-width.white:nth-of-type(7)' },
    { id: 'rc9', name: 'from-the-institutes', selector: '#page_content > main > div.container-full-width.grey:nth-of-type(8)', style: 'grey' },
    { id: 'rc10', name: 'events', selector: '#page_content > main > div.responsive_column.container-full-width.white:nth-of-type(9)' },
    { id: 'rc11', name: 'multimedia', selector: '#page_content > main > div.container-full-width.homepage_slider.grey', style: 'grey' },
    { id: 'rc12', name: 'social-media', selector: '#page_content > main > div.responsive_column.container-full-width.white:nth-of-type(11)' },
  ],
  blocks: [
    { name: 'hero-teaser', instances: ['#page_content > main > div.container-full-width.background-block.teaser-hero'] },
    {
      name: 'cards-teaser',
      instances: [
        '#page_content > main > div.responsive_column.container-full-width.white:nth-of-type(2)',
        '#page_content > main > div.responsive_column.container-full-width.grey:nth-of-type(3)',
        '#page_content > main > div.responsive_column.container-full-width.white:nth-of-type(4)',
        '#page_content > main > div.responsive_column.container-full-width.grey:nth-of-type(5)',
        '#page_content > main > div.responsive_column.container-full-width.primary',
        '#page_content > main > div.responsive_column.container-full-width.white:nth-of-type(9)',
      ],
    },
    {
      name: 'carousel-slider',
      instances: [
        '#page_content > main > div.container-full-width.white:nth-of-type(7) div.slick-slider.row',
        '#page_content > main > div.container-full-width.grey:nth-of-type(8) div.slick-slider.row',
        '#page_content > main > div.container-full-width.homepage_slider.grey div.slick-slider.row.homepage-slider',
      ],
    },
    { name: 'columns-social', instances: ['#page_content > main > div.responsive_column.container-full-width.white:nth-of-type(11)'] },
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
