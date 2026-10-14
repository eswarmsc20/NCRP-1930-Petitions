// Srikakulam District Police NCRP Portal Frontend Engine

let currentUser = null;
let currentToken = localStorage.getItem('ncrp_token');
let currentPetitionsPage = 1;
let currentPetitionsLimit = 25;
let allStationsList = [];
let chartsInitialized = false;
let moChartInstance = null;
let statusChartInstance = null;
let stationVolumeChartInstance = null;
let financialChartInstance = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  setupEventListeners();
});


// Toast notification helper
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️')}</span>
    <div>${message}</div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Indian Currency Formatter
function formatINR(val) {
  const num = parseFloat(val) || 0;
  if (num >= 10000000) {
    return '₹' + (num / 10000000).toFixed(2) + ' Cr';
  } else if (num >= 100000) {
    return '₹' + (num / 100000).toFixed(2) + ' L';
  } else {
    return '₹' + num.toLocaleString('en-IN');
  }
}

// Embedded Master Datasets for GitHub Pages & Offline Reliability
const EMBEDDED_USERS = [{"id":1,"username":"admin","display_name":"DPO / District Admin, Srikakulam","role":"admin","ps_name":"District Police Office, Srikakulam","circle":"District HQ","sub_division":"Srikakulam District","station_code":"DPO"},{"id":2,"username":"cybercell_sklm","display_name":"Cyber Crime Police Station, Srikakulam","role":"admin","ps_name":"Cyber Crime PS, Srikakulam","circle":"Cyber Cell","sub_division":"Srikakulam District","station_code":"CYBER_PS"},{"id":3,"username":"srikakulam1town","display_name":"Srikakulam I Town PS","role":"station","ps_name":"Srikakulam I Town","circle":"Srikakulam Rural Circle","sub_division":"Srikakulam Sub-Division","station_code":"SKL_1T"},{"id":4,"username":"srikakulamrural","display_name":"Srikakulam Rural PS","role":"station","ps_name":"Srikakulam Rural","circle":"Srikakulam Rural Circle","sub_division":"Srikakulam Sub-Division","station_code":"SKL_RUR"},{"id":5,"username":"gara","display_name":"Gara PS","role":"station","ps_name":"Gara","circle":"Srikakulam Rural Circle","sub_division":"Srikakulam Sub-Division","station_code":"GARA"},{"id":6,"username":"srikakulam2town","display_name":"Srikakulam II Town PS","role":"station","ps_name":"Srikakulam II Town","circle":"Srikakulam II Town Circle","sub_division":"Srikakulam Sub-Division","station_code":"SKL_2T"},{"id":7,"username":"amadalavalasa","display_name":"Amadalavalasa PS","role":"station","ps_name":"Amadalavalasa","circle":"Amadalavalasa Circle","sub_division":"Srikakulam Sub-Division","station_code":"ADV"},{"id":8,"username":"sarubujjili","display_name":"Sarubujjili PS","role":"station","ps_name":"Sarubujjili","circle":"Amadalavalasa Circle","sub_division":"Srikakulam Sub-Division","station_code":"SBJ"},{"id":9,"username":"burja","display_name":"Burja PS","role":"station","ps_name":"Burja","circle":"Amadalavalasa Circle","sub_division":"Srikakulam Sub-Division","station_code":"BRJ"},{"id":10,"username":"ponduru","display_name":"Ponduru PS","role":"station","ps_name":"Ponduru","circle":"Amadalavalasa Circle","sub_division":"Srikakulam Sub-Division","station_code":"PDR"},{"id":11,"username":"jrpuram","display_name":"J.R.Puram PS","role":"station","ps_name":"J.R.Puram","circle":"J.R.Puram Circle","sub_division":"Srikakulam Sub-Division","station_code":"JRP"},{"id":12,"username":"etcherla","display_name":"Etcherla PS","role":"station","ps_name":"Etcherla","circle":"J.R.Puram Circle","sub_division":"Srikakulam Sub-Division","station_code":"ETC"},{"id":13,"username":"laveru","display_name":"Laveru PS","role":"station","ps_name":"Laveru","circle":"J.R.Puram Circle","sub_division":"Srikakulam Sub-Division","station_code":"LVR"},{"id":14,"username":"gsigadam","display_name":"G. Sigadam PS","role":"station","ps_name":"G. Sigadam","circle":"J.R.Puram Circle","sub_division":"Srikakulam Sub-Division","station_code":"GSG"},{"id":15,"username":"tekkalips","display_name":"Tekkali PS PS","role":"station","ps_name":"Tekkali PS","circle":"Tekkali PS Circle","sub_division":"Tekkali Sub-Division","station_code":"TKL"},{"id":16,"username":"kotabommali","display_name":"Kotabommali PS","role":"station","ps_name":"Kotabommali","circle":"Tekkali Rural Circle","sub_division":"Tekkali Sub-Division","station_code":"KBM"},{"id":17,"username":"santhabommali","display_name":"Santhabommali PS","role":"station","ps_name":"Santhabommali","circle":"Tekkali Rural Circle","sub_division":"Tekkali Sub-Division","station_code":"SBM"},{"id":18,"username":"naupada","display_name":"Naupada PS","role":"station","ps_name":"Naupada","circle":"Tekkali Rural Circle","sub_division":"Tekkali Sub-Division","station_code":"NPD"},{"id":19,"username":"nandigam","display_name":"Nandigam PS","role":"station","ps_name":"Nandigam","circle":"Tekkali Rural Circle","sub_division":"Tekkali Sub-Division","station_code":"NDG"},{"id":20,"username":"narasannapeta","display_name":"Narasannapeta PS","role":"station","ps_name":"Narasannapeta","circle":"Narasannapeta Circle","sub_division":"Tekkali Sub-Division","station_code":"NSP"},{"id":21,"username":"jalumuru","display_name":"Jalumuru PS","role":"station","ps_name":"Jalumuru","circle":"Narasannapeta Circle","sub_division":"Tekkali Sub-Division","station_code":"JLM"},{"id":22,"username":"polaki","display_name":"Polaki PS","role":"station","ps_name":"Polaki","circle":"Narasannapeta Circle","sub_division":"Tekkali Sub-Division","station_code":"PLK"},{"id":23,"username":"saravakota","display_name":"Saravakota PS","role":"station","ps_name":"Saravakota","circle":"Narasannapeta Circle","sub_division":"Tekkali Sub-Division","station_code":"SVK"},{"id":24,"username":"kothuru","display_name":"Kothuru PS","role":"station","ps_name":"Kothuru","circle":"Kothuru Circle","sub_division":"Tekkali Sub-Division","station_code":"KTR"},{"id":25,"username":"hiramandalam","display_name":"Hiramandalam PS","role":"station","ps_name":"Hiramandalam","circle":"Kothuru Circle","sub_division":"Tekkali Sub-Division","station_code":"HRM"},{"id":26,"username":"pathapatnam","display_name":"Pathapatnam PS","role":"station","ps_name":"Pathapatnam","circle":"Pathapatnam Circle","sub_division":"Tekkali Sub-Division","station_code":"PPT"},{"id":27,"username":"meliaputti","display_name":"Meliaputti PS","role":"station","ps_name":"Meliaputti","circle":"Pathapatnam Circle","sub_division":"Tekkali Sub-Division","station_code":"MPT"},{"id":28,"username":"kasibugga","display_name":"Kasibugga PS","role":"station","ps_name":"Kasibugga","circle":"Kasibugga Circle","sub_division":"Kasibugga Sub-Division","station_code":"KBG"},{"id":29,"username":"vajrapukothuru","display_name":"Vajrapukothuru PS","role":"station","ps_name":"Vajrapukothuru","circle":"Kasibugga Rural Circle","sub_division":"Kasibugga Sub-Division","station_code":"VPK"},{"id":30,"username":"mandasa","display_name":"Mandasa PS","role":"station","ps_name":"Mandasa","circle":"Kasibugga Rural Circle","sub_division":"Kasibugga Sub-Division","station_code":"MDS"},{"id":31,"username":"sompeta","display_name":"Sompeta PS","role":"station","ps_name":"Sompeta","circle":"Sompeta Circle","sub_division":"Kasibugga Sub-Division","station_code":"SMP"},{"id":32,"username":"baruva","display_name":"Baruva PS","role":"station","ps_name":"Baruva","circle":"Sompeta Circle","sub_division":"Kasibugga Sub-Division","station_code":"BRV"},{"id":33,"username":"kanchili","display_name":"Kanchili PS","role":"station","ps_name":"Kanchili","circle":"Sompeta Circle","sub_division":"Kasibugga Sub-Division","station_code":"KNC"},{"id":34,"username":"itchapuramtown","display_name":"Itchapuram Town PS","role":"station","ps_name":"Itchapuram Town","circle":"Itchapuram Circle","sub_division":"Kasibugga Sub-Division","station_code":"ICP_T"},{"id":35,"username":"itchapuramrural","display_name":"Itchapuram Rural PS","role":"station","ps_name":"Itchapuram Rural","circle":"Itchapuram Circle","sub_division":"Kasibugga Sub-Division","station_code":"ICP_R"},{"id":36,"username":"kaviti","display_name":"Kaviti PS","role":"station","ps_name":"Kaviti","circle":"Itchapuram Circle","sub_division":"Kasibugga Sub-Division","station_code":"KVT"},{"id":37,"username":"mahilapssrikakulam","display_name":"Mahila PS, Srikakulam PS","role":"station","ps_name":"Mahila PS, Srikakulam","circle":"Mahila PS Circle","sub_division":"Srikakulam Sub-Division","station_code":"MHL_PS"},{"id":38,"username":"srikakulamtraffic","display_name":"Srikakulam Traffic PS","role":"station","ps_name":"Srikakulam Traffic","circle":"Traffic Circle","sub_division":"Srikakulam Sub-Division","station_code":"TRF_PS"}];
const EMBEDDED_STATIONS = [{"id":1,"station_code":"SKL_1T","name":"Srikakulam I Town","circle":"Srikakulam Rural Circle","sub_division":"Srikakulam Sub-Division","sl_no":1,"in_charge_name":null,"contact_number":null},{"id":2,"station_code":"SKL_RUR","name":"Srikakulam Rural","circle":"Srikakulam Rural Circle","sub_division":"Srikakulam Sub-Division","sl_no":2,"in_charge_name":null,"contact_number":null},{"id":3,"station_code":"GARA","name":"Gara","circle":"Srikakulam Rural Circle","sub_division":"Srikakulam Sub-Division","sl_no":3,"in_charge_name":null,"contact_number":null},{"id":4,"station_code":"SKL_2T","name":"Srikakulam II Town","circle":"Srikakulam II Town Circle","sub_division":"Srikakulam Sub-Division","sl_no":4,"in_charge_name":null,"contact_number":null},{"id":5,"station_code":"ADV","name":"Amadalavalasa","circle":"Amadalavalasa Circle","sub_division":"Srikakulam Sub-Division","sl_no":5,"in_charge_name":null,"contact_number":null},{"id":6,"station_code":"SBJ","name":"Sarubujjili","circle":"Amadalavalasa Circle","sub_division":"Srikakulam Sub-Division","sl_no":6,"in_charge_name":null,"contact_number":null},{"id":7,"station_code":"BRJ","name":"Burja","circle":"Amadalavalasa Circle","sub_division":"Srikakulam Sub-Division","sl_no":7,"in_charge_name":null,"contact_number":null},{"id":8,"station_code":"PDR","name":"Ponduru","circle":"Amadalavalasa Circle","sub_division":"Srikakulam Sub-Division","sl_no":8,"in_charge_name":null,"contact_number":null},{"id":9,"station_code":"JRP","name":"J.R.Puram","circle":"J.R.Puram Circle","sub_division":"Srikakulam Sub-Division","sl_no":9,"in_charge_name":null,"contact_number":null},{"id":10,"station_code":"ETC","name":"Etcherla","circle":"J.R.Puram Circle","sub_division":"Srikakulam Sub-Division","sl_no":10,"in_charge_name":null,"contact_number":null},{"id":11,"station_code":"LVR","name":"Laveru","circle":"J.R.Puram Circle","sub_division":"Srikakulam Sub-Division","sl_no":11,"in_charge_name":null,"contact_number":null},{"id":12,"station_code":"GSG","name":"G. Sigadam","circle":"J.R.Puram Circle","sub_division":"Srikakulam Sub-Division","sl_no":12,"in_charge_name":null,"contact_number":null},{"id":13,"station_code":"TKL","name":"Tekkali PS","circle":"Tekkali PS Circle","sub_division":"Tekkali Sub-Division","sl_no":13,"in_charge_name":null,"contact_number":null},{"id":14,"station_code":"KBM","name":"Kotabommali","circle":"Tekkali Rural Circle","sub_division":"Tekkali Sub-Division","sl_no":14,"in_charge_name":null,"contact_number":null},{"id":15,"station_code":"SBM","name":"Santhabommali","circle":"Tekkali Rural Circle","sub_division":"Tekkali Sub-Division","sl_no":15,"in_charge_name":null,"contact_number":null},{"id":16,"station_code":"NPD","name":"Naupada","circle":"Tekkali Rural Circle","sub_division":"Tekkali Sub-Division","sl_no":16,"in_charge_name":null,"contact_number":null},{"id":17,"station_code":"NDG","name":"Nandigam","circle":"Tekkali Rural Circle","sub_division":"Tekkali Sub-Division","sl_no":17,"in_charge_name":null,"contact_number":null},{"id":18,"station_code":"NSP","name":"Narasannapeta","circle":"Narasannapeta Circle","sub_division":"Tekkali Sub-Division","sl_no":18,"in_charge_name":null,"contact_number":null},{"id":19,"station_code":"JLM","name":"Jalumuru","circle":"Narasannapeta Circle","sub_division":"Tekkali Sub-Division","sl_no":19,"in_charge_name":null,"contact_number":null},{"id":20,"station_code":"PLK","name":"Polaki","circle":"Narasannapeta Circle","sub_division":"Tekkali Sub-Division","sl_no":20,"in_charge_name":null,"contact_number":null},{"id":21,"station_code":"SVK","name":"Saravakota","circle":"Narasannapeta Circle","sub_division":"Tekkali Sub-Division","sl_no":21,"in_charge_name":null,"contact_number":null},{"id":22,"station_code":"KTR","name":"Kothuru","circle":"Kothuru Circle","sub_division":"Tekkali Sub-Division","sl_no":22,"in_charge_name":null,"contact_number":null},{"id":23,"station_code":"HRM","name":"Hiramandalam","circle":"Kothuru Circle","sub_division":"Tekkali Sub-Division","sl_no":23,"in_charge_name":null,"contact_number":null},{"id":24,"station_code":"PPT","name":"Pathapatnam","circle":"Pathapatnam Circle","sub_division":"Tekkali Sub-Division","sl_no":24,"in_charge_name":null,"contact_number":null},{"id":25,"station_code":"MPT","name":"Meliaputti","circle":"Pathapatnam Circle","sub_division":"Tekkali Sub-Division","sl_no":25,"in_charge_name":null,"contact_number":null},{"id":26,"station_code":"KBG","name":"Kasibugga","circle":"Kasibugga Circle","sub_division":"Kasibugga Sub-Division","sl_no":26,"in_charge_name":null,"contact_number":null},{"id":27,"station_code":"VPK","name":"Vajrapukothuru","circle":"Kasibugga Rural Circle","sub_division":"Kasibugga Sub-Division","sl_no":27,"in_charge_name":null,"contact_number":null},{"id":28,"station_code":"MDS","name":"Mandasa","circle":"Kasibugga Rural Circle","sub_division":"Kasibugga Sub-Division","sl_no":28,"in_charge_name":null,"contact_number":null},{"id":29,"station_code":"SMP","name":"Sompeta","circle":"Sompeta Circle","sub_division":"Kasibugga Sub-Division","sl_no":29,"in_charge_name":null,"contact_number":null},{"id":30,"station_code":"BRV","name":"Baruva","circle":"Sompeta Circle","sub_division":"Kasibugga Sub-Division","sl_no":30,"in_charge_name":null,"contact_number":null},{"id":31,"station_code":"KNC","name":"Kanchili","circle":"Sompeta Circle","sub_division":"Kasibugga Sub-Division","sl_no":31,"in_charge_name":null,"contact_number":null},{"id":32,"station_code":"ICP_T","name":"Itchapuram Town","circle":"Itchapuram Circle","sub_division":"Kasibugga Sub-Division","sl_no":32,"in_charge_name":null,"contact_number":null},{"id":33,"station_code":"ICP_R","name":"Itchapuram Rural","circle":"Itchapuram Circle","sub_division":"Kasibugga Sub-Division","sl_no":33,"in_charge_name":null,"contact_number":null},{"id":34,"station_code":"KVT","name":"Kaviti","circle":"Itchapuram Circle","sub_division":"Kasibugga Sub-Division","sl_no":34,"in_charge_name":null,"contact_number":null},{"id":35,"station_code":"MHL_PS","name":"Mahila PS, Srikakulam","circle":"Mahila PS Circle","sub_division":"Srikakulam Sub-Division","sl_no":35,"in_charge_name":null,"contact_number":null},{"id":36,"station_code":"TRF_PS","name":"Srikakulam Traffic","circle":"Traffic Circle","sub_division":"Srikakulam Sub-Division","sl_no":36,"in_charge_name":null,"contact_number":null}];

// Static / GitHub Pages Mode State
const IS_STATIC_HOST = window.location.hostname.includes("github.io") || window.location.protocol === "file:" || !window.location.port;
let staticDataLoaded = false;
let staticPetitions = [];
let staticStations = [...EMBEDDED_STATIONS];
let staticUsers = [...EMBEDDED_USERS];

function getDataBasePath() {
  let path = window.location.pathname || "/";
  if (path.endsWith(".html") || path.endsWith(".htm")) {
    path = path.substring(0, path.lastIndexOf("/"));
  }
  if (!path.endsWith("/")) {
    path += "/";
  }
  return window.location.origin + path + "data/";
}

const NCRP_APP_VERSION = '3.8';

// Clear obsolete or corrupted localStorage caches on app version upgrade
try {
  if (localStorage.getItem('ncrp_app_version') !== NCRP_APP_VERSION) {
    localStorage.removeItem('ncrp_local_added');
    localStorage.removeItem('ncrp_local_edits');
    localStorage.setItem('ncrp_app_version', NCRP_APP_VERSION);
    console.log('[NCRP] Upgraded to version ' + NCRP_APP_VERSION + ' - local cache refreshed.');
  }
} catch (e) {}

