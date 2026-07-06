#!/usr/bin/env node

/**
 * Bulk Import Runner
 *
 * Usage:
 *   node tools/importer/run-bulk-import.js \
 *     --import-script path/to/import.js \
 *     --urls path/to/urls.txt
 *
 * Executes an import script against each URL, converts the transformed DOM to markdown,
 * and saves the files to a content directory. Designed to reuse the helix importer bundle in-browser.
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Local project copy of the shared bulk-import runner. Heavy deps (playwright,
// import processors, report util, the helix-importer bundle) are resolved from
// the shared marketplace scripts dir. The only behavioral change vs the shared
// runner is the AMD `define` neutralization below (search "define") — needed
// because some source sites define `window.define` as non-configurable, so the
// shared runner's `delete window.define` silently fails and the helix-importer
// UMD never attaches `window.WebImporter`.
const SHARED_SCRIPTS_DIR = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';

// playwright is CommonJS: `chromium` lives on the default export, not as a named ESM export.
const playwrightModule = await import(join(SHARED_SCRIPTS_DIR, 'node_modules/playwright/index.js'));
const { chromium } = playwrightModule.default || playwrightModule;
const { processPlainHtml } = await import(join(SHARED_SCRIPTS_DIR, 'import-processors/index.js'));

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the compileReportsToExcel function from the shared scripts dir
const importReportPath = join(SHARED_SCRIPTS_DIR, 'import-report.js');
const { compileReportsToExcel } = await import(importReportPath);

const REQUIRED_ARGS = ['--import-script', '--urls'];
const VIEWPORT_WIDTH = 1920;
const VIEWPORT_HEIGHT = 1080;
const PAGE_TIMEOUT = 45000;
const POPUP_DISMISS_DELAY = 500;
const ESCAPE_KEY_DELAY = 300;
const MIN_DELAY_BETWEEN_REQUESTS = 1000; // 1 second
const MAX_DELAY_BETWEEN_REQUESTS = 3000; // 3 seconds
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/**
 * Random delay to avoid bot detection
 */
async function randomDelay() {
  const delay = Math.floor(Math.random() * (MAX_DELAY_BETWEEN_REQUESTS - MIN_DELAY_BETWEEN_REQUESTS + 1)) + MIN_DELAY_BETWEEN_REQUESTS;
  await new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Simulate human-like scrolling behavior
 */
async function randomScroll(page) {
  try {
    const scrolls = Math.floor(Math.random() * 3) + 1; // 1-3 scrolls
    for (let i = 0; i < scrolls; i++) {
      const scrollAmount = Math.floor(Math.random() * 500) + 200; // 200-700px
      await page.evaluate((amount) => {
        window.scrollBy(0, amount);
      }, scrollAmount);
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 500 + 200)); // 200-700ms between scrolls
    }
  } catch (error) {
    // Ignore scroll errors
  }
}

function printUsageAndExit(message) {
  if (message) {
    console.error(`Error: ${message}`);
  }
  console.error('');
  console.error('Usage:');
  console.error('  node tools/importer/run-bulk-import.js \\');
  console.error('    --import-script path/to/import.js \\');
  console.error('    --urls path/to/urls.txt \\');
  console.error('    [--disable-http2]');
  console.error('');
  console.error('Options:');
  console.error('  --disable-http2  Disable HTTP/2 to work around protocol errors from some servers');
  console.error('');
  console.error('Output directory: content');
  console.error('');
  process.exit(1);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  const flags = new Set();

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--disable-http2') {
      flags.add('disable-http2');
      continue;
    }

    if (arg.startsWith('--')) {
      const value = args[i + 1];
      if (!value || value.startsWith('--')) {
        printUsageAndExit(`Missing value for ${arg}`);
      }
      parsed[arg] = value;
      i++;
    } else {
      printUsageAndExit(`Unexpected argument: ${arg}`);
    }
  }

  for (const required of REQUIRED_ARGS) {
    if (!parsed[required]) {
      printUsageAndExit(`Missing required argument ${required}`);
    }
  }

  // Use WORKSPACE_PATH if available (e.g., /workspace/current), otherwise fall back to cwd
  const workspacePath = process.env.WORKSPACE_PATH || process.cwd();

  return {
    importScript: resolve(parsed['--import-script']),
    urlsFile: resolve(parsed['--urls']),
    outputDir: resolve(workspacePath, 'content'),
    disableHttp2: flags.has('disable-http2'),
  };
}

