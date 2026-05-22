const API_URL = 'http://localhost:3000/api';

async function runTests() {
  console.log('🧪 Hierarchical File Approval Flow Verification\n');
  
  let tcToken, tlToken, mgrToken, adminToken;
  let reportId, reportNum;

  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!data.token) throw new Error(`Login failed for ${email}: ${data.message}`);
    return { token: data.token, user: data.user };
  };

  const authGet = (url, token) => fetch(`${API_URL}${url}`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json());
  const authPost = (url, token, body) => fetch(`${API_URL}${url}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(body) }).then(r => r.json());
  
  // Logins
  try {
    const resTC = await login('telecaller@bestdealpaisa.com', 'TeleCaller@123');
    tcToken = resTC.token;
    console.log('✅ Logged in as Telecaller');

    const resTL = await login('teamlead@bestdealpaisa.com', 'TeamLead@123');
    tlToken = resTL.token;
    console.log('✅ Logged in as Team Lead');

    const resMGR = await login('manager@bestdealpaisa.com', 'Manager@123');
    mgrToken = resMGR.token;
    console.log('✅ Logged in as Manager');

    const resAdmin = await login('admin@bestdealpaisa.com', 'Admin@123');
    adminToken = resAdmin.token;
    console.log('✅ Logged in as Master Admin');
  } catch (err) {
    console.error('❌ Login failed:', err.message);
    process.exit(1);
  }

  // --- STEP 1: Telecaller creates a report (starts at PENDING_APPROVAL, Level 1) ---
  console.log('\n--- STEP 1: Telecaller creates a report ---');
  try {
    const reportData = {
      title: 'Verification Test Report ' + Date.now(),
      description: 'Test report for verifying approval workflow integration.',
      customerDetails: {
        name: 'John Doe',
        phone: '9876543210',
        email: 'john@example.com',
        loanAmount: 500000,
        loanType: 'Personal Loan',
        remarks: 'Excellent credit score'
      }
    };
    const res = await authPost('/shared/reports', tcToken, reportData);
    if (!res.file || !res.file.id) {
      throw new Error(`Report creation failed: ${JSON.stringify(res)}`);
    }
    reportId = res.file.id;
    reportNum = res.file.reportNumber;
    console.log(`✅ Report created: ID ${reportId}, Number: ${reportNum}, Status: ${res.file.status}, Level: ${res.file.approvalLevel}`);
    
    // Check Telecaller Dashboard
    const dbData = await authGet('/telecaller/dashboard', tcToken);
    console.log(`✅ Telecaller pending files count on dashboard: ${dbData.pendingFiles}`);
    if (dbData.pendingFiles > 0) {
      console.log('✅ SUCCESS: Telecaller dashboard correctly shows pending files');
    } else {
      console.error('❌ FAILED: Telecaller dashboard shows 0 pending files');
    }
  } catch (err) {
    console.error('❌ Step 1 failed:', err.message);
    process.exit(1);
  }

  // --- STEP 2: Team Lead approves the report (moves to Level 2) ---
  console.log('\n--- STEP 2: Team Lead approves the report ---');
  try {
    const res = await authPost(`/shared/reports/${reportId}/approve`, tlToken, {
      action: 'APPROVED',
      comments: 'Team Lead Priya: Details verified.'
    });
    console.log(`✅ TL approved report. New status: ${res.file?.status}, New level: ${res.file?.approvalLevel}`);
    if (res.file?.approvalLevel === 2) {
      console.log('✅ SUCCESS: Level correctly advanced to 2');
    } else {
      console.error(`❌ FAILED: Level is ${res.file?.approvalLevel} instead of 2`);
    }
  } catch (err) {
    console.error('❌ Step 2 failed:', err.message);
    process.exit(1);
  }

  // --- STEP 3: Check Manager Dashboard & Approve report (moves to Level 3) ---
  console.log('\n--- STEP 3: Manager views dashboard and approves ---');
  try {
    const dbData = await authGet('/manager/dashboard', mgrToken);
    console.log(`✅ Manager pending files count on dashboard: ${dbData.pendingFiles}`);
    if (dbData.pendingFiles > 0) {
      console.log('✅ SUCCESS: Manager dashboard correctly shows pending files (Level <= 2)');
    } else {
      console.error('❌ FAILED: Manager dashboard shows 0 pending files');
    }

    const res = await authPost(`/shared/reports/${reportId}/approve`, mgrToken, {
      action: 'APPROVED',
      comments: 'Manager Rahul: Approved and forwarded to Admin.'
    });
    console.log(`✅ Manager approved report. New status: ${res.file?.status}, New level: ${res.file?.approvalLevel}`);
    if (res.file?.approvalLevel === 3) {
      console.log('✅ SUCCESS: Level correctly advanced to 3');
    } else {
      console.error(`❌ FAILED: Level is ${res.file?.approvalLevel} instead of 3`);
    }

    // Manager dashboard count should now be 0 since it is level 3 (pending admin)
    const dbDataAfter = await authGet('/manager/dashboard', mgrToken);
    console.log(`✅ Manager pending files count after approval: ${dbDataAfter.pendingFiles}`);
  } catch (err) {
    console.error('❌ Step 3 failed:', err.message);
    process.exit(1);
  }

  // --- STEP 4: Admin views dashboard, list, and approves ---
  console.log('\n--- STEP 4: Admin views dashboard and approves ---');
  try {
    const dbData = await authGet('/admin/dashboard', adminToken);
    console.log(`✅ Admin pending files count on dashboard: ${dbData.pendingFiles}`);
    if (dbData.pendingFiles > 0) {
      console.log('✅ SUCCESS: Admin dashboard correctly shows pending files (Level 3)');
    } else {
      console.error('❌ FAILED: Admin dashboard shows 0 pending files');
    }

    // Test GET /api/admin/files?status=PENDING_APPROVAL
    const filesList = await authGet('/admin/files?status=PENDING_APPROVAL', adminToken);
    const found = filesList.find(f => f.id === reportId);
    if (found) {
      console.log(`✅ SUCCESS: Found report "${found.title}" in admin/files list (status: ${found.status})`);
    } else {
      console.error('❌ FAILED: Created report not found in admin/files list');
    }

    // Approve as Admin
    const res = await authPost(`/shared/reports/${reportId}/approve`, adminToken, {
      action: 'APPROVED',
      comments: 'Master Admin: Fully approved and verified.'
    });
    console.log(`✅ Admin approved report. New status: ${res.file?.status}, New level: ${res.file?.approvalLevel}`);
    if (res.file?.status === 'APPROVED' && res.file?.approvalLevel === 4) {
      console.log('✅ SUCCESS: Report is fully APPROVED (Level 4)');
    } else {
      console.error(`❌ FAILED: Final status is ${res.file?.status}, level is ${res.file?.approvalLevel}`);
    }

    // Admin dashboard count should decrease
    const dbDataAfter = await authGet('/admin/dashboard', adminToken);
    console.log(`✅ Admin pending files count after approval: ${dbDataAfter.pendingFiles}`);
  } catch (err) {
    console.error('❌ Step 4 failed:', err.message);
    process.exit(1);
  }

  console.log('\n🎉 E2E File Approval Workflow Verification completed successfully!');
}

runTests();
