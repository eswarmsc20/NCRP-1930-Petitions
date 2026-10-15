import openpyxl
import os
import re
import json
import datetime

# Complete Police Station Map for Srikakulam District
STATION_MAP = {
    'AMADALAVALASA': ('Amadalavalasa', 'Amadalavalasa Circle', 'Srikakulam Sub-Division'),
    'BARUVA': ('Baruva', 'Sompeta Circle', 'Kasibugga Sub-Division'),
    'BATHILI': ('Batthili', 'Palakonda Circle', 'Palakonda Sub-Division'),
    'BATTLI': ('Batthili', 'Palakonda Circle', 'Palakonda Sub-Division'),
    'BURJA': ('Burja', 'Amadalavalasa Circle', 'Srikakulam Sub-Division'),
    'CCS SRIKAKULAM': ('CCS Srikakulam', 'CCS Circle', 'District HQ'),
    'CCS UPS': ('CCS UPS', 'CCS Circle', 'District HQ'),
    'DONUBAI': ('Donubai', 'Palakonda Circle', 'Palakonda Sub-Division'),
    'ETCHERLA': ('Etcherla', 'J.R.Puram Circle', 'Srikakulam Sub-Division'),
    'G. SIGADAM': ('G. Sigadam', 'J.R.Puram Circle', 'Srikakulam Sub-Division'),
    'GARA': ('Gara', 'Srikakulam Rural Circle', 'Srikakulam Sub-Division'),
    'HIRAMANDALM': ('Hiramandalam', 'Kothuru Circle', 'Tekkali Sub-Division'),
    'ICHAPURAM RURAL': ('Itchapuram Rural', 'Itchapuram Circle', 'Kasibugga Sub-Division'),
    'ICHAPURAM TOWN': ('Itchapuram Town', 'Itchapuram Circle', 'Kasibugga Sub-Division'),
    'J.R. PURAM': ('J.R.Puram', 'J.R.Puram Circle', 'Srikakulam Sub-Division'),
    'JALUMURU': ('Jalumuru', 'Narasannapeta Circle', 'Tekkali Sub-Division'),
    'KANCHILI': ('Kanchili', 'Sompeta Circle', 'Kasibugga Sub-Division'),
    'KASIBUGGA': ('Kasibugga', 'Kasibugga Circle', 'Kasibugga Sub-Division'),
    'KAVITI': ('Kaviti', 'Itchapuram Circle', 'Kasibugga Sub-Division'),
    'KOTABOMMALI': ('Kotabommali', 'Tekkali Rural Circle', 'Tekkali Sub-Division'),
    'KOTHURU': ('Kothuru', 'Kothuru Circle', 'Tekkali Sub-Division'),
    'LAVERU': ('Laveru', 'J.R.Puram Circle', 'Srikakulam Sub-Division'),
    'MANDASA': ('Mandasa', 'Kasibugga Rural Circle', 'Kasibugga Sub-Division'),
    'MELIAPUTTI': ('Meliaputti', 'Pathapatnam Circle', 'Tekkali Sub-Division'),
    'NANDIGAM': ('Nandigam', 'Tekkali Rural Circle', 'Tekkali Sub-Division'),
    'NARASANNAPETA': ('Narasannapeta', 'Narasannapeta Circle', 'Tekkali Sub-Division'),
    'NAUPADA': ('Naupada', 'Tekkali Rural Circle', 'Tekkali Sub-Division'),
    'PALAKONDA': ('Palakonda', 'Palakonda Circle', 'Palakonda Sub-Division'),
    'PATHAPATNAM': ('Pathapatnam', 'Pathapatnam Circle', 'Tekkali Sub-Division'),
    'POLAKI': ('Polaki', 'Narasannapeta Circle', 'Tekkali Sub-Division'),
    'PONDURU': ('Ponduru', 'Amadalavalasa Circle', 'Srikakulam Sub-Division'),
    'R - A - VALASA': ('Regidi Amadalavalasa', 'Rajam Circle', 'Palakonda Sub-Division'),
    'RAJAM': ('Rajam', 'Rajam Circle', 'Palakonda Sub-Division'),
    'RAJAM TOWN': ('Rajam', 'Rajam Circle', 'Palakonda Sub-Division'),
    'REGIDI AMADALAVALSA': ('Regidi Amadalavalasa', 'Rajam Circle', 'Palakonda Sub-Division'),
    'SANTHABOMMALI': ('Santhabommali', 'Tekkali Rural Circle', 'Tekkali Sub-Division'),
    'SANTHAKAVITI': ('Santhakaviti', 'Rajam Circle', 'Palakonda Sub-Division'),
    'SARAVAKOTA': ('Saravakota', 'Narasannapeta Circle', 'Tekkali Sub-Division'),
    'SARUBUJJILI': ('Sarubujjili', 'Amadalavalasa Circle', 'Srikakulam Sub-Division'),
    'SEETHAMPETA': ('Seethampeta', 'Palakonda Circle', 'Palakonda Sub-Division'),
    'SOMPETA': ('Sompeta', 'Sompeta Circle', 'Kasibugga Sub-Division'),
    'SRIKAKULAM I TOWN': ('Srikakulam I Town', 'Srikakulam Rural Circle', 'Srikakulam Sub-Division'),
    'SRIKAKULAM II TOWN': ('Srikakulam II Town', 'Srikakulam II Town Circle', 'Srikakulam Sub-Division'),
    'SRIKAKULAM RURAL': ('Srikakulam Rural', 'Srikakulam Rural Circle', 'Srikakulam Sub-Division'),
    'SRIKAKULAM TRAFFIC': ('Srikakulam Traffic', 'Traffic Circle', 'Srikakulam Sub-Division'),
    'TEKKALI PS': ('Tekkali PS', 'Tekkali PS Circle', 'Tekkali Sub-Division'),
    'VAJRAPUKOTHURU': ('Vajrapukothuru', 'Kasibugga Rural Circle', 'Kasibugga Sub-Division'),
    'VANGARA': ('Vangara', 'Rajam Circle', 'Palakonda Sub-Division'),
    'VEERAGHATTAM': ('Veeraghattam', 'Palakonda Circle', 'Palakonda Sub-Division')
}