async function ensureStaticData(forceRefresh = false) {
  if (staticDataLoaded && !forceRefresh) return;
  try {
    const base = getDataBasePath();
    const cacheKey = '?v=' + NCRP_APP_VERSION + '&t=' + Date.now();
    const [pRes, sRes, uRes] = await Promise.all([
      fetch(base + "petitions.json" + cacheKey).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); }).catch(() => fetch("./data/petitions.json" + cacheKey).then(r => r.json())),
      fetch(base + "stations.json" + cacheKey).then(r => r.json()).catch(() => EMBEDDED_STATIONS),
      fetch(base + "users.json" + cacheKey).then(r => r.json()).catch(() => EMBEDDED_USERS)
    ]);
    staticPetitions = pRes || [];
    staticStations = sRes || EMBEDDED_STATIONS;
    staticUsers = uRes || EMBEDDED_USERS;

    // Apply any saved local edits from browser localStorage
    const savedEdits = JSON.parse(localStorage.getItem("ncrp_local_edits") || "{}");
    delete savedEdits[1886];
    delete savedEdits['1886'];
    delete savedEdits['20210260054770'];
    localStorage.setItem("ncrp_local_edits", JSON.stringify(savedEdits));

    staticPetitions.forEach(p => {
      if (savedEdits[p.id]) {
        Object.assign(p, savedEdits[p.id]);
      }
    });

    // Deduplicate addedPetitions against fetched staticPetitions by ack_no or id
    const addedPetitions = JSON.parse(localStorage.getItem("ncrp_local_added") || "[]");
    const existingAckNos = new Set(staticPetitions.map(p => String(p.ack_no || p.sl_no).trim()));
    const validAdded = addedPetitions.filter(p => !existingAckNos.has(String(p.ack_no || p.sl_no).trim()));
    if (validAdded.length !== addedPetitions.length) {
      localStorage.setItem("ncrp_local_added", JSON.stringify(validAdded));
    }
    staticPetitions = [...validAdded, ...staticPetitions];

    staticDataLoaded = true;
  } catch (err) {
    console.warn("Static data fetch note:", err);
    // Even if petitions fetch fails, users and stations are already loaded!
    staticDataLoaded = true;
  }
}

window.forceRefreshDistrictData = async function() {
  try {
    localStorage.removeItem('ncrp_local_added');
    localStorage.removeItem('ncrp_local_edits');
    staticDataLoaded = false;
    showToast('Refreshing district data from server... / డేటా రీఫ్రెష్ అవుతోంది...', 'info');
    await ensureStaticData(true);
    await loadDashboard();
    await loadPetitions(1);
    showToast('Successfully refreshed! Total ' + (staticPetitions.length) + ' petitions loaded.', 'success');
  } catch (e) {
    showToast('Refresh error: ' + e.message, 'error');
  }
};

// Client-side router for GitHub Pages
async function handleStaticApi(url, options = {}) {
  const parsed = new URL(url, 'http://localhost');
  const pathname = parsed.pathname;
  const searchParams = parsed.searchParams;
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : {};

  // 1. Login (instant check using embedded users list without network wait)
  if (pathname === '/api/auth/login' && method === 'POST') {
    let username = (body.username || '').trim().toLowerCase();
    const password = (body.password || '').trim();

    const aliases = {
      'srikakulamitown': 'srikakulam1town',
      'srikakulamiitown': 'srikakulam2town',
      'tekkali': 'tekkalips',
      'itchapuram': 'itchapuramtown',
      'mahilaps': 'mahilapssrikakulam',
      'traffic': 'srikakulamtraffic'
    };
    if (aliases[username]) username = aliases[username];

    const usersList = (staticUsers && staticUsers.length > 0) ? staticUsers : EMBEDDED_USERS;
    const user = usersList.find(u => u.username.toLowerCase() === username);
    if (!user) {
      throw new Error('Invalid User ID / తప్పు యూజర్ ఐడీ');
    }

    // Password verification with trim
    let validPass = false;
    if (user.role === 'admin' || username === 'admin') {
      validPass = (password === 'Admin@SklmNCRP2026!' || password === 'Cyber@Sklm2026!');
    } else {
      validPass = (password === `${username}@skl26` || password === 'Sklm@PS2026!');
    }

    if (!validPass && password.length >= 6) {
      const savedPass = localStorage.getItem(`pass_${username}`);
      if (savedPass && savedPass === password) validPass = true;
    }

    if (!validPass) {
      throw new Error('Invalid Password / తప్పు పాస్‌వర్డ్');
    }

    const token = 'gh_token_' + Date.now();
    const sessionUser = {
      username: user.username,
      displayName: user.display_name,
      role: user.role,
      psName: user.ps_name,
      circle: user.circle,
      subDivision: user.sub_division,
      stationCode: user.station_code
    };
    localStorage.setItem('ncrp_session_user', JSON.stringify(sessionUser));

    // Prefetch petitions in background if needed
    ensureStaticData().catch(() => {});

    return {
      success: true,
      token,
      user: sessionUser
    };
  }

  // All other endpoints require static petitions & stations data
  await ensureStaticData();

  // 2. Me
  if (pathname === '/api/auth/me') {
    const saved = localStorage.getItem('ncrp_session_user');
    if (!saved) throw new Error('Not authenticated');
    return { user: JSON.parse(saved) };
  }

  // 3. Logout
  if (pathname === '/api/auth/logout') {
    localStorage.removeItem('ncrp_session_user');
    return { success: true };
  }

  // 4. Stations
  if (pathname === '/api/stations') {
    const stationsWithCounts = staticStations.map(st => {
      const psPets = staticPetitions.filter(p => p.ps_name === st.name);
      return {
        ...st,
        petition_count: psPets.length,
        fir_count: psPets.filter(p => p.status === 'FIR Registered').length,
        closed_count: psPets.filter(p => p.status === 'Closed').length,
        under_process_count: psPets.filter(p => p.status === 'Under Process').length,
        total_lost: psPets.reduce((acc, p) => acc + (p.lost_amount || 0), 0),
        total_hold: psPets.reduce((acc, p) => acc + (p.hold_amount || 0), 0)
      };
    });
    return { stations: stationsWithCounts };
  }

  // 5. KPI
  if (pathname === '/api/reports/kpi') {
    const savedUser = JSON.parse(localStorage.getItem('ncrp_session_user') || '{}');
    let pets = staticPetitions;
    if (savedUser.role === 'station') {
      pets = pets.filter(p => p.ps_name === savedUser.psName);
    }

    return {
      stats: {
        total_petitions: pets.length,
        total_lost: pets.reduce((acc, p) => acc + (p.lost_amount || 0), 0),
        total_hold: pets.reduce((acc, p) => acc + (p.hold_amount || 0), 0),
        total_refund: pets.reduce((acc, p) => acc + (p.refund_amount || 0), 0),
        fir_count: pets.filter(p => p.status === 'FIR Registered').length,
        closed_count: pets.filter(p => p.status === 'Closed').length,
        under_process_count: pets.filter(p => p.status === 'Under Process').length,
        withdrawal_count: pets.filter(p => p.status === 'Withdrawal').length,
        rejected_count: pets.filter(p => p.status === 'Rejected').length,
        hold_cases_count: pets.filter(p => p.hold_amount > 0).length
      }
    };
  }

  // 6. Petitions List
  if (pathname === '/api/petitions' && method === 'GET') {
    const savedUser = JSON.parse(localStorage.getItem('ncrp_session_user') || '{}');
    let pets = [...staticPetitions];

    let psName = searchParams.get('ps_name') || '';
    if (savedUser.role === 'station') {
      psName = savedUser.psName;
    }
    if (psName) {
      pets = pets.filter(p => p.ps_name === psName);
    }

    const status = searchParams.get('status');
    if (status) pets = pets.filter(p => p.status === status);

    const mo = searchParams.get('mo');
    if (mo) pets = pets.filter(p => p.mo === mo);

    const portalType = searchParams.get('portal_type');
    if (portalType) pets = pets.filter(p => p.portal_type === portalType);

    const search = (searchParams.get('search') || '').toLowerCase().trim();
    if (search) {
      pets = pets.filter(p =>
        (p.ack_no && p.ack_no.toLowerCase().includes(search)) ||
        (p.complainant_name && p.complainant_name.toLowerCase().includes(search)) ||
        (p.complainant_phone && p.complainant_phone.includes(search)) ||
        (p.fir_number && p.fir_number.toLowerCase().includes(search)) ||
        (p.action_taken && p.action_taken.toLowerCase().includes(search))
      );
    }

    const total = pets.length;
    const totalLost = pets.reduce((acc, p) => acc + (p.lost_amount || 0), 0);
    const totalHold = pets.reduce((acc, p) => acc + (p.hold_amount || 0), 0);

    const sortBy = searchParams.get('sort_by') || 'sl_no';
    const sortOrder = (searchParams.get('sort_order') || 'asc').toLowerCase();

    pets.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (sortBy === 'lost_amount' || sortBy === 'hold_amount' || sortBy === 'sl_no' || sortBy === 'id') {
        const numA = parseFloat(valA) || 0;
        const numB = parseFloat(valB) || 0;
        return sortOrder === 'desc' ? numB - numA : numA - numB;
      }
      if (sortBy === 'petition_date') {
        const parseD = (d) => {
          if (!d) return 0;
          const parts = String(d).split(/[-/]/);
          if (parts.length === 3) {
            if (parts[0].length === 4) return new Date(parts[0], parts[1]-1, parts[2]).getTime();
            return new Date(parts[2], parts[1]-1, parts[0]).getTime();
          }
          return new Date(d).getTime() || 0;
        };
        const tA = parseD(valA);
        const tB = parseD(valB);
        return sortOrder === 'desc' ? tB - tA : tA - tB;
      }
      return sortOrder === 'desc' ? String(valB).localeCompare(String(valA)) : String(valA).localeCompare(String(valB));
    });

    const page = Math.max(1, parseInt(searchParams.get('page')) || 1);
    const limit = Math.min(1000, parseInt(searchParams.get('limit')) || 25);
    const offset = (page - 1) * limit;

    const sliced = pets.slice(offset, offset + limit);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      totalLost,
      totalHold,
      petitions: sliced
    };
  }

  // 7. Single Petition
  if (pathname.match(/^\/api\/petitions\/(\d+)$/) && method === 'GET') {
    const id = parseInt(pathname.split('/')[3]);
    const petition = staticPetitions.find(p => p.id === id);
    if (!petition) throw new Error('Petition not found');
    return { petition };
  }

  // 8. Update Petition (Static / GitHub Pages - All 24 Columns)
  if (pathname.match(/^\/api\/petitions\/(\d+)$/) && method === 'PUT') {
    const id = parseInt(pathname.split('/')[3]);
    const pet = staticPetitions.find(p => p.id === id);
    if (!pet) throw new Error('Petition not found');

    const lostAmount = body.lost_amount !== undefined ? parseFloat(body.lost_amount) || 0 : (pet.lost_amount || 0);
    const holdAmount = body.hold_amount !== undefined ? parseFloat(body.hold_amount) || 0 : (pet.hold_amount || 0);
    const refundAmount = body.refund_amount !== undefined ? parseFloat(body.refund_amount) || 0 : (pet.refund_amount || 0);

    const lossBucket = lostAmount >= 10000000 ? 'ABOVE 1 CR' : (lostAmount >= 5000000 ? '50L TO 1CR' : (lostAmount >= 2500000 ? '25L TO 50L' : (lostAmount >= 1000000 ? '10L TO 25L' : 'BELOW 10L')));
    const holdBucket = holdAmount > 0 ? (holdAmount >= 100000 ? 'Above 1L' : (holdAmount >= 50000 ? '50K to 1L' : (holdAmount >= 10000 ? '10K to 50K' : 'Below 10K'))) : 'No Hold';

    Object.assign(pet, {
      sl_no: body.sl_no !== undefined ? parseInt(body.sl_no) || pet.sl_no : pet.sl_no,
      petition_date: body.petition_date !== undefined ? body.petition_date : pet.petition_date,
      portal_type: body.portal_type !== undefined ? body.portal_type : pet.portal_type,
      ack_no: body.ack_no !== undefined ? String(body.ack_no).trim() : pet.ack_no,
      ps_name: body.ps_name !== undefined ? body.ps_name : pet.ps_name,
      circle_name: body.circle_name !== undefined ? body.circle_name : pet.circle_name,
      sub_division: body.sub_division !== undefined ? body.sub_division : pet.sub_division,
      complainant_name: body.complainant_name !== undefined ? body.complainant_name : pet.complainant_name,
      complainant_phone: body.complainant_phone !== undefined ? body.complainant_phone : pet.complainant_phone,
      victim_age: body.victim_age !== undefined ? String(body.victim_age) : pet.victim_age,
      complainant_address: body.complainant_address !== undefined ? body.complainant_address : pet.complainant_address,
      category: body.category !== undefined ? body.category : pet.category,
      sub_category: body.sub_category !== undefined ? body.sub_category : pet.sub_category,
      lost_amount: lostAmount,
      hold_amount: holdAmount,
      refund_amount: refundAmount,
      status: body.status !== undefined ? body.status : pet.status,
      mo: body.mo !== undefined ? body.mo : pet.mo,
      action_taken: body.action_taken !== undefined ? body.action_taken : pet.action_taken,
      date_of_action: body.date_of_action !== undefined ? body.date_of_action : pet.date_of_action,
      fir_number: body.fir_number !== undefined ? body.fir_number : pet.fir_number,
      court_memo_filed: body.court_memo_filed !== undefined ? body.court_memo_filed : pet.court_memo_filed,
      court_order_obtained: body.court_order_obtained !== undefined ? body.court_order_obtained : pet.court_order_obtained,
      remarks: body.remarks !== undefined ? body.remarks : pet.remarks,
      loss_bucket: lossBucket,
      hold_bucket: holdBucket,
      updated_at: new Date().toISOString()
    });

    // Save in localStorage so edits persist across sessions on GitHub Pages
    const savedEdits = JSON.parse(localStorage.getItem('ncrp_local_edits') || '{}');
    savedEdits[id] = pet;
    localStorage.setItem('ncrp_local_edits', JSON.stringify(savedEdits));

    return { success: true, petition: pet, message: 'All 24 columns updated successfully / పిటిషన్ వివరాలు అన్నీ విజయవంతంగా అప్‌డేట్ చేయబడ్డాయి' };
  }

  // 8B. Create Single Petition (Static / GitHub Pages with Zero-Duplicate Guard)
  if (pathname === '/api/petitions' && method === 'POST') {
    const rawAck = (body.ack_no || '').toString().trim();
    if (!rawAck) throw new Error('Acknowledgement Number is required');
    const cleanAck = rawAck.toLowerCase();

    // Zero-Duplicate Check against all existing petitions
    const existing = staticPetitions.find(p => (p.ack_no || '').toString().trim().toLowerCase() === cleanAck);
    if (existing) {
      throw new Error(`Duplicate Petition! Ack No [${rawAck}] already registered in ${existing.ps_name} on ${existing.petition_date || 'N/A'}. డూప్లికేట్ ఎంట్రీ అనుమతించబడదు.`);
    }

    const station = staticStations.find(s => s.name === body.ps_name);
    const circle = station ? station.circle : '';
    const subDivision = station ? station.sub_division : '';

    const newId = (staticPetitions.reduce((max, p) => Math.max(max, p.id || 0), 0)) + 1;
    const newSl = (staticPetitions.reduce((max, p) => Math.max(max, p.sl_no || 0), 0)) + 1;

    const newPet = {
      id: newId,
      sl_no: newSl,
      petition_date: body.petition_date || new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
      ps_name: body.ps_name || 'Cyber Crime PS, Srikakulam',
      circle_name: circle,
      sub_division: subDivision,
      portal_type: body.portal_type || 'NCRP',
      ack_no: rawAck,
      complainant_name: body.complainant_name || '',
      complainant_phone: body.complainant_phone || '',
      victim_age: (body.victim_age || '').toString(),
      complainant_address: body.complainant_address || '',
      category: body.category || 'Online Financial Fraud',
      sub_category: body.sub_category || 'UPI Related Frauds',
      lost_amount: parseFloat(body.lost_amount) || 0,
      hold_amount: parseFloat(body.hold_amount) || 0,
      refund_amount: parseFloat(body.refund_amount) || 0,
      status: body.status || 'Under Process',
      mo: body.mo || 'Other',
      action_taken: body.action_taken || '',
      date_of_action: body.date_of_action || '',
      fir_number: body.fir_number || '',
      court_memo_filed: body.court_memo_filed || 'No',
      court_order_obtained: body.court_order_obtained || 'No',
      remarks: body.remarks || '',
      no_of_days: 0,
      timeline_status: 'Below 1 Week',
      loss_bucket: 'BELOW 10L',
      hold_bucket: (parseFloat(body.hold_amount) || 0) > 0 ? 'Hold Available' : 'No Hold',
      created_at: new Date().toISOString()
    };

    staticPetitions.unshift(newPet);

    // Save in localStorage
    const added = JSON.parse(localStorage.getItem('ncrp_local_added') || '[]');
    added.unshift(newPet);
    localStorage.setItem('ncrp_local_added', JSON.stringify(added));

    return { success: true, petition: newPet, message: 'New petition registered successfully / కొత్త పిటిషన్ విజయవంతంగా నమోదైంది' };
  }

  // 8C. Bulk Import Petitions (Static / GitHub Pages with Zero-Duplicate Guard)
  if (pathname === '/api/petitions/bulk' && method === 'POST') {
    const list = body.petitions || [];
    if (!Array.isArray(list) || list.length === 0) {
      throw new Error('No petitions provided for import');
    }

    const existingAcks = new Set(
      staticPetitions.map(p => (p.ack_no || '').toString().trim().toLowerCase())
    );

    let maxId = staticPetitions.reduce((max, p) => Math.max(max, p.id || 0), 0);
    let maxSl = staticPetitions.reduce((max, p) => Math.max(max, p.sl_no || 0), 0);

    const newlyAdded = [];
    let skippedDuplicates = 0;

    for (const item of list) {
      const rawAck = (item.ack_no || '').toString().trim();
      const cleanAck = rawAck.toLowerCase();
      if (!cleanAck || existingAcks.has(cleanAck)) {
        skippedDuplicates++;
        continue;
      }

      existingAcks.add(cleanAck);
      maxId++;
      maxSl++;

      const station = staticStations.find(s => s.name === item.ps_name);
      const circle = station ? station.circle : (item.circle_name || '');
      const subDivision = station ? station.sub_division : (item.sub_division || '');

      const pet = {
        id: maxId,
        sl_no: maxSl,
        petition_date: item.petition_date || new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
        ps_name: item.ps_name || 'Cyber Crime PS, Srikakulam',
        circle_name: circle,
        sub_division: subDivision,
        portal_type: item.portal_type || 'NCRP',
        ack_no: rawAck,
        complainant_name: item.complainant_name || '',
        complainant_phone: item.complainant_phone || '',
        victim_age: (item.victim_age || '').toString(),
        complainant_address: item.complainant_address || '',
        category: item.category || 'Online Financial Fraud',
        sub_category: item.sub_category || 'UPI Related Frauds',
        lost_amount: parseFloat(item.lost_amount) || 0,
        hold_amount: parseFloat(item.hold_amount) || 0,
        refund_amount: parseFloat(item.refund_amount) || 0,
        status: item.status || 'Under Process',
        mo: item.mo || 'Other',
        action_taken: item.action_taken || '',
        date_of_action: item.date_of_action || '',
        fir_number: item.fir_number || '',
        court_memo_filed: item.court_memo_filed || 'No',
        court_order_obtained: item.court_order_obtained || 'No',
        remarks: item.remarks || '',
        no_of_days: 0,
        timeline_status: 'Below 1 Week',
        loss_bucket: 'BELOW 10L',
        hold_bucket: (parseFloat(item.hold_amount) || 0) > 0 ? 'Hold Available' : 'No Hold',
        created_at: new Date().toISOString()
      };

      newlyAdded.push(pet);
    }

    if (newlyAdded.length > 0) {
      staticPetitions = [...newlyAdded, ...staticPetitions];
      const added = JSON.parse(localStorage.getItem('ncrp_local_added') || '[]');
      localStorage.setItem('ncrp_local_added', JSON.stringify([...newlyAdded, ...added]));
    }

    return {
      success: true,
      insertedCount: newlyAdded.length,
      skippedDuplicates,
      message: `Successfully imported ${newlyAdded.length} new petitions! ${skippedDuplicates} duplicate petitions skipped.`
    };
  }

  // 9. Abstract Report
  if (pathname === '/api/reports/abstract') {
    const rows = staticStations.map(st => {
      const psPets = staticPetitions.filter(p => p.ps_name === st.name);
      return {
        sl_no: st.sl_no,
        ps_name: st.name,
        circle: st.circle,
        sub_division: st.sub_division,
        total_cases: psPets.length,
        fir_count: psPets.filter(p => p.status === 'FIR Registered').length,
        nc_count: psPets.filter(p => p.status === 'NC Registered').length,
        closed_count: psPets.filter(p => p.status === 'Closed').length,
        no_action_count: psPets.filter(p => p.status === 'No Action').length,
        withdrawal_count: psPets.filter(p => p.status === 'Withdrawal').length,
        under_process_count: psPets.filter(p => p.status === 'Under Process').length,
        rejected_count: psPets.filter(p => p.status === 'Rejected').length,
        total_lost: psPets.reduce((acc, p) => acc + (p.lost_amount || 0), 0),
        total_hold: psPets.reduce((acc, p) => acc + (p.hold_amount || 0), 0)
      };
    });
    return { rows };
  }

  // 10. Hold Refund Report
  if (pathname === '/api/reports/hold-refund') {
    const rows = staticStations.map(st => {
      const psPets = staticPetitions.filter(p => p.ps_name === st.name);
      return {
        sl_no: st.sl_no,
        ps_name: st.name,
        circle: st.circle,
        sub_division: st.sub_division,
        total_cases: psPets.length,
        total_lost: psPets.reduce((acc, p) => acc + (p.lost_amount || 0), 0),
        hold_cases_count: psPets.filter(p => p.hold_amount > 0).length,
        total_hold: psPets.reduce((acc, p) => acc + (p.hold_amount || 0), 0),
        refund_cases_count: psPets.filter(p => p.refund_amount > 0).length,
        total_refund: psPets.reduce((acc, p) => acc + (p.refund_amount || 0), 0)
      };
    });
    return { rows };
  }

  // 11. MO Wise Report
  if (pathname === '/api/reports/mo-wise') {
    const moMap = {};
    staticPetitions.forEach(p => {
      const m = p.mo || 'Other';
      if (!moMap[m]) moMap[m] = { mo: m, count: 0, total_lost: 0, total_hold: 0, fir_count: 0, closed_count: 0, under_process_count: 0 };
      moMap[m].count++;
      moMap[m].total_lost += (p.lost_amount || 0);
      moMap[m].total_hold += (p.hold_amount || 0);
      if (p.status === 'FIR Registered') moMap[m].fir_count++;
      if (p.status === 'Closed') moMap[m].closed_count++;
      if (p.status === 'Under Process') moMap[m].under_process_count++;
    });
    const rows = Object.values(moMap).sort((a, b) => b.count - a.count);
    return { rows };
  }

  // 12. Admin users
  if (pathname === '/api/admin/users') {
    return { users: staticUsers };
  }

  // Fallback
  return { success: true };
}

