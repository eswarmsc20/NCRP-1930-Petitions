import csv
import json
import re
import datetime

# Station mappings to Circle and Sub-Division
STATION_MAP = {
    "AMADALAVALASA": ("Amadalavalasa", "Amadalavalasa Circle", "Srikakulam Sub-Division"),
    "BURJA": ("Burja", "Amadalavalasa Circle", "Srikakulam Sub-Division"),
    "CCS UPS": ("CCS UPS", "CCS Circle", "District HQ"),
    "ETCHERLA": ("Etcherla", "J.R.Puram Circle", "Srikakulam Sub-Division"),
    "G. SIGADAM": ("G. Sigadam", "J.R.Puram Circle", "Srikakulam Sub-Division"),
    "HIRAMANDALM": ("Hiramandalam", "Kothuru Circle", "Tekkali Sub-Division"),
    "ICHAPURAM RURAL": ("Itchapuram Rural", "Itchapuram Circle", "Kasibugga Sub-Division"),
    "ICHAPURAM TOWN": ("Itchapuram Town", "Itchapuram Circle", "Kasibugga Sub-Division"),
    "J.R. PURAM": ("J.R.Puram", "J.R.Puram Circle", "Srikakulam Sub-Division"),
    "JALUMURU": ("Jalumuru", "Narasannapeta Circle", "Tekkali Sub-Division"),
    "KASIBUGGA": ("Kasibugga", "Kasibugga Circle", "Kasibugga Sub-Division"),
    "KAVITI": ("Kaviti", "Itchapuram Circle", "Kasibugga Sub-Division"),
    "KOTABOMMALI": ("Kotabommali", "Tekkali Rural Circle", "Tekkali Sub-Division"),
    "KOTHURU": ("Kothuru", "Kothuru Circle", "Tekkali Sub-Division"),
    "MANDASA": ("Mandasa", "Kasibugga Rural Circle", "Kasibugga Sub-Division"),
    "NANDIGAM": ("Nandigam", "Tekkali Rural Circle", "Tekkali Sub-Division"),
    "NARASANNAPETA": ("Narasannapeta", "Narasannapeta Circle", "Tekkali Sub-Division"),
    "PALAKONDA": ("Palakonda", "Palakonda Circle", "Palakonda Sub-Division"),
    "PATHAPATNAM": ("Pathapatnam", "Pathapatnam Circle", "Tekkali Sub-Division"),
    "PONDURU": ("Ponduru", "Amadalavalasa Circle", "Srikakulam Sub-Division"),
    "R - A - Valasa": ("Regidi Amadalavalasa", "Rajam Circle", "Palakonda Sub-Division"),
    "RAJAM": ("Rajam", "Rajam Circle", "Palakonda Sub-Division"),
    "Rajam Town": ("Rajam", "Rajam Circle", "Palakonda Sub-Division"),
    "SANTHABOMMALI": ("Santhabommali", "Tekkali Rural Circle", "Tekkali Sub-Division"),
    "SARUBUJJILI": ("Sarubujjili", "Amadalavalasa Circle", "Srikakulam Sub-Division"),
    "SOMPETA": ("Sompeta", "Sompeta Circle", "Kasibugga Sub-Division"),
    "SRIKAKULAM I TOWN": ("Srikakulam I Town", "Srikakulam Rural Circle", "Srikakulam Sub-Division"),
    "SRIKAKULAM II TOWN": ("Srikakulam II Town", "Srikakulam II Town Circle", "Srikakulam Sub-Division"),
    "SRIKAKULAM RURAL": ("Srikakulam Rural", "Srikakulam Rural Circle", "Srikakulam Sub-Division"),
    "SRIKAKULAM TRAFFIC": ("Srikakulam Traffic", "Traffic Circle", "Srikakulam Sub-Division"),
    "Santhakaviti": ("Santhakaviti", "Rajam Circle", "Palakonda Sub-Division"),
    "Tekkali PS": ("Tekkali PS", "Tekkali PS Circle", "Tekkali Sub-Division"),
    "VAJRAPUKOTHURU": ("Vajrapukothuru", "Kasibugga Rural Circle", "Kasibugga Sub-Division"),
    "VANGARA": ("Vangara", "Rajam Circle", "Palakonda Sub-Division"),
    "Vangara": ("Vangara", "Rajam Circle", "Palakonda Sub-Division"),
    "VEERAGHATTAM": ("Veeraghattam", "Palakonda Circle", "Palakonda Sub-Division")
}

