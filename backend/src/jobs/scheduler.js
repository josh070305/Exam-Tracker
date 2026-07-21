const cron = require('node-cron');
const { runAllSources } = require('../services/pipeline');
const { persistToDisk } = require('../storage');

let running = false;

async function scheduledRun() {
  if (running) {
    console.log('[Scheduler] Previous run still in progress — skipping overlap.');
    return;
  }
  running = true;
  console.log('[Scheduler] Running scheduled check-all-sources job...');
  try {
    const results = await runAllSources();
    await persistToDisk();
    console.log('[Scheduler] Done:', JSON.stringify(results));
  } catch (err) {
    console.error('[Scheduler] Job failed:', err.message);
  } finally {
    running = false;
  }
}

function startScheduler() {
  // Every 2 hours.
  cron.schedule('0 */2 * * *', scheduledRun);
  console.log('[Scheduler] Cron active: every 2 hours (0 */2 * * *)');
}

module.exports = { startScheduler, scheduledRun, runAllSources };
