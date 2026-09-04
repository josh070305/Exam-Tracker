const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { env } = require('../config/env');

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const https = require('https');

const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // Handle government portal self-signed / expired certs
  keepAlive: true,
});

async function fetchPage(url, retries = 2) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { data } = await axios.get(url, {
        httpsAgent,
        headers: {
          'User-Agent': USER_AGENT,
          'Accept-Language': 'en-US,en;q=0.9',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Cache-Control': 'no-cache',
        },
        timeout: 35000,
        maxRedirects: 5,
      });
      return data;
    } catch (err) {
      if (attempt === retries) {
        const code = err.code || (err.response ? `HTTP ${err.response.status}` : 'unknown');
        throw new Error(`fetch failed [${code}] for ${url}: ${err.message}`);
      }
      // Exponential backoff
      await new Promise((r) => setTimeout(r, attempt * 1000));
    }
  }
}

// Returns page HTML. In MOCK_SCRAPE mode it reads a local fixture file
// (fixtures/<SOURCE>.html) instead of hitting the network — used when the
// real source sites are unreachable from the current environment.
async function getPageHtml(url, source) {
  if (env.MOCK_SCRAPE) {
    const file = path.join(__dirname, 'fixtures', `${source}.html`);
    console.log(`[scrape] MOCK mode — reading fixture: ${file}`);
    return fs.readFileSync(file, 'utf8');
  }
  return fetchPage(url);
}

function hashContent(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

// Extract ONLY the notifications/announcements section of a page, not the
// whole document (nav bars / footers change constantly and cause false positives).
function extractSection(html, selectors, baseUrl = '') {
  const $ = cheerio.load(html);
  
  const extractPdfLinks = (container) => {
    const links = [];
    container.find('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const linkText = $(el).text().replace(/\s+/g, ' ').trim();
      if (href.toLowerCase().includes('.pdf') || href.toLowerCase().includes('download')) {
        let fullUrl = href;
        if (baseUrl && !href.startsWith('http://') && !href.startsWith('https://')) {
          try {
            fullUrl = new URL(href, baseUrl).toString();
          } catch {}
        }
        links.push({ title: linkText, url: fullUrl });
      }
    });
    return links;
  };

  // Strip noise that changes but carries no exam info.
  $('script, style, nav, footer, header, img, svg, link, noscript').remove();

  for (const sel of selectors) {
    const el = $(sel);
    if (el.length) {
      const text = el.first().text().replace(/\s+/g, ' ').trim();
      if (text.length > 50) {
        const pdfLinks = extractPdfLinks(el.first());
        return { html: el.first().html(), text, pdfLinks };
      }
    }
  }

  // Fallback: entire body with noise stripped.
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const pdfLinks = extractPdfLinks($('body'));
  return { html: $('body').html(), text: bodyText, pdfLinks };
}

module.exports = { fetchPage, getPageHtml, hashContent, extractSection };

