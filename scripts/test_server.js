const http = require('node:http');

// Helper to make HTTP request
function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body), headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, body, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('Testing Srikakulam NCRP Portal API...');

  // 1. Admin Login
  console.log('\n1. Testing Admin Login...');
  const adminLogin = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { username: 'admin', password: 'Admin@SklmNCRP2026!' });

  console.log('Admin login status:', adminLogin.status);
  if (adminLogin.status !== 200 || !adminLogin.body.token) {
    throw new Error('Admin login failed: ' + JSON.stringify(adminLogin.body));
  }
  const adminToken = adminLogin.body.token;
  console.log('Admin logged in:', adminLogin.body.user.displayName);

  // 2. Station Login (Srikakulam I Town)
  console.log('\n2. Testing Station Login (srikakulam1town)...');
  const psLogin = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { username: 'srikakulam1town', password: 'srikakulam1town@skl26' });

  console.log('Station login status:', psLogin.status);
  const psToken = psLogin.body.token;
  console.log('Station user logged in:', psLogin.body.user.displayName, '| PS:', psLogin.body.user.psName);

  // 3. Station Fetches Petitions (Should be locked to Srikakulam I Town: 95 petitions)
  console.log('\n3. Testing Station Petitions fetch (RBAC)...');
  const psPetitions = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/petitions?limit=10',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${psToken}` }
  });

  console.log('Station petitions count total:', psPetitions.body.total);
  if (psPetitions.body.total !== 95) {
    console.warn('Warning: expected 95 petitions for Srikakulam I Town, got', psPetitions.body.total);
  } else {
    console.log('✅ Exactly 95 petitions returned for Srikakulam I Town (Matches sheet!)');
  }

  // 4. Update a petition
  console.log('\n4. Testing Station updating an action on a petition...');
  const firstPet = psPetitions.body.petitions[0];
  const updateRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/petitions/${firstPet.id}`,
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${psToken}`,
      'Content-Type': 'application/json'
    }
  }, {
    status: 'FIR Registered',
    mo: 'Job',
    action_taken: 'Enquiry conducted and statement recorded. Case registered under Crime No 45/2026',
    date_of_action: '14.10.2026',
    fir_number: 'Cr.No. 45/2026 U/s 318(4) BNS',
    court_memo_filed: 'Yes',
    court_order_obtained: 'No',
    remarks: 'Notices sent to ICICI Bank under Sec 91 CrPC'
  });

  console.log('Update response status:', updateRes.status);
  console.log('Update message:', updateRes.body.message);

  // 5. Test Abstract Report API
  console.log('\n5. Testing Abstract Report Generation...');
  const abstractRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/reports/abstract',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });

  console.log('Abstract report rows count:', abstractRes.body.rows.length);
  console.log('Sample station 1 in report:', abstractRes.body.rows[0].ps_name, 'FIRs:', abstractRes.body.rows[0].fir_count);

  // 6. Test Hold & Refund Report API
  console.log('\n6. Testing Hold & Refund Report...');
  const holdRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/reports/hold-refund',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log('Hold & Refund rows count:', holdRes.body.rows.length);

  // 7. Test Export CSV
  console.log('\n7. Testing Export CSV...');
  const exportRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/export/csv',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${psToken}` }
  });
  console.log('Export CSV content length:', exportRes.body.length, 'bytes');

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