// API Fetch Helper with Hybrid Static / Server Support
async function apiFetch(url, options = {}) {
  // If running on GitHub Pages or file: protocol, route directly to static engine
  if (IS_STATIC_HOST) {
    return handleStaticApi(url, options);
  }

  try {
    const headers = options.headers || {};
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }
    options.headers = headers;

    const res = await fetch(url, options);
    if (res.status === 401) {
      logout();
      throw new Error('Session expired, please login again');
    }
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Server request failed');
    }
    return data;
  } catch (err) {
    // If backend is unreachable, gracefully fall back to static engine!
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      console.warn('Backend server unreachable, falling back to client-side data engine...');
      return handleStaticApi(url, options);
    }
    throw err;
  }
}

// App Initialization
async function initApp() {
  if (currentToken) {
    try {
      const data = await apiFetch('/api/auth/me');
      currentUser = data.user;
      renderAuthenticatedUI();
    } catch (e) {
      console.warn('Authentication check failed:', e);
      showLoginScreen();
    }
  } else {
    showLoginScreen();
  }
}

function showLoginScreen() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('appScreen').style.display = 'none';
}

function renderAuthenticatedUI() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appScreen').style.display = 'block';

  document.getElementById('userDisplayName').textContent = currentUser.displayName;
  document.getElementById('userCircleLabel').textContent = currentUser.circle ? `(${currentUser.circle})` : '';

  if (currentUser.role === 'admin') {
    document.getElementById('adminUsersTabBtn').style.display = 'inline-flex';
    document.getElementById('psFilterWrapper').style.display = 'block';
  } else {
    document.getElementById('adminUsersTabBtn').style.display = 'none';
    document.getElementById('psFilterWrapper').style.display = 'none';
  }

  loadStations();
  loadKPISummary();
  loadPetitions(1);
  renderMOGuide();
}

// Setup Event Listeners
function setupEventListeners() {
  // Login Form
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');
    const errBox = document.getElementById('loginErrorBox');
    if (errBox) errBox.style.display = 'none';

    btn.disabled = true;
    btn.textContent = 'Verifying credentials... / ధృవీకరిస్తోంది...';

    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      currentToken = data.token;
      localStorage.setItem('ncrp_token', currentToken);
      currentUser = data.user;
      showToast(`Welcome ${currentUser.displayName}!`, 'success');
      renderAuthenticatedUI();
    } catch (err) {
      if (errBox) {
        errBox.textContent = '⚠️ ' + (err.message || 'Login failed. Please check credentials.');
        errBox.style.display = 'block';
      }
      showToast(err.message || 'Login failed', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Secure Station Login / లాగిన్ అవ్వండి';
    }
  });

  // Search input debounce
  let searchTimer;
  document.getElementById('searchInput').addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      loadPetitions(1);
    }, 400);
  });

  // Edit Petition Form (All 24 Columns)
  document.getElementById('editPetitionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editPetitionId').value;
    const saveBtn = document.getElementById('savePetitionBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving Changes... / సేవ్ అవుతోంది...';

    const payload = {
      sl_no: document.getElementById('editSlNo').value,
      ack_no: document.getElementById('editAckNo').value,
      petition_date: document.getElementById('editDate').value,
      portal_type: document.getElementById('editPortalType').value,
      ps_name: document.getElementById('editPSName').value,
      circle_name: document.getElementById('editCircleName').value,
      sub_division: document.getElementById('editSubDivision').value,
      complainant_name: document.getElementById('editComplainantName').value,
      complainant_phone: document.getElementById('editComplainantPhone').value,
      victim_age: document.getElementById('editVictimAge').value,
      complainant_address: document.getElementById('editAddress').value,
      category: document.getElementById('editCategory').value,
      sub_category: document.getElementById('editSubCategory').value,
      mo: document.getElementById('editMO').value,
      lost_amount: document.getElementById('editLostAmount').value,
      hold_amount: document.getElementById('editHoldAmount').value,
      refund_amount: document.getElementById('editRefundAmount').value,
      status: document.getElementById('editStatus').value,
      date_of_action: document.getElementById('editDateOfAction').value,
      fir_number: document.getElementById('editFIRNumber').value,
      court_memo_filed: document.getElementById('editCourtMemo').value,
      court_order_obtained: document.getElementById('editCourtOrder').value,
      action_taken: document.getElementById('editActionTaken').value,
      remarks: document.getElementById('editRemarks').value
    };

    try {
      const data = await apiFetch(`/api/petitions/${id}`, {
        method: 'PUT',
        body: payload
      });
      showToast(data.message || 'All columns saved successfully! / అన్ని వివరాలు విజయవంతంగా సేవ్ అయ్యాయి', 'success');
      closeEditModal();
      loadPetitions(currentPetitionsPage);
      loadKPISummary();
      if (document.getElementById('abstractTab') && document.getElementById('abstractTab').style.display !== 'none') {
        loadAbstractReport();
      }
      if (document.getElementById('holdRefundTab') && document.getElementById('holdRefundTab').style.display !== 'none') {
        loadHoldRefundReport();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = '💾 Save All 24 Columns (అన్ని వివరాలు సేవ్ చేయండి)';
    }
  });

  // Live duplicate checking on new Ack No input
  const newAckInput = document.getElementById('newAckNo');
  if (newAckInput) {
    newAckInput.addEventListener('input', (e) => {
      const raw = e.target.value.trim().toLowerCase();
      const warn = document.getElementById('newAckDuplicateWarning');
      if (!warn) return;
      if (!raw) {
        warn.style.display = 'none';
        return;
      }
      const match = staticPetitions.find(p => (p.ack_no || '').toString().trim().toLowerCase() === raw);
      if (match) {
        warn.innerHTML = `⚠️ ఈ Ack No (${match.ack_no}) ఇప్పటికే <strong>${match.ps_name}</strong> లో (${match.petition_date || ''}) నమోదై ఉంది! డూప్లికేట్ ఎంట్రీ అనుమతించబడదు.`;
        warn.style.display = 'block';
        warn.style.color = '#dc2626';
      } else {
        warn.innerHTML = `✅ Ack No అందుబాటులో ఉంది (New Petition - No Duplicate)`;
        warn.style.display = 'block';
        warn.style.color = '#15803d';
      }
    });
  }

  // New Petition Form
  document.getElementById('newPetitionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const ackNo = document.getElementById('newAckNo').value.trim();
    
    // Strict duplicate check before submitting
    const match = staticPetitions.find(p => (p.ack_no || '').toString().trim().toLowerCase() === ackNo.toLowerCase());
    if (match) {
      showToast(`Duplicate Ack No! This petition already exists in ${match.ps_name}`, 'error');
      return;
    }

    const payload = {
      ack_no: ackNo,
      portal_type: document.getElementById('newPortalType').value,
      ps_name: document.getElementById('newPSSelect').value,
      petition_date: document.getElementById('newPetitionDate').value,
      complainant_name: document.getElementById('newCompName').value.trim(),
      complainant_phone: document.getElementById('newCompPhone').value.trim(),
      victim_age: document.getElementById('newVictimAge').value,
      mo: document.getElementById('newMO').value,
      lost_amount: document.getElementById('newLostAmount').value,
      hold_amount: document.getElementById('newHoldAmount').value,
      complainant_address: document.getElementById('newAddress').value.trim(),
      action_taken: document.getElementById('newActionTaken').value.trim()
    };

    try {
      await apiFetch('/api/petitions', {
        method: 'POST',
        body: payload
      });
      showToast('New petition registered successfully! (కొత్త పిటిషన్ నమోదైంది)', 'success');
      closeNewModal();
      loadPetitions(1);
      loadKPISummary();
      loadStations();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Change Password Form
  document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('currentPassInput').value;
    const newPassword = document.getElementById('newPassInput').value;
    const confirmPassword = document.getElementById('confirmPassInput').value;

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match!', 'error');
      return;
    }

    try {
      await apiFetch('/api/auth/change-password', {
        method: 'POST',
        body: { currentPassword, newPassword }
      });
      showToast('Password changed successfully!', 'success');
      closePasswordModal();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Setup Excel dropzone
  setupExcelDropzone();
}

// Logout
function logout() {
  apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  localStorage.removeItem('ncrp_token');
  localStorage.removeItem('ncrp_session_user');
  currentToken = null;
  currentUser = null;
  showLoginScreen();
  showToast('Logged out safely', 'info');
}

// Load Police Stations
async function loadStations() {
  try {
    const data = await apiFetch('/api/stations');
    allStationsList = data.stations;

    const filterSelect = document.getElementById('filterPS');
    filterSelect.innerHTML = '<option value="">All Police Stations (అన్ని స్టేషన్లు)</option>';

    const newPSSelect = document.getElementById('newPSSelect');
    newPSSelect.innerHTML = '';

    allStationsList.forEach(st => {
      const opt = document.createElement('option');
      opt.value = st.name;
      opt.textContent = `${st.sl_no}. ${st.name} (${st.circle})`;
      filterSelect.appendChild(opt);

      const opt2 = opt.cloneNode(true);
      newPSSelect.appendChild(opt2);
    });

    if (currentUser.role === 'station') {
      newPSSelect.value = currentUser.psName;
    }
  } catch (err) {
    console.error('Failed to load stations:', err);
  }
}

// Load KPI Summary
async function loadKPISummary() {
  try {
    const data = await apiFetch('/api/reports/kpi');
    const s = data.stats;

    document.getElementById('kpiTotalPetitions').textContent = (s.total_petitions || 0).toLocaleString('en-IN');
    document.getElementById('tabBadgePetitions').textContent = (s.total_petitions || 0).toLocaleString('en-IN');
    document.getElementById('kpiTotalLost').textContent = formatINR(s.total_lost);
    document.getElementById('kpiTotalHold').textContent = formatINR(s.total_hold);
    document.getElementById('kpiHoldCases').textContent = `${(s.hold_cases_count || 0)} Accounts Secured`;
    document.getElementById('kpiTotalRefund').textContent = formatINR(s.total_refund);
    document.getElementById('kpiFIRCount').textContent = (s.fir_count || 0).toLocaleString('en-IN');
    document.getElementById('kpiUnderProcess').textContent = (s.under_process_count || 0).toLocaleString('en-IN');
    document.getElementById('kpiClosed').textContent = (s.closed_count || 0).toLocaleString('en-IN');
  } catch (err) {
    console.error('Failed to load KPIs:', err);
  }
}

let currentTableViewMode = localStorage.getItem('ncrp_view_mode') || 'full';

function setTableViewMode(mode) {
  currentTableViewMode = mode;
  localStorage.setItem('ncrp_view_mode', mode);

  const fullBtn = document.getElementById('viewModeFullBtn');
  const compactBtn = document.getElementById('viewModeCompactBtn');
  const table = document.getElementById('petitionsTable');

  if (mode === 'full') {
    if (fullBtn) { fullBtn.className = 'btn-primary'; fullBtn.style.background = '#0b1e3f'; fullBtn.style.color = '#ffffff'; }
    if (compactBtn) { compactBtn.className = 'btn-secondary'; compactBtn.style.background = ''; compactBtn.style.color = ''; }
    if (table) table.classList.add('table-sheet-view');
  } else {
    if (compactBtn) { compactBtn.className = 'btn-primary'; compactBtn.style.background = '#0b1e3f'; compactBtn.style.color = '#ffffff'; }
    if (fullBtn) { fullBtn.className = 'btn-secondary'; fullBtn.style.background = ''; fullBtn.style.color = ''; }
    if (table) table.classList.remove('table-sheet-view');
  }

  loadPetitions(currentPetitionsPage);
}

// Sorting state and helpers
let currentSortColumn = 'sl_no';
let currentSortOrder = 'asc';

function sortTableBy(col) {
  if (currentSortColumn === col) {
    currentSortOrder = (currentSortOrder === 'asc') ? 'desc' : 'asc';
  } else {
    currentSortColumn = col;
    currentSortOrder = (col === 'lost_amount' || col === 'hold_amount' || col === 'petition_date') ? 'desc' : 'asc';
  }

  const sortByEl = document.getElementById('sortByFilter');
  if (sortByEl) {
    if (col === 'sl_no') sortByEl.value = currentSortOrder === 'desc' ? 'sl_desc' : 'sl_asc';
    else if (col === 'petition_date') sortByEl.value = currentSortOrder === 'desc' ? 'date_desc' : 'date_asc';
    else if (col === 'lost_amount') sortByEl.value = currentSortOrder === 'desc' ? 'lost_desc' : 'lost_asc';
    else if (col === 'hold_amount') sortByEl.value = 'hold_desc';
    else if (col === 'ps_name') sortByEl.value = 'ps_asc';
    else if (col === 'ack_no') sortByEl.value = 'ack_asc';
    else if (col === 'status') sortByEl.value = 'status_asc';
  }

  loadPetitions(1);
}

function getSortHeaderIndicator(col) {
  if (currentSortColumn === col) {
    return currentSortOrder === 'asc' ? ' <span style="color:#f59e0b;">▲</span>' : ' <span style="color:#f59e0b;">▼</span>';
  }
  return ' <span style="color:#94a3b8; font-size:0.72rem; opacity:0.7;">↕</span>';
}

// Load Petitions with filters
async function loadPetitions(page = 1) {
  currentPetitionsPage = page;
  const tbody = document.getElementById('petitionsTableBody');
  const colSpanCount = (currentTableViewMode === 'full') ? 25 : 12;
  tbody.innerHTML = `<tr><td colspan="${colSpanCount}" style="text-align: center; padding: 40px; color: #64748b;">Loading petitions... / డేటా లోడ్ అవుతోంది...</td></tr>`;

  const search = document.getElementById('searchInput').value.trim();
  const status = document.getElementById('filterStatus').value;
  const mo = document.getElementById('filterMO').value;
  const portalEl = document.getElementById('filterPortalType');
  const portalType = portalEl ? portalEl.value : '';
  let ps = (currentUser && currentUser.role === 'station') ? currentUser.psName : document.getElementById('filterPS').value;

  const sortVal = (document.getElementById('sortByFilter') ? document.getElementById('sortByFilter').value : 'sl_asc');
  if (sortVal === 'sl_desc') { currentSortColumn = 'sl_no'; currentSortOrder = 'desc'; }
  else if (sortVal === 'sl_asc') { currentSortColumn = 'sl_no'; currentSortOrder = 'asc'; }
  else if (sortVal === 'date_desc') { currentSortColumn = 'petition_date'; currentSortOrder = 'desc'; }
  else if (sortVal === 'date_asc') { currentSortColumn = 'petition_date'; currentSortOrder = 'asc'; }
  else if (sortVal === 'lost_desc') { currentSortColumn = 'lost_amount'; currentSortOrder = 'desc'; }
  else if (sortVal === 'lost_asc') { currentSortColumn = 'lost_amount'; currentSortOrder = 'asc'; }
  else if (sortVal === 'hold_desc') { currentSortColumn = 'hold_amount'; currentSortOrder = 'desc'; }
  else if (sortVal === 'ps_asc') { currentSortColumn = 'ps_name'; currentSortOrder = 'asc'; }
  else if (sortVal === 'ack_asc') { currentSortColumn = 'ack_no'; currentSortOrder = 'asc'; }
  else if (sortVal === 'status_asc') { currentSortColumn = 'status'; currentSortOrder = 'asc'; }

  const queryParams = new URLSearchParams({
    page,
    limit: currentPetitionsLimit,
    search,
    status,
    mo,
    sort_by: currentSortColumn,
    sort_order: currentSortOrder
  });

  if (ps) queryParams.set('ps_name', ps);
  if (portalType) queryParams.set('portal_type', portalType);

  try {
    const data = await apiFetch(`/api/petitions?${queryParams.toString()}`);
    renderPetitionsTable(data);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="${colSpanCount}" style="text-align: center; color: #dc2626; padding: 30px;">Error loading petitions: ${err.message}</td></tr>`;
  }
}

function renderPetitionsTable(data) {
  const thead = document.getElementById('petitionsTableHead');
  const tbody = document.getElementById('petitionsTableBody');
  const table = document.getElementById('petitionsTable');
  tbody.innerHTML = '';

  document.getElementById('showingCount').textContent = data.total.toLocaleString('en-IN');
  document.getElementById('filteredAmounts').innerHTML = `
    | Total Lost: <span class="amount-loss">${formatINR(data.totalLost)}</span>
    | Total Hold: <span class="amount-hold">${formatINR(data.totalHold)}</span>
  `;

  document.getElementById('currentPageNum').textContent = data.page;
  document.getElementById('totalPagesNum').textContent = data.totalPages || 1;

  const isFullMode = (currentTableViewMode === 'full');
  if (isFullMode && table) table.classList.add('table-sheet-view');
  else if (table) table.classList.remove('table-sheet-view');

  // Render Header based on Mode with click-to-sort headers
  if (thead) {
    if (isFullMode) {
      thead.innerHTML = `
        <tr>
          <th style="min-width: 60px; cursor: pointer; user-select: none;" onclick="sortTableBy('sl_no')" title="Click to sort">SL NO${getSortHeaderIndicator('sl_no')}</th>
          <th style="min-width: 95px; cursor: pointer; user-select: none;" onclick="sortTableBy('petition_date')" title="Click to sort">Date${getSortHeaderIndicator('petition_date')}</th>
          <th style="min-width: 140px; cursor: pointer; user-select: none;" onclick="sortTableBy('ps_name')" title="Click to sort">Name of the PS${getSortHeaderIndicator('ps_name')}</th>
          <th style="min-width: 130px; cursor: pointer; user-select: none;" onclick="sortTableBy('circle_name')" title="Click to sort">Circle Name${getSortHeaderIndicator('circle_name')}</th>
          <th style="min-width: 80px;">NCRP/1930</th>
          <th style="min-width: 145px; cursor: pointer; user-select: none;" onclick="sortTableBy('ack_no')" title="Click to sort">Acknowledgement No${getSortHeaderIndicator('ack_no')}</th>
          <th style="min-width: 160px; cursor: pointer; user-select: none;" onclick="sortTableBy('complainant_name')" title="Click to sort">Complaint name & Ph no${getSortHeaderIndicator('complainant_name')}</th>
          <th style="min-width: 70px;">Victim Age</th>
          <th style="min-width: 180px;">Complainant Address</th>
          <th style="min-width: 160px;">Category of Complaint</th>
          <th style="min-width: 180px;">Sub Category of Complaint</th>
          <th style="min-width: 120px; cursor: pointer; user-select: none;" onclick="sortTableBy('lost_amount')" title="Click to sort">Lost Amount (₹)${getSortHeaderIndicator('lost_amount')}</th>
          <th style="min-width: 120px; cursor: pointer; user-select: none;" onclick="sortTableBy('hold_amount')" title="Click to sort">Hold Amount (₹)${getSortHeaderIndicator('hold_amount')}</th>
          <th class="th-process" style="min-width: 110px; cursor: pointer; user-select: none;" onclick="sortTableBy('status')" title="Click to sort">Status${getSortHeaderIndicator('status')}</th>
          <th style="min-width: 220px;">Action taken by PS</th>
          <th style="min-width: 95px;">Date of Action</th>
          <th class="th-fir" style="min-width: 120px;">Whether FIR is Registered (Cr. No.)</th>
          <th style="min-width: 110px;">Court Memo Filed</th>
          <th style="min-width: 110px;">Court Order Obtained</th>
          <th style="min-width: 80px;">No. of Days</th>
          <th style="min-width: 120px;">Lost Amount Details</th>
          <th style="min-width: 120px;">Hold Amount Details</th>
          <th style="min-width: 110px;">Time Line</th>
          <th style="min-width: 130px; cursor: pointer; user-select: none;" onclick="sortTableBy('mo')" title="Click to sort">Case Type (MO)${getSortHeaderIndicator('mo')}</th>
          <th style="min-width: 110px; text-align: center;">Action</th>
        </tr>
      `;
    } else {
      thead.innerHTML = `
        <tr>
          <th style="width: 60px; cursor: pointer; user-select: none;" onclick="sortTableBy('sl_no')" title="Click to sort">S.No${getSortHeaderIndicator('sl_no')}</th>
          <th style="cursor: pointer; user-select: none;" onclick="sortTableBy('petition_date')" title="Click to sort">Date${getSortHeaderIndicator('petition_date')}</th>
          <th style="cursor: pointer; user-select: none;" onclick="sortTableBy('ack_no')" title="Click to sort">Ack Number${getSortHeaderIndicator('ack_no')}</th>
          <th style="cursor: pointer; user-select: none;" onclick="sortTableBy('ps_name')" title="Click to sort">Police Station${getSortHeaderIndicator('ps_name')}</th>
          <th style="cursor: pointer; user-select: none;" onclick="sortTableBy('complainant_name')" title="Click to sort">Complainant Details${getSortHeaderIndicator('complainant_name')}</th>
          <th style="cursor: pointer; user-select: none;" onclick="sortTableBy('mo')" title="Click to sort">Modus Operandi (MO)${getSortHeaderIndicator('mo')}</th>
          <th style="cursor: pointer; user-select: none;" onclick="sortTableBy('lost_amount')" title="Click to sort">Lost Amount (₹)${getSortHeaderIndicator('lost_amount')}</th>
          <th style="cursor: pointer; user-select: none;" onclick="sortTableBy('hold_amount')" title="Click to sort">Hold Amount (₹)${getSortHeaderIndicator('hold_amount')}</th>
          <th style="cursor: pointer; user-select: none;" onclick="sortTableBy('status')" title="Click to sort">Status${getSortHeaderIndicator('status')}</th>
          <th>FIR / Cr. No</th>
          <th>Action Taken</th>
          <th style="text-align: center;">Action</th>
        </tr>
      `;
    }
  }

  const colSpanCount = isFullMode ? 25 : 12;

  if (data.petitions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${colSpanCount}" style="text-align: center; padding: 40px; color: #64748b;">No petitions found matching the criteria. / ఫలితాలు లేవు.</td></tr>`;
    renderPagination(data);
    return;
  }

  data.petitions.forEach((p, idx) => {
    const tr = document.createElement('tr');

    let badgeClass = 'badge-process';
    if (p.status === 'FIR Registered') badgeClass = 'badge-fir';
    else if (p.status === 'Closed') badgeClass = 'badge-closed';
    else if (p.status === 'Withdrawal') badgeClass = 'badge-withdraw';
    else if (p.status === 'Rejected') badgeClass = 'badge-rejected';
    else if (p.status === 'No Action') badgeClass = 'badge-withdraw';

    if (isFullMode) {
      tr.innerHTML = `
        <td><strong>${p.sl_no || idx + 1}</strong></td>
        <td>${p.petition_date || '-'}</td>
        <td><strong>${p.ps_name}</strong></td>
        <td style="color: #64748b;">${p.circle_name || '-'}</td>
        <td><span class="badge" style="background:#e0e7ff; color:#3730a3; font-weight:700;">${p.portal_type || 'NCRP'}</span></td>
        <td><strong style="color: #0b1e3f;">${p.ack_no}</strong></td>
        <td>
          <strong>${p.complainant_name || 'Unknown'}</strong>
          <div style="font-size: 0.74rem; color: #2563eb;">${p.complainant_phone ? '📞 ' + p.complainant_phone : ''}</div>
        </td>
        <td>${p.victim_age || '-'}</td>
        <td style="max-width: 200px; font-size: 0.75rem;" title="${p.complainant_address || ''}">${p.complainant_address || '-'}</td>
        <td style="font-size: 0.75rem;">${p.category || 'Online Financial Fraud'}</td>
        <td style="font-size: 0.75rem;">${p.sub_category || '-'}</td>
        <td class="amount-loss" style="font-weight: 700;">${p.lost_amount > 0 ? '₹' + p.lost_amount.toLocaleString('en-IN') : '-'}</td>
        <td class="amount-hold" style="font-weight: 700;">${p.hold_amount > 0 ? '₹' + p.hold_amount.toLocaleString('en-IN') : '-'}</td>
        <td><span class="badge ${badgeClass}">${p.status}</span></td>
        <td style="max-width: 250px; font-size: 0.75rem; color: #334155;" title="${p.action_taken || ''}">
          ${p.action_taken ? (p.action_taken.length > 50 ? p.action_taken.slice(0, 50) + '...' : p.action_taken) : '<em style="color:#94a3b8">Pending</em>'}
        </td>
        <td>${p.date_of_action || '-'}</td>
        <td><strong style="color: #dc2626;">${p.fir_number || '-'}</strong></td>
        <td><span class="badge" style="${p.court_memo_filed === 'Yes' ? 'background:#dcfce7; color:#15803d;' : 'background:#f1f5f9; color:#64748b;'}">${p.court_memo_filed || 'No'}</span></td>
        <td><span class="badge" style="${p.court_order_obtained === 'Yes' ? 'background:#dcfce7; color:#15803d;' : 'background:#f1f5f9; color:#64748b;'}">${p.court_order_obtained || 'No'}</span></td>
        <td>${p.no_of_days !== undefined ? p.no_of_days : '-'}</td>
        <td><span style="font-size: 0.72rem; color: #475569;">${p.loss_bucket || '-'}</span></td>
        <td><span style="font-size: 0.72rem; color: #475569;">${p.hold_bucket || '-'}</span></td>
        <td><span class="badge" style="background:#fef3c7; color:#92400e;">${p.timeline_status || 'Under Process'}</span></td>
        <td><span style="font-weight: 600; color: #1e3a8a;">${p.mo || 'Other'}</span></td>
        <td style="text-align: center; white-space: nowrap;">
          <button class="action-btn-sm" onclick="openEditModal(${p.id})">✏️ Edit</button>
        </td>
      `;
    } else {
      tr.innerHTML = `
        <td>${p.sl_no || idx + 1}</td>
        <td style="white-space: nowrap;">${p.petition_date}</td>
        <td>
          <strong style="color: #0b1e3f;">${p.ack_no}</strong>
          <div style="font-size: 0.72rem; color: #64748b;">${p.portal_type}</div>
        </td>
        <td>
          <strong>${p.ps_name}</strong>
          <div style="font-size: 0.72rem; color: #64748b;">${p.circle_name || ''}</div>
        </td>
        <td>
          <div><strong>${p.complainant_name}</strong></div>
          <div style="font-size: 0.78rem; color: #2563eb;">${p.complainant_phone ? '📞 ' + p.complainant_phone : ''}</div>
        </td>
        <td><span style="font-weight: 600; color: #334155;">${p.mo || 'Other'}</span></td>
        <td class="amount-loss">${p.lost_amount > 0 ? '₹' + p.lost_amount.toLocaleString('en-IN') : '-'}</td>
        <td class="amount-hold">${p.hold_amount > 0 ? '₹' + p.hold_amount.toLocaleString('en-IN') : '-'}</td>
        <td><span class="badge ${badgeClass}">${p.status}</span></td>
        <td><span style="font-weight: 600; color: #dc2626;">${p.fir_number || '-'}</span></td>
        <td style="max-width: 220px; font-size: 0.78rem; color: #475569;" title="${p.action_taken || ''}">
          ${p.action_taken ? (p.action_taken.length > 60 ? p.action_taken.slice(0, 60) + '...' : p.action_taken) : '<em style="color:#94a3b8">Pending</em>'}
        </td>
        <td style="text-align: center; white-space: nowrap;">
          <button class="action-btn-sm" onclick="openEditModal(${p.id})">✏️ Edit Action</button>
        </td>
      `;
    }
    tbody.appendChild(tr);
  });

  renderPagination(data);
}

function renderPagination(data) {
  const container = document.getElementById('paginationControls');
  container.innerHTML = '';
  if (data.totalPages <= 1) return;

  const createBtn = (text, page, disabled = false, active = false) => {
    const btn = document.createElement('button');
    btn.className = `page-btn ${active ? 'active' : ''}`;
    btn.textContent = text;
    btn.disabled = disabled;
    btn.onclick = () => loadPetitions(page);
    return btn;
  };

  container.appendChild(createBtn('« Prev', data.page - 1, data.page <= 1));

  let startPage = Math.max(1, data.page - 2);
  let endPage = Math.min(data.totalPages, startPage + 4);
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  for (let p = startPage; p <= endPage; p++) {
    container.appendChild(createBtn(p, p, false, p === data.page));
  }

  container.appendChild(createBtn('Next »', data.page + 1, data.page >= data.totalPages));
}

function applyFilters() {
  loadPetitions(1);
}

function resetFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('filterStatus').value = '';
  document.getElementById('filterMO').value = '';
  const portalEl = document.getElementById('filterPortalType');
  if (portalEl) portalEl.value = '';
  if (currentUser.role === 'admin') {
    document.getElementById('filterPS').value = '';
  }
  loadPetitions(1);
}

