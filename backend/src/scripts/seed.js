const { connectDB } = require('../config/db');
const ExamChange = require('../models/ExamChange');
const { recordExam } = require('../services/pipeline');

const SEED_DATA = [
  {
    source: 'SSC',
    board: 'SSC',
    examName: 'SSC CGL 2026',
    changeType: 'DATE_EXTENDED',
    changedField: 'examDate',
    oldValue: '15 Aug 2026',
    newValue: '03 Sep 2026',
    summary: 'SSC CGL 2026 Tier-I exam date shifted from 15 Aug to 03 Sep 2026.',
    importance: 'HIGH',
    confidence: 0.96,
    deadline: new Date('2026-09-03T00:00:00Z'),
    effectiveDate: new Date('2026-09-03T00:00:00Z'),
    pdfUrl: 'https://ssc.nic.in/notices/cgl_2026_date_notice.pdf',
  },
  {
    source: 'RRB',
    board: 'RRB',
    examName: 'RRB NTPC 2026',
    changeType: 'CORRIGENDUM',
    changedField: 'vacancyCount',
    oldValue: '11,558 vacancies',
    newValue: '13,240 vacancies',
    summary: 'RRB NTPC official corrigendum increases total vacancy count by 1,682.',
    importance: 'MEDIUM',
    confidence: 0.9,
    deadline: new Date('2026-08-20T00:00:00Z'),
    effectiveDate: new Date('2026-08-20T00:00:00Z'),
    pdfUrl: 'https://www.rrbcdg.gov.in/notices/cen_05_2026_corrigendum_01.pdf',
  },
  {
    source: 'UPSC',
    board: 'UPSC',
    examName: 'UPSC Civil Services 2026',
    changeType: 'ADMIT_CARD',
    changedField: 'admitCard',
    oldValue: 'Not released',
    newValue: 'Available for download',
    summary: 'UPSC CSE Prelims admit cards released for eligible candidates.',
    importance: 'HIGH',
    confidence: 0.97,
    deadline: new Date('2026-05-24T00:00:00Z'),
    effectiveDate: new Date('2026-05-24T00:00:00Z'),
    pdfUrl: 'https://upsc.gov.in/sites/default/files/Notice_CSE_Prelims_AdmitCard_2026.pdf',
  },
  {
    source: 'TNPSC',
    board: 'TNPSC',
    examName: 'TNPSC Group 2 2026',
    changeType: 'CORRIGENDUM',
    changedField: 'ageLimit',
    oldValue: '32 years',
    newValue: '34 years',
    summary: 'TNPSC Group 2 upper age limit revised by two years for eligible candidates.',
    importance: 'MEDIUM',
    confidence: 0.88,
    deadline: new Date('2026-07-01T00:00:00Z'),
    effectiveDate: new Date('2026-07-01T00:00:00Z'),
    pdfUrl: 'https://www.tnpsc.gov.in/notifications/group2_age_corrigendum_2026.pdf',
  },
  {
    source: 'IBPS',
    board: 'IBPS',
    examName: 'IBPS PO XIV 2026',
    changeType: 'RESULT',
    changedField: 'provisionalAllotment',
    oldValue: 'Awaited',
    newValue: 'Declared',
    summary: 'IBPS PO XIV final scores and provisional allotment declared on the portal.',
    importance: 'HIGH',
    confidence: 0.95,
    deadline: new Date('2026-04-01T00:00:00Z'),
    effectiveDate: new Date('2026-04-01T00:00:00Z'),
    pdfUrl: 'https://www.ibps.in/notifications/crp_po_xiv_provisional_allotment.pdf',
  },
  {
    source: 'SBI',
    board: 'SBI',
    examName: 'SBI PO 2026',
    changeType: 'NEW_NOTIFICATION',
    changedField: 'applicationWindow',
    oldValue: null,
    newValue: '01 Sep - 25 Sep 2026',
    summary: 'SBI opens recruitment notification for 2,000 Probationary Officers.',
    importance: 'HIGH',
    confidence: 0.98,
    deadline: new Date('2026-09-25T00:00:00Z'),
    effectiveDate: new Date('2026-09-01T00:00:00Z'),
    pdfUrl: 'https://sbi.co.in/careers/po_2026_official_advertisement.pdf',
  },
];

async function seed() {
  await connectDB();

  for (const sample of SEED_DATA) {
    const existing = await ExamChange.findOne({
      source: sample.source,
      examName: sample.examName,
      changeType: sample.changeType,
    });

    if (!existing) {
      const created = await ExamChange.create({
        ...sample,
        detectedAt: new Date(),
        contentHash: `seed-${sample.source}-${sample.examName}`,
      });
      await recordExam(created);
    }
  }

  console.log(`[Seed] Inserted ${SEED_DATA.length} exam updates.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('[Seed] Failed:', err.message);
  process.exit(1);
});
