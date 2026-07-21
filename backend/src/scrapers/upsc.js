const { getPageHtml, hashContent, extractSection } = require('./util');
const { env } = require('../config/env');

const UPSC_URL = env.UPSC_URL;

const SELECTORS = [
  '#latest',
  "a[href*='notic']",
  "a[href*='Exam']",
  '.news',
  '#content',
  '#main-content',
];

async function scrapeUPSC() {
  const html = await getPageHtml(UPSC_URL, 'UPSC');
  const { text } = extractSection(html, SELECTORS);
  const hash = hashContent(text);
  return { source: 'UPSC', url: UPSC_URL, text, hash };
}

module.exports = { scrapeUPSC };
