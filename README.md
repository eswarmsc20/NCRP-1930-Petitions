# 🛡️ Srikakulam District Police - NCRP & 1930 Management Portal
### శ్రీకాకుళం జిల్లా పోలీస్ - జాతీయ సైబర్ క్రైమ్ రిపోర్టింగ్ పోర్టల్ (NCRP) పిటిషన్ల నిర్వహణ వెబ్ అప్లికేషన్

[![Node.js](https://img.shields.io/badge/Node.js-18%2B%20%7C%2020%2B%20%7C%2026%2B-brightgreen)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-SQLite%20(Native)-blue)](https://www.sqlite.org/)
[![Architecture](https://img.shields.io/badge/Dependencies-Zero%20External-gold)](#)
[![Status](https://img.shields.io/badge/District-Srikakulam%2C%20AP-navy)](#)

---

## 🇮🇳 ప్రాజెక్ట్ వివరణ (Project Overview)

శ్రీకాకుళం జిల్లా పోలీస్ శాఖ పరిధిలోని **36 పోలీస్ స్టేషన్లలో** నేషనల్ సైబర్ క్రైమ్ రిపోర్టింగ్ పోర్టల్ (**NCRP**) మరియు **1930 సైబర్ హెల్ప్‌లైన్** ద్వారా నమోదైన సైబర్ మోసాల ఫిర్యాదులు/పిటిషన్లను సమర్థవంతంగా పరిశీలించి, చర్యలు నమోదు చేయడానికి రూపొందించబడిన ఆధునిక డైనమిక్ వెబ్ అప్లికేషన్.

ఈ అప్లికేషన్‌లో గూగుల్ స్ప్రెడ్‌షీట్ నుండి సేకరించిన **1,885 అసలైన పిటిషన్లు** (మొత్తం నష్టం: **₹10.43 కోట్లు**, బ్యాంక్ ఖాతాలలో నిలిపివేసిన మొత్తం: **₹1.56 కోట్లు**) ఉన్నాయి.

---

## ✨ ప్రధాన ఫీచర్లు (Key Features)

1. **స్టేషన్ వారీ లాగిన్ (Role-Based Station Authentication)**:
   - జిల్లాలోని ప్రతి పోలీస్ స్టేషన్‌కు ప్రత్యేక యూజర్ ఐడీ మరియు పాస్‌వర్డ్ ఇవ్వబడ్డాయి.
   - స్టేషన్ అధికారులు లాగిన్ అయినప్పుడు వారి స్టేషన్‌కు సంబంధించిన పిటిషన్లు మాత్రమే కనిపిస్తాయి.
   - స్టేషన్ అధికారులు పిటిషన్ చర్యలు (Action Taken), స్టేటస్ (Under Process / Closed / FIR Registered / Withdrawal), మోడస్ ఆపరాండీ (MO), ఎఫ్‌ఐఆర్ క్రైమ్ నంబర్, కోర్టు రీఫండ్ మెమో వివరాలు సవరించి సబ్మిట్ చేయవచ్చు.
2. **డిస్ట్రిక్ట్ అడ్మిన్ / DPO / సైబర్ క్రైమ్ PS డ్యాష్‌బోర్డ్**:
   - జిల్లా ఎస్పీ కార్యాలయం (DPO) మరియు సైబర్ క్రైమ్ పోలీస్ స్టేషన్ మొత్తం జిల్లాలోని 36 స్టేషన్ల పనితీరును ఒకే చోట పర్యవేక్షించవచ్చు.
   - సబ్-డివిజన్ మరియు సర్కిల్ వారీ ఫిల్టర్లు, స్టేషన్ల రీసెట్ పాస్‌వర్డ్ నిర్వహణ, ఆడిట్ లాగ్స్.
3. **లైవ్ డైనమిక్ రిపోర్ట్‌లు (Google Sheet Replicas)**:
   - **Abstract Report**: సబ్-డివిజన్ మరియు సర్కిల్ వారీ మొత్తం కేసులు, ఎఫ్‌ఐఆర్‌లు, క్లోజ్డ్, విచారణలో ఉన్నవి.
   - **Status of Hold & Refund**: స్తంభింపజేసిన (Hold) మొత్తం మరియు బాధితులకు రీఫండ్ చేసిన మొత్తం రిపోర్ట్.
   - **Modus Operandi (MO) Analytics**: జాబ్ ఫ్రాడ్, ఓటీపీ, సెక్స్‌టార్షన్, డిజిటల్ అరెస్ట్, లోన్ యాప్స్ తదితర నేరాల విశ్లేషణ.
   - **Timeline / Aging Report**: 90 రోజులకు పైగా పెండింగ్‌లో ఉన్న అత్యవసర కేసుల గుర్తింపు.
4. **జీరో-డిపెండెన్సీ ఆర్కిటెక్చర్ (Zero-Dependency & Lightning Fast)**:
   - బాహ్య `npm install` లైబ్రరీలపై ఆధారపడకుండా Node.js బిల్ట్-ఇన్ `node:sqlite`, `node:http`, `node:crypto` తో రూపొందించబడింది.
   - ఏ ఇంటర్నెట్ లేని లోకల్ పోలీస్ నెట్‌వర్క్‌లోనైనా కేవలం `node server.js` ద్వారా తక్షణమే పనిచేస్తుంది.
5. **డేటా ఎగుమతి & ప్రింటింగ్ (Export & Official Print)**:
   - ఒక్క క్లిక్‌తో ఎక్సెల్ / CSV డౌన్‌లోడ్ మరియు అధికారిక ప్రింట్ కాపీ.

---

## 🚀 త్వరిత ప్రారంభం (Quick Start)

### అవసరమైనవి:
- **Node.js** (v18, v20, v22, లేదా v26)

### రన్ చేసే విధానం:
```bash
# 1. రిపోజిటరీ ఫోల్డర్‌లోకి వెళ్లండి
cd /Users/cybercommando/Desktop/NCRP

# 2. వెబ్ సర్వర్‌ను ప్రారంభించండి
node server.js
```

ఇప్పుడు మీ బ్రౌజర్‌లో క్రింది లింక్ ఓపెన్ చేయండి:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 👥 యూజర్ ఖాతాలు & పాస్‌వర్డ్‌లు (Login Credentials)

### 1. అడ్మిన్ లాగిన్ (District Admin / DPO / Cyber Cell):
| Role / విభాగం | User ID (యూజర్ ఐడీ) | Default Password (పాస్‌వర్డ్) |
|---|---|---|
| **DPO / District Police Office Admin** | `admin` | `Admin@SklmNCRP2026!` |
| **District Cyber Crime PS** | `cybercell_sklm` | `Cyber@Sklm2026!` |

---

### 2. శ్రీకాకుళం సబ్-డివిజన్ పోలీస్ స్టేషన్లు (Srikakulam Sub-Division):
| S.No | పోలీస్ స్టేషన్ పేరు | User ID | Default Password | Circle |
|---|---|---|---|---|
| 1 | Srikakulam I Town | `srikakulam1town` | `srikakulam1town@skl26` | Srikakulam Rural Circle |
| 2 | Srikakulam Rural | `srikakulamrural` | `srikakulamrural@skl26` | Srikakulam Rural Circle |
| 3 | Gara | `gara` | `gara@skl26` | Srikakulam Rural Circle |
| 4 | Srikakulam II Town | `srikakulam2town` | `srikakulam2town@skl26` | Srikakulam II Town Circle |
| 5 | Amadalavalasa | `amadalavalasa` | `amadalavalasa@skl26` | Amadalavalasa Circle |
| 6 | Sarubujjili | `sarubujjili` | `sarubujjili@skl26` | Amadalavalasa Circle |
| 7 | Burja | `burja` | `burja@skl26` | Amadalavalasa Circle |
| 8 | Ponduru | `ponduru` | `ponduru@skl26` | Amadalavalasa Circle |
| 9 | J.R.Puram | `jrpuram` | `jrpuram@skl26` | J.R.Puram Circle |
| 10 | Etcherla | `etcherla` | `etcherla@skl26` | J.R.Puram Circle |
| 11 | Laveru | `laveru` | `laveru@skl26` | J.R.Puram Circle |
| 12 | G. Sigadam | `gsigadam` | `gsigadam@skl26` | J.R.Puram Circle |
| 35 | Mahila PS, Srikakulam | `mahilapssrikakulam` | `mahilapssrikakulam@skl26` | Mahila PS Circle |
| 36 | Srikakulam Traffic | `srikakulamtraffic` | `srikakulamtraffic@skl26` | Traffic Circle |

---

### 3. టెక్కలి సబ్-డివిజన్ పోలీస్ స్టేషన్లు (Tekkali Sub-Division):
| S.No | పోలీస్ స్టేషన్ పేరు | User ID | Default Password | Circle |
|---|---|---|---|---|
| 13 | Tekkali PS | `tekkalips` | `tekkalips@skl26` | Tekkali PS Circle |
| 14 | Kotabommali | `kotabommali` | `kotabommali@skl26` | Tekkali Rural Circle |
| 15 | Santhabommali | `santhabommali` | `santhabommali@skl26` | Tekkali Rural Circle |
| 16 | Naupada | `naupada` | `naupada@skl26` | Tekkali Rural Circle |
| 17 | Nandigam | `nandigam` | `nandigam@skl26` | Tekkali Rural Circle |
| 18 | Narasannapeta | `narasannapeta` | `narasannapeta@skl26` | Narasannapeta Circle |
| 19 | Jalumuru | `jalumuru` | `jalumuru@skl26` | Narasannapeta Circle |
| 20 | Polaki | `polaki` | `polaki@skl26` | Narasannapeta Circle |
| 21 | Saravakota | `saravakota` | `saravakota@skl26` | Narasannapeta Circle |
| 22 | Kothuru | `kothuru` | `kothuru@skl26` | Kothuru Circle |
| 23 | Hiramandalam | `hiramandalam` | `hiramandalam@skl26` | Kothuru Circle |
| 24 | Pathapatnam | `pathapatnam` | `pathapatnam@skl26` | Pathapatnam Circle |
| 25 | Meliaputti | `meliaputti` | `meliaputti@skl26` | Pathapatnam Circle |

---

### 4. కాశీబుగ్గ సబ్-డివిజన్ పోలీస్ స్టేషన్లు (Kasibugga Sub-Division):
| S.No | పోలీస్ స్టేషన్ పేరు | User ID | Default Password | Circle |
|---|---|---|---|---|
| 26 | Kasibugga | `kasibugga` | `kasibugga@skl26` | Kasibugga Circle |
| 27 | Vajrapukothuru | `vajrapukothuru` | `vajrapukothuru@skl26` | Kasibugga Rural Circle |
| 28 | Mandasa | `mandasa` | `mandasa@skl26` | Kasibugga Rural Circle |
| 29 | Sompeta | `sompeta` | `sompeta@skl26` | Sompeta Circle |
| 30 | Baruva | `baruva` | `baruva@skl26` | Sompeta Circle |
| 31 | Kanchili | `kanchili` | `kanchili@skl26` | Sompeta Circle |
| 32 | Itchapuram Town | `itchapuramtown` | `itchapuramtown@skl26` | Itchapuram Circle |
| 33 | Itchapuram Rural | `itchapuramrural` | `itchapuramrural@skl26` | Itchapuram Circle |
| 34 | Kaviti | `kaviti` | `kaviti@skl26` | Itchapuram Circle |

*(గమనిక: స్టేషన్ అధికారులు లాగిన్ అయిన తర్వాత వారి పాస్‌వర్డ్‌ను ఎగువ భాగంలోని **🔑 Password** బటన్ ద్వారా మార్చుకోవచ్చు).*

---

## 📂 ప్రాజెక్ట్ నిర్మాణం (Directory Structure)

```text
NCRP/
├── data/
│   └── ncrp.db             # SQLite డేటాబేస్ (1,885 పిటిషన్లు & 38 యూజర్లు)
├── public/
│   ├── index.html          # రెస్పాన్సివ్ సింగిల్ పేజ్ అప్లికేషన్ UI
│   ├── css/
│   │   └── style.css       # పోలీస్ బ్లూ & గోల్డ్ ప్రొఫెషనల్ థీమ్ స్టైలింగ్
│   └── js/
│       └── app.js          # డైనమిక్ క్లయింట్-సైడ్ ఇంజిన్ (చార్ట్‌లు, ఫిల్టర్లు, మోడల్స్)
├── scripts/
│   ├── seed_database.js    # స్ప్రెడ్‌షీట్ డేటాను ప్రాసెస్ చేసి DB నింపే స్క్రిప్ట్
│   ├── test_in_memory.js   # సర్వర్ మరియు API ల పూర్తి టెస్టింగ్ సూట్
│   └── test_server.js      # నెట్‌వర్క్ ఎండ్‌పాయింట్ టెస్టింగ్ స్క్రిప్ట్
├── server.js               # హై-పెర్ఫార్మెన్స్ జీరో-డిపెండెన్సీ వెబ్ సర్వర్ & REST API
├── package.json            # ప్రాజెక్ట్ కాన్ఫిగరేషన్
├── .gitignore              # గిట్ ఇగ్నోర్ రూల్స్
└── README.md               # ప్రాజెక్ట్ డాక్యుమెంటేషన్ (ఇంగ్లీష్ & తెలుగు)
```

---

## 🌐 GitHub లోకి అప్‌లోడ్ చేసే విధానం (How to Push to GitHub)

మీరు GitHub లో కొత్త రిపోజిటరీ క్రియేట్ చేసి క్రింది కమాండ్లను టెర్మినల్‌లో రన్ చేయండి:

```bash
# 1. రిపోజిటరీ ఫోల్డర్‌కు వెళ్లండి
cd /Users/cybercommando/Desktop/NCRP

# 2. గిట్ రిపోజిటరీ ప్రారంభించండి
git init

# 3. అన్ని ఫైల్స్‌ను స్టేజింగ్ చేయండి
git add .

# 4. మొదటి కమిట్ చేయండి
git commit -m "Initial commit: Srikakulam Police NCRP & 1930 Management Portal"

# 5. మీ గిట్‌హబ్ రిపోజిటరీ URL ను జతచేయండి
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>.git

# 6. మెయిన్ బ్రాంచ్‌గా సెట్ చేసి పుష్ చేయండి
git branch -M main
git push -u origin main
```

---

## 🛠️ పోర్టల్‌లో పిటిషన్ అప్‌డేట్ చేసే పద్ధతి (Step-by-Step Officer SOP)

1. పోలీస్ స్టేషన్ యూజర్ ఐడీ మరియు పాస్‌వర్డ్‌తో లాగిన్ అవ్వండి.
2. టేబుల్‌లో మీ స్టేషన్‌కు సంబంధించిన పిటిషన్‌ను గుర్తించండి (సెర్చ్ బార్‌లో ఎకనాలెడ్జ్‌మెంట్ నంబర్ లేదా బాధితుడి పేరు టైప్ చేయండి).
3. పిటిషన్ పక్కన ఉన్న **✏️ Edit Action** బటన్ క్లిక్ చేయండి.
4. ఫారమ్‌లో:
   - **Status**: విచారణలో ఉంటే `Under Process`, పరిష్కారమైతే `Closed`, క్రైమ్ రిజిస్టర్ అయితే `FIR Registered`, బాధితుడు వద్దంటే `Withdrawal` ఎంపిక చేయండి.
   - **Modus Operandi (MO)**: నేరం ఏ రకమైనదో ఎంపిక చేయండి (Job, OTP, Sextortion, Loan app, etc.).
   - **Action Taken by PS**: స్టేషన్ అధికారి చేసిన విచారణ వివరాలు నమోదు చేయండి.
   - **FIR Number**: ఎఫ్‌ఐఆర్ నమోదైతే క్రైమ్ నంబర్ (ఉదాహరణకు: `Cr.No. 41/2026 U/s 318(4) BNS`) నమోదు చేయండి.
   - **Court Memo Filed**: బాధితుడి సొమ్ము రికవరీ కోసం కోర్టులో 457 CrPC / 503 BNSS క్రింద మెమో ఫైల్ చేశారో లేదో తెలపండి.
5. **💾 Save & Submit Action** బటన్ నొక్కండి. తక్షణమే డేటాబేస్ అప్‌డేట్ అవుతుంది మరియు డిస్ట్రిక్ట్ అబ్‌స్ట్రాక్ట్ రిపోర్ట్‌లో లెక్కలు మారుతాయి.

---

## 📞 సాంకేతిక సహాయం (Technical Support)
**Cyber Crime Police Station, Srikakulam District Police**  
Government of Andhra Pradesh.
