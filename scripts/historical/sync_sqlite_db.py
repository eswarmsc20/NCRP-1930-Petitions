import sqlite3
import json
import os

DB_PATH = 'data/ncrp.db'
JSON_PATH = 'data/petitions.json'

with open(JSON_PATH, 'r', encoding='utf-8') as f:
    petitions = json.load(f)

print(f"Loaded {len(petitions):,} petitions from {JSON_PATH}")

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# Drop and recreate petitions table with proper multi-year schema
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
for p in petitions:
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

c.execute("SELECT count(*), count(distinct year) FROM petitions")
total_inserted, distinct_years = c.fetchone()
print(f"SQLite Sync Complete: {total_inserted:,} petitions across {distinct_years} years successfully saved!")

c.execute("SELECT year, count(*) FROM petitions GROUP BY year ORDER BY year")
for yr, cnt in c.fetchall():
    print(f"  Year {yr}: {cnt:,} petitions")

conn.close()
