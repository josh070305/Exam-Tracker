const { getPageHtml, hashContent, extractSection } = require('./util');
const { env } = require('../config/env');

const IBPS_URL = env.IBPS_URL;

const SELECTORS = [
  '#latest',
  "a[href*='notic']",
  "a[href*='CRP']",
  '.news',
  '#content',
  '#main-content',
];

async function scrapeIBPS() {
  const html = await getPageHtml(IBPS_URL, 'IBPS');
  const { text } = extractSection(html, SELECTORS);
  const hash = hashContent(text);
  return { source: 'IBPS', url: IBPS_URL, text, hash };
}

module.exports = { scrapeIBPS };