function loadUrls(urlFile) {
  if (!existsSync(urlFile)) {
    printUsageAndExit(`URLs file not found at ${urlFile}`);
  }

  const raw = readFileSync(urlFile, 'utf-8');
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
}

async function dismissPopups(page) {
  try {
    const dismissSelectors = [
      'button[id*="accept" i]',
      'button[id*="cookie" i]',
      'button[class*="accept" i]',
      'button[class*="cookie" i]',
      'button[class*="consent" i]',
      'a[class*="accept" i]',
      'a[id*="accept" i]',
      '[aria-label*="accept" i]',
      '[aria-label*="agree" i]',
      '[data-testid*="accept" i]',
      '[data-testid*="cookie" i]',
      '#onetrust-accept-btn-handler',
      '.onetrust-close-btn-handler',
      '#cookie-consent-accept',
      '.cookie-consent-accept',
      '.accept-cookies',
      'button[aria-label*="close" i]',
      'button[class*="close" i]:not([class*="closed"])',
      '[data-dismiss="modal"]',
      '.modal-close',
      '.overlay-close',
      '.popup-close',
    ];

    for (const selector of dismissSelectors) {
      const elements = await page.$$(selector);
      for (const element of elements) {
        const isVisible = await element.isVisible().catch(() => false);
        if (!isVisible) continue;
        const text = await element.evaluate((el) => el.textContent?.toLowerCase() || '');
        if (
          text.includes('accept') ||
          text.includes('agree') ||
          text.includes('consent') ||
          text.includes('allow') ||
          text.includes('ok') ||
          text.includes('close') ||
          text.includes('continue')
        ) {
          await element.click().catch(() => { });
          await page.waitForTimeout(POPUP_DISMISS_DELAY);
          break;
        }
      }
    }

    await page.keyboard.press('Escape').catch(() => { });
    await page.waitForTimeout(ESCAPE_KEY_DELAY);
  } catch {
    // ignore popup errors
  }
}

async function injectScript(page, scriptContent) {
  await page.evaluate((script) => {
    const scriptEl = document.createElement('script');
    scriptEl.textContent = script;
    document.head.appendChild(scriptEl);
  }, scriptContent);
}

function ensureDir(pathname) {
  mkdirSync(pathname, { recursive: true });
}

function getFallbackReportPath(url) {
  const { pathname } = new URL(url);
  let fallbackPath = pathname || '/';
  if (fallbackPath.endsWith('/')) fallbackPath = fallbackPath === '/' ? '/index' : fallbackPath.slice(0, -1);
  if (fallbackPath.startsWith('/')) fallbackPath = fallbackPath.slice(1);
  if (fallbackPath === '') fallbackPath = 'index';
  return fallbackPath;
}

function getReportFilePath(docPath) {
  return join('tools/importer/reports', `${docPath}.report.json`);
}

export function sanitizeDocumentPath(docPath, fallbackUrl) {
  // If docPath missing or invalid, build from URL path
  if (!docPath || typeof docPath !== 'string') {
    const { pathname } = new URL(fallbackUrl);
    docPath = pathname || '/';
  }

  let normalized = docPath.replace(/\\/g, '/');
  if (normalized.startsWith('/')) normalized = normalized.slice(1);
  if (normalized.endsWith('/')) normalized = normalized.slice(0, -1);
  if (normalized === '') normalized = 'index';

  return normalized;
}

/**
 * Check if an error is an HTTP/2 protocol error
 */
export function isHttp2Error(error) {
  if (!error) return false;
  const msg = error.message || '';
  return msg.includes('ERR_HTTP2_PROTOCOL_ERROR')
    || msg.includes('ERR_HTTP2_PING_FAILED')
    || msg.includes('ERR_HTTP2_INADEQUATE_TRANSPORT_SECURITY')
    || msg.includes('ERR_HTTP2_SERVER_REFUSED_STREAM')
    || msg.includes('ERR_SPDY_PROTOCOL_ERROR');
}

/**
 * Launch a browser. Tries system Chrome first for better anti-bot resilience
 * (real TLS fingerprint), falls back to bundled Chromium if Chrome is not installed.
 */
