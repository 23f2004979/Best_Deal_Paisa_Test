const API_URL = 'http://localhost:3000/api';

async function runTests() {
  console.log('🧪 Hierarchical Ticketing System Verification\n');
  
  let tcToken, tlToken, mgrToken, adminToken;
  let tcIssueId, tlIssueId, mgrIssueId;

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
  const authPatch = (url, token, body) => fetch(`${API_URL}${url}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(body) }).then(r => r.json());

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

  // --- TEST 1: Telecaller raises issue (should route to TL Priya, ID 3) ---
  console.log('\n--- TEST 1: Telecaller raises issue ---');
  try {
    const res = await authPost('/issues', tcToken, {
      title: 'Headset Mic Broken',
      category: 'IT Support',
      description: 'Mic is crackling. Requesting replacement.'
    });
    
    tcIssueId = res.id;
    console.log(`✅ Issue created: ID ${tcIssueId}, Assigned Senior ID: ${res.assignedSeniorId}`);
    if (res.assignedSeniorId === 3) {
      console.log('✅ SUCCESS: Correctly assigned to Team Lead (Priya, ID 3)');
    } else {
      console.error(`❌ FAILED: Assigned to senior ID ${res.assignedSeniorId} instead of 3`);
    }
  } catch (err) {
    console.error('❌ TC Issue creation failed:', err.message);
  }

  // --- TEST 2: Team Lead fetches incoming issues ---
  console.log('\n--- TEST 2: Team Lead fetches incoming issues ---');
  try {
    const res = await authGet('/issues/incoming', tlToken);
    console.log(`Incoming issues for TL: ${res.length}`);
    const found = res.find(i => i.id === tcIssueId);
    if (found) {
      console.log(`✅ SUCCESS: Found Telecaller's issue: "${found.title}" by reporter: ${found.reporter?.name}`);
    } else {
      console.error('❌ FAILED: Telecaller\'s issue not visible to Team Lead');
    }
  } catch (err) {
    console.error('❌ TL fetch failed:', err.message);
  }

  // --- TEST 3: Team Lead raises issue (should route to Manager Rahul, ID 2) ---
  console.log('\n--- TEST 3: Team Lead raises issue ---');
  try {
    const res = await authPost('/issues', tlToken, {
      title: 'Portal slow response',
      category: 'IT Support',
      description: 'The employee portal is taking over 5 seconds to load attendance.'
    });
    
    tlIssueId = res.id;
    console.log(`✅ Issue created: ID ${tlIssueId}, Assigned Senior ID: ${res.assignedSeniorId}`);
    if (res.assignedSeniorId === 2) {
      console.log('✅ SUCCESS: Correctly assigned to Manager (Rahul, ID 2)');
    } else {
      console.error(`❌ FAILED: Assigned to senior ID ${res.assignedSeniorId} instead of 2`);
    }
  } catch (err) {
    console.error('❌ TL Issue creation failed:', err.message);
  }

  // --- TEST 4: Manager fetches incoming issues ---
  console.log('\n--- TEST 4: Manager fetches incoming issues ---');
  try {
    const res = await authGet('/issues/incoming', mgrToken);
    console.log(`Incoming issues for Manager: ${res.length}`);
    const found = res.find(i => i.id === tlIssueId);
    if (found) {
      console.log(`✅ SUCCESS: Found Team Lead's issue: "${found.title}" by reporter: ${found.reporter?.name}`);
    } else {
      console.error('❌ FAILED: Team Lead\'s issue not visible to Manager');
    }
  } catch (err) {
    console.error('❌ Manager fetch failed:', err.message);
  }

  // --- TEST 5: Manager raises issue (should route to Master Admin, ID 1) ---
  console.log('\n--- TEST 5: Manager raises issue ---');
  try {
    const res = await authPost('/issues', mgrToken, {
      title: 'Database Backup Configuration',
      category: 'Operations',
      description: 'Need master credentials to configure automated weekly backup storage.'
    });
    
    mgrIssueId = res.id;
    console.log(`✅ Issue created: ID ${mgrIssueId}, Assigned Senior ID: ${res.assignedSeniorId}`);
    if (res.assignedSeniorId === 1) {
      console.log('✅ SUCCESS: Correctly assigned to Master Admin (ID 1)');
    } else {
      console.error(`❌ FAILED: Assigned to senior ID ${res.assignedSeniorId} instead of 1`);
    }
  } catch (err) {
    console.error('❌ Manager Issue creation failed:', err.message);
  }

  // --- TEST 6: Master Admin fetches incoming issues and updates status ---
  console.log('\n--- TEST 6: Master Admin fetches incoming and resolves ---');
  try {
    const res = await authGet('/issues/incoming', adminToken);
    console.log(`Incoming issues for Admin: ${res.length}`);
    const found = res.find(i => i.id === mgrIssueId);
    if (found) {
      console.log(`✅ SUCCESS: Found Manager's issue: "${found.title}"`);
      
      // Update status to IN_PROGRESS
      const resProgress = await authPatch(`/issues/${mgrIssueId}/status`, adminToken, {
        status: 'IN_PROGRESS'
      });
      console.log(`✅ Issue status updated to: ${resProgress.status}`);

      // Update status to RESOLVED
      const resResolved = await authPatch(`/issues/${mgrIssueId}/status`, adminToken, {
        status: 'RESOLVED'
      });
      console.log(`✅ Issue status updated to: ${resResolved.status}`);
      
    } else {
      console.error('❌ FAILED: Manager\'s issue not visible to Admin');
    }
  } catch (err) {
    console.error('❌ Admin operations failed:', err.message);
  }

  console.log('\n🎉 Hierarchical Ticketing System verification completed!');
}

runTests();
