import { getMetadata } from '../../scripts/aem.js';

// media query match that indicates desktop width
const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Close all open desktop dropdown panels.
 * @param {Element} navList the top-level nav list
 */
function closeAllPanels(navList) {
  navList.querySelectorAll('.nav-item[aria-expanded="true"]').forEach((li) => {
    li.setAttribute('aria-expanded', 'false');
  });
}

/**
 * Build the search form (controls are created in JS, not in the fragment).
 * @returns {HTMLFormElement}
 */
function buildSearchForm() {
  const form = document.createElement('form');
  form.className = 'nav-search';
  form.setAttribute('role', 'search');
  form.action = '/en/search';
  form.method = 'get';

  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'query';
  input.placeholder = 'Search';
  input.setAttribute('aria-label', 'Search');

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'nav-search-submit';
  submit.setAttribute('aria-label', 'Submit search');
  // Thin-stroke magnifying-glass icon (matches the source's outline search icon).
  submit.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><line x1="15.5" y1="15.5" x2="21" y2="21"/></svg>';

  form.append(input, submit);
  return form;
}

/**
 * Toggle the mobile menu open/closed.
 * @param {Element} nav
 * @param {Element} hamburger
 */
function toggleMobileMenu(nav, hamburger) {
  const expanded = nav.getAttribute('aria-expanded') === 'true';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  hamburger.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  document.body.style.overflowY = expanded || isDesktop.matches ? '' : 'hidden';
  if (expanded) {
    const navList = nav.querySelector('.nav-list');
    if (navList) closeAllPanels(navList);
  }
}

/**
 * Reset nav state when crossing the desktop/mobile breakpoint.
 * @param {Element} nav
 * @param {Element} hamburger
 */
function handleViewportChange(nav, hamburger) {
  const navList = nav.querySelector('.nav-list');
  if (navList) closeAllPanels(navList);
  nav.setAttribute('aria-expanded', 'false');
  if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
  document.body.style.overflowY = '';
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // Nav fragment path is metadata-driven (single source of truth): the page's
  // `<meta name="nav">` if present, otherwise the site-root default `/nav`.
  // Resolved to a pathname so it is portable across author, delivery and local
  // proxy — no hardcoded /content path and no guaranteed-404 first request.
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const resp = await fetch(`${navPath}.plain.html`);
  if (!resp.ok) return;

  const html = await resp.text();
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const sections = [...tmp.children];

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-expanded', 'false');

  // --- Section 0: brand + utility (logo, language toggle) ---
  const brandSection = sections[0];
  const navBrand = document.createElement('div');
  navBrand.className = 'nav-brand';
  if (brandSection) {
    const paras = [...brandSection.querySelectorAll('p')];
    // first paragraph = logo link; remaining = utility links (language)
    if (paras[0]) {
      const logo = paras[0].querySelector('a');
      if (logo) {
        logo.className = 'nav-logo';
        navBrand.append(logo);
      }
    }
    const tools = document.createElement('div');
    tools.className = 'nav-tools';
    paras.slice(1).forEach((p) => {
      const a = p.querySelector('a');
      if (a) {
        a.className = 'nav-lang';
        tools.append(a);
      }
    });
    tools.append(buildSearchForm());
    navBrand.append(tools);
  }

  // --- Section 1: main nav ---
  const navSections = document.createElement('div');
  navSections.className = 'nav-sections';
  const mainSection = sections[1];
  if (mainSection) {
    const topUl = mainSection.querySelector(':scope > ul');
    if (topUl) {
      topUl.className = 'nav-list';
      [...topUl.children].forEach((li) => {
        li.classList.add('nav-item');
        const trigger = li.querySelector(':scope > a');
        const panel = li.querySelector(':scope > ul');
        if (panel) {
          panel.classList.add('nav-panel');
          li.setAttribute('aria-expanded', 'false');
          // Placeholder anchor (#...) becomes a toggle for click/mobile
          if (trigger && (trigger.getAttribute('href') || '').startsWith('#')) {
            trigger.setAttribute('role', 'button');
            trigger.setAttribute('aria-haspopup', 'true');
            trigger.addEventListener('click', (e) => {
              e.preventDefault();
              const open = li.getAttribute('aria-expanded') === 'true';
              closeAllPanels(topUl);
              li.setAttribute('aria-expanded', open ? 'false' : 'true');
            });
          }
          // Desktop hover behavior
          li.addEventListener('mouseenter', () => {
            if (isDesktop.matches) {
              closeAllPanels(topUl);
              li.setAttribute('aria-expanded', 'true');
            }
          });
          li.addEventListener('mouseleave', () => {
            if (isDesktop.matches) li.setAttribute('aria-expanded', 'false');
          });
        }
      });
      navSections.append(topUl);
    }
  }

  // --- Hamburger (mobile) ---
  const hamburger = document.createElement('button');
  hamburger.className = 'nav-hamburger';
  hamburger.type = 'button';
  hamburger.setAttribute('aria-label', 'Open navigation');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.innerHTML = '<span class="nav-hamburger-icon"></span>';
  hamburger.addEventListener('click', () => toggleMobileMenu(nav, hamburger));

  nav.append(navBrand, hamburger, navSections);

  // Close panels/menu on Escape
  nav.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
      const navList = nav.querySelector('.nav-list');
      if (navList) closeAllPanels(navList);
      if (!isDesktop.matches) toggleMobileMenu(nav, hamburger);
    }
  });

  // Reset on viewport change
  isDesktop.addEventListener('change', () => handleViewportChange(nav, hamburger));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.textContent = '';
  block.append(navWrapper);
}
