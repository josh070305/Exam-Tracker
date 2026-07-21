const { getPageHtml, hashContent, extractSection } = require('./util');
const { env } = require('../config/env');

const SSC_URL = env.SSC_URL;

// Candidate selectors for the notices/announcements region of the SSC site.
// Tried in order; first one yielding meaningful text wins.
const SELECTORS = [
  '#candidate',            // "Candidate's Corner" on SSC
  'a[href*="Notice"]',
  'a[href*="notic"]',
  '.news',
  '#notice',
  '.notification',
  '#block-system-main',
];

async function scrapeSSC() {
  const html = await getPageHtml(SSC_URL, 'SSC');
  const { text } = extractSection(html, SELECTORS);
  const hash = hashContent(text);
  return { source: 'SSC', url: SSC_URL, text, hash };
}

module.exports = { scrapeSSC };