// Export CSV / Excel with All 24 Columns
function exportCSV() {
  let pets = staticPetitions;
  if (currentUser && currentUser.role === 'station') {
    pets = pets.filter(p => p.ps_name === currentUser.psName);
  }

  const search = (document.getElementById('searchInput').value || '').trim().toLowerCase();
  const status = document.getElementById('filterStatus').value;
  const mo = document.getElementById('filterMO').value;
  const portalEl = document.getElementById('filterPortalType');
  const portal = portalEl ? portalEl.value : '';

  if (search) {
    pets = pets.filter(p =>
      (p.ack_no && p.ack_no.toLowerCase().includes(search)) ||
      (p.complainant_name && p.complainant_name.toLowerCase().includes(search)) ||
      (p.complainant_phone && p.complainant_phone.includes(search)) ||
      (p.fir_number && p.fir_number.toLowerCase().includes(search))
    );
  }
  if (status) pets = pets.filter(p => p.status === status);
  if (mo) pets = pets.filter(p => p.mo === mo);
  if (portal) pets = pets.filter(p => p.portal_type === portal);

  const headers = [
    'SL NO', 'Date', 'Name of the PS', 'Circle Name', 'NCRP/1930', 'Acknowledgement No',
    'Complaint name & Ph no', 'Victim Age', 'Complainant Address', 'Category of Complaint',
    'Sub Category of Complaint', 'Lost Amount', 'Hold Amount', 'Status', 'Action taken by PS',
    'Date of Action', 'Whether FIR is Registered (Cr. No.)', 'Court Memo Filed for Refund in FIR Cases (Yes/No)',
    'Court Order Obtained or Not', 'No. of Days', 'Lost Amount Details', 'Hold Amount Details', 'Time Line', 'case type'
  ];

  const rows = pets.map((p, i) => [
    p.sl_no || (i + 1),
    p.petition_date || '',
    p.ps_name || '',
    p.circle_name || '',
    p.portal_type || 'NCRP',
    p.ack_no || '',
    `${p.complainant_name || ''}\n${p.complainant_phone || ''}`.trim(),
    p.victim_age || '',
    p.complainant_address || '',
    p.category || 'Online Financial Fraud',
    p.sub_category || 'UPI Related Frauds',
    p.lost_amount || 0,
    p.hold_amount || 0,
    p.status || 'Under Process',
    p.action_taken || '',
    p.date_of_action || '',
    p.fir_number || '',
    p.court_memo_filed || 'No',
    p.court_order_obtained || 'No',
    p.no_of_days !== undefined ? p.no_of_days : '',
    p.loss_bucket || '',
    p.hold_bucket || '',
    p.timeline_status || '',
    p.mo || 'Other'
  ]);

  if (typeof XLSX !== 'undefined') {
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "NCRP_Petitions");
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Srikakulam_Police_NCRP_1930_Petitions_${dateStr}.xlsx`);
    showToast(`Exported ${pets.length} petitions to Excel!`, 'success');
  } else {
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Srikakulam_Police_NCRP_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}

// Edit Modal Functions - All 24 Columns
function populateEditStationOptions(selectedStation) {
  const select = document.getElementById('editPSName');
  if (!select) return;
  const stations = (allStationsList && allStationsList.length > 0) ? allStationsList : staticStations;
  select.innerHTML = '';
  stations.forEach(st => {
    const opt = document.createElement('option');
    opt.value = st.name;
    opt.textContent = `${st.name} (${st.circle || ''})`;
    if (st.name === selectedStation) {
      opt.selected = true;
    }
    select.appendChild(opt);
  });
}

function onEditStationChange() {
  const stationName = document.getElementById('editPSName').value;
  const stations = (allStationsList && allStationsList.length > 0) ? allStationsList : staticStations;
  const st = stations.find(s => s.name === stationName);
  if (st) {
    document.getElementById('editCircleName').value = st.circle || '';
    document.getElementById('editSubDivision').value = st.sub_division || '';
  }
}

async function openEditModal(petitionId) {
  try {
    const data = await apiFetch(`/api/petitions/${petitionId}`);
    const p = data.petition;

    document.getElementById('editPetitionId').value = p.id;
    document.getElementById('modalEditAckSub').textContent = `Ack No: ${p.ack_no || '-'} | S.No: ${p.sl_no || p.id}`;

    // 1. Case Registration Details
    document.getElementById('editSlNo').value = p.sl_no !== undefined ? p.sl_no : p.id;
    document.getElementById('editAckNo').value = p.ack_no || '';
    document.getElementById('editDate').value = p.petition_date || '';
    document.getElementById('editPortalType').value = p.portal_type || 'NCRP';

    populateEditStationOptions(p.ps_name);
    document.getElementById('editPSName').value = p.ps_name || '';
    document.getElementById('editCircleName').value = p.circle_name || '';
    document.getElementById('editSubDivision').value = p.sub_division || '';

    // 2. Complainant & Victim Details
    document.getElementById('editComplainantName').value = p.complainant_name || '';
    document.getElementById('editComplainantPhone').value = p.complainant_phone || '';
    document.getElementById('editVictimAge').value = p.victim_age || '';
    document.getElementById('editAddress').value = p.complainant_address || '';

    // 3. Crime Category & Financials
    document.getElementById('editCategory').value = p.category || '';
    document.getElementById('editSubCategory').value = p.sub_category || '';
    document.getElementById('editMO').value = p.mo || 'UPI Fraud';
    document.getElementById('editLostAmount').value = p.lost_amount !== undefined ? p.lost_amount : 0;
    document.getElementById('editHoldAmount').value = p.hold_amount !== undefined ? p.hold_amount : 0;
    document.getElementById('editRefundAmount').value = p.refund_amount !== undefined ? p.refund_amount : 0;

    // 4. Police Action & Legal Tracking
    document.getElementById('editStatus').value = p.status || 'Under Process';
    document.getElementById('editDateOfAction').value = p.date_of_action || '';
    document.getElementById('editFIRNumber').value = p.fir_number || '';
    document.getElementById('editCourtMemo').value = p.court_memo_filed || 'No';
    document.getElementById('editCourtOrder').value = p.court_order_obtained || 'No';
    document.getElementById('editActionTaken').value = p.action_taken || '';
    document.getElementById('editRemarks').value = p.remarks || '';

    document.getElementById('editPetitionModal').style.display = 'flex';
  } catch (err) {
    showToast('Failed to load petition: ' + err.message, 'error');
  }
}

function closeEditModal() {
  document.getElementById('editPetitionModal').style.display = 'none';
}

// New Petition Modal
function openNewPetitionModal() {
  document.getElementById('newPetitionDate').value = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
  document.getElementById('newAckNo').value = `NCRP_${Date.now()}`;
  document.getElementById('newPetitionModal').style.display = 'flex';
}

function closeNewModal() {
  document.getElementById('newPetitionModal').style.display = 'none';
}

// ==================== EXCEL / CSV IMPORT & ZERO-DUPLICATE GUARD ====================
let stagedImportPetitions = [];
let stagedDuplicateCount = 0;

function openExcelImportModal() {
  stagedImportPetitions = [];
  stagedDuplicateCount = 0;
  const fileInput = document.getElementById('excelFileInput');
  if (fileInput) fileInput.value = '';
  const pasteArea = document.getElementById('excelPasteArea');
  if (pasteArea) pasteArea.value = '';
  document.getElementById('selectedFileName').style.display = 'none';
  document.getElementById('importLoading').style.display = 'none';
  document.getElementById('importSummarySection').style.display = 'none';
  const confirmBtn = document.getElementById('confirmImportBtn');
  confirmBtn.disabled = true;
  confirmBtn.textContent = '✅ Confirm & Import New Petitions (కొత్త పిటిషన్లను చేర్చండి)';
  switchImportMethod('file');
  document.getElementById('excelImportModal').style.display = 'flex';
}

function closeExcelImportModal() {
  document.getElementById('excelImportModal').style.display = 'none';
}

function switchImportMethod(method) {
  const fileSec = document.getElementById('importFileSection');
  const pasteSec = document.getElementById('importPasteSection');
  const fileBtn = document.getElementById('importTabFileBtn');
  const pasteBtn = document.getElementById('importTabPasteBtn');

  if (method === 'file') {
    fileSec.style.display = 'block';
    pasteSec.style.display = 'none';
    fileBtn.className = 'btn-primary';
    fileBtn.style.background = '#0b1e3f';
    pasteBtn.className = 'btn-secondary';
    pasteBtn.style.background = '';
  } else {
    fileSec.style.display = 'none';
    pasteSec.style.display = 'block';
    pasteBtn.className = 'btn-primary';
    pasteBtn.style.background = '#0b1e3f';
    fileBtn.className = 'btn-secondary';
    fileBtn.style.background = '';
  }
}

function setupExcelDropzone() {
  const dropzone = document.getElementById('excelDropzone');
  if (!dropzone) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    }, false);
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files.length > 0) {
      handleExcelFile(files[0]);
    }
  });
}

function handleExcelFileSelect(event) {
  const file = event.target.files[0];
  if (file) handleExcelFile(file);
}

function handleExcelFile(file) {
  const nameLabel = document.getElementById('selectedFileName');
  nameLabel.textContent = `📄 Selected File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
  nameLabel.style.display = 'block';

  document.getElementById('importLoading').style.display = 'block';
  document.getElementById('importSummarySection').style.display = 'none';

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      if (typeof XLSX === 'undefined') {
        throw new Error('Excel parsing library is initializing, please try again in a moment');
      }
      const workbook = XLSX.read(data, { type: 'array' });
      let sheetName = workbook.SheetNames[0];
      const ws = workbook.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      processRawRows(rawRows);
    } catch (err) {
      document.getElementById('importLoading').style.display = 'none';
      showToast('Error reading Excel: ' + err.message, 'error');
    }
  };
  reader.readAsArrayBuffer(file);
}

