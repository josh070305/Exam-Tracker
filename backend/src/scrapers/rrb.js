const { getPageHtml, hashContent, extractSection } = require('./util');
const { env } = require('../config/env');

const RRB_URL = env.RRB_URL;

// Candidate selectors for the "Latest News / Announcements" region of RRB CDG.
const SELECTORS = [
  '#block-block',
  'a[href*="notic"]',
  'a[href*="News"]',
  'a[href*="latest"]',
  '.news',
  '#content',
  '#main-content',
];

async function scrapeRRB() {
  const html = await getPageHtml(RRB_URL, 'RRB');
  const { text } = extractSection(html, SELECTORS);
  const hash = hashContent(text);
  return { source: 'RRB', url: RRB_URL, text, hash };
}

module.exports = { scrapeRRB };
