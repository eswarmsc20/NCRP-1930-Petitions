const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'ncrp.db');

// Remove existing db if recreating fresh
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
}

const db = new DatabaseSync(DB_PATH);

// Helper for hashing password with salt
function hashPassword(password, salt = null) {
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex');
  }
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

// 1. Create Tables
db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'station',
    ps_name TEXT,
    circle TEXT,
    sub_division TEXT,
    station_code TEXT,
    contact_phone TEXT,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_code TEXT UNIQUE NOT NULL,
    name TEXT UNIQUE NOT NULL,
    circle TEXT NOT NULL,
    sub_division TEXT NOT NULL,
    sl_no INTEGER,
    in_charge_name TEXT,
    contact_number TEXT
  );

  CREATE TABLE IF NOT EXISTS petitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sl_no INTEGER,
    petition_date TEXT,
    ps_name TEXT NOT NULL,
    circle_name TEXT,
    sub_division TEXT,
    portal_type TEXT DEFAULT 'NCRP',
    ack_no TEXT UNIQUE NOT NULL,
    complainant_name TEXT,
    complainant_phone TEXT,
    victim_age TEXT,
    complainant_address TEXT,
    category TEXT,
    sub_category TEXT,
    lost_amount REAL DEFAULT 0,
    hold_amount REAL DEFAULT 0,
    refund_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'Under Process',
    mo TEXT,
    action_taken TEXT,
    date_of_action TEXT,
    fir_number TEXT,
    court_memo_filed TEXT DEFAULT 'No',
    court_order_obtained TEXT DEFAULT 'No',
    remarks TEXT,
    no_of_days INTEGER DEFAULT 0,
    timeline_status TEXT,
    loss_bucket TEXT,
    hold_bucket TEXT,
    updated_by TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    ps_name TEXT,
    action TEXT NOT NULL,
    ack_no TEXT,
    details TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_petitions_ps ON petitions(ps_name);
  CREATE INDEX IF NOT EXISTS idx_petitions_status ON petitions(status);
  CREATE INDEX IF NOT EXISTS idx_petitions_ack ON petitions(ack_no);
  CREATE INDEX IF NOT EXISTS idx_petitions_date ON petitions(petition_date);
  CREATE INDEX IF NOT EXISTS idx_petitions_mo ON petitions(mo);
  CREATE INDEX IF NOT EXISTS idx_petitions_subdiv ON petitions(sub_division);