def clean_phone(p):
    if not p: return ""
    p = str(p).strip().replace(".0", "")
    p = re.sub(r'[^0-9]', '', p)
    if len(p) > 10 and p.startswith('91'):
        p = p[2:]
    return p[:10]

def extract_amount(fa, cai):
    if fa is not None and str(fa).strip():
        try:
            val = float(str(fa).replace(',', '').strip())
            if val > 0:
                return val
        except:
            pass
    if not cai:
        return 0.0
    text = str(cai).lower()
    patterns = [
        r'(?:totally lossed|lossed|lost|paid|transferred|fraud of|debited|amount of|worth of|for rs\.?|rs\.?|inr)\s*:?\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]+)?)',
        r'([0-9]+(?:,[0-9]+)*(?:\.[0-9]+)?)\s*(?:rupees|rs|inr|\/-)'
    ]
    for p in patterns:
        m = re.search(p, text)
        if m:
            val_str = m.group(1).replace(',', '')
            try:
                v = float(val_str)
                if 10 <= v <= 10000000:
                    return v
            except:
                pass
    return 0.0

def derive_mo(category, sub_category, cai):
    cai_lower = (cai or "").lower()
    sub_lower = (sub_category or "").lower()
    
    if "part time" in cai_lower or "task" in cai_lower or "telegram" in cai_lower:
        return "Part Time Job / Task Fraud"
    if "trading" in cai_lower or "crypto" in cai_lower or "stock" in cai_lower or "investment" in cai_lower:
        return "Investment / Trading Fraud"
    if "fedex" in cai_lower or "courier" in cai_lower or "customs" in cai_lower or "digital arrest" in cai_lower or "cbi" in cai_lower or "police" in cai_lower:
        return "Digital Arrest / Courier Fraud"
    if "loan" in cai_lower or "loan" in sub_lower:
        return "Loan Fraud / Fake Loan App"
    if "olx" in cai_lower or "bike" in cai_lower:
        return "OLX / Second-hand Goods Fraud"
    if "job" in cai_lower or "job" in sub_lower or "data entry" in cai_lower:
        return "Job / Part Time Job Fraud"
    if "upi" in sub_lower or "phonepe" in cai_lower or "gpay" in cai_lower or "paytm" in cai_lower or "qr" in cai_lower:
        return "UPI / QR Code Fraud"
    if "card" in sub_lower or "debit" in sub_lower or "credit" in sub_lower or "sim swap" in sub_lower or "atm" in cai_lower:
        return "Card Fraud / SIM Swap"
    if "vishing" in sub_lower or "fraud call" in sub_lower or "call" in cai_lower:
        return "Fraud Call / Vishing"
    if "impersonat" in sub_lower or "fake profile" in cai_lower:
        return "Impersonation / Fake Profile"
    if "sexting" in sub_lower or "bullying" in sub_lower or "stalking" in sub_lower or "blackmail" in cai_lower or "nude" in cai_lower:
        return "Cyber Bullying / Sextortion"
    if "phishing" in sub_lower or "apk" in cai_lower or "link" in cai_lower:
        return "Phishing / Malicious Link"
    if "e-commerce" in cai_lower or "order" in cai_lower or "flipkart" in cai_lower or "amazon" in cai_lower or "snapdeal" in cai_lower:
        return "E-Commerce / Shopping Fraud"
    if "lottery" in cai_lower or "prize" in cai_lower or "reward" in cai_lower:
        return "Lottery / Prize Fraud"
    return sub_category or category or "Cyber Fraud"