async function launchBrowser({ disableHttp2 }) {
  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-blink-features=AutomationControlled',
    '--disable-features=IsolateOrigins,site-per-process',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--window-size=1920,1080',
  ];

  if (disableHttp2) {
    args.push('--disable-http2');
  }

  const launchOptions = { headless: true, args };

  try {
    const browser = await chromium.launch({ ...launchOptions, channel: 'chrome' });
    console.log('  Browser:       Chrome');
    return browser;
  } catch (err) {
    console.log(`  Browser:       Chromium (bundled) [Chrome unavailable: ${err.message}]`);
    return chromium.launch(launchOptions);
  }
}

/**
 * Create a browser context with stealth settings
 */
async function createBrowserContext(browser) {
  return browser.newContext({
    bypassCSP: true,
    viewport: {
      width: VIEWPORT_WIDTH,
      height: VIEWPORT_HEIGHT,
    },
    userAgent: USER_AGENT,
    locale: 'en-US',
    timezoneId: 'America/Los_Angeles',
    ignoreHTTPSErrors: true,
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
    },
  });
}

/**
 * Add stealth init script to a page to avoid bot detection
 */
async function addStealthScripts(page) {
  await page.addInitScript(() => {
    // Remove navigator.webdriver
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });

    // Realistic chrome object
    window.chrome = {
      runtime: {
        onConnect: { addListener() {}, removeListener() {} },
        onMessage: { addListener() {}, removeListener() {} },
      },
      loadTimes() { return {}; },
      csi() { return {}; },
    };

    // Realistic plugins (mimics real Chrome's default plugins)
    const makePlugin = (name, description, filename, mimeType, mimeSuffixes, mimeDescription) => {
      const mime = { type: mimeType, suffixes: mimeSuffixes, description: mimeDescription, enabledPlugin: null };
      const plugin = { name, description, filename, length: 1, 0: mime };
      mime.enabledPlugin = plugin;
      return plugin;
    };
    const pluginList = [
      makePlugin('PDF Viewer', 'Portable Document Format', 'internal-pdf-viewer',
        'application/pdf', 'pdf', 'Portable Document Format'),
      makePlugin('Chrome PDF Viewer', 'Portable Document Format', 'internal-pdf-viewer',
        'application/pdf', 'pdf', 'Portable Document Format'),
      makePlugin('Chromium PDF Viewer', 'Portable Document Format', 'internal-pdf-viewer',
        'application/pdf', 'pdf', 'Portable Document Format'),
    ];
    Object.defineProperty(navigator, 'plugins', {
      get: () => {
        const arr = [...pluginList];
        arr.item = (i) => arr[i];
        arr.namedItem = (name) => arr.find((p) => p.name === name) || null;
        arr.refresh = () => {};
        return arr;
      },
    });

    // Realistic mimeTypes
    Object.defineProperty(navigator, 'mimeTypes', {
      get: () => {
        const types = [{ type: 'application/pdf', suffixes: 'pdf', description: 'Portable Document Format' }];
        types.item = (i) => types[i];
        types.namedItem = (name) => types.find((t) => t.type === name) || null;
        return types;
      },
    });

    // Realistic navigator properties
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
    Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 0 });

    // Permissions API spoofing
    const originalQuery = navigator.permissions?.query;
    if (originalQuery) {
      navigator.permissions.query = (parameters) => {
        if (parameters.name === 'notifications') {
          return Promise.resolve({ state: Notification.permission });
        }
        return originalQuery.call(navigator.permissions, parameters);
      };
    }

    // WebGL vendor/renderer spoofing (realistic Mac values)
    const getParameterProto = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
      if (parameter === 37445) return 'Google Inc. (Apple)'; // UNMASKED_VENDOR_WEBGL
      if (parameter === 37446) return 'ANGLE (Apple, ANGLE Metal Renderer: Apple M1 Pro, Unspecified Version)'; // UNMASKED_RENDERER_WEBGL
      return getParameterProto.call(this, parameter);
    };

  });
}