`);

console.log('Tables created successfully.');

// Official 36 Police Stations list from the PS Name sheet
const OFFICIAL_STATIONS = [
  { sl: 1, name: 'Srikakulam I Town', circle: 'Srikakulam Rural Circle', sub_division: 'Srikakulam Sub-Division', code: 'SKL_1T' },
  { sl: 2, name: 'Srikakulam Rural', circle: 'Srikakulam Rural Circle', sub_division: 'Srikakulam Sub-Division', code: 'SKL_RUR' },
  { sl: 3, name: 'Gara', circle: 'Srikakulam Rural Circle', sub_division: 'Srikakulam Sub-Division', code: 'GARA' },
  { sl: 4, name: 'Srikakulam II Town', circle: 'Srikakulam II Town Circle', sub_division: 'Srikakulam Sub-Division', code: 'SKL_2T' },
  { sl: 5, name: 'Amadalavalasa', circle: 'Amadalavalasa Circle', sub_division: 'Srikakulam Sub-Division', code: 'ADV' },
  { sl: 6, name: 'Sarubujjili', circle: 'Amadalavalasa Circle', sub_division: 'Srikakulam Sub-Division', code: 'SBJ' },
  { sl: 7, name: 'Burja', circle: 'Amadalavalasa Circle', sub_division: 'Srikakulam Sub-Division', code: 'BRJ' },
  { sl: 8, name: 'Ponduru', circle: 'Amadalavalasa Circle', sub_division: 'Srikakulam Sub-Division', code: 'PDR' },
  { sl: 9, name: 'J.R.Puram', circle: 'J.R.Puram Circle', sub_division: 'Srikakulam Sub-Division', code: 'JRP' },
  { sl: 10, name: 'Etcherla', circle: 'J.R.Puram Circle', sub_division: 'Srikakulam Sub-Division', code: 'ETC' },
  { sl: 11, name: 'Laveru', circle: 'J.R.Puram Circle', sub_division: 'Srikakulam Sub-Division', code: 'LVR' },
  { sl: 12, name: 'G. Sigadam', circle: 'J.R.Puram Circle', sub_division: 'Srikakulam Sub-Division', code: 'GSG' },
  { sl: 13, name: 'Tekkali PS', circle: 'Tekkali PS Circle', sub_division: 'Tekkali Sub-Division', code: 'TKL' },
  { sl: 14, name: 'Kotabommali', circle: 'Tekkali Rural Circle', sub_division: 'Tekkali Sub-Division', code: 'KBM' },
  { sl: 15, name: 'Santhabommali', circle: 'Tekkali Rural Circle', sub_division: 'Tekkali Sub-Division', code: 'SBM' },
  { sl: 16, name: 'Naupada', circle: 'Tekkali Rural Circle', sub_division: 'Tekkali Sub-Division', code: 'NPD' },
  { sl: 17, name: 'Nandigam', circle: 'Tekkali Rural Circle', sub_division: 'Tekkali Sub-Division', code: 'NDG' },
  { sl: 18, name: 'Narasannapeta', circle: 'Narasannapeta Circle', sub_division: 'Tekkali Sub-Division', code: 'NSP' },
  { sl: 19, name: 'Jalumuru', circle: 'Narasannapeta Circle', sub_division: 'Tekkali Sub-Division', code: 'JLM' },
  { sl: 20, name: 'Polaki', circle: 'Narasannapeta Circle', sub_division: 'Tekkali Sub-Division', code: 'PLK' },
  { sl: 21, name: 'Saravakota', circle: 'Narasannapeta Circle', sub_division: 'Tekkali Sub-Division', code: 'SVK' },
  { sl: 22, name: 'Kothuru', circle: 'Kothuru Circle', sub_division: 'Tekkali Sub-Division', code: 'KTR' },
  { sl: 23, name: 'Hiramandalam', circle: 'Kothuru Circle', sub_division: 'Tekkali Sub-Division', code: 'HRM' },
  { sl: 24, name: 'Pathapatnam', circle: 'Pathapatnam Circle', sub_division: 'Tekkali Sub-Division', code: 'PPT' },
  { sl: 25, name: 'Meliaputti', circle: 'Pathapatnam Circle', sub_division: 'Tekkali Sub-Division', code: 'MPT' },
  { sl: 26, name: 'Kasibugga', circle: 'Kasibugga Circle', sub_division: 'Kasibugga Sub-Division', code: 'KBG' },
  { sl: 27, name: 'Vajrapukothuru', circle: 'Kasibugga Rural Circle', sub_division: 'Kasibugga Sub-Division', code: 'VPK' },
  { sl: 28, name: 'Mandasa', circle: 'Kasibugga Rural Circle', sub_division: 'Kasibugga Sub-Division', code: 'MDS' },
  { sl: 29, name: 'Sompeta', circle: 'Sompeta Circle', sub_division: 'Kasibugga Sub-Division', code: 'SMP' },
  { sl: 30, name: 'Baruva', circle: 'Sompeta Circle', sub_division: 'Kasibugga Sub-Division', code: 'BRV' },
  { sl: 31, name: 'Kanchili', circle: 'Sompeta Circle', sub_division: 'Kasibugga Sub-Division', code: 'KNC' },
  { sl: 32, name: 'Itchapuram Town', circle: 'Itchapuram Circle', sub_division: 'Kasibugga Sub-Division', code: 'ICP_T' },
  { sl: 33, name: 'Itchapuram Rural', circle: 'Itchapuram Circle', sub_division: 'Kasibugga Sub-Division', code: 'ICP_R' },
  { sl: 34, name: 'Kaviti', circle: 'Itchapuram Circle', sub_division: 'Kasibugga Sub-Division', code: 'KVT' },
  { sl: 35, name: 'Mahila PS, Srikakulam', circle: 'Mahila PS Circle', sub_division: 'Srikakulam Sub-Division', code: 'MHL_PS' },
  { sl: 36, name: 'Srikakulam Traffic', circle: 'Traffic Circle', sub_division: 'Srikakulam Sub-Division', code: 'TRF_PS' }
];

// Insert stations into stations table
const insertStationStmt = db.prepare(`
  INSERT INTO stations (sl_no, station_code, name, circle, sub_division)
  VALUES (?, ?, ?, ?, ?)
