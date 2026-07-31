import { app } from './src/app';
import { Server } from 'http';
import axios from 'axios';

let server: Server;
const PORT = 5555;
const BASE_URL = `http://localhost:${PORT}/api`;

async function runTests() {
  console.log('🚀 Starting CCPMS Backend End-to-End Integration Tests...\n');

  // Start temporary server
  await new Promise<void>((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`[Test Suite] Test server running on ${BASE_URL}`);
      resolve();
    });
  });

  try {
    // 1. Health check
    const health = await axios.get(`http://localhost:${PORT}/health`);
    console.log('✅ 1. System Health Check:', health.data);

    // 2. KingsChat SSO Auth (Super Admin)
    const adminAuth = await axios.post(`${BASE_URL}/auth/kingschat`, { token: 'KC_SUPERADMIN' });
    console.log('✅ 2. KingsChat SSO Admin Login:', adminAuth.data.message);
    const adminToken = adminAuth.data.data.accessToken;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // 3. KingsChat SSO Auth (Director)
    const directorAuth = await axios.post(`${BASE_URL}/auth/kingschat`, { token: 'KC_DIRECTOR' });
    const directorToken = directorAuth.data.data.accessToken;
    const directorHeaders = { Authorization: `Bearer ${directorToken}` };

    console.log('✅ 3. Authenticated 2 user sessions (Super Admin, Director)');

    // 4. Fetch Directorates list
    const directoratesRes = await axios.get(`${BASE_URL}/directorates`, { headers: adminHeaders });
    console.log('✅ 4. Directorates List count:', directoratesRes.data.data.length);
    const techDir = directoratesRes.data.data.find((d: any) => d.code === 'TECH');

    // 5. Fetch KPIs
    const kpisRes = await axios.get(`${BASE_URL}/kpis`, { headers: adminHeaders });
    console.log('✅ 5. KPIs List count:', kpisRes.data.data.length);
    const kpi = kpisRes.data.data[0];

    // 6. Record KPI Result
    const kpiResultRes = await axios.post(
      `${BASE_URL}/kpis/${kpi.id}/results`,
      {
        actualValue: 99.9,
        period: '2026-M07',
        remarks: 'Optimal performance achieved',
      },
      { headers: directorHeaders }
    );
    console.log('✅ 6. KPI Result Recorded by Director. Calculated Score:', kpiResultRes.data.data.kpi.performanceScore, '%');

    // 7. Directorate Report Workflow
    console.log('\n--- Testing Report Approval Workflow ---');
    // Step A: Director creates report
    const createReportRes = await axios.post(
      `${BASE_URL}/reports`,
      {
        title: 'Q3 Technology Performance & Security Audit',
        type: 'QUARTERLY',
        period: '2026-Q3',
        summary: 'Operational summary of infrastructure uptime and software deliverables.',
        directorateId: techDir.id,
      },
      { headers: directorHeaders }
    );
    const reportId = createReportRes.data.data.id;
    console.log('  Step A (Director): Created Draft Report ID:', reportId);

    // Step B: Director submits report
    const submitReportRes = await axios.post(`${BASE_URL}/reports/${reportId}/submit`, {}, { headers: directorHeaders });
    console.log('  Step B (Director): Submitted Report. Status:', submitReportRes.data.data.status);

    // Step C: Director final approval
    const approveReportRes = await axios.post(
      `${BASE_URL}/reports/${reportId}/approve`,
      { action: 'APPROVE', comments: 'Approved for executive dashboard inclusion.' },
      { headers: directorHeaders }
    );
    console.log('  Step C (Director): Final Approval Granted. Status:', approveReportRes.data.data.status);

    // 8. Executive Dashboard Aggregator Test
    const execDashRes = await axios.get(`${BASE_URL}/dashboard/executive`, { headers: adminHeaders });
    console.log('\n--- Executive Dashboard Aggregated Data ---');
    console.log('  Organization Health:', execDashRes.data.data.organizationHealth);
    console.log('  Directorate Rankings:', execDashRes.data.data.directorateRankings);
    console.log('  Summary Metrics:', execDashRes.data.data.summaryMetrics);
    console.log('  Risk Alerts Count:', execDashRes.data.data.riskAlerts.length);

    console.log('\n🎉 ALL CCPMS BACKEND INTEGRATION TESTS PASSED SUCCESSFULLY!');
  } catch (error: any) {
    console.error('❌ Test failed with error:', error.response?.data || error.message);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
  }
}

runTests();
