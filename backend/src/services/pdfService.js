const axios = require('axios');
const pdfParse = require('pdf-parse');

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

/**
 * Downloads and parses an official exam notice PDF.
 * Extracts the first maxPages pages to stay token-efficient while capturing
 * crucial exam dates, corrigendums, and eligibility updates.
 */
async function extractPdfText(url, maxPages = 3) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/pdf',
      },
      timeout: 25000,
      maxContentLength: 15 * 1024 * 1024, // 15MB limit
    });

    const buffer = Buffer.from(response.data);
    const data = await pdfParse(buffer, {
      max: maxPages,
    });

    // Clean whitespace and normalize line breaks
    const cleanText = (data.text || '')
      .replace(/\r\n|\r/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n+/g, '\n\n')
      .trim();

    return {
      success: true,
      text: cleanText.slice(0, 8000), // Cap at 8,000 chars for LLM context window
      numpages: data.numpages,
      info: data.info,
    };
  } catch (err) {
    console.warn(`[PDF] Failed to extract from ${url}:`, err.message);
    return {
      success: false,
      text: '',
      error: err.message,
    };
  }
}

module.exports = { extractPdfText };
