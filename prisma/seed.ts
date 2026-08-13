import { PrismaClient } from '@prisma/client';
import { syncRosterToDatabase } from '../src/config/authorized-users';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding CCPMS database (Architecture Brief v2)...');

  // ── 1. Organization ─────────────────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where:  { code: 'HQCC' },
    update: {},
    create: {
      name:        'Command & Control HQ',
      code:        'HQCC',
      description: 'Central Executive Command — CCPMS',
    },
  });
  console.log('✅ Organization seeded');

  // ── 2. 7 Official Directorates (codes locked per brief §2) ─────────────────
  const directorateData = [
    { name: 'Technology & Digital Innovation',            code: 'TECH_DIGITAL',   description: 'IT Systems, Architecture, Software Engineering & Cloud' },
    { name: 'FinTech & Technology Products',              code: 'FINTECH',         description: 'Financial Technology, Payment Gateways & Digital Products' },
    { name: 'Social Media, Platforms & Distribution',    code: 'SOCIAL_MEDIA',   description: 'Platform Distribution, Social Engagement & Network Delivery' },
    { name: 'Citizen Engagement & Global Localization',  code: 'CITIZEN_GLOBAL', description: 'Global Citizen Relations, Community Outreach & Regional Operations' },
    { name: 'Research, Data Intelligence & Governance',  code: 'RESEARCH_DATA',  description: 'Data Analytics, AI Intelligence & Regulatory Governance' },
    { name: 'Content & Media Production',                code: 'CONTENT_MEDIA',  description: 'Digital Media Production, Broadcast Services & Creative Content' },
    { name: 'Digital Asset Management & Language Services', code: 'DIGITAL_ASSETS', description: 'Digital Asset Archiving, Multilingual Services & Translation' },
  ];

  for (const d of directorateData) {
    await prisma.directorate.upsert({
      where:  { code: d.code },
      update: { name: d.name, description: d.description },
      create: { ...d, organizationId: org.id },
    });
  }
  console.log('✅ 7 Directorates seeded');

  // ── 3. Authorized Users Roster (8 entries per brief §2) ────────────────────
  await syncRosterToDatabase(prisma as any);
  console.log('✅ Roster synced (8 users)');

  // ── 4. Sample records for dev / demo ───────────────────────────────────────
  //  One MONTHLY record per AD user so the OFEM dashboard isn't empty on first boot.
  const sampleRecords = [
    {
      username: 'alexdabest',
      records: JSON.stringify({
        type:        'MONTHLY',
        period:      '2026-07',
        summary:     'Technology & Digital Innovation: Systems uptime 99.8%. Deployed CCPMS v1.0 backend.',
        kpi_results: [{ indicator: 'System Uptime', target: 99, actual: 99.8 }],
        file_url:    null,
      }),
    },
    {
      username: 'ngbadebo',
      records: JSON.stringify({
        type:        'MONTHLY',
        period:      '2026-07',
        summary:     'FinTech: Payment gateway integrations completed. 3 new products launched.',
        kpi_results: [{ indicator: 'Products Launched', target: 2, actual: 3 }],
        file_url:    null,
      }),
    },
    {
      username: 'pastorstar',
      records: JSON.stringify({
        type:        'MONTHLY',
        period:      '2026-07',
        summary:     'Social Media: Follower growth +12%. Campaign reach 2.4M.',
        kpi_results: [{ indicator: 'Follower Growth %', target: 10, actual: 12 }],
        file_url:    null,
      }),
    },
  ];

  for (const r of sampleRecords) {
    await (prisma as any).record.create({ data: r });
  }
  console.log('✅ 3 sample records created');

  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
