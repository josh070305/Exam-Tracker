const { getPageHtml, hashContent, extractSection } = require('./util');
const { env } = require('../config/env');

const SBI_URL = env.SBI_URL;

const SELECTORS = [
  '#latest',
  "a[href*='notic']",
  "a[href*='recruit']",
  '.news',
  '#content',
  '#main-content',
];

async function scrapeSBI() {
  const html = await getPageHtml(SBI_URL, 'SBI');
  const { text } = extractSection(html, SELECTORS);
  const hash = hashContent(text);
  return { source: 'SBI', url: SBI_URL, text, hash };
}

module.exports = { scrapeSBI };