def parse_action_date(val):
    if not val: return ""
    if isinstance(val, (datetime.datetime, datetime.date)):
        return val.strftime('%d-%m-%Y')
    s = str(val).strip()
    m = re.search(r'(\d{4})-(\d{2})-(\d{2})', s)
    if m:
        return f"{m.group(3)}-{m.group(2)}-{m.group(1)}"
    m2 = re.search(r'(\d{1,2})[/-](\d{1,2})[/-](\d{4})', s)
    if m2:
        return f"{int(m2.group(1)):02d}-{int(m2.group(2)):02d}-{m2.group(3)}"
    return ""

def parse_petition_date(val, default_year):
    if not val:
        dt = datetime.datetime(default_year, 1, 1)
        return dt.strftime('%d-%m-%Y'), dt
    if isinstance(val, (datetime.datetime, datetime.date)):
        dt = datetime.datetime(val.year, val.month, val.day)
        return dt.strftime('%d-%m-%Y'), dt
    s = str(val).strip()
    cleaned = ' '.join(s.split())
    formats = [
        '%d/%m/%Y', '%d-%m-%Y', '%Y-%m-%d',
        '%d/%m/%Y %H:%M:%S', '%d-%m-%Y %H:%M:%S', '%Y-%m-%d %H:%M:%S',
        '%d/%m/%Y %I:%M:%S %p', '%d-%m-%Y %I:%M:%S %p',
        '%d/%m/%Y %I:%M %p', '%d-%m-%Y %I:%M %p'
    ]
    for fmt in formats:
        try:
            dt = datetime.datetime.strptime(cleaned, fmt)
            return dt.strftime('%d-%m-%Y'), dt
        except:
            pass
    m = re.match(r'(\d{1,2})[/-](\d{1,2})[/-](\d{4})', cleaned)
    if m:
        try:
            dt = datetime.datetime(int(m.group(3)), int(m.group(2)), int(m.group(1)))
            return dt.strftime('%d-%m-%Y'), dt
        except:
            pass
    m2 = re.match(r'(\d{4})[/-](\d{1,2})[/-](\d{1,2})', cleaned)
    if m2:
        try:
            dt = datetime.datetime(int(m2.group(1)), int(m2.group(2)), int(m2.group(3)))
            return dt.strftime('%d-%m-%Y'), dt
        except:
            pass
    return s, datetime.datetime(default_year, 1, 1)