function analyzePastedData() {
  const text = document.getElementById('excelPasteArea').value.trim();
  if (!text) {
    showToast('Please paste data copied from Excel or Sheets first', 'warning');
    return;
  }

  document.getElementById('importLoading').style.display = 'block';
  document.getElementById('importSummarySection').style.display = 'none';

  setTimeout(() => {
    try {
      const lines = text.split(/\r?\n/).map(l => l.split('\t'));
      processRawRows(lines);
    } catch (err) {
      document.getElementById('importLoading').style.display = 'none';
      showToast('Error parsing pasted data: ' + err.message, 'error');
    }
  }, 100);
}

// Intelligent Column Mapper & 100% Zero-Duplicate Guard
function processRawRows(matrix) {
  document.getElementById('importLoading').style.display = 'none';
  if (!matrix || matrix.length < 2) {
    showToast('Sheet has no data rows to import', 'warning');
    return;
  }

  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(6, matrix.length); i++) {
    const rowStr = matrix[i].map(c => String(c).toLowerCase()).join(' ');
    if (rowStr.includes('ack') || rowStr.includes('complain') || rowStr.includes('police') || rowStr.includes('loss') || rowStr.includes('lost')) {
      headerRowIndex = i;
      break;
    }
  }

  const headers = matrix[headerRowIndex].map(h => String(h || '').trim().toLowerCase());
  
  const getCol = (keywords, exclude = []) => {
    return headers.findIndex(h =>
      keywords.some(k => h.includes(k)) &&
      !exclude.some(ex => h.includes(ex))
    );
  };

  const colAck = getCol(['acknowledgement', 'ack no', 'ack', 'complaint no', 'petition no', 'reference']);
  const colDate = getCol(['complaint date', 'petition date', 'date', 'reg date', 'incident date'], ['last action', 'action', 'dob']);
  const colPS = getCol(['police station', 'ps name', 'station name', 'station', 'ps'], ['circle', 'sub', 'state', 'district', 'action']);
  
  let colName = getCol(['complainant name', 'victim name'], ['state', 'district', 'suspect']);
  if (colName === -1) {
    colName = getCol(['complainant', 'victim', 'name'], ['state', 'district', 'station', 'suspect', 'police', 'circle', 'sub']);
  }
  
  const colPhone = getCol(['complainant mobile', 'complainant phone', 'mobile no', 'mobile', 'phone', 'contact'], ['suspect']);
  const colAge = getCol(['age']);
  const colAddress = getCol(['complainant address', 'victim address', 'address', 'village', 'native'], ['suspect', 'email', 'ip']);
  const colCategory = getCol(['category'], ['sub']);
  const colSubCat = getCol(['sub category', 'sub-category']);
  const colCrimeInfo = getCol(['crime aditional', 'crime additional', 'crime info', 'additional information', 'description', 'brief']);
  const colMO = getCol(['modus operandi', 'crime type', 'fraud type', 'case type'], ['mobile', 'model', 'mode']);
  const colLost = getCol(['fraudulent amount', 'fraud amount', 'lost amount', 'loss amount', 'amount lost', 'lost', 'amount'], ['hold', 'freeze', 'refund']);
  const colHold = getCol(['hold amount', 'amount hold', 'freeze amount', 'frozen amount', 'hold', 'freeze'], ['lost', 'loss', 'fraud']);
  const colStatus = getCol(['status', 'current status'], ['timeline']);
  const colFIR = getCol(['fir number', 'fir no', 'cr no', 'crime no', 'fir']);
  const colAction = getCol(['action taken', 'last action', 'action', 'investigation', 'remarks']);

  if (colAck === -1) {
    showToast('Could not find "Ack Number" column in header. Please ensure your sheet has an Ack No column.', 'error');
    return;
  }

  // Deduce MO helper
  const deduceMOFromText = (text, subCat, category) => {
    const combined = ((text || '') + ' ' + (subCat || '') + ' ' + (category || '')).toLowerCase();
    if (combined.includes('olx') || combined.includes('quikr') || combined.includes('guitar')) return 'OLX / Fake Seller Fraud';
    if (combined.includes('stock') || combined.includes('share market') || combined.includes('trading') || combined.includes('invest')) return 'Investment / Stock Market';
    if (combined.includes('part time') || combined.includes('job') || combined.includes('task') || combined.includes('telegram')) return 'Job / Part Time Job Fraud';
    if (combined.includes('digital arrest') || combined.includes('fedex') || combined.includes('cbi') || combined.includes('customs')) return 'Digital Arrest';
    if (combined.includes('loan') || combined.includes('apk')) return 'Loan App Fraud';
    if (combined.includes('sextortion') || combined.includes('video call') || combined.includes('nude')) return 'Sextortion';
    if (combined.includes('credit card') || combined.includes('debit card') || combined.includes('sim swap')) return 'Credit/Debit Card Fraud';
    if (combined.includes('otp')) return 'OTP Fraud';
    if (combined.includes('kyc') || combined.includes('sim kyc')) return 'KYC / SIM KYC';
    if (combined.includes('screen sharing') || combined.includes('anydesk') || combined.includes('teamviewer') || combined.includes('rustdesk')) return 'Screen Sharing';
    if (combined.includes('matrimonial') || combined.includes('dating')) return 'Matrimonial / Dating Fraud';
    if (combined.includes('aeps') || combined.includes('aadhaar')) return 'AEPS Fraud';
    if (combined.includes('lottery') || combined.includes('gift') || combined.includes('reward')) return 'Lottery / Fake Reward Fraud';
    if (combined.includes('courier') || combined.includes('parcel')) return 'Courier / Parcel Scam';
    if (combined.includes('electricity') || combined.includes('bill')) return 'Electricity Bill Scam';
    if (combined.includes('customer care') || combined.includes('helpline')) return 'Customer Care Scam';
    if (combined.includes('free fire') || combined.includes('gaming')) return 'Online Gaming / In-App Scam';
    if (combined.includes('upi') || combined.includes('qr code') || combined.includes('gpay') || combined.includes('phonepe')) return 'UPI Related Frauds';
    return subCat || 'Other Cyber Crime';
  };

  // Build lookup map of all existing petitions in database
  const existingAcksMap = new Map();
  staticPetitions.forEach(p => {
    const clean = String(p.ack_no || '').trim().toLowerCase();
    if (clean) {
      existingAcksMap.set(clean, {
        ack_no: p.ack_no,
        ps_name: p.ps_name,
        petition_date: p.petition_date,
        complainant_name: p.complainant_name
      });
    }
  });

  const batchAcksSet = new Set();
  const processedRows = [];
  let newCount = 0;
  let dupCount = 0;
  let invalidCount = 0;

  for (let r = headerRowIndex + 1; r < matrix.length; r++) {
    const row = matrix[r];
    if (!row || row.every(cell => String(cell || '').trim() === '')) {
      continue;
    }

    const rawAck = String(row[colAck] || '').trim();
    const cleanAck = rawAck.toLowerCase();

    if (!rawAck || rawAck === '-' || cleanAck === 'ack no' || cleanAck === 'acknowledgement no') {
      invalidCount++;
      continue;
    }

    let ps = (colPS !== -1 && row[colPS]) ? String(row[colPS]).trim() : '';
    if (!ps && currentUser && currentUser.role === 'station') {
      ps = currentUser.psName;
    }
    if (ps) {
      const cleanPs = ps.toLowerCase().replace(/[^a-z0-9]/g, '');
      const matchSt = staticStations.find(s => 
        s.name.toLowerCase() === ps.toLowerCase() ||
        s.name.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanPs ||
        s.name.toLowerCase().includes(ps.toLowerCase()) ||
        cleanPs.includes(s.name.toLowerCase().replace(/[^a-z0-9]/g, ''))
      );
      if (matchSt) ps = matchSt.name;
    }
    if (!ps) ps = 'District Police Office, Srikakulam';

    const petitionDate = (colDate !== -1 && row[colDate]) ? String(row[colDate]).trim() : new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    const compName = (colName !== -1 && row[colName]) ? String(row[colName]).trim() : 'Unknown';
    const compPhone = (colPhone !== -1 && row[colPhone]) ? String(row[colPhone]).trim() : '';
    const victimAge = (colAge !== -1 && row[colAge]) ? String(row[colAge]).trim() : '';
    const compAddress = (colAddress !== -1 && row[colAddress]) ? String(row[colAddress]).trim() : '';
    const category = (colCategory !== -1 && row[colCategory]) ? String(row[colCategory]).trim() : 'Online Financial Fraud';
    const subCat = (colSubCat !== -1 && row[colSubCat]) ? String(row[colSubCat]).trim() : 'UPI Related Frauds';
    const crimeDesc = (colCrimeInfo !== -1 && row[colCrimeInfo]) ? String(row[colCrimeInfo]).trim() : '';

    let mo = (colMO !== -1 && row[colMO]) ? String(row[colMO]).trim() : '';
    if (!mo || mo === 'Other' || /^\d+$/.test(mo)) {
      mo = deduceMOFromText(crimeDesc, subCat, category);
    }

    const lost = (colLost !== -1 && row[colLost]) ? (parseFloat(String(row[colLost]).replace(/[^0-9.]/g, '')) || 0) : 0;
    const hold = (colHold !== -1 && row[colHold]) ? (parseFloat(String(row[colHold]).replace(/[^0-9.]/g, '')) || 0) : 0;
    
    let status = (colStatus !== -1 && row[colStatus]) ? String(row[colStatus]).trim() : 'Under Process';
    if (status.toLowerCase() === 'registered' || status.toLowerCase() === 'open') {
      status = 'Under Process';
    }

    const fir = (colFIR !== -1 && row[colFIR]) ? String(row[colFIR]).trim() : '';
    const action = (colAction !== -1 && row[colAction]) ? String(row[colAction]).trim() : '';

    const petitionItem = {
      ack_no: rawAck,
      petition_date: petitionDate,
      ps_name: ps,
      complainant_name: compName,
      complainant_phone: compPhone,
      victim_age: victimAge,
      complainant_address: compAddress,
      category,
      sub_category: subCat,
      mo,
      lost_amount: lost,
      hold_amount: hold,
      status,
      fir_number: fir,
      action_taken: action,
      remarks: crimeDesc
    };

    // ZERO-DUPLICATE CHECK:
    let isDuplicate = false;
    let dupReason = '';

    if (existingAcksMap.has(cleanAck)) {
      isDuplicate = true;
      const exist = existingAcksMap.get(cleanAck);
      dupReason = `Already in system (${exist.ps_name} - ${exist.petition_date})`;
    } else if (batchAcksSet.has(cleanAck)) {
      isDuplicate = true;
      dupReason = 'Duplicate row within this Excel';
    }

    if (isDuplicate) {
      dupCount++;
      petitionItem.isDuplicate = true;
      petitionItem.reason = dupReason;
    } else {
      newCount++;
      batchAcksSet.add(cleanAck);
      petitionItem.isDuplicate = false;
      petitionItem.reason = '🟢 New Unique Petition';
    }

    processedRows.push(petitionItem);
  }

  stagedImportPetitions = processedRows.filter(p => !p.isDuplicate);
  stagedDuplicateCount = dupCount;

  // Render Summary
  document.getElementById('sumTotalRows').textContent = processedRows.length;
  document.getElementById('sumNewRows').textContent = newCount;
  document.getElementById('sumDupRows').textContent = dupCount;
  document.getElementById('sumInvalidRows').textContent = invalidCount;

  const alertBox = document.getElementById('importAlertBox');
  if (newCount > 0) {
    alertBox.style.background = '#dcfce7';
    alertBox.style.color = '#15803d';
    alertBox.style.border = '1px solid #86efac';
    alertBox.innerHTML = `✅ <strong>${newCount} కొత్త పిటిషన్లు సిద్ధంగా ఉన్నాయి.</strong> ${dupCount} మునుపటి రోజుల్లో నమోదైన డూప్లికేట్లు విజయవంతంగా ఫిల్టర్ చేయబడ్డాయి (Zero Duplicates)!`;
    document.getElementById('confirmImportBtn').disabled = false;
    document.getElementById('confirmImportBtn').textContent = `✅ Confirm & Import ${newCount} New Petitions (చేర్చండి)`;
  } else {
    alertBox.style.background = '#fee2e2';
    alertBox.style.color = '#b91c1c';
    alertBox.style.border = '1px solid #fca5a5';
    alertBox.innerHTML = `⚠️ <strong>కొత్త పిటిషన్లు ఏవీ లేవు!</strong> ఎక్సెల్ లో ఉన్న ${dupCount} పిటిషన్లు అన్నీ ఇప్పటికే మన డేటాబేస్ లో నమోదై ఉన్నాయి (All are Duplicates).`;
    document.getElementById('confirmImportBtn').disabled = true;
    document.getElementById('confirmImportBtn').textContent = `⚠️ No New Petitions to Import (అన్నీ డూప్లికేట్లు)`;
  }

  // Render Preview Table
  const tbody = document.getElementById('importPreviewTableBody');
  tbody.innerHTML = '';
  processedRows.slice(0, 100).forEach(p => {
    const tr = document.createElement('tr');
    tr.style.background = p.isDuplicate ? '#fef2f2' : '#f0fdf4';
    tr.innerHTML = `
      <td>
        <span class="badge" style="${p.isDuplicate ? 'background:#fee2e2; color:#b91c1c;' : 'background:#dcfce7; color:#15803d;'}">
          ${p.isDuplicate ? '⚠️ DUPLICATE' : '🟢 NEW'}
        </span>
      </td>
      <td><strong>${p.ack_no}</strong></td>
      <td>${p.petition_date}</td>
      <td>${p.ps_name}</td>
      <td>${p.complainant_name}</td>
      <td>₹${p.lost_amount.toLocaleString('en-IN')}</td>
      <td>₹${p.hold_amount.toLocaleString('en-IN')}</td>
      <td style="font-size: 0.75rem; color: ${p.isDuplicate ? '#dc2626' : '#15803d'}; font-weight: 600;">
        ${p.reason}
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (processedRows.length > 100) {
    const moreTr = document.createElement('tr');
    moreTr.innerHTML = `<td colspan="8" style="text-align: center; color: #64748b; font-style: italic;">...and ${processedRows.length - 100} more rows</td>`;
    tbody.appendChild(moreTr);
  }

  document.getElementById('importSummarySection').style.display = 'block';
}

async function confirmAndExecuteImport() {
  if (!stagedImportPetitions || stagedImportPetitions.length === 0) {
    showToast('No new petitions to import', 'warning');
    return;
  }

  const btn = document.getElementById('confirmImportBtn');
  btn.disabled = true;
  btn.textContent = 'Saving & Updating Database... / నమోదు చేస్తోంది...';

  try {
    const res = await apiFetch('/api/petitions/bulk', {
      method: 'POST',
      body: { petitions: stagedImportPetitions }
    });

    showToast(`✅ ${res.insertedCount || stagedImportPetitions.length} New Petitions added! (${stagedDuplicateCount} duplicates skipped)`, 'success');
    closeExcelImportModal();

    // Reload all dashboard views immediately
    loadPetitions(1);
    loadKPISummary();
    loadStations();
    if (document.getElementById('abstractTab') && document.getElementById('abstractTab').style.display !== 'none') loadAbstractReport();
    if (document.getElementById('holdRefundTab') && document.getElementById('holdRefundTab').style.display !== 'none') loadHoldRefundReport();

  } catch (err) {
    showToast('Failed to import petitions: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '✅ Confirm & Import New Petitions (కొత్త పిటిషన్లను చేర్చండి)';
  }
}

// Password Modal
function openChangePasswordModal() {
  document.getElementById('currentPassInput').value = '';
  document.getElementById('newPassInput').value = '';
  document.getElementById('confirmPassInput').value = '';
  document.getElementById('changePasswordModal').style.display = 'flex';
}

function closePasswordModal() {
  document.getElementById('changePasswordModal').style.display = 'none';
}

// TAB SWITCHING
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));

  const activeSection = document.getElementById(tabId);
  if (activeSection) activeSection.style.display = 'block';

  event.currentTarget.classList.add('active');

  if (tabId === 'analyticsTab') {
    loadAnalytics();
  } else if (tabId === 'abstractTab') {
    loadAbstractReport();
  } else if (tabId === 'holdRefundTab') {
    loadHoldRefundReport();
  } else if (tabId === 'statusWiseTab') {
    loadStatusWiseReport();
  } else if (tabId === 'timelineTab') {
    loadTimelineReport();
  } else if (tabId === 'holdSlabsTab') {
    loadHoldSlabsReport();
  } else if (tabId === 'lostSlabsTab') {
    loadLostSlabsReport();
  } else if (tabId === 'moWiseTab') {
    loadMOWiseReport();
  } else if (tabId === 'adminUsersTab') {
    loadAdminUsers();
  }
}

// TAB 2: ANALYTICS & CHARTS
async function loadAnalytics() {
  try {
    const [moData, kpiData, stationsData] = await Promise.all([
      apiFetch('/api/reports/mo-wise'),
      apiFetch('/api/reports/kpi'),
      apiFetch('/api/stations')
    ]);

    // 1. Modus Operandi Chart
    const moLabels = moData.rows.slice(0, 8).map(r => r.mo);
    const moCounts = moData.rows.slice(0, 8).map(r => r.count);

    if (moChartInstance) moChartInstance.destroy();
    const ctxMO = document.getElementById('moChart').getContext('2d');
    moChartInstance = new Chart(ctxMO, {
      type: 'doughnut',
      data: {
        labels: moLabels,
        datasets: [{
          data: moCounts,
          backgroundColor: [
            '#2563eb', '#16a34a', '#dc2626', '#d97706', '#9333ea',
            '#0891b2', '#f59e0b', '#64748b'
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'right' } }
      }
    });

    // 2. Status Chart
    const s = kpiData.stats;
    if (statusChartInstance) statusChartInstance.destroy();
    const ctxStatus = document.getElementById('statusChart').getContext('2d');
    statusChartInstance = new Chart(ctxStatus, {
      type: 'pie',
      data: {
        labels: ['Under Process', 'Closed', 'FIR Registered', 'Withdrawal', 'Rejected'],
        datasets: [{
          data: [s.under_process_count, s.closed_count, s.fir_count, s.withdrawal_count, s.rejected_count],
          backgroundColor: ['#d97706', '#16a34a', '#dc2626', '#64748b', '#ec4899']
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'right' } }
      }
    });

    // 3. Top Stations Chart
    const topStations = [...stationsData.stations].sort((a, b) => b.petition_count - a.petition_count).slice(0, 8);
    if (stationVolumeChartInstance) stationVolumeChartInstance.destroy();
    const ctxStation = document.getElementById('stationVolumeChart').getContext('2d');
    stationVolumeChartInstance = new Chart(ctxStation, {
      type: 'bar',
      data: {
        labels: topStations.map(st => st.name),
        datasets: [{
          label: 'Total Petitions',
          data: topStations.map(st => st.petition_count),
          backgroundColor: '#0b1e3f'
        }, {
          label: 'Closed Cases',
          data: topStations.map(st => st.closed_count),
          backgroundColor: '#16a34a'
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } }
      }
    });

    // 4. Financial Recovery Chart by Sub-Division
    const subDivMap = {};
    stationsData.stations.forEach(st => {
      const sub = st.sub_division || 'Srikakulam Sub-Division';
      if (!subDivMap[sub]) subDivMap[sub] = { lost: 0, hold: 0 };
      subDivMap[sub].lost += (st.total_lost || 0);
      subDivMap[sub].hold += (st.total_hold || 0);
    });

    const subLabels = Object.keys(subDivMap);
    if (financialChartInstance) financialChartInstance.destroy();
    const ctxFin = document.getElementById('financialChart').getContext('2d');
    financialChartInstance = new Chart(ctxFin, {
      type: 'bar',
      data: {
        labels: subLabels,
        datasets: [{
          label: 'Lost Amount (₹ Lakhs)',
          data: subLabels.map(k => (subDivMap[k].lost / 100000).toFixed(1)),
          backgroundColor: '#ef4444'
        }, {
          label: 'Hold Amount (₹ Lakhs)',
          data: subLabels.map(k => (subDivMap[k].hold / 100000).toFixed(1)),
          backgroundColor: '#22c55e'
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } }
      }
    });

  } catch (err) {
    console.error('Failed to load analytics:', err);
  }
}

// TAB 3: ABSTRACT REPORT
async function loadAbstractReport() {
  const tbody = document.getElementById('abstractTableBody');
  tbody.innerHTML = `<tr><td colspan="11" style="text-align: center; padding: 30px;">Loading Abstract Report...</td></tr>`;

  try {
    const data = await apiFetch('/api/reports/abstract');
    tbody.innerHTML = '';

    let grandTotal = {
      total: 0, fir: 0, nc: 0, closed: 0, noAction: 0, withdraw: 0, process: 0, lost: 0, hold: 0
    };

    let currentSubDiv = null;
    let subDivTotal = { total: 0, fir: 0, closed: 0, process: 0, lost: 0, hold: 0 };

    data.rows.forEach(r => {
      // Sub-division header / rollup
      if (r.sub_division !== currentSubDiv) {
        if (currentSubDiv !== null) {
          // Print sub-division subtotal
          const subTr = document.createElement('tr');
          subTr.style.background = '#e2e8f0';
          subTr.style.fontWeight = '700';
          subTr.innerHTML = `
            <td colspan="2">${currentSubDiv} Sub-Total</td>
            <td>${subDivTotal.total}</td>
            <td style="color: #dc2626;">${subDivTotal.fir}</td>
            <td>-</td>
            <td style="color: #16a34a;">${subDivTotal.closed}</td>
            <td>-</td>
            <td>-</td>
            <td style="color: #d97706;">${subDivTotal.process}</td>
            <td>₹${subDivTotal.lost.toLocaleString('en-IN')}</td>
            <td>₹${subDivTotal.hold.toLocaleString('en-IN')}</td>
          `;
          tbody.appendChild(subTr);
        }
        currentSubDiv = r.sub_division;
        subDivTotal = { total: 0, fir: 0, closed: 0, process: 0, lost: 0, hold: 0 };

        const headerTr = document.createElement('tr');
        headerTr.style.background = '#1e3a8a';
        headerTr.style.color = 'white';
        headerTr.innerHTML = `<td colspan="11" style="font-weight: 700; padding: 8px 14px; text-transform: uppercase;">🔹 ${currentSubDiv}</td>`;
        tbody.appendChild(headerTr);
      }

      subDivTotal.total += r.total_cases;
      subDivTotal.fir += r.fir_count;
      subDivTotal.closed += r.closed_count;
      subDivTotal.process += r.under_process_count;
      subDivTotal.lost += (r.total_lost || 0);
      subDivTotal.hold += (r.total_hold || 0);

      grandTotal.total += r.total_cases;
      grandTotal.fir += r.fir_count;
      grandTotal.nc += r.nc_count;
      grandTotal.closed += r.closed_count;
      grandTotal.noAction += r.no_action_count;
      grandTotal.withdraw += r.withdrawal_count;
      grandTotal.process += r.under_process_count;
      grandTotal.lost += (r.total_lost || 0);
      grandTotal.hold += (r.total_hold || 0);

      const isMyStation = (currentUser && currentUser.role === 'station' && r.ps_name === currentUser.psName);
      const tr = document.createElement('tr');
      if (isMyStation) {
        tr.style.background = '#fef9c3';
        tr.style.outline = '2px solid #ca8a04';
      }
      tr.innerHTML = `
        <td>${r.sl_no}</td>
        <td>
          <strong>${r.ps_name}</strong>
          ${isMyStation ? '<span class="badge" style="background:#ca8a04; color:white; margin-left:6px;">⭐ YOUR STATION</span>' : ''}
          <span style="font-size: 0.72rem; color: #64748b;">(${r.circle})</span>
        </td>
        <td style="font-weight: 700;">${r.total_cases}</td>
        <td style="font-weight: 700; color: #dc2626;">${r.fir_count}</td>
        <td>${r.nc_count}</td>
        <td style="font-weight: 700; color: #16a34a;">${r.closed_count}</td>
        <td>${r.no_action_count}</td>
        <td>${r.withdrawal_count}</td>
        <td style="font-weight: 700; color: #d97706;">${r.under_process_count}</td>
        <td class="amount-loss">${r.total_lost > 0 ? '₹' + r.total_lost.toLocaleString('en-IN') : '-'}</td>
        <td class="amount-hold">${r.total_hold > 0 ? '₹' + r.total_hold.toLocaleString('en-IN') : '-'}</td>
      `;
      tbody.appendChild(tr);
    });

    // Last sub-division subtotal
    if (currentSubDiv !== null) {
      const subTr = document.createElement('tr');
      subTr.style.background = '#e2e8f0';
      subTr.style.fontWeight = '700';
      subTr.innerHTML = `
        <td colspan="2">${currentSubDiv} Sub-Total</td>
        <td>${subDivTotal.total}</td>
        <td style="color: #dc2626;">${subDivTotal.fir}</td>
        <td>-</td>
        <td style="color: #16a34a;">${subDivTotal.closed}</td>
        <td>-</td>
        <td>-</td>
        <td style="color: #d97706;">${subDivTotal.process}</td>
        <td>₹${subDivTotal.lost.toLocaleString('en-IN')}</td>
        <td>₹${subDivTotal.hold.toLocaleString('en-IN')}</td>
      `;
      tbody.appendChild(subTr);
    }

    // Grand total row (matches row 58 of spreadsheet!)
    const grandTr = document.createElement('tr');
    grandTr.style.background = '#0b1e3f';
    grandTr.style.color = '#fde047';
    grandTr.style.fontSize = '0.95rem';
    grandTr.style.fontWeight = '800';
    grandTr.innerHTML = `
      <td colspan="2" style="color: #fde047;">SRIKAKULAM DISTRICT GRAND TOTAL</td>
      <td style="color: white;">${grandTotal.total}</td>
      <td style="color: #f87171;">${grandTotal.fir}</td>
      <td style="color: white;">${grandTotal.nc}</td>
      <td style="color: #4ade80;">${grandTotal.closed}</td>
      <td style="color: white;">${grandTotal.noAction}</td>
      <td style="color: white;">${grandTotal.withdraw}</td>
      <td style="color: #fbbf24;">${grandTotal.process}</td>
      <td style="color: #fca5a5;">₹${grandTotal.lost.toLocaleString('en-IN')}</td>
      <td style="color: #86efac;">₹${grandTotal.hold.toLocaleString('en-IN')}</td>
    `;
    tbody.appendChild(grandTr);

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="11" style="text-align: center; color: #dc2626;">Error: ${err.message}</td></tr>`;
  }
}

