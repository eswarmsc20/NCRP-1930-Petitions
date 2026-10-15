const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'ncrp.db');
const PUBLIC_DIR = path.join(__dirname, 'public');

if (!fs.existsSync(DB_PATH)) {
  console.error('Database file not found at', DB_PATH);
  console.log('Running seeder...');
  require('./scripts/seed_database.js');
}

const db = new DatabaseSync(DB_PATH);

// In-memory token store: token -> { userId, username, role, ps_name, circle, sub_division, expiresAt }
const sessions = new Map();

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function verifyPassword(password, salt, storedHash) {
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === storedHash;
}

function hashPassword(password, salt = null) {
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex');
  }
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

// Authentication middleware helper
function getAuthUser(req) {
  const authHeader = req.headers['authorization'];
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.headers['cookie']) {
    const match = req.headers['cookie'].match(/ncrp_session=([^;]+)/);
    if (match) token = match[1];
  }
  
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return session;
}

// Helper to parse JSON body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) { // 5MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        const json = body ? JSON.parse(body) : {};
        resolve(json);
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// Helper to send JSON responses
function sendJson(res, statusCode, data) {
  const jsonStr = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(jsonStr);
}

// MIME types dictionary
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Static file server
function serveStatic(req, res, urlPath) {
  let safePath = path.normalize(urlPath).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '') safePath = '/index.html';
  
  let filePath = path.join(PUBLIC_DIR, safePath);
  if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
    filePath = filePath + '.html';
  }
  
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    // Fallback to index.html for SPA
    const indexPath = path.join(PUBLIC_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(indexPath).pipe(res);
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
    return;
  }
  
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': 'no-cache'
  });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const searchParams = parsedUrl.searchParams;

  try {
    // -------------------------------------------------------------
    // API ROUTES
    // -------------------------------------------------------------

    // 1. AUTH: Login
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      let username = (body.username || '').trim().toLowerCase();
      const password = (body.password || '').trim();

      if (!username || !password) {
        return sendJson(res, 400, { error: 'Username and password are required' });
      }

      // Convenient aliases
      const userAliases = {
        'srikakulamitown': 'srikakulam1town',
        'srikakulamiitown': 'srikakulam2town',
        'tekkali': 'tekkalips',
        'itchapuram': 'itchapuramtown',
        'mahilaps': 'mahilapssrikakulam',
        'traffic': 'srikakulamtraffic'
      };
      if (userAliases[username]) {
        username = userAliases[username];
      }

      const user = db.prepare('SELECT * FROM users WHERE lower(username) = ?').get(username);
      if (!user || !verifyPassword(password, user.salt, user.password_hash)) {
        return sendJson(res, 401, { error: 'Invalid User ID or Password / తప్పు యూజర్ ఐడీ లేదా పాస్‌వర్డ్' });
      }

      // Generate session token (valid for 7 days)
      const token = generateToken();
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
      
      const sessionData = {
        userId: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
        psName: user.ps_name,
        circle: user.circle,
        subDivision: user.sub_division,
        stationCode: user.station_code,
        expiresAt
      };
      sessions.set(token, sessionData);

      // Update user last login
      db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

      // Log audit
      db.prepare('INSERT INTO audit_logs (username, ps_name, action, details) VALUES (?, ?, ?, ?)').run(
        user.username,
        user.ps_name,
        'LOGIN',
        `User logged in from ${req.socket.remoteAddress}`
      );

      return sendJson(res, 200, {
        success: true,
        token,
        user: {
          username: user.username,
          displayName: user.display_name,
          role: user.role,
          psName: user.ps_name,
          circle: user.circle,
          subDivision: user.sub_division,
          stationCode: user.station_code
        }
      });
    }

    // 2. AUTH: Me
    if (pathname === '/api/auth/me' && req.method === 'GET') {
      const authUser = getAuthUser(req);
      if (!authUser) {
        return sendJson(res, 401, { error: 'Not authenticated' });
      }
      return sendJson(res, 200, { user: authUser });
    }

    // 3. AUTH: Logout
    if (pathname === '/api/auth/logout' && req.method === 'POST') {
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7).trim();
        sessions.delete(token);
      }
      return sendJson(res, 200, { success: true });
    }

    // 4. AUTH: Change Password
    if (pathname === '/api/auth/change-password' && req.method === 'POST') {
      const authUser = getAuthUser(req);
      if (!authUser) {
        return sendJson(res, 401, { error: 'Not authenticated' });
      }
      const body = await parseJsonBody(req);
      const currentPassword = body.currentPassword || '';
      const newPassword = body.newPassword || '';

      if (!newPassword || newPassword.length < 6) {
        return sendJson(res, 400, { error: 'New password must be at least 6 characters' });
      }

      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(authUser.userId);
      if (!verifyPassword(currentPassword, user.salt, user.password_hash)) {
        return sendJson(res, 400, { error: 'Current password is incorrect' });
      }

      const newCred = hashPassword(newPassword);
      db.prepare('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?').run(
        newCred.hash,
        newCred.salt,
        user.id
      );

      db.prepare('INSERT INTO audit_logs (username, ps_name, action, details) VALUES (?, ?, ?, ?)').run(
        authUser.username,
        authUser.psName,
        'PASSWORD_CHANGE',
        'Password updated successfully'
      );

      return sendJson(res, 200, { success: true, message: 'Password updated successfully' });
    }

    // 5. STATIONS: Get All Stations
    if (pathname === '/api/stations' && req.method === 'GET') {
      const year = (searchParams.get('year') || '').trim();
      let yearFilter = '';
      let params = [];
      if (year && year !== 'all') {
        yearFilter = 'AND p.year = ?';
        params.push(parseInt(year));
      }
      const stations = db.prepare(`
        SELECT s.*,
               COUNT(p.id) as petition_count,
               SUM(CASE WHEN p.status = 'FIR Registered' THEN 1 ELSE 0 END) as fir_count,
               SUM(CASE WHEN p.status = 'Closed' THEN 1 ELSE 0 END) as closed_count,
               SUM(CASE WHEN p.status = 'Under Process' THEN 1 ELSE 0 END) as under_process_count,
               SUM(p.lost_amount) as total_lost,
               SUM(p.hold_amount) as total_hold
        FROM stations s
        LEFT JOIN petitions p ON s.name = p.ps_name ${yearFilter}
        GROUP BY s.id
        ORDER BY s.sl_no ASC
      `).all(...params);

      return sendJson(res, 200, { stations });
    }

    // 6. PETITIONS: Get List with Search & Filters
    if (pathname === '/api/petitions' && req.method === 'GET') {
      const authUser = getAuthUser(req);
      if (!authUser) {
        return sendJson(res, 401, { error: 'Authentication required' });
      }

      const page = Math.max(1, parseInt(searchParams.get('page')) || 1);
      const limit = Math.min(200, Math.max(10, parseInt(searchParams.get('limit')) || 25));
      const offset = (page - 1) * limit;

      const search = (searchParams.get('search') || '').trim();
      let psName = (searchParams.get('ps_name') || '').trim();
      const circle = (searchParams.get('circle') || '').trim();
      const subDivision = (searchParams.get('sub_division') || '').trim();
      const status = (searchParams.get('status') || '').trim();
      const mo = (searchParams.get('mo') || '').trim();
      const category = (searchParams.get('category') || '').trim();
      const portalType = (searchParams.get('portal_type') || '').trim();
      const timeline = (searchParams.get('timeline') || '').trim();
      const year = (searchParams.get('year') || '').trim();

      // Enforce Station RBAC: station users can only query their station's petitions!
      if (authUser.role === 'station') {
        psName = authUser.psName;
      }

      let whereClauses = [];
      let params = [];

      if (year && year !== 'all') {
        whereClauses.push('year = ?');
        params.push(parseInt(year));
      }
      if (psName) {
        whereClauses.push('ps_name = ?');
        params.push(psName);
      }
      if (circle) {
        whereClauses.push('circle_name = ?');
        params.push(circle);
      }
      if (subDivision) {
        whereClauses.push('sub_division = ?');
        params.push(subDivision);
      }
      if (status) {
        whereClauses.push('status = ?');
        params.push(status);
      }
      if (mo) {
        whereClauses.push('mo = ?');
        params.push(mo);
      }
      if (category) {
        whereClauses.push('category = ?');
        params.push(category);
      }
      if (portalType) {
        whereClauses.push('portal_type = ?');
        params.push(portalType);
      }
      if (timeline) {
        whereClauses.push('timeline_status = ?');
        params.push(timeline);
      }

      if (search) {
        whereClauses.push(`(
          ack_no LIKE ? OR
          complainant_name LIKE ? OR
          complainant_phone LIKE ? OR
          complainant_address LIKE ? OR
          fir_number LIKE ? OR
          action_taken LIKE ?
        )`);
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      }

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // Count query
      const countRow = db.prepare(`SELECT count(*) as total, sum(lost_amount) as total_lost, sum(hold_amount) as total_hold, sum(refund_amount) as total_refund FROM petitions ${whereSql}`).get(...params);
      const total = countRow.total;

      // Data query
      const sortField = searchParams.get('sort_by') || 'sl_no';
      const sortOrder = (searchParams.get('sort_order') || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';
      const allowedSortFields = ['sl_no', 'petition_date', 'ps_name', 'circle_name', 'ack_no', 'complainant_name', 'lost_amount', 'hold_amount', 'refund_amount', 'status', 'mo'];
      const safeSort = allowedSortFields.includes(sortField) ? sortField : 'sl_no';

      const dataQuery = `
        SELECT * FROM petitions
        ${whereSql}
        ORDER BY ${safeSort} ${sortOrder}
        LIMIT ? OFFSET ?
      `;
      const petitions = db.prepare(dataQuery).all(...params, limit, offset);

      return sendJson(res, 200, {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalLost: countRow.total_lost || 0,
        totalHold: countRow.total_hold || 0,
        totalRefund: countRow.total_refund || 0,
        petitions
      });
    }

    // 7. PETITIONS: Get Single Petition
    if (pathname.match(/^\/api\/petitions\/(\d+)$/) && req.method === 'GET') {
      const authUser = getAuthUser(req);
      if (!authUser) {
        return sendJson(res, 401, { error: 'Authentication required' });
      }

      const id = parseInt(pathname.split('/')[3]);
      const petition = db.prepare('SELECT * FROM petitions WHERE id = ?').get(id);

      if (!petition) {
        return sendJson(res, 404, { error: 'Petition not found' });
      }

      if (authUser.role === 'station' && petition.ps_name !== authUser.psName) {
        return sendJson(res, 403, { error: 'Unauthorized to view petitions of other stations' });
      }

      return sendJson(res, 200, { petition });
    }

    // 8. PETITIONS: Update Petition
    if (pathname.match(/^\/api\/petitions\/(\d+)$/) && req.method === 'PUT') {
      const authUser = getAuthUser(req);
      if (!authUser) {
        return sendJson(res, 401, { error: 'Authentication required' });
      }

      const id = parseInt(pathname.split('/')[3]);
      const existing = db.prepare('SELECT * FROM petitions WHERE id = ?').get(id);

      if (!existing) {
        return sendJson(res, 404, { error: 'Petition not found' });
      }

      if (authUser.role === 'station' && existing.ps_name !== authUser.psName) {
        return sendJson(res, 403, { error: 'Unauthorized to edit petitions of other stations' });
      }

      const body = await parseJsonBody(req);

      const slNo = body.sl_no !== undefined ? parseInt(body.sl_no) || existing.sl_no : existing.sl_no;
      const petitionDate = body.petition_date !== undefined ? body.petition_date : existing.petition_date;
      const portalType = body.portal_type !== undefined ? body.portal_type : existing.portal_type;
      const ackNo = body.ack_no !== undefined ? String(body.ack_no).trim() : existing.ack_no;
      const psName = body.ps_name !== undefined ? body.ps_name : existing.ps_name;
      const circleName = body.circle_name !== undefined ? body.circle_name : existing.circle_name;
      const subDivision = body.sub_division !== undefined ? body.sub_division : existing.sub_division;
      const complainantName = body.complainant_name !== undefined ? body.complainant_name : existing.complainant_name;
      const complainantPhone = body.complainant_phone !== undefined ? body.complainant_phone : existing.complainant_phone;
      const victimAge = body.victim_age !== undefined ? String(body.victim_age) : existing.victim_age;
      const complainantAddress = body.complainant_address !== undefined ? body.complainant_address : existing.complainant_address;
      const category = body.category !== undefined ? body.category : existing.category;
      const subCategory = body.sub_category !== undefined ? body.sub_category : existing.sub_category;
      const lostAmount = body.lost_amount !== undefined ? parseFloat(body.lost_amount) || 0 : existing.lost_amount;
      const holdAmount = body.hold_amount !== undefined ? parseFloat(body.hold_amount) || 0 : existing.hold_amount;
      const refundAmount = body.refund_amount !== undefined ? parseFloat(body.refund_amount) || 0 : existing.refund_amount;
      const status = body.status !== undefined ? body.status : existing.status;
      const mo = body.mo !== undefined ? body.mo : existing.mo;
      const actionTaken = body.action_taken !== undefined ? body.action_taken : existing.action_taken;
      const dateOfAction = body.date_of_action !== undefined ? body.date_of_action : existing.date_of_action;
      const firNumber = body.fir_number !== undefined ? body.fir_number : existing.fir_number;
      const courtMemoFiled = body.court_memo_filed !== undefined ? body.court_memo_filed : existing.court_memo_filed;
      const courtOrderObtained = body.court_order_obtained !== undefined ? body.court_order_obtained : existing.court_order_obtained;
      const remarks = body.remarks !== undefined ? body.remarks : existing.remarks;

      const lossBucket = lostAmount >= 10000000 ? 'ABOVE 1 CR' : (lostAmount >= 5000000 ? '50L TO 1CR' : (lostAmount >= 2500000 ? '25L TO 50L' : (lostAmount >= 1000000 ? '10L TO 25L' : 'BELOW 10L')));
      const holdBucket = holdAmount > 0 ? (holdAmount >= 100000 ? 'Above 1L' : (holdAmount >= 50000 ? '50K to 1L' : (holdAmount >= 10000 ? '10K to 50K' : 'Below 10K'))) : 'No Hold';

      db.prepare(`
        UPDATE petitions SET
          sl_no = ?,
          petition_date = ?,
          portal_type = ?,
          ack_no = ?,
          ps_name = ?,
          circle_name = ?,
          sub_division = ?,
          complainant_name = ?,
          complainant_phone = ?,
          victim_age = ?,
          complainant_address = ?,
          category = ?,
          sub_category = ?,
          lost_amount = ?,
          hold_amount = ?,
          refund_amount = ?,
          status = ?,
          mo = ?,
          action_taken = ?,
          date_of_action = ?,
          fir_number = ?,
          court_memo_filed = ?,
          court_order_obtained = ?,
          remarks = ?,
          loss_bucket = ?,
          hold_bucket = ?,
          updated_by = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        slNo,
        petitionDate,
        portalType,
        ackNo,
        psName,
        circleName,
        subDivision,
        complainantName,
        complainantPhone,
        victimAge,
        complainantAddress,
        category,
        subCategory,
        lostAmount,
        holdAmount,
        refundAmount,
        status,
        mo,
        actionTaken,
        dateOfAction,
        firNumber,
        courtMemoFiled,
        courtOrderObtained,
        remarks,
        lossBucket,
        holdBucket,
        authUser.username,
        id
      );

      // Audit log
      db.prepare('INSERT INTO audit_logs (username, ps_name, action, ack_no, details) VALUES (?, ?, ?, ?, ?)').run(
        authUser.username,
        authUser.psName || psName,
        'UPDATE_PETITION',
        ackNo,
        `Updated all columns: Status '${status}', MO '${mo}', Complainant '${complainantName}', Lost ₹${lostAmount}, Hold ₹${holdAmount}`
      );

      const updated = db.prepare('SELECT * FROM petitions WHERE id = ?').get(id);

      // Keep JSON files in sync if they exist
      try {
        const petsPath = path.join(__dirname, 'data', 'petitions.json');
        const pubPetsPath = path.join(PUBLIC_DIR, 'data', 'petitions.json');
        if (fs.existsSync(petsPath)) {
          const list = JSON.parse(fs.readFileSync(petsPath, 'utf8'));
          const idx = list.findIndex(p => p.id === id);
          if (idx !== -1) {
            list[idx] = updated;
            fs.writeFileSync(petsPath, JSON.stringify(list, null, 2));
            if (fs.existsSync(pubPetsPath)) {
              fs.writeFileSync(pubPetsPath, JSON.stringify(list, null, 2));
            }
          }
        }
      } catch (e) {
        console.warn('Sync JSON note:', e.message);
      }

      return sendJson(res, 200, { success: true, petition: updated, message: 'All 24 columns updated successfully / పిటిషన్ వివరాలు అన్నీ విజయవంతంగా అప్‌డేట్ చేయబడ్డాయి' });
    }

    // 9. PETITIONS: Create New Petition
    if (pathname === '/api/petitions' && req.method === 'POST') {
      const authUser = getAuthUser(req);
      if (!authUser) {
        return sendJson(res, 401, { error: 'Authentication required' });
      }

      const body = await parseJsonBody(req);

      let psName = authUser.role === 'station' ? authUser.psName : (body.ps_name || authUser.psName);
      if (!psName) {
        return sendJson(res, 400, { error: 'Police Station name is required' });
      }

      const station = db.prepare('SELECT * FROM stations WHERE name = ?').get(psName);
      const circleName = station ? station.circle : '';
      const subDivision = station ? station.sub_division : '';

      const ackNo = (body.ack_no || '').trim() || `NCRP_${Date.now()}`;
      
      // Zero-Duplicate Check
      const existing = db.prepare('SELECT id, ack_no, ps_name, petition_date FROM petitions WHERE LOWER(TRIM(ack_no)) = LOWER(TRIM(?))').get(ackNo);
      if (existing) {
        return sendJson(res, 400, {
          error: `Duplicate Petition! Acknowledgment Number [${ackNo}] already registered in ${existing.ps_name} on ${existing.petition_date || 'N/A'}. డూప్లికేట్ ఎంట్రీ అనుమతించబడదు.`
        });
      }

      const portalType = body.portal_type || 'NCRP';
      const petitionDate = body.petition_date || new Date().toISOString().slice(0, 10).split('-').reverse().join('-');
      const complainantName = (body.complainant_name || '').trim();
      const complainantPhone = (body.complainant_phone || '').trim();
      const victimAge = (body.victim_age || '').toString();
      const complainantAddress = (body.complainant_address || '').trim();
      const category = body.category || 'Online Financial Fraud';
      const subCategory = body.sub_category || 'UPI Related Frauds';
      const lostAmount = parseFloat(body.lost_amount) || 0;
      const holdAmount = parseFloat(body.hold_amount) || 0;
      const refundAmount = parseFloat(body.refund_amount) || 0;
      const status = body.status || 'Under Process';
      const mo = body.mo || 'UPI Fraud';
      const actionTaken = body.action_taken || '';
      const dateOfAction = body.date_of_action || '';
      const firNumber = body.fir_number || '';
      const courtMemoFiled = body.court_memo_filed || 'No';
      const courtOrderObtained = body.court_order_obtained || 'No';
      const remarks = body.remarks || '';

      const maxSl = db.prepare('SELECT MAX(sl_no) as max_sl FROM petitions').get();
      const slNo = (maxSl.max_sl || 0) + 1;

      db.prepare(`
        INSERT INTO petitions (
          sl_no, petition_date, ps_name, circle_name, sub_division,
          portal_type, ack_no, complainant_name, complainant_phone, victim_age,
          complainant_address, category, sub_category, lost_amount, hold_amount,
          refund_amount, status, mo, action_taken, date_of_action, fir_number,
          court_memo_filed, court_order_obtained, remarks, updated_by
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?
        )
      `).run(
        slNo, petitionDate, psName, circleName, subDivision,
        portalType, ackNo, complainantName, complainantPhone, victimAge,
        complainantAddress, category, subCategory, lostAmount, holdAmount,
        refundAmount, status, mo, actionTaken, dateOfAction, firNumber,
        courtMemoFiled, courtOrderObtained, remarks, authUser.username
      );

      db.prepare('INSERT INTO audit_logs (username, ps_name, action, ack_no, details) VALUES (?, ?, ?, ?, ?)').run(
        authUser.username,
        psName,
        'CREATE_PETITION',
        ackNo,
        `New petition created for ${complainantName} (Loss: Rs.${lostAmount})`
      );

      return sendJson(res, 201, { success: true, message: 'New petition created successfully' });
    }

    // 9B. PETITIONS: Bulk Import from Excel / CSV with Zero-Duplicate Guard
    if (pathname === '/api/petitions/bulk' && req.method === 'POST') {
      const authUser = getAuthUser(req);
      if (!authUser) {
        return sendJson(res, 401, { error: 'Authentication required' });
      }

      const body = await parseJsonBody(req);
      const rows = body.petitions || [];
      if (!Array.isArray(rows) || rows.length === 0) {
        return sendJson(res, 400, { error: 'No petitions provided for import' });
      }

      const existingAcks = new Set(
        db.prepare('SELECT LOWER(TRIM(ack_no)) as ack FROM petitions').all().map(r => r.ack)
      );

      let insertedCount = 0;
      let skippedDuplicates = 0;

      const maxSl = db.prepare('SELECT MAX(sl_no) as max_sl FROM petitions').get();
      let currentSl = (maxSl.max_sl || 0);

      const insertStmt = db.prepare(`
        INSERT INTO petitions (
          sl_no, petition_date, ps_name, circle_name, sub_division,
          portal_type, ack_no, complainant_name, complainant_phone, victim_age,
          complainant_address, category, sub_category, lost_amount, hold_amount,
          refund_amount, status, mo, action_taken, date_of_action, fir_number,
          court_memo_filed, court_order_obtained, remarks, updated_by
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?
        )
      `);

      for (const item of rows) {
        const rawAck = (item.ack_no || '').toString().trim();
        const cleanAck = rawAck.toLowerCase();
        if (!cleanAck || existingAcks.has(cleanAck)) {
          skippedDuplicates++;
          continue;
        }

        existingAcks.add(cleanAck);
        currentSl++;

        const station = db.prepare('SELECT * FROM stations WHERE name = ?').get(item.ps_name);
        const circleName = station ? station.circle : (item.circle_name || '');
        const subDivision = station ? station.sub_division : (item.sub_division || '');

        insertStmt.run(
          currentSl,
          item.petition_date || new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
          item.ps_name || 'Cyber Crime PS, Srikakulam',
          circleName,
          subDivision,
          item.portal_type || 'NCRP',
          rawAck,
          item.complainant_name || '',
          item.complainant_phone || '',
          (item.victim_age || '').toString(),
          item.complainant_address || '',
          item.category || 'Online Financial Fraud',
          item.sub_category || 'UPI Related Frauds',
          parseFloat(item.lost_amount) || 0,
          parseFloat(item.hold_amount) || 0,
          parseFloat(item.refund_amount) || 0,
          item.status || 'Under Process',
          item.mo || 'Other',
          item.action_taken || '',
          item.date_of_action || '',
          item.fir_number || '',
          item.court_memo_filed || 'No',
          item.court_order_obtained || 'No',
          item.remarks || '',
          authUser.username
        );
        insertedCount++;
      }

      return sendJson(res, 200, {
        success: true,
        insertedCount,
        skippedDuplicates,
        message: `Successfully imported ${insertedCount} new petitions! ${skippedDuplicates} duplicate petitions skipped.`
      });
    }

    // 10. REPORTS: Executive KPI Summary
    if (pathname === '/api/reports/kpi' && req.method === 'GET') {
      const authUser = getAuthUser(req);
      if (!authUser) {
        return sendJson(res, 401, { error: 'Authentication required' });
      }

      const year = (searchParams.get('year') || '').trim();
      let whereClauses = [];
      let params = [];
      if (authUser.role === 'station') {
        whereClauses.push('ps_name = ?');
        params.push(authUser.psName);
      }
      if (year && year !== 'all') {
        whereClauses.push('year = ?');
        params.push(parseInt(year));
      }

      const psFilter = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      const stats = db.prepare(`
        SELECT
          COUNT(*) as total_petitions,
          SUM(lost_amount) as total_lost,
          SUM(hold_amount) as total_hold,
          SUM(refund_amount) as total_refund,
          SUM(CASE WHEN status = 'FIR Registered' THEN 1 ELSE 0 END) as fir_count,
          SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) as closed_count,
          SUM(CASE WHEN status = 'Under Process' THEN 1 ELSE 0 END) as under_process_count,
          SUM(CASE WHEN status = 'Withdrawal' THEN 1 ELSE 0 END) as withdrawal_count,
          SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected_count,
          SUM(CASE WHEN hold_amount > 0 THEN 1 ELSE 0 END) as hold_cases_count
        FROM petitions ${psFilter}
      `).get(...params);

      return sendJson(res, 200, { stats });
    }

    // 11. REPORTS: Abstract Report (matches Google Sheet Abstract tab)
    if (pathname === '/api/reports/abstract' && req.method === 'GET') {
      const authUser = getAuthUser(req);
      if (!authUser) {
        return sendJson(res, 401, { error: 'Authentication required' });
      }

      const rows = db.prepare(`
        SELECT
          s.sl_no,
          s.name as ps_name,
          s.circle,
          s.sub_division,
          COUNT(p.id) as total_cases,
          SUM(CASE WHEN p.status = 'FIR Registered' THEN 1 ELSE 0 END) as fir_count,
          SUM(CASE WHEN p.status = 'NC Registered' THEN 1 ELSE 0 END) as nc_count,
          SUM(CASE WHEN p.status = 'Closed' THEN 1 ELSE 0 END) as closed_count,
          SUM(CASE WHEN p.status = 'No Action' THEN 1 ELSE 0 END) as no_action_count,
          SUM(CASE WHEN p.status = 'Withdrawal' THEN 1 ELSE 0 END) as withdrawal_count,
          SUM(CASE WHEN p.status = 'Under Process' THEN 1 ELSE 0 END) as under_process_count,
          SUM(CASE WHEN p.status = 'Rejected' THEN 1 ELSE 0 END) as rejected_count,
          SUM(p.lost_amount) as total_lost,
          SUM(p.hold_amount) as total_hold
        FROM stations s
        LEFT JOIN petitions p ON s.name = p.ps_name
        GROUP BY s.id
        ORDER BY s.sl_no ASC
      `).all();

      return sendJson(res, 200, { rows });
    }

    // 12. REPORTS: Status of Hold & Refund Report (matches Google Sheet tab)
    if (pathname === '/api/reports/hold-refund' && req.method === 'GET') {
      const authUser = getAuthUser(req);
      if (!authUser) {
        return sendJson(res, 401, { error: 'Authentication required' });
      }

      const rows = db.prepare(`
        SELECT
          s.sl_no,
          s.name as ps_name,
          s.circle,
          s.sub_division,
          COUNT(p.id) as total_cases,
          SUM(p.lost_amount) as total_lost,
          SUM(CASE WHEN p.hold_amount > 0 THEN 1 ELSE 0 END) as hold_cases_count,
          SUM(p.hold_amount) as total_hold,
          SUM(CASE WHEN p.refund_amount > 0 THEN 1 ELSE 0 END) as refund_cases_count,
          SUM(p.refund_amount) as total_refund
        FROM stations s
        LEFT JOIN petitions p ON s.name = p.ps_name
        GROUP BY s.id
        ORDER BY s.sl_no ASC
      `).all();

      return sendJson(res, 200, { rows });
    }

    // 13. REPORTS: Modus Operandi (MO) Wise Analysis
    if (pathname === '/api/reports/mo-wise' && req.method === 'GET') {
      const authUser = getAuthUser(req);
      if (!authUser) {
        return sendJson(res, 401, { error: 'Authentication required' });
      }

      let psFilter = '';
      let params = [];
      if (authUser.role === 'station') {
        psFilter = 'WHERE ps_name = ?';
        params.push(authUser.psName);
      }

      const rows = db.prepare(`
        SELECT
          mo,
          COUNT(*) as count,
          SUM(lost_amount) as total_lost,
          SUM(hold_amount) as total_hold,
          SUM(CASE WHEN status = 'FIR Registered' THEN 1 ELSE 0 END) as fir_count,
          SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) as closed_count,
          SUM(CASE WHEN status = 'Under Process' THEN 1 ELSE 0 END) as under_process_count
        FROM petitions
        ${psFilter}
        GROUP BY mo
        ORDER BY count DESC
      `).all(...params);

      return sendJson(res, 200, { rows });
    }

    // 14. ADMIN: Users list
    if (pathname === '/api/admin/users' && req.method === 'GET') {
      const authUser = getAuthUser(req);
      if (!authUser || authUser.role !== 'admin') {
        return sendJson(res, 403, { error: 'Admin permission required' });
      }

      const users = db.prepare(`
        SELECT id, username, display_name, role, ps_name, circle, sub_division, station_code, last_login, created_at
        FROM users
        ORDER BY role DESC, ps_name ASC
      `).all();

      return sendJson(res, 200, { users });
    }

    // 15. ADMIN: Reset Station Password
    if (pathname === '/api/admin/reset-password' && req.method === 'POST') {
      const authUser = getAuthUser(req);
      if (!authUser || authUser.role !== 'admin') {
        return sendJson(res, 403, { error: 'Admin permission required' });
      }

      const body = await parseJsonBody(req);
      const targetUserId = body.userId;
      const newPassword = body.newPassword || 'Sklm@PS2026!';

      if (!targetUserId) {
        return sendJson(res, 400, { error: 'Target User ID is required' });
      }

      const newCred = hashPassword(newPassword);
      db.prepare('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?').run(
        newCred.hash,
        newCred.salt,
        targetUserId
      );

      const target = db.prepare('SELECT username, ps_name FROM users WHERE id = ?').get(targetUserId);

      db.prepare('INSERT INTO audit_logs (username, ps_name, action, details) VALUES (?, ?, ?, ?)').run(
        authUser.username,
        authUser.psName,
        'RESET_PASSWORD',
        `Admin reset password for ${target.username} (${target.ps_name})`
      );

      return sendJson(res, 200, { success: true, message: `Password reset successfully for ${target.ps_name}` });
    }

    // 16. EXPORT: CSV Download
    if (pathname === '/api/export/csv' && req.method === 'GET') {
      const authUser = getAuthUser(req);
      if (!authUser) {
        return sendJson(res, 401, { error: 'Authentication required' });
      }

      let psName = searchParams.get('ps_name') || '';
      if (authUser.role === 'station') {
        psName = authUser.psName;
      }

      let whereSql = '';
      let params = [];
      if (psName) {
        whereSql = 'WHERE ps_name = ?';
        params.push(psName);
      }

      const rows = db.prepare(`SELECT * FROM petitions ${whereSql} ORDER BY sl_no ASC`).all(...params);

      // Format CSV
      const csvHeaders = [
        'SL NO', 'Date', 'Police Station', 'Circle', 'Sub-Division', 'Type',
        'Ack No', 'Complainant Name', 'Phone', 'Age', 'Address', 'Category',
        'Sub Category', 'Lost Amount', 'Hold Amount', 'Refund Amount', 'Status',
        'MO', 'Action Taken', 'Date of Action', 'FIR No', 'Court Memo', 'Court Order', 'Remarks'
      ];

      const escapeCsv = (val) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      let csvText = csvHeaders.map(escapeCsv).join(',') + '\r\n';

      for (const r of rows) {
        csvText += [
          r.sl_no,
          r.petition_date,
          r.ps_name,
          r.circle_name,
          r.sub_division,
          r.portal_type,
          r.ack_no,
          r.complainant_name,
          r.complainant_phone,
          r.victim_age,
          r.complainant_address,
          r.category,
          r.sub_category,
          r.lost_amount,
          r.hold_amount,
          r.refund_amount,
          r.status,
          r.mo,
          r.action_taken,
          r.date_of_action,
          r.fir_number,
          r.court_memo_filed,
          r.court_order_obtained,
          r.remarks
        ].map(escapeCsv).join(',') + '\r\n';
      }

      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="NCRP_Petitions_${psName ? psName.replace(/[^a-zA-Z0-9]/g, '_') : 'Srikakulam_District'}.csv"`
      });
      res.end(csvText);
      return;
    }

    // 15. COURT REFUNDS API
    if (pathname.startsWith('/api/court-refunds')) {
      const courtJsonPath = path.join(__dirname, 'data', 'court_refunds.json');
      const publicCourtJsonPath = path.join(PUBLIC_DIR, 'data', 'court_refunds.json');

      const readCourtData = () => {
        if (fs.existsSync(courtJsonPath)) {
          return JSON.parse(fs.readFileSync(courtJsonPath, 'utf8'));
        } else if (fs.existsSync(publicCourtJsonPath)) {
          return JSON.parse(fs.readFileSync(publicCourtJsonPath, 'utf8'));
        }
        return null;
      };

      const writeCourtData = (data) => {
        const str = JSON.stringify(data, null, 2);
        try { fs.writeFileSync(courtJsonPath, str, 'utf8'); } catch (e) {}
        try { fs.writeFileSync(publicCourtJsonPath, str, 'utf8'); } catch (e) {}
      };

      if (pathname === '/api/court-refunds' && req.method === 'GET') {
        const data = readCourtData();
        return sendJson(res, 200, data || {});
      }

      if (pathname === '/api/court-refunds' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const data = readCourtData();
        if (data && Array.isArray(data.cases)) {
          data.cases.push(body);
          writeCourtData(data);
          return sendJson(res, 201, { success: true, case: body });
        }
        return sendJson(res, 400, { error: 'Failed to save case' });
      }

      const matchId = pathname.match(/^\/api\/court-refunds\/([^/]+)$/);
      if (matchId && req.method === 'PUT') {
        const id = matchId[1];
        const body = await parseJsonBody(req);
        const data = readCourtData();
        if (data && Array.isArray(data.cases)) {
          const idx = data.cases.findIndex(c => String(c.s_no) === String(id) || String(c['S No']) === String(id));
          if (idx !== -1) {
            data.cases[idx] = body;
          } else {
            data.cases.push(body);
          }
          writeCourtData(data);
          return sendJson(res, 200, { success: true, case: body });
        }
        return sendJson(res, 404, { error: 'Case not found' });
      }

      if (matchId && req.method === 'DELETE') {
        const id = matchId[1];
        const data = readCourtData();
        if (data && Array.isArray(data.cases)) {
          data.cases = data.cases.filter(c => String(c.s_no) !== String(id) && String(c['S No']) !== String(id));
          writeCourtData(data);
          return sendJson(res, 200, { success: true });
        }
        return sendJson(res, 404, { error: 'Case not found' });
      }
    }

    // 16. HIGH-VALUE FRAUDS (₹10 LAKHS & ABOVE) API
    if (pathname.startsWith('/api/high-value-frauds')) {
      const hvJsonPath = path.join(__dirname, 'data', 'high_value_frauds.json');
      const publicHvJsonPath = path.join(PUBLIC_DIR, 'data', 'high_value_frauds.json');

      const readHvData = () => {
        if (fs.existsSync(hvJsonPath)) {
          return JSON.parse(fs.readFileSync(hvJsonPath, 'utf8'));
        } else if (fs.existsSync(publicHvJsonPath)) {
          return JSON.parse(fs.readFileSync(publicHvJsonPath, 'utf8'));
        }
        return null;
      };

      const writeHvData = (data) => {
        const str = JSON.stringify(data, null, 2);
        try { fs.writeFileSync(hvJsonPath, str, 'utf8'); } catch (e) {}
        try { fs.writeFileSync(publicHvJsonPath, str, 'utf8'); } catch (e) {}
      };

      if (pathname === '/api/high-value-frauds' && req.method === 'GET') {
        const data = readHvData();
        return sendJson(res, 200, data || {});
      }

      if (pathname === '/api/high-value-frauds' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const data = readHvData();
        if (data && Array.isArray(data.cases)) {
          if (!body.sl_no) {
            body.sl_no = data.cases.length + 1;
          }
          data.cases.push(body);
          const totalLost = data.cases.reduce((sum, c) => sum + (Number(c.amount_lost) || 0), 0);
          const totalFrozen = data.cases.reduce((sum, c) => sum + (Number(c.amount_frozen) || 0), 0);
          data.summary.total_cases = data.cases.length;
          data.summary.total_amount_lost = totalLost;
          data.summary.total_amount_frozen = Math.round(totalFrozen * 100) / 100;
          data.summary.frozen_percentage = totalLost > 0 ? Math.round((totalFrozen / totalLost) * 10000) / 100 : 0;
          writeHvData(data);
          return sendJson(res, 201, { success: true, case: body, summary: data.summary });
        }
        return sendJson(res, 400, { error: 'Failed to save case' });
      }

      const matchHvId = pathname.match(/^\/api\/high-value-frauds\/([^/]+)$/);
      if (matchHvId && req.method === 'PUT') {
        const id = matchHvId[1];
        const body = await parseJsonBody(req);
        const data = readHvData();
        if (data && Array.isArray(data.cases)) {
          const idx = data.cases.findIndex(c => String(c.sl_no) === String(id));
          if (idx !== -1) {
            data.cases[idx] = { ...data.cases[idx], ...body };
          } else {
            data.cases.push(body);
          }
          const totalLost = data.cases.reduce((sum, c) => sum + (Number(c.amount_lost) || 0), 0);
          const totalFrozen = data.cases.reduce((sum, c) => sum + (Number(c.amount_frozen) || 0), 0);
          data.summary.total_cases = data.cases.length;
          data.summary.total_amount_lost = totalLost;
          data.summary.total_amount_frozen = Math.round(totalFrozen * 100) / 100;
          data.summary.frozen_percentage = totalLost > 0 ? Math.round((totalFrozen / totalLost) * 10000) / 100 : 0;
          writeHvData(data);
          return sendJson(res, 200, { success: true, case: data.cases[idx !== -1 ? idx : data.cases.length - 1], summary: data.summary });
        }
        return sendJson(res, 404, { error: 'Case not found' });
      }

      if (matchHvId && req.method === 'DELETE') {
        const id = matchHvId[1];
        const data = readHvData();
        if (data && Array.isArray(data.cases)) {
          data.cases = data.cases.filter(c => String(c.sl_no) !== String(id));
          const totalLost = data.cases.reduce((sum, c) => sum + (Number(c.amount_lost) || 0), 0);
          const totalFrozen = data.cases.reduce((sum, c) => sum + (Number(c.amount_frozen) || 0), 0);
          data.summary.total_cases = data.cases.length;
          data.summary.total_amount_lost = totalLost;
          data.summary.total_amount_frozen = Math.round(totalFrozen * 100) / 100;
          data.summary.frozen_percentage = totalLost > 0 ? Math.round((totalFrozen / totalLost) * 10000) / 100 : 0;
          writeHvData(data);
          return sendJson(res, 200, { success: true, summary: data.summary });
        }
        return sendJson(res, 404, { error: 'Case not found' });
      }
    }

    // Default: Serve frontend static files
    serveStatic(req, res, pathname);

  } catch (err) {
    console.error('Server error:', err);
    sendJson(res, 500, { error: 'Internal server error: ' + err.message });
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  Srikakulam District Police - NCRP Web Portal Active  `);
    console.log(`  Server listening on: http://localhost:${PORT}        `);
    console.log(`=======================================================`);
  });
}

module.exports = { server, db, sessions, hashPassword, verifyPassword };
