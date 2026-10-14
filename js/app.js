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

// Static / GitHub Pages Mode State
const IS_STATIC_HOST = window.location.hostname.includes('github.io') || window.location.protocol === 'file:' || !window.location.port;
let staticDataLoaded = false;
let staticPetitions = [];
let staticStations = [];
let staticUsers = [];

async function ensureStaticData() {
  if (staticDataLoaded) return;
  try {
    const basePath = window.location.pathname.includes('/NCRP-1930-Petitions') ? './data/' : './data/';
    const [pRes, sRes, uRes] = await Promise.all([
      fetch(basePath + 'petitions.json').then(r => r.json()),
      fetch(basePath + 'stations.json').then(r => r.json()),
      fetch(basePath + 'users.json').then(r => r.json())
    ]);
    staticPetitions = pRes;
    staticStations = sRes;
    staticUsers = uRes;

    // Apply any saved local edits from browser localStorage
    const savedEdits = JSON.parse(localStorage.getItem('ncrp_local_edits') || '{}');
    staticPetitions.forEach(p => {
      if (savedEdits[p.id]) {
        Object.assign(p, savedEdits[p.id]);
      }
    });

    const addedPetitions = JSON.parse(localStorage.getItem('ncrp_local_added') || '[]');
    staticPetitions = [...addedPetitions, ...staticPetitions];

    staticDataLoaded = true;
  } catch (err) {
    console.warn('Could not load static data JSON:', err);
  }
}

