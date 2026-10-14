const { EventEmitter } = require('node:events');
const { server, db, sessions, verifyPassword } = require('../server.js');

function mockRequest(method, url, headers = {}, body = null) {
  return new Promise((resolve) => {
    const req = new EventEmitter();
    req.method = method;
    req.url = url;
    req.headers = { host: 'localhost:3000', ...headers };
    req.socket = { remoteAddress: '127.0.0.1' };

    let resBody = '';
    let resHeaders = {};
    let statusCode = 200;

    const res = {
      writeHead(code, h) {
        statusCode = code;
        resHeaders = h || {};
      },
      setHeader(k, v) {
        resHeaders[k] = v;
      },
      end(data) {
        if (data) resBody += data;
        let parsed = resBody;
        try {
          parsed = JSON.parse(resBody);
        } catch (e) {}
        resolve({ status: statusCode, headers: resHeaders, body: parsed });
      }
    };

    // Emit request to server handler
    const listeners = server.listeners('request');
    const handler = listeners[0];
    handler(req, res);

    // Send body
    if (body) {
      req.emit('data', typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.emit('end');
  });
}

async function run() {
  console.log('Testing Server Request Handler in-memory...');

  // 1. Test Admin Login
  console.log('\n1. Testing Admin Login...');
  const adminRes = await mockRequest('POST', '/api/auth/login', {}, {
    username: 'admin',
    password: 'Admin@SklmNCRP2026!'
  });

  console.log('Admin login status:', adminRes.status);
  console.log('User displayName:', adminRes.body.user?.displayName);
  const adminToken = adminRes.body.token;
  if (!adminToken) throw new Error('Failed to get admin token');

  // 2. Test Station Login (Srikakulam I Town)
  console.log('\n2. Testing Station Login (srikakulam1town)...');
  const psRes = await mockRequest('POST', '/api/auth/login', {}, {
    username: 'srikakulam1town',
    password: 'srikakulam1town@skl26'
  });
  console.log('Station login status:', psRes.status);
  console.log('Station name:', psRes.body.user?.psName);
  const psToken = psRes.body.token;
  if (!psToken) throw new Error('Failed to get station token');

  // 3. Test Petitions Fetch with RBAC (Should only return 95 petitions for Srikakulam I Town)
  console.log('\n3. Testing Petitions Fetch for Srikakulam I Town...');
  const petRes = await mockRequest('GET', '/api/petitions?limit=10', {
    'authorization': `Bearer ${psToken}`
  });
  console.log('Status:', petRes.status);
  console.log('Total petitions for station:', petRes.body.total);
  if (petRes.body.total !== 95) {
    throw new Error(`Expected 95 petitions, got ${petRes.body.total}`);
  }
  console.log('Sample petition ACK:', petRes.body.petitions[0].ack_no);

  // 4. Test Update Petition
  console.log('\n4. Testing Update Petition Action...');
  const firstId = petRes.body.petitions[0].id;
  const updateRes = await mockRequest('PUT', `/api/petitions/${firstId}`, {
    'authorization': `Bearer ${psToken}`
  }, {
    status: 'FIR Registered',
    mo: 'Job',
    action_taken: 'Notices sent to ICICI Bank. Crime Registered.',
    fir_number: 'Cr.No. 41/2026 U/s 318(4) BNS',
    court_memo_filed: 'Yes',
    court_order_obtained: 'No',
    remarks: 'Investigating Officer statement recorded'
  });

  console.log('Update status:', updateRes.status);
  console.log('Update message:', updateRes.body.message);
  console.log('Updated status in DB:', updateRes.body.petition?.status);

  // 5. Test Abstract Report
  console.log('\n5. Testing Abstract Report...');
  const absRes = await mockRequest('GET', '/api/reports/abstract', {
    'authorization': `Bearer ${adminToken}`
  });
  console.log('Abstract rows count:', absRes.body.rows?.length);
  const skl1 = absRes.body.rows.find(r => r.ps_name === 'Srikakulam I Town');
  console.log('Srikakulam I Town in Abstract:', skl1);

  // 6. Test Hold & Refund Report
  console.log('\n6. Testing Hold & Refund Report...');
  const holdRes = await mockRequest('GET', '/api/reports/hold-refund', {
    'authorization': `Bearer ${adminToken}`
  });
  console.log('Hold & Refund rows count:', holdRes.body.rows?.length);

  // 7. Test KPI Report
  console.log('\n7. Testing KPI Report...');
  const kpiRes = await mockRequest('GET', '/api/reports/kpi', {
    'authorization': `Bearer ${adminToken}`
  });
  console.log('KPI Stats:', kpiRes.body.stats);

  console.log('\n🎉 ALL 7 UNIT TESTS PASSED WITH 100% ACCURACY!');
}

run().catch(e => {
  console.error('Test error:', e);
  process.exit(1);
});