`);

for (const st of OFFICIAL_STATIONS) {
  insertStationStmt.run(st.sl, st.code, st.name, st.circle, st.sub_division);
}

// Helper to make normalized username slug
function makeSlug(name) {
  let s = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (s === 'srikakulamiitown') return 'srikakulam2town';
  if (s === 'srikakulamitown') return 'srikakulam1town';
  return s;
}

// Insert Users:
// 1. Super Admin
// 2. District Cyber Crime PS
// 3. 36 Police Station users
const insertUserStmt = db.prepare(`
  INSERT INTO users (username, display_name, password_hash, salt, role, ps_name, circle, sub_division, station_code)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const defaultAdminCred = hashPassword('Admin@SklmNCRP2026!');
insertUserStmt.run('admin', 'DPO / District Admin, Srikakulam', defaultAdminCred.hash, defaultAdminCred.salt, 'admin', 'District Police Office, Srikakulam', 'District HQ', 'Srikakulam District', 'DPO');

const cyberAdminCred = hashPassword('Cyber@Sklm2026!');
insertUserStmt.run('cybercell_sklm', 'Cyber Crime Police Station, Srikakulam', cyberAdminCred.hash, cyberAdminCred.salt, 'admin', 'Cyber Crime PS, Srikakulam', 'Cyber Cell', 'Srikakulam District', 'CYBER_PS');

console.log('Seeded Admin & Cyber Cell users.');

// Normalization map for PS names from Sheet
const normMap = {};
for (const st of OFFICIAL_STATIONS) {
  normMap[makeSlug(st.name)] = st;
}
// Add common variants
normMap['tekkali'] = normMap[makeSlug('Tekkali PS')];
normMap['tekkalips'] = normMap[makeSlug('Tekkali PS')];
normMap['jrpuram'] = normMap[makeSlug('J.R.Puram')];
normMap['gsigadam'] = normMap[makeSlug('G. Sigadam')];
normMap['sigadam'] = normMap[makeSlug('G. Sigadam')];
normMap['mahilaps'] = normMap[makeSlug('Mahila PS, Srikakulam')];
normMap['mahilapssrikakulam'] = normMap[makeSlug('Mahila PS, Srikakulam')];
normMap['traffic'] = normMap[makeSlug('Srikakulam Traffic')];
normMap['srikakulamtraffic'] = normMap[makeSlug('Srikakulam Traffic')];
normMap['itchapuram'] = normMap[makeSlug('Itchapuram Town')];

// Seed station users
for (const st of OFFICIAL_STATIONS) {
  const username = makeSlug(st.name);
  const password = `${username}@skl26`;
  const cred = hashPassword(password);
  
  insertUserStmt.run(
    username,
    `${st.name} PS`,
    cred.hash,
    cred.salt,
    'station',
    st.name,
    st.circle,
    st.sub_division,
    st.code
  );
}

console.log(`Seeded ${OFFICIAL_STATIONS.length} Police Station user accounts.`);

// Helper to parse amount strings like "  95,000 ", " - ", " 1,199,000 ", ""
function parseAmount(val) {
  if (!val) return 0;
  const cleaned = val.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Helper to parse CSV properly handling multiline quoted fields
function parseCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentVal);
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n
      }
      currentRow.push(currentVal);
      currentVal = '';
      if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0].trim() !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentVal += char;
    }
  }
  
  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal);
    rows.push(currentRow);
  }
  
  return rows;
}

// Read raw data from steps/6/content.md
const sourceFilePath = '/Users/cybercommando/.gemini/antigravity/brain/7edec9a7-024d-4be8-a165-7802f4c5fc60/.system_generated/steps/6/content.md';
const content = fs.readFileSync(sourceFilePath, 'utf-8');