def clean_phone(p):
    if not p: return ""
    p = str(p).strip().replace(".0", "")
    p = re.sub(r'[^0-9]', '', p)
    if len(p) > 10 and p.startswith('91'):
        p = p[2:]
    return p[:10]

def extract_amount(fa, cai):
    if fa and fa.strip():
        try:
            return float(fa.replace(',', '').strip())
        except:
            pass
    text = cai.lower()
    
    # Specific targeted extractions for records without FA
    # Row with Master distribution LED lights
    if "master distribution for led lights" in text and "10,00,000" in text:
        return 1000000.0
    if "apollo hospital" in text and "40500" in text:
        return 45807.0
    if "shih tzu puppy" in text and "12,000" in text:
        return 12000.0
    if "sareebin" in text and "1039" in text:
        return 1039.0
    if "ultron mobile" in text and "4299" in text:
        return 4299.0
    if "sbi. i provided all my bank details he withdrew 40000 3 time" in text:
        return 120000.0
    if "paid him 18383 rupees" in text:
        return 18383.0
    if "army transportation charges" in text and "thirteen thousand" in text:
        return 13000.0
    if "ordered a girls dress top" in text and "1499" in text:
        return 1499.0
    if "teclast t30 android tab for 2500" in text:
        return 2500.0
    if "totally lossed rs76,100" in text:
        return 76100.0
    if "hcl" in text and "5600/- rs" in text:
        return 5600.0
    if "399 shopie.com" in text and "3090" in text:
        return 3090.0
    if "first i tried to transfer money to my brother through phonepe" in text and "17401" in text:
        return 17401.0
    if "when we try to transfer 200 rs" in text:
        return 200.0
    if "transaction on july 15 2020 from phonepe to flipkart amount 16999" in text:
        return 16999.0
    if "calling from delhi customs they asked to pay 2l 45thousand" in text:
        return 245000.0
    if "anjali fancy club" in text and "1200" in text:
        return 1200.0
    if "signed agreement cancel we have to pay 18990 ruppees" in text:
        return 18990.0

    # General regex
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
    cai_lower = cai.lower()
    sub_lower = sub_category.lower()
    if "loan" in cai_lower or "loan" in sub_lower:
        return "Loan Fraud / Fake Loan App"
    if "olx" in cai_lower or "bike" in cai_lower:
        return "OLX / Second-hand Goods Fraud"
    if "job" in cai_lower or "job" in sub_lower or "data entry" in cai_lower:
        return "Job / Part Time Job Fraud"
    if "upi" in sub_lower or "phonepe" in cai_lower or "gpay" in cai_lower or "paytm" in cai_lower:
        return "UPI / QR Code Fraud"
    if "card" in sub_lower or "debit" in sub_lower or "credit" in sub_lower or "sim swap" in sub_lower:
        return "Card Fraud / SIM Swap"
    if "vishing" in sub_lower or "fraud call" in sub_lower:
        return "Fraud Call / Vishing"
    if "impersonat" in sub_lower or "fake" in sub_lower or "profile" in sub_lower:
        return "Impersonation / Fake Profile"
    if "sexting" in sub_lower or "bullying" in sub_lower or "stalking" in sub_lower:
        return "Cyber Bullying / Sextortion"
    if "phishing" in sub_lower or "link" in cai_lower:
        return "Phishing / Malicious Link"
    if "e-commerce" in cai_lower or "order" in cai_lower or "flipkart" in cai_lower or "snapdeal" in cai_lower:
        return "E-Commerce / Shopping Fraud"
    return sub_category or category or "Cyber Fraud"

