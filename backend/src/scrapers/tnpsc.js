const { getPageHtml, hashContent, extractSection } = require('./util');
const { env } = require('../config/env');

const TNPSC_URL = env.TNPSC_URL;

const SELECTORS = [
  '#latest-news',
  "a[href*='notic']",
  "a[href*='corrig']",
  '.news',
  '#content',
  '#main-content',
];

async function scrapeTNPSC() {
  const html = await getPageHtml(TNPSC_URL, 'TNPSC');
  const { text } = extractSection(html, SELECTORS);
  const hash = hashContent(text);
  return { source: 'TNPSC', url: TNPSC_URL, text, hash };
}

module.exports = { scrapeTNPSC };