// Client-side router for GitHub Pages
async function handleStaticApi(url, options = {}) {
  await ensureStaticData();
  const parsed = new URL(url, 'http://localhost');
  const pathname = parsed.pathname;
  const searchParams = parsed.searchParams;
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : {};

  // 1. Login
  if (pathname === '/api/auth/login' && method === 'POST') {
    let username = (body.username || '').trim().toLowerCase();
    const password = body.password || '';

    const aliases = {
      'srikakulamitown': 'srikakulam1town',
      'srikakulamiitown': 'srikakulam2town',
      'tekkali': 'tekkalips',
      'itchapuram': 'itchapuramtown',
      'mahilaps': 'mahilapssrikakulam',
      'traffic': 'srikakulamtraffic'
    };
    if (aliases[username]) username = aliases[username];

    const user = staticUsers.find(u => u.username.toLowerCase() === username);
    if (!user) {
      throw new Error('Invalid User ID / తప్పు యూజర్ ఐడీ');
    }

    // Default password checks
    let validPass = false;
    if (user.role === 'admin') {
      validPass = (password === 'Admin@SklmNCRP2026!' || password === 'Cyber@Sklm2026!');
    } else {
      validPass = (password === `${username}@skl26` || password === 'Sklm@PS2026!');
    }

    if (!validPass && password.length >= 6) {
      // allow custom password if changed in localStorage
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

    return {
      success: true,
      token,
      user: sessionUser
    };
  }

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

  // 8. Update Petition
  if (pathname.match(/^\/api\/petitions\/(\d+)$/) && method === 'PUT') {
    const id = parseInt(pathname.split('/')[3]);
    const pet = staticPetitions.find(p => p.id === id);
    if (!pet) throw new Error('Petition not found');

    Object.assign(pet, {
      status: body.status !== undefined ? body.status : pet.status,
      mo: body.mo !== undefined ? body.mo : pet.mo,
      action_taken: body.action_taken !== undefined ? body.action_taken : pet.action_taken,
      date_of_action: body.date_of_action !== undefined ? body.date_of_action : pet.date_of_action,
      fir_number: body.fir_number !== undefined ? body.fir_number : pet.fir_number,
      court_memo_filed: body.court_memo_filed !== undefined ? body.court_memo_filed : pet.court_memo_filed,
      court_order_obtained: body.court_order_obtained !== undefined ? body.court_order_obtained : pet.court_order_obtained,
      hold_amount: body.hold_amount !== undefined ? parseFloat(body.hold_amount) || 0 : pet.hold_amount,
      refund_amount: body.refund_amount !== undefined ? parseFloat(body.refund_amount) || 0 : pet.refund_amount,
      remarks: body.remarks !== undefined ? body.remarks : pet.remarks
    });

    // Save in localStorage
    const savedEdits = JSON.parse(localStorage.getItem('ncrp_local_edits') || '{}');
    savedEdits[id] = pet;
    localStorage.setItem('ncrp_local_edits', JSON.stringify(savedEdits));

    return { success: true, petition: pet, message: 'Petition updated successfully / పిటిషన్ విజయవంతంగా అప్‌డేట్ చేయబడింది' };
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
    btn.disabled = true;
    btn.textContent = 'Verifying credentials...';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      currentToken = data.token;
      localStorage.setItem('ncrp_token', currentToken);
      currentUser = data.user;
      showToast(`Welcome ${currentUser.displayName}!`, 'success');
      renderAuthenticatedUI();
    } catch (err) {
      showToast(err.message, 'error');
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

  // Edit Petition Form
  document.getElementById('editPetitionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editPetitionId').value;
    const saveBtn = document.getElementById('savePetitionBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving & Submitting...';

    const payload = {
      status: document.getElementById('editStatus').value,
      mo: document.getElementById('editMO').value,
      action_taken: document.getElementById('editActionTaken').value,
      date_of_action: document.getElementById('editDateOfAction').value,
      fir_number: document.getElementById('editFIRNumber').value,
      court_memo_filed: document.getElementById('editCourtMemo').value,
      court_order_obtained: document.getElementById('editCourtOrder').value,
      hold_amount: document.getElementById('editHoldAmount').value,
      refund_amount: document.getElementById('editRefundAmount').value,
      remarks: document.getElementById('editRemarks').value
    };

    try {
      const data = await apiFetch(`/api/petitions/${id}`, {
        method: 'PUT',
        body: payload
      });
      showToast(data.message || 'Action saved successfully!', 'success');
      closeEditModal();
      loadPetitions(currentPetitionsPage);
      loadKPISummary();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = '💾 Save & Submit Action (సమర్పించండి)';
    }
  });

  // New Petition Form
  document.getElementById('newPetitionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      ack_no: document.getElementById('newAckNo').value.trim(),
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
      showToast('New petition registered successfully!', 'success');
      closeNewModal();
      loadPetitions(1);
      loadKPISummary();
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
}

// Logout
function logout() {
  apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  localStorage.removeItem('ncrp_token');
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

// Load Petitions with filters
async function loadPetitions(page = 1) {
  currentPetitionsPage = page;
  const tbody = document.getElementById('petitionsTableBody');
  tbody.innerHTML = `<tr><td colspan="12" style="text-align: center; padding: 40px; color: #64748b;">Loading petitions...</td></tr>`;

  const search = document.getElementById('searchInput').value.trim();
  const status = document.getElementById('filterStatus').value;
  const mo = document.getElementById('filterMO').value;
  let ps = currentUser.role === 'station' ? currentUser.psName : document.getElementById('filterPS').value;

  const queryParams = new URLSearchParams({
    page,
    limit: currentPetitionsLimit,
    search,
    status,
    mo
  });

  if (ps) queryParams.set('ps_name', ps);

  try {
    const data = await apiFetch(`/api/petitions?${queryParams.toString()}`);
    renderPetitionsTable(data);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="12" style="text-align: center; color: #dc2626; padding: 30px;">Error loading petitions: ${err.message}</td></tr>`;
  }
}

function renderPetitionsTable(data) {
  const tbody = document.getElementById('petitionsTableBody');
  tbody.innerHTML = '';

  document.getElementById('showingCount').textContent = data.total.toLocaleString('en-IN');
  document.getElementById('filteredAmounts').innerHTML = `
    | Total Lost: <span class="amount-loss">${formatINR(data.totalLost)}</span>
    | Total Hold: <span class="amount-hold">${formatINR(data.totalHold)}</span>
  `;

  document.getElementById('currentPageNum').textContent = data.page;
  document.getElementById('totalPagesNum').textContent = data.totalPages || 1;

  if (data.petitions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="12" style="text-align: center; padding: 40px; color: #64748b;">No petitions found matching the criteria.</td></tr>`;
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
      <td>
        <span style="font-weight: 600; color: #dc2626;">${p.fir_number || '-'}</span>
      </td>
      <td style="max-width: 220px; font-size: 0.78rem; color: #475569;" title="${p.action_taken || ''}">
        ${p.action_taken ? (p.action_taken.length > 60 ? p.action_taken.slice(0, 60) + '...' : p.action_taken) : '<em style="color:#94a3b8">Pending</em>'}
      </td>
      <td style="text-align: center; white-space: nowrap;">
        <button class="action-btn-sm" onclick="openEditModal(${p.id})">
          ✏️ Edit Action
        </button>
      </td>
    `;
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
  if (currentUser.role === 'admin') {
    document.getElementById('filterPS').value = '';
  }
  loadPetitions(1);
}

// Export CSV
function exportCSV() {
  const search = document.getElementById('searchInput').value.trim();
  const ps = currentUser.role === 'station' ? currentUser.psName : document.getElementById('filterPS').value;
  const url = `/api/export/csv?ps_name=${encodeURIComponent(ps)}&search=${encodeURIComponent(search)}`;
  window.open(url, '_blank');
}

// Edit Modal Functions
async function openEditModal(petitionId) {
  try {
    const data = await apiFetch(`/api/petitions/${petitionId}`);
    const p = data.petition;

    document.getElementById('editPetitionId').value = p.id;
    document.getElementById('modalEditAckSub').textContent = `Ack No: ${p.ack_no} | Date: ${p.petition_date}`;
    document.getElementById('editPSName').value = `${p.ps_name} (${p.circle_name || ''})`;
    document.getElementById('editDate').value = p.petition_date;
    document.getElementById('editComplainant').value = `${p.complainant_name} ${p.complainant_phone ? '(' + p.complainant_phone + ')' : ''}`;
    document.getElementById('editAddress').value = p.complainant_address || '-';
    document.getElementById('editLostAmount').value = p.lost_amount ? '₹' + p.lost_amount.toLocaleString('en-IN') : '0';
    document.getElementById('editHoldAmount').value = p.hold_amount || 0;

    document.getElementById('editStatus').value = p.status || 'Under Process';
    document.getElementById('editMO').value = p.mo || 'UPI Fraud';
    document.getElementById('editDateOfAction').value = p.date_of_action || '';
    document.getElementById('editFIRNumber').value = p.fir_number || '';
    document.getElementById('editCourtMemo').value = p.court_memo_filed || 'No';
    document.getElementById('editCourtOrder').value = p.court_order_obtained || 'No';
    document.getElementById('editRefundAmount').value = p.refund_amount || 0;
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
  } else if (tabId === 'timelineTab') {
    loadTimelineReport();
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

// TAB 6: TIMELINE & AGING
async function loadTimelineReport() {
  const tbody = document.getElementById('timelineTableBody');
  tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 30px;">Loading Aging Petitions...</td></tr>`;

  try {
    const data = await apiFetch('/api/petitions?limit=100&status=Under Process');
    tbody.innerHTML = '';

    if (data.petitions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 30px; color: #16a34a;">No pending petitions found! Excellent performance.</td></tr>`;
      return;
    }

    data.petitions.slice(0, 50).forEach((p, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td><strong>${p.ack_no}</strong></td>
        <td><strong>${p.ps_name}</strong></td>
        <td>${p.complainant_name}</td>
        <td>${p.petition_date}</td>
        <td><span class="badge badge-fir">> 90 Days</span></td>
        <td class="amount-loss">${p.lost_amount > 0 ? '₹' + p.lost_amount.toLocaleString('en-IN') : '-'}</td>
        <td class="amount-hold">${p.hold_amount > 0 ? '₹' + p.hold_amount.toLocaleString('en-IN') : '-'}</td>
        <td><span class="badge badge-process">${p.status}</span></td>
        <td>
          <button class="action-btn-sm" onclick="openEditModal(${p.id})">
            Update Action
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: #dc2626;">Error: ${err.message}</td></tr>`;
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