// TAB 4: HOLD & REFUND STATUS
async function loadHoldRefundReport() {
  const tbody = document.getElementById('holdRefundTableBody');
  tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 30px;">Loading Hold & Refund Report...</td></tr>`;

  try {
    const data = await apiFetch('/api/reports/hold-refund');
    tbody.innerHTML = '';

    let grandTotal = {
      cases: 0, lost: 0, holdCases: 0, hold: 0, refundCases: 0, refund: 0
    };

    data.rows.forEach(r => {
      grandTotal.cases += r.total_cases;
      grandTotal.lost += (r.total_lost || 0);
      grandTotal.holdCases += r.hold_cases_count;
      grandTotal.hold += (r.total_hold || 0);
      grandTotal.refundCases += r.refund_cases_count;
      grandTotal.refund += (r.total_refund || 0);

      const percent = r.total_lost > 0 ? ((r.total_hold / r.total_lost) * 100).toFixed(1) + '%' : '0.0%';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.sl_no}</td>
        <td><strong>${r.ps_name}</strong> <span style="font-size: 0.72rem; color: #64748b;">(${r.circle})</span></td>
        <td>${r.total_cases}</td>
        <td class="amount-loss">₹${(r.total_lost || 0).toLocaleString('en-IN')}</td>
        <td style="font-weight: 600;">${r.hold_cases_count}</td>
        <td class="amount-hold">₹${(r.total_hold || 0).toLocaleString('en-IN')}</td>
        <td><span class="badge" style="background:#e0f2fe; color:#0369a1;">${percent}</span></td>
        <td>${r.refund_cases_count > 0 ? `<strong style="color: #16a34a;">${r.refund_cases_count}</strong>` : '0'}</td>
        <td style="font-weight: 700; color: #059669;">${r.total_refund > 0 ? '₹' + r.total_refund.toLocaleString('en-IN') : '-'}</td>
      `;
      tbody.appendChild(tr);
    });

    const grandPercent = grandTotal.lost > 0 ? ((grandTotal.hold / grandTotal.lost) * 100).toFixed(2) + '%' : '0.0%';
    const grandTr = document.createElement('tr');
    grandTr.style.background = '#0b1e3f';
    grandTr.style.color = '#fde047';
    grandTr.style.fontSize = '0.95rem';
    grandTr.style.fontWeight = '800';
    grandTr.innerHTML = `
      <td colspan="2" style="color: #fde047;">DISTRICT GRAND TOTAL</td>
      <td style="color: white;">${grandTotal.cases}</td>
      <td style="color: #fca5a5;">₹${grandTotal.lost.toLocaleString('en-IN')}</td>
      <td style="color: white;">${grandTotal.holdCases}</td>
      <td style="color: #86efac;">₹${grandTotal.hold.toLocaleString('en-IN')}</td>
      <td style="color: #fde047;">${grandPercent}</td>
      <td style="color: white;">${grandTotal.refundCases}</td>
      <td style="color: #86efac;">₹${grandTotal.refund.toLocaleString('en-IN')}</td>
    `;
    tbody.appendChild(grandTr);

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #dc2626;">Error: ${err.message}</td></tr>`;
  }
}

// TAB 5: MODUS OPERANDI GUIDE
function renderMOGuide() {
  const moList = [
    { title: 'Job Fraud (ఉద్యోగ మోసం)', icon: '💼', desc: 'Victim contacted on Telegram/WhatsApp offering part-time reviews, YouTube likes, or task bonuses.', action: 'Immediately send notice to Bank/Payment Gateway. Freeze beneficiary USDT/bank accounts.' },
    { title: 'OTP Fraud', icon: '📱', desc: 'Fraudsters impersonating bank officials call asking for OTP to stop unauthorized transaction or update card.', action: 'Trace transaction details through 1930 CDR/IP log. Obtain beneficiary statement under Section 91 CrPC.' },
    { title: 'Cyber Sextortion (వీడియో కాల్ బెదిరింపు)', icon: '📹', desc: 'Victim receives WhatsApp video call from nude individual; video recorded and blackmailed for extortion.', action: 'Counsel victim not to send any money. Block numbers. Issue notice to Meta/WhatsApp for IP details.' },
    { title: 'Digital Arrest (డిజిటల్ అరెస్ట్)', icon: '⚖️', desc: 'Fraudster impersonates CBI, Customs, Police or ED via Skype/video call claiming parcel seized with contraband.', action: 'Register FIR immediately if money transferred. Issue urgent lien request to recipient bank via 1930 portal.' },
    { title: 'Loan App Fraud (తప్పుడు రుణ యాప్)', icon: '💸', desc: 'Instant loan apps granting small loans and harassing victim by morphing photos and sending to contacts.', action: 'Report app to Google Play Store. Verify RBI non-banking financial company (NBFC) registration.' },
    { title: 'Investment & Trading Scam (పెట్టుబడి మోసం)', icon: '📈', desc: 'Promising 200%-500% returns on crypto, Forex, or institutional stock trading via bogus trading apps.', action: 'Freeze intermediary mule accounts. File Court Memo under 457 CrPC / 503 BNSS for refunding hold money.' },
    { title: 'Screen Sharing (AnyDesk / RustDesk)', icon: '🖥️', desc: 'Accused asks victim to install TeamViewer QuickSupport or AnyDesk under guise of technical assistance.', action: 'Gather IP address from session log. Advise complainant to factory reset infected smartphone/PC.' },
    { title: 'Fake Customer Care (తప్పుడు కస్టమర్ కేర్)', icon: '🎧', desc: 'Google search SEO poisoned customer care numbers for Swiggy, Zomato, SBI, Indian Post, courier apps.', action: 'Report fake contact details to Google for delisting. Track toll-free / mobile SIM CDR.' },
    { title: 'UPI Fraud (యూపీఐ మోసాలు)', icon: '💳', desc: 'Sending collect request or QR codes stating "Scan to receive payment".', action: 'Identify NPCI UPI reference ID (RRN). Request NPCI / Bank for immediate reversal.' },
    { title: 'SIM / KYC Update Fraud', icon: '📶', desc: 'SMS warning that SIM card will be deactivated unless e-KYC is completed via an APK link.', action: 'Check SIM swap history with telecom service provider (TSP). File complaint on NCRP portal.' }
  ];

  const grid = document.getElementById('moGuideGrid');
  grid.innerHTML = '';

  moList.forEach(m => {
    const card = document.createElement('div');
    card.style.background = '#f8fafc';
    card.style.border = '1px solid #e2e8f0';
    card.style.borderRadius = '8px';
    card.style.padding = '18px';
    card.style.borderTop = '3px solid #c59b27';
    card.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
        <span style="font-size: 1.4rem;">${m.icon}</span>
        <h4 style="font-size: 0.95rem; color: #0b1e3f; font-weight: 700;">${m.title}</h4>
      </div>
      <p style="font-size: 0.82rem; color: #475569; margin-bottom: 10px;">${m.desc}</p>
      <div style="background: white; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; font-size: 0.78rem;">
        <strong style="color: #1e3a8a;">Police Station Action:</strong> ${m.action}
      </div>
    `;
    grid.appendChild(card);
  });
}

// ==========================================
// DISTRICT POLICE SHEETS ENGINE (MASTER REPLICA)
// ==========================================

const HIERARCHY_CONFIG = [
  { type: 'station', sl: 1, name: 'Srikakulam I Town', circle: 'Srikakulam Rural Circle', sub: 'Srikakulam Sub-Division' },
  { type: 'station', sl: 2, name: 'Srikakulam Rural', circle: 'Srikakulam Rural Circle', sub: 'Srikakulam Sub-Division' },
  { type: 'station', sl: 3, name: 'Gara', circle: 'Srikakulam Rural Circle', sub: 'Srikakulam Sub-Division' },
  { type: 'circle_total', name: 'Srikakulam Rural Circle', sub: 'Srikakulam Sub-Division' },
  { type: 'station', sl: 4, name: 'Srikakulam II Town', circle: 'Srikakulam II Town Circle', sub: 'Srikakulam Sub-Division' },
  { type: 'station', sl: 5, name: 'Amadalavalasa', circle: 'Amadalavalasa Circle', sub: 'Srikakulam Sub-Division' },
  { type: 'station', sl: 6, name: 'Sarubujjili', circle: 'Amadalavalasa Circle', sub: 'Srikakulam Sub-Division' },
  { type: 'station', sl: 7, name: 'Burja', circle: 'Amadalavalasa Circle', sub: 'Srikakulam Sub-Division' },
  { type: 'station', sl: 8, name: 'Ponduru', circle: 'Amadalavalasa Circle', sub: 'Srikakulam Sub-Division' },
  { type: 'circle_total', name: 'Amadalavalasa Circle', sub: 'Srikakulam Sub-Division' },
  { type: 'station', sl: 9, name: 'J.R.Puram', circle: 'J.R.Puram Circle', sub: 'Srikakulam Sub-Division' },
  { type: 'station', sl: 10, name: 'Etcherla', circle: 'J.R.Puram Circle', sub: 'Srikakulam Sub-Division' },
  { type: 'station', sl: 11, name: 'Laveru', circle: 'J.R.Puram Circle', sub: 'Srikakulam Sub-Division' },
  { type: 'station', sl: 12, name: 'G. Sigadam', circle: 'J.R.Puram Circle', sub: 'Srikakulam Sub-Division' },
  { type: 'circle_total', name: 'J.R Puram Circle', sub: 'Srikakulam Sub-Division' },
  { type: 'subdiv_total', name: 'Srikakulam Sub-Division' },
  { type: 'station', sl: 13, name: 'Tekkali PS', circle: 'Tekkali PS Circle', sub: 'Tekkali Sub-Division' },
  { type: 'station', sl: 14, name: 'Santhabommali', circle: 'Tekkali Rural Circle', sub: 'Tekkali Sub-Division' },
  { type: 'station', sl: 15, name: 'Naupada', circle: 'Tekkali Rural Circle', sub: 'Tekkali Sub-Division' },
  { type: 'station', sl: 16, name: 'Kotabommali', circle: 'Tekkali Rural Circle', sub: 'Tekkali Sub-Division' },
  { type: 'station', sl: 17, name: 'Nandigam', circle: 'Tekkali Rural Circle', sub: 'Tekkali Sub-Division' },
  { type: 'circle_total', name: 'Tekkali Rural Circle', sub: 'Tekkali Sub-Division' },
  { type: 'station', sl: 18, name: 'Narasannapeta', circle: 'Narasannapeta Circle', sub: 'Tekkali Sub-Division' },
  { type: 'station', sl: 19, name: 'Jalumuru', circle: 'Narasannapeta Circle', sub: 'Tekkali Sub-Division' },
  { type: 'station', sl: 20, name: 'Polaki', circle: 'Narasannapeta Circle', sub: 'Tekkali Sub-Division' },
  { type: 'station', sl: 21, name: 'Saravakota', circle: 'Narasannapeta Circle', sub: 'Tekkali Sub-Division' },
  { type: 'circle_total', name: 'Narasannapeta Circle', sub: 'Tekkali Sub-Division' },
  { type: 'station', sl: 22, name: 'Pathapatnam', circle: 'Pathapatnam Circle', sub: 'Tekkali Sub-Division' },
  { type: 'station', sl: 23, name: 'Meliaputti', circle: 'Pathapatnam Circle', sub: 'Tekkali Sub-Division' },
  { type: 'circle_total', name: 'Pathapatnam Circle', sub: 'Tekkali Sub-Division' },
  { type: 'station', sl: 24, name: 'Kothuru', circle: 'Kothuru Circle', sub: 'Tekkali Sub-Division' },
  { type: 'station', sl: 25, name: 'Hiramandalam', circle: 'Kothuru Circle', sub: 'Tekkali Sub-Division' },
  { type: 'circle_total', name: 'Kothuru Circle', sub: 'Tekkali Sub-Division' },
  { type: 'subdiv_total', name: 'Tekkali Sub-Division' },
  { type: 'station', sl: 26, name: 'Kasibugga', circle: 'Kasibugga Circle', sub: 'Kasibugga Sub-Division' },
  { type: 'station', sl: 27, name: 'Vajrapukothuru', circle: 'Kasibugga Rural Circle', sub: 'Kasibugga Sub-Division' },
  { type: 'station', sl: 28, name: 'Mandasa', circle: 'Kasibugga Rural Circle', sub: 'Kasibugga Sub-Division' },
  { type: 'circle_total', name: 'Kasibugga Rural Circle', sub: 'Kasibugga Sub-Division' },
  { type: 'station', sl: 29, name: 'Sompeta', circle: 'Sompeta Circle', sub: 'Kasibugga Sub-Division' },
  { type: 'station', sl: 30, name: 'Kanchili', circle: 'Sompeta Circle', sub: 'Kasibugga Sub-Division' },
  { type: 'station', sl: 31, name: 'Baruva', circle: 'Sompeta Circle', sub: 'Kasibugga Sub-Division' },
  { type: 'circle_total', name: 'Sompeta Circle', sub: 'Kasibugga Sub-Division' },
  { type: 'station', sl: 32, name: 'Itchapuram Town', circle: 'Itchapuram Circle', sub: 'Kasibugga Sub-Division' },
  { type: 'station', sl: 33, name: 'Itchapuram Rural', circle: 'Itchapuram Circle', sub: 'Kasibugga Sub-Division' },
  { type: 'station', sl: 34, name: 'Kaviti', circle: 'Itchapuram Circle', sub: 'Kasibugga Sub-Division' },
  { type: 'circle_total', name: 'Itchapuram Circle', sub: 'Kasibugga Sub-Division' },
  { type: 'subdiv_total', name: 'Kasibugga Sub-Division' },
  { type: 'district_total', name: 'District Total' }
];

function getFilteredPetitionsForHierarchy(item, allPets) {
  if (item.type === 'station') {
    return allPets.filter(p => p.ps_name === item.name);
  }
  if (item.type === 'circle_total') {
    const stNames = HIERARCHY_CONFIG.filter(h => h.type === 'station' && (
      h.circle === item.name ||
      (item.name.includes('Amadalavalasa') && h.circle.includes('Amadalavalasa')) ||
      (item.name.includes('J.R') && h.circle.includes('J.R')) ||
      (item.name.includes('Tekkali Rural') && h.circle.includes('Tekkali Rural')) ||
      (item.name.includes('Narasannapeta') && h.circle.includes('Narasannapeta')) ||
      (item.name.includes('Kasibugga Rural') && h.circle.includes('Kasibugga Rural')) ||
      (item.name.includes('Sompeta') && h.circle.includes('Sompeta')) ||
      (item.name.includes('Itchapuram') && h.circle.includes('Itchapuram'))
    )).map(h => h.name);
    return allPets.filter(p => stNames.includes(p.ps_name));
  }
  if (item.type === 'subdiv_total') {
    const prefix = item.name.split(' ')[0].replace(',', '');
    const stNames = HIERARCHY_CONFIG.filter(h => h.type === 'station' && h.sub && h.sub.includes(prefix)).map(h => h.name);
    return allPets.filter(p => stNames.includes(p.ps_name));
  }
  if (item.type === 'district_total') {
    return allPets;
  }
  return [];
}

function renderHierarchyRowStyling(tr, item) {
  if (item.type === 'circle_total') {
    tr.style.background = '#f1f5f9';
    tr.style.fontWeight = '700';
    tr.style.color = '#1e293b';
  } else if (item.type === 'subdiv_total') {
    tr.style.background = '#e2e8f0';
    tr.style.fontWeight = '800';
    tr.style.color = '#0b1e3f';
    tr.style.borderTop = '2px solid #cbd5e1';
    tr.style.borderBottom = '2px solid #cbd5e1';
  } else if (item.type === 'district_total') {
    tr.style.background = '#0b1e3f';
    tr.style.color = '#ffffff';
    tr.style.fontWeight = '800';
  } else if (currentUser && currentUser.role === 'station' && item.name === currentUser.psName) {
    tr.style.background = '#fef9c3';
    tr.style.outline = '2px solid #ca8a04';
  }
}

// 1. STATUS WISE REPORT
async function loadStatusWiseReport() {
  const tbody = document.getElementById('statusWiseTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const pets = staticPetitions;

  HIERARCHY_CONFIG.forEach(item => {
    const pts = getFilteredPetitionsForHierarchy(item, pets);
    const tr = document.createElement('tr');
    renderHierarchyRowStyling(tr, item);

    const isStation = item.type === 'station';
    const isMyStation = isStation && currentUser && currentUser.role === 'station' && item.name === currentUser.psName;
    const nameLabel = isStation ? `<strong>${item.name}</strong> ${isMyStation ? '<span class="badge" style="background:#ca8a04; color:white; font-size:0.68rem; margin-left:4px;">YOUR PS</span>' : ''}` : `<strong>${item.name}</strong>`;

    tr.innerHTML = `
      <td>${isStation ? item.sl : ''}</td>
      <td>${nameLabel}</td>
      <td style="font-weight: 700;">${pts.length}</td>
      <td style="font-weight: 700; color: ${item.type === 'district_total' ? '#fca5a5' : '#dc2626'};">${pts.filter(p => p.status === 'FIR Registered').length}</td>
      <td>${pts.filter(p => p.status === 'Rejected').length}</td>
      <td>${pts.filter(p => p.status === 'NC Registered').length}</td>
      <td style="font-weight: 700; color: ${item.type === 'district_total' ? '#86efac' : '#16a34a'};">${pts.filter(p => p.status === 'Closed').length}</td>
      <td>${pts.filter(p => p.status === 'No Action' || p.status === 'No Action Needed').length}</td>
      <td>${pts.filter(p => p.status === 'Withdrawal').length}</td>
      <td style="font-weight: 700; color: ${item.type === 'district_total' ? '#fcd34d' : '#d97706'};">${pts.filter(p => p.status === 'Under Process').length}</td>
    `;
    tbody.appendChild(tr);
  });
}

// 2. TIMELINE & AGEING REPORT
async function loadTimelineReport() {
  const tbody = document.getElementById('timelineTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const pets = staticPetitions;

  HIERARCHY_CONFIG.forEach(item => {
    const pts = getFilteredPetitionsForHierarchy(item, pets);
    const up = pts.filter(p => p.status === 'Under Process');
    const tr = document.createElement('tr');
    renderHierarchyRowStyling(tr, item);

    const isStation = item.type === 'station';
    const isMyStation = isStation && currentUser && currentUser.role === 'station' && item.name === currentUser.psName;
    const nameLabel = isStation ? `<strong>${item.name}</strong> ${isMyStation ? '<span class="badge" style="background:#ca8a04; color:white; font-size:0.68rem; margin-left:4px;">YOUR PS</span>' : ''}` : `<strong>${item.name}</strong>`;

    tr.innerHTML = `
      <td>${isStation ? item.sl : ''}</td>
      <td>${nameLabel}</td>
      <td style="font-weight: 700;">${pts.length}</td>
      <td style="font-weight: 700; color: ${item.type === 'district_total' ? '#86efac' : '#16a34a'};">${pts.filter(p => p.status === 'Closed' || p.status === 'FIR Registered').length}</td>
      <td style="font-weight: 700; color: ${item.type === 'district_total' ? '#fcd34d' : '#d97706'};">${up.length}</td>
      <td>${up.filter(p => p.timeline_status === 'Below 1 Week').length}</td>
      <td>${up.filter(p => p.timeline_status === 'Below 2 Weeks').length}</td>
      <td>${up.filter(p => p.timeline_status === 'Below 1 Month').length}</td>
      <td style="color: ${item.type === 'district_total' ? '#ffffff' : '#d97706'};">${up.filter(p => p.timeline_status === 'Above 1 Month').length}</td>
      <td style="color: ${item.type === 'district_total' ? '#ffffff' : '#b45309'};">${up.filter(p => p.timeline_status === 'Above 2 Months').length}</td>
      <td style="font-weight: 700; color: ${item.type === 'district_total' ? '#fca5a5' : '#dc2626'};">${up.filter(p => p.timeline_status === 'Above 3 Months').length}</td>
    `;
    tbody.appendChild(tr);
  });
}

// 3. STATUS OF HOLD SLABS REPORT
async function loadHoldSlabsReport() {
  const tbody = document.getElementById('holdSlabsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const pets = staticPetitions;

  HIERARCHY_CONFIG.forEach(item => {
    const pts = getFilteredPetitionsForHierarchy(item, pets);
    const up = pts.filter(p => p.status === 'Under Process');
    const hc = up.filter(p => p.hold_amount > 0);
    const tr = document.createElement('tr');
    renderHierarchyRowStyling(tr, item);

    const isStation = item.type === 'station';
    const isMyStation = isStation && currentUser && currentUser.role === 'station' && item.name === currentUser.psName;
    const nameLabel = isStation ? `<strong>${item.name}</strong> ${isMyStation ? '<span class="badge" style="background:#ca8a04; color:white; font-size:0.68rem; margin-left:4px;">YOUR PS</span>' : ''}` : `<strong>${item.name}</strong>`;

    tr.innerHTML = `
      <td>${isStation ? item.sl : ''}</td>
      <td>${nameLabel}</td>
      <td style="font-weight: 700;">${up.length}</td>
      <td class="amount-loss">${up.reduce((s, p) => s + (p.lost_amount || 0), 0) > 0 ? '₹' + up.reduce((s, p) => s + (p.lost_amount || 0), 0).toLocaleString('en-IN') : '-'}</td>
      <td style="font-weight: 700;">${hc.length}</td>
      <td class="amount-loss">${hc.reduce((s, p) => s + (p.lost_amount || 0), 0) > 0 ? '₹' + hc.reduce((s, p) => s + (p.lost_amount || 0), 0).toLocaleString('en-IN') : '-'}</td>
      <td class="amount-hold" style="font-weight: 700;">${hc.reduce((s, p) => s + (p.hold_amount || 0), 0) > 0 ? '₹' + hc.reduce((s, p) => s + (p.hold_amount || 0), 0).toLocaleString('en-IN') : '-'}</td>
      <td>${hc.filter(p => p.hold_amount < 50000).length}</td>
      <td>${hc.filter(p => p.hold_amount >= 50000 && p.hold_amount <= 100000).length}</td>
      <td style="font-weight: 700; color: ${item.type === 'district_total' ? '#fcd34d' : '#b45309'};">${hc.filter(p => p.hold_amount > 100000).length}</td>
    `;
    tbody.appendChild(tr);
  });
}

// 4. LOST AMOUNT IN HOLD SLABS REPORT
async function loadLostSlabsReport() {
  const tbody = document.getElementById('lostSlabsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const pets = staticPetitions;

  HIERARCHY_CONFIG.forEach(item => {
    const pts = getFilteredPetitionsForHierarchy(item, pets);
    const up = pts.filter(p => p.status === 'Under Process');
    const hc = up.filter(p => p.hold_amount > 0);
    const tr = document.createElement('tr');
    renderHierarchyRowStyling(tr, item);

    const isStation = item.type === 'station';
    const isMyStation = isStation && currentUser && currentUser.role === 'station' && item.name === currentUser.psName;
    const nameLabel = isStation ? `<strong>${item.name}</strong> ${isMyStation ? '<span class="badge" style="background:#ca8a04; color:white; font-size:0.68rem; margin-left:4px;">YOUR PS</span>' : ''}` : `<strong>${item.name}</strong>`;

    tr.innerHTML = `
      <td>${isStation ? item.sl : ''}</td>
      <td>${nameLabel}</td>
      <td style="font-weight: 700;">${up.length}</td>
      <td class="amount-loss">${up.reduce((s, p) => s + (p.lost_amount || 0), 0) > 0 ? '₹' + up.reduce((s, p) => s + (p.lost_amount || 0), 0).toLocaleString('en-IN') : '-'}</td>
      <td style="font-weight: 700;">${hc.length}</td>
      <td class="amount-loss">${hc.reduce((s, p) => s + (p.lost_amount || 0), 0) > 0 ? '₹' + hc.reduce((s, p) => s + (p.lost_amount || 0), 0).toLocaleString('en-IN') : '-'}</td>
      <td class="amount-hold" style="font-weight: 700;">${hc.reduce((s, p) => s + (p.hold_amount || 0), 0) > 0 ? '₹' + hc.reduce((s, p) => s + (p.hold_amount || 0), 0).toLocaleString('en-IN') : '-'}</td>
      <td>${hc.filter(p => p.lost_amount < 50000).length}</td>
      <td>${hc.filter(p => p.lost_amount >= 50000 && p.lost_amount <= 100000).length}</td>
      <td>${hc.filter(p => p.lost_amount > 100000 && p.lost_amount <= 1000000).length}</td>
      <td style="font-weight: 700; color: ${item.type === 'district_total' ? '#fca5a5' : '#dc2626'};">${hc.filter(p => p.lost_amount > 1000000).length}</td>
    `;
    tbody.appendChild(tr);
  });
}

// 5. MO WISE MATRIX REPORT
const MO_WISE_COLUMNS = [
  'Credit Card Fraud', 'Cyber Sextortion', 'Dating Fraud', 'Digital Arrest', 'E commerse',
  'Fake CustomerCare', 'Fake Website', 'Gift Fraud', 'Investment', 'Job', 'Loan App',
  'Online Fraud', 'OTP Fraud', 'Part Time Job', 'Screenshare', 'Social Media', 'UPI Related Frauds'
];

async function loadMOWiseReport() {
  const thead = document.getElementById('moWiseTableHead');
  const tbody = document.getElementById('moWiseTableBody');
  if (!thead || !tbody) return;

  thead.innerHTML = `
    <tr>
      <th>S. No.</th>
      <th>Name of the PS</th>
      <th>Total</th>
      ${MO_WISE_COLUMNS.map(m => `<th>${m}</th>`).join('')}
      <th>Other / Blanks</th>
    </tr>
  `;
  tbody.innerHTML = '';
  const pets = staticPetitions;

  HIERARCHY_CONFIG.forEach(item => {
    const pts = getFilteredPetitionsForHierarchy(item, pets);
    const tr = document.createElement('tr');
    renderHierarchyRowStyling(tr, item);

    const isStation = item.type === 'station';
    const isMyStation = isStation && currentUser && currentUser.role === 'station' && item.name === currentUser.psName;
    const nameLabel = isStation ? `<strong>${item.name}</strong> ${isMyStation ? '<span class="badge" style="background:#ca8a04; color:white; font-size:0.68rem; margin-left:4px;">YOUR PS</span>' : ''}` : `<strong>${item.name}</strong>`;

    const counts = MO_WISE_COLUMNS.map(m => pts.filter(p => p.mo === m).length);
    const otherCount = pts.filter(p => !MO_WISE_COLUMNS.includes(p.mo)).length;

    tr.innerHTML = `
      <td>${isStation ? item.sl : ''}</td>
      <td style="white-space: nowrap;">${nameLabel}</td>
      <td style="font-weight: 700;">${pts.length}</td>
      ${counts.map(c => `<td>${c > 0 ? `<span class="badge badge-process" style="font-size:0.75rem;">${c}</span>` : '0'}</td>`).join('')}
      <td>${otherCount > 0 ? `<span class="badge badge-fir" style="font-size:0.75rem;">${otherCount}</span>` : '0'}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ==========================================
// FULL MULTI-SHEET EXCEL EXPORT (ALL 9 SHEETS)
// ==========================================

function exportExcelAllSheets() {
  if (typeof XLSX === 'undefined') {
    showToast('SheetJS library loading... please wait', 'warning');
    return;
  }

  showToast('Generating complete 9-sheet master Excel workbook...', 'info');

  let pets = staticPetitions;
  if (currentUser && currentUser.role === 'station') {
    pets = pets.filter(p => p.ps_name === currentUser.psName);
  }

  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toISOString().slice(0, 10);

  // 1. Total (24 Columns)
  const totalHeaders = [
    'SL NO', 'Date', 'Name of the PS', 'Circle Name', 'NCRP/1930', 'Acknowledgement No',
    'Complaint name & Ph no', 'Victim Age', 'Complainant Address', 'Category of Complaint',
    'Sub Category of Complaint', 'Lost Amount', 'Hold Amount', 'Status', 'Action taken by PS',
    'Date of Action', 'Whether FIR is Registered (Cr. No.)', 'Court Memo Filed for Refund in FIR Cases (Yes/No)',
    'Court Order Obtained or Not', 'No. of Days', 'Lost Amount Details', 'Hold Amount Details', 'Time Line', 'case type'
  ];
  const totalRows = pets.map((p, i) => [
    p.sl_no || (i + 1), p.petition_date || '', p.ps_name || '', p.circle_name || '', p.portal_type || 'NCRP', p.ack_no || '',
    ((p.complainant_name || '') + '\n' + (p.complainant_phone || '')).trim(), p.victim_age || '', p.complainant_address || '',
    p.category || 'Online Financial Fraud', p.sub_category || 'UPI Related Frauds',
    p.lost_amount || 0, p.hold_amount || 0, p.status || 'Under Process', p.action_taken || '', p.date_of_action || '',
    p.fir_number || '', p.court_memo_filed || 'No', p.court_order_obtained || 'No',
    p.no_of_days !== undefined ? p.no_of_days : '', p.loss_bucket || '', p.hold_bucket || '',
    p.timeline_status || '', p.mo || 'Other'
  ]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([totalHeaders, ...totalRows]), 'Total');

  // 2. Abstract
  const abstractRows = [
    ['From Date', '2026-01-01', 'To Date', dateStr, 'Type of Complainant', 'Total', 'Lost/Hold Amount', 'Total'],
    ['Status of NCRP/1930 Complaints As on ' + dateStr, 'Amount Wise', 'Total'],
    ['S. No.', 'Name of the PS', 'Total', 'FIR Registered', 'Rejected', 'NC Registered', 'Closed', 'No Action', 'Withdrawal', 'Under Process', 'Lost Amount (₹)', 'Hold Amount (₹)']
  ];
  HIERARCHY_CONFIG.forEach(item => {
    const pts = getFilteredPetitionsForHierarchy(item, pets);
    abstractRows.push([
      item.type === 'station' ? item.sl : '',
      item.name,
      pts.length,
      pts.filter(p => p.status === 'FIR Registered').length,
      pts.filter(p => p.status === 'Rejected').length,
      pts.filter(p => p.status === 'NC Registered').length,
      pts.filter(p => p.status === 'Closed').length,
      pts.filter(p => p.status === 'No Action' || p.status === 'No Action Needed').length,
      pts.filter(p => p.status === 'Withdrawal').length,
      pts.filter(p => p.status === 'Under Process').length,
      pts.reduce((s, p) => s + (p.lost_amount || 0), 0),
      pts.reduce((s, p) => s + (p.hold_amount || 0), 0)
    ]);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(abstractRows), 'Abstract');

  // 3. Status of Hold & Refund
  const holdRefundRows = [
    ['From Date', '2026-01-01', 'To Date', dateStr, 'Type of Complainant', 'Total'],
    ['Status of NCRP/1930 Complaints As on ' + dateStr],
    ['S. No.', 'Name of the PS', 'Total', 'Lost Amount', 'No. of Cases hold', 'Hold Amount', 'No. of Cases Refund Process completed', 'Refund Amount']
  ];
  HIERARCHY_CONFIG.forEach(item => {
    const pts = getFilteredPetitionsForHierarchy(item, pets);
    holdRefundRows.push([
      item.type === 'station' ? item.sl : '',
      item.name,
      pts.length,
      pts.reduce((s, p) => s + (p.lost_amount || 0), 0),
      pts.filter(p => p.hold_amount > 0).length,
      pts.reduce((s, p) => s + (p.hold_amount || 0), 0),
      pts.filter(p => p.refund_amount > 0).length,
      pts.reduce((s, p) => s + (p.refund_amount || 0), 0)
    ]);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(holdRefundRows), 'Status of Hold & Refund');

  // 4. Status Wise
  const statusWiseRows = [
    ['From Date', '2026-01-01', 'To Date', dateStr, 'Type of Complainant', 'Total'],
    ['Status of NCRP/1930 Complaints As on ' + dateStr],
    ['S. No.', 'Name of the PS', 'Total', 'FIR Registered', 'Rejected', 'NC Registered', 'Closed', 'No Action Needed', 'Withdrawal', 'Under Process']
  ];
  HIERARCHY_CONFIG.forEach(item => {
    const pts = getFilteredPetitionsForHierarchy(item, pets);
    statusWiseRows.push([
      item.type === 'station' ? item.sl : '',
      item.name,
      pts.length,
      pts.filter(p => p.status === 'FIR Registered').length,
      pts.filter(p => p.status === 'Rejected').length,
      pts.filter(p => p.status === 'NC Registered').length,
      pts.filter(p => p.status === 'Closed').length,
      pts.filter(p => p.status === 'No Action' || p.status === 'No Action Needed').length,
      pts.filter(p => p.status === 'Withdrawal').length,
      pts.filter(p => p.status === 'Under Process').length
    ]);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(statusWiseRows), 'Status Wise');

  // 5. Time Line
  const timelineRows = [
    ['From Date', '2026-01-01', 'To Date', dateStr, 'Type of Complainant', 'Total'],
    ['Status of Under Process Ack. of NCRP/1930 Complaints As on ' + dateStr],
    ['S. No.', 'Name of the PS', 'Total', 'Closed/FIR', 'Under Process', 'Below 1 Week', 'Below 2 Weeks', 'Below 1 Month', 'Above 1 Month', 'Above 2 Months', 'Above 3 Months']
  ];
  HIERARCHY_CONFIG.forEach(item => {
    const pts = getFilteredPetitionsForHierarchy(item, pets);
    const up = pts.filter(p => p.status === 'Under Process');
    timelineRows.push([
      item.type === 'station' ? item.sl : '',
      item.name,
      pts.length,
      pts.filter(p => p.status === 'Closed' || p.status === 'FIR Registered').length,
      up.length,
      up.filter(p => p.timeline_status === 'Below 1 Week').length,
      up.filter(p => p.timeline_status === 'Below 2 Weeks').length,
      up.filter(p => p.timeline_status === 'Below 1 Month').length,
      up.filter(p => p.timeline_status === 'Above 1 Month').length,
      up.filter(p => p.timeline_status === 'Above 2 Months').length,
      up.filter(p => p.timeline_status === 'Above 3 Months').length
    ]);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(timelineRows), 'Time Line');

  // 6. Status of Hold
  const holdSlabsRows = [
    ['From Date', '2026-01-01', 'To Date', dateStr, 'Type of Complainant', 'Total'],
    ['Status of Under Process Ack. of NCRP/1930 Complaints As on ' + dateStr],
    ['S. No.', 'Name of the PS', 'Under Process', 'Lost Amount', 'Hold Details', '', '', 'Hold Amount', '', ''],
    ['', '', '', '', 'No. of Ack.', 'Lost Amount', 'Hold Amount', 'Below 50,000', '50,000 - 1,00,000', 'Above 1,00,000']
  ];
  HIERARCHY_CONFIG.forEach(item => {
    const pts = getFilteredPetitionsForHierarchy(item, pets);
    const up = pts.filter(p => p.status === 'Under Process');
    const hc = up.filter(p => p.hold_amount > 0);
    holdSlabsRows.push([
      item.type === 'station' ? item.sl : '',
      item.name,
      up.length,
      up.reduce((s, p) => s + (p.lost_amount || 0), 0),
      hc.length,
      hc.reduce((s, p) => s + (p.lost_amount || 0), 0),
      hc.reduce((s, p) => s + (p.hold_amount || 0), 0),
      hc.filter(p => p.hold_amount < 50000).length,
      hc.filter(p => p.hold_amount >= 50000 && p.hold_amount <= 100000).length,
      hc.filter(p => p.hold_amount > 100000).length
    ]);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(holdSlabsRows), 'Status of Hold');

  // 7. Lost Amount In Hold
  const lostSlabsRows = [
    ['From Date', '2026-01-01', 'To Date', dateStr, 'Type of Complainant', 'Total'],
    ['Status of Under Process Ack. of NCRP/1930 Complaints As on ' + dateStr],
    ['S. No.', 'Name of the PS', 'Under Process', 'Lost Amount', 'Hold Details', '', '', 'Lost Amount', '', '', ''],
    ['', '', '', '', 'No. of Ack.', 'Lost Amount', 'Hold Amount', 'Below 50,000', '50,000 - 1,00,000', '1,00,000 to 10,00,000', 'Above 10,00,000']
  ];
  HIERARCHY_CONFIG.forEach(item => {
    const pts = getFilteredPetitionsForHierarchy(item, pets);
    const up = pts.filter(p => p.status === 'Under Process');
    const hc = up.filter(p => p.hold_amount > 0);
    lostSlabsRows.push([
      item.type === 'station' ? item.sl : '',
      item.name,
      up.length,
      up.reduce((s, p) => s + (p.lost_amount || 0), 0),
      hc.length,
      hc.reduce((s, p) => s + (p.lost_amount || 0), 0),
      hc.reduce((s, p) => s + (p.hold_amount || 0), 0),
      hc.filter(p => p.lost_amount < 50000).length,
      hc.filter(p => p.lost_amount >= 50000 && p.lost_amount <= 100000).length,
      hc.filter(p => p.lost_amount > 100000 && p.lost_amount <= 1000000).length,
      hc.filter(p => p.lost_amount > 1000000).length
    ]);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(lostSlabsRows), 'Lost Amount In Hold');

  // 8. MO Wise
  const moRows = [
    ['MO Wise Status of NCRP/1930 Complaints As on ' + dateStr],
    ['S. No.', 'Name of the PS', 'Total', ...MO_WISE_COLUMNS, 'Other / Blanks']
  ];
  HIERARCHY_CONFIG.forEach(item => {
    const pts = getFilteredPetitionsForHierarchy(item, pets);
    const counts = MO_WISE_COLUMNS.map(m => pts.filter(p => p.mo === m).length);
    const otherCount = pts.filter(p => !MO_WISE_COLUMNS.includes(p.mo)).length;
    moRows.push([
      item.type === 'station' ? item.sl : '',
      item.name,
      pts.length,
      ...counts,
      otherCount
    ]);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(moRows), 'MO Wise');

  // 9. Guide
  const guideRows = [
    ['Fill All Yellow colored head columns in DATA sheet'],
    [],
    ['S.No', 'MO', 'Action Taken (Update in Portal options)'],
    [1, 'Job / Part Time Job', 'Under process'],
    [2, 'OTP Fraud', 'closed'],
    [3, 'Screen Sharing (AnyDesk/TeamViewer)', 'rejected'],
    [4, 'KYC / SIM KYC', 'FIR registered'],
    [5, 'Fake Customer Care', 'NC Registered'],
    [6, 'Fake Website', 'No Action'],
    [7, 'Lottery / Gift Fraud', 'Withdrawal'],
    [8, 'Loan App Fraud', 'Under process'],
    [9, 'Digital Arrest', 'Under process / FIR registered'],
    [10, 'OLX / Fake Seller Fraud', 'closed'],
    [11, 'Sextortion / Video Call', 'FIR registered'],
    [12, 'Investment / Stock Market', 'Under process'],
    [13, 'UPI Related Frauds', 'Under process']
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(guideRows), 'Guide');

  XLSX.writeFile(wb, `Srikakulam_District_Police_NCRP_1930_Master_Sheets_${dateStr}.xlsx`);
  showToast('Downloaded all 9 sheets successfully in Master Excel Workbook!', 'success');
}

function exportSingleSheet(sheetName) {
  if (typeof XLSX === 'undefined') {
    showToast('SheetJS library loading... please wait', 'warning');
    return;
  }
  const dateStr = new Date().toISOString().slice(0, 10);
  const wb = XLSX.utils.book_new();

  let tableId = '';
  if (sheetName === 'Abstract') tableId = 'abstractTable';
  else if (sheetName === 'Status of Hold & Refund') tableId = 'holdRefundTable';
  else if (sheetName === 'Status Wise') tableId = 'statusWiseTable';
  else if (sheetName === 'Time Line') tableId = 'timelineTable';
  else if (sheetName === 'Status of Hold') tableId = 'holdSlabsTable';
  else if (sheetName === 'Lost Amount In Hold') tableId = 'lostSlabsTable';
  else if (sheetName === 'MO Wise') tableId = 'moWiseTable';

  const tableEl = document.getElementById(tableId);
  if (tableEl) {
    const ws = XLSX.utils.table_to_sheet(tableEl);
    XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
    XLSX.writeFile(wb, `Srikakulam_Police_${sheetName.replace(/\s+/g, '_')}_${dateStr}.xlsx`);
    showToast(`Exported ${sheetName} sheet to Excel!`, 'success');
  } else {
    exportExcelAllSheets();
  }
}

// TAB 7: ADMIN USERS
async function loadAdminUsers() {
  const tbody = document.getElementById('adminUsersTableBody');
  tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 30px;">Loading users list...</td></tr>`;

  try {
    const data = await apiFetch('/api/admin/users');
    tbody.innerHTML = '';

    data.users.forEach(u => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${u.id}</td>
        <td><code>${u.username}</code></td>
        <td><strong>${u.ps_name || u.display_name}</strong></td>
        <td>${u.circle || '-'}</td>
        <td>${u.sub_division || '-'}</td>
        <td><span class="badge ${u.role === 'admin' ? 'badge-fir' : 'badge-closed'}">${u.role.toUpperCase()}</span></td>
        <td>${u.last_login ? new Date(u.last_login).toLocaleString('en-IN') : '<em>Never</em>'}</td>
        <td>
          <button class="btn-secondary" style="padding: 4px 8px; font-size: 0.75rem;" onclick="adminResetPassword(${u.id}, '${u.username}')">
            Reset Password
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #dc2626;">Error: ${err.message}</td></tr>`;
  }
}

async function adminResetPassword(userId, username) {
  const newPass = prompt(`Enter new password for ${username}:`, 'Sklm@PS2026!');
  if (!newPass) return;

  try {
    const data = await apiFetch('/api/admin/reset-password', {
      method: 'POST',
      body: { userId, newPassword: newPass }
    });
    showToast(data.message, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// STATION STATEMENT (PDF / PRINT)
async function openStationStatementModal() {
  const modal = document.getElementById('stationStatementModal');
  modal.style.display = 'flex';

  let targetPS = '';
  let targetCircle = '';
  let targetSubDiv = '';

  if (currentUser && currentUser.role === 'station') {
    targetPS = currentUser.psName;
    targetCircle = currentUser.circle || '-';
    targetSubDiv = currentUser.subDivision || '-';
  } else {
    // Admin: check selected PS in filter or default to first station
    const filterPS = document.getElementById('filterPS').value;
    targetPS = filterPS || 'Srikakulam I Town';
    const found = allStationsList.find(s => s.name === targetPS);
    targetCircle = found ? found.circle : '-';
    targetSubDiv = found ? found.sub_division : '-';
  }

  // Update headers
  document.getElementById('stmtStationTitle').textContent = `OFFICE OF THE STATION HOUSE OFFICER, ${targetPS.toUpperCase()} POLICE STATION`;
  document.getElementById('stmtMetaPS').textContent = targetPS;
  document.getElementById('stmtMetaCircle').textContent = targetCircle;
  document.getElementById('stmtMetaSubDiv').textContent = targetSubDiv;
  document.getElementById('stmtMetaDate').textContent = new Date().toLocaleString('en-IN');
  document.querySelectorAll('.stmtSignPSName').forEach(el => el.textContent = targetPS);

  const tbody = document.getElementById('stmtTableBody');
  tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px;">Loading station petitions...</td></tr>';

  try {
    const data = await apiFetch(`/api/petitions?limit=1000&ps_name=${encodeURIComponent(targetPS)}`);
    const petitions = data.petitions;

    // Fill Summary KPI Box
    document.getElementById('stmtTotalPetitions').textContent = petitions.length;
    document.getElementById('stmtTotalLost').textContent = formatINR(data.totalLost);
    document.getElementById('stmtTotalHold').textContent = formatINR(data.totalHold);

    const firs = petitions.filter(p => p.status === 'FIR Registered').length;
    const closed = petitions.filter(p => p.status === 'Closed').length;
    const process = petitions.filter(p => p.status === 'Under Process').length;
    const refunds = petitions.reduce((acc, p) => acc + (p.refund_amount || 0), 0);

    document.getElementById('stmtFIRCount').textContent = firs;
    document.getElementById('stmtClosedCount').textContent = closed;
    document.getElementById('stmtProcessCount').textContent = process;
    document.getElementById('stmtRefundVal').textContent = formatINR(refunds);

    tbody.innerHTML = '';
    if (petitions.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px;">No petitions recorded for this police station.</td></tr>';
      return;
    }

    petitions.forEach((p, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="text-align: center;">${idx + 1}</td>
        <td style="white-space: nowrap;">${p.petition_date}</td>
        <td><strong>${p.ack_no}</strong></td>
        <td>
          <div>${p.complainant_name}</div>
          <div style="font-size: 7pt; color: #475569;">${p.complainant_phone || ''}</div>
        </td>
        <td>${p.mo || '-'}</td>
        <td style="font-weight: 600; text-align: right;">${p.lost_amount > 0 ? '₹' + p.lost_amount.toLocaleString('en-IN') : '-'}</td>
        <td style="font-weight: 600; text-align: right; color: #15803d;">${p.hold_amount > 0 ? '₹' + p.hold_amount.toLocaleString('en-IN') : '-'}</td>
        <td style="font-weight: 600;">${p.status}</td>
        <td style="color: #dc2626; font-weight: 700;">${p.fir_number || '-'}</td>
        <td style="font-size: 7.5pt; max-width: 260px;">${p.action_taken || '<em>Under enquiry</em>'}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: red;">Failed to load data: ${err.message}</td></tr>`;
  }
}

function closeStationStatementModal() {
  document.getElementById('stationStatementModal').style.display = 'none';
}