with open('data/raw_2020_batch1.csv', 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()

blocks, curr = [], []
for line in lines:
    if line.startswith('S No.,Acknowledgement No.'):
        if curr: blocks.append(curr); curr = []
    curr.append(line)
if curr: blocks.append(curr)

raw_records = []
for b in blocks:
    for r in csv.DictReader(b):
        if r.get('Acknowledgement No.'):
            raw_records.append(r)

print(f"Total raw records parsed: {len(raw_records)}")

# Parse date and sort chronologically
def get_complaint_dt(r):
    cd = r.get('Complaint Date', '').strip()
    try:
        return datetime.datetime.strptime(cd, '%d/%m/%Y')
    except:
        return datetime.datetime(2020, 1, 1)

raw_records.sort(key=get_complaint_dt)

petitions_2020 = []
for idx, r in enumerate(raw_records, 1):
    ack = r.get('Acknowledgement No.', '').strip()
    raw_ps = r.get('Police Station', '').strip()
    ps_info = STATION_MAP.get(raw_ps, (raw_ps.title(), f"{raw_ps.title()} Circle", "Srikakulam Sub-Division"))
    
    ps_name = ps_info[0]
    circle_name = ps_info[1]
    sub_div = ps_info[2]
    
    cd_str = r.get('Complaint Date', '').strip()
    try:
        dt = datetime.datetime.strptime(cd_str, '%d/%m/%Y')
        pet_date = dt.strftime('%d-%m-%Y')
    except:
        pet_date = cd_str.replace('/', '-')
        
    fa = r.get('Fraudulent Amount', '').strip()
    cai = r.get('Crime Aditional Information', '').strip()
    lost_amt = extract_amount(fa, cai)
    
    raw_status = r.get('Status', '').strip()
    if raw_status.lower() in ['closed', 'close']:
        status = 'Closed'
        timeline = 'Resolved'
    elif raw_status.lower() in ['under process', 'underprocess', 'in progress']:
        status = 'Under Process'
        timeline = 'In Progress'
    elif raw_status.lower() in ['withdrawal', 'withdrawn']:
        status = 'Withdrawal'
        timeline = 'Resolved'
    elif raw_status.lower() in ['rejected', 'reject']:
        status = 'Rejected'
        timeline = 'Rejected'
    else:
        status = raw_status.title() or 'Pending'
        timeline = 'Pending'
        
    last_action = r.get('Last Action Taken on', '').strip()
    date_of_action = ""
    if last_action:
        # e.g. 2021-01-22 12:47:09
        m = re.search(r'(\d{4})-(\d{2})-(\d{2})', last_action)
        if m:
            date_of_action = f"{m.group(3)}-{m.group(2)}-{m.group(1)}"
            
    cat = r.get('Category', '').strip()
    subcat = r.get('Sub Category', '').strip()
    mo = derive_mo(cat, subcat, cai)
    
    phone = clean_phone(r.get('Complainant Mobile No.', ''))
    name = r.get('Complainant Name', '').strip()
    addr = r.get('Complainant Address', '').strip()
    
    loss_bucket = "ABOVE 10L" if lost_amt >= 1000000 else "BELOW 10L"
    
    rec = {
        "sl_no": idx,
        "petition_date": pet_date,
        "ps_name": ps_name,
        "circle_name": circle_name,
        "sub_division": sub_div,
        "portal_type": "NCRP",
        "ack_no": ack,
        "complainant_name": name,
        "complainant_phone": phone,
        "victim_age": "",
        "complainant_address": addr,
        "category": cat,
        "sub_category": subcat,
        "lost_amount": round(lost_amt, 2),
        "hold_amount": 0,
        "refund_amount": 0,
        "status": status,
        "mo": mo,
        "action_taken": f"{status} on {last_action}" if last_action else status,
        "date_of_action": date_of_action,
        "fir_number": "",
        "court_memo_filed": "No",
        "court_order_obtained": "No",
        "remarks": cai,
        "no_of_days": 0,
        "timeline_status": timeline,
        "loss_bucket": loss_bucket,
        "hold_bucket": "No Hold",
        "year": 2020,
        "id": idx,
        "updated_by": None,
        "updated_at": "2020-12-31 00:00:00",
        "created_at": "2020-12-31 00:00:00"
    }
    petitions_2020.append(rec)

print(f"Total processed petitions: {len(petitions_2020)}")
tot_lost = sum(p['lost_amount'] for p in petitions_2020)
print(f"Total Lost Amount in 2020: Rs. {tot_lost:,.2f}")
status_counts = {}
for p in petitions_2020:
    status_counts[p['status']] = status_counts.get(p['status'], 0) + 1
print("Status Breakdown:", status_counts)

with open('data/petitions_2020.json', 'w', encoding='utf-8') as f:
    json.dump(petitions_2020, f, indent=2, ensure_ascii=False)

with open('public/data/petitions_2020.json', 'w', encoding='utf-8') as f:
    json.dump(petitions_2020, f, indent=2, ensure_ascii=False)

print("Saved to data/petitions_2020.json and public/data/petitions_2020.json")