async function processUrl({
  context,
  url,
  helixImporterScript,
  importScriptContent,
  outputDir,
  index,
  total,
}) {
  const label = `[${index}/${total}]`;
  console.log(`${label} Starting ${url}`);

  const page = await context.newPage();

  // Capture browser console logs to see transform function output
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.error(`[Browser Console] ${text}`);
    } else if (type === 'warning') {
      console.warn(`[Browser Console] ${text}`);
    } else {
      console.log(`[Browser Console] ${text}`);
    }
  });

  await addStealthScripts(page);

  try {

    // Navigate to url; fall back to domcontentloaded if networkidle times out
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: PAGE_TIMEOUT });
    } catch (error) {
      console.log(`${label} ⚠️  Falling back to domcontentloaded...`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT });
      await page.waitForTimeout(3000); // Give page extra time to settle
    }

    await dismissPopups(page);

    // Random scrolling to appear more human-like
    await randomScroll(page);

    // Inject Helix importer bundle.
    // The helix-importer UMD wrapper prefers CommonJS (module/exports) then AMD
    // (define) then a global (window.WebImporter). On AMD pages we must hide
    // define so it falls through to the global branch. NOTE: some sites (e.g.
    // mpg.de) define `window.define` as non-configurable, so `delete` silently
    // fails; since it is writable we overwrite it with undefined instead, and
    // restore it afterward. module/exports are also masked defensively.
    await page.evaluate((script) => {
      const originalDefine = window.define;
      const originalModule = window.module;
      const originalExports = window.exports;
      try { window.define = undefined; } catch (e) { /* ignore */ }
      try { window.module = undefined; } catch (e) { /* ignore */ }
      try { window.exports = undefined; } catch (e) { /* ignore */ }
      const scriptEl = document.createElement('script');
      scriptEl.textContent = script;
      document.head.appendChild(scriptEl);
      try { window.define = originalDefine; } catch (e) { /* ignore */ }
      try { window.module = originalModule; } catch (e) { /* ignore */ }
      try { window.exports = originalExports; } catch (e) { /* ignore */ }
    }, helixImporterScript);

    // Inject the provided import script
    await injectScript(page, importScriptContent);

    // Wait for CustomImportScript to be available (with timeout)
    try {
      await page.waitForFunction(
        () => typeof window.CustomImportScript !== 'undefined' && window.CustomImportScript?.default,
        { timeout: 10000 }
      );
    } catch (error) {
      throw new Error(`CustomImportScript.default not found after 10s. The bundled script may not have loaded correctly. Check browser console for errors.`);
    }

    const result = await page.evaluate(async (pageUrl) => {
      if (!window.WebImporter || typeof window.WebImporter.html2md !== 'function') {
        throw new Error('WebImporter not available. helix-importer script failed to load.');
      }

      // Bundled scripts expose CustomImportScript.default with a transform function
      const customImportConfig = window.CustomImportScript?.default;
      if (!customImportConfig) {
        throw new Error('CustomImportScript not available - bundle may not have loaded correctly');
      }

      try {
        // Allow custom onLoad logic to run before transformation
        if (typeof customImportConfig.onLoad === 'function') {
          await customImportConfig.onLoad({document});
        }

        // Run the transform function
        const result = await window.WebImporter.html2md(pageUrl, document, customImportConfig, {
          toDocx: false,
          toMd: true,
          originalURL: pageUrl
        });

        // Convert markdown to HTML for DA compliance
        result.html = window.WebImporter.md2da(result.md);
        return result;
      } catch (error) {
        throw new Error(`Failed to import page: ${error.message}`);
      }
    }, url);

    // Validate result structure - we only care about HTML output now
    if (!result.path || typeof result.path !== 'string') {
      throw new Error(`Transform did not return valid path. Got: ${typeof result.path}`);
    }

    if (!result.html || typeof result.html !== 'string') {
      throw new Error(`HTML generation failed. Transform must produce HTML content. Got: ${typeof result.html}`);
    }

    // Post-process the raw plain HTML (wrap images in <picture>, etc)
    const plainHtml = processPlainHtml(result.html);

    // Write the processed plain HTML to the output directory, using the sanitized document path
    const relativeDocPath = sanitizeDocumentPath(result.path, url);
    const plainHtmlPath = join(outputDir, `${relativeDocPath}.plain.html`);
    ensureDir(dirname(plainHtmlPath));
    writeFileSync(plainHtmlPath, plainHtml, 'utf-8');

    // Write report file with status tracking
    const reportPath = getReportFilePath(relativeDocPath);
    ensureDir(dirname(reportPath));

    const reportData = {
      status: 'success',
      url,
      path: relativeDocPath,
      timestamp: new Date().toISOString(),
      ...(result.report || {}),
    };

    writeFileSync(reportPath, JSON.stringify(reportData, null, 2), 'utf-8');

    console.log(`${label} ✅ Saved content to ${relativeDocPath}`);
    return { success: true, path: relativeDocPath };
  } catch (error) {
    console.error(`${label} ❌ Failed for ${url}: ${error.message}`);

    // Write failure report
    let failedReportPath;
    try {
      const fallbackPath = getFallbackReportPath(url);
      failedReportPath = getReportFilePath(fallbackPath);
      ensureDir(dirname(failedReportPath));

      const reportData = {
        status: 'failed',
        url,
        path: fallbackPath,
        timestamp: new Date().toISOString(),
        error: error.message,
        errorStack: error.stack,
      };

      writeFileSync(failedReportPath, JSON.stringify(reportData, null, 2), 'utf-8');
    } catch (reportError) {
      console.error(`${label} Failed to write error report: ${reportError.message}`);
    }

    return { success: false, error, failedReportPath };
  } finally {
    await page.close().catch(() => { });
  }
}

