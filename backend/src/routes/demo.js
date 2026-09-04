const express = require('express');
const router = express.Router();
const ExamChange = require('../models/ExamChange');
const Exam = require('../models/Exam');
const User = require('../models/User');
const { broadcast } = require('../services/sse');
const { recordExam } = require('../services/pipeline');

const SAMPLE_EXAM_UPDATES = [
  {
    source: 'SSC',
    examName: 'SSC CGL 2026',
    changeType: 'date_change',
    changedField: 'examDate',
    oldValue: '15 August 2026',
    newValue: '03 September 2026',
    effectiveDate: new Date('2026-09-03'),
    summary: 'SSC CGL 2026 Tier-1 examination date rescheduled from 15 Aug to 03 Sep 2026.',
    pdfUrl: 'https://ssc.gov.in/notices/cgl_2026_reschedule_notice.pdf',
    rawSnippet: 'Staff Selection Commission: Notice No. 1/2026-CGL. Due to administrative logistics, the Tier-I Combined Graduate Level Examination 2026 will now commence from 03.09.2026 across designated national test centres.',
  },
  {
    source: 'RRB',
    examName: 'RRB NTPC 2026',
    changeType: 'corrigendum',
    changedField: 'vacancyCount',
    oldValue: '11,558 Vacancies',
    newValue: '13,240 Vacancies (Revised +1,682)',
    effectiveDate: new Date('2026-08-20'),
    summary: 'RRB NTPC CEN 05/2026 official corrigendum: total non-technical vacancies increased by 1,682 posts.',
    pdfUrl: 'https://www.rrbcdg.gov.in/notices/CEN_05_2026_Corrigendum_01.pdf',
    rawSnippet: 'Railway Recruitment Boards: Corrigendum-01 to CEN 05/2026. In consultation with Zonal Railways, additional safety and operational posts have been sanctioned, increasing total vacancies from 11,558 to 13,240.',
  },
  {
    source: 'UPSC',
    examName: 'UPSC Civil Services 2026',
    changeType: 'admit_card',
    changedField: 'eAdmitCard',
    oldValue: 'Not Released',
    newValue: 'Available for Download',
    effectiveDate: new Date('2026-05-10'),
    summary: 'UPSC CSE Prelims 2026 e-Admit Cards released on upsconline.nic.in with exam day instructions.',
    pdfUrl: 'https://upsc.gov.in/sites/default/files/Notice_CSE_Prelims_AdmitCard_2026.pdf',
    rawSnippet: 'Union Public Service Commission: Press Note. Candidates appearing for the Civil Services (Preliminary) Examination 2026 scheduled for 24th May 2026 may download their e-Admit Card with roll number / registration ID.',
  },
  {
    source: 'TNPSC',
    examName: 'TNPSC Group 2 2026',
    changeType: 'eligibility_revised',
    changedField: 'upperAgeLimit',
    oldValue: '32 Years',
    newValue: '34 Years (2-year one-time relaxation)',
    effectiveDate: new Date('2026-07-01'),
    summary: 'TNPSC Group 2 & 2A Notification: Upper age limit relaxed by 2 years across all general categories.',
    pdfUrl: 'https://www.tnpsc.gov.in/notifications/2026_Group2_Corrigendum_Age.pdf',
    rawSnippet: 'Tamil Nadu Public Service Commission: Notification Addendum. As per G.O. (Ms) No. 48/P&AR, the maximum age limit for non-interview posts under Combined Civil Services Examination-II is extended to 34 years.',
  },
  {
    source: 'IBPS',
    examName: 'IBPS PO XIV 2026',
    changeType: 'result',
    changedField: 'finalScorecard',
    oldValue: 'Awaited',
    newValue: 'Declared on Portal',
    effectiveDate: new Date('2026-04-01'),
    summary: 'IBPS CRP PO/MT XIV final combined scores and provisional bank allotments declared.',
    pdfUrl: 'https://www.ibps.in/notifications/crp_po_xiv_provisional_allotment.pdf',
    rawSnippet: 'Institute of Banking Personnel Selection: Notice on CRP PO/MT-XIV. Provisional allotment based on merit-cum-preference for 11 participating public sector banks is now available for candidate login.',
  },
  {
    source: 'SBI',
    examName: 'SBI PO 2026',
    changeType: 'new_exam',
    changedField: 'applicationWindow',
    oldValue: null,
    newValue: 'Application Window: 01 Sep - 25 Sep 2026',
    effectiveDate: new Date('2026-09-01'),
    summary: 'State Bank of India releases official notification for 2,000 Probationary Officers for FY 2026-27.',
    pdfUrl: 'https://sbi.co.in/careers/po_2026_official_advertisement.pdf',
    rawSnippet: 'State Bank of India Central Recruitment & Promotion Department: Advertisement No. CRPD/PO/2026-27/12. Applications invited from eligible Indian citizens for appointment as Probationary Officers.',
  },
];

