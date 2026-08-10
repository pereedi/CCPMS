import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Roles
  const rolesData = [
    { name: 'SUPER_ADMIN', description: 'Full system administration, configuration, and user management' },
    { name: 'DIRECTOR', description: 'Access only to assigned directorate, managing projects, KPIs, reports, and dashboards' },
  ];



  const roles: Record<string, any> = {};
  for (const r of rolesData) {
    roles[r.name] = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: r,
    });
  }

  // 2. Permissions
  const permissionsData = [
    { name: 'users:manage', resource: 'User', action: 'manage', description: 'Create and edit users' },
    { name: 'users:read', resource: 'User', action: 'read', description: 'View users list' },
    { name: 'directorates:manage', resource: 'Directorate', action: 'manage', description: 'Manage directorates' },
    { name: 'directorates:read', resource: 'Directorate', action: 'read', description: 'View directorates' },
    { name: 'projects:manage', resource: 'Project', action: 'manage', description: 'Manage projects' },
    { name: 'projects:read', resource: 'Project', action: 'read', description: 'View projects' },
    { name: 'kpis:manage', resource: 'KPI', action: 'manage', description: 'Create and update KPI definitions' },
    { name: 'kpis:read', resource: 'KPI', action: 'read', description: 'View KPI performance' },
    { name: 'kpis:update_result', resource: 'KPI', action: 'update_result', description: 'Update KPI actual values' },
    { name: 'reports:create', resource: 'Report', action: 'create', description: 'Submit monthly/quarterly reports' },
    { name: 'reports:read', resource: 'Report', action: 'read', description: 'View submitted reports' },
    { name: 'reports:review', resource: 'Report', action: 'review', description: 'Review of reports' },
    { name: 'reports:approve', resource: 'Report', action: 'approve', description: 'Director final report approval' },
    { name: 'dashboard:view_executive', resource: 'Dashboard', action: 'view_executive', description: 'View executive dashboard' },
  ];

  const permissions: Record<string, any> = {};
  for (const p of permissionsData) {
    permissions[p.name] = await prisma.permission.upsert({
      where: { name: p.name },
      update: p,
      create: p,
    });
  }

  // Role permissions mapping
  const rolePermissionsMapping: Record<string, string[]> = {
    SUPER_ADMIN: permissionsData.map((p) => p.name),
    DIRECTOR: [
      'directorates:read',
      'projects:read',
      'projects:manage',
      'kpis:read',
      'kpis:manage',
      'kpis:update_result',
      'reports:create',
      'reports:read',
      'reports:review',
      'reports:approve',
      'dashboard:view_executive',
    ],
  };

  for (const [roleName, permNames] of Object.entries(rolePermissionsMapping)) {
    const roleId = roles[roleName].id;
    for (const permName of permNames) {
      const permId = permissions[permName].id;
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId, permissionId: permId },
        },
        update: {},
        create: { roleId, permissionId: permId },
      });
    }
  }

  // 3. Organization & 7 Official Directorates
  const org = await prisma.organization.upsert({
    where: { code: 'HQCC' },
    update: {},
    create: {
      name: 'Command & Control HQ',
      code: 'HQCC',
      description: 'Central Executive Command',
    },
  });

  const officialDirectorates = [
    { name: 'Technology & Digital Innovation', code: 'TECH_DIGITAL', description: 'IT Systems, Architecture, Software Engineering & Cloud Systems' },
    { name: 'FinTech & Technology Products', code: 'FINTECH', description: 'Financial Technology, Payment Gateways & Digital Products' },
    { name: 'Social Media, Platforms & Distribution', code: 'SOCIAL_MEDIA', description: 'Platform Distribution, Social Engagement & Network Delivery' },
    { name: 'Citizen Engagement & Global Localization', code: 'CITIZEN_GLOBAL', description: 'Global Citizen Relations, Community Outreach & Regional Operations' },
    { name: 'Research, Data Intelligence & Governance', code: 'RESEARCH_DATA', description: 'Data Analytics, AI Intelligence & Regulatory Governance' },
    { name: 'Content & Media Production', code: 'CONTENT_MEDIA', description: 'Digital Media Production, Broadcast Services & Creative Content' },
    { name: 'Digital Asset Management & Language Services', code: 'DIGITAL_ASSETS', description: 'Digital Assets Archiving, Multilingual Services & Translation' },
  ];

  const createdDirectorates: Record<string, any> = {};
  for (const d of officialDirectorates) {
    createdDirectorates[d.code] = await prisma.directorate.upsert({
      where: { code: d.code },
      update: { name: d.name, description: d.description },
      create: { ...d, organizationId: org.id },
    });
  }

  const techDir = createdDirectorates['TECH_DIGITAL'];

  const techDept = await prisma.department.upsert({
    where: { code: 'TECH_SW' },
    update: {},
    create: {
      name: 'Software Systems Development',
      code: 'TECH_SW',
      directorateId: techDir.id,
    },
  });

  // 4. Authorized Users Roster (Linked to KingsChat User IDs)
  const { syncAuthorizedUsersToDatabase } = await import('../src/config/authorized-users');
  await syncAuthorizedUsersToDatabase(prisma);

  // 5. KPI Categories & KPIs
  const opCategory = await prisma.kPICategory.upsert({
    where: { name: 'Operational Excellence' },
    update: {},
    create: {
      name: 'Operational Excellence',
      description: 'System reliability, uptime, service quality',
    },
  });

  const kpiUptime = await prisma.kPI.upsert({
    where: { code: 'KPI_UPTIME' },
    update: {},
    create: {
      name: 'System Uptime & Availability',
      code: 'KPI_UPTIME',
      unit: '%',
      weight: 25.0,
      targetValue: 99.0,
      currentValue: 99.8,
      performanceScore: 100.0,
      status: 'EXCELLENT',
      categoryId: opCategory.id,
      directorateId: techDir.id,
      departmentId: techDept.id,
    },
  });

  await prisma.kPIResult.create({
    data: {
      kpiId: kpiUptime.id,
      period: '2026-M07',
      actualValue: 99.8,
      targetValue: 99.0,
      score: 100.0,
      remarks: 'Exceeded target availability with high stability.',
    },
  });

  // 6. Sample Project
  const project = await prisma.project.upsert({
    where: { code: 'PROJ_CCPMS' },
    update: {},
    create: {
      name: 'CCPMS Enterprise Command System',
      code: 'PROJ_CCPMS',
      description: 'Executive performance monitoring dashboard and reporting suite',
      status: 'IN_PROGRESS',
      progress: 65.0,
      budget: 120000.0,
      spent: 45000.0,
      directorateId: techDir.id,
      departmentId: techDept.id,
    },
  });

  await prisma.milestone.create({
    data: {
      title: 'Backend Core Architecture & API Implementation',
      status: 'IN_PROGRESS',
      projectId: project.id,
    },
  });

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
