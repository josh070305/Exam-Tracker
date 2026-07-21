// Registry of monitored sources (6 boards). Add more by dropping a
// scraper file here + a fixture when MOCK_SCRAPE=1.
const ALL = [
  { name: 'SSC', scrape: require('./ssc').scrapeSSC },
  { name: 'RRB', scrape: require('./rrb').scrapeRRB },
  { name: 'TNPSC', scrape: require('./tnpsc').scrapeTNPSC },
  { name: 'UPSC', scrape: require('./upsc').scrapeUPSC },
  { name: 'IBPS', scrape: require('./ibps').scrapeIBPS },
  { name: 'SBI', scrape: require('./sbi').scrapeSBI },
];

module.exports = { sources: ALL };
