/*
 * Embed Social Block
 * Renders one or more social media feed embeds (Facebook, Bluesky, RSS, etc.)
 * side by side in columns. Each authored embed_uri link becomes an embed frame.
 *
 * On the source (mpg.de) these are server-side "deferred_extension" feeds that
 * only render on the live domain. Locally / off-domain we render a labelled
 * frame that links out to the feed source so the layout is preserved.
 */

const FEED_LABELS = [
  { match: ['facebook', '/remote'], label: 'Facebook', icon: 'facebook' },
  { match: ['bluesky', 'bsky', 'fetch_rss_content', 'rss'], label: 'Bluesky', icon: 'bluesky' },
];

function labelFor(href) {
  const found = FEED_LABELS.find((f) => f.match.some((m) => href.toLowerCase().includes(m)));
  return found || { label: 'Social feed', icon: 'link' };
}

function buildColumn(href, headingText) {
  const col = document.createElement('div');
  col.className = 'embed-social-column';

  const title = document.createElement('div');
  title.className = 'embed-social-title';
  if (headingText) {
    const h = document.createElement('h2');
    h.textContent = headingText;
    title.append(h);
  }
  col.append(title);

  const { label, icon } = labelFor(href);
  const frame = document.createElement('div');
  frame.className = `embed-social-frame embed-social-${icon}`;

  const link = document.createElement('a');
  link.className = 'embed-social-cta';
  link.href = href;
  link.target = '_blank';
  link.rel = 'noopener';
  link.setAttribute('aria-label', `Open the ${label} feed`);
  link.innerHTML = `<span class="embed-social-frame-icon" aria-hidden="true"></span>
    <span class="embed-social-frame-label">${label}</span>
    <span class="embed-social-frame-hint">View feed</span>`;
  frame.append(link);
  col.append(frame);

  return col;
}

export default function decorate(block) {
  const links = [...block.querySelectorAll('a[href]')].map((a) => a.href);
  block.textContent = '';

  const grid = document.createElement('div');
  grid.className = 'embed-social-grid';

  links.forEach((href, i) => {
    // The first column carries the section heading, matching the source layout.
    grid.append(buildColumn(href, i === 0 ? 'Social Media' : ''));
  });

  block.append(grid);
}
