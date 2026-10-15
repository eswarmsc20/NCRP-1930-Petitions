import json
import sqlite3
import os
import datetime

years = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]

# Transferred to Vizianagaram / Parvathipuram Manyam in 2022 bifurcation
BIFURCATED_TRANSFERRED_STATIONS = {
    'palakonda',
    'rajam',
    'regidi amadalavalasa',
    'r - a - valasa',
    'regidi amadalavalsa',
    'vangara',
    'veeraghattam',
    'santhakaviti',
    'donubai',
    'batthili',
    'bathili',
    'battli',
    'seethampeta'
}

def parse_date(d_str):
    if not d_str:
        return datetime.datetime(2020, 1, 1)
    s = str(d_str).strip()
    import re
    m = re.match(r'(\d{1,2})[/-](\d{1,2})[/-](\d{4})', s)
    if m:
        try:
            return datetime.datetime(int(m.group(3)), int(m.group(2)), int(m.group(1)))
        except:
            pass
    m2 = re.match(r'(\d{4})[/-](\d{1,2})[/-](\d{1,2})', s)
    if m2:
        try:
            return datetime.datetime(int(m2.group(1)), int(m2.group(2)), int(m2.group(3)))
        except:
            pass
    return datetime.datetime(2020, 1, 1)

all_filtered_by_year = {}
grand_merged = []

print("Filtering bifurcated stations (keeping CCS UPS and official Srikakulam stations)...")

for yr in years:
    fpath = f'data/petitions_{yr}.json'
    with open(fpath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    filtered = []
    removed_count = 0
    
    for p in data:
        ps = p.get('ps_name', '').strip()
        
        # Handle empty ps_name
        if not ps:
            addr = p.get('complainant_address', '')
            if '532001' in addr:
                p['ps_name'] = 'Srikakulam I Town'
                p['circle_name'] = 'Srikakulam Rural Circle'
                p['sub_division'] = 'Srikakulam Sub-Division'
            elif '532407' in addr:
                p['ps_name'] = 'Gara'
                p['circle_name'] = 'Srikakulam Rural Circle'
                p['sub_division'] = 'Srikakulam Sub-Division'
            else:
                p['ps_name'] = 'CCS UPS'
                p['circle_name'] = 'CCS Circle'
                p['sub_division'] = 'District HQ'
            filtered.append(p)
            continue
            
        if ps.lower() in BIFURCATED_TRANSFERRED_STATIONS:
            removed_count += 1
            continue
            
        filtered.append(p)
        
    all_filtered_by_year[yr] = filtered
    print(f"  Year {yr}: {len(data)} total -> removed {removed_count} -> {len(filtered)} remaining")

# Combine all chronologically
global_id = 1
for yr in years:
    # Sort within year chronologically
    yr_list = all_filtered_by_year[yr]
    yr_list.sort(key=lambda x: parse_date(x.get('petition_date')))
    
    for p in yr_list:
        p['id'] = global_id
        p['sl_no'] = global_id
        p['year'] = yr
        global_id += 1
        grand_merged.append(p)
        
    # Save individual year json
    p1 = f'data/petitions_{yr}.json'
    p2 = f'public/data/petitions_{yr}.json'
    with open(p1, 'w', encoding='utf-8') as f:
        json.dump(yr_list, f, indent=2, ensure_ascii=False)
    with open(p2, 'w', encoding='utf-8') as f:
        json.dump(yr_list, f, indent=2, ensure_ascii=False)

print(f"\nTotal Grand Merged Petitions: {len(grand_merged):,}")
print(f"Serial Numbers Range: 1 to {len(grand_merged):,}")

# Save master files
with open('data/petitions.json', 'w', encoding='utf-8') as f:
    json.dump(grand_merged, f, indent=2, ensure_ascii=False)

with open('public/data/petitions.json', 'w', encoding='utf-8') as f:
    json.dump(grand_merged, f, indent=2, ensure_ascii=False)

print("Saved to data/petitions.json and public/data/petitions.json successfully!")

# Re-sync SQLite Database
DB_PATH = 'data/ncrp.db'
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

c.execute("DROP TABLE IF EXISTS petitions")
c.execute("""
CREATE TABLE petitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sl_no INTEGER,
    petition_date TEXT,
    ps_name TEXT NOT NULL,
    circle_name TEXT,
    sub_division TEXT,
    portal_type TEXT DEFAULT 'NCRP',
    ack_no TEXT NOT NULL,
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    year INTEGER,
    UNIQUE(ack_no, year)
)
""")

c.execute("CREATE INDEX IF NOT EXISTS idx_petitions_ps ON petitions(ps_name)")
c.execute("CREATE INDEX IF NOT EXISTS idx_petitions_status ON petitions(status)")
c.execute("CREATE INDEX IF NOT EXISTS idx_petitions_ack ON petitions(ack_no)")
c.execute("CREATE INDEX IF NOT EXISTS idx_petitions_date ON petitions(petition_date)")
c.execute("CREATE INDEX IF NOT EXISTS idx_petitions_mo ON petitions(mo)")
c.execute("CREATE INDEX IF NOT EXISTS idx_petitions_subdiv ON petitions(sub_division)")
c.execute("CREATE INDEX IF NOT EXISTS idx_petitions_year ON petitions(year)")

insert_sql = """
INSERT INTO petitions (
    id, sl_no, petition_date, ps_name, circle_name, sub_division,
    portal_type, ack_no, complainant_name, complainant_phone, victim_age,
    complainant_address, category, sub_category, lost_amount, hold_amount,
    refund_amount, status, mo, action_taken, date_of_action, fir_number,
    court_memo_filed, court_order_obtained, remarks, no_of_days, timeline_status,
    loss_bucket, hold_bucket, updated_by, updated_at, created_at, year
) VALUES (
    ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?
)
"""

rows = []
for p in grand_merged:
    rows.append((
        p.get('id'),
        p.get('sl_no'),
        p.get('petition_date'),
        p.get('ps_name'),
        p.get('circle_name'),
        p.get('sub_division'),
        p.get('portal_type', 'NCRP'),
        p.get('ack_no'),
        p.get('complainant_name'),
        p.get('complainant_phone'),
        p.get('victim_age', ''),
        p.get('complainant_address', ''),
        p.get('category', ''),
        p.get('sub_category', ''),
        p.get('lost_amount', 0),
        p.get('hold_amount', 0),
        p.get('refund_amount', 0),
        p.get('status', 'Under Process'),
        p.get('mo', 'Other'),
        p.get('action_taken', ''),
        p.get('date_of_action', ''),
        p.get('fir_number', ''),
        p.get('court_memo_filed', 'No'),
        p.get('court_order_obtained', 'No'),
        p.get('remarks', ''),
        p.get('no_of_days', 0),
        p.get('timeline_status', ''),
        p.get('loss_bucket', ''),
        p.get('hold_bucket', 'No Hold'),
        p.get('updated_by'),
        p.get('updated_at'),
        p.get('created_at'),
        p.get('year')
    ))

c.executemany(insert_sql, rows)
conn.commit()

c.execute("SELECT count(*), min(sl_no), max(sl_no) FROM petitions")
total_inserted, min_sl, max_sl = c.fetchone()
print(f"SQLite DB Updated: {total_inserted:,} petitions, S.No {min_sl} to {max_sl}")

conn.close()