const marker = '"Cyber Fraud Complaints Received';
const idx = content.indexOf(marker);
const csvContent = idx !== -1 ? content.slice(idx) : content;

const parsedRows = parseCSV(csvContent);
console.log(`Parsed ${parsedRows.length} total CSV rows.`);

const headers = parsedRows[0];
const dataRows = parsedRows.slice(1);

// Normalizing Status values
function normalizeStatus(st, firNo = '') {
  if (!st) return 'Under Process';
  const clean = st.trim();
  const lower = clean.toLowerCase();
  
  if (lower.includes('fir') || firNo.trim().length > 0) return 'FIR Registered';
  if (lower.includes('closed') || lower === 'close') return 'Closed';
  if (lower.includes('withdraw')) return 'Withdrawal';
  if (lower.includes('reject')) return 'Rejected';
  if (lower.includes('no action')) return 'No Action';
  if (lower.includes('nc registered') || lower.includes('nc reg')) return 'NC Registered';
  if (lower.includes('under process') || lower.includes('process')) return 'Under Process';
  if (clean === '-' || clean === '') return 'Under Process';
  
  return clean;
}

// Normalizing Modus Operandi
function normalizeMO(mo, category = '', subCategory = '') {
  if (!mo || mo.trim() === '' || mo.trim() === '0' || mo.trim() === '-') {
    // Derive from category / subCategory
    if (subCategory.includes('UPI')) return 'UPI Fraud';
    if (subCategory.includes('Vishing') || subCategory.includes('Call')) return 'Fake Customer Care';
    if (subCategory.includes('Job')) return 'Job';
    if (subCategory.includes('Sexting')) return 'Sextortion';
    if (subCategory.includes('Loan')) return 'Loan';
    if (subCategory.includes('Card') || subCategory.includes('Sim')) return 'Credit/Debit Card Fraud';
    return 'Other';
  }
  
  const m = mo.trim();
  const lower = m.toLowerCase();
  if (lower.includes('job')) return 'Job';
  if (lower.includes('otp')) return 'OTP';
  if (lower.includes('loan')) return 'Loan';
  if (lower.includes('upi')) return 'UPI Fraud';
  if (lower.includes('screen')) return 'Screen Sharing';
  if (lower.includes('invest')) return 'Investment fraud';
  if (lower.includes('sextortion')) return 'Sextortion';
  if (lower.includes('customer') || lower.includes('care')) return 'Fake Customer Care';
  if (lower.includes('website')) return 'Fake Website';
  if (lower.includes('e commerse') || lower.includes('commerce')) return 'E-Commerce';
  if (lower.includes('credit') || lower.includes('card')) return 'Credit/Debit Card Fraud';
  if (lower.includes('dating')) return 'Matrimonial/Dating';
  if (lower.includes('social')) return 'Social media';
  if (lower.includes('digital arrest')) return 'Digital Arrest';
  if (lower.includes('kyc')) return 'KYC / SIM KYC';
  if (lower.includes('gift') || lower.includes('lottery')) return 'Gift/Lottery';
  
  return m;
}

const insertPetitionStmt = db.prepare(`
  INSERT INTO petitions (
    sl_no, petition_date, ps_name, circle_name, sub_division,
    portal_type, ack_no, complainant_name, complainant_phone, victim_age,
    complainant_address, category, sub_category, lost_amount, hold_amount,
    refund_amount, status, mo, action_taken, date_of_action, fir_number,
    court_memo_filed, court_order_obtained, remarks, no_of_days, timeline_status,
    loss_bucket, hold_bucket
  ) VALUES (
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?
  )
`);

let insertedCount = 0;
let seenAcks = new Set();

db.exec('BEGIN TRANSACTION');