def parse_year_folder(base_path, year):
    ypath = os.path.join(base_path, str(year))
    if not os.path.exists(ypath):
        print(f"Directory not found: {ypath}")
        return []

    files = sorted([f for f in os.listdir(ypath) if f.endswith('.xlsx') and not f.startswith('.')])
    print(f"\nProcessing Year {year} ({len(files)} files)...")

    raw_records = []
    seen_acks = set()

    for f in files:
        fpath = os.path.join(ypath, f)
        wb = openpyxl.load_workbook(fpath, data_only=True)
        sheet = wb.active
        headers = None
        for row in sheet.iter_rows(values_only=True):
            if not any(row): continue
            if headers is None:
                if any('Acknowledgement' in str(c) for c in row if c is not None):
                    headers = {str(c).strip(): idx for idx, c in enumerate(row) if c is not None}
                continue
            ack = str(row[headers['Acknowledgement No.']]).strip() if row[headers['Acknowledgement No.']] is not None else ''
            if not ack or ack == 'None': continue
            if ack in seen_acks: continue
            seen_acks.add(ack)

            raw_ps = str(row[headers['Police Station']]).strip() if row[headers['Police Station']] is not None else ''
            cai = str(row[headers['Crime Aditional Information']]).strip() if row[headers['Crime Aditional Information']] is not None else ''
            cat = str(row[headers['Category']]).strip() if row[headers['Category']] is not None else ''
            subcat = str(row[headers['Sub Category']]).strip() if row[headers['Sub Category']] is not None else ''
            raw_st = str(row[headers['Status']]).strip() if row[headers['Status']] is not None else ''
            inc_dt = row[headers.get('Incident Date', -1)] if 'Incident Date' in headers else ''
            comp_dt = row[headers['Complaint Date']]
            last_act = row[headers['Last Action Taken on']]
            mobile = row[headers['Complainant Mobile No.']]
            fa = row[headers['Fraudulent Amount']]
            name = str(row[headers['Complainant Name']]).strip() if row[headers['Complainant Name']] is not None else ''
            addr = str(row[headers['Complainant Address']]).strip() if row[headers['Complainant Address']] is not None else ''

            raw_records.append({
                'ack': ack,
                'raw_ps': raw_ps,
                'cai': cai,
                'category': cat,
                'sub_category': subcat,
                'status': raw_st,
                'incident_date': inc_dt,
                'complaint_date': comp_dt,
                'last_action': last_act,
                'mobile': mobile,
                'fraud_amt': fa,
                'name': name,
                'address': addr,
                'source_file': f
            })

    print(f"Extracted {len(raw_records)} unique records for {year}.")

    # Sort chronologically by complaint date
    def sort_key(r):
        _, dt = parse_petition_date(r['complaint_date'], year)
        return dt

    raw_records.sort(key=sort_key)

    petitions = []
    for idx, r in enumerate(raw_records, 1):
        ack = r['ack']
        raw_ps_clean = r['raw_ps'].upper().strip()
        ps_info = STATION_MAP.get(raw_ps_clean, (r['raw_ps'].title(), f"{r['raw_ps'].title()} Circle", "Srikakulam Sub-Division"))

        ps_name, circle_name, sub_div = ps_info
        pet_date_str, comp_dt = parse_petition_date(r['complaint_date'], year)
        lost_amt = extract_amount(r['fraud_amt'], r['cai'])

        raw_status = r['status'].strip()
        status_lower = raw_status.lower()
        if status_lower in ['closed', 'close']:
            status = 'Closed'
            timeline = 'Resolved'
        elif status_lower in ['under process', 'underprocess', 'in progress']:
            status = 'Under Process'
            timeline = 'Above 3 Months'
        elif status_lower in ['withdrawal', 'withdrawn']:
            status = 'Withdrawal'
            timeline = 'Resolved'
        elif status_lower in ['rejected', 'reject']:
            status = 'Rejected'
            timeline = 'Rejected'
        elif status_lower in ['fir registered', 'fir']:
            status = 'FIR Registered'
            timeline = 'Above 3 Months'
        elif status_lower in ['no action', 'noaction']:
            status = 'No Action'
            timeline = 'Above 3 Months'
        else:
            status = raw_status.title() or 'Under Process'
            timeline = 'Above 3 Months'

        date_of_action = parse_action_date(r['last_action'])
        last_action_str = str(r['last_action']).strip() if r['last_action'] is not None else ""
        if last_action_str and last_action_str != 'None':
            action_taken = f"{status} on {last_action_str}"
        else:
            action_taken = status

        phone = clean_phone(r['mobile'])
        mo = derive_mo(r['category'], r['sub_category'], r['cai'])
        loss_bucket = "ABOVE 10L" if lost_amt >= 1000000 else "BELOW 10L"
        portal_type = "1930" if ack.startswith('3') else "NCRP"

        # Calculate days if action date available
        no_of_days = 0
        if date_of_action:
            try:
                ad = datetime.datetime.strptime(date_of_action, '%d-%m-%Y')
                diff = (ad - comp_dt).days
                no_of_days = max(0, diff)
            except:
                no_of_days = 0

        rec = {
            "sl_no": idx,
            "petition_date": pet_date_str,
            "ps_name": ps_name,
            "circle_name": circle_name,
            "sub_division": sub_div,
            "portal_type": portal_type,
            "ack_no": ack,
            "complainant_name": r['name'],
            "complainant_phone": phone,
            "victim_age": "",
            "complainant_address": r['address'],
            "category": r['category'],
            "sub_category": r['sub_category'],
            "lost_amount": round(lost_amt, 2),
            "hold_amount": 0,
            "refund_amount": 0,
            "status": status,
            "mo": mo,
            "action_taken": action_taken,
            "date_of_action": date_of_action,
            "fir_number": "",
            "court_memo_filed": "No",
            "court_order_obtained": "No",
            "remarks": r['cai'],
            "no_of_days": no_of_days,
            "timeline_status": timeline,
            "loss_bucket": loss_bucket,
            "hold_bucket": "No Hold",
            "year": year,
            "id": idx,
            "updated_by": None,
            "updated_at": f"{year}-12-31 00:00:00",
            "created_at": f"{year}-12-31 00:00:00"
        }
        petitions.append(rec)

    total_lost = sum(p['lost_amount'] for p in petitions)
    print(f"Completed {year}: {len(petitions)} records | Total Lost: Rs. {total_lost:,.2f}")
    return petitions

def main():
    base_path = '/Users/cybercommando/Desktop/ALL NCRP'
    years = [2021, 2022, 2023, 2024, 2025]

    for yr in years:
        data = parse_year_folder(base_path, yr)
        # Write to data/ and public/data/
        p1 = f'data/petitions_{yr}.json'
        p2 = f'public/data/petitions_{yr}.json'
        with open(p1, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        with open(p2, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Saved {p1} and {p2}")

if __name__ == '__main__':
    main()