async function main() {
  const { importScript, urlsFile, outputDir, disableHttp2 } = parseArgs();

  if (!existsSync(importScript)) {
    printUsageAndExit(`Import script not found at ${importScript}`);
  }

  const urls = loadUrls(urlsFile);

  if (urls.length === 0) {
    printUsageAndExit('URL list is empty after filtering comments/blank lines.');
  }

  ensureDir(outputDir);

  const helixImporterPath = join(SHARED_SCRIPTS_DIR, 'static', 'inject', 'helix-importer.js');
  if (!existsSync(helixImporterPath)) {
    printUsageAndExit(`helix-importer.js not found at ${helixImporterPath}`);
  }

  const helixImporterScript = readFileSync(helixImporterPath, 'utf-8');
  const importScriptContent = readFileSync(importScript, 'utf-8');

  console.log('[Bulk Import] Starting run with:');
  console.log(`  Import script: ${importScript}`);
  console.log(`  URLs file:     ${urlsFile}`);
  console.log(`  Output dir:    ${outputDir}`);
  console.log(`  URL count:     ${urls.length}`);
  if (disableHttp2) {
    console.log(`  HTTP/2:        disabled`);
  }
  console.log('');

  let http2Disabled = disableHttp2;
  let browser = await launchBrowser({ disableHttp2: http2Disabled });
  let context = await createBrowserContext(browser);

  let successCount = 0;

  try {
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];

      // Add random delay between requests (except for the first one)
      if (i > 0) {
        await randomDelay();
      }

      const result = await processUrl({
        context,
        url,
        helixImporterScript,
        importScriptContent,
        outputDir,
        index: i + 1,
        total: urls.length,
      });

      // Auto-retry with HTTP/1.1 if we hit an HTTP/2 protocol error
      if (!result.success && !http2Disabled && isHttp2Error(result.error)) {
        console.log('');
        console.log('⚠️  HTTP/2 protocol error detected. Restarting browser with HTTP/1.1 fallback...');
        console.log('');

        await context.close().catch(() => { });
        await browser.close().catch(() => { });

        http2Disabled = true;
        browser = await launchBrowser({ disableHttp2: true });
        context = await createBrowserContext(browser);

        // Retry the current URL
        const retryResult = await processUrl({
          context,
          url,
          helixImporterScript,
          importScriptContent,
          outputDir,
          index: i + 1,
          total: urls.length,
        });

        if (retryResult.success) {
          if (result.failedReportPath) {
            rmSync(result.failedReportPath, { force: true });
          }
          successCount++;
        }
        continue;
      }

      if (result.success) {
        successCount++;
      }
    }
  } finally {
    await context.close().catch(() => { });
    await browser.close().catch(() => { });
  }

  console.log(
    `[Bulk Import] Completed. Success: ${successCount}/${urls.length}, Failures: ${urls.length - successCount}`
  );

  // Compile all report files into Excel
  await compileReportsToExcel(importScript);
}

// Only run main() if this file is executed directly, not when imported
if (fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error('[Bulk Import] Unexpected error:', err);
    process.exit(1);
  });
}