// POST /api/demo/seed — injects realistic Indian exam notices into DB & SSE stream
router.post('/demo/seed', async (req, res) => {
  try {
    const seededChanges = [];

    // Emit agent log
    broadcast('agent_log', {
      timestamp: new Date().toISOString(),
      stage: 'INGEST',
      message: 'Autonomous seed trigger received. Simulating multi-portal live capture...',
    });

    for (const sample of SAMPLE_EXAM_UPDATES) {
      const change = await ExamChange.create({
        ...sample,
        detectedAt: new Date(Date.now() - Math.floor(Math.random() * 3600000)),
        contentHash: 'demo-' + Math.random().toString(36).substring(2, 9),
      });

      await recordExam(change);
      seededChanges.push(change);

      // Broadcast update live to all connected dashboards
      broadcast('exam_update', change);

      broadcast('agent_log', {
        timestamp: new Date().toISOString(),
        stage: 'REASONING',
        source: sample.source,
        message: `Extracted ${sample.changeType.toUpperCase()} for "${sample.examName}": ${sample.summary}`,
      });
    }

    res.json({
      message: 'Successfully seeded 6 realistic Indian government exam notices',
      count: seededChanges.length,
      seeded: seededChanges,
    });
  } catch (err) {
    console.error('[Demo Seed Error]:', err.message);
    res.status(500).json({ error: 'Failed to seed demo data' });
  }
});

// POST /api/bot/simulate — in-browser Telegram bot command simulator
router.post('/bot/simulate', async (req, res) => {
  try {
    const { command = '', chatId = 'web-simulator-user' } = req.body;
    const trimmed = command.trim();
    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ').trim();

    let reply = '';
    const user = await User.findOne({ telegramChatId: chatId }) || await User.findOne({}) || {
      name: 'Demo Aspirant',
      prefs: { sources: ['SSC', 'RRB', 'UPSC'], exams: ['CGL', 'NTPC'], types: ['date_change', 'corrigendum'] },
    };

    if (cmd === '/start') {
      reply =
        `👋 *Welcome to GovExam Tracker, ${user.name || 'Aspirant'}!*\n\n` +
        `I am your autonomous 24/7 exam monitoring agent. I track *SSC, RRB, TNPSC, UPSC, IBPS, and SBI* notifications in real-time.\n\n` +
        `*Quick Commands:*\n` +
        `• /myexams — View your active alert preferences\n` +
        `• /subscribe <board/exam> — Subscribe (e.g. \`/subscribe SSC\`)\n` +
        `• /latest [board] — Get recent notifications\n` +
        `• /check — Trigger a live web portal scan`;
    } else if (cmd === '/myexams') {
      const sources = (user.prefs?.sources || []).join(', ') || 'All Boards';
      const exams = (user.prefs?.exams || []).join(', ') || 'All Exams';
      reply =
        `📋 *Your Active Subscription Profile*\n\n` +
        `🏛️ *Boards:* ${sources}\n` +
        `🎯 *Keywords:* ${exams}\n` +
        `🔔 *Channel:* Telegram Bot Active ✅`;
    } else if (cmd === '/subscribe') {
      if (!arg) {
        reply = '⚠️ Please specify a board or exam name. Example: `/subscribe SSC` or `/subscribe CGL`';
      } else {
        reply = `✅ *Subscribed!* You will now receive instant alerts whenever updates match "*${arg.toUpperCase()}*".`;
      }
    } else if (cmd === '/latest') {
      const query = arg ? { source: arg.toUpperCase() } : {};
      const changes = await ExamChange.find(query);
      const list = (changes || []).slice(0, 3);
      if (list.length === 0) {
        reply = `ℹ️ No updates currently on record for ${arg.toUpperCase() || 'any board'}.`;
      } else {
        reply = `📢 *Latest Updates for ${arg.toUpperCase() || 'All Boards'}:*\n\n`;
        for (const c of list) {
          reply += `• *[${c.source}]* ${c.summary}\n`;
        }
      }
    } else if (cmd === '/check') {
      reply = `⚡ *Scan complete!* Monitored 6 government portals. Knowledge base and alerts are completely up to date.`;
    } else {
      reply =
        `📚 *Available Commands:*\n` +
        `• /start — Welcome & setup\n` +
        `• /myexams — Show subscriptions\n` +
        `• /subscribe <board> — Add alert filter\n` +
        `• /latest [board] — Read recent notices\n` +
        `• /check — Trigger real-time portal scan`;
    }

    res.json({ command: trimmed, reply });
  } catch (err) {
    console.error('[Bot Simulate Error]:', err.message);
    res.status(500).json({ error: 'Simulation failed' });
  }
});

module.exports = router;
