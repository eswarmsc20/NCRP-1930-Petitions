import json

# Read court_refunds.js and extract the FALLBACK_COURT_DATA
with open('js/court_refunds.js', 'r', encoding='utf-8') as f:
    content = f.read()

fallback_part = content.split('window.FALLBACK_COURT_DATA = ')[1].split(';\n\n// Srikakulam District Police')[0]

# Now let's write the complete, updated JavaScript logic with Add & Edit support
new_script = f"""window.FALLBACK_COURT_DATA = {fallback_part};

// Srikakulam District Police - Court Refund Memos & Orders Management System
// JavaScript Logic & State Management with Case Adding & Editing Support

let courtData = null;
let currentTab = 'casesView';
let activeFilters = {{
  search: '',
  subDivision: 'all',
  ps: 'all',
  year: 'all',
  memo: 'all',
  courtOrder: 'all',
  refundStatus: 'all',
  techAsst: 'all'
}};
let sortColumn = 's_no';
let sortDirection = 'asc';

// Currency Formatter in Indian Rupee format
function formatINR(amount) {{
  if (amount === undefined || amount === null || isNaN(amount) || amount === 0) return '₹0';
  const val = Math.round(Number(amount));
  return '₹' + val.toLocaleString('en-IN');
}}

function formatINRShort(amount) {{
  if (!amount || isNaN(amount) || amount === 0) return '₹0';
  const val = Number(amount);
  if (val >= 10000000) {{
    return '₹' + (val / 10000000).toFixed(2) + ' Cr';
  }} else if (val >= 100000) {{
    return '₹' + (val / 100000).toFixed(2) + ' L';
  }} else if (val >= 1000) {{
    return '₹' + (val / 1000).toFixed(1) + ' K';
  }}
  return '₹' + val.toLocaleString('en-IN');
}}

// Initializer
document.addEventListener('DOMContentLoaded', async () => {{
  await loadCourtData();
  setupEventListeners();
  populateFormStations();
  renderKPIs();
  populateDropdownFilters();
  renderCasesTable();
  renderAbstractTable();
}});

async function loadCourtData() {{
  try {{
    // Try fetching from data endpoint or local json
    const res = await fetch('data/court_refunds.json?v=' + Date.now());
    if (res.ok) {{
      courtData = await res.json();
    }} else {{
      const res2 = await fetch('./data/court_refunds.json?v=' + Date.now());
      if (res2.ok) courtData = await res2.json();
    }}
  }} catch (e) {{
    console.warn('Fetch note, using fallback if available:', e);
  }}

  if (!courtData && window.FALLBACK_COURT_DATA) {{
    courtData = JSON.parse(JSON.stringify(window.FALLBACK_COURT_DATA));
  }}

  // Check localStorage for persisted user edits or additions
  const localCases = localStorage.getItem('court_refund_cases_full');
  if (localCases && courtData) {{
    try {{
      const parsed = JSON.parse(localCases);
      if (Array.isArray(parsed) && parsed.length > 0) {{
        courtData.cases = parsed;
        recalculateCourtStats();
      }}
    }} catch (e) {{
      console.warn('Error reading court_refund_cases_full:', e);
    }}
  }}
}}

function setupEventListeners() {{
  // Search
  const searchInput = document.getElementById('courtSearchInput');
  if (searchInput) {{
    searchInput.addEventListener('input', (e) => {{
      activeFilters.search = e.target.value.trim().toLowerCase();
      renderCasesTable();
    }});
  }}

  // Filter Dropdowns
  const subDivSelect = document.getElementById('filterSubDivision');
  if (subDivSelect) {{
    subDivSelect.addEventListener('change', (e) => {{
      activeFilters.subDivision = e.target.value;
      populateStationDropdown();
      renderCasesTable();
    }});
  }}

  const psSelect = document.getElementById('filterPS');
  if (psSelect) {{
    psSelect.addEventListener('change', (e) => {{
      activeFilters.ps = e.target.value;
      renderCasesTable();
    }});
  }}

  const yearSelect = document.getElementById('filterYear');
  if (yearSelect) {{
    yearSelect.addEventListener('change', (e) => {{
      activeFilters.year = e.target.value;
      renderCasesTable();
    }});
  }}

  const memoSelect = document.getElementById('filterMemo');
  if (memoSelect) {{
    memoSelect.addEventListener('change', (e) => {{
      activeFilters.memo = e.target.value;
      renderCasesTable();
    }});
  }}

  const orderSelect = document.getElementById('filterOrder');
  if (orderSelect) {{
    orderSelect.addEventListener('change', (e) => {{
      activeFilters.courtOrder = e.target.value;
      renderCasesTable();
    }});
  }}

  const refundSelect = document.getElementById('filterRefund');
  if (refundSelect) {{
    refundSelect.addEventListener('change', (e) => {{
      activeFilters.refundStatus = e.target.value;
      renderCasesTable();
    }});
  }}

  const techSelect = document.getElementById('filterTech');
  if (techSelect) {{
    techSelect.addEventListener('change', (e) => {{
      activeFilters.techAsst = e.target.value;
      renderCasesTable();
    }});
  }}
}}

function switchView(tabId) {{
  currentTab = tabId;
  const casesTabBtn = document.getElementById('tabCasesBtn');
  const abstractTabBtn = document.getElementById('tabAbstractBtn');
  const casesSection = document.getElementById('casesSection');
  const abstractSection = document.getElementById('abstractSection');

  if (tabId === 'casesView') {{
    casesTabBtn.classList.add('active');
    abstractTabBtn.classList.remove('active');
    casesSection.style.display = 'block';
    abstractSection.style.display = 'none';
  }} else {{
    abstractTabBtn.classList.add('active');
    casesTabBtn.classList.remove('active');
    casesSection.style.display = 'none';
    abstractSection.style.display = 'block';
  }}
}}

function renderKPIs() {{
  if (!courtData || !courtData.summary) return;
  const s = courtData.summary;

  document.getElementById('kpiTotalCases').textContent = s.total_cases;
  document.getElementById('kpiTotalLost').textContent = formatINRShort(s.total_lost);
  document.getElementById('kpiTotalLostExact').textContent = formatINR(s.total_lost);
  document.getElementById('kpiTotalHold').textContent = formatINRShort(s.total_hold);
  document.getElementById('kpiTotalHoldExact').textContent = formatINR(s.total_hold);

  document.getElementById('kpiMemosFiled').textContent = `${{s.memos_filed_count}} / ${{s.total_cases}}`;
  document.getElementById('kpiMemoAmount').textContent = formatINRShort(s.memos_filed_amount);

  document.getElementById('kpiCourtOrders').textContent = s.court_orders_received_count;
  document.getElementById('kpiCourtOrdersAmount').textContent = formatINRShort(s.court_orders_amount);

  document.getElementById('kpiTotalRefunded').textContent = formatINRShort(s.total_refunded_amount);
  document.getElementById('kpiRefundCases').textContent = `${{s.refunded_total_cases}} Cases (${{s.refunded_full_cases}} Full, ${{s.refunded_partial_cases}} Partial)`;

  document.getElementById('kpiRefundPending').textContent = formatINRShort(s.refund_pending_amount);
  document.getElementById('kpiPendingCases').textContent = `${{s.refund_pending_cases}} Cases Awaiting Disbursement`;
}}

function populateDropdownFilters() {{
  if (!courtData || !courtData.cases) return;

  const techSet = new Set();
  const yearSet = new Set();
  courtData.cases.forEach(c => {{
    if (c.technical_asst) techSet.add(c.technical_asst.trim());
    if (c.year) yearSet.add(c.year);
  }});

  const techSelect = document.getElementById('filterTech');
  if (techSelect) {{
    const currentTech = activeFilters.techAsst;
    techSelect.innerHTML = '<option value="all">All Tech Assistants (అందరూ)</option>';
    const sortedTech = Array.from(techSet).sort();
    sortedTech.forEach(t => {{
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      if (t === currentTech) opt.selected = true;
      techSelect.appendChild(opt);
    }});
  }}

  const yearSelect = document.getElementById('filterYear');
  if (yearSelect) {{
    const currentYear = activeFilters.year;
    yearSelect.innerHTML = '<option value="all">All Years (2021-2026)</option>';
    const sortedYears = Array.from(yearSet).sort((a,b) => b - a);
    sortedYears.forEach(y => {{
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      if (String(y) === String(currentYear)) opt.selected = true;
      yearSelect.appendChild(opt);
    }});
  }}

  populateStationDropdown();
}}

function populateStationDropdown() {{
  if (!courtData || !courtData.cases) return;
  const psSelect = document.getElementById('filterPS');
  if (!psSelect) return;

  const currentVal = activeFilters.ps;
  psSelect.innerHTML = '<option value="all">All Police Stations (అన్ని పీఎస్‌లు)</option>';

  const psSet = new Set();
  courtData.cases.forEach(c => {{
    if (activeFilters.subDivision !== 'all') {{
      const subDiv = getSubDivisionForPS(c.police_station, c.circle);
      if (subDiv !== activeFilters.subDivision) return;
    }}
    if (c.police_station) psSet.add(c.police_station.trim());
  }});

  const sortedPS = Array.from(psSet).sort();
  sortedPS.forEach(ps => {{
    const opt = document.createElement('option');
    opt.value = ps;
    opt.textContent = ps;
    if (ps === currentVal) opt.selected = true;
    psSelect.appendChild(opt);
  }});
}}

function populateFormStations() {{
  const formPsSelect = document.getElementById('form_police_station');
  if (!formPsSelect) return;

  formPsSelect.innerHTML = '<option value="">Select Police Station</option>';

  const stations = (courtData && courtData.ps_mapping) ? courtData.ps_mapping : [
    {{ ps: 'Srikakulam I Town', circle: 'Srikakulam Rural Circle' }},
    {{ ps: 'Srikakulam Rural', circle: 'Srikakulam Rural Circle' }},
    {{ ps: 'Gara', circle: 'Srikakulam Rural Circle' }},
    {{ ps: 'Srikakulam II Town', circle: 'Srikakulam II Town Circle' }},
    {{ ps: 'Amadalavalasa', circle: 'Amadalavalasa Circle' }},
    {{ ps: 'Sarubujjili', circle: 'Amadalavalasa Circle' }},
    {{ ps: 'Burja', circle: 'Amadalavalasa Circle' }},
    {{ ps: 'Ponduru', circle: 'Amadalavalasa Circle' }},
    {{ ps: 'J.R.Puram', circle: 'J.R.Puram Circle' }},
    {{ ps: 'Etcherla', circle: 'J.R.Puram Circle' }},
    {{ ps: 'Laveru', circle: 'J.R.Puram Circle' }},
    {{ ps: 'G. Sigadam', circle: 'J.R.Puram Circle' }},
    {{ ps: 'Tekkali PS', circle: 'Tekkali PS Circle' }},
    {{ ps: 'Kotabommali', circle: 'Tekkali Rural Circle' }},
    {{ ps: 'Santhabommali', circle: 'Tekkali Rural Circle' }},
    {{ ps: 'Naupada', circle: 'Tekkali Rural Circle' }},
    {{ ps: 'Nandigam', circle: 'Tekkali Rural Circle' }},
    {{ ps: 'Narasannapeta', circle: 'Narasannapeta Circle' }},
    {{ ps: 'Jalumuru', circle: 'Narasannapeta Circle' }},
    {{ ps: 'Polaki', circle: 'Narasannapeta Circle' }},
    {{ ps: 'Saravakota', circle: 'Narasannapeta Circle' }},
    {{ ps: 'Kothuru', circle: 'Kothuru Circle' }},
    {{ ps: 'Hiramandalam', circle: 'Kothuru Circle' }},
    {{ ps: 'Pathapatnam', circle: 'Pathapatnam Circle' }},
    {{ ps: 'Meliaputti', circle: 'Pathapatnam Circle' }},
    {{ ps: 'Kasibugga', circle: 'Kasibugga Circle' }},
    {{ ps: 'Vajrapukothuru', circle: 'Kasibugga Rural Circle' }},
    {{ ps: 'Mandasa', circle: 'Kasibugga Rural Circle' }},
    {{ ps: 'Sompeta', circle: 'Sompeta Circle' }},
    {{ ps: 'Baruva', circle: 'Sompeta Circle' }},
    {{ ps: 'Kanchili', circle: 'Sompeta Circle' }},
    {{ ps: 'Itchapuram Town', circle: 'Itchapuram Circle' }},
    {{ ps: 'Itchapuram Rural', circle: 'Itchapuram Circle' }},
    {{ ps: 'Kaviti', circle: 'Itchapuram Circle' }}
  ];

  stations.forEach(st => {{
    const opt = document.createElement('option');
    opt.value = st.ps;
    opt.textContent = `${{st.ps}} (${{st.circle || ''}})`;
    formPsSelect.appendChild(opt);
  }});
}}

function handleFormStationChange() {{
  const ps = document.getElementById('form_police_station').value;
  const circleInput = document.getElementById('form_circle');
  if (!ps || !circleInput || !courtData || !courtData.ps_mapping) return;

  const found = courtData.ps_mapping.find(m => m.ps.toLowerCase() === ps.toLowerCase());
  if (found && found.circle) {{
    circleInput.value = found.circle;
  }}
}}

function getSubDivisionForPS(ps, circle) {{
  if (!courtData || !courtData.ps_mapping) {{
    if (circle && circle.includes('Tekkali')) return 'Tekkali Sub-Division';
    if (circle && (circle.includes('Kasibugga') || circle.includes('Sompeta') || circle.includes('Itchapuram'))) return 'Kasibugga Sub-Division';
    return 'Srikakulam Sub-Division';
  }}

  const found = courtData.ps_mapping.find(m => m.ps.toLowerCase() === (ps || '').toLowerCase());
  if (found && found.sub_division) return found.sub_division;

  if (circle) {{
    if (circle.includes('Tekkali') || circle.includes('Narasannapeta') || circle.includes('Pathapatnam') || circle.includes('Kothuru')) {{
      return 'Tekkali Sub-Division';
    }}
    if (circle.includes('Kasibugga') || circle.includes('Sompeta') || circle.includes('Itchapuram')) {{
      return 'Kasibugga Sub-Division';
    }}
  }}
  return 'Srikakulam Sub-Division';
}}

function filterCases() {{
  if (!courtData || !courtData.cases) return [];
  const q = activeFilters.search;

  return courtData.cases.filter(c => {{
    // Search filter across major fields
    if (q) {{
      const haystack = [
        c.s_no,
        c.police_station,
        c.circle,
        c.fir_no,
        c.year,
        c.sub_category,
        c.court_name,
        c.judge_name,
        c.technical_asst,
        c.stage_of_case,
        c.reasons_not_received,
        c.memo_filed_date_or_reason
      ].join(' ').toLowerCase();

      if (!haystack.includes(q)) return false;
    }}

    // Sub-division filter
    if (activeFilters.subDivision !== 'all') {{
      const subDiv = getSubDivisionForPS(c.police_station, c.circle);
      if (subDiv !== activeFilters.subDivision) return false;
    }}

    // Police Station filter
    if (activeFilters.ps !== 'all' && (c.police_station || '').trim() !== activeFilters.ps) {{
      return false;
    }}

    // Year filter
    if (activeFilters.year !== 'all' && String(c.year) !== String(activeFilters.year)) {{
      return false;
    }}

    // Memo Filed filter
    if (activeFilters.memo !== 'all') {{
      const isYes = (c.memo_filed || '').toLowerCase() === 'yes';
      if (activeFilters.memo === 'yes' && !isYes) return false;
      if (activeFilters.memo === 'no' && isYes) return false;
    }}

    // Court Order Received filter
    if (activeFilters.courtOrder !== 'all') {{
      const isYes = (c.court_order_received || '').toLowerCase() === 'yes';
      if (activeFilters.courtOrder === 'yes' && !isYes) return false;
      if (activeFilters.courtOrder === 'no' && isYes) return false;
    }}

    // Refund Status filter
    if (activeFilters.refundStatus !== 'all') {{
      const status = (c.amount_refunded_status || '').toLowerCase();
      if (activeFilters.refundStatus === 'yes' && status !== 'yes') return false;
      if (activeFilters.refundStatus === 'partial' && status !== 'partial') return false;
      if (activeFilters.refundStatus === 'no' && (status === 'yes' || status === 'partial')) return false;
    }}

    // Technical Assistant filter
    if (activeFilters.techAsst !== 'all' && (c.technical_asst || '').trim() !== activeFilters.techAsst) {{
      return false;
    }}

    return true;
  }});
}}

function sortCases(cases) {{
  return cases.sort((a, b) => {{
    let va = a[sortColumn];
    let vb = b[sortColumn];

    if (typeof va === 'number' && typeof vb === 'number') {{
      return sortDirection === 'asc' ? va - vb : vb - va;
    }}

    va = (va || '').toString().toLowerCase();
    vb = (vb || '').toString().toLowerCase();
    if (va < vb) return sortDirection === 'asc' ? -1 : 1;
    if (va > vb) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  }});
}}

function handleSort(col) {{
  if (sortColumn === col) {{
    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
  }} else {{
    sortColumn = col;
    sortDirection = 'asc';
  }}
  renderCasesTable();
}}

function renderCasesTable() {{
  const tbody = document.getElementById('casesTableBody');
  const countBadge = document.getElementById('casesCountBadge');
  if (!tbody) return;

  const filtered = filterCases();
  const sorted = sortCases(filtered);

  if (countBadge) {{
    countBadge.textContent = `Showing ${{sorted.length}} of ${{courtData ? courtData.cases.length : 83}} Cases`;
  }}

  if (sorted.length === 0) {{
    tbody.innerHTML = `
      <tr>
        <td colspan="24" style="text-align: center; padding: 40px; color: #64748b;">
          🔍 No court refund cases matched your filters.<br>
          <button class="btn-action" onclick="resetAllFilters()" style="margin-top: 10px;">Clear Filters</button>
        </td>
      </tr>
    `;
    return;
  }}

  let html = '';
  sorted.forEach(c => {{
    // Memo badge
    const memoYes = (c.memo_filed || '').toLowerCase() === 'yes';
    const memoBadge = memoYes 
      ? `<span class="badge badge-success">✓ Yes</span>`
      : `<span class="badge badge-danger">✗ No</span>`;

    // Order badge
    const orderYes = (c.court_order_received || '').toLowerCase() === 'yes';
    const orderBadge = orderYes
      ? `<span class="badge badge-success">✓ Received</span>`
      : `<span class="badge badge-warning">⏳ Pending</span>`;

    // Refund Status badge
    const refStatus = (c.amount_refunded_status || '').toLowerCase();
    let refBadge = `<span class="badge badge-secondary">Pending</span>`;
    if (refStatus === 'yes') {{
      refBadge = `<span class="badge badge-success">✓ Full</span>`;
    }} else if (refStatus === 'partial') {{
      refBadge = `<span class="badge badge-gold">⚡ Partial</span>`;
    }} else if (refStatus === 'no') {{
      refBadge = `<span class="badge badge-danger">✗ No</span>`;
    }}

    html += `
      <tr class="case-row" onclick="openCaseModal(${{c.s_no}})">
        <!-- 1. S No -->
        <td style="font-weight: 600; text-align: center;">${{c.s_no}}</td>

        <!-- 2. Circle -->
        <td style="font-size: 0.8rem; color: #475569; white-space: nowrap;">${{escapeHtml(c.circle || '-')}}</td>

        <!-- 3. Police Station -->
        <td style="font-weight: 700; color: #0f172a; white-space: nowrap;">${{escapeHtml(c.police_station)}}</td>

        <!-- 4. FIR No -->
        <td style="font-weight: 700; color: #1e3a8a; font-family: monospace; font-size: 0.88rem; white-space: nowrap;">${{escapeHtml(c.fir_no)}}</td>

        <!-- 5. Year -->
        <td style="text-align: center; font-weight: 600;">${{c.year}}</td>

        <!-- 6. Sub-Category -->
        <td><span class="category-tag">${{escapeHtml(c.sub_category || '-')}}</span></td>

        <!-- 7. Lost -->
        <td style="text-align: right; font-weight: 700; color: #b91c1c; font-family: monospace;">${{formatINR(c.lost)}}</td>

        <!-- 8. Lien -->
        <td style="text-align: right; font-weight: 700; color: #047857; font-family: monospace;">${{formatINR(c.lien)}}</td>

        <!-- 9. Memo Filed Yes or No? -->
        <td style="text-align: center;">${{memoBadge}}</td>

        <!-- 10. Memo Filed Amount -->
        <td style="text-align: right; font-weight: 600; color: #166534; font-family: monospace;">${{c.memo_filed_amount ? formatINR(c.memo_filed_amount) : '-'}}</td>

        <!-- 11. Memo Filed date / If Not Filed Reason for not filiing -->
        <td style="font-size: 0.78rem; max-width: 170px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${{escapeHtml(c.memo_filed_date_or_reason || '-')}}">${{escapeHtml(c.memo_filed_date_or_reason || '-')}}</td>

        <!-- 12. Court order Recieved Yes or No? -->
        <td style="text-align: center;">${{orderBadge}}</td>

        <!-- 13. Amount Refunded Yes or No or Partial ? -->
        <td style="text-align: center;">${{refBadge}}</td>

        <!-- 14. Amount for Which Court Order Was Issued -->
        <td style="text-align: right; font-weight: 600; color: #1d4ed8; font-family: monospace;">${{c.court_order_amount ? formatINR(c.court_order_amount) : '-'}}</td>

        <!-- 15. Refund From bank -->
        <td style="text-align: right; font-weight: 700; color: #15803d; font-family: monospace; background: rgba(34, 197, 94, 0.05); white-space: nowrap;">
          ${{c.refund_from_bank_display || (c.refund_from_bank ? formatINR(c.refund_from_bank) : '-')}}
        </td>

        <!-- 16. Funds not availble in banks -->
        <td style="text-align: right; font-weight: 600; color: #64748b; font-family: monospace;">${{c.funds_not_available ? formatINR(c.funds_not_available) : '-'}}</td>

        <!-- 17. To be refunded from Bank -->
        <td style="text-align: right; font-weight: 700; color: #dc2626; font-family: monospace; white-space: nowrap;">
          ${{c.to_be_refunded_from_bank_display || (c.to_be_refunded_from_bank ? formatINR(c.to_be_refunded_from_bank) : '0')}}
        </td>

        <!-- 18. COURT ORDER RECEIVED DATE -->
        <td style="font-size: 0.78rem; white-space: nowrap;">${{escapeHtml(c.court_order_date || '-')}}</td>

        <!-- 19. Reasons for not Receving Court orders -->
        <td style="font-size: 0.78rem; max-width: 190px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${{escapeHtml(c.reasons_not_received || '-')}}">${{escapeHtml(c.reasons_not_received || '-')}}</td>

        <!-- 20. Technical asst -->
        <td><span style="display: inline-block; padding: 2px 7px; background: #f1f5f9; border-radius: 4px; font-size: 0.75rem; font-weight: 600; color: #334155; white-space: nowrap;">${{escapeHtml(c.technical_asst || '-')}}</span></td>

        <!-- 21. Court name -->
        <td style="font-size: 0.8rem; font-weight: 600; color: #1e293b; white-space: nowrap;">${{escapeHtml(c.court_name || '-')}}</td>

        <!-- 22. Judge Name -->
        <td style="font-size: 0.8rem; color: #475569; white-space: nowrap;">${{escapeHtml(c.judge_name || '-')}}</td>

        <!-- 23. Stage of the case -->
        <td style="font-size: 0.78rem; font-weight: 600; color: #0369a1; white-space: nowrap;">${{escapeHtml(c.stage_of_case || '-')}}</td>

        <!-- Action Button -->
        <td style="text-align: center; position: sticky; right: 0; background: white; z-index: 5; white-space: nowrap;">
          <button class="btn-sm-view" onclick="event.stopPropagation(); openCaseModal(${{c.s_no}})" title="View Details">👁️</button>
          <button class="btn-sm-edit" onclick="event.stopPropagation(); openEditCaseModal(${{c.s_no}})" title="Edit Case 23 Columns">✏️ Edit</button>
        </td>
      </tr>
    `;
  }});

  tbody.innerHTML = html;
}}

function renderAbstractTable() {{
  const tbody = document.getElementById('abstractTableBody');
  if (!tbody || !courtData || !courtData.abstract) return;

  let html = '';
  courtData.abstract.forEach(r => {{
    let rowClass = '';
    let nameStyle = 'font-weight: 500;';
    let bgStyle = '';

    if (r.type === 'grand_total') {{
      rowClass = 'row-grand-total';
      nameStyle = 'font-weight: 800; font-size: 0.95rem; color: #854d0e;';
      bgStyle = 'background: #fef08a !important; border-top: 3px solid #ca8a04; border-bottom: 3px solid #ca8a04;';
    }} else if (r.type === 'sub_division_total') {{
      rowClass = 'row-subdivision';
      nameStyle = 'font-weight: 700; color: #0369a1; font-size: 0.9rem;';
      bgStyle = 'background: #e0f2fe !important; border-top: 2px solid #38bdf8;';
    }} else if (r.type === 'circle_total') {{
      rowClass = 'row-circle';
      nameStyle = 'font-weight: 600; color: #1e293b; font-style: italic;';
      bgStyle = 'background: #f8fafc; font-weight: 600;';
    }}

    html += `
      <tr class="${{rowClass}}" style="${{bgStyle}}">
        <td style="text-align: center; font-weight: 600;">${{r.sl_no || ''}}</td>
        <td style="${{nameStyle}}">${{escapeHtml(r.name)}}</td>
        <td style="text-align: center; font-weight: 700;">${{r.total_cases}}</td>
        <td style="text-align: right; color: #b91c1c; font-weight: 600;">${{formatINR(r.lost_amount)}}</td>
        <td style="text-align: right; color: #047857; font-weight: 600;">${{formatINR(r.hold_amount)}}</td>
        <td style="text-align: center; font-weight: 600;">${{r.memos_filed}}</td>
        <td style="text-align: right; color: #166534; font-weight: 600;">${{formatINR(r.memo_filed_amount)}}</td>
        <td style="text-align: center; color: #b45309; font-weight: 600;">${{r.memos_yet_to_file}}</td>
        <td style="text-align: center; font-weight: 600; color: #1d4ed8;">${{r.court_orders_received}}</td>
        <td style="text-align: right; color: #1e40af; font-weight: 600;">${{formatINR(r.court_orders_amount)}}</td>
        <td style="text-align: center; color: #dc2626; font-weight: 600;">${{r.court_orders_yet_to_receive}}</td>
        <td style="text-align: center; font-weight: 600;">${{r.refunded_full_count}}</td>
        <td style="text-align: center; font-weight: 600;">${{r.refunded_partial_count}}</td>
        <td style="text-align: right; color: #15803d; font-weight: 700;">${{formatINR(r.total_amount_refunded)}}</td>
        <td style="text-align: center; font-weight: 600; color: #b45309;">${{r.refund_pending_count}}</td>
        <td style="text-align: right; color: #dc2626; font-weight: 700;">${{formatINR(r.refund_pending_amount)}}</td>
      </tr>
    `;
  }});

  tbody.innerHTML = html;
}}

function openCaseModal(sNo) {{
  if (!courtData || !courtData.cases) return;
  const c = courtData.cases.find(x => Number(x.s_no) === Number(sNo));
  if (!c) return;

  const modal = document.getElementById('caseModal');
  const modalContent = document.getElementById('caseModalBody');
  if (!modal || !modalContent) return;

  const subDiv = getSubDivisionForPS(c.police_station, c.circle);

  modalContent.innerHTML = `
    <div class="modal-card">
      <div class="modal-case-header">
        <div>
          <span class="badge badge-primary">S.No ${{c.s_no}}</span>
          <h2 style="font-size: 1.4rem; color: #0b1e3f; margin: 4px 0;">FIR No: ${{escapeHtml(c.fir_no)}} (${{c.year}})</h2>
          <div style="color: #475569; font-size: 0.88rem;">
            <strong>${{escapeHtml(c.police_station)}} PS</strong> • ${{escapeHtml(c.circle)}} • <span style="color:#0284c7; font-weight:600;">${{subDiv}}</span>
          </div>
        </div>
        <div style="text-align: right;">
          <div class="category-tag-large">${{escapeHtml(c.sub_category || 'Cyber Fraud')}}</div>
          <div style="margin-top: 6px; font-size: 0.8rem; color: #64748b;">Stage: <strong>${{escapeHtml(c.stage_of_case || 'Investigation')}}</strong></div>
        </div>
      </div>

      <div class="grid-stats">
        <div class="stat-box stat-red">
          <div class="stat-label">Lost Amount (మోసపోయిన మొత్తం)</div>
          <div class="stat-val">${{formatINR(c.lost)}}</div>
        </div>
        <div class="stat-box stat-green">
          <div class="stat-label">Lien / Hold (హోల్డ్ మొత్తం)</div>
          <div class="stat-val">${{formatINR(c.lien)}}</div>
        </div>
        <div class="stat-box stat-blue">
          <div class="stat-label">Memo Filed Amount</div>
          <div class="stat-val">${{formatINR(c.memo_filed_amount)}}</div>
        </div>
        <div class="stat-box stat-gold">
          <div class="stat-label">Court Order Amount</div>
          <div class="stat-val">${{formatINR(c.court_order_amount)}}</div>
        </div>
      </div>

      <div class="detail-section">
        <h3 class="section-title">🏛️ Hon'ble Court & Memo Particulars</h3>
        <table class="detail-table">
          <tr>
            <td class="dt-label">Memo Filed Status:</td>
            <td class="dt-value">
              <strong>${{c.memo_filed}}</strong>
              ${{c.memo_filed_date_or_reason ? `<span style="color: #64748b; font-size: 0.85rem; margin-left: 8px;">(${{escapeHtml(c.memo_filed_date_or_reason)}})</span>` : ''}}
            </td>
          </tr>
          <tr>
            <td class="dt-label">Court Order Status:</td>
            <td class="dt-value">
              <strong>${{c.court_order_received}}</strong>
              ${{c.court_order_date ? `<span style="color: #64748b; font-size: 0.85rem; margin-left: 8px;">(Date: ${{escapeHtml(c.court_order_date)}})</span>` : ''}}
            </td>
          </tr>
          <tr>
            <td class="dt-label">Hon'ble Court:</td>
            <td class="dt-value"><strong>${{escapeHtml(c.court_name || 'Jurisdiction Magistrate Court')}}</strong></td>
          </tr>
          <tr>
            <td class="dt-label">Presiding Judge:</td>
            <td class="dt-value">${{escapeHtml(c.judge_name || '-')}}</td>
          </tr>
          <tr>
            <td class="dt-label">Assigned Technical Assistant:</td>
            <td class="dt-value"><strong>${{escapeHtml(c.technical_asst || 'District Cyber Cell')}}</strong></td>
          </tr>
          <tr>
            <td class="dt-label">Reasons / Remarks:</td>
            <td class="dt-value">${{escapeHtml(c.reasons_not_received || c.memo_filed_date_or_reason || 'None')}}</td>
          </tr>
        </table>
      </div>

      <div class="detail-section" style="margin-top: 15px;">
        <h3 class="section-title">💰 Bank Disbursement & Victim Refund Status</h3>
        <table class="detail-table">
          <tr>
            <td class="dt-label">Refund Status:</td>
            <td class="dt-value"><strong>${{escapeHtml(c.amount_refunded_status || 'Pending')}}</strong></td>
          </tr>
          <tr>
            <td class="dt-label">Refunded From Bank:</td>
            <td class="dt-value" style="color: #15803d; font-weight: 700; font-size: 1.05rem;">
              ${{formatINR(c.refund_from_bank)}}
              ${{c.refund_from_bank_display ? `<span style="color:#64748b; font-size:0.8rem; font-weight:normal; margin-left:6px;">(${{escapeHtml(c.refund_from_bank_display)}})</span>` : ''}}
            </td>
          </tr>
          <tr>
            <td class="dt-label">Funds Not Available in Bank:</td>
            <td class="dt-value">${{formatINR(c.funds_not_available)}}</td>
          </tr>
          <tr>
            <td class="dt-label">Balance To Be Refunded:</td>
            <td class="dt-value" style="color: #dc2626; font-weight: 700;">${{formatINR(c.to_be_refunded_from_bank)}}</td>
          </tr>
        </table>
      </div>

      <div style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 10px; flex-wrap: wrap;">
        <button class="btn-court-nav" onclick="deleteCase(${{c.s_no}})" style="background: #fee2e2; border-color: #ef4444; color: #b91c1c; font-weight: 700;">🗑️ Delete Case</button>
        <button class="btn-court-nav" onclick="closeCaseModal(); openEditCaseModal(${{c.s_no}})" style="background: #d97706; border-color: #b45309; color: #ffffff; font-weight: 700;">✏️ Edit Case Particulars</button>
        <button class="btn-court-nav" onclick="window.print()" style="background: #0284c7; border-color: #0369a1; color: white;">🖨️ Print Case Sheet</button>
        <button class="btn-court-nav" onclick="closeCaseModal()" style="background: #e2e8f0; color: #334155; border-color: #cbd5e1;">Close</button>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
}}

function closeCaseModal() {{
  const modal = document.getElementById('caseModal');
  if (modal) modal.style.display = 'none';
}}

// ==========================================
// ADD & EDIT CASE FUNCTIONS
// ==========================================

function openAddCaseModal() {{
  const modal = document.getElementById('caseFormModal');
  if (!modal) return;

  document.getElementById('form_edit_s_no').value = '';
  document.getElementById('caseFormBadge').textContent = '➕ New Entry';
  document.getElementById('caseFormTitle').textContent = 'Add New Court Refund Case / కొత్త కేసు నమోదు';

  // Next S.No
  const nextSNo = courtData.cases.reduce((max, c) => Math.max(max, Number(c.s_no) || 0), 0) + 1;
  document.getElementById('form_s_no').value = nextSNo;
  document.getElementById('form_police_station').value = '';
  document.getElementById('form_circle').value = '';
  document.getElementById('form_fir_no').value = '';
  document.getElementById('form_year').value = '2026';
  document.getElementById('form_sub_category').value = '';
  document.getElementById('form_lost').value = '';
  document.getElementById('form_lien').value = '';
  document.getElementById('form_memo_filed').value = 'Yes';
  document.getElementById('form_memo_filed_amount').value = '';
  document.getElementById('form_memo_filed_date_or_reason').value = '';
  document.getElementById('form_court_order_received').value = 'Yes';
  document.getElementById('form_amount_refunded_status').value = 'Yes';
  document.getElementById('form_court_order_amount').value = '';
  document.getElementById('form_refund_from_bank').value = '';
  document.getElementById('form_funds_not_available').value = '';
  document.getElementById('form_to_be_refunded_from_bank').value = '';
  document.getElementById('form_court_order_date').value = '';
  document.getElementById('form_reasons_not_received').value = '';
  document.getElementById('form_technical_asst').value = '';
  document.getElementById('form_court_name').value = '';
  document.getElementById('form_judge_name').value = '';
  document.getElementById('form_stage_of_case').value = 'UI';

  modal.style.display = 'flex';
}}

function openEditCaseModal(sNo) {{
  if (!courtData || !courtData.cases) return;
  const c = courtData.cases.find(x => Number(x.s_no) === Number(sNo));
  if (!c) return;

  const modal = document.getElementById('caseFormModal');
  if (!modal) return;

  document.getElementById('form_edit_s_no').value = c.s_no;
  document.getElementById('caseFormBadge').textContent = `✏️ Edit Case #${{c.s_no}}`;
  document.getElementById('caseFormTitle').textContent = `Edit Case #${{c.s_no}} - FIR ${{c.fir_no}} (${{c.police_station}})`;

  document.getElementById('form_s_no').value = c.s_no;
  document.getElementById('form_police_station').value = c.police_station || '';
  document.getElementById('form_circle').value = c.circle || '';
  document.getElementById('form_fir_no').value = c.fir_no || '';
  document.getElementById('form_year').value = c.year || '2026';
  document.getElementById('form_sub_category').value = c.sub_category || '';
  document.getElementById('form_lost').value = c.lost || '';
  document.getElementById('form_lien').value = c.lien || '';
  document.getElementById('form_memo_filed').value = (c.memo_filed && c.memo_filed.toLowerCase() === 'no') ? 'No' : 'Yes';
  document.getElementById('form_memo_filed_amount').value = c.memo_filed_amount || '';
  document.getElementById('form_memo_filed_date_or_reason').value = c.memo_filed_date_or_reason || '';
  document.getElementById('form_court_order_received').value = (c.court_order_received && c.court_order_received.toLowerCase() === 'no') ? 'No' : 'Yes';
  
  let refStat = 'Yes';
  if (c.amount_refunded_status) {{
    const s = c.amount_refunded_status.toLowerCase();
    if (s.includes('part')) refStat = 'Partial';
    else if (s === 'no') refStat = 'No';
  }}
  document.getElementById('form_amount_refunded_status').value = refStat;
  document.getElementById('form_court_order_amount').value = c.court_order_amount || '';
  document.getElementById('form_refund_from_bank').value = c.refund_from_bank_display || (c.refund_from_bank || '');
  document.getElementById('form_funds_not_available').value = c.funds_not_available || '';
  document.getElementById('form_to_be_refunded_from_bank').value = c.to_be_refunded_from_bank_display || (c.to_be_refunded_from_bank || '');
  document.getElementById('form_court_order_date').value = c.court_order_date || '';
  document.getElementById('form_reasons_not_received').value = c.reasons_not_received || '';
  document.getElementById('form_technical_asst').value = c.technical_asst || '';
  document.getElementById('form_court_name').value = c.court_name || '';
  document.getElementById('form_judge_name').value = c.judge_name || '';
  document.getElementById('form_stage_of_case').value = c.stage_of_case || '';

  modal.style.display = 'flex';
}}

function closeCaseFormModal() {{
  const modal = document.getElementById('caseFormModal');
  if (modal) modal.style.display = 'none';
}}

function parseAmountSafe(val) {{
  if (!val) return 0;
  const str = String(val).replace(/,/g, '').trim();
  const num = parseInt(str, 10);
  return isNaN(num) ? 0 : num;
}}

async function handleCaseFormSubmit(e) {{
  e.preventDefault();

  const editSNo = document.getElementById('form_edit_s_no').value;
  const sNo = editSNo ? parseInt(editSNo, 10) : (courtData.cases.reduce((max, c) => Math.max(max, Number(c.s_no) || 0), 0) + 1);

  const rawRefund = document.getElementById('form_refund_from_bank').value.trim();
  const rawPending = document.getElementById('form_to_be_refunded_from_bank').value.trim();

  const caseObj = {{
    'S No': String(sNo),
    's_no': sNo,
    'Circle': document.getElementById('form_circle').value.trim(),
    'circle': document.getElementById('form_circle').value.trim(),
    'POLICE STATION': document.getElementById('form_police_station').value.trim(),
    'police_station': document.getElementById('form_police_station').value.trim(),
    'FIR NO': document.getElementById('form_fir_no').value.trim(),
    'fir_no': document.getElementById('form_fir_no').value.trim(),
    'Year': document.getElementById('form_year').value,
    'year': parseInt(document.getElementById('form_year').value, 10),
    'Sub-Category': document.getElementById('form_sub_category').value.trim(),
    'sub_category': document.getElementById('form_sub_category').value.trim(),
    'Lost': document.getElementById('form_lost').value,
    'lost': parseAmountSafe(document.getElementById('form_lost').value),
    'lost_display': document.getElementById('form_lost').value,
    'Lien': document.getElementById('form_lien').value,
    'lien': parseAmountSafe(document.getElementById('form_lien').value),
    'lien_display': document.getElementById('form_lien').value,
    'Memo Filed Yes or No?': document.getElementById('form_memo_filed').value,
    'memo_filed': document.getElementById('form_memo_filed').value,
    'Memo Filed Amount': document.getElementById('form_memo_filed_amount').value,
    'memo_filed_amount': parseAmountSafe(document.getElementById('form_memo_filed_amount').value),
    'memo_filed_amount_display': document.getElementById('form_memo_filed_amount').value,
    'Memo Filed date / If Not Filed Reason for not filiing': document.getElementById('form_memo_filed_date_or_reason').value.trim(),
    'memo_filed_date_or_reason': document.getElementById('form_memo_filed_date_or_reason').value.trim(),
    'Court order Recieved Yes or No?': document.getElementById('form_court_order_received').value,
    'court_order_received': document.getElementById('form_court_order_received').value,
    'Amount Refunded Yes or No or Partial ?': document.getElementById('form_amount_refunded_status').value,
    'amount_refunded_status': document.getElementById('form_amount_refunded_status').value,
    'Amount for Which Court Order Was Issued': document.getElementById('form_court_order_amount').value,
    'court_order_amount': parseAmountSafe(document.getElementById('form_court_order_amount').value),
    'court_order_amount_display': document.getElementById('form_court_order_amount').value,
    'Refund From bank': rawRefund,
    'refund_from_bank': parseAmountSafe(rawRefund),
    'refund_from_bank_display': rawRefund,
    'Funds not availble in banks': document.getElementById('form_funds_not_available').value,
    'funds_not_available': parseAmountSafe(document.getElementById('form_funds_not_available').value),
    'funds_not_available_display': document.getElementById('form_funds_not_available').value,
    'To be refunded from Bank': rawPending,
    'to_be_refunded_from_bank': parseAmountSafe(rawPending),
    'to_be_refunded_from_bank_display': rawPending,
    'COURT ORDER RECEIVED DATE': document.getElementById('form_court_order_date').value.trim(),
    'court_order_date': document.getElementById('form_court_order_date').value.trim(),
    'Reasons for not Receving Court orders': document.getElementById('form_reasons_not_received').value.trim(),
    'reasons_not_received': document.getElementById('form_reasons_not_received').value.trim(),
    'Technical asst': document.getElementById('form_technical_asst').value.trim(),
    'technical_asst': document.getElementById('form_technical_asst').value.trim(),
    'Court name': document.getElementById('form_court_name').value.trim(),
    'court_name': document.getElementById('form_court_name').value.trim(),
    'Judge Name': document.getElementById('form_judge_name').value.trim(),
    'judge_name': document.getElementById('form_judge_name').value.trim(),
    'Stage of the case': document.getElementById('form_stage_of_case').value.trim(),
    'stage_of_case': document.getElementById('form_stage_of_case').value.trim()
  }};

  if (editSNo) {{
    const idx = courtData.cases.findIndex(c => Number(c.s_no) === sNo);
    if (idx !== -1) {{
      courtData.cases[idx] = caseObj;
    }}
  }} else {{
    courtData.cases.push(caseObj);
  }}

  // Persist to localStorage
  localStorage.setItem('court_refund_cases_full', JSON.stringify(courtData.cases));

  // Try saving to backend API if active
  try {{
    const method = editSNo ? 'PUT' : 'POST';
    const url = editSNo ? `/api/court-refunds/${{sNo}}` : '/api/court-refunds';
    fetch(url, {{
      method,
      headers: {{ 'Content-Type': 'application/json' }},
      body: JSON.stringify(caseObj)
    }}).catch(() => {{}});
  }} catch (err) {{}}

  recalculateCourtStats();
  renderKPIs();
  populateDropdownFilters();
  renderCasesTable();
  renderAbstractTable();
  closeCaseFormModal();

  showCourtToast(editSNo ? `✓ Case #${{sNo}} updated successfully!` : `✓ New Case #${{sNo}} added successfully!`, 'success');
}}

function deleteCase(sNo) {{
  if (!confirm(`Are you sure you want to delete Case #${{sNo}}? / ఈ కేసును తొలగించాలనుకుంటున్నారా?`)) return;

  courtData.cases = courtData.cases.filter(c => Number(c.s_no) !== Number(sNo));
  localStorage.setItem('court_refund_cases_full', JSON.stringify(courtData.cases));

  try {{
    fetch(`/api/court-refunds/${{sNo}}`, {{ method: 'DELETE' }}).catch(() => {{}});
  }} catch (err) {{}}

  recalculateCourtStats();
  renderKPIs();
  populateDropdownFilters();
  renderCasesTable();
  renderAbstractTable();
  closeCaseModal();

  showCourtToast(`Case #${{sNo}} removed successfully`, 'info');
}}

function recalculateCourtStats() {{
  if (!courtData || !courtData.cases) return;

  let totalLost = 0;
  let totalHold = 0;
  let memosFiledCount = 0;
  let memosFiledAmount = 0;
  let memosYetCount = 0;
  let ordersCount = 0;
  let ordersAmount = 0;
  let ordersYetCount = 0;
  let refFullCount = 0;
  let refPartialCount = 0;
  let refFullAmount = 0;
  let refPartialAmount = 0;
  let refTotalAmount = 0;
  let refPendingCount = 0;
  let refPendingAmount = 0;

  courtData.cases.forEach(c => {{
    const lost = Number(c.lost) || 0;
    const lien = Number(c.lien) || 0;
    const isMemo = (c.memo_filed || '').toLowerCase() === 'yes';
    const memoAmt = Number(c.memo_filed_amount) || 0;
    const isOrder = (c.court_order_received || '').toLowerCase() === 'yes';
    const orderAmt = Number(c.court_order_amount) || 0;
    const refStatus = (c.amount_refunded_status || '').toLowerCase();
    const refBank = Number(c.refund_from_bank) || 0;
    const pendingBank = Number(c.to_be_refunded_from_bank) || 0;

    totalLost += lost;
    totalHold += lien;
    if (isMemo) {{
      memosFiledCount++;
      memosFiledAmount += memoAmt;
    }} else {{
      memosYetCount++;
    }}

    if (isOrder) {{
      ordersCount++;
      ordersAmount += orderAmt;
    }} else {{
      ordersYetCount++;
    }}

    if (refStatus === 'yes') {{
      refFullCount++;
      refFullAmount += refBank;
    }} else if (refStatus === 'partial') {{
      refPartialCount++;
      refPartialAmount += refBank;
    }}

    refTotalAmount += refBank;

    if (pendingBank > 0 || (isOrder && refStatus !== 'yes')) {{
      refPendingCount++;
      refPendingAmount += pendingBank;
    }}
  }});

  courtData.summary = {{
    total_cases: courtData.cases.length,
    total_lost: totalLost,
    total_hold: totalHold,
    memos_filed_count: memosFiledCount,
    memos_filed_amount: memosFiledAmount,
    memos_yet_to_file_count: memosYetCount,
    court_orders_received_count: ordersCount,
    court_orders_amount: ordersAmount,
    court_orders_pending_count: ordersYetCount,
    refunded_full_cases: refFullCount,
    refunded_partial_cases: refPartialCount,
    refunded_total_cases: refFullCount + refPartialCount,
    amount_refunded_full: refFullAmount,
    amount_refunded_partial: refPartialAmount,
    total_refunded_amount: refTotalAmount,
    refund_pending_cases: refPendingCount,
    refund_pending_amount: refPendingAmount
  }};
}}

function showCourtToast(msg, type = 'success') {{
  const toast = document.getElementById('courtToast');
  const toastMsg = document.getElementById('courtToastMsg');
  if (!toast || !toastMsg) return;

  toastMsg.textContent = msg;
  toast.style.borderLeftColor = type === 'error' ? '#ef4444' : (type === 'info' ? '#3b82f6' : '#10b981');
  toast.style.display = 'flex';

  setTimeout(() => {{
    toast.style.display = 'none';
  }}, 3500);
}}

function resetAllFilters() {{
  activeFilters = {{
    search: '',
    subDivision: 'all',
    ps: 'all',
    year: 'all',
    memo: 'all',
    courtOrder: 'all',
    refundStatus: 'all',
    techAsst: 'all'
  }};

  const searchInput = document.getElementById('courtSearchInput');
  if (searchInput) searchInput.value = '';
  const subDivSelect = document.getElementById('filterSubDivision');
  if (subDivSelect) subDivSelect.value = 'all';
  const psSelect = document.getElementById('filterPS');
  if (psSelect) psSelect.value = 'all';
  const yearSelect = document.getElementById('filterYear');
  if (yearSelect) yearSelect.value = 'all';
  const memoSelect = document.getElementById('filterMemo');
  if (memoSelect) memoSelect.value = 'all';
  const orderSelect = document.getElementById('filterOrder');
  if (orderSelect) orderSelect.value = 'all';
  const refundSelect = document.getElementById('filterRefund');
  if (refundSelect) refundSelect.value = 'all';
  const techSelect = document.getElementById('filterTech');
  if (techSelect) techSelect.value = 'all';

  populateStationDropdown();
  renderCasesTable();
}}

function exportCourtCasesToCSV() {{
  if (!courtData || !courtData.cases) return;
  const filtered = filterCases();

  const headers = [
    'S.No', 'Sub-Division', 'Circle', 'Police Station', 'FIR No', 'Year', 'Crime Sub-Category',
    'Lost Amount', 'Lien Amount', 'Memo Filed', 'Memo Filed Amount', 'Memo Date or Reason',
    'Court Order Received', 'Refund Status', 'Court Order Amount', 'Refund From Bank',
    'Funds Not Available in Banks', 'To Be Refunded From Bank', 'Court Order Date',
    'Reasons for Not Receiving Court Order', 'Technical Assistant', 'Court Name', 'Judge Name', 'Stage of Case'
  ];

  let csvContent = '\\uFEFF' + headers.join(',') + '\\n';

  filtered.forEach(c => {{
    const subDiv = getSubDivisionForPS(c.police_station, c.circle);
    const row = [
      c.s_no,
      `"${{subDiv}}"`,
      `"${{c.circle || ''}}"`,
      `"${{c.police_station}}"`,
      `"${{c.fir_no}}"`,
      c.year,
      `"${{c.sub_category || ''}}"`,
      c.lost,
      c.lien,
      `"${{c.memo_filed}}"`,
      c.memo_filed_amount,
      `"${{(c.memo_filed_date_or_reason || '').replace(/"/g, '""')}}"`,
      `"${{c.court_order_received}}"`,
      `"${{c.amount_refunded_status}}"`,
      c.court_order_amount,
      c.refund_from_bank,
      c.funds_not_available,
      c.to_be_refunded_from_bank,
      `"${{c.court_order_date || ''}}"`,
      `"${{(c.reasons_not_received || '').replace(/"/g, '""')}}"`,
      `"${{c.technical_asst || ''}}"`,
      `"${{(c.court_name || '').replace(/"/g, '""')}}"`,
      `"${{(c.judge_name || '').replace(/"/g, '""')}}"`,
      `"${{(c.stage_of_case || '').replace(/"/g, '""')}}"`
    ];
    csvContent += row.join(',') + '\\n';
  }});

  const blob = new Blob([csvContent], {{ type: 'text/csv;charset=utf-8;' }});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Srikakulam_Police_Court_Refund_Memos_83_Cases_${{new Date().toISOString().slice(0, 10)}}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}}

function escapeHtml(str) {{
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}}

window.openAddCaseModal = openAddCaseModal;
window.openEditCaseModal = openEditCaseModal;
window.closeCaseFormModal = closeCaseFormModal;
window.handleCaseFormSubmit = handleCaseFormSubmit;
window.handleFormStationChange = handleFormStationChange;
window.deleteCase = deleteCase;
"""

with open('js/court_refunds.js', 'w', encoding='utf-8') as f:
    f.write(new_script)

with open('public/js/court_refunds.js', 'w', encoding='utf-8') as f:
    f.write(new_script)

print("Updated js/court_refunds.js and public/js/court_refunds.js successfully!")