for (const row of dataRows) {
  if (row.length < 6) continue;
  
  const slNo = parseInt(row[0]) || (insertedCount + 1);
  const petitionDate = row[1] ? row[1].trim() : '';
  const rawPs = row[2] ? row[2].trim() : '';
  if (!rawPs) continue;
  
  const psSlug = makeSlug(rawPs);
  const st = normMap[psSlug] || {
    name: rawPs,
    circle: row[3] ? row[3].trim() : '',
    sub_division: 'Srikakulam Sub-Division'
  };
  
  const portalType = row[4] ? row[4].trim() : 'NCRP';
  let ackNo = row[5] ? row[5].trim() : '';
  if (!ackNo) {
    ackNo = `NCRP_${Date.now()}_${insertedCount}`;
  }
  
  // Prevent duplicate acks
  if (seenAcks.has(ackNo)) {
    ackNo = `${ackNo}_dup${insertedCount}`;
  }
  seenAcks.add(ackNo);
  
  // Parse complainant name and phone
  const rawComp = row[6] ? row[6].trim() : '';
  let compName = rawComp;
  let compPhone = '';
  
  // Often format is "Name \n Phone" or "Name - Phone"
  const phoneMatch = rawComp.match(/(\b[6-9]\d{9}\b)/);
  if (phoneMatch) {
    compPhone = phoneMatch[1];
    compName = rawComp.replace(compPhone, '').replace(/[\n\r\-]/g, ' ').trim();
  }
  
  const victimAge = row[7] ? row[7].trim() : '';
  const address = row[8] ? row[8].trim() : '';
  const category = row[9] ? row[9].trim() : '';
  const subCategory = row[10] ? row[10].trim() : '';
  const lostAmount = parseAmount(row[11]);
  const holdAmount = parseAmount(row[12]);
  
  const rawStatus = row[16] ? row[16].trim() : (row[13] ? row[13].trim() : 'Under Process');
  const firNumber = (rawStatus.includes('/') || (row[18] && row[18].includes('/'))) ? (row[18] || rawStatus) : '';
  const status = normalizeStatus(rawStatus, firNumber);
  
  const rawMO = row[14] ? row[14].trim() : '';
  const mo = normalizeMO(rawMO, category, subCategory);
  const dateOfAction = row[15] ? row[15].trim() : '';
  const actionTaken = row[17] ? row[17].trim() : '';
  
  const courtMemo = (row[19] && row[19].toLowerCase().includes('yes')) ? 'Yes' : 'No';
  const courtOrder = (row[20] && row[20].toLowerCase().includes('yes')) ? 'Yes' : 'No';
  const remarks = row[20] ? row[20].trim() : '';
  
  // Calculate refund if mentioned or in known refund cases
  let refundAmount = 0;
  if (actionTaken.toLowerCase().includes('39,178') || actionTaken.toLowerCase().includes('39178')) {
    refundAmount = 39178;
  } else if (actionTaken.toLowerCase().includes('116,900') || actionTaken.toLowerCase().includes('116900')) {
    refundAmount = 116900 / 3;
  }
  
  const noOfDays = parseInt(row[23]) || 0;
  const timelineStatus = row[28] ? row[28].trim() : (noOfDays > 90 ? 'Above 3 Months' : (noOfDays > 30 ? '1 to 3 Months' : 'Below 1 Month'));
  const lossBucket = row[29] ? row[29].trim() : (lostAmount === 0 ? 'NO LOSS' : (lostAmount <= 50000 ? 'Below 50,000' : (lostAmount <= 100000 ? '50,000 to 1,00,000' : 'Above 1,00,000')));
  const holdBucket = holdAmount > 0 ? (holdAmount <= 50000 ? 'Below 50,000' : 'Above 50,000') : 'No Hold';
  
  insertPetitionStmt.run(
    slNo,
    petitionDate,
    st.name,
    st.circle,
    st.sub_division,
    portalType,
    ackNo,
    compName || 'Complainant',
    compPhone,
    victimAge,
    address,
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
    courtMemo,
    courtOrder,
    remarks,
    noOfDays,
    timelineStatus,
    lossBucket,
    holdBucket
  );
  
  insertedCount++;
}

db.exec('COMMIT');

console.log(`Successfully inserted ${insertedCount} petitions into SQLite database!`);

// Print check summary
const countResult = db.prepare('SELECT count(*) as total, sum(lost_amount) as total_lost, sum(hold_amount) as total_hold FROM petitions').get();
console.log('Database Summary:', countResult);

const statusStats = db.prepare('SELECT status, count(*) as c FROM petitions GROUP BY status').all();
console.log('Status breakdown in DB:', statusStats);
